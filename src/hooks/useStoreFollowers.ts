import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useStoreFollowers = (storeId?: string) => {
  const { user } = useAuth();
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const refresh = useCallback(async () => {
    if (!storeId) return;

    const { count } = await supabase
      .from("store_followers")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId);
    setFollowerCount(count || 0);

    if (user) {
      const { count: myCount } = await supabase
        .from("store_followers")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("user_id", user.id);
      setIsFollowing((myCount || 0) > 0);
    }
  }, [storeId, user]);

  useEffect(() => { refresh(); }, [refresh]);

  const follow = async () => {
    if (!user || !storeId) return;
    await supabase.from("store_followers").insert({ store_id: storeId, user_id: user.id } as any);
    setIsFollowing(true);
    setFollowerCount((c) => c + 1);
  };

  const unfollow = async () => {
    if (!user || !storeId) return;
    await supabase.from("store_followers").delete().eq("store_id", storeId).eq("user_id", user.id);
    setIsFollowing(false);
    setFollowerCount((c) => Math.max(0, c - 1));
  };

  return { followerCount, isFollowing, follow, unfollow, refresh };
};

export const useFollowedStores = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      const { data: follows } = await supabase
        .from("store_followers")
        .select("store_id")
        .eq("user_id", user.id);

      if (!follows || follows.length === 0) { setStores([]); setLoading(false); return; }

      const storeIds = follows.map((f: any) => f.store_id);
      const { data } = await supabase
        .from("stores")
        .select("*")
        .in("id", storeIds)
        .eq("is_active", true);

      setStores(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return { stores, loading };
};
