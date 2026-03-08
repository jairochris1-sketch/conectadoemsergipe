import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useAdmin } from "@/hooks/useAdmin";

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="max-w-[760px] mx-auto flex items-center justify-between px-2 py-1">
        <Link to="/" className="text-primary-foreground no-underline hover:no-underline">
          <h1 className="text-[20px] font-bold tracking-[-1px]" style={{ fontFamily: 'Georgia, serif' }}>
            [ conectadosemsergipe ]
          </h1>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center">
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

        <div className="flex items-center gap-3 text-[11px]">
          {/* Language selector */}
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

          {isLoggedIn ? (
            <>
              <span>{t("welcome")}, <b>{userName}</b></span>
              <Link to="/" className="text-primary-foreground">{t("home")}</Link>
              <Link to="/profile" className="text-primary-foreground">{t("profile")}</Link>
              <Link to="/marketplace" className="text-primary-foreground">{t("marketplace")}</Link>
              <button onClick={onLogout} className="text-primary-foreground bg-transparent border-none cursor-pointer text-[11px] hover:underline">
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-primary-foreground">{t("login")}</Link>
              <Link to="/register" className="text-primary-foreground">{t("register")}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacebookHeader;
