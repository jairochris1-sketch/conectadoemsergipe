import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("read", false);
    setUnreadCount(count || 0);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("unread-notif")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  return { unreadCount, refresh };
};
