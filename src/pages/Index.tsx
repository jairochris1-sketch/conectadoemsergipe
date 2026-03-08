import FacebookHeader from "@/components/FacebookHeader";
import ProfileSidebar from "@/components/ProfileSidebar";
import ProfileSidebarNav from "@/components/ProfileSidebarNav";
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

      <div className="max-w-[980px] mx-auto flex gap-[10px] px-2 py-[10px]">
        {/* Left column */}
        <div className="hidden md:flex flex-col gap-[10px] w-[180px] shrink-0">
          <div className="sticky top-[52px] flex flex-col gap-[10px]">
            <ProfileSidebarNav />
            <ProfileSidebar
              name={user?.name || t("guest_user")}
              bio={user?.bio || t("login_to_see")}
              photoUrl={user?.photoUrl || "/placeholder.svg"}
              school={user?.school}
              city={user?.city}
              birthdate={user?.birthdate}
              createdAt={user?.createdAt}
            />
            <BannerAdColumn position="left" />
          </div>
        </div>

        {/* Center: Feed */}
        <div className="flex-1 min-w-0">
          {!user && (
            <div className="fb-box">
              <div className="fb-box-header text-center">
                <span className="text-[16px]" style={{ fontFamily: "'klavika', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                  Conectadoemsergipe
                </span>
              </div>
              <div className="fb-box-body text-center">
                <p className="text-[12px] text-foreground mb-2">
                  {t("index.description")}
                </p>
                <p className="text-[12px]">
                  <a href="/register">{t("index.register")}</a> {t("index.or")} <a href="/login">{t("index.login")}</a> {t("index.cta")}
                </p>
              </div>
            </div>
          )}

          {/* Mobile-only sections */}
          <div className="md:hidden mb-[10px]">
            <ProfileSidebarNav />
          </div>
          <div className="md:hidden mb-[10px]">
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
          <div className="md:hidden mb-[10px]">
            <MarketplaceHighlights />
          </div>

          <HomepageMarketplace />
          <PostFeed userName={user?.name} />

          {/* Mobile-only: Friends below feed */}
          <div className="md:hidden mt-[10px] space-y-[10px]">
            <FriendsSidebar />
            {user && <FriendSuggestions />}
          </div>
        </div>

        {/* Right column */}
        <div className="hidden md:block w-[230px] shrink-0">
          <div className="sticky top-[52px] flex flex-col gap-[10px]">
            <MarketplaceHighlights />
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
