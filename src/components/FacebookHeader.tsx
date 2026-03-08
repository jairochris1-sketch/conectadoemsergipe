import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Mail, Menu, Sun, Moon, ArrowLeft } from "lucide-react";
import { useLanguage, Language } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useModerator } from "@/hooks/useModerator";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAdminReports } from "@/hooks/useAdminReports";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

interface FacebookHeaderProps {
  isLoggedIn: boolean;
  userName?: string;
  onLogout?: () => void;
}

const LANG_LABELS: Record<Language, string> = { pt: "PT", es: "ES", en: "EN" };

const FacebookHeader = ({ isLoggedIn, userName, onLogout }: FacebookHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerImage, setBannerImage] = useState("");
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = useAdmin();
  const { isModerator } = useModerator();
  const { unreadCount } = useUnreadMessages();
  const { pendingCount: pendingReports } = useAdminReports();
  const isMobile = useIsMobile();

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["login_banner", "header_overlay_opacity"])
      .then(({ data }) => {
        data?.forEach((row: any) => {
          if (row.key === "login_banner" && row.value) setBannerImage(row.value);
          if (row.key === "header_overlay_opacity" && row.value) setOverlayOpacity(Number(row.value) / 100);
        });
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
    }
  };

  const navLinks = (onNav?: () => void) => (
    <>
      {isLoggedIn ? (
        <>
          <Link to="/" className="text-primary-foreground text-[11px] hover:underline" onClick={onNav}>{t("home")}</Link>
          <Link to="/profile" className="text-primary-foreground text-[11px] hover:underline" onClick={onNav}>{t("profile")}</Link>
          <Link to="/marketplace" className="text-primary-foreground text-[11px] hover:underline" onClick={onNav}>{t("marketplace")}</Link>
          <Link to="/messages" className="text-primary-foreground relative inline-flex items-center gap-[2px] text-[11px] hover:underline" onClick={onNav}>
            <Mail className="w-3 h-3" />
            {t("messages")}
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[8px] font-bold px-[4px] py-[1px] rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-primary-foreground font-bold relative inline-flex items-center gap-[2px] text-[11px] hover:underline" onClick={onNav}>
              {t("admin.panel")}
              {pendingReports > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[8px] font-bold px-[4px] py-[1px] rounded-full leading-none">
                  {pendingReports}
                </span>
              )}
            </Link>
          )}
          {isModerator && !isAdmin && (
            <Link to="/moderator" className="text-primary-foreground font-bold text-[11px] hover:underline" onClick={onNav}>
              ⭐ Colaborador
            </Link>
          )}
          <button onClick={() => { onLogout?.(); onNav?.(); }} className="text-primary-foreground bg-transparent border-none cursor-pointer text-[11px] hover:underline text-left">
            {t("logout")}
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="text-primary-foreground text-[11px] hover:underline" onClick={onNav}>{t("login")}</Link>
          <Link to="/register" className="text-primary-foreground text-[11px] hover:underline" onClick={onNav}>{t("register")}</Link>
        </>
      )}
    </>
  );

  return (
    <div
      className="bg-primary text-primary-foreground bg-cover bg-center bg-no-repeat"
      style={bannerImage ? {
        backgroundImage: `linear-gradient(rgba(59,89,152,${overlayOpacity}), rgba(59,89,152,${overlayOpacity})), url(${bannerImage})`,
      } : undefined}
    >
      <div className="max-w-[1140px] mx-auto px-2 py-1">
        {/* Top row: logo + search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isMobile && location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="bg-transparent border-none cursor-pointer text-primary-foreground p-1 flex items-center"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="text-primary-foreground no-underline hover:no-underline shrink-0">
              <h1 className="text-[16px] sm:text-[20px] font-bold tracking-[-1px] leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                Conectadoemsergipe
              </h1>
            </Link>
          </div>

          {!isMobile && (
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search")}
                  className="border border-border px-1 py-[2px] text-[11px] text-foreground bg-card w-[120px]"
                />
                <button type="submit" className="bg-muted border border-border border-l-0 px-1 py-[2px] cursor-pointer flex items-center">
                  <Search className="w-3 h-3 text-foreground" />
                </button>
              </form>
              <div className="flex items-center gap-1">
                {(["pt", "es", "en"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`bg-transparent border-none cursor-pointer text-[10px] px-1 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/70 hover:underline"}`}
                  >
                    {LANG_LABELS[lang]}
                  </button>
                ))}
                <button
                  onClick={toggleDarkMode}
                  className="bg-transparent border-none cursor-pointer text-primary-foreground/80 hover:text-primary-foreground ml-1 p-[2px]"
                  title={darkMode ? "Modo claro" : "Modo noturno"}
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {isMobile && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Link to="/messages" className="relative">
                  <Mail className="w-4 h-4 text-primary-foreground" />
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[7px] font-bold w-3 h-3 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                </Link>
              )}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button className="bg-transparent border-none cursor-pointer p-1">
                    <Menu className="w-5 h-5 text-primary-foreground" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-primary border-primary/80 w-[260px] p-4">
                  <SheetTitle className="text-primary-foreground text-[14px] mb-3">Menu</SheetTitle>
                  <form onSubmit={handleSearch} className="flex items-center mb-4">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("search")} className="border border-border px-2 py-1 text-[12px] text-foreground bg-card flex-1" />
                    <button type="submit" className="bg-muted border border-border border-l-0 px-2 py-1 cursor-pointer flex items-center">
                      <Search className="w-3 h-3 text-foreground" />
                    </button>
                  </form>
                  <div className="flex items-center gap-2 mb-4">
                    {(["pt", "es", "en"] as Language[]).map((lang) => (
                      <button key={lang} onClick={() => setLanguage(lang)} className={`bg-transparent border-none cursor-pointer text-[11px] px-1 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/70 hover:underline"}`}>
                        {LANG_LABELS[lang]}
                      </button>
                    ))}
                    <button
                      onClick={toggleDarkMode}
                      className="bg-transparent border-none cursor-pointer text-primary-foreground/80 hover:text-primary-foreground ml-1 p-[2px]"
                      title={darkMode ? "Modo claro" : "Modo noturno"}
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {navLinks(() => setMenuOpen(false))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>

        {/* Desktop nav row */}
        {!isMobile && (
          <div className="flex items-center justify-end gap-3 text-[11px] mt-[2px]">
            {isLoggedIn && <span className="text-[11px]">{t("welcome")}, <b>{userName}</b></span>}
            {navLinks()}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacebookHeader;
