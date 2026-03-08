import { Shield, BadgeCheck, Star } from "lucide-react";

interface VerificationBadgeProps {
  verified?: boolean;
  businessVerified?: boolean;
  isAdmin?: boolean;
  isModerator?: boolean;
  size?: "sm" | "md";
}

const VerificationBadge = ({ verified, businessVerified, isAdmin, isModerator, size = "sm" }: VerificationBadgeProps) => {
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <>
      {isAdmin && (
        <span title="Administrador" className="inline-flex items-center ml-[2px]">
          <Shield className={`${iconSize} text-destructive`} fill="currentColor" />
        </span>
      )}
      {isModerator && !isAdmin && (
        <span title="Colaborador" className="inline-flex items-center ml-[2px]">
          <Star className={`${iconSize}`} style={{ color: "#e69500" }} fill="currentColor" />
        </span>
      )}
      {businessVerified && (
        <span title="Empresa Verificada" className="inline-flex items-center ml-[2px]">
          <BadgeCheck className={`${iconSize}`} style={{ color: "#d4a017" }} fill="currentColor" stroke="white" />
        </span>
      )}
      {verified && !businessVerified && (
        <span title="Verificado" className="inline-flex items-center ml-[2px]">
          <BadgeCheck className={`${iconSize} text-primary`} fill="currentColor" stroke="white" />
        </span>
      )}
    </>
  );
};

export default VerificationBadge;
