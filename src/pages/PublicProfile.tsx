import { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import FriendsSidebar from "@/components/FriendsSidebar";
import FollowButton from "@/components/FollowButton";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import { useFollowers } from "@/hooks/useFollowers";
import { supabase } from "@/integrations/supabase/client";

interface PublicProfile {
  user_id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  school: string | null;
  city: string | null;
  birthdate: string | null;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isFriend, hasPendingRequest, sendFriendRequest } = useSocial();
  const { followerCount, followingCount } = useFollowers(userId);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("user_id, name, bio, photo_url, school, city, birthdate")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [userId]);

  // If viewing own profile, redirect to /profile
  if (user && userId === user.id) return <Navigate to="/profile" />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
        <div className="max-w-[760px] mx-auto px-2 py-3">
          <p className="text-[11px] text-muted-foreground">{t("admin.loading")}</p>
        </div>
        <FacebookFooter />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
        <div className="max-w-[760px] mx-auto px-2 py-3">
          <div className="bg-card border border-border p-3">
            <p className="text-[11px] text-muted-foreground">{t("public_profile.not_found")}</p>
          </div>
        </div>
        <FacebookFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <div className="bg-card border border-border p-3">
              <div className="border-b border-border pb-2 mb-3">
                <h2 className="text-[16px] font-bold text-primary" style={{ fontFamily: "Georgia, serif" }}>
                  {t("profile_of")} {profile.name}
                </h2>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0">
                  <img
                    src={profile.photo_url || "/placeholder.svg"}
                    alt={profile.name}
                    className="w-[150px] h-[150px] border border-border object-cover"
                  />
                </div>
                <div className="text-[11px] space-y-1">
                  <p><b>{t("name")}:</b> {profile.name}</p>
                  {profile.school && <p><b>{t("school")}:</b> {profile.school}</p>}
                  <p><b>{t("city")}:</b> {profile.city || "-"}</p>
                  <p><b>{t("birthdate")}:</b> {profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : "-"}</p>
                  <p><b>{t("bio")}:</b> {profile.bio || t("no_bio")}</p>
                  <p><b>{t("admin.followers")}:</b> {followerCount}</p>

                  {/* Actions */}
                  {user && userId && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border mt-2">
                      <FollowButton profileId={userId} />
                      {isFriend(userId) ? (
                        <span className="text-[10px] text-muted-foreground">✓ {t("friends.already")}</span>
                      ) : hasPendingRequest(userId) ? (
                        <span className="text-[10px] text-muted-foreground">{t("friends.pending")}</span>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(userId)}
                          className="bg-primary text-primary-foreground border-none px-2 py-[2px] text-[10px] cursor-pointer hover:opacity-90"
                        >
                          + {t("friends.add")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="w-[180px] shrink-0">
            <FriendsSidebar />
          </div>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default PublicProfile;
