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
    <div className="fb-box">
      <div className="fb-box-header flex items-center justify-between">
        <span>👥 Pessoas que você talvez conheça</span>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0"
          title="Atualizar"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="p-2 space-y-1.5">
        {suggestions.map((suggestion) => {
          const alreadySent = sentRequests.has(suggestion.user_id) || hasPendingRequest(suggestion.user_id);
          const alreadyFriend = isFriend(suggestion.user_id);
          if (alreadyFriend) return null;

          return (
            <div key={suggestion.user_id} className="flex items-center gap-2 border border-border p-1.5 bg-accent">
              <Link
                to={`/user/${suggestion.user_id}`}
                className="w-[30px] h-[30px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0"
              >
                {suggestion.photo_url ? (
                  <img src={suggestion.photo_url} alt={suggestion.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] text-muted-foreground">👤</span>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-0.5">
                  <Link to={`/user/${suggestion.user_id}`} className="text-[11px] font-bold truncate hover:underline">
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
                <span className="text-[10px] text-muted-foreground shrink-0">
                  ✓
                </span>
              ) : (
                <button
                  onClick={() => handleAddFriend(suggestion.user_id)}
                  className="bg-primary text-primary-foreground border-none px-2 py-[3px] text-[10px] cursor-pointer hover:opacity-90 flex items-center gap-0.5 shrink-0"
                >
                  <UserPlus className="w-3 h-3" />
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
