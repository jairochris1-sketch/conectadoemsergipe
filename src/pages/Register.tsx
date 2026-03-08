import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await register(name, email, password, school);
    if (result) {
      setSuccess(true);
    } else {
      setError(t("register.email_exists"));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={false} />
        <div className="max-w-[400px] mx-auto mt-8 px-2">
          <div className="bg-card border border-border p-4 text-center">
            <h2 className="text-[16px] font-bold text-primary mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              ✓ {t("register.submit")}
            </h2>
            <p className="text-[11px] text-foreground mb-3">
              Verifique seu email para confirmar o cadastro. Depois, faça login.
            </p>
            <Link to="/login" className="text-[11px] text-primary font-bold">{t("login")}</Link>
          </div>
        </div>
        <FacebookFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={false} />
      <div className="max-w-[400px] mx-auto mt-8 px-2">
        <div className="bg-card border border-border p-4">
          <h2 className="text-[16px] font-bold text-primary mb-3 border-b border-border pb-2" style={{ fontFamily: 'Georgia, serif' }}>
            {t("register.title")}
          </h2>
          <p className="text-[11px] text-muted-foreground mb-3">{t("register.description")}</p>
          {error && <p className="text-destructive text-[11px] mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
            <div>
              <label className="block font-bold mb-1">{t("register.full_name")}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-border p-1 text-[11px] bg-card" required />
            </div>
            <div>
              <label className="block font-bold mb-1">{t("register.email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-border p-1 text-[11px] bg-card" required />
            </div>
            <div>
              <label className="block font-bold mb-1">{t("register.password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-border p-1 text-[11px] bg-card" required minLength={6} />
            </div>
            <div>
              <label className="block font-bold mb-1">{t("register.school")}</label>
              <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} className="w-full border border-border p-1 text-[11px] bg-card" required placeholder={t("register.school_placeholder")} />
            </div>
            <button type="submit" className="bg-primary text-primary-foreground border-none px-4 py-1 text-[11px] cursor-pointer hover:opacity-90">
              {t("register.submit")}
            </button>
          </form>
          <p className="mt-3 text-[11px]">
            {t("register.already")} <Link to="/login">{t("register.login_here")}</Link>
          </p>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Register;
