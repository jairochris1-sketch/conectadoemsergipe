import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import VerificationBadge from "@/components/VerificationBadge";
import { useVerificationBadge } from "@/hooks/useVerificationBadges";
import { useOnlineStatus } from "@/hooks/usePresence";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Props {
  partnerId: string;
  partnerName: string;
  partnerPhoto: string;
  onClose: () => void;
  index: number;
}

const FloatingChatWindow = ({ partnerId, partnerName, partnerPhoto, onClose, index }: Props) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isFriend } = useSocial();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const badge = useVerificationBadge(partnerId);
  const onlineUsers = useOnlineStatus([partnerId]);
  const isOnline = onlineUsers.has(partnerId);
  const canMessage = isFriend(partnerId);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(50);
    setMessages(data || []);

    // Mark as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", partnerId)
      .eq("receiver_id", user.id)
      .eq("read", false);
    setUnreadCount(0);
  }, [user, partnerId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { scrollToBottom(); }, [messages, minimized]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`floating-chat-${partnerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        const isRelevant = (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
                           (msg.sender_id === partnerId && msg.receiver_id === user.id);
        if (!isRelevant) return;
        setMessages(prev => [...prev, msg]);
        if (msg.sender_id === partnerId) {
          if (minimized) {
            setUnreadCount(c => c + 1);
          } else {
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updated = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, read: updated.read } : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, partnerId, minimized]);

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || !canMessage) return;
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: newMessage.trim(),
    });
    setNewMessage("");
    inputRef.current?.focus();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const handleToggleMinimize = () => {
    if (minimized) {
      setUnreadCount(0);
      // Mark unread as read when expanding
      if (user) {
        supabase.from("messages").update({ read: true })
          .eq("sender_id", partnerId)
          .eq("receiver_id", user.id)
          .eq("read", false);
      }
    }
    setMinimized(!minimized);
  };

  // Position: stack from right, each chat 320px wide + 8px gap
  const rightOffset = 280 + index * 328;

  return (
    <div
      className="fixed bottom-0 z-50 animate-scale-in"
      style={{ right: `${rightOffset}px`, width: "320px" }}
    >
      {/* Header - always visible */}
      <div
        onClick={handleToggleMinimize}
        className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground cursor-pointer rounded-t-lg shadow-lg hover:brightness-110 transition-all"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary-foreground/20 shrink-0">
          {partnerPhoto ? (
            <img src={partnerPhoto} alt={partnerName} className="w-full h-full object-cover" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-xs">👤</span>
          )}
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold truncate">{partnerName}</span>
            <VerificationBadge {...badge} />
          </div>
          {isOnline && <span className="text-[10px] opacity-80">online</span>}
        </div>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleMinimize(); }}
            className="text-primary-foreground/80 hover:text-primary-foreground text-lg leading-none"
          >
            {minimized ? "▲" : "▼"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-primary-foreground/80 hover:text-primary-foreground text-lg leading-none"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Chat body */}
      {!minimized && (
        <div className="bg-card border border-t-0 border-border shadow-2xl flex flex-col rounded-b-none" style={{ height: "350px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                {t("messages.no_conversations") || "Nenhuma mensagem ainda..."}
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-1.5 animate-fade-in ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
              >
                {msg.sender_id !== user?.id && (
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-muted shrink-0">
                    {partnerPhoto ? (
                      <img src={partnerPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-[8px]">👤</span>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3 py-1.5 text-xs rounded-2xl ${
                    msg.sender_id === user?.id
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-accent text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <p className={`text-[9px] mt-0.5 ${msg.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatTime(msg.created_at)}
                    {msg.sender_id === user?.id && (
                      <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {canMessage ? (
            <div className="border-t border-border p-2 flex gap-2 items-center bg-card">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={t("messages.placeholder") || "Digite..."}
                className="flex-1 border border-border px-3 py-2 text-xs bg-background rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer hover:brightness-110 disabled:opacity-40 transition-all shrink-0"
              >
                ➤
              </button>
            </div>
          ) : (
            <div className="border-t border-border p-2 text-center bg-card">
              <p className="text-[10px] text-muted-foreground">
                ⚠ {t("messages.friends_only") || "Apenas amigos podem trocar mensagens."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingChatWindow;
