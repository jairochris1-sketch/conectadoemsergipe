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
      <div className="absolute top-full left-0 right-0 bg-card border border-border shadow-lg z-50 mt-[1px]">
        {suggestions.map((s) => (
          <button
            key={s.user_id}
            onClick={() => handleSelectSuggestion(s.user_id)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-accent bg-transparent border-none cursor-pointer"
          >
            <div className="w-[24px] h-[24px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
              {s.photo_url ? (
                <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[9px] text-muted-foreground">👤</span>
              )}
            </div>
            <span className="text-[12px] text-foreground font-medium truncate">{s.name}</span>
          </button>
        ))}
      </div>
    );
  };

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
        className="fixed top-0 left-0 w-full z-[1000]"
        style={bannerImage ? {
          backgroundImage: `linear-gradient(rgba(59,89,152,${overlayOpacity}), rgba(59,89,152,${overlayOpacity})), url(${bannerImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : undefined}
      >
        {/* Top blue bar */}
        <div className="bg-primary text-primary-foreground" style={bannerImage ? { background: 'transparent' } : undefined}>
          <div className="max-w-[980px] mx-auto px-3 h-[42px] flex items-center justify-between">
            {/* Left: logo + search */}
            <div className="flex items-center gap-3">
              {isMobile && location.pathname !== "/" && (
                <button
                  onClick={() => navigate(-1)}
                  className="bg-transparent border-none cursor-pointer text-primary-foreground p-0.5 flex items-center"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <Link to="/" className="text-primary-foreground no-underline hover:no-underline shrink-0">
                <span className="text-[20px] font-bold tracking-[-0.5px]" style={{ fontFamily: "'klavika', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                  conectadoemsergipe
                </span>
              </Link>

              {!isMobile && (
                <div className="relative ml-2" ref={suggestionsRef}>
                  <form onSubmit={handleSearch} className="flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      placeholder={t("search")}
                      className="border border-primary-foreground/30 px-2 py-[4px] text-[12px] text-foreground bg-card w-[170px] rounded-sm"
                    />
                    <button type="submit" className="bg-muted border border-border border-l-0 px-2 py-[4px] cursor-pointer flex items-center rounded-r-sm">
                      <Search className="w-[14px] h-[14px] text-muted-foreground" />
                    </button>
                  </form>
                  <SuggestionsDropdown />
                </div>
              )}
            </div>

            {/* Right: nav links */}
            {!isMobile && (
              <div className="flex items-center gap-3 text-[12px]">
                {isLoggedIn ? (
                  <>
                    <Link to="/" className="text-primary-foreground hover:underline font-bold">{t("home")}</Link>
                    <Link to="/profile" className="text-primary-foreground hover:underline">{t("profile")}</Link>
                    <Link to="/marketplace" className="text-primary-foreground hover:underline">{t("marketplace")}</Link>
                    <Link to="/messages" className="text-primary-foreground hover:underline relative inline-flex items-center gap-1">
                      <Mail className="w-[14px] h-[14px]" />
                      {unreadCount > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1 py-0.5 rounded-sm leading-none">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="text-primary-foreground font-bold hover:underline relative inline-flex items-center gap-1">
                        Admin
                        {pendingReports > 0 && (
                          <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1 py-0.5 rounded-sm leading-none">
                            {pendingReports}
                          </span>
                        )}
                      </Link>
                    )}
                    {isModerator && !isAdmin && (
                      <Link to="/moderator" className="text-primary-foreground font-bold hover:underline">⭐ Mod</Link>
                    )}
                    <span className="text-primary-foreground/70">|</span>
                    <span className="text-primary-foreground/90 text-[11px]">{userName}</span>
                    <button onClick={onLogout} className="text-primary-foreground bg-transparent border-none cursor-pointer text-[12px] hover:underline">
                      {t("logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-primary-foreground hover:underline">{t("login")}</Link>
                    <Link to="/register" className="text-primary-foreground hover:underline">{t("register")}</Link>
                  </>
                )}
                <span className="text-primary-foreground/40">|</span>
                {(["pt", "es", "en"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`bg-transparent border-none cursor-pointer text-[11px] px-0.5 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/60 hover:underline"}`}
                  >
                    {LANG_LABELS[lang]}
                  </button>
                ))}
                <button
                  onClick={toggleDarkMode}
                  className="bg-transparent border-none cursor-pointer text-primary-foreground/70 hover:text-primary-foreground p-0.5"
                  title={darkMode ? "Modo claro" : "Modo noturno"}
                >
                  {darkMode ? <Sun className="w-[14px] h-[14px]" /> : <Moon className="w-[14px] h-[14px]" />}
                </button>
              </div>
            )}

            {/* Mobile controls */}
            {isMobile && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Link to="/messages" className="relative">
                    <Mail className="w-5 h-5 text-primary-foreground" />
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  </Link>
                )}
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="bg-transparent border-none cursor-pointer p-0.5">
                      <Menu className="w-5 h-5 text-primary-foreground" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-primary border-primary/80 w-[260px] p-4">
                    <SheetTitle className="text-primary-foreground text-sm mb-3">Menu</SheetTitle>
                    <div className="relative mb-3">
                      <form onSubmit={handleSearch} className="flex items-center">
                        <input type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }} placeholder={t("search")} className="border border-border px-2 py-1.5 text-[12px] text-foreground bg-card flex-1 rounded-sm" />
                        <button type="submit" className="bg-muted border border-border border-l-0 px-2 py-1.5 cursor-pointer flex items-center rounded-r-sm">
                          <Search className="w-[14px] h-[14px] text-muted-foreground" />
                        </button>
                      </form>
                      <SuggestionsDropdown />
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                      {(["pt", "es", "en"] as Language[]).map((lang) => (
                        <button key={lang} onClick={() => setLanguage(lang)} className={`bg-transparent border-none cursor-pointer text-[11px] px-1 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/60 hover:underline"}`}>
                          {LANG_LABELS[lang]}
                        </button>
                      ))}
                      <button onClick={toggleDarkMode} className="bg-transparent border-none cursor-pointer text-primary-foreground/70 hover:text-primary-foreground ml-1 p-0.5">
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex flex-col gap-3 text-[13px]">
                      {isLoggedIn ? (
                        <>
                          <Link to="/" className="text-primary-foreground hover:underline" onClick={() => setMenuOpen(false)}>{t("home")}</Link>
                          <Link to="/profile" className="text-primary-foreground hover:underline" onClick={() => setMenuOpen(false)}>{t("profile")}</Link>
                          <Link to="/marketplace" className="text-primary-foreground hover:underline" onClick={() => setMenuOpen(false)}>{t("marketplace")}</Link>
                          <Link to="/messages" className="text-primary-foreground hover:underline inline-flex items-center gap-1" onClick={() => setMenuOpen(false)}>
                            <Mail className="w-4 h-4" /> {t("messages")}
                            {unreadCount > 0 && <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1 py-0.5 rounded-sm">{unreadCount}</span>}
                          </Link>
                          {isAdmin && <Link to="/admin" className="text-primary-foreground font-bold hover:underline" onClick={() => setMenuOpen(false)}>Admin</Link>}
                          {isModerator && !isAdmin && <Link to="/moderator" className="text-primary-foreground font-bold hover:underline" onClick={() => setMenuOpen(false)}>⭐ Mod</Link>}
                          <button onClick={() => { onLogout?.(); setMenuOpen(false); }} className="text-primary-foreground bg-transparent border-none cursor-pointer hover:underline text-left text-[13px]">{t("logout")}</button>
                        </>
                      ) : (
                        <>
                          <Link to="/login" className="text-primary-foreground hover:underline" onClick={() => setMenuOpen(false)}>{t("login")}</Link>
                          <Link to="/register" className="text-primary-foreground hover:underline" onClick={() => setMenuOpen(false)}>{t("register")}</Link>
                        </>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ height: headerHeight }} />
    </>
  );
};

export default FacebookHeader;
