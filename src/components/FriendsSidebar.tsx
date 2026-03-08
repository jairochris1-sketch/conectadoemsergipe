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
    <div className="fb-box">
      {pendingRequests.length > 0 && (
        <>
          <div className="fb-box-header">
            {t("friends.requests")} ({pendingRequests.length})
          </div>
          <div className="fb-box-body space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="border border-border p-1.5 bg-accent">
                <div className="flex items-center gap-2 text-[12px]">
                  <div className="w-[28px] h-[28px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {req.fromPhoto ? (
                      <img src={req.fromPhoto} alt={req.fromName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] text-muted-foreground">{t("photo")}</span>
                    )}
                  </div>
                  <span className="font-bold truncate">{req.fromName}</span>
                  <VerificationBadge {...(badges.get(req.fromId) || {})} />
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <button onClick={() => acceptFriendRequest(req.id)} className="bg-primary text-primary-foreground border-none px-2 py-1 text-[11px] cursor-pointer hover:opacity-90">
                    {t("friends.accept")}
                  </button>
                  <button onClick={() => rejectFriendRequest(req.id)} className="bg-muted text-foreground border border-border px-2 py-1 text-[11px] cursor-pointer hover:opacity-90">
                    {t("friends.reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="fb-box-header">
        {t("friends")} ({friends.length})
      </div>
      <div className="fb-box-body">
        <div className="space-y-1">
          {friends.length > 0 ? (
            friends.map((friend) => (
              <Link key={friend.id} to={`/user/${friend.id}`} className="flex items-center gap-2 text-[12px] no-underline text-primary hover:bg-accent p-1 -mx-1">
                <div className="relative w-[28px] h-[28px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {friend.photo ? (
                    <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground text-[9px]">{t("photo")}</span>
                  )}
                  {onlineUsers.has(friend.id) && (
                    <span className="absolute -bottom-[1px] -right-[1px] w-[7px] h-[7px] rounded-full bg-green-500 border border-card" />
                  )}
                </div>
                <div>
                  <span className="font-bold hover:underline">{friend.name}</span>
                  <VerificationBadge {...(badges.get(friend.id) || {})} />
                </div>
              </Link>
            ))
          ) : (
            <p className="text-[12px] text-muted-foreground">{t("friends.none")}</p>
          )}
        </div>
        {friends.length > 0 && (
          <div className="mt-2 border-t border-border pt-1.5">
            <Link to="/amigos" className="text-[11px] text-primary hover:underline">{t("see_all_friends")}</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsSidebar;
