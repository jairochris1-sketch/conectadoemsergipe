import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import { Trophy, Star, Package, Heart, MapPin } from "lucide-react";
import StorePlanBadge from "@/components/StorePlanBadge";

interface TopSeller {
  id: string;
  name: string;
  slug: string;
  photo_url: string;
  city: string;
  category: string;
  product_count: number;
  follower_count: number;
  avg_rating: number;
  review_count: number;
  plan_type: string;
}

const TopSellers = () => {
  const { user, logout } = useAuth();
  const [sellers, setSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopSellers();
  }, []);

  const fetchTopSellers = async () => {
    // Fetch stores
    const { data: stores } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true);

    if (!stores) { setLoading(false); return; }

    const storeIds = stores.map((s: any) => s.id);
    const userIds = stores.map((s: any) => s.user_id);

    // Fetch related data in parallel
    const [
      { data: products },
      { data: followers },
      { data: reviews },
      { data: plans },
    ] = await Promise.all([
      supabase.from("store_products").select("store_id").eq("is_active", true).in("store_id", storeIds),
      supabase.from("store_followers").select("store_id").in("store_id", storeIds),
      supabase.from("seller_reviews").select("seller_id, rating").in("seller_id", userIds),
      supabase.from("store_plans").select("store_id, plan_type").eq("is_active", true).in("store_id", storeIds),
    ]);

    // Build maps
    const productCountMap = new Map<string, number>();
    (products || []).forEach((p: any) => {
      productCountMap.set(p.store_id, (productCountMap.get(p.store_id) || 0) + 1);
    });

    const followerCountMap = new Map<string, number>();
    (followers || []).forEach((f: any) => {
      followerCountMap.set(f.store_id, (followerCountMap.get(f.store_id) || 0) + 1);
    });

    const reviewMap = new Map<string, { sum: number; count: number }>();
    (reviews || []).forEach((r: any) => {
      const existing = reviewMap.get(r.seller_id) || { sum: 0, count: 0 };
      reviewMap.set(r.seller_id, { sum: existing.sum + r.rating, count: existing.count + 1 });
    });

    const planMap = new Map<string, string>();
    (plans || []).forEach((p: any) => {
      planMap.set(p.store_id, p.plan_type);
    });

    // Enrich stores
    const enriched: TopSeller[] = stores.map((s: any) => {
      const reviewData = reviewMap.get(s.user_id);
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        photo_url: s.photo_url || "",
        city: s.city || "",
        category: s.category || "Geral",
        product_count: productCountMap.get(s.id) || 0,
        follower_count: followerCountMap.get(s.id) || 0,
        avg_rating: reviewData ? Math.round((reviewData.sum / reviewData.count) * 10) / 10 : 0,
        review_count: reviewData?.count || 0,
        plan_type: planMap.get(s.id) || "free",
      };
    });

    // Score and sort
    enriched.sort((a, b) => {
      const scoreA = (a.avg_rating * 10) + (a.follower_count * 2) + a.product_count;
      const scoreB = (b.avg_rating * 10) + (b.follower_count * 2) + b.product_count;
      return scoreB - scoreA;
    });

    setSellers(enriched.slice(0, 20));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Top Vendedores - Conectadoemsergipe" description="Os melhores vendedores da plataforma" />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 pt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Top Vendedores</h1>
            <p className="text-sm text-muted-foreground">Os melhores vendedores da plataforma</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sellers.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Nenhum vendedor encontrado</p>
        ) : (
          <div className="space-y-3">
            {sellers.map((seller, index) => (
              <Link
                key={seller.id}
                to={`/store/${seller.slug}`}
                className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all no-underline group"
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  index === 0 ? "bg-amber-400 text-white" :
                  index === 1 ? "bg-slate-300 text-slate-700" :
                  index === 2 ? "bg-amber-700 text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {index + 1}
                </div>

                {/* Photo */}
                <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden border border-border shrink-0">
                  {seller.photo_url ? (
                    <img src={seller.photo_url} alt={seller.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">🏪</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {seller.name}
                    </h3>
                    <StorePlanBadge planType={seller.plan_type} />
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    {seller.avg_rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {seller.avg_rating.toFixed(1)} ({seller.review_count})
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Package className="w-3 h-3" /> {seller.product_count} produtos
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-3 h-3" /> {seller.follower_count}
                    </span>
                    {seller.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> {seller.city}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <FacebookFooter />
    </div>
  );
};

export default TopSellers;
