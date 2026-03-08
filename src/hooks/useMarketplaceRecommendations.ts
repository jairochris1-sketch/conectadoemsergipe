import { useCallback, useState, useEffect } from "react";
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
}

export const useMarketplaceRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const trackView = useCallback(async (itemId: string, category: string) => {
    if (!user) return;
    // Insert view record
    await supabase.from("marketplace_views").insert({
      user_id: user.id,
      item_id: itemId,
      category,
    });
    // Increment view_count on the item
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
  }, [user]);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // Get user's preferred categories from view history
      let preferredCategories: string[] = [];
      let userCity = "";

      if (user) {
        // Get user's city from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("city")
          .eq("user_id", user.id)
          .single();
        userCity = profile?.city || "";

        // Get top viewed categories
        const { data: views } = await supabase
          .from("marketplace_views")
          .select("category, item_id")
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

      // Fetch all items for scoring
      const { data: allItems } = await supabase
        .from("marketplace_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!allItems || allItems.length === 0) {
        setRecommendations([]);
        return;
      }

      // Get viewed item IDs to avoid recommending already-viewed
      let viewedIds = new Set<string>();
      if (user) {
        const { data: viewedData } = await supabase
          .from("marketplace_views")
          .select("item_id")
          .eq("user_id", user.id);
        viewedIds = new Set((viewedData || []).map((v) => v.item_id));
      }

      // Get seller names
      const userIds = [...new Set(allItems.map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

      // Score each item
      const scored: RecommendedItem[] = allItems
        .filter((item: any) => !user || item.user_id !== user.id) // exclude own items
        .map((item: any) => {
          let score = 0;

          // Category match: +30
          if (preferredCategories.includes(item.category)) {
            score += 30 + (preferredCategories.indexOf(item.category) === 0 ? 15 : 0);
          }

          // City match: +25
          if (userCity && item.city && item.city.toLowerCase() === userCity.toLowerCase()) {
            score += 25;
          }

          // Popularity: up to +20
          score += Math.min(20, (item.view_count || 0) * 2);

          // Recency: +10 if posted in last 3 days
          const daysSince = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < 3) score += 10;
          else if (daysSince < 7) score += 5;

          // Not yet viewed: small bonus
          if (!viewedIds.has(item.id)) score += 5;

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
          };
        });

      scored.sort((a, b) => b.score - a.score);
      setRecommendations(scored.slice(0, 6));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadRecommendations(); }, [loadRecommendations]);

  return { recommendations, loading, trackView, refresh: loadRecommendations };
};
