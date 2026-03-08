import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

interface MarketplaceItem {
  id: string;
  title: string;
  price: string;
  image_url: string | null;
  images: any;
}

const ProfileMarketplaceStrip = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<MarketplaceItem[]>([]);

  useEffect(() => {
    const load = async () => {
      // Get featured IDs from site_settings
      const { data: setting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "featured_marketplace_ids")
        .single();

      if (!setting?.value) return;

      const ids = setting.value.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (ids.length === 0) return;

      const { data } = await supabase
        .from("marketplace_items")
        .select("id, title, price, image_url, images")
        .in("id", ids)
        .eq("sold", false);

      if (data) setItems(data);
    };
    load();
  }, []);

  if (items.length === 0) return null;

  const getThumb = (item: MarketplaceItem) => {
    if (item.images && Array.isArray(item.images) && (item.images as string[]).length > 0) return (item.images as string[])[0];
    return item.image_url || "/placeholder.svg";
  };

  return (
    <div className="fb-box">
      <div className="fb-box-header flex items-center justify-between">
        <span>🛒 {t("marketplace.featured") || "Destaques do Marketplace"}</span>
        <Link to="/marketplace" className="text-[10px] font-normal hover:underline">
          {t("marketplace.view_all") || "Ver tudo →"}
        </Link>
      </div>
      <div className="p-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/marketplace`}
              className="shrink-0 w-[80px] group no-underline"
            >
              <div className="w-[80px] h-[80px] border border-border overflow-hidden bg-muted">
                <img
                  src={getThumb(item)}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
              </div>
              <p className="text-[9px] text-foreground truncate mt-0.5 leading-tight">{item.title}</p>
              <p className="text-[9px] text-primary font-bold leading-tight">{item.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileMarketplaceStrip;
