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
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Conectados em Sergipe" description="Rede social que conecta pessoas em Sergipe. Faça amigos, compartilhe momentos e descubra o marketplace local." path="/" />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />

      {/* Facebook 2010: fixed 980px centered layout */}
      <div
        className="mx-auto py-3"
        style={isMobile ? { padding: "8px" } : { width: "980px", maxWidth: "100%" }}
      >
        {isMobile ? (
          /* Mobile: stacked */
          <div className="flex flex-col gap-3">
            {!user && (
              <div className="bg-accent border border-border p-3 text-center">
                <h2 className="text-[14px] font-bold text-primary mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                  Conectadoemsergipe
                </h2>
                <p className="text-[11px] text-foreground mb-1">{t("index.description")}</p>
                <p className="text-[11px]">
                  <a href="/register">{t("index.register")}</a> {t("index.or")} <a href="/login">{t("index.login")}</a> {t("index.cta")}
                </p>
              </div>
            )}
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
            <HomepageMarketplace />
            <PostFeed userName={user?.name} />
            <FriendsSidebar />
            {user && <FriendSuggestions />}
          </div>
        ) : (
          /* Desktop: 3-column Facebook 2010 layout */
          <div className="flex gap-[10px]">
            {/* Left column ~180px */}
            <div className="shrink-0" style={{ width: "180px" }}>
              <div className="sticky top-[50px] flex flex-col gap-2">
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
            </div>

            {/* Center column ~540px */}
            <div className="flex-1 min-w-0">
              {!user && (
                <div className="bg-accent border border-border p-3 mb-2 text-center">
                  <h2 className="text-[14px] font-bold text-primary mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                    Conectadoemsergipe
                  </h2>
                  <p className="text-[11px] text-foreground mb-1">{t("index.description")}</p>
                  <p className="text-[11px]">
                    <a href="/register">{t("index.register")}</a> {t("index.or")} <a href="/login">{t("index.login")}</a> {t("index.cta")}
                  </p>
                </div>
              )}
              <HomepageMarketplace />
              <PostFeed userName={user?.name} />
            </div>

            {/* Right column ~220px */}
            <div className="shrink-0" style={{ width: "220px" }}>
              <div className="sticky top-[50px] flex flex-col gap-2">
                <FriendsSidebar />
                {user && <FriendSuggestions />}
                <BannerAdColumn position="right" />
              </div>
            </div>
          </div>
        )}
      </div>

      <FacebookFooter />
    </div>
  );
};

export default Index;
