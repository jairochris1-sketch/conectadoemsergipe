import { Link } from "react-router-dom";
import { MapPin, ExternalLink, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoreProductFeedItem {
  id: string;
  title: string;
  price: string;
  image_url: string;
  city: string;
  created_at: string;
  store_name: string;
  store_slug: string;
  store_photo: string;
  seller_name: string;
  seller_photo: string;
  seller_id: string;
}

const StoreProductFeedCard = ({ product }: { product: StoreProductFeedItem }) => {
  const formattedPrice = parseFloat(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const date = new Date(product.created_at);
  const formattedDate = date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  return (
    <div className="border-b border-border pb-3">
      {/* Author header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-[44px] h-[44px] bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden rounded-sm">
          {product.seller_photo ? (
            <img src={product.seller_photo} alt={product.seller_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">👤</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm">
            <Link to={`/user/${product.seller_id}`} className="font-bold text-base hover:underline">
              {product.seller_name}
            </Link>
            {" "}
            <span className="text-muted-foreground">adicionou um produto na loja</span>
            {" "}
            <Link to={`/store/${product.store_slug}`} className="font-bold text-primary hover:underline">
              {product.store_name}
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </div>
      </div>

      {/* Product card */}
      <Link to={`/produto/${product.id}`} className="block no-underline group">
        <div className="border border-border rounded-lg overflow-hidden bg-accent/30 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="sm:w-48 shrink-0">
              <div className="aspect-video sm:aspect-square bg-muted overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>
            {/* Info */}
            <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 min-w-0">
              <div>
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                  {product.title}
                </h3>
                <p className="text-lg font-bold text-primary mt-1">{formattedPrice}</p>
                {product.city && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {product.city}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                  <ExternalLink className="w-3 h-3" /> Ver produto
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default StoreProductFeedCard;
export type { StoreProductFeedItem };
