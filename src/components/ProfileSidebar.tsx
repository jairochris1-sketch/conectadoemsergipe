import { useLanguage } from "@/context/LanguageContext";

interface ProfileSidebarProps {
  name: string;
  bio: string;
  photoUrl: string;
  school?: string;
  city?: string;
  birthdate?: string;
}

const ProfileSidebar = ({ name, bio, photoUrl, school, city, birthdate }: ProfileSidebarProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-border p-2 w-full">
      <div className="border-b border-border pb-1 mb-2">
        <h3 className="text-[13px] font-bold text-primary">{name}</h3>
      </div>
      <div className="flex flex-col items-center gap-2">
        <img
          src={photoUrl}
          alt={name}
          className="w-[100px] h-[100px] border border-border object-cover"
        />
        <div className="text-[11px] w-full">
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
      <div className="mt-3 border-t border-border pt-2 text-[11px]">
        <p className="font-bold text-primary mb-1">{t("sidebar.info")}</p>
        <p>{t("sidebar.member_since")}</p>
        <p>{t("sidebar.status")}</p>
        <p>{t("sidebar.looking_for")}</p>
      </div>
    </div>
  );
};

export default ProfileSidebar;
