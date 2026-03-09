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
  const [suggestions, setSuggestions] = useState<{ user_id: string; name: string; photo_url: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, name, photo_url")
        .ilike("name", `%${value.trim()}%`)
        .limit(5);
      setSuggestions(data || []);
      setShowSuggestions((data || []).length > 0);
    }, 250);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
    }
  };

  const handleSelectSuggestion = (userId: string) => {
    setShowSuggestions(false);
    setSearchQuery("");
    setMenuOpen(false);
    navigate(`/user/${userId}`);
  };

  const SuggestionsDropdown = () => {
    if (!showSuggestions || suggestions.length === 0) return null;
    return (
      <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-50 mt-2 overflow-hidden">
        {suggestions.map((s) => (
          <button
            key={s.user_id}
            onClick={() => handleSelectSuggestion(s.user_id)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent bg-transparent border-none cursor-pointer"
          >
            <div className="w-[32px] h-[32px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 rounded-md">
              {s.photo_url ? (
                <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-muted-foreground">👤</span>
              )}
            </div>
            <span className="text-sm text-foreground font-medium truncate">{s.name}</span>
          </button>
        ))}
      </div>
    );
  };

  const navLinks = (onNav?: () => void) => (
    <>
      {isLoggedIn ? (
        <>
          <Link to="/" className="text-primary-foreground text-sm hover:underline" onClick={onNav}>{t("home")}</Link>
          <Link to="/profile" className="text-primary-foreground text-sm hover:underline" onClick={onNav}>{t("profile")}</Link>
          <Link to="/marketplace" className="text-primary-foreground text-sm hover:underline" onClick={onNav}>{t("marketplace")}</Link>
          <Link to="/messages" className="text-primary-foreground relative inline-flex items-center gap-1 text-sm hover:underline" onClick={onNav}>
            <Mail className="w-5 h-5" />
            {t("messages")}
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-primary-foreground font-bold relative inline-flex items-center gap-1 text-sm hover:underline" onClick={onNav}>
              {t("admin.panel")}
              {pendingReports > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {pendingReports}
                </span>
              )}
            </Link>
          )}
          {isModerator && !isAdmin && (
            <Link to="/moderator" className="text-primary-foreground font-bold text-sm hover:underline" onClick={onNav}>
              ⭐ Colaborador
            </Link>
          )}
          <button onClick={() => { onLogout?.(); onNav?.(); }} className="text-primary-foreground bg-transparent border-none cursor-pointer text-sm hover:underline text-left">
            {t("logout")}
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="text-primary-foreground text-sm hover:underline" onClick={onNav}>{t("login")}</Link>
          <Link to="/register" className="text-primary-foreground text-sm hover:underline" onClick={onNav}>{t("register")}</Link>
        </>
      )}
    </>
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!headerRef.current) return;
    const ro = new ResizeObserver(([entry]) => setHeaderHeight(entry.contentRect.height));
    ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <>
    <div
      ref={headerRef}
      className="fixed top-0 left-0 w-full z-[1000] bg-primary text-primary-foreground bg-cover bg-center bg-no-repeat border-b border-primary-foreground/15 shadow-lg"
      style={bannerImage ? {
        backgroundImage: `linear-gradient(rgba(59,89,152,${overlayOpacity}), rgba(59,89,152,${overlayOpacity})), url(${bannerImage})`,
      } : undefined}
    >
      <div className="max-w-[1240px] mx-auto px-4 py-2.5">
        {/* Top row: logo + search */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isMobile && location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="bg-transparent border-none cursor-pointer text-primary-foreground p-1 flex items-center"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <Link to="/" className="text-primary-foreground no-underline hover:no-underline shrink-0">
              <h1 className="text-[1.35rem] sm:text-[1.55rem] font-bold tracking-tight leading-tight" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                Conectadoemsergipe
              </h1>
            </Link>
          </div>

          {!isMobile && (
            <div className="flex items-center gap-3">
              <div className="relative" ref={suggestionsRef}>
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    placeholder={t("search")}
                    className="border border-border px-3 py-2 text-sm text-foreground bg-card w-[220px] rounded-l-xl"
                  />
                  <button type="submit" className="bg-secondary border border-border border-l-0 px-3 py-2 cursor-pointer flex items-center rounded-r-xl">
                    <Search className="w-5 h-5 text-foreground" />
                  </button>
                </form>
                <SuggestionsDropdown />
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-2 py-1">
                {(["pt", "es", "en"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`bg-transparent border-none cursor-pointer text-xs px-2 py-1 rounded-md ${language === lang ? "font-bold bg-primary-foreground/20 text-primary-foreground" : "text-primary-foreground/75 hover:text-primary-foreground"}`}
                  >
                    {LANG_LABELS[lang]}
                  </button>
                ))}
                <button
                  onClick={toggleDarkMode}
                  className="bg-transparent border-none cursor-pointer text-primary-foreground/85 hover:text-primary-foreground ml-1 p-1"
                  title={darkMode ? "Modo claro" : "Modo noturno"}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {isMobile && (
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Link to="/messages" className="relative">
                  <Mail className="w-6 h-6 text-primary-foreground" />
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                </Link>
              )}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button className="bg-transparent border-none cursor-pointer p-1">
                    <Menu className="w-6 h-6 text-primary-foreground" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-primary border-primary/80 w-[280px] p-5">
                  <SheetTitle className="text-primary-foreground text-lg mb-4">Menu</SheetTitle>
                  <div className="relative mb-4">
                    <form onSubmit={handleSearch} className="flex items-center">
                      <input type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }} placeholder={t("search")} className="border border-border px-3 py-2 text-sm text-foreground bg-card flex-1 rounded-l-xl" />
                      <button type="submit" className="bg-secondary border border-border border-l-0 px-3 py-2 cursor-pointer flex items-center rounded-r-xl">
                        <Search className="w-5 h-5 text-foreground" />
                      </button>
                    </form>
                    <SuggestionsDropdown />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    {(["pt", "es", "en"] as Language[]).map((lang) => (
                      <button key={lang} onClick={() => setLanguage(lang)} className={`bg-transparent border-none cursor-pointer text-sm px-1.5 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/70 hover:underline"}`}>
                        {LANG_LABELS[lang]}
                      </button>
                    ))}
                    <button
                      onClick={toggleDarkMode}
                      className="bg-transparent border-none cursor-pointer text-primary-foreground/80 hover:text-primary-foreground ml-1 p-1"
                      title={darkMode ? "Modo claro" : "Modo noturno"}
                    >
                      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    {navLinks(() => setMenuOpen(false))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>

        {/* Desktop nav row */}
        {!isMobile && (
          <div className="flex items-center justify-end gap-4 text-sm mt-2 pt-2 border-t border-primary-foreground/15">
            {isLoggedIn && <span className="text-sm text-primary-foreground/90">{t("welcome")}, <b>{userName}</b></span>}
            {navLinks()}
          </div>
        )}
      </div>
    </div>
    <div style={{ height: headerHeight }} />
    </>
  );
};

export default FacebookHeader;