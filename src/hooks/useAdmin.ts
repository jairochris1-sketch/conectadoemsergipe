import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    (supabase.rpc as any)("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }: { data: boolean }) => setIsAdmin(!!data));
  }, [user]);

  const deletePost = async (postId: string) => {
    if (!isAdmin) return;
    await supabase.from("posts").delete().eq("id", postId);
  };

  const banUser = async (userId: string, reason: string, days: number) => {
    if (!isAdmin || !user) return;
    const bannedUntil = new Date();
    bannedUntil.setDate(bannedUntil.getDate() + days);
    await supabase.from("bans").insert({
      user_id: userId,
      banned_by: user.id,
      reason,
      banned_until: bannedUntil.toISOString(),
    });
  };

  const unbanUser = async (banId: string) => {
    if (!isAdmin) return;
    await supabase.from("bans").delete().eq("id", banId);
  };

  const getActiveBans = async () => {
    const { data } = await supabase
      .from("bans")
      .select("*")
      .gte("banned_until", new Date().toISOString());
    return data || [];
  };

  return { isAdmin, deletePost, banUser, unbanUser, getActiveBans };
};
