import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import { useAuth } from "@/context/AuthContext";
import VerificationBadge from "@/components/VerificationBadge";
import { useBatchVerificationBadges } from "@/hooks/useVerificationBadges";
import { useOnlineStatus } from "@/hooks/usePresence";

const FriendsSidebar = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { getFriends, getPendingRequests, acceptFriendRequest, rejectFriendRequest } = useSocial();

  const friends = getFriends();
  const pendingRequests = getPendingRequests();
  const allIds = useMemo(() => [
    ...friends.map(f => f.id),
    ...pendingRequests.map(r => r.fromId),
  ], [friends, pendingRequests]);
  const badges = useBatchVerificationBadges(allIds);
  const friendIds = useMemo(() => friends.map(f => f.id), [friends]);
  const onlineUsers = useOnlineStatus(friendIds);

  return (
    <div className="bg-card border border-border p-2 w-full">
      {pendingRequests.length > 0 && (
        <div className="mb-3">
          <div className="border-b border-border pb-1 mb-2">
            <h3 className="text-[13px] font-bold text-primary">
              {t("friends.requests")} ({pendingRequests.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="border border-border p-1 bg-accent">
                <div className="flex items-center gap-2 text-[11px]">
                  <div className="w-[24px] h-[24px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {req.fromPhoto ? (
                      <img src={req.fromPhoto} alt={req.fromName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[7px] text-muted-foreground">{t("photo")}</span>
                    )}
                  </div>
                  <span className="font-bold truncate">{req.fromName}</span>
                  <VerificationBadge {...(badges.get(req.fromId) || {})} />
                </div>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => acceptFriendRequest(req.id)} className="bg-primary text-primary-foreground border-none px-2 py-[1px] text-[10px] cursor-pointer hover:opacity-90">
                    {t("friends.accept")}
                  </button>
                  <button onClick={() => rejectFriendRequest(req.id)} className="bg-muted text-foreground border border-border px-2 py-[1px] text-[10px] cursor-pointer hover:opacity-90">
                    {t("friends.reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-b border-border pb-1 mb-2">
        <h3 className="text-[13px] font-bold text-primary">{t("friends")} ({friends.length})</h3>
      </div>
      <div className="space-y-2">
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div key={friend.id} className="flex items-center gap-2 text-[11px]">
              <div className="relative w-[30px] h-[30px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                {friend.photo ? (
                  <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground text-[8px]">{t("photo")}</span>
                )}
                {onlineUsers.has(friend.id) && (
                  <span className="absolute -bottom-[1px] -right-[1px] w-[7px] h-[7px] rounded-full bg-green-500 border border-card" style={{ boxShadow: "0 0 3px rgba(34,197,94,0.6)" }} />
                )}
              </div>
              <div>
                <a href="#" className="font-bold">{friend.name}</a>
                <VerificationBadge {...(badges.get(friend.id) || {})} />
              </div>
            </div>
          ))
        ) : (
          <p className="text-[10px] text-muted-foreground">{t("friends.none")}</p>
        )}
      </div>
      {friends.length > 0 && (
        <div className="mt-3 border-t border-border pt-2">
          <a href="#" className="text-[11px]">{t("see_all_friends")}</a>
        </div>
      )}
    </div>
  );
};

export default FriendsSidebar;
