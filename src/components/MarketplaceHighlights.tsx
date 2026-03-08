import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

interface HighlightItem {
  id: string;
  title: string;
  price: string;
  image_url: string | null;
  images: string[] | null;
  city: string | null;
}

const formatPrice = (price: string): string => {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const CATEGORIES = [
  { key: "Eletrônicos", icon: "📱", label: "Eletrônicos" },
  { key: "Veículos", icon: "🚗", label: "Veículos" },
  { key: "Móveis", icon: "🛋️", label: "Móveis" },
  { key: "Imóveis", icon: "🏠", label: "Imóveis" },
  { key: "Roupas", icon: "👕", label: "Roupas" },
  { key: "Serviços", icon: "🔧", label: "Serviços" },
  { key: "Outros", icon: "📦", label: "Outros" },
];

const MarketplaceHighlights = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<HighlightItem[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from("marketplace_items")
        .select("id, title, price, image_url, images, city")
        .eq("sold", false)
        .order("created_at", { ascending: false })
        .limit(4);

      if (data) {
        setItems(data.map(d => ({
          ...d,
          images: Array.isArray(d.images) ? d.images as string[] : null,
        })));
      }
    };
    fetchItems();
  }, []);

  const getThumb = (item: HighlightItem) => {
    if (item.images && item.images.length > 0) return item.images[0];
    if (item.image_url) return item.image_url;
    return null;
  };

  return (
    <div className="bg-card border border-border p-2 w-full">
      {/* Header */}
      <div className="border-b border-border pb-1 mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-primary">🛒 Marketplace</h3>
        <Link to="/marketplace" className="text-[10px] text-primary hover:underline">
          {t("see_all") || "Ver tudo"} →
        </Link>
      </div>

      {/* Featured Items */}
      {items.length === 0 ? (
        <p className="text-[10px] text-muted-foreground py-2 text-center">
          {t("marketplace.no_items") || "Nenhum item disponível"}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {items.map((item) => {
            const thumb = getThumb(item);
            return (
              <Link
                key={item.id}
                to="/marketplace"
                className="border border-border bg-accent/30 hover:bg-accent transition-colors p-1.5 no-underline text-foreground"
              >
                <div className="w-full h-[60px] bg-muted border border-border flex items-center justify-center overflow-hidden mb-1">
                  {thumb ? (
                    <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[18px]">📦</span>
                  )}
                </div>
                <p className="text-[10px] font-bold truncate">{item.title}</p>
                <p className="text-[10px] font-bold text-primary">{formatPrice(item.price)}</p>
                {item.city && (
                  <p className="text-[8px] text-muted-foreground truncate">📍 {item.city}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Categories */}
      <div className="border-t border-border pt-2">
        <p className="text-[11px] font-bold text-primary mb-1.5">Categorias</p>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              to={`/marketplace?category=${encodeURIComponent(cat.key)}`}
              className="text-[9px] bg-accent hover:bg-accent/80 text-foreground border border-border px-1.5 py-0.5 no-underline transition-colors"
            >
              {cat.icon} {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHighlights;
