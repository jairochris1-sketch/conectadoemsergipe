import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (birthdate) {
      const birth = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 16) {
        setError(t("register.min_age"));
        return;
      }
    }

    const result = await register(name, email, password, school, birthdate, city, phone || undefined);
    if (result) {
      navigate("/");
    } else {
      setError(t("register.email_exists"));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Cadastro" description="Crie sua conta no Conectados em Sergipe. Junte-se à rede social sergipana." path="/register" />
      <FacebookHeader isLoggedIn={false} />
      <div className="max-w-[400px] mx-auto mt-4 px-2">
        <div className="fb-box p-3">
          <h2 className="text-[13px] font-bold text-primary mb-2 border-b border-border pb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            {t("register.title")}
          </h2>
          <p className="text-[11px] text-muted-foreground mb-2">{t("register.description")}</p>
          {error && <p className="text-destructive text-[10px] mb-1">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-2 text-[11px]">
            <div>
              <label className="block font-bold mb-0.5">{t("register.full_name")}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-border p-[3px] text-[11px] bg-card" required />
            </div>
            <div>
              <label className="block font-bold mb-0.5">{t("register.email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-border p-[3px] text-[11px] bg-card" required />
            </div>
            <div>
              <label className="block font-bold mb-0.5">{t("register.phone")}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-border p-[3px] text-[11px] bg-card" placeholder={t("register.phone_placeholder")} />
            </div>
            <div>
              <label className="block font-bold mb-0.5">{t("register.birthdate")}</label>
              <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="w-full border border-border p-[3px] text-[11px] bg-card" required />
            </div>
            <div>
              <label className="block font-bold mb-0.5">{t("register.city")}</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-border p-[3px] text-[11px] bg-card" required>
                <option value="">{t("register.select_city")}</option>
                {SERGIPE_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold mb-0.5">{t("register.password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-border p-[3px] text-[11px] bg-card" required minLength={6} />
            </div>
            <div>
              <label className="block font-bold mb-0.5">{t("register.school")}</label>
              <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} className="w-full border border-border p-[3px] text-[11px] bg-card" required placeholder={t("register.school_placeholder")} />
            </div>
            <button type="submit" className="bg-primary text-primary-foreground border-none px-4 py-[4px] text-[11px] cursor-pointer font-bold hover:opacity-90">
              {t("register.submit")}
            </button>
          </form>
          <p className="mt-2 text-[11px]">
            {t("register.already")} <Link to="/login">{t("register.login_here")}</Link>
          </p>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Register;
