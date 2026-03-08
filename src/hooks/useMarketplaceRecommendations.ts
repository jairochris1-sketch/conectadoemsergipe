import { useCallback, useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface RecommendedItem {
  id: string;
  title: string;
  price: string;
  description: string;
  seller: string;
  sellerId: string;
  category: string;
  city: string;
  imageUrl: string;
  score: number;
  isSponsored: boolean;
}

export const useMarketplaceRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval>>();
  const impressionTracker = useRef<Set<string>>(new Set());

  // Track a product impression (seen on screen)
  const trackImpression = useCallback(async (itemId: string, category: string) => {
    if (!user || impressionTracker.current.has(itemId)) return;
    impressionTracker.current.add(itemId);

    await supabase.from("marketplace_views").insert({
      user_id: user.id,
      item_id: itemId,
      category,
      interaction_type: "impression",
    });

    // Update sponsored campaign impressions
    const { data: camp } = await supabase
      .from("sponsored_campaigns")
      .select("id, impressions")
      .eq("item_id", itemId)
      .eq("status", "active")
      .maybeSingle();
    if (camp) {
      await supabase.from("sponsored_campaigns")
        .update({ impressions: camp.impressions + 1 })
        .eq("id", camp.id);
    }
  }, [user]);

  // Track a product click (user actively clicked)
  const trackClick = useCallback(async (itemId: string, category: string) => {
    if (!user) return;

    // Record click
    await supabase.from("marketplace_views").insert({
      user_id: user.id,
      item_id: itemId,
      category,
      interaction_type: "click",
    });

    // Increment item view_count
    const { data: item } = await supabase
      .from("marketplace_items")
      .select("view_count")
      .eq("id", itemId)
      .single();
    if (item) {
      await supabase
        .from("marketplace_items")
        .update({ view_count: (item.view_count || 0) + 1 })
        .eq("id", itemId);
    }

    // Update sponsored campaign clicks
    await supabase.rpc("increment_campaign_clicks" as any, { p_item_id: itemId }).catch(() => {});

    // Upsert category access count
    const { data: existing } = await supabase
      .from("category_access")
      .select("id, access_count")
      .eq("user_id", user.id)
      .eq("category", category)
      .single();

    if (existing) {
      await supabase
        .from("category_access")
        .update({ access_count: existing.access_count + 1, last_accessed_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("category_access")
        .insert({ user_id: user.id, category, access_count: 1 });
    }

    // Refresh after click
    loadRecommendations();
  }, [user]);

  // Track category filter access
  const trackCategoryFilter = useCallback(async (category: string) => {
    if (!user || category === "All") return;

    const { data: existing } = await supabase
      .from("category_access")
      .select("id, access_count")
      .eq("user_id", user.id)
      .eq("category", category)
      .single();

    if (existing) {
      await supabase
        .from("category_access")
        .update({ access_count: existing.access_count + 1, last_accessed_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("category_access")
        .insert({ user_id: user.id, category, access_count: 1 });
    }
  }, [user]);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      let rankedCategories: { category: string; weight: number }[] = [];
      let userCity = "";

      // 1. Sponsored items
      const { data: campaigns } = await supabase
        .from("sponsored_campaigns")
        .select("item_id")
        .eq("status", "active");
      const sponsoredIds = new Set((campaigns || []).map((c: any) => c.item_id));

      // 2. User context
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("city")
          .eq("user_id", user.id)
          .single();
        userCity = profile?.city || "";

        // Get category rankings from category_access (more accurate than raw views)
        const { data: catAccess } = await supabase
          .from("category_access")
          .select("category, access_count")
          .eq("user_id", user.id)
          .order("access_count", { ascending: false })
          .limit(5);

        if (catAccess && catAccess.length > 0) {
          const maxCount = catAccess[0].access_count;
          rankedCategories = catAccess.map((c: any) => ({
            category: c.category,
            weight: c.access_count / maxCount, // normalized 0-1
          }));
        }

        // Supplement with recent click data if no category_access yet
        if (rankedCategories.length === 0) {
          const { data: views } = await supabase
            .from("marketplace_views")
            .select("category")
            .eq("user_id", user.id)
            .eq("interaction_type", "click")
            .order("created_at", { ascending: false })
            .limit(30);

          if (views && views.length > 0) {
            const catCount = new Map<string, number>();
            for (const v of views) {
              if (v.category) catCount.set(v.category, (catCount.get(v.category) || 0) + 1);
            }
            const max = Math.max(...catCount.values());
            rankedCategories = [...catCount.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([cat, count]) => ({ category: cat, weight: count / max }));
          }
        }
      }

      // 3. Fetch items
      const { data: allItems } = await supabase
        .from("marketplace_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!allItems || allItems.length === 0) {
        setRecommendations([]);
        return;
      }

      // Get clicked items to boost diversity (avoid showing already-clicked)
      let clickedIds = new Set<string>();
      if (user) {
        const { data: clicked } = await supabase
          .from("marketplace_views")
          .select("item_id")
          .eq("user_id", user.id)
          .eq("interaction_type", "click");
        clickedIds = new Set((clicked || []).map((v) => v.item_id));
      }

      // Seller names
      const userIds = [...new Set(allItems.map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

      // 4. Score: sponsored > category interest > location > popularity
      const scored: RecommendedItem[] = allItems
        .filter((item: any) => !user || item.user_id !== user.id)
        .map((item: any) => {
          let score = 0;
          const isSponsored = sponsoredIds.has(item.id);

          // P1: Sponsored (+100)
          if (isSponsored) score += 100;

          // P2: Category interest (weighted, up to +50)
          const catMatch = rankedCategories.find((c) => c.category === item.category);
          if (catMatch) score += Math.round(50 * catMatch.weight);

          // P3: Location (+30)
          if (userCity && item.city && item.city.toLowerCase() === userCity.toLowerCase()) {
            score += 30;
          }

          // P4: Popularity (up to +20)
          score += Math.min(20, (item.view_count || 0) * 2);

          // Bonus: recency
          const daysSince = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < 3) score += 8;
          else if (daysSince < 7) score += 4;

          // Diversity: penalize already-clicked items slightly
          if (clickedIds.has(item.id)) score -= 10;

          return {
            id: item.id,
            title: item.title,
            price: item.price,
            description: item.description || "",
            seller: profileMap.get(item.user_id) || "Usuário",
            sellerId: item.user_id,
            category: item.category,
            city: item.city || "",
            imageUrl: item.image_url || "",
            score,
            isSponsored,
          };
        });

      scored.sort((a, b) => b.score - a.score);
      setRecommendations(scored.slice(0, 8));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-refresh every 60s
  useEffect(() => {
    loadRecommendations();
    refreshTimer.current = setInterval(loadRecommendations, 60_000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [loadRecommendations]);

  // Reset impression tracker on mount
  useEffect(() => {
    impressionTracker.current.clear();
  }, []);

  return {
    recommendations,
    loading,
    trackView: trackClick, // backward compat
    trackClick,
    trackImpression,
    trackCategoryFilter,
    refresh: loadRecommendations,
  };
};
