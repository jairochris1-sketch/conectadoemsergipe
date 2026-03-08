import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceForm from "@/components/MarketplaceForm";
import MarketplaceItemCard from "@/components/MarketplaceItemCard";
import type { MarketItem } from "@/pages/Marketplace";
import { CATEGORY_KEYS } from "@/pages/Marketplace";

const ITEMS_TO_SHOW = 8;

const CATEGORIES = [
  "All", "Móveis", "Imóveis", "Celulares", "Carros", "Motos", "Bicicletas",
  "Som", "Roupas", "Bolos/Doces", "Mudas Frutíferas", "Sofá/Mesa/Cadeiras",
  "Fogão", "Geladeira", "Guarda-Roupa", "Eletrônicos", "Livros", "Outros"
];

const HomepageMarketplace = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data: campaigns } = await supabase
      .from("sponsored_campaigns")
      .select("item_id")
      .eq("status", "active");
    const sponsoredSet = new Set((campaigns || []).map((c: any) => c.item_id));

    const { data } = await supabase
      .from("marketplace_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(ITEMS_TO_SHOW);

    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map((d: any) => d.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

    const mapped: MarketItem[] = data.map((d: any) => ({
      id: d.id,
      title: d.title,
      price: d.price,
      description: d.description || "",
      seller: profileMap.get(d.user_id) || "Usuário",
      sellerId: d.user_id,
      category: d.category,
      city: d.city || "",
      imageUrl: d.image_url || "",
      images: Array.isArray(d.images) ? (d.images as string[]) : [],
      whatsapp: d.whatsapp || "",
      isSponsored: sponsoredSet.has(d.id),
      sold: d.sold || false,
      condition: d.condition || "used",
    }));

    mapped.sort((a, b) => {
      if (a.isSponsored && !b.isSponsored) return -1;
      if (!a.isSponsored && b.isSponsored) return 1;
      return 0;
    });

    setItems(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleDelete = async (itemId: string) => {
    await supabase.from("marketplace_items").delete().eq("id", itemId);
    await loadItems();
  };

  const handleMarkSold = async (itemId: string) => {
    await supabase.from("marketplace_items").update({ sold: true } as any).eq("id", itemId);
    await loadItems();
  };

  const noopTrack = () => {};

  return (
    <div className="fb-box mb-[10px]">
      <div className="fb-box-header flex items-center justify-between">
        <span>🛒 Marketplace</span>
        <div className="flex gap-1.5">
          {user && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-primary text-primary-foreground border-none px-2.5 py-1 text-[11px] font-medium cursor-pointer hover:opacity-90"
            >
              {showForm ? t("marketplace.cancel") : t("marketplace.sell")}
            </button>
          )}
          <Link
            to="/marketplace"
            className="bg-muted text-foreground border border-border px-2.5 py-1 text-[11px] hover:bg-accent no-underline"
          >
            {t("see_all")}
          </Link>
        </div>
      </div>
      <div className="fb-box-body">
        {/* Category filters */}
        <div className="flex flex-wrap gap-1 mb-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-2 py-0.5 border border-border cursor-pointer text-[10px] ${
                category === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              {t(CATEGORY_KEYS[c])}
            </button>
          ))}
        </div>

        {/* Form */}
        {showForm && user && (
          <MarketplaceForm
            user={user}
            onClose={() => setShowForm(false)}
            onItemPosted={loadItems}
          />
        )}

        {/* Products grid */}
        {loading ? (
          <p className="text-[12px] text-muted-foreground py-3 text-center">Carregando...</p>
        ) : (() => {
          const filtered = category === "All" ? items : items.filter((i) => i.category === category);
          return filtered.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-3 text-center">{t("marketplace.no_items")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((item) => (
                <MarketplaceItemCard
                  key={item.id}
                  item={item}
                  variant="grid"
                  currentUserId={user?.id}
                  onTrackClick={noopTrack}
                  onDelete={handleDelete}
                  onMarkSold={handleMarkSold}
                  onContact={(sellerId) => navigate(`/messages?with=${sellerId}`)}
                />
              ))}
            </div>
          );
        })()}

        {/* Footer link */}
        {items.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border text-center">
            <Link
              to="/marketplace"
              className="inline-block w-full bg-primary text-primary-foreground text-[11px] font-bold py-1.5 px-3 hover:opacity-90 transition-opacity no-underline"
            >
              🛒 {t("see_all")} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomepageMarketplace;
