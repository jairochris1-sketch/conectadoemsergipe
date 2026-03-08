import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import VerificationBadge from "@/components/VerificationBadge";
import { useBatchVerificationBadges, useVerificationBadge } from "@/hooks/useVerificationBadges";
import { useOnlineStatus } from "@/hooks/usePresence";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  oderId: string;
  otherName: string;
  otherPhoto: string;
  lastMessage: string;
  lastTime: Date;
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const Messages = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isFriend } = useSocial();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChat = searchParams.get("with");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatPartner, setChatPartner] = useState<{ name: string; photo: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationUserIds = useMemo(() => conversations.map(c => c.oderId), [conversations]);
  const badges = useBatchVerificationBadges(conversationUserIds);
  const onlineUsers = useOnlineStatus(conversationUserIds);
  const activeChatBadge = useVerificationBadge(activeChat || undefined);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!data) return;

    // Group by conversation partner
    const convMap = new Map<string, { msgs: Message[] }>();
    for (const msg of data) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(otherId)) convMap.set(otherId, { msgs: [] });
      convMap.get(otherId)!.msgs.push(msg);
    }

    const otherIds = [...convMap.keys()];
    if (otherIds.length === 0) {
      setConversations([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url")
      .in("user_id", otherIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const convs: Conversation[] = otherIds.map((otherId) => {
      const { msgs } = convMap.get(otherId)!;
      const profile = profileMap.get(otherId);
      const unread = msgs.filter((m) => m.receiver_id === user.id && !m.read).length;
      return {
        oderId: otherId,
        otherName: profile?.name || "User",
        otherPhoto: profile?.photo_url || "",
        lastMessage: msgs[0].content,
        lastTime: new Date(msgs[0].created_at),
        unreadCount: unread,
      };
    });

    convs.sort((a, b) => b.lastTime.getTime() - a.lastTime.getTime());
    setConversations(convs);
  }, [user]);

  // Load messages for active chat
  const loadMessages = useCallback(async () => {
    if (!user || !activeChat) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${activeChat}),and(sender_id.eq.${activeChat},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    setMessages(data || []);

    // Mark unread as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", activeChat)
      .eq("receiver_id", user.id)
      .eq("read", false);

    // Load partner info
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, photo_url")
      .eq("user_id", activeChat)
      .single();

    setChatPartner(profile ? { name: profile.name, photo: profile.photo_url || "" } : null);
  }, [user, activeChat]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sound for new messages
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    notificationSound.current = new Audio("/sounds/new-message.mp3");
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      if (notificationSound.current) {
        notificationSound.current.currentTime = 0;
        notificationSound.current.play().catch(() => {});
      }
    } catch {}
  }, []);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            // Play sound only for incoming messages
            if (msg.receiver_id === user.id) {
              playNotificationSound();
            }
            if (activeChat && (msg.sender_id === activeChat || msg.receiver_id === activeChat)) {
              setMessages((prev) => [...prev, msg]);
              if (msg.receiver_id === user.id) {
                supabase.from("messages").update({ read: true }).eq("id", msg.id);
              }
            }
            loadConversations();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, read: updated.read } : m))
          );
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChat, loadConversations, playNotificationSound]);

  const canMessage = activeChat ? isFriend(activeChat) : false;

  const sendMessage = async () => {
    if (!user || !activeChat || !newMessage.trim() || !canMessage) return;
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: activeChat,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) return <Navigate to="/login" />;

  const ConversationItem = ({ conv, isActive }: { conv: Conversation; isActive?: boolean }) => (
    <button
      onClick={() => setSearchParams({ with: conv.oderId })}
      className={`w-full text-left p-[6px] border-b border-border cursor-pointer flex items-center gap-2 hover:bg-accent ${isActive ? "bg-accent" : "bg-card"}`}
    >
      <div className="relative w-[32px] h-[32px] bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
        {conv.otherPhoto ? (
          <img src={conv.otherPhoto} alt={conv.otherName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[8px] text-muted-foreground">👤</span>
        )}
        {onlineUsers.has(conv.oderId) && (
          <span className="absolute -bottom-[1px] -right-[1px] w-[8px] h-[8px] rounded-full bg-green-500 border border-card" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold truncate flex items-center gap-0.5">
          {conv.otherName}
          <VerificationBadge {...(badges.get(conv.oderId) || {})} />
        </p>
        <p className="text-[10px] text-muted-foreground truncate">{conv.lastMessage}</p>
      </div>
      {conv.unreadCount > 0 && (
        <span className="bg-destructive text-destructive-foreground text-[9px] px-1.5 rounded-full shrink-0 font-bold">
          {conv.unreadCount}
        </span>
      )}
    </button>
  );

  const ChatHeader = () => (
    chatPartner ? (
      <div className="fb-box-header flex items-center gap-2">
        <button onClick={() => setSearchParams({})} className="text-[11px] text-muted-foreground hover:text-foreground sm:hidden">← </button>
        <div className="relative w-[28px] h-[28px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
          {chatPartner.photo ? (
            <img src={chatPartner.photo} alt={chatPartner.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[8px]">👤</span>
          )}
          {activeChat && onlineUsers.has(activeChat) && (
            <span className="absolute -bottom-[1px] -right-[1px] w-[7px] h-[7px] rounded-full bg-green-500 border border-card" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link to={`/user/${activeChat}`} className="text-[11px] font-bold hover:underline">
            {chatPartner.name}
          </Link>
          <VerificationBadge {...activeChatBadge} />
          {activeChat && onlineUsers.has(activeChat) && (
            <span className="text-[9px] text-green-600 font-bold">online</span>
          )}
        </div>
      </div>
    ) : null
  );

  const MessageBubble = ({ msg }: { msg: Message }) => (
    <div className={`flex items-end gap-1.5 ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}>
      {msg.sender_id !== user.id && (
        <div className="w-[24px] h-[24px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
          {chatPartner?.photo ? (
            <img src={chatPartner.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[8px]">👤</span>
          )}
        </div>
      )}
      <div className={`max-w-[70%] px-2 py-1 text-[11px] ${
        msg.sender_id === user.id
          ? "bg-primary text-primary-foreground"
          : "bg-accent text-foreground border border-border"
      }`}>
        <p className="break-words">{msg.content}</p>
        <p className={`text-[9px] mt-0.5 ${msg.sender_id === user.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {formatTime(msg.created_at)}
          {msg.sender_id === user.id && <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>}
        </p>
      </div>
    </div>
  );

  const ChatInput = () => (
    canMessage ? (
      <div className="border-t border-border p-[6px] flex gap-1 bg-card">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={t("messages.placeholder")}
          className="flex-1 border border-border px-2 py-[3px] text-[11px] bg-card"
        />
        <button
          onClick={sendMessage}
          className="bg-primary text-primary-foreground border-none px-3 py-[3px] text-[11px] cursor-pointer font-bold hover:opacity-90"
        >
          {t("messages.send")}
        </button>
      </div>
    ) : (
      <div className="border-t border-border p-2 text-center bg-accent">
        <p className="text-[11px] text-muted-foreground">
          ⚠ {t("messages.friends_only") || "Apenas amigos podem trocar mensagens."}
        </p>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Mensagens" description="Converse com seus amigos no Conectados em Sergipe." path="/messages" />
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />

      {activeChat ? (
        <>
          {/* Mobile: full screen chat */}
          <div className="flex-1 flex flex-col sm:hidden" style={{ height: 'calc(100dvh - 60px)' }}>
            <ChatHeader />
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-card">
              {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput />
          </div>

          {/* Desktop: sidebar + chat */}
          <div className="hidden sm:block max-w-[760px] mx-auto px-2 py-3 w-full">
            <div className="fb-box">
              <div className="fb-box-header">
                <span style={{ fontFamily: "Georgia, serif", fontSize: "13px" }}>{t("messages.title")}</span>
              </div>
              <div className="flex" style={{ minHeight: "420px" }}>
                <div className="w-[220px] border-r border-border overflow-y-auto" style={{ maxHeight: "500px" }}>
                  {conversations.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground p-3">{t("messages.no_conversations")}</p>
                  ) : (
                    conversations.map((conv) => (
                      <ConversationItem key={conv.oderId} conv={conv} isActive={activeChat === conv.oderId} />
                    ))
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <ChatHeader />
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5" style={{ maxHeight: "380px" }}>
                    {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
                    <div ref={messagesEndRef} />
                  </div>
                  <ChatInput />
                </div>
              </div>
            </div>
          </div>
          <div className="hidden sm:block"><FacebookFooter /></div>
        </>
      ) : (
        <>
          <div className="max-w-[760px] mx-auto px-2 py-3 w-full">
            <div className="fb-box">
              <div className="fb-box-header">
                <span style={{ fontFamily: "Georgia, serif", fontSize: "13px" }}>{t("messages.title")}</span>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "500px" }}>
                {conversations.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground p-3">{t("messages.no_conversations")}</p>
                ) : (
                  conversations.map((conv) => (
                    <ConversationItem key={conv.oderId} conv={conv} />
                  ))
                )}
              </div>
            </div>
          </div>
          <FacebookFooter />
        </>
      )}
    </div>
  );
};

export default Messages;
