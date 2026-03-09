import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const NOTIFICATION_ICON = "/favicon.ico";

/** Request permission once the user is logged in */
const requestPermission = async () => {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
};

const showNotification = (title: string, body: string, url?: string) => {
  if (Notification.permission !== "granted") return;
  // Don't notify if the tab is focused
  if (document.visibilityState === "visible") return;

  const notification = new Notification(title, {
    body,
    icon: NOTIFICATION_ICON,
    tag: `${title}-${Date.now()}`,
  });

  if (url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = url;
      notification.close();
    };
  }
};

/**
 * Hook that listens for new messages and friend requests
 * and shows browser push notifications.
 * Mount once at app level.
 */
export const useBrowserNotifications = () => {
  const { user } = useAuth();
  const profileCacheRef = useRef<Map<string, string>>(new Map());

  const getProfileName = useCallback(async (userId: string): Promise<string> => {
    if (profileCacheRef.current.has(userId)) {
      return profileCacheRef.current.get(userId)!;
    }
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", userId)
      .single();
    const name = data?.name || "Alguém";
    profileCacheRef.current.set(userId, name);
    return name;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Request permission on mount
    requestPermission();

    // Listen for new messages
    const msgChannel = supabase
      .channel("notif-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as any;
          // Only notify if we're the receiver
          if (msg.receiver_id !== user.id) return;
          // Don't notify for own messages
          if (msg.sender_id === user.id) return;

          const senderName = await getProfileName(msg.sender_id);
          showNotification(
            `💬 Nova mensagem de ${senderName}`,
            msg.content?.substring(0, 100) || "Nova mensagem",
            `/messages?with=${msg.sender_id}`
          );
        }
      )
      .subscribe();

    // Listen for friend requests
    const friendChannel = supabase
      .channel("notif-friendships")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "friendships" },
        async (payload) => {
          const friendship = payload.new as any;
          if (friendship.addressee_id !== user.id) return;

          const requesterName = await getProfileName(friendship.requester_id);
          showNotification(
            `👥 Solicitação de amizade`,
            `${requesterName} quer ser seu amigo(a)`,
            `/user/${friendship.requester_id}`
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "friendships" },
        async (payload) => {
          const friendship = payload.new as any;
          if (friendship.status === "accepted" && friendship.requester_id === user.id) {
            const addresseeName = await getProfileName(friendship.addressee_id);
            showNotification(
              `🎉 Amizade aceita!`,
              `${addresseeName} aceitou sua solicitação de amizade`,
              `/user/${friendship.addressee_id}`
            );
          }
        }
      )
      .subscribe();

    // Listen for new store products from followed stores
    const storeProductChannel = supabase
      .channel("notif-store-products")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "store_products" },
        async (payload) => {
          const product = payload.new as any;
          // Don't notify for own products
          if (product.user_id === user.id) return;

          // Check if user follows this store
          const { count } = await supabase
            .from("store_followers")
            .select("*", { count: "exact", head: true })
            .eq("store_id", product.store_id)
            .eq("user_id", user.id);

          if (!count || count === 0) return;

          // Get store name
          const { data: store } = await supabase
            .from("stores")
            .select("name, slug")
            .eq("id", product.store_id)
            .single();

          const storeName = store?.name || "Uma loja";
          const price = parseFloat(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

          showNotification(
            `🛍️ Novo produto em ${storeName}`,
            `${product.title} — ${price}`,
            `/produto/${product.id}`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(friendChannel);
      supabase.removeChannel(storeProductChannel);
    };
  }, [user?.id, getProfileName]);
};
