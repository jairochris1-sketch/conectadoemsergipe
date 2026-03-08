import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Mail, Menu, X } from "lucide-react";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useAdmin } from "@/hooks/useAdmin";
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
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = useAdmin();
  const { unreadCount } = useUnreadMessages();
  const { pendingCount: pendingReports } = useAdminReports();
  const isMobile = useIsMobile();

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
    <div className="bg-primary text-primary-foreground">
      <div className="max-w-[760px] mx-auto px-2 py-1">
        {/* Top row: logo + search */}
        <div className="flex items-center justify-between">
          <Link to="/" className="text-primary-foreground no-underline hover:no-underline shrink-0">
            <h1 className="text-[16px] sm:text-[20px] font-bold tracking-[-1px] leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              [ conectadosemsergipe ]
            </h1>
          </Link>

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
                
                {/* Mobile search */}
                <form onSubmit={handleSearch} className="flex items-center mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("search")}
                    className="border border-border px-2 py-1 text-[12px] text-foreground bg-card flex-1"
                  />
                  <button type="submit" className="bg-muted border border-border border-l-0 px-2 py-1 cursor-pointer flex items-center">
                    <Search className="w-3 h-3 text-foreground" />
                  </button>
                </form>

                {/* Language selector */}
                <div className="flex items-center gap-2 mb-4">
                  {(["pt", "es", "en"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`bg-transparent border-none cursor-pointer text-[11px] px-1 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/70 hover:underline"}`}
                    >
                      {LANG_LABELS[lang]}
                    </button>
                  ))}
                </div>

                {/* Nav links stacked */}
                <div className="flex flex-col gap-3">
                  {navLinks(() => setMenuOpen(false))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacebookHeader;
