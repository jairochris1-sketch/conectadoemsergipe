import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { UserPlus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSocial } from "@/context/SocialContext";
import { useLanguage } from "@/context/LanguageContext";
import VerificationBadge from "@/components/VerificationBadge";
import { useBatchVerificationBadges } from "@/hooks/useVerificationBadges";

interface Suggestion {
  user_id: string;
  name: string;
  photo_url: string | null;
  city: string | null;
  mutual_count: number;
  score: number;
}

const FriendSuggestions = () => {
  const { user } = useAuth();
  const { sendFriendRequest, hasPendingRequest, isFriend } = useSocial();
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_friend_suggestions" as any, {
        _user_id: user.id,
        _limit: 6,
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

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("suggestions-refresh")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => {
        fetchSuggestions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSuggestions]);

  const userIds = suggestions.map(s => s.user_id);
  const badges = useBatchVerificationBadges(userIds);

  const handleAddFriend = async (userId: string) => {
    await sendFriendRequest(userId);
    setSentRequests(prev => new Set(prev).add(userId));
  };

  if (!user || suggestions.length === 0) return null;

  return (
    <div className="bg-card border border-border p-3 w-full mt-3">
      <div className="border-b border-border pb-2 mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-primary">
          👥 Pessoas que você talvez conheça
        </h3>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0"
          title="Atualizar sugestões"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
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
                className="w-[42px] h-[42px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 rounded-sm"
              >
                {suggestion.photo_url ? (
                  <img src={suggestion.photo_url} alt={suggestion.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">👤</span>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-0.5">
                  <Link to={`/user/${suggestion.user_id}`} className="text-sm font-bold truncate hover:underline">
                    {suggestion.name}
                  </Link>
                  <VerificationBadge {...(badges.get(suggestion.user_id) || {})} />
                </div>
                {suggestion.mutual_count > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {suggestion.mutual_count} amigo{suggestion.mutual_count > 1 ? "s" : ""} em comum
                  </p>
                )}
                {suggestion.mutual_count === 0 && suggestion.city && (
                  <p className="text-xs text-muted-foreground truncate">
                    📍 {suggestion.city}
                  </p>
                )}
              </div>
              {alreadySent ? (
                <span className="text-xs text-muted-foreground shrink-0 px-1">
                  Enviado ✓
                </span>
              ) : (
                <button
                  onClick={() => handleAddFriend(suggestion.user_id)}
                  className="bg-primary text-primary-foreground border-none px-3 py-1.5 text-xs cursor-pointer hover:opacity-90 flex items-center gap-1 shrink-0 rounded-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Adicionar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FriendSuggestions;
