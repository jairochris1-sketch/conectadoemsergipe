import FacebookHeader from "@/components/FacebookHeader";
import ProfileSidebar from "@/components/ProfileSidebar";
import PostFeed from "@/components/PostFeed";
import FriendsSidebar from "@/components/FriendsSidebar";
import FriendSuggestions from "@/components/FriendSuggestions";
import FacebookFooter from "@/components/FacebookFooter";
import BannerAdColumn from "@/components/BannerAdColumn";
import MarketplaceHighlights from "@/components/MarketplaceHighlights";
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

      <div className="w-full flex justify-center gap-3 px-2 py-3">
        {/* Left column: Marketplace */}
        <div className="hidden md:flex flex-col gap-3 w-[220px] shrink-0">
          <div className="sticky top-3 flex flex-col gap-3">
            <MarketplaceHighlights />
          </div>
        </div>

        {/* Center: Feed */}
        <div className="flex-1 min-w-0 max-w-[600px]">
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

          <PostFeed userName={user?.name} />

          {/* Mobile-only sections below feed */}
          <div className="md:hidden mt-3 space-y-3">
            <MarketplaceHighlights />
            <ProfileSidebar
              name={user?.name || t("guest_user")}
              bio={user?.bio || t("login_to_see")}
              photoUrl={user?.photoUrl || "/placeholder.svg"}
              school={user?.school}
              city={user?.city}
              birthdate={user?.birthdate}
              createdAt={user?.createdAt}
            />
            <FriendsSidebar />
            {user && <FriendSuggestions />}
          </div>
        </div>

        {/* Right column: Friends + Ads */}
        <div className="hidden md:block w-[220px] shrink-0">
          <div className="sticky top-3 flex flex-col gap-3">
            <FriendsSidebar />
            {user && <FriendSuggestions />}
            <BannerAdColumn position="right" />
          </div>
        </div>
      </div>
      </div>

      <FacebookFooter />
    </div>
  );
};

export default Index;
