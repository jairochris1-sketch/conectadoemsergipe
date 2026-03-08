import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/context/LanguageContext";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(t("reset.error"));
      return;
    }

    setMessage(t("reset.success"));
    setTimeout(() => navigate("/"), 2000);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <p className="text-[11px] text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      <SEOHead title="Redefinir Senha" description="Redefina sua senha no Conectados em Sergipe." path="/reset-password" />
      <div className="bg-primary">
        <div className="max-w-[760px] mx-auto px-2 py-3 text-center">
          <h1 className="text-[28px] font-bold text-primary-foreground tracking-[-1px]" style={{ fontFamily: "Georgia, serif" }}>
            Conectadoemsergipe
          </h1>
        </div>
      </div>

      <div className="max-w-[400px] mx-auto px-2 py-6">
        <div className="border border-border bg-accent p-4">
          <h2 className="text-[16px] font-bold text-foreground mb-3" style={{ fontFamily: "Georgia, serif" }}>
            {t("reset.title")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-2 text-[11px]">
            <div>
              <label className="block font-bold">{t("reset.new_password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border p-[4px] text-[11px] bg-card"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block font-bold">{t("reset.confirm")}</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-border p-[4px] text-[11px] bg-card"
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-destructive text-[10px]">{error}</p>}
            {message && <p className="text-green-600 text-[10px]">{message}</p>}
            <button type="submit" className="bg-muted border border-border px-4 py-1 text-[11px] cursor-pointer font-bold">
              {t("reset.submit")}
            </button>
          </form>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default ResetPassword;
