import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, Language } from "@/context/LanguageContext";

const LANG_LABELS: Record<Language, string> = { pt: "PT", es: "ES", en: "EN" };

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const success = await login(identifier, password);
      console.log("Login result:", success);
      if (success) {
        navigate("/");
      } else {
        setError(t("login.invalid"));
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(t("login.invalid"));
    }
  };

  return (
    <div className="min-h-screen bg-card">
      <div className="bg-primary">
        <div className="max-w-[760px] mx-auto px-2 py-3 text-center">
          <h1 className="text-[28px] font-bold text-primary-foreground tracking-[-1px]" style={{ fontFamily: "Georgia, serif" }}>
            [ conectadosemsergipe ]
          </h1>
          <div className="flex justify-center gap-4 text-[11px] mt-1">
            <Link to="/login" className="text-primary-foreground">{t("login")}</Link>
            <Link to="/register" className="text-primary-foreground">{t("register")}</Link>
            <a href="#" className="text-primary-foreground">{t("login.about")}</a>
            <span className="text-primary-foreground/50">|</span>
            {(["pt", "es", "en"] as Language[]).map((lang) => (
              <button key={lang} onClick={() => setLanguage(lang)} className={`bg-transparent border-none cursor-pointer text-[11px] ${language === lang ? "font-bold underline text-primary-foreground" : "text-primary-foreground/70 hover:underline"}`}>
                {LANG_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-2 py-3 flex gap-0">
        <div className="w-[160px] shrink-0 border border-border bg-accent p-2 text-[11px]">
          <form onSubmit={handleSubmit} className="space-y-1">
            <div>
              <label className="block font-bold">{t("login.email")}</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border border-border p-[2px] text-[11px] bg-card"
                placeholder={t("login.email_placeholder")}
                required
              />
            </div>
            <div>
              <label className="block font-bold">{t("login.password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-border p-[2px] text-[11px] bg-card" required />
            </div>
            {error && <p className="text-destructive text-[10px]">{error}</p>}
            <div className="flex gap-1 pt-1">
              <button type="button" onClick={() => navigate("/register")} className="bg-muted border border-border px-2 py-[2px] text-[11px] cursor-pointer">{t("register")}</button>
              <button type="submit" className="bg-muted border border-border px-2 py-[2px] text-[11px] cursor-pointer">{t("login")}</button>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <button
                type="button"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) setError(String(error));
                }}
                className="w-full bg-card border border-border px-2 py-1 text-[10px] cursor-pointer hover:bg-muted flex items-center justify-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
            </div>
          </form>
        </div>

        <div className="flex-1 border border-border border-l-0 bg-card p-4">
          <div className="border-b border-border pb-1 mb-3">
            <p className="text-[11px] text-primary font-bold">{t("login.welcome_bar")}</p>
          </div>
          <h2 className="text-[18px] font-bold text-foreground mb-3 text-center" style={{ fontFamily: "Georgia, serif" }}>
            {t("login.welcome_title")}
          </h2>
          <div className="text-[11px] text-foreground space-y-3 max-w-[480px] mx-auto">
            <p>{t("login.welcome_text")}</p>
            <p>{t("login.opened")} <b>Sergipe</b>.</p>
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
                <button className="bg-muted border border-border px-4 py-1 text-[11px] cursor-pointer font-bold">{t("register")}</button>
              </Link>
              <button onClick={() => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()} className="bg-muted border border-border px-4 py-1 text-[11px] cursor-pointer font-bold">
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
