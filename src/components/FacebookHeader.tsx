import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Mail } from "lucide-react";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAdminReports } from "@/hooks/useAdminReports";

interface FacebookHeaderProps {
  isLoggedIn: boolean;
  userName?: string;
  onLogout?: () => void;
}

const LANG_LABELS: Record<Language, string> = { pt: "PT", es: "ES", en: "EN" };

const FacebookHeader = ({ isLoggedIn, userName, onLogout }: FacebookHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = useAdmin();
  const { unreadCount } = useUnreadMessages();
  const { pendingCount: pendingReports } = useAdminReports();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-primary text-primary-foreground" style={{ height: 42 }}>
      <div className="max-w-[980px] mx-auto flex items-center justify-between px-2 h-full gap-3" style={{ whiteSpace: "nowrap" }}>
        {/* Left: Site name */}
        <Link to="/" className="text-primary-foreground no-underline hover:no-underline shrink-0">
          <h1 className="text-[18px] font-bold tracking-[-1px] m-0" style={{ fontFamily: 'Georgia, serif' }}>
            conectadosemsergipe
          </h1>
        </Link>

        {/* Center: Search bar */}
        <form onSubmit={handleSearch} className="flex items-center shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search")}
            className="border border-border px-1 py-[2px] text-[11px] text-foreground bg-card w-[140px]"
          />
          <button type="submit" className="bg-muted border border-border border-l-0 px-1 py-[2px] cursor-pointer flex items-center">
            <Search className="w-3 h-3 text-foreground" />
          </button>
        </form>

        {/* Right: Lang + Welcome + Nav */}
        <div className="flex items-center gap-2 text-[11px] shrink-0 overflow-hidden">
          {/* Language selector */}
          <div className="flex items-center gap-0.5 shrink-0">
            {(["pt", "es", "en"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`bg-transparent border-none cursor-pointer text-[10px] px-0.5 ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/70 hover:underline"}`}
              >
                {LANG_LABELS[lang]}
              </button>
            ))}
          </div>

          {isLoggedIn ? (
            <>
              <span className="shrink-0">{t("welcome")}, <b>{userName}</b></span>
              <span className="text-primary-foreground/40 shrink-0">|</span>
              <Link to="/" className="text-primary-foreground hover:underline shrink-0">{t("home")}</Link>
              <Link to="/profile" className="text-primary-foreground hover:underline shrink-0">{t("profile")}</Link>
              <Link to="/marketplace" className="text-primary-foreground hover:underline shrink-0">{t("marketplace")}</Link>
              <Link to="/messages" className="text-primary-foreground hover:underline relative inline-flex items-center gap-[2px] shrink-0">
                <Mail className="w-3 h-3" />
                {t("messages")}
                {unreadCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[8px] font-bold px-[4px] py-[1px] rounded-full leading-none">
                    {unreadCount}
                  </span>
                )}
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-primary-foreground font-bold hover:underline relative inline-flex items-center gap-[2px] shrink-0">
                  {t("admin.panel")}
                  {pendingReports > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[8px] font-bold px-[4px] py-[1px] rounded-full leading-none">
                      {pendingReports}
                    </span>
                  )}
                </Link>
              )}
              <button onClick={onLogout} className="text-primary-foreground bg-transparent border-none cursor-pointer text-[11px] hover:underline shrink-0">
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-primary-foreground hover:underline shrink-0">{t("login")}</Link>
              <Link to="/register" className="text-primary-foreground hover:underline shrink-0">{t("register")}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacebookHeader;
