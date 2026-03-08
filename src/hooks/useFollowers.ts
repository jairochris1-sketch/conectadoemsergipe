import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useFollowers = (profileId?: string) => {
  const { user } = useAuth();
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const refresh = useCallback(async () => {
    if (!profileId) return;

    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", profileId),
      supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
    ]);

    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);

    if (user && user.id !== profileId) {
      const { count } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id)
        .eq("following_id", profileId);
      setIsFollowing((count || 0) > 0);
    }
  }, [profileId, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const follow = async () => {
    if (!user || !profileId) return;
    await supabase.from("followers").insert({ follower_id: user.id, following_id: profileId });
    setIsFollowing(true);
    setFollowerCount((c) => c + 1);
  };

  const unfollow = async () => {
    if (!user || !profileId) return;
    await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", profileId);
    setIsFollowing(false);
    setFollowerCount((c) => Math.max(0, c - 1));
  };

  return { followerCount, followingCount, isFollowing, follow, unfollow, refresh };
};
