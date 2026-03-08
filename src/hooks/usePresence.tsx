import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const HEARTBEAT_INTERVAL = 15_000; // 15 seconds
const OFFLINE_THRESHOLD = 45_000; // 45 seconds (3x heartbeat)

/**
 * Updates the current user's last_seen_at timestamp.
 * Uses upsert to insert on first call or update on subsequent calls.
 */
const updateUserActivity = async (userId: string) => {
  await supabase.from("user_presence" as any).upsert(
    { user_id: userId, last_seen_at: new Date().toISOString(), is_online: true } as any,
    { onConflict: "user_id" }
  );
};

/**
 * Marks the user as offline.
 */
const setUserOffline = async (userId: string) => {
  await supabase
    .from("user_presence" as any)
    .update({ is_online: false } as any)
    .eq("user_id", userId);
};

/**
 * Fetches a set of user IDs that are currently online (last_seen_at within threshold).
 */
const getOnlineUsers = async (userIds: string[]): Promise<Set<string>> => {
  if (userIds.length === 0) return new Set();
  const threshold = new Date(Date.now() - OFFLINE_THRESHOLD).toISOString();
  const { data } = await supabase
    .from("user_presence" as any)
    .select("user_id")
    .in("user_id", userIds)
    .eq("is_online", true)
    .gte("last_seen_at", threshold);
  return new Set((data || []).map((r: any) => r.user_id));
};

/**
 * Hook that runs heartbeat for the current user (updates activity every 30s).
 * Should be mounted once at the app level.
 */
export const usePresenceHeartbeat = () => {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Cache token for beforeunload
    supabase.auth.getSession().then(({ data: { session } }) => {
      tokenRef.current = session?.access_token || null;
    });

    // Initial ping
    updateUserActivity(user.id);

    // Heartbeat
    intervalRef.current = setInterval(() => {
      updateUserActivity(user.id);
    }, HEARTBEAT_INTERVAL);

    // On page visibility change
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        updateUserActivity(user.id);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // On beforeunload, mark offline using cached token (sync-friendly)
    const handleUnload = () => {
      const token = tokenRef.current || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${user.id}`;
      const headers = {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${token}`,
        "Prefer": "return=minimal",
      };
      fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_online: false }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      setUserOffline(user.id);
    };
  }, [user?.id]);
};

/**
 * Hook to track online status of a set of user IDs.
 * Polls every 30s and listens to realtime changes.
 */
export const useOnlineStatus = (userIds: string[]) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const stableKey = userIds.join(",");

  const refresh = useCallback(async () => {
    if (userIds.length === 0) return;
    const online = await getOnlineUsers(userIds);
    setOnlineUsers(online);
  }, [stableKey]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  // Realtime subscription for instant updates
  useEffect(() => {
    if (userIds.length === 0) return;

    const channel = supabase
      .channel("presence-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_presence" },
        (payload) => {
          const record = (payload.new || payload.old) as any;
          if (!record?.user_id || !userIds.includes(record.user_id)) return;
          setOnlineUsers(prev => {
            const next = new Set(prev);
            if (record.is_online) next.add(record.user_id);
            else next.delete(record.user_id);
            return next;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [stableKey]);

  return onlineUsers;
};

/**
 * Simple green dot component for online indicator.
 */
export const OnlineIndicator = ({ isOnline, size = "sm" }: { isOnline: boolean; size?: "sm" | "md" }) => {
  if (!isOnline) return null;
  const sizeClass = size === "sm" ? "w-[6px] h-[6px]" : "w-[8px] h-[8px]";
  return (
    <span
      className={`inline-block ${sizeClass} rounded-full bg-green-500 shrink-0`}
      style={{ boxShadow: "0 0 3px rgba(34,197,94,0.6)" }}
      title="Online"
    />
  );
};

export { updateUserActivity, setUserOffline, getOnlineUsers };
