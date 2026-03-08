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
    <div className="fb-box">
      <div className="fb-box-header">{name}</div>
      <div className="fb-box-body">
        <div className="flex flex-col items-center gap-2">
          <img
            src={photoUrl}
            alt={name}
            className="w-full max-w-[180px] border border-border object-cover"
          />
        </div>
        <div className="text-[12px] mt-2 space-y-1">
          {school && <p><b>{t("school")}:</b> {school}</p>}
          {city && <p><b>{t("city")}:</b> {city}</p>}
          {birthdate && <p><b>{t("birthdate")}:</b> {new Date(birthdate).toLocaleDateString()}</p>}
          {createdAt && (
            <p>📅 {t("sidebar.member_since_label") || "Membro desde"}: {new Date(createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
          )}
          <p className="text-muted-foreground">{bio}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
