import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const ProfileSidebarNav = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: "Mural", path: "/", icon: "📝" },
    { label: t("profile"), path: "/profile", icon: "ℹ️" },
    { label: t("friends"), path: "/amigos", icon: "👥" },
    { label: t("marketplace"), path: "/marketplace", icon: "🛒" },
    { label: t("messages"), path: "/messages", icon: "✉️" },
  ];

  return (
    <div className="fb-box">
      {/* Profile photo + name */}
      {user && (
        <div className="p-2.5 border-b border-border">
          <Link to="/profile" className="flex items-center gap-2 no-underline hover:no-underline">
            <img
              src={user.photoUrl || "/placeholder.svg"}
              alt={user.name}
              className="w-[50px] h-[50px] border border-border object-cover"
            />
            <span className="text-[13px] font-bold text-primary hover:underline">{user.name}</span>
          </Link>
        </div>
      )}
      {/* Navigation */}
      <div className="py-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 px-2.5 py-[5px] text-[12px] no-underline hover:bg-accent ${
              location.pathname === item.path
                ? "bg-accent font-bold text-primary"
                : "text-foreground hover:text-primary"
            }`}
          >
            <span className="text-[13px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProfileSidebarNav;
