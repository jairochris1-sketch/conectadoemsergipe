import { useLanguage } from "@/context/LanguageContext";

interface ProfileSidebarProps {
  name: string;
  bio: string;
  photoUrl: string;
  school?: string;
  city?: string;
  birthdate?: string;
  createdAt?: string;
}

const ProfileSidebar = ({ name, bio, photoUrl, school, city, birthdate, createdAt }: ProfileSidebarProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-border p-3 w-full">
      <div className="border-b border-border pb-2 mb-3">
        <h3 className="text-lg font-bold text-primary">{name}</h3>
      </div>
      <div className="flex flex-col items-center gap-3">
        <img
          src={photoUrl}
          alt={name}
          className="w-[120px] h-[120px] border border-border object-cover rounded-sm"
        />
        <div className="text-sm w-full">
          {school && (
            <p className="mb-1"><b>{t("school")}:</b> {school}</p>
          )}
          {city && (
            <p className="mb-1"><b>{t("city")}:</b> {city}</p>
          )}
          {birthdate && (
            <p className="mb-1"><b>{t("birthdate")}:</b> {new Date(birthdate).toLocaleDateString()}</p>
          )}
          <p className="text-muted-foreground">{bio}</p>
        </div>
      </div>
      <div className="mt-3 border-t border-border pt-2 text-sm">
        <p className="font-bold text-primary mb-1">{t("sidebar.info")}</p>
        {createdAt && (
          <p>📅 {t("sidebar.member_since_label") || "Membro desde"}: {new Date(createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
        )}
        <p>{t("sidebar.status")}</p>
        <p>{t("sidebar.looking_for")}</p>
      </div>
    </div>
  );
};

export default ProfileSidebar;
