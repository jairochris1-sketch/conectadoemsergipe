import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import { useBatchVerificationBadges } from "@/hooks/useVerificationBadges";
import { useOnlineStatus } from "@/hooks/usePresence";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import VerificationBadge from "@/components/VerificationBadge";
import FloatingChatWindow from "@/components/FloatingChatWindow";
import { supabase } from "@/integrations/supabase/client";

interface OpenChat {
  id: string;
  name: string;
  photo: string;
}

const FloatingChatSystem = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getFriends } = useSocial();
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");

  const friends = getFriends();
  const friendIds = useMemo(() => friends.map(f => f.id), [friends]);
  const badges = useBatchVerificationBadges(friendIds);
  const onlineUsers = useOnlineStatus(friendIds);

  // Sort: online first, then alphabetical
  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const aOnline = onlineUsers.has(a.id) ? 1 : 0;
      const bOnline = onlineUsers.has(b.id) ? 1 : 0;
      if (bOnline !== aOnline) return bOnline - aOnline;
      return a.name.localeCompare(b.name);
    });
  }, [friends, onlineUsers]);

  const filteredFriends = useMemo(() => {
    if (!search.trim()) return sortedFriends;
    return sortedFriends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [sortedFriends, search]);

  const onlineCount = useMemo(() => friends.filter(f => onlineUsers.has(f.id)).length, [friends, onlineUsers]);

  const openChat = (friend: { id: string; name: string; photo: string }) => {
    if (openChats.find(c => c.id === friend.id)) return;
    // Max 3 chats open
    const chats = openChats.length >= 3
      ? [...openChats.slice(1), { id: friend.id, name: friend.name, photo: friend.photo }]
      : [...openChats, { id: friend.id, name: friend.name, photo: friend.photo }];
    setOpenChats(chats);
  };

  const closeChat = (id: string) => {
    setOpenChats(prev => prev.filter(c => c.id !== id));
  };

  // Listen for realtime incoming messages to auto-open chat notification
  const notificationSound = useMemo(() => {
    try { return new Audio("/sounds/new-message.mp3"); } catch { return null; }
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("floating-system-notify")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id === user.id && !openChats.find(c => c.id === msg.sender_id)) {
          // Play sound for messages not in open chats
          try { notificationSound?.play().catch(() => {}); } catch {}
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, openChats, notificationSound]);

  if (!user) return null;

  return (
    <>
      {/* Floating chat windows */}
      {openChats.map((chat, i) => (
        <FloatingChatWindow
          key={chat.id}
          partnerId={chat.id}
          partnerName={chat.name}
          partnerPhoto={chat.photo}
          onClose={() => closeChat(chat.id)}
          index={i}
        />
      ))}

      {/* Friends sidebar - fixed right */}
      <div className="fixed right-0 top-0 h-full z-40 hidden lg:flex flex-col" style={{ width: "260px" }}>
        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -left-8 top-16 bg-primary text-primary-foreground w-8 h-8 rounded-l-lg flex items-center justify-center text-xs cursor-pointer shadow-lg hover:brightness-110 transition-all"
        >
          {sidebarOpen ? "›" : "‹"}
        </button>

        <div
          className={`h-full bg-card/95 backdrop-blur-sm border-l border-border shadow-xl flex flex-col transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="p-3 border-b border-border bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                💬 Chat
                {onlineCount > 0 && (
                  <span className="text-[10px] font-normal text-green-500">
                    • {onlineCount} online
                  </span>
                )}
              </h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0.5"
                title="Fechar chat"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search.placeholder") || "Buscar amigos..."}
              className="w-full border border-border px-2.5 py-1.5 text-xs bg-background rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Friends list */}
          <div className="flex-1 overflow-y-auto">
            {filteredFriends.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">
                {friends.length === 0 ? (t("friends.none") || "Nenhum amigo") : "Nenhum resultado"}
              </p>
            ) : (
              filteredFriends.map((friend) => {
                const isOnline = onlineUsers.has(friend.id);
                const isOpenChat = openChats.some(c => c.id === friend.id);
                return (
                  <button
                    key={friend.id}
                    onClick={() => openChat(friend)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-accent/60 transition-colors cursor-pointer border-b border-border/50 ${
                      isOpenChat ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0">
                      {friend.photo ? (
                        <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full text-sm text-muted-foreground">👤</span>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card transition-colors ${
                          isOnline ? "bg-green-500" : "bg-muted-foreground/40"
                        }`}
                        style={isOnline ? { boxShadow: "0 0 6px rgba(34,197,94,0.5)" } : {}}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold truncate">{friend.name}</span>
                        <VerificationBadge {...(badges.get(friend.id) || {})} />
                      </div>
                      <span className={`text-[10px] ${isOnline ? "text-green-500" : "text-muted-foreground"}`}>
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Mobile: floating button */}
      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-xl cursor-pointer hover:scale-110 transition-transform"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
        >
          💬
          {onlineCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {onlineCount}
            </span>
          )}
        </button>

        {/* Mobile friends drawer */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
            <div className="fixed bottom-20 right-4 z-50 w-72 max-h-[60vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in">
              <div className="p-3 border-b border-border">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  💬 Chat
                  {onlineCount > 0 && (
                    <span className="text-[10px] text-green-500">• {onlineCount} online</span>
                  )}
                </h3>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full mt-2 border border-border px-2.5 py-1.5 text-xs bg-background rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="overflow-y-auto max-h-[45vh]">
                {filteredFriends.map((friend) => {
                  const isOnline = onlineUsers.has(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => {
                        openChat(friend);
                        setSidebarOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-accent/60 transition-colors cursor-pointer border-b border-border/50"
                    >
                      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0">
                        {friend.photo ? (
                          <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="flex items-center justify-center w-full h-full text-sm">👤</span>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                            isOnline ? "bg-green-500" : "bg-muted-foreground/40"
                          }`}
                          style={isOnline ? { boxShadow: "0 0 6px rgba(34,197,94,0.5)" } : {}}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold truncate block">{friend.name}</span>
                        <span className={`text-[10px] ${isOnline ? "text-green-500" : "text-muted-foreground"}`}>
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default FloatingChatSystem;
