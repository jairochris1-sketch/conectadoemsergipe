import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Package, MapPin } from "lucide-react";

interface SimilarProductsProps {
  currentProductId: string;
  category?: string;
  city?: string;
  storeId?: string;
}

interface Product {
  id: string;
  title: string;
  price: string;
  image_url: string;
  city: string;
}

const SimilarProducts = ({ currentProductId, category, city, storeId }: SimilarProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // First try same store
      let query = supabase
        .from("store_products")
        .select("id, title, price, image_url, city")
        .eq("is_active", true)
        .neq("id", currentProductId)
        .limit(6);

      if (storeId) {
        query = query.eq("store_id", storeId);
      }

      let { data } = await query;

      // If not enough from same store, get from same category
      if (!data || data.length < 4) {
        const { data: categoryData } = await supabase
          .from("store_products")
          .select("id, title, price, image_url, city")
          .eq("is_active", true)
          .eq("category", category || "Geral")
          .neq("id", currentProductId)
          .limit(6);

        data = [...(data || []), ...(categoryData || [])];
        // Remove duplicates
        data = Array.from(new Map(data.map((p: any) => [p.id, p])).values());
      }

      // If still not enough, get from same city
      if (data.length < 4 && city) {
        const { data: cityData } = await supabase
          .from("store_products")
          .select("id, title, price, image_url, city")
          .eq("is_active", true)
          .eq("city", city)
          .neq("id", currentProductId)
          .limit(4);

        data = [...data, ...(cityData || [])];
        data = Array.from(new Map(data.map((p: any) => [p.id, p])).values());
      }

      setProducts((data || []).slice(0, 6) as Product[]);
      setLoading(false);
    };
    fetch();
  }, [currentProductId, category, city, storeId]);

  if (loading || products.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        Você também pode gostar
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/produto/${product.id}`}
            className="bg-card border border-border rounded-lg overflow-hidden group hover:shadow-md transition-all no-underline"
          >
            <div className="aspect-square bg-muted overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="p-2">
              <h4 className="text-xs font-medium text-foreground truncate">{product.title}</h4>
              <p className="text-sm font-bold text-primary">
                {parseFloat(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              {product.city && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" /> {product.city}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SimilarProducts;
