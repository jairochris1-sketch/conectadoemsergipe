import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const OFFLINE_THRESHOLD = 45_000;

const FacebookFooter = () => {
  const { t } = useLanguage();
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      const threshold = new Date(Date.now() - OFFLINE_THRESHOLD).toISOString();
      const { count } = await supabase
        .from("user_presence")
        .select("*", { count: "exact", head: true })
        .eq("is_online", true)
        .gte("last_seen_at", threshold);
      setOnlineCount(count ?? 0);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="max-w-[1240px] mx-auto mt-8 mb-4 px-4">
      <div className="text-center text-xs text-muted-foreground py-5 border border-border rounded-2xl bg-card shadow-sm">
        {onlineCount !== null && (
          <p className="mb-1.5 flex items-center justify-center gap-1.5">
            <span className="inline-block w-[8px] h-[8px] rounded-full bg-primary" />
            {onlineCount} {onlineCount === 1 ? "usuário online" : "usuários online"}
          </p>
        )}
        <p>{t("footer.production")}</p>
        <p className="mt-1.5">
          <Link to="/sobre" className="text-primary hover:underline">{t("footer.about")}</Link> ·{" "}
          <Link to="/page/contact" className="text-primary hover:underline">{t("footer.contact")}</Link> ·{" "}
          <Link to="/page/privacy" className="text-primary hover:underline">{t("footer.privacy")}</Link> ·{" "}
          <Link to="/page/terms" className="text-primary hover:underline">{t("footer.terms")}</Link>
        </p>
        <p className="mt-1.5">conectadoemsergipe © 2026</p>
      </div>
    </footer>
  );
};

export default FacebookFooter;
