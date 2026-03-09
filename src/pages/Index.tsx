import FacebookHeader from "@/components/FacebookHeader";
import ProfileSidebar from "@/components/ProfileSidebar";
import PostFeed from "@/components/PostFeed";
import FriendsSidebar from "@/components/FriendsSidebar";
import FriendSuggestions from "@/components/FriendSuggestions";
import FacebookFooter from "@/components/FacebookFooter";
import BannerAdColumn from "@/components/BannerAdColumn";
import MarketplaceHighlights from "@/components/MarketplaceHighlights";
import HomepageMarketplace from "@/components/HomepageMarketplace";
import FollowedStoresNewProducts from "@/components/FollowedStoresNewProducts";
import MobileQuickNav from "@/components/MobileQuickNav";
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

      <main className="w-full max-w-[1240px] mx-auto flex justify-center gap-4 px-3 md:px-5 py-4 md:py-6">
        {/* Left column: Profile + Ads */}
        <aside className="hidden md:flex flex-col gap-3 w-[250px] shrink-0">
          <div className="sticky top-24 flex flex-col gap-3">
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
            <MarketplaceHighlights />
          </div>
        </aside>

        {/* Center: Feed */}
        <section className="flex-1 min-w-0 max-w-[680px]">
          {!user && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5 mb-4 text-center">
              <h2 className="text-2xl font-bold text-primary mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                Conectadoemsergipe
              </h2>
              <p className="text-sm text-foreground mb-2">
                {t("index.description")}
              </p>
              <p className="text-sm">
                <a href="/register">{t("index.register")}</a> {t("index.or")} <a href="/login">{t("index.login")}</a> {t("index.cta")}
              </p>
            </div>
          )}

          {/* Mobile-only: Profile first */}
          <div className="md:hidden mb-3">
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

          {/* Mobile-only: Marketplace highlights */}
          <div className="md:hidden mb-3">
            <MarketplaceHighlights />
          </div>

          <HomepageMarketplace />

          <PostFeed userName={user?.name} />

          {/* Mobile-only: Friends below feed */}
          <div className="md:hidden mt-3 space-y-3">
            <FriendsSidebar />
            {user && <FriendSuggestions />}
          </div>
        </section>

        {/* Right column: Friends + Ads */}
        <aside className="hidden md:block w-[250px] shrink-0">
          <div className="sticky top-24 flex flex-col gap-3">
            <FriendsSidebar />
            {user && <FriendSuggestions />}
            <BannerAdColumn position="right" />
          </div>
        </aside>
      </main>

      <FacebookFooter />
    </div>
  );
};

export default Index;
