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
  const { login } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

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
    <div className="min-h-screen bg-background">
      <SEOHead title="Entrar" description="Faça login no Conectados em Sergipe e conecte-se com pessoas de todo o estado." path="/login" />

      {/* Facebook 2010 top bar */}
      <div
        className="text-primary-foreground"
        style={{
          background: bannerImage
            ? `linear-gradient(rgba(59,89,152,${overlayOpacity}), rgba(59,89,152,${overlayOpacity})), url(${bannerImage}) center/cover no-repeat`
            : "linear-gradient(hsl(var(--primary)), hsl(var(--fb-header-dark)))",
          height: "40px",
          borderBottom: "1px solid rgba(0,0,0,0.3)",
        }}
      >
        <div className="h-full mx-auto flex items-center justify-between px-3" style={{ width: "980px", maxWidth: "100%" }}>
          <Link to="/" className="text-primary-foreground no-underline hover:no-underline">
            <span className="text-[20px] font-bold tracking-[-0.5px]" style={{ fontFamily: "klavika, 'Helvetica Neue', Helvetica, Arial, sans-serif", letterSpacing: "-1px" }}>
              conectadoemsergipe
            </span>
          </Link>
          <div className="flex items-center gap-3 text-[11px]">
            <Link to="/login" className="text-primary-foreground font-bold hover:underline">{t("login")}</Link>
            <Link to="/register" className="text-primary-foreground font-bold hover:underline">{t("register")}</Link>
            <Link to="/sobre" className="text-primary-foreground font-bold hover:underline">{t("login.about")}</Link>
            <span className="text-primary-foreground/40">·</span>
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
        </div>
      </div>

      {/* Main content — Facebook 2010 login layout */}
      <div className="mx-auto py-3 flex flex-col sm:flex-row gap-0 px-2" style={{ width: "980px", maxWidth: "100%" }}>
        {/* Left: Welcome text */}
        <div className="flex-1 pr-0 sm:pr-6 mb-4 sm:mb-0">
          <h2 className="text-[20px] font-bold text-primary mb-2" style={{ fontFamily: "klavika, 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
            {t("login.welcome_title")}
          </h2>
          <div className="text-[11px] text-foreground space-y-2">
            <p>{t("login.welcome_text")}</p>
            <p>{t("login.opened")} <b>Sergipe</b>.</p>
            <div>
              <p className="mb-1">{t("login.use_for")}</p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>{t("login.feature1")}</li>
                <li>{t("login.feature2")}</li>
                <li>{t("login.feature3")}</li>
                <li>{t("login.feature4")}</li>
              </ul>
            </div>
            <p>{t("login.get_started")}</p>
          </div>
        </div>

        {/* Right: Login form card */}
        <div className="w-full sm:w-[350px] shrink-0">
          <div className="bg-card border border-border p-3">
            <div className="border-b border-border pb-1.5 mb-2">
              <h3 className="text-[13px] font-bold text-primary">{t("login.welcome_bar")}</h3>
            </div>
            {!forgotMode ? (
              <form onSubmit={handleSubmit} className="space-y-2 text-[11px]">
                <div>
                  <label className="block font-bold mb-0.5">{t("login.email")}</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full border border-border p-1.5 text-[11px] bg-card"
                    placeholder={t("login.email_placeholder")}
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-0.5">{t("login.password")}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-border p-1.5 text-[11px] bg-card"
                    required
                  />
                </div>
                {error && <p className="text-destructive text-[10px]">{error}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="bg-primary text-primary-foreground border-none px-4 py-1.5 text-[11px] cursor-pointer font-bold hover:opacity-90">
                    {t("login")}
                  </button>
                  <button type="button" onClick={() => navigate("/register")} className="bg-muted border border-border px-3 py-1.5 text-[11px] cursor-pointer hover:opacity-90">
                    {t("register")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="bg-transparent border-none text-[10px] cursor-pointer underline hover:no-underline mt-1 p-0"
                  style={{ color: "hsl(var(--fb-link))" }}
                >
                  {t("login.forgot_password")}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-2 text-[11px]">
                <p className="font-bold">{t("login.forgot_title")}</p>
                <p className="text-[10px] text-muted-foreground">{t("login.forgot_text")}</p>
                <div>
                  <label className="block font-bold mb-0.5">Email:</label>
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full border border-border p-1.5 text-[11px] bg-card" required />
                </div>
                {forgotError && <p className="text-destructive text-[10px]">{forgotError}</p>}
                {forgotMessage && <p className="text-[10px] text-primary">{forgotMessage}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="bg-primary text-primary-foreground border-none px-4 py-1.5 text-[11px] cursor-pointer font-bold hover:opacity-90">{t("login.forgot_send")}</button>
                </div>
                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setForgotMessage(""); setForgotError(""); }}
                  className="bg-transparent border-none text-[10px] cursor-pointer underline hover:no-underline mt-1 p-0"
                  style={{ color: "hsl(var(--fb-link))" }}
                >
                  {t("login.forgot_back")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-muted-foreground py-4 border-t border-border mt-4 mx-auto" style={{ width: "980px", maxWidth: "100%" }}>
        <div className="flex justify-center gap-2 flex-wrap">
          <Link to="/sobre" className="hover:underline text-muted-foreground">{t("footer.about")}</Link>
          <span>·</span>
          <Link to="/page/contact" className="hover:underline text-muted-foreground">{t("footer.contact")}</Link>
          <span>·</span>
          <Link to="/page/privacy" className="hover:underline text-muted-foreground">{t("footer.privacy")}</Link>
          <span>·</span>
          <Link to="/page/terms" className="hover:underline text-muted-foreground">{t("footer.terms")}</Link>
        </div>
        <p className="mt-1">{t("footer.production")}</p>
        <p>Conectadoemsergipe © 2026</p>
      </div>
    </div>
  );
};

export default Login;
