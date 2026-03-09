import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Review {
  id: string;
  seller_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  product_id: string | null;
  created_at: string;
  reviewer_name?: string;
  reviewer_photo?: string;
}

export const useSellerReviews = (sellerId?: string) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!sellerId) { setLoading(false); return; }

    const { data } = await supabase
      .from("seller_reviews")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Fetch reviewer profiles
    const reviewerIds = [...new Set(data.map((r: any) => r.reviewer_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url")
      .in("user_id", reviewerIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const enriched = data.map((r: any) => {
      const profile = profileMap.get(r.reviewer_id);
      return {
        ...r,
        reviewer_name: profile?.name || "Usuário",
        reviewer_photo: profile?.photo_url || "",
      };
    });

    setReviews(enriched);
    setTotalReviews(data.length);
    
    if (data.length > 0) {
      const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
      setAverageRating(Math.round(avg * 10) / 10);
    }
    
    setLoading(false);
  }, [sellerId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const addReview = async (rating: number, comment: string, productId?: string) => {
    if (!user || !sellerId) return false;
    
    const { error } = await supabase.from("seller_reviews").insert({
      seller_id: sellerId,
      reviewer_id: user.id,
      rating,
      comment: comment.trim() || null,
      product_id: productId || null,
    } as any);

    if (error) return false;
    await fetchReviews();
    return true;
  };

  const canReview = user && user.id !== sellerId;

  return { reviews, averageRating, totalReviews, loading, addReview, canReview, refresh: fetchReviews };
};
