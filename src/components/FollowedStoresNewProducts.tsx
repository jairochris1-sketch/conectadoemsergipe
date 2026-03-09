import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Store, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface FollowedProduct {
  id: string;
  title: string;
  price: string;
  image_url: string | null;
  store_name: string;
  store_slug: string;
  store_photo: string | null;
}

const FollowedStoresNewProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<FollowedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      // Get stores user follows
      const { data: follows } = await supabase
        .from("store_followers")
        .select("store_id")
        .eq("user_id", user.id);

      if (!follows || follows.length === 0) { setLoading(false); return; }

      const storeIds = follows.map((f) => f.store_id);

      // Get recent products from those stores
      const { data: prods } = await supabase
        .from("store_products")
        .select("id, title, price, image_url, store_id")
        .in("store_id", storeIds)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8);

      if (!prods || prods.length === 0) { setLoading(false); return; }

      // Get store info
      const uniqueStoreIds = [...new Set(prods.map((p) => p.store_id))];
      const { data: stores } = await supabase
        .from("stores")
        .select("id, name, slug, photo_url")
        .in("id", uniqueStoreIds);

      const storeMap = new Map(stores?.map((s) => [s.id, s]) || []);

      const mapped: FollowedProduct[] = prods.map((p) => {
        const store = storeMap.get(p.store_id);
        return {
          id: p.id,
          title: p.title,
          price: p.price,
          image_url: p.image_url,
          store_name: store?.name || "Loja",
          store_slug: store?.slug || "",
          store_photo: store?.photo_url || null,
        };
      });

      setProducts(mapped);
      setLoading(false);
    };

    load();
  }, [user]);

  if (!user || (!loading && products.length === 0)) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          Novidades das lojas que sigo
        </h3>
        <Link to="/stores" className="text-xs text-primary hover:underline flex items-center gap-0.5">
          Ver lojas <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-3">Carregando...</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {products.map((p) => {
            const price = parseFloat(p.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            return (
              <Link
                key={p.id}
                to={`/produto/${p.id}`}
                className="shrink-0 w-[140px] group no-underline"
              >
                <div className="aspect-square bg-muted rounded-md overflow-hidden border border-border mb-1.5">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground truncate">{p.title}</p>
                <p className="text-xs font-bold text-primary">{price}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {p.store_photo ? (
                    <img src={p.store_photo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                  ) : (
                    <Store className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className="text-[10px] text-muted-foreground truncate">{p.store_name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FollowedStoresNewProducts;
