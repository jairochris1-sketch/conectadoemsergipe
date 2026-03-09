import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStoreFollowers } from "@/hooks/useStoreFollowers";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FollowStoreButtonProps {
  storeId: string;
  size?: "sm" | "default";
}

const FollowStoreButton = ({ storeId, size = "sm" }: FollowStoreButtonProps) => {
  const { user } = useAuth();
  const { isFollowing, followerCount, follow, unfollow } = useStoreFollowers(storeId);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

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
      <Button
        size={size}
        variant={isFollowing ? "outline" : "default"}
        onClick={handleClick}
        disabled={loading}
        className="gap-1.5"
      >
        <Heart className={`w-4 h-4 ${isFollowing ? "fill-primary text-primary" : ""}`} />
        {isFollowing ? "Seguindo" : "Seguir"}
      </Button>
      <span className="text-xs text-muted-foreground">
        {followerCount} {followerCount === 1 ? "seguidor" : "seguidores"}
      </span>
    </div>
  );
};

export default FollowStoreButton;
