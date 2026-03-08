import { useLanguage } from "@/context/LanguageContext";

const FacebookFooter = () => {
  const { t } = useLanguage();

  return (
    <div className="text-center text-[10px] text-muted-foreground py-4 border-t border-border mt-4">
      <p>{t("footer.production")}</p>
      <p className="mt-1">
        <a href="#">{t("footer.about")}</a> · <a href="#">{t("footer.contact")}</a> · <a href="#">{t("footer.privacy")}</a> · <a href="#">{t("footer.terms")}</a>
      </p>
      <p className="mt-1">thefacebook © 2004</p>
    </div>
  );
};

export default FacebookFooter;
