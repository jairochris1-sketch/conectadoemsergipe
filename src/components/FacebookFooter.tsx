import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const FacebookFooter = () => {
  const { t } = useLanguage();

  return (
    <div className="text-center text-[10px] text-muted-foreground py-4 border-t border-border mt-4">
      <p>{t("footer.production")}</p>
      <p className="mt-1">
        <Link to="/page/about" className="hover:underline">{t("footer.about")}</Link> ·{" "}
        <Link to="/page/contact" className="hover:underline">{t("footer.contact")}</Link> ·{" "}
        <Link to="/page/privacy" className="hover:underline">{t("footer.privacy")}</Link> ·{" "}
        <Link to="/page/terms" className="hover:underline">{t("footer.terms")}</Link>
      </p>
      <p className="mt-1">conectadoemsergipe © 2026</p>
    </div>
  );
};

export default FacebookFooter;
