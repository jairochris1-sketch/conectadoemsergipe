import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MarketplaceItem {
  id: string;
  title: string;
  price: string;
  image_url: string | null;
  images: any;
  sold: boolean;
}

const AdminFeaturedMarketplace = () => {
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [allItems, setAllItems] = useState<MarketplaceItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Load featured IDs
      const { data: setting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "featured_marketplace_ids")
        .single();

      if (setting?.value) {
        setFeaturedIds(setting.value.split(",").map((s: string) => s.trim()).filter(Boolean));
      }

      // Load all items
      const { data: items } = await supabase
        .from("marketplace_items")
        .select("id, title, price, image_url, images, sold")
        .order("created_at", { ascending: false })
        .limit(100);

      if (items) setAllItems(items);
      setLoading(false);
    };
    load();
  }, []);

  const saveFeatured = async (newIds: string[]) => {
    const value = newIds.join(",");
    // Upsert into site_settings
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "featured_marketplace_ids")
      .single();

    if (existing) {
      await supabase.from("site_settings").update({ value }).eq("key", "featured_marketplace_ids");
    } else {
      await supabase.from("site_settings").insert({ key: "featured_marketplace_ids", value });
    }
    setFeaturedIds(newIds);
    toast.success("Destaques atualizados!");
  };

  const toggleFeatured = (itemId: string) => {
    const newIds = featuredIds.includes(itemId)
      ? featuredIds.filter((id) => id !== itemId)
      : [...featuredIds, itemId];
    saveFeatured(newIds);
  };

  const getThumb = (item: MarketplaceItem) => {
    if (item.images && Array.isArray(item.images) && (item.images as string[]).length > 0) return (item.images as string[])[0];
    return item.image_url || "/placeholder.svg";
  };

  const filtered = search
    ? allItems.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  if (loading) return <p className="text-[11px] text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-bold mb-1">Itens em destaque ({featuredIds.length}):</p>
        {featuredIds.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">Nenhum item selecionado. Selecione abaixo.</p>
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            {featuredIds.map((id) => {
              const item = allItems.find((i) => i.id === id);
              if (!item) return null;
              return (
                <div key={id} className="relative w-[60px]">
                  <div className="w-[60px] h-[60px] border border-primary overflow-hidden bg-muted">
                    <img src={getThumb(item)} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={() => toggleFeatured(id)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground w-[14px] h-[14px] text-[9px] flex items-center justify-center cursor-pointer border-none leading-none"
                  >
                    ×
                  </button>
                  <p className="text-[8px] truncate mt-0.5">{item.title}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="text-[11px] font-bold mb-1">Buscar produtos para adicionar:</p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título..."
          className="w-full border border-border px-2 py-[3px] text-[11px] bg-card mb-2"
        />
        <div className="max-h-[250px] overflow-y-auto border border-border">
          {filtered.map((item) => {
            const isFeatured = featuredIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-1.5 border-b border-border text-[11px] cursor-pointer hover:bg-accent ${isFeatured ? "bg-accent" : ""}`}
                onClick={() => toggleFeatured(item.id)}
              >
                <div className="w-[36px] h-[36px] border border-border overflow-hidden bg-muted shrink-0">
                  <img src={getThumb(item)} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{item.title}</p>
                  <p className="text-muted-foreground text-[10px]">
                    {item.price} {item.sold && <span className="text-destructive">• Vendido</span>}
                  </p>
                </div>
                <span className={`text-[10px] shrink-0 ${isFeatured ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {isFeatured ? "★ Destaque" : "Adicionar"}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-[10px] text-muted-foreground p-2">Nenhum item encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeaturedMarketplace;
