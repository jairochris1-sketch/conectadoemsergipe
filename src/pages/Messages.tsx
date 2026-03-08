import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import VerificationBadge from "@/components/VerificationBadge";
import { useBatchVerificationBadges, useVerificationBadge } from "@/hooks/useVerificationBadges";
import { useOnlineStatus, OnlineIndicator } from "@/hooks/usePresence";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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

  // Realtime subscription
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
            if (activeChat && (msg.sender_id === activeChat || msg.receiver_id === activeChat)) {
              setMessages((prev) => [...prev, msg]);
              // Mark as read if we're the receiver
              if (msg.receiver_id === user.id) {
                supabase.from("messages").update({ read: true }).eq("id", msg.id);
              }
            }
            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChat, loadConversations]);

  const sendMessage = async () => {
    if (!user || !activeChat || !newMessage.trim()) return;
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

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="bg-card border border-border">
          <div className="border-b border-border p-2">
            <h2 className="text-[14px] font-bold text-primary" style={{ fontFamily: "Georgia, serif" }}>
              {t("messages.title")}
            </h2>
          </div>

          <div className="flex" style={{ minHeight: "400px" }}>
            {/* Conversations sidebar */}
            <div className="w-[200px] border-r border-border overflow-y-auto" style={{ maxHeight: "500px" }}>
              {conversations.length === 0 ? (
                <p className="text-[11px] text-muted-foreground p-2">{t("messages.no_conversations")}</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.oderId}
                    onClick={() => setSearchParams({ with: conv.oderId })}
                    className={`w-full text-left p-2 border-b border-border cursor-pointer flex items-center gap-2 hover:bg-accent ${
                      activeChat === conv.oderId ? "bg-accent" : "bg-card"
                    }`}
                  >
                    <div className="relative w-[30px] h-[30px] bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {conv.otherPhoto ? (
                        <img src={conv.otherPhoto} alt={conv.otherName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8px] text-muted-foreground">👤</span>
                      )}
                      {onlineUsers.has(conv.oderId) && (
                        <span className="absolute -bottom-[1px] -right-[1px] w-[8px] h-[8px] rounded-full bg-green-500 border border-card" style={{ boxShadow: "0 0 3px rgba(34,197,94,0.6)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold truncate flex items-center gap-0">
                        {conv.otherName}
                        <VerificationBadge {...(badges.get(conv.oderId) || {})} />
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-[9px] px-1 rounded-full shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              {!activeChat ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[11px] text-muted-foreground">{t("messages.select_conversation")}</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  {chatPartner && (
                    <div className="border-b border-border p-2 flex items-center gap-2">
                      <div className="w-[24px] h-[24px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                        {chatPartner.photo ? (
                          <img src={chatPartner.photo} alt={chatPartner.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[8px]">👤</span>
                        )}
                      </div>
                      <div className="flex items-center gap-0">
                        <Link to={`/user/${activeChat}`} className="text-[12px] font-bold text-primary hover:underline">
                          {chatPartner.name}
                        </Link>
                        <VerificationBadge {...activeChatBadge} />
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ maxHeight: "380px" }}>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] px-2 py-1 text-[11px] ${
                            msg.sender_id === user.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent text-foreground border border-border"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[8px] mt-1 ${msg.sender_id === user.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatTime(msg.created_at)}
                            {msg.sender_id === user.id && (
                              <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-border p-2 flex gap-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder={t("messages.placeholder")}
                      className="flex-1 border border-border p-1 text-[11px] bg-card"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90"
                    >
                      {t("messages.send")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Messages;
