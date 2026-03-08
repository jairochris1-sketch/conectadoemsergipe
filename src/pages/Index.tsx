import FacebookHeader from "@/components/FacebookHeader";
import ProfileSidebar from "@/components/ProfileSidebar";
import PostFeed from "@/components/PostFeed";
import FriendsSidebar from "@/components/FriendsSidebar";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const Index = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />

      <div className="max-w-[760px] mx-auto px-2 py-3">
        {!user && (
          <div className="bg-accent border border-border p-3 mb-3 text-center">
            <h2 className="text-[16px] font-bold text-primary mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              [ conectadosemsergipe ]
            </h2>
            <p className="text-[11px] text-foreground mb-2">
              {t("index.description")}
            </p>
            <p className="text-[11px]">
              <a href="/register">{t("index.register")}</a> {t("index.or")} <a href="/login">{t("index.login")}</a> {t("index.cta")}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <div className="w-[180px] shrink-0">
            <ProfileSidebar
              name={user?.name || t("guest_user")}
              bio={user?.bio || t("login_to_see")}
              photoUrl={user?.photoUrl || "/placeholder.svg"}
              school={user?.school}
            />
          </div>
          <div className="flex-1 min-w-0">
            <PostFeed userName={user?.name} />
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

export default Index;
