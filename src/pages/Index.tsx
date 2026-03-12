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
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} userPhoto={user?.photoUrl} onLogout={logout} />
      <div className="h-[56px]" />

      <main className="w-full max-w-[1100px] mx-auto flex justify-center gap-4 px-3 lg:px-5 py-4 lg:py-6">
        {/* Center: Feed */}
        <section className="flex-1 min-w-0 max-w-[680px]">
          {!user && (
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 mb-4 text-center">
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

          {/* Mobile-only: Quick nav */}
          <MobileQuickNav />

          {/* Mobile: Profile */}
          <div className="lg:hidden mb-3">
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

          {/* Mobile: Marketplace highlights */}
          <div className="lg:hidden mb-3">
            <MarketplaceHighlights />
          </div>

          <FollowedStoresNewProducts />
          <HomepageMarketplace />
          <PostFeed userName={user?.name} />

          {/* Mobile: Friends below feed */}
          <div className="lg:hidden mt-3 space-y-3">
            <FriendsSidebar />
            {user && <FriendSuggestions />}
          </div>
        </section>

        {/* Right column: Friends + Suggestions + Ads */}
        <aside className="hidden lg:block w-[280px] shrink-0">
          <div className="sticky top-[72px] flex flex-col gap-3">
            <FriendsSidebar />
            {user && <FriendSuggestions />}
            <MarketplaceHighlights />
            <BannerAdColumn position="right" />
          </div>
        </aside>
      </main>

      <FacebookFooter />
    </div>
  );
};

export default Index;
