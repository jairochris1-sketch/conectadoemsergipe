import FacebookHeader from "@/components/FacebookHeader";
import ProfileSidebar from "@/components/ProfileSidebar";
import PostFeed from "@/components/PostFeed";
import FriendsSidebar from "@/components/FriendsSidebar";
import FriendSuggestions from "@/components/FriendSuggestions";
import FacebookFooter from "@/components/FacebookFooter";
import BannerAdColumn from "@/components/BannerAdColumn";
import MarketplaceHighlights from "@/components/MarketplaceHighlights";
import HomepageMarketplace from "@/components/HomepageMarketplace";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const Index = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Conectados em Sergipe" description="Rede social que conecta pessoas em Sergipe. Faça amigos, compartilhe momentos e descubra o marketplace local." path="/" />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />

      <div className="max-w-[980px] mx-auto flex gap-0 px-0 py-2">
        {/* Left column — Profile + Nav */}
        <div className="hidden md:block w-[180px] shrink-0 px-1">
          <div className="sticky top-[55px]">
            <ProfileSidebar
              name={user?.name || t("guest_user")}
              bio={user?.bio || t("login_to_see")}
              photoUrl={user?.photoUrl || "/placeholder.svg"}
              school={user?.school}
              city={user?.city}
              birthdate={user?.birthdate}
              createdAt={user?.createdAt}
            />
            <MarketplaceHighlights />
          </div>
        </div>

        {/* Center: Feed */}
        <div className="flex-1 min-w-0 px-1">
          {!user && (
            <div className="fb-box p-3 text-center">
              <h2 className="text-[14px] font-bold text-primary mb-1">
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

          {/* Mobile-only: Profile first */}
          <div className="md:hidden mb-2">
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

          <div className="md:hidden mb-2">
            <MarketplaceHighlights />
          </div>

          <HomepageMarketplace />
          <PostFeed userName={user?.name} />

          <div className="md:hidden mt-2 space-y-2">
            <FriendsSidebar />
            {user && <FriendSuggestions />}
          </div>
        </div>

        {/* Right column: Friends + Sponsored */}
        <div className="hidden md:block w-[220px] shrink-0 px-1">
          <div className="sticky top-[55px]">
            <FriendsSidebar />
            {user && <FriendSuggestions />}
            <BannerAdColumn position="right" />
          </div>
        </div>
      </div>

      <FacebookFooter />
    </div>
  );
};

export default Index;
