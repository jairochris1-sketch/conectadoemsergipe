import { Link, useLocation } from "react-router-dom";
import { Home, User, ShoppingCart, MessageCircle, Users, Settings, Wrench, Store, Trophy, Coins } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { icon: Home, label: "Início", to: "/", exact: true },
  { icon: User, label: "Perfil", to: "/profile", exact: false },
  { icon: ShoppingCart, label: "Mercado", to: "/marketplace", exact: false },
  { icon: Wrench, label: "Serviços", to: "/servicos", exact: false },
  { icon: Store, label: "Lojas", to: "/stores", exact: false },
  { icon: Trophy, label: "Top", to: "/top-vendedores", exact: false },
  { icon: Coins, label: "Créditos", to: "/comprar-creditos", exact: false },
  { icon: MessageCircle, label: "Chat", to: "/messages", exact: false, showBadge: true },
  { icon: Users, label: "Amigos", to: "/amigos", exact: false },
  { icon: Settings, label: "Config.", to: "/configuracoes", exact: false },
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
    <aside className="hidden md:flex flex-col w-[72px] shrink-0 sticky top-0 h-screen bg-card/80 backdrop-blur-sm border-r border-border z-[900] pt-[82px]">
      <nav className="flex flex-col items-center py-3 gap-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, to, exact, showBadge }) => {
          const active = isActive(to, exact);
          // Don't show profile/chat/amigos if not logged in
          if (!user && ["/profile", "/messages", "/amigos"].includes(to)) return null;
          
          return (
            <Link
              key={to + label}
              to={to}
              className={`group flex flex-col items-center justify-center w-[58px] h-[52px] rounded-xl text-xs font-medium transition-all duration-200 no-underline relative ${
                active
                  ? "bg-primary/12 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className={`w-[22px] h-[22px] transition-transform group-hover:scale-110 ${active ? "stroke-[2.5px]" : ""}`} />
                {showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`mt-1 text-[10px] leading-tight ${active ? "font-semibold" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section with a subtle divider */}
      <div className="mt-auto pb-4 flex flex-col items-center">
        <div className="w-8 h-px bg-border mb-3" />
        <div className="text-[9px] text-muted-foreground/60 text-center leading-tight px-2">
          © 2026
        </div>
      </div>
    </aside>
  );
};

export default AppNavSidebar;