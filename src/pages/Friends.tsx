import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { UserPlus, RefreshCw } from "lucide-react";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import VerificationBadge from "@/components/VerificationBadge";
import { useBatchVerificationBadges } from "@/hooks/useVerificationBadges";
import { useOnlineStatus } from "@/hooks/usePresence";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  user_id: string;
  name: string;
  photo_url: string | null;
  city: string | null;
  mutual_count: number;
  score: number;
}

const FriendsPage = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { getFriends, getPendingRequests, acceptFriendRequest, rejectFriendRequest, sendFriendRequest, hasPendingRequest, isFriend } = useSocial();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const friends = getFriends();
  const pendingRequests = getPendingRequests();

  const allIds = useMemo(() => [
    ...friends.map(f => f.id),
    ...pendingRequests.map(r => r.fromId),
    ...suggestions.map(s => s.user_id),
  ], [friends, pendingRequests, suggestions]);

  const badges = useBatchVerificationBadges(allIds);
  const friendIds = useMemo(() => friends.map(f => f.id), [friends]);
  const onlineUsers = useOnlineStatus(friendIds);

  const fetchSuggestions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_friend_suggestions" as any, {
        _user_id: user.id,
        _limit: 20,
      });
      if (!error && data) {
        setSuggestions(data as Suggestion[]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleAddFriend = async (userId: string) => {
    await sendFriendRequest(userId);
    setSentRequests(prev => new Set(prev).add(userId));
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Amigos" description="Veja seus amigos e conheça pessoas da sua região no Conectados em Sergipe." path="/amigos" />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3 space-y-4">

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-card border border-border p-3">
            <div className="border-b border-border pb-2 mb-3">
              <h2 className="text-[14px] font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
                {t("friends.requests")} ({pendingRequests.length})
              </h2>
            </div>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between border border-border p-2 bg-accent">
                  <div className="flex items-center gap-2">
                    <Link to={`/user/${req.fromId}`} className="w-[40px] h-[40px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {req.fromPhoto ? (
                        <img src={req.fromPhoto} alt={req.fromName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8px] text-muted-foreground">{t("photo")}</span>
                      )}
                    </Link>
                    <div>
                      <div className="flex items-center gap-0.5">
                        <Link to={`/user/${req.fromId}`} className="text-[12px] font-bold hover:underline">{req.fromName}</Link>
                        <VerificationBadge {...(badges.get(req.fromId) || {})} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => acceptFriendRequest(req.id)} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
                      {t("friends.accept")}
                    </button>
                    <button onClick={() => rejectFriendRequest(req.id)} className="bg-muted text-foreground border border-border px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
                      {t("friends.reject")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Friends */}
        <div className="bg-card border border-border p-3">
          <div className="border-b border-border pb-2 mb-3">
            <h2 className="text-[14px] font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
              {t("friends")} ({friends.length})
            </h2>
          </div>
          <div className="space-y-2">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <Link key={friend.id} to={`/user/${friend.id}`} className="flex items-center gap-3 text-[12px] no-underline text-foreground hover:bg-accent p-2 rounded border border-border">
                  <div className="relative w-[40px] h-[40px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {friend.photo ? (
                      <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground text-[8px]">{t("photo")}</span>
                    )}
                    {onlineUsers.has(friend.id) && (
                      <span className="absolute -bottom-[1px] -right-[1px] w-[8px] h-[8px] rounded-full bg-green-500 border border-card" style={{ boxShadow: "0 0 3px rgba(34,197,94,0.6)" }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5">
                      <span className="font-bold hover:underline">{friend.name}</span>
                      <VerificationBadge {...(badges.get(friend.id) || {})} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-[11px] text-muted-foreground">{t("friends.none")}</p>
            )}
          </div>
        </div>

        {/* Location-based Recommendations */}
        {suggestions.length > 0 && (
          <div className="bg-card border border-border p-3">
            <div className="border-b border-border pb-2 mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
                👥 Pessoas da sua região
              </h2>
              <button
                onClick={fetchSuggestions}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0"
                title="Atualizar sugestões"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion) => {
                const alreadySent = sentRequests.has(suggestion.user_id) || hasPendingRequest(suggestion.user_id);
                const alreadyFriend = isFriend(suggestion.user_id);
                if (alreadyFriend) return null;

                return (
                  <div key={suggestion.user_id} className="flex items-center gap-3 border border-border p-2 bg-accent">
                    <Link
                      to={`/user/${suggestion.user_id}`}
                      className="w-[40px] h-[40px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0"
                    >
                      {suggestion.photo_url ? (
                        <img src={suggestion.photo_url} alt={suggestion.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8px] text-muted-foreground">👤</span>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-0.5">
                        <Link to={`/user/${suggestion.user_id}`} className="text-[12px] font-bold truncate hover:underline">
                          {suggestion.name}
                        </Link>
                        <VerificationBadge {...(badges.get(suggestion.user_id) || {})} />
                      </div>
                      {suggestion.mutual_count > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          {suggestion.mutual_count} amigo{suggestion.mutual_count > 1 ? "s" : ""} em comum
                        </p>
                      )}
                      {suggestion.mutual_count === 0 && suggestion.city && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          📍 {suggestion.city}
                        </p>
                      )}
                    </div>
                    {alreadySent ? (
                      <span className="text-[10px] text-muted-foreground shrink-0 px-2">
                        Enviado ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(suggestion.user_id)}
                        className="bg-primary text-primary-foreground border-none px-3 py-1 text-[10px] cursor-pointer hover:opacity-90 flex items-center gap-1 shrink-0"
                      >
                        <UserPlus className="w-3 h-3" />
                        Adicionar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <FacebookFooter />
    </div>
  );
};

export default FriendsPage;
