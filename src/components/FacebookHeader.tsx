import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Menu, Sun, Moon, ArrowLeft, X, Plus } from "lucide-react";
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
  userPhoto?: string;
  onLogout?: () => void;
}

const LANG_LABELS: Record<Language, string> = { pt: "PT", es: "ES", en: "EN" };

const FacebookHeader = ({ isLoggedIn, userName, userPhoto, onLogout }: FacebookHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerImage, setBannerImage] = useState("");
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [suggestions, setSuggestions] = useState<{ user_id: string; name: string; photo_url: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (mobileSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [mobileSearchOpen]);

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
      setMobileSearchOpen(false);
    }
  };

  const handleSelectSuggestion = (userId: string) => {
    setShowSuggestions(false);
    setSearchQuery("");
    setMenuOpen(false);
    setMobileSearchOpen(false);
    navigate(`/user/${userId}`);
  };

  const SuggestionsDropdown = () => {
    if (!showSuggestions || suggestions.length === 0) return null;
    return (
      <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-50 mt-1 overflow-hidden">
        {suggestions.map((s) => (
          <button
            key={s.user_id}
            onClick={() => handleSelectSuggestion(s.user_id)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent bg-transparent border-none cursor-pointer"
          >
            <div className="w-[28px] h-[28px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 rounded-full">
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

  const mobileNavLinks = (onNav?: () => void) => (
    <>
      {isLoggedIn ? (
        <>
          <Link to="/" className="text-foreground text-sm hover:text-primary" onClick={onNav}>{t("home")}</Link>
          <Link to="/profile" className="text-foreground text-sm hover:text-primary" onClick={onNav}>{t("profile")}</Link>
          <Link to="/marketplace" className="text-foreground text-sm hover:text-primary" onClick={onNav}>{t("marketplace")}</Link>
          <Link to="/servicos" className="text-foreground text-sm hover:text-primary" onClick={onNav}>🛠️ Serviços</Link>
          <Link to="/messages" className="text-foreground text-sm hover:text-primary" onClick={onNav}>
            💬 {t("messages")}
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ml-1">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link to="/amigos" className="text-foreground text-sm hover:text-primary" onClick={onNav}>👥 Amigos</Link>
          <Link to="/notas" className="text-foreground text-sm hover:text-primary" onClick={onNav}>📝 Notas</Link>
          <Link to="/agenda-cultural" className="text-foreground text-sm hover:text-primary" onClick={onNav}>📅 Eventos</Link>
          {isAdmin && (
            <Link to="/admin" className="text-primary font-bold text-sm" onClick={onNav}>
              ⚙️ {t("admin.panel")}
              {pendingReports > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ml-1">
                  {pendingReports}
                </span>
              )}
            </Link>
          )}
          {isModerator && !isAdmin && (
            <Link to="/moderator" className="text-primary font-bold text-sm" onClick={onNav}>
              ⭐ Colaborador
            </Link>
          )}
          <button onClick={() => { onLogout?.(); onNav?.(); }} className="text-destructive bg-transparent border-none cursor-pointer text-sm text-left">
            {t("logout")}
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="text-foreground text-sm hover:text-primary" onClick={onNav}>{t("login")}</Link>
          <Link to="/register" className="text-foreground text-sm hover:text-primary" onClick={onNav}>{t("register")}</Link>
        </>
      )}
    </>
  );

  return (
    <div
      className="fixed top-0 left-0 w-full z-[1000] bg-card border-b border-border shadow-sm"
      style={bannerImage ? {
        backgroundImage: `linear-gradient(rgba(59,89,152,${overlayOpacity}), rgba(59,89,152,${overlayOpacity})), url(${bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      <div className="max-w-[1400px] mx-auto px-3 py-2">
        <div className="flex items-center gap-3">
          {/* Left: Back + Logo */}
          {isMobile && mobileSearchOpen ? (
            <div className="flex-1 flex items-center gap-2 relative" ref={suggestionsRef}>
              <form onSubmit={handleSearch} className="flex-1 flex items-center">
                <input
                  ref={mobileSearchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  placeholder={t("search") || "Buscar..."}
                  className="flex-1 border border-border px-3 py-1.5 text-sm text-foreground bg-background rounded-l-full"
                />
                <button type="submit" className="bg-primary border border-primary px-3 py-1.5 cursor-pointer flex items-center rounded-r-full">
                  <Search className="w-4 h-4 text-primary-foreground" />
                </button>
              </form>
              <button
                onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); setShowSuggestions(false); }}
                className="bg-transparent border-none cursor-pointer p-1 text-foreground shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
              <SuggestionsDropdown />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 shrink-0">
                {isMobile && location.pathname !== "/" && (
                  <button
                    onClick={() => navigate(-1)}
                    className="bg-transparent border-none cursor-pointer text-foreground p-0.5 flex items-center shrink-0"
                    aria-label="Voltar"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <Link to="/" className="no-underline hover:no-underline shrink-0">
                  <h1 className="text-[1rem] sm:text-[1.35rem] font-bold tracking-tight leading-tight text-primary" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                    Conectadoemsergipe
                  </h1>
                </Link>
              </div>

              {/* Center: Search bar (desktop only) */}
              {!isMobile && (
                <div className="flex-1 max-w-[480px] relative" ref={suggestionsRef}>
                  <form onSubmit={handleSearch} className="flex items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                        placeholder="Buscar pessoas, produtos ou serviços..."
                        className="w-full border border-border pl-9 pr-3 py-2 text-sm text-foreground bg-background rounded-full"
                      />
                    </div>
                  </form>
                  <SuggestionsDropdown />
                </div>
              )}

              {/* Right: Actions */}
              <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
                {/* Publish button (desktop) */}
                {!isMobile && isLoggedIn && (
                  <Link
                    to="/notas"
                    className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium no-underline hover:opacity-90 inline-flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Publicar
                  </Link>
                )}

                {/* Language + Dark mode (desktop) */}
                {!isMobile && (
                  <div className="flex items-center gap-0.5 ml-1">
                    {(["pt", "es", "en"] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`bg-transparent border-none cursor-pointer text-xs px-1.5 py-1 rounded-md ${language === lang ? "font-bold text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {LANG_LABELS[lang]}
                      </button>
                    ))}
                    <button
                      onClick={toggleDarkMode}
                      className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground p-1"
                      title={darkMode ? "Modo claro" : "Modo noturno"}
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {/* Mobile: search icon */}
                {isMobile && (
                  <button
                    onClick={() => setMobileSearchOpen(true)}
                    className="bg-transparent border-none cursor-pointer p-1.5 text-foreground"
                    aria-label="Buscar"
                  >
                    <Search className="w-[18px] h-[18px]" />
                  </button>
                )}

                {/* Notifications bell */}
                {isLoggedIn && (
                  <button className="bg-transparent border-none cursor-pointer p-1.5 text-muted-foreground hover:text-foreground relative">
                    <Bell className="w-[18px] h-[18px]" />
                  </button>
                )}

                {/* Messages badge */}
                {isLoggedIn && (
                  <Link to="/messages" className="relative p-1.5 text-muted-foreground hover:text-foreground">
                    <span className="text-base">💬</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User avatar (desktop) */}
                {!isMobile && isLoggedIn && (
                  <Link to="/profile" className="flex items-center gap-2 no-underline ml-1">
                    <div className="w-[32px] h-[32px] rounded-full overflow-hidden border-2 border-primary/30 bg-muted shrink-0">
                      {userPhoto ? (
                        <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="flex items-center justify-center h-full text-xs text-muted-foreground">👤</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate max-w-[100px]">{userName}</span>
                  </Link>
                )}

                {/* Desktop: logout/admin */}
                {!isMobile && isLoggedIn && (
                  <div className="flex items-center gap-1 ml-1">
                    {isAdmin && (
                      <Link to="/admin" className="text-xs text-primary font-bold hover:underline relative no-underline">
                        Admin
                        {pendingReports > 0 && (
                          <span className="absolute -top-1 -right-3 bg-destructive text-destructive-foreground text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                            {pendingReports}
                          </span>
                        )}
                      </Link>
                    )}
                    {isModerator && !isAdmin && (
                      <Link to="/moderator" className="text-xs text-primary font-bold no-underline">⭐</Link>
                    )}
                    <button onClick={onLogout} className="text-xs text-muted-foreground bg-transparent border-none cursor-pointer hover:text-destructive ml-1">
                      Sair
                    </button>
                  </div>
                )}

                {/* Desktop: login/register */}
                {!isMobile && !isLoggedIn && (
                  <div className="flex items-center gap-2 ml-1">
                    <Link to="/login" className="text-sm text-primary font-medium no-underline hover:underline">{t("login")}</Link>
                    <Link to="/register" className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium no-underline hover:opacity-90">{t("register")}</Link>
                  </div>
                )}

                {/* Mobile hamburger */}
                {isMobile && (
                  <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetTrigger asChild>
                      <button className="bg-transparent border-none cursor-pointer p-1.5">
                        <Menu className="w-[18px] h-[18px] text-foreground" />
                      </button>
                    </SheetTrigger>
                    <SheetContent side="right" className="bg-card border-border w-[280px] p-5">
                      <SheetTitle className="text-foreground text-lg mb-4">Menu</SheetTitle>
                      <div className="relative mb-4">
                        <form onSubmit={handleSearch} className="flex items-center">
                          <input type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }} placeholder={t("search")} className="border border-border px-3 py-2 text-sm text-foreground bg-background flex-1 rounded-l-full" />
                          <button type="submit" className="bg-primary border border-primary px-3 py-2 cursor-pointer flex items-center rounded-r-full">
                            <Search className="w-4 h-4 text-primary-foreground" />
                          </button>
                        </form>
                        <SuggestionsDropdown />
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        {(["pt", "es", "en"] as Language[]).map((lang) => (
                          <button key={lang} onClick={() => setLanguage(lang)} className={`bg-transparent border-none cursor-pointer text-sm px-1.5 ${language === lang ? "font-bold text-primary" : "text-muted-foreground"}`}>
                            {LANG_LABELS[lang]}
                          </button>
                        ))}
                        <button
                          onClick={toggleDarkMode}
                          className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground ml-1 p-1"
                        >
                          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                      </div>
                      <div className="flex flex-col gap-3">
                        {mobileNavLinks(() => setMenuOpen(false))}
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacebookHeader;
