import { Crown, Shield, Star } from "lucide-react";

interface StorePlanBadgeProps {
  planType: string;
  size?: "sm" | "md" | "lg";
}

const PLAN_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  bronze: { label: "Bronze", icon: Shield, className: "bg-amber-700/10 text-amber-700 border-amber-600/30" },
  prata: { label: "Prata", icon: Star, className: "bg-slate-300/20 text-slate-600 border-slate-400/40" },
  ouro: { label: "Ouro", icon: Crown, className: "bg-yellow-400/15 text-yellow-700 border-yellow-500/40" },
  // Legacy plan names
  basic: { label: "Básico", icon: Shield, className: "bg-slate-100 text-slate-700 border-slate-300" },
  professional: { label: "Profissional", icon: Star, className: "bg-blue-100 text-blue-700 border-blue-300" },
  premium: { label: "Premium", icon: Crown, className: "bg-amber-100 text-amber-700 border-amber-400" },
};

export const PLAN_PRODUCT_LIMITS: Record<string, number> = {
  free: 10,
  bronze: 30,
  prata: 100,
  ouro: 999999,
  basic: 20,
  professional: 50,
  premium: 999999,
};

const StorePlanBadge = ({ planType, size = "sm" }: StorePlanBadgeProps) => {
  const config = PLAN_CONFIG[planType];
  if (!config || planType === "free") return null;

  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5",
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${config.className} ${sizeClasses[size]}`}>
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
};

export default StorePlanBadge;
