import { Link, useLocation } from "react-router-dom";
import { Home, User, ShoppingCart, MessageCircle, Users, Settings, Wrench, Store, Trophy, Coins, Calendar, BookOpen, Star, Briefcase } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { icon: Home, label: "Início", to: "/", exact: true },
  { icon: User, label: "Perfil", to: "/profile", exact: false, authRequired: true },
  { icon: ShoppingCart, label: "Marketplace", to: "/marketplace", exact: false },
  { icon: Wrench, label: "Serviços", to: "/servicos", exact: false },
  { icon: Store, label: "Lojas da Cidade", to: "/stores", exact: false },
  { icon: Calendar, label: "Eventos", to: "/agenda-cultural", exact: false },
  { icon: BookOpen, label: "Notas", to: "/notas", exact: false },
  { icon: Trophy, label: "Top Anúncios", to: "/top-vendedores", exact: false },
  { icon: Users, label: "Amigos", to: "/amigos", exact: false, authRequired: true },
  { icon: MessageCircle, label: "Chat", to: "/messages", exact: false, showBadge: true, authRequired: true },
  { icon: Star, label: "Favoritos", to: "/marketplace", exact: false },
  { icon: Settings, label: "Configurações", to: "/configuracoes", exact: false, authRequired: true },
];

const AppNavSidebar = () => {
  const { pathname } = useLocation();
  const { unreadCount } = useUnreadMessages();
  const { user } = useAuth();

  const isActive = (to: string, exact: boolean) => {
    if (exact) return pathname === to;
    return pathname.startsWith(to);
  };

  return (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 sticky top-0 h-screen bg-card border-r border-border z-[900] pt-[60px]">
      <nav className="flex flex-col py-3 px-2 gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, to, exact, showBadge, authRequired }) => {
          if (authRequired && !user) return null;
          const active = isActive(to, exact);

          return (
            <Link
              key={to + label}
              to={to}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline relative ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted/60"
              }`}
            >
              <div className="relative shrink-0">
                <Icon className={`w-[20px] h-[20px] ${active ? "stroke-[2.5px]" : ""}`} />
                {showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`truncate ${active ? "font-semibold" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pb-4 px-3">
        <div className="h-px bg-border mb-3" />
        <div className="text-[10px] text-muted-foreground/60 text-center leading-tight">
          © 2026 Conectadoemsergipe
        </div>
      </div>
    </aside>
  );
};

export default AppNavSidebar;
