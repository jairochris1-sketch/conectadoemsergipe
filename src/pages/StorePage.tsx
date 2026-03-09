import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Store, MapPin, MessageCircle, Plus, Trash2, Package, Sparkles, Star } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import StoreProductForm from "@/components/StoreProductForm";
import FollowStoreButton from "@/components/FollowStoreButton";
import SellerReviewsList from "@/components/SellerReviewsList";
import SellerRating from "@/components/SellerRating";
import StorePlanBadge from "@/components/StorePlanBadge";
import { useSellerReviews } from "@/hooks/useSellerReviews";

interface StoreRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string;
  photo_url: string;
  city: string;
  category: string;
}

interface ProductRow {
  id: string;
  store_id: string;
  user_id: string;
  title: string;
  description: string;
  price: string;
  image_url: string;
  city: string;
  is_active: boolean;
  created_at: string;
  is_boosted?: boolean;
}

const StorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [planType, setPlanType] = useState("free");

  const { averageRating, totalReviews } = useSellerReviews(store?.user_id);
  const isOwner = user && store && user.id === store.user_id;

  useEffect(() => {
    if (slug) fetchStore();
  }, [slug]);

  const fetchStore = async () => {
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!storeData) {
      setLoading(false);
      return;
    }
    setStore(storeData as unknown as StoreRow);

    // Fetch store plan
    const { data: planData } = await supabase
      .from("store_plans")
      .select("plan_type")
      .eq("store_id", storeData.id)
      .eq("is_active", true)
      .maybeSingle();
    if (planData) setPlanType((planData as any).plan_type);

    // Fetch products + check boosted status
    const { data: prods } = await supabase
      .from("store_products")
      .select("*")
      .eq("store_id", storeData.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const prodList = (prods as unknown as ProductRow[]) || [];

    // Check sponsored campaigns for these products
    const prodIds = prodList.map((p) => p.id);
    if (prodIds.length > 0) {
      const { data: campaigns } = await supabase
        .from("sponsored_campaigns")
        .select("item_id")
        .eq("status", "active")
        .in("item_id", prodIds);

      const boostedSet = new Set((campaigns || []).map((c: any) => c.item_id));
      prodList.forEach((p) => {
        p.is_boosted = boostedSet.has(p.id);
      });

      // Sort boosted first
      prodList.sort((a, b) => {
        if (a.is_boosted && !b.is_boosted) return -1;
        if (!a.is_boosted && b.is_boosted) return 1;
        return 0;
      });
    }

    setProducts(prodList);
    setLoading(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("store_products").delete().eq("id", productId);
    toast.success("Produto excluído");
    fetchStore();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
        <div className="max-w-6xl mx-auto px-4 py-6 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-xl" />
            <div className="h-6 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <h1 className="text-xl font-bold text-foreground">Loja não encontrada</h1>
          <Link to="/stores"><Button variant="outline" className="mt-4">Ver todas as lojas</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${store.name} - Conectadoemsergipe`} description={store.description || `Loja ${store.name}`} />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 pt-20">
        {/* Store Header */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
          <div className="h-32 sm:h-44 bg-gradient-to-br from-primary/20 to-primary/5 relative">
            {store.photo_url && (
              <img src={store.photo_url} alt={store.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12 relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-4 border-card bg-muted overflow-hidden shrink-0 shadow-md">
              {store.photo_url ? (
                <img src={store.photo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">{store.name}</h1>
              <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                {store.city && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.city}</span>
                )}
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{store.category}</span>
              </div>
              {store.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{store.description}</p>
              )}
              {/* Follow button */}
              {!isOwner && (
                <div className="mt-3">
                  <FollowStoreButton storeId={store.id} />
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {!isOwner && (
                <Link to={`/messages?to=${store.user_id}`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <MessageCircle className="w-4 h-4" /> Mensagem
                  </Button>
                </Link>
              )}
              {isOwner && (
                <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Adicionar Produto
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        {showForm && isOwner && store && user && (
          <StoreProductForm
            storeId={store.id}
            userId={user.id}
            storeCity={store.city}
            onClose={() => setShowForm(false)}
            onProductAdded={fetchStore}
          />
        )}

        {/* Products */}
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Produtos ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum produto publicado ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product) => (
              <Link key={product.id} to={`/produto/${product.id}`} className="bg-card border border-border rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-200 no-underline relative">
                {product.is_boosted && (
                  <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" /> Impulsionado
                  </div>
                )}
                <div className={`aspect-square bg-muted relative overflow-hidden ${product.is_boosted ? "ring-2 ring-amber-400/50" : ""}`}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                  {isOwner && (
                    <button
                      onClick={(e) => { e.preventDefault(); handleDeleteProduct(product.id); }}
                      className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-foreground truncate">{product.title}</h3>
                  <p className="text-primary font-bold text-sm mt-1">
                    {parseFloat(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  {product.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {product.city}
                    </p>
                  )}
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

export default StorePage;
