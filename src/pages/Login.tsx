import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/context/LanguageContext";

const LANG_LABELS: Record<Language, string> = { pt: "PT", es: "ES", en: "EN" };

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate("/");
    } else {
      setError(t("login.invalid"));
    }
  };

  return (
    <div className="min-h-screen bg-card">
      <div className="bg-primary">
        <div className="max-w-[760px] mx-auto px-2 py-3 text-center">
          <h1
            className="text-[28px] font-bold text-primary-foreground tracking-[-1px]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            [ conectadosemsergipe ]
          </h1>
          <div className="flex justify-center gap-4 text-[11px] mt-1">
            <Link to="/login" className="text-primary-foreground">{t("login")}</Link>
            <Link to="/register" className="text-primary-foreground">{t("register")}</Link>
            <a href="#" className="text-primary-foreground">{t("login.about")}</a>
            <span className="text-primary-foreground/50">|</span>
            {(["pt", "es", "en"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`bg-transparent border-none cursor-pointer text-[11px] ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/70 hover:underline"}`}
              >
                {LANG_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-2 py-3 flex gap-0">
        <div className="w-[140px] shrink-0 border border-border bg-accent p-2 text-[11px]">
          <form onSubmit={handleSubmit} className="space-y-1">
            <div>
              <label className="block font-bold">{t("login.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border p-[2px] text-[11px] bg-card"
                required
              />
            </div>
            <div>
              <label className="block font-bold">{t("login.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border p-[2px] text-[11px] bg-card"
                required
              />
            </div>
            {error && <p className="text-destructive text-[10px]">{error}</p>}
            <div className="flex gap-1 pt-1">
              <button type="button" onClick={() => navigate("/register")} className="bg-muted border border-border px-2 py-[2px] text-[11px] cursor-pointer">
                {t("register")}
              </button>
              <button type="submit" className="bg-muted border border-border px-2 py-[2px] text-[11px] cursor-pointer">
                {t("login")}
              </button>
            </div>
          </form>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {t("login.demo")}:<br />mark@harvard.edu<br />facebook2004
          </p>
        </div>

        <div className="flex-1 border border-border border-l-0 bg-card p-4">
          <div className="border-b border-border pb-1 mb-3">
            <p className="text-[11px] text-primary font-bold">{t("login.welcome_bar")}</p>
          </div>

          <h2
            className="text-[18px] font-bold text-foreground mb-3 text-center"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {t("login.welcome_title")}
          </h2>

          <div className="text-[11px] text-foreground space-y-3 max-w-[480px] mx-auto">
            <p>{t("login.welcome_text")}</p>
            <p>{t("login.opened")} <b>Harvard University</b>.</p>
            <div>
              <p className="mb-1">{t("login.use_for")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("login.feature1")}</li>
                <li>{t("login.feature2")}</li>
                <li>{t("login.feature3")}</li>
                <li>{t("login.feature4")}</li>
              </ul>
            </div>
            <p>{t("login.get_started")}</p>
            <div className="flex justify-center gap-2 pt-2">
              <Link to="/register">
                <button className="bg-muted border border-border px-4 py-1 text-[11px] cursor-pointer font-bold">
                  {t("register")}
                </button>
              </Link>
              <button
                onClick={() => document.querySelector<HTMLInputElement>('input[type="email"]')?.focus()}
                className="bg-muted border border-border px-4 py-1 text-[11px] cursor-pointer font-bold"
              >
                {t("login")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <FacebookFooter />
    </div>
  );
};

export default Login;
