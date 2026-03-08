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

  const trackView = useCallback(async (itemId: string, category: string) => {
    if (!user) return;
    await supabase.from("marketplace_views").insert({
      user_id: user.id,
      item_id: itemId,
      category,
    });
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
    // Auto-refresh recommendations after a view
    loadRecommendations();
  }, [user]);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      let preferredCategories: string[] = [];
      let userCity = "";

      // 1. Get sponsored item IDs
      const { data: campaigns } = await supabase
        .from("sponsored_campaigns")
        .select("item_id")
        .eq("status", "active");
      const sponsoredIds = new Set((campaigns || []).map((c: any) => c.item_id));

      // 2. Get user context
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("city")
          .eq("user_id", user.id)
          .single();
        userCity = profile?.city || "";

        const { data: views } = await supabase
          .from("marketplace_views")
          .select("category")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (views && views.length > 0) {
          const catCount = new Map<string, number>();
          for (const v of views) {
            if (v.category) catCount.set(v.category, (catCount.get(v.category) || 0) + 1);
          }
          preferredCategories = [...catCount.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat]) => cat);
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

      // Get seller names
      const userIds = [...new Set(allItems.map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

      // 4. Score with priority: sponsored > category > location > popularity
      const scored: RecommendedItem[] = allItems
        .filter((item: any) => !user || item.user_id !== user.id)
        .map((item: any) => {
          let score = 0;
          const isSponsored = sponsoredIds.has(item.id);

          // Priority 1: Sponsored (+100)
          if (isSponsored) score += 100;

          // Priority 2: Category match (+40 top category, +25 others)
          if (preferredCategories.length > 0) {
            const catIdx = preferredCategories.indexOf(item.category);
            if (catIdx === 0) score += 40;
            else if (catIdx > 0) score += 25;
          }

          // Priority 3: Location match (+30)
          if (userCity && item.city && item.city.toLowerCase() === userCity.toLowerCase()) {
            score += 30;
          }

          // Priority 4: Popularity (+up to 20)
          score += Math.min(20, (item.view_count || 0) * 2);

          // Bonus: recency
          const daysSince = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < 3) score += 8;
          else if (daysSince < 7) score += 4;

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

  // Initial load + auto-refresh every 60s
  useEffect(() => {
    loadRecommendations();
    refreshTimer.current = setInterval(loadRecommendations, 60_000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [loadRecommendations]);

  return { recommendations, loading, trackView, refresh: loadRecommendations };
};
