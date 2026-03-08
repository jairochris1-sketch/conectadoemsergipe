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
    <div className="max-w-[980px] mx-auto text-center text-[10px] text-muted-foreground py-3 border-t border-border mt-2">
      {onlineCount !== null && (
        <p className="mb-1 flex items-center justify-center gap-1">
          <span className="inline-block w-[6px] h-[6px] rounded-full bg-green-500" />
          {onlineCount} {onlineCount === 1 ? "usuário online" : "usuários online"}
        </p>
      )}
      <p>
        <Link to="/sobre" className="hover:underline">{t("footer.about")}</Link> ·{" "}
        <Link to="/page/contact" className="hover:underline">{t("footer.contact")}</Link> ·{" "}
        <Link to="/page/privacy" className="hover:underline">{t("footer.privacy")}</Link> ·{" "}
        <Link to="/page/terms" className="hover:underline">{t("footer.terms")}</Link>
      </p>
      <p className="mt-1">{t("footer.production")}</p>
      <p>conectadoemsergipe © 2026</p>
    </div>
  );
};

export default FacebookFooter;
