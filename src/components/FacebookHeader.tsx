import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Mail, Menu, Sun, Moon, ArrowLeft, Home, User, ChevronDown } from "lucide-react";
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
            className="flex items-center gap-2 w-full px-2 py-1.5 text-left hover:bg-accent bg-transparent border-none cursor-pointer"
          >
            <div className="w-[22px] h-[22px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
              {s.photo_url ? (
                <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[8px] text-muted-foreground">👤</span>
              )}
            </div>
            <span className="text-[11px] text-foreground font-medium truncate">{s.name}</span>
          </button>
        ))}
      </div>
    );
  };

  const navLinks = (onNav?: () => void) => (
    <>
      {isLoggedIn ? (
        <>
          <Link to="/" onClick={onNav} className="fb-nav-link">
            <Home className="w-3.5 h-3.5" /> {t("home")}
          </Link>
          <Link to="/profile" onClick={onNav} className="fb-nav-link">
            <User className="w-3.5 h-3.5" /> {t("profile")}
          </Link>
          <Link to="/marketplace" onClick={onNav} className="fb-nav-link">
            {t("marketplace")}
          </Link>
          <Link to="/messages" onClick={onNav} className="fb-nav-link relative">
            <Mail className="w-3.5 h-3.5" />
            {t("messages")}
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1 py-[1px] rounded-full leading-none ml-0.5">
                {unreadCount}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link to="/admin" onClick={onNav} className="fb-nav-link relative">
              {t("admin.panel")}
              {pendingReports > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1 py-[1px] rounded-full leading-none ml-0.5">
                  {pendingReports}
                </span>
              )}
            </Link>
          )}
          {isModerator && !isAdmin && (
            <Link to="/moderator" onClick={onNav} className="fb-nav-link">
              ⭐ Colaborador
            </Link>
          )}
          <button onClick={() => { onLogout?.(); onNav?.(); }} className="fb-nav-link bg-transparent border-none cursor-pointer text-left">
            {t("logout")}
          </button>
        </>
      ) : (
        <>
          <Link to="/login" onClick={onNav} className="fb-nav-link">{t("login")}</Link>
          <Link to="/register" onClick={onNav} className="fb-nav-link">{t("register")}</Link>
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
      <style>{`
        .fb-nav-link {
          color: hsl(var(--primary-foreground));
          font-size: 11px;
          font-weight: bold;
          padding: 4px 10px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          text-decoration: none;
          white-space: nowrap;
        }
        .fb-nav-link:hover {
          text-decoration: underline;
        }
        .fb-header-top {
          background: hsl(221 56% 41%);
          border-bottom: 1px solid hsl(221 44% 34%);
        }
        .dark .fb-header-top {
          background: hsl(221 50% 22%);
          border-bottom-color: hsl(221 44% 18%);
        }
        .fb-header-nav {
          background: hsl(221 44% 34%);
        }
        .dark .fb-header-nav {
          background: hsl(221 44% 18%);
        }
      `}</style>
      <div ref={headerRef} className="fixed top-0 left-0 w-full z-[1000]"
        style={bannerImage ? {
          backgroundImage: `linear-gradient(rgba(59,89,152,${overlayOpacity}), rgba(59,89,152,${overlayOpacity})), url(${bannerImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        } : undefined}
      >
        {/* Top bar: logo + search + account links */}
        <div className="fb-header-top">
          <div className="max-w-[980px] mx-auto px-2 flex items-center justify-between" style={{ height: '28px' }}>
            <div className="flex items-center gap-3">
              {isMobile && location.pathname !== "/" && (
                <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer text-primary-foreground p-0 flex items-center">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <Link to="/" className="text-primary-foreground no-underline hover:no-underline">
                <span className="text-[16px] font-bold tracking-[-0.5px]" style={{ fontFamily: 'klavika, Helvetica, Arial, sans-serif' }}>
                  conectadoemsergipe
                </span>
              </Link>
            </div>

            {!isMobile && (
              <div className="flex items-center gap-2">
                <div className="relative" ref={suggestionsRef}>
                  <form onSubmit={handleSearch} className="flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      placeholder={t("search")}
                      className="border border-border/50 px-1.5 py-[2px] text-[11px] text-foreground bg-card w-[140px] focus:w-[200px] transition-all"
                    />
                    <button type="submit" className="bg-card/80 border border-border/50 border-l-0 px-1.5 py-[2px] cursor-pointer flex items-center">
                      <Search className="w-3 h-3 text-foreground" />
                    </button>
                  </form>
                  <SuggestionsDropdown />
                </div>
                {isLoggedIn && (
                  <span className="text-primary-foreground text-[11px]">
                    {userName}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  {(["pt", "es", "en"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`bg-transparent border-none cursor-pointer text-[10px] px-1 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/60 hover:underline"}`}
                    >
                      {LANG_LABELS[lang]}
                    </button>
                  ))}
                  <button
                    onClick={toggleDarkMode}
                    className="bg-transparent border-none cursor-pointer text-primary-foreground/60 hover:text-primary-foreground ml-0.5 p-0"
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
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  </Link>
                )}
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="bg-transparent border-none cursor-pointer p-0">
                      <Menu className="w-4 h-4 text-primary-foreground" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-primary border-primary/80 w-[240px] p-4">
                    <SheetTitle className="text-primary-foreground text-sm mb-3">Menu</SheetTitle>
                    <div className="relative mb-3">
                      <form onSubmit={handleSearch} className="flex items-center">
                        <input type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }} placeholder={t("search")} className="border border-border px-2 py-1 text-[11px] text-foreground bg-card flex-1" />
                        <button type="submit" className="bg-muted border border-border border-l-0 px-2 py-1 cursor-pointer flex items-center">
                          <Search className="w-3 h-3 text-foreground" />
                        </button>
                      </form>
                      <SuggestionsDropdown />
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                      {(["pt", "es", "en"] as Language[]).map((lang) => (
                        <button key={lang} onClick={() => setLanguage(lang)} className={`bg-transparent border-none cursor-pointer text-[10px] px-1 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/60 hover:underline"}`}>
                          {LANG_LABELS[lang]}
                        </button>
                      ))}
                      <button
                        onClick={toggleDarkMode}
                        className="bg-transparent border-none cursor-pointer text-primary-foreground/60 hover:text-primary-foreground ml-1 p-0"
                      >
                        {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {navLinks(() => setMenuOpen(false))}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        </div>

        {/* Bottom nav bar — Facebook 2010 style */}
        {!isMobile && (
          <div className="fb-header-nav">
            <div className="max-w-[980px] mx-auto px-2 flex items-center" style={{ height: '22px' }}>
              {navLinks()}
            </div>
          </div>
        )}
      </div>
      <div style={{ height: headerHeight }} />
    </>
  );
};

export default FacebookHeader;
