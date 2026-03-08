import { useLanguage } from "@/context/LanguageContext";
import { Link } from "react-router-dom";

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
      {/* Profile photo */}
      <div className="p-2 pb-1">
        <img
          src={photoUrl}
          alt={name}
          className="w-full border border-border object-cover"
          style={{ maxWidth: '180px' }}
        />
      </div>

      {/* Navigation menu — Facebook 2010 style */}
      <div className="border-t border-border">
        <Link to="/profile" className="block px-2 py-[5px] text-[11px] font-bold hover:bg-accent border-b border-border">
          📝 Wall
        </Link>
        <Link to="/profile" className="block px-2 py-[5px] text-[11px] font-bold hover:bg-accent border-b border-border">
          ℹ️ Info
        </Link>
        <Link to="/marketplace" className="block px-2 py-[5px] text-[11px] font-bold hover:bg-accent border-b border-border">
          📸 {t("marketplace")}
        </Link>
        <Link to="/amigos" className="block px-2 py-[5px] text-[11px] font-bold hover:bg-accent">
          👥 {t("friends")}
        </Link>
      </div>

      {/* User info */}
      <div className="border-t border-border p-2 text-[11px]">
        <p className="font-bold text-[12px] mb-1">{name}</p>
        {school && <p className="text-muted-foreground mb-0.5">🎓 {school}</p>}
        {city && <p className="text-muted-foreground mb-0.5">📍 {city}</p>}
        {birthdate && <p className="text-muted-foreground mb-0.5">🎂 {new Date(birthdate).toLocaleDateString()}</p>}
        {bio && <p className="text-muted-foreground mt-1">{bio}</p>}
        {createdAt && (
          <p className="text-muted-foreground mt-1">
            📅 {t("sidebar.member_since_label") || "Membro desde"}: {new Date(createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileSidebar;
