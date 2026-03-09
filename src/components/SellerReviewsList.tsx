import { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSellerReviews } from "@/hooks/useSellerReviews";
import ReviewForm from "@/components/ReviewForm";
import SellerRating from "@/components/SellerRating";
import { Link } from "react-router-dom";

interface SellerReviewsListProps {
  sellerId: string;
  showAddButton?: boolean;
  maxReviews?: number;
}

const SellerReviewsList = ({ sellerId, showAddButton = true, maxReviews }: SellerReviewsListProps) => {
  const { reviews, averageRating, totalReviews, loading, addReview, canReview } = useSellerReviews(sellerId);
  const [showForm, setShowForm] = useState(false);

  const displayReviews = maxReviews ? reviews.slice(0, maxReviews) : reviews;

  if (loading) {
    return <div className="animate-pulse h-20 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SellerRating rating={averageRating} totalReviews={totalReviews} size="md" />
        {showAddButton && canReview && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5">
            <Star className="w-4 h-4" /> Avaliar
          </Button>
        )}
      </div>

      {/* Add review form */}
      {showForm && (
        <ReviewForm
          onSubmit={(rating, comment) => addReview(rating, comment)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Reviews list */}
      {displayReviews.length > 0 ? (
        <div className="space-y-3">
          {displayReviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-3 last:border-b-0">
              <div className="flex items-start gap-3">
                <Link to={`/user/${review.reviewer_id}`} className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border">
                    {review.reviewer_photo ? (
                      <img src={review.reviewer_photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">👤</div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/user/${review.reviewer_id}`} className="font-semibold text-sm hover:underline">
                      {review.reviewer_name}
                    </Link>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(review.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {maxReviews && reviews.length > maxReviews && (
            <p className="text-xs text-muted-foreground text-center">
              +{reviews.length - maxReviews} avaliações
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4" /> Nenhuma avaliação ainda
        </p>
      )}
    </div>
  );
};

export default SellerReviewsList;
