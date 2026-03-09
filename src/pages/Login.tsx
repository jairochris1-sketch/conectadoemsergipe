import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, Language } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";

const LANG_LABELS: Record<Language, string> = { pt: "PT", es: "ES", en: "EN" };

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["login_banner", "header_overlay_opacity", "login_welcome_title", "login_welcome_text"])
      .then(({ data }) => {
        data?.forEach((row: any) => {
          if (row.key === "login_banner" && row.value) setBannerImage(row.value);
          if (row.key === "header_overlay_opacity" && row.value) setOverlayOpacity(Number(row.value) / 100);
          if (row.key === "login_welcome_title" && row.value) setCustomTitle(row.value);
          if (row.key === "login_welcome_text" && row.value) setCustomText(row.value);
        });
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const success = await login(identifier, password);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setForgotError(error.message);
    } else {
      setForgotMessage(t("login.forgot_sent"));
    }
  };

  return (
    <div className="min-h-screen bg-card">
      <SEOHead title="Entrar" description="Faça login no Conectados em Sergipe e conecte-se com pessoas de todo o estado." path="/login" />
      {/* Blue header bar */}
      <div
        className="bg-primary bg-cover bg-center bg-no-repeat"
        style={bannerImage ? {
          backgroundImage: `linear-gradient(rgba(59,89,152,${overlayOpacity}), rgba(59,89,152,${overlayOpacity})), url(${bannerImage})`,
        } : undefined}
      >
        <div className="max-w-[980px] mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
            <h1
              className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-[-1px]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Conectadoemsergipe
            </h1>
            <div className="flex items-center gap-4 text-sm flex-wrap justify-center">
              <Link to="/login" className="text-primary-foreground hover:underline">
                {t("login")}
              </Link>
              <Link to="/register" className="text-primary-foreground hover:underline">
                {t("register")}
              </Link>
              <Link to="/sobre" className="text-primary-foreground hover:underline">
                {t("login.about")}
              </Link>
              <span className="text-primary-foreground/50">|</span>
              {(["pt", "es", "en"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`bg-transparent border-none cursor-pointer text-sm ${
                    language === lang
                      ? "font-bold underline text-primary-foreground"
                      : "text-primary-foreground/70 hover:underline"
                  }`}
                >
                  {LANG_LABELS[lang]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-[980px] mx-auto px-4 py-6 flex flex-col sm:flex-row gap-0">
        {/* Left sidebar - login form */}
        <div className="w-full sm:w-[280px] shrink-0 border border-border bg-accent p-4">
          {!forgotMode ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-sm mb-1">{t("login.email")}</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full border border-border px-3 py-2 text-base bg-card rounded-sm"
                  placeholder={t("login.email_placeholder")}
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-sm mb-1">{t("login.password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-border px-3 py-2 text-base bg-card rounded-sm"
                  required
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="bg-muted border border-border px-4 py-2 text-sm cursor-pointer rounded-sm hover:opacity-90 font-medium"
                >
                  {t("register")}
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground border-none px-4 py-2 text-sm cursor-pointer rounded-sm hover:opacity-90 font-medium"
                >
                  {t("login")}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="bg-transparent border-none text-primary text-sm cursor-pointer underline hover:no-underline mt-1 p-0"
              >
                {t("login.forgot_password")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <p className="font-bold text-base">{t("login.forgot_title")}</p>
              <p className="text-sm text-muted-foreground">
                {t("login.forgot_text")}
              </p>
              <div>
                <label className="block font-bold text-sm mb-1">Email:</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full border border-border px-3 py-2 text-base bg-card rounded-sm"
                  required
                />
              </div>
              {forgotError && (
                <p className="text-destructive text-sm">{forgotError}</p>
              )}
              {forgotMessage && (
                <p className="text-sm text-primary">{forgotMessage}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground border-none px-4 py-2 text-sm cursor-pointer rounded-sm hover:opacity-90 font-medium"
                >
                  {t("login.forgot_send")}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setForgotMessage("");
                  setForgotError("");
                }}
                className="bg-transparent border-none text-primary text-sm cursor-pointer underline hover:no-underline mt-1 p-0"
              >
                {t("login.forgot_back")}
              </button>
            </form>
          )}
        </div>

        {/* Right content - Welcome */}
        <div className="flex-1 border border-border sm:border-l-0 bg-card p-6">
          <div className="border-b border-border pb-2 mb-4">
            <p className="text-sm text-primary font-bold">
              {t("login.welcome_bar")}
            </p>
          </div>
          <h2
            className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-center"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {t("login.welcome_title")}
          </h2>
          <div className="text-base text-foreground space-y-4 max-w-[520px] mx-auto">
            <p>{t("login.welcome_text")}</p>
            <p>
              {t("login.opened")} <b>Sergipe</b>.
            </p>
            <div>
              <p className="mb-2">{t("login.use_for")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("login.feature1")}</li>
                <li>{t("login.feature2")}</li>
                <li>{t("login.feature3")}</li>
                <li>{t("login.feature4")}</li>
              </ul>
            </div>
            <p>{t("login.get_started")}</p>
            <div className="flex justify-center gap-3 pt-3">
              <Link to="/register">
                <button className="bg-primary text-primary-foreground border-none px-6 py-2.5 text-base cursor-pointer font-bold rounded-sm hover:opacity-90">
                  {t("register")}
                </button>
              </Link>
              <button
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>('input[type="text"]')
                    ?.focus()
                }
                className="bg-muted border border-border px-6 py-2.5 text-base cursor-pointer font-bold rounded-sm hover:opacity-90"
              >
                {t("login")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-6 border-t border-border mt-4 max-w-[980px] mx-auto">
        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/sobre" className="hover:underline text-muted-foreground">
            {t("footer.about")}
          </Link>
          <span>·</span>
          <Link to="/page/contact" className="hover:underline text-muted-foreground">
            {t("footer.contact")}
          </Link>
          <span>·</span>
          <Link to="/page/privacy" className="hover:underline text-muted-foreground">
            {t("footer.privacy")}
          </Link>
          <span>·</span>
          <Link to="/page/terms" className="hover:underline text-muted-foreground">
            {t("footer.terms")}
          </Link>
        </div>
        <p className="mt-2">{t("footer.production")}</p>
        <p>Conectadoemsergipe © 2026</p>
      </div>
    </div>
  );
};

export default Login;
