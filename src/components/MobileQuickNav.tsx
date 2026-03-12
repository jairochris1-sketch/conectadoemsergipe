import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Wrench, Store, Mail, User, ChevronDown, ChevronUp, Trophy, LayoutGrid, BookOpen, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const navItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { to: "/servicos", label: "Serviços", icon: Wrench },
  { to: "/stores", label: "Lojas", icon: Store },
  { to: "/notas", label: "Notas", icon: BookOpen },
  { to: "/agenda-cultural", label: "Eventos", icon: Calendar },
  { to: "/top-vendedores", label: "Top", icon: Trophy },
  { to: "/messages", label: "Mensagens", icon: Mail, authRequired: true },
  { to: "/profile", label: "Perfil", icon: User, authRequired: true },
];

const MobileQuickNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessages();

  if (!isMobile) return null;

  const filteredItems = navItems.filter((item) => !item.authRequired || user);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground cursor-pointer"
      >
        <LayoutGrid className="w-3.5 h-3.5 text-primary" />
        Menu rápido
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="flex gap-1.5 overflow-x-auto py-2 scrollbar-thin">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-[11px] no-underline transition-colors border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-accent"
                }`}
              >
                <span className="relative">
                  <Icon className="w-4 h-4" />
                  {item.to === "/messages" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </span>
                <span className="whitespace-nowrap font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileQuickNav;
