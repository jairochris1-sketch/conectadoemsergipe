import FacebookHeader from "@/components/FacebookHeader";
import ProfileSidebar from "@/components/ProfileSidebar";
import PostFeed from "@/components/PostFeed";
import FriendsSidebar from "@/components/FriendsSidebar";
import FriendSuggestions from "@/components/FriendSuggestions";
import FacebookFooter from "@/components/FacebookFooter";
import BannerAd from "@/components/BannerAd";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const Index = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />

      <div className="w-full flex justify-center gap-3 px-2 py-3">
        {/* Left ad space */}
        <div className="hidden lg:block w-[160px] shrink-0">
          <div className="sticky top-3 space-y-3">
            <div className="bg-card border border-border p-2 text-center text-[10px] text-muted-foreground min-h-[600px] flex items-center justify-center">
              {t("ad_space") || "Espaço para anúncio"}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="w-full max-w-[1140px] shrink">
          {!user && (
            <div className="bg-accent border border-border p-3 mb-3 text-center">
              <h2 className="text-[16px] font-bold text-primary mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Conectadoemsergipe
              </h2>
              <p className="text-[11px] text-foreground mb-2">
                {t("index.description")}
              </p>
              <p className="text-[11px]">
                <a href="/register">{t("index.register")}</a> {t("index.or")} <a href="/login">{t("index.login")}</a> {t("index.cta")}
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3">
            <div className="w-full md:w-[200px] md:shrink-0">
              <ProfileSidebar
                name={user?.name || t("guest_user")}
                bio={user?.bio || t("login_to_see")}
                photoUrl={user?.photoUrl || "/placeholder.svg"}
                school={user?.school}
                city={user?.city}
                birthdate={user?.birthdate}
                createdAt={user?.createdAt}
              />
            </div>
            <div className="flex-1 min-w-0">
              <PostFeed userName={user?.name} />
            </div>
            <div className="w-full md:w-[200px] md:shrink-0">
              <FriendsSidebar />
              {user && <FriendSuggestions />}
            </div>
          </div>
        </div>

        {/* Right ad space */}
        <div className="hidden lg:block w-[160px] shrink-0">
          <div className="sticky top-3 space-y-3">
            <div className="bg-card border border-border p-2 text-center text-[10px] text-muted-foreground min-h-[600px] flex items-center justify-center">
              {t("ad_space") || "Espaço para anúncio"}
            </div>
          </div>
        </div>
      </div>

      <FacebookFooter />
    </div>
  );
};

export default Index;
