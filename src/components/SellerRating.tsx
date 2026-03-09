import { Star } from "lucide-react";

interface SellerRatingProps {
  rating: number;
  totalReviews: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

const SellerRating = ({ rating, totalReviews, size = "sm", showCount = true }: SellerRatingProps) => {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  
  const starSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (totalReviews === 0) {
    return (
      <span className={`text-muted-foreground ${sizeClasses[size]}`}>
        Sem avaliações
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
      <Star className={`${starSizes[size]} fill-amber-400 text-amber-400`} />
      <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
      {showCount && (
        <span className="text-muted-foreground">
          ({totalReviews} {totalReviews === 1 ? "avaliação" : "avaliações"})
        </span>
      )}
    </div>
  );
};

export default SellerRating;
