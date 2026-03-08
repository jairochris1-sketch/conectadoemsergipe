import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useFollowers } from "@/hooks/useFollowers";

interface FollowButtonProps {
  profileId: string;
}

const FollowButton = ({ profileId }: FollowButtonProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isFollowing, followerCount, follow, unfollow } = useFollowers(profileId);
  const [loading, setLoading] = useState(false);

  if (!user || user.id === profileId) return null;

  const handleClick = async () => {
    setLoading(true);
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-2 py-[2px] text-[10px] border-none cursor-pointer hover:opacity-90 ${
          isFollowing
            ? "bg-muted text-foreground border border-border"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {isFollowing ? t("admin.unfollow") : t("admin.follow")}
      </button>
      <span className="text-[10px] text-muted-foreground">
        {followerCount} {t("admin.followers")}
      </span>
    </div>
  );
};

export default FollowButton;
