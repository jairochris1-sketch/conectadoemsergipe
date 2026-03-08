import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BadgeInfo {
  verified: boolean;
  businessVerified: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

// Cache for badge info to avoid repeated queries
const badgeCache = new Map<string, BadgeInfo>();

export const useVerificationBadge = (userId: string | undefined) => {
  const [badge, setBadge] = useState<BadgeInfo>({ verified: false, businessVerified: false, isAdmin: false, isModerator: false });

  useEffect(() => {
    if (!userId) return;
    if (badgeCache.has(userId)) {
      setBadge(badgeCache.get(userId)!);
      return;
    }

    const fetch = async () => {
      const [profileRes, adminRes, modRes] = await Promise.all([
        supabase.from("profiles").select("verified, business_verified").eq("user_id", userId).single() as any,
        (supabase.rpc as any)("has_role", { _user_id: userId, _role: "admin" }),
        (supabase.rpc as any)("has_role", { _user_id: userId, _role: "moderator" }),
      ]);

      const info: BadgeInfo = {
        verified: profileRes.data?.verified ?? false,
        businessVerified: profileRes.data?.business_verified ?? false,
        isAdmin: !!adminRes.data,
        isModerator: !!modRes.data,
      };
      badgeCache.set(userId, info);
      setBadge(info);
    };
    fetch();
  }, [userId]);

  return badge;
};

// Batch fetch badges for multiple users
export const useBatchVerificationBadges = (userIds: string[]) => {
  const [badges, setBadges] = useState<Map<string, BadgeInfo>>(new Map());

  useEffect(() => {
    if (userIds.length === 0) return;

    const uncachedIds = userIds.filter(id => !badgeCache.has(id));
    const cached = new Map<string, BadgeInfo>();
    userIds.forEach(id => {
      if (badgeCache.has(id)) cached.set(id, badgeCache.get(id)!);
    });

    if (uncachedIds.length === 0) {
      setBadges(cached);
      return;
    }

    const fetch = async () => {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, verified, business_verified").in("user_id", uncachedIds) as any,
        supabase.from("user_roles").select("user_id, role").in("user_id", uncachedIds) as any,
      ]);

      const adminSet = new Set((rolesRes.data || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
      const modSet = new Set((rolesRes.data || []).filter((r: any) => r.role === "moderator").map((r: any) => r.user_id));
      const result = new Map(cached);

      (profileRes.data || []).forEach((p: any) => {
        const info: BadgeInfo = {
          verified: p.verified ?? false,
          businessVerified: p.business_verified ?? false,
          isAdmin: adminSet.has(p.user_id),
          isModerator: modSet.has(p.user_id),
        };
        badgeCache.set(p.user_id, info);
        result.set(p.user_id, info);
      });

      uncachedIds.forEach(id => {
        if (!result.has(id)) {
          const info: BadgeInfo = { verified: false, businessVerified: false, isAdmin: adminSet.has(id), isModerator: modSet.has(id) };
          badgeCache.set(id, info);
          result.set(id, info);
        }
      });

      setBadges(result);
    };
    fetch();
  }, [userIds.join(",")]);

  return badges;
};

export const clearBadgeCache = (userId?: string) => {
  if (userId) badgeCache.delete(userId);
  else badgeCache.clear();
};
