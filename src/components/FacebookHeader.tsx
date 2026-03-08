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
            <div className="w-[22px] h-[22px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
              {s.photo_url ? (
                <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[9px] text-muted-foreground">👤</span>
              )}
            </div>
            <span className="text-[11px] text-foreground font-medium truncate">{s.name}</span>
          </button>
        ))}
      </div>
    );
  };

  /* ── MOBILE ── */
  if (isMobile) {
    return (
      <>
        <div
          className="fixed top-0 left-0 w-full z-[1000] text-primary-foreground"
          style={{
            background: bannerImage
              ? `linear-gradient(rgba(59,89,152,${overlayOpacity}), rgba(59,89,152,${overlayOpacity})), url(${bannerImage}) center/cover no-repeat`
              : "hsl(var(--primary))",
            height: "40px",
          }}
        >
          <div className="h-full flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              {location.pathname !== "/" && (
                <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer text-primary-foreground p-0 flex items-center" aria-label="Voltar">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <Link to="/" className="text-primary-foreground no-underline hover:no-underline font-bold text-[14px]" style={{ fontFamily: "klavika, 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                conectadoemsergipe
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Link to="/messages" className="relative text-primary-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[9px] font-bold w-[14px] h-[14px] rounded-full flex items-center justify-center leading-none">
                    {unreadCount}
                  </span>
                </Link>
              )}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button className="bg-transparent border-none cursor-pointer p-0 text-primary-foreground">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-primary border-primary/80 w-[260px] p-4">
                  <SheetTitle className="text-primary-foreground text-sm mb-3">Menu</SheetTitle>
                  <div className="relative mb-3">
                    <form onSubmit={handleSearch} className="flex items-center">
                      <input type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }} placeholder={t("search")} className="border border-border px-2 py-1 text-[11px] text-foreground bg-card flex-1" />
                      <button type="submit" className="bg-muted border border-border border-l-0 px-2 py-1 cursor-pointer flex items-center">
                        <Search className="w-3.5 h-3.5 text-foreground" />
                      </button>
                    </form>
                    <SuggestionsDropdown />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {(["pt", "es", "en"] as Language[]).map((lang) => (
                      <button key={lang} onClick={() => setLanguage(lang)} className={`bg-transparent border-none cursor-pointer text-[10px] px-1 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/70 hover:underline"}`}>
                        {LANG_LABELS[lang]}
                      </button>
                    ))}
                    <button onClick={toggleDarkMode} className="bg-transparent border-none cursor-pointer text-primary-foreground/80 hover:text-primary-foreground ml-1 p-0" title={darkMode ? "Modo claro" : "Modo noturno"}>
                      {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {isLoggedIn ? (
                      <>
                        <Link to="/" className="text-primary-foreground text-[12px] hover:underline" onClick={() => setMenuOpen(false)}>{t("home")}</Link>
                        <Link to="/profile" className="text-primary-foreground text-[12px] hover:underline" onClick={() => setMenuOpen(false)}>{t("profile")}</Link>
                        <Link to="/marketplace" className="text-primary-foreground text-[12px] hover:underline" onClick={() => setMenuOpen(false)}>{t("marketplace")}</Link>
                        <Link to="/messages" className="text-primary-foreground relative inline-flex items-center gap-1 text-[12px] hover:underline" onClick={() => setMenuOpen(false)}>
                          {t("messages")}
                          {unreadCount > 0 && <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">{unreadCount}</span>}
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" className="text-primary-foreground font-bold relative inline-flex items-center gap-1 text-[12px] hover:underline" onClick={() => setMenuOpen(false)}>
                            {t("admin.panel")}
                            {pendingReports > 0 && <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">{pendingReports}</span>}
                          </Link>
                        )}
                        {isModerator && !isAdmin && (
                          <Link to="/moderator" className="text-primary-foreground font-bold text-[12px] hover:underline" onClick={() => setMenuOpen(false)}>⭐ Colaborador</Link>
                        )}
                        <button onClick={() => { onLogout?.(); setMenuOpen(false); }} className="text-primary-foreground bg-transparent border-none cursor-pointer text-[12px] hover:underline text-left">{t("logout")}</button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className="text-primary-foreground text-[12px] hover:underline" onClick={() => setMenuOpen(false)}>{t("login")}</Link>
                        <Link to="/register" className="text-primary-foreground text-[12px] hover:underline" onClick={() => setMenuOpen(false)}>{t("register")}</Link>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        <div style={{ height: 40 }} />
      </>
    );
  }

  /* ── DESKTOP — Facebook 2010 style ── */
  return (
    <>
      <div
        className="fixed top-0 left-0 w-full z-[1000] text-primary-foreground"
        style={{
          background: bannerImage
            ? `linear-gradient(rgba(59,89,152,${overlayOpacity}), rgba(59,89,152,${overlayOpacity})), url(${bannerImage}) center/cover no-repeat`
            : "linear-gradient(hsl(var(--primary)), hsl(var(--fb-header-dark)))",
          height: "40px",
          borderBottom: "1px solid rgba(0,0,0,0.3)",
        }}
      >
        <div className="h-full mx-auto flex items-center justify-between" style={{ width: "980px", maxWidth: "100%" }}>
          {/* Left: Logo */}
          <Link to="/" className="text-primary-foreground no-underline hover:no-underline shrink-0">
            <span className="text-[20px] font-bold tracking-[-0.5px] leading-none" style={{ fontFamily: "klavika, 'Helvetica Neue', Helvetica, Arial, sans-serif", letterSpacing: "-1px" }}>
              conectadoemsergipe
            </span>
          </Link>

          {/* Center: Search */}
          <div className="relative mx-4 flex-shrink-0" ref={suggestionsRef}>
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder={t("search")}
                className="border border-[hsl(220_20%_60%)] px-2 py-[3px] text-[11px] text-foreground bg-card w-[170px] focus:w-[220px] transition-all duration-200"
                style={{ borderRadius: "2px" }}
              />
              <button type="submit" className="bg-muted border border-[hsl(220_20%_60%)] border-l-0 px-2 py-[3px] cursor-pointer flex items-center" style={{ borderRadius: "0 2px 2px 0" }}>
                <Search className="w-[14px] h-[14px] text-muted-foreground" />
              </button>
            </form>
            <SuggestionsDropdown />
          </div>

          {/* Right: Nav links */}
          <div className="flex items-center gap-1">
            {isLoggedIn ? (
              <>
                <span className="text-[11px] text-primary-foreground/90 mr-1">{userName}</span>
                <Link to="/" className="text-primary-foreground text-[11px] font-bold hover:underline px-1.5 py-1">{t("home")}</Link>
                <Link to="/profile" className="text-primary-foreground text-[11px] font-bold hover:underline px-1.5 py-1">{t("profile")}</Link>
                <Link to="/marketplace" className="text-primary-foreground text-[11px] font-bold hover:underline px-1.5 py-1">{t("marketplace")}</Link>
                <Link to="/messages" className="text-primary-foreground relative inline-flex items-center gap-0.5 text-[11px] font-bold hover:underline px-1.5 py-1">
                  <Mail className="w-[14px] h-[14px]" />
                  {unreadCount > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1 rounded-full leading-none">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-primary-foreground font-bold relative inline-flex items-center gap-0.5 text-[11px] hover:underline px-1.5 py-1">
                    Admin
                    {pendingReports > 0 && (
                      <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1 rounded-full leading-none">
                        {pendingReports}
                      </span>
                    )}
                  </Link>
                )}
                {isModerator && !isAdmin && (
                  <Link to="/moderator" className="text-primary-foreground font-bold text-[11px] hover:underline px-1.5 py-1">⭐</Link>
                )}
                <span className="text-primary-foreground/40 mx-0.5">·</span>
                <button onClick={onLogout} className="text-primary-foreground bg-transparent border-none cursor-pointer text-[11px] font-bold hover:underline px-1.5 py-1">
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-primary-foreground text-[11px] font-bold hover:underline px-1.5 py-1">{t("login")}</Link>
                <Link to="/register" className="text-primary-foreground text-[11px] font-bold hover:underline px-1.5 py-1">{t("register")}</Link>
              </>
            )}
            <span className="text-primary-foreground/40 mx-0.5">·</span>
            <div className="flex items-center gap-0.5">
              {(["pt", "es", "en"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`bg-transparent border-none cursor-pointer text-[10px] px-1 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/70 hover:underline"}`}
                >
                  {LANG_LABELS[lang]}
                </button>
              ))}
            </div>
            <button
              onClick={toggleDarkMode}
              className="bg-transparent border-none cursor-pointer text-primary-foreground/80 hover:text-primary-foreground ml-1 p-0.5"
              title={darkMode ? "Modo claro" : "Modo noturno"}
            >
              {darkMode ? <Sun className="w-[14px] h-[14px]" /> : <Moon className="w-[14px] h-[14px]" />}
            </button>
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </>
  );
};

export default FacebookHeader;
