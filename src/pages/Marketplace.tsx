import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useMarketplaceRecommendations } from "@/hooks/useMarketplaceRecommendations";
import MarketplaceItemCard from "@/components/MarketplaceItemCard";
import MarketplaceForm from "@/components/MarketplaceForm";

export interface MarketItem {
  id: string;
  title: string;
  price: string;
  description: string;
  seller: string;
  sellerId: string;
  category: string;
  city: string;
  imageUrl: string;
  images?: string[];
  whatsapp?: string;
  isSponsored?: boolean;
  sold?: boolean;
  condition?: string;
}

const CATEGORIES = [
  "All", "Móveis", "Imóveis", "Celulares", "Carros", "Motos", "Bicicletas",
  "Som", "Roupas", "Bolos/Doces", "Mudas Frutíferas", "Sofá/Mesa/Cadeiras",
  "Fogão", "Geladeira", "Guarda-Roupa", "Eletrônicos", "Livros", "Outros"
];

export const CATEGORY_KEYS: Record<string, string> = {
  "All": "marketplace.all",
  "Móveis": "marketplace.moveis",
  "Imóveis": "marketplace.imoveis",
  "Celulares": "marketplace.celulares",
  "Carros": "marketplace.carros",
  "Motos": "marketplace.motos",
  "Bicicletas": "marketplace.bicicletas",
  "Som": "marketplace.som",
  "Roupas": "marketplace.clothing",
  "Bolos/Doces": "marketplace.bolos_doces",
  "Mudas Frutíferas": "marketplace.mudas",
  "Sofá/Mesa/Cadeiras": "marketplace.sofa_mesa",
  "Fogão": "marketplace.fogao",
  "Geladeira": "marketplace.geladeira",
  "Guarda-Roupa": "marketplace.guarda_roupa",
  "Eletrônicos": "marketplace.electronics",
  "Livros": "marketplace.books",
  "Outros": "marketplace.other",
};

const Marketplace = () => {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { recommendations, trackClick, trackImpression, trackCategoryFilter } = useMarketplaceRecommendations();
  const [sponsoredIds, setSponsoredIds] = useState<Set<string>>(new Set());

  const loadItems = useCallback(async () => {
    const { data: campaigns } = await supabase
      .from("sponsored_campaigns")
      .select("item_id")
      .eq("status", "active");
    const sponsoredSet = new Set((campaigns || []).map((c: any) => c.item_id));
    setSponsoredIds(sponsoredSet);

    const { data } = await supabase
      .from("marketplace_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!data) return;

    const userIds = [...new Set(data.map((d: any) => d.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

    const mapped = data.map((d: any) => ({
      id: d.id,
      title: d.title,
      price: d.price,
      description: d.description || "",
      seller: profileMap.get(d.user_id) || "Usuário",
      sellerId: d.user_id,
      category: d.category,
      city: d.city || "",
      imageUrl: d.image_url || "",
      images: (d as any).images || [],
      whatsapp: (d as any).whatsapp || "",
      isSponsored: sponsoredSet.has(d.id),
      sold: d.sold || false,
      condition: (d as any).condition || "used",
    }));

    mapped.sort((a, b) => {
      if (a.isSponsored && !b.isSponsored) return -1;
      if (!a.isSponsored && b.isSponsored) return 1;
      return 0;
    });

    setItems(mapped);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = category === "All" ? items : items.filter((i) => i.category === category);

  useEffect(() => {
    filtered.slice(0, 10).forEach((item) => {
      trackImpression(item.id, item.category);
    });
  }, [filtered, trackImpression]);

  const handleDelete = async (itemId: string) => {
    await supabase.from("marketplace_items").delete().eq("id", itemId);
    await loadItems();
  };

  const handleMarkSold = async (itemId: string) => {
    await supabase.from("marketplace_items").update({ sold: true } as any).eq("id", itemId);
    await loadItems();
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Marketplace"
        description="Compre e venda produtos em Sergipe. Encontre ofertas locais no marketplace do Conectados em Sergipe."
        path="/marketplace"
        jsonLd={{
          "@type": "WebPage",
          "name": "Marketplace - Conectados em Sergipe",
          "description": "Compre e venda produtos em Sergipe. Encontre ofertas locais no marketplace do Conectados em Sergipe.",
          "url": "https://conectadoemsergipe.lovable.app/marketplace",
          "isPartOf": { "@type": "WebSite", "name": "Conectados em Sergipe", "url": "https://conectadoemsergipe.lovable.app" },
          "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://conectadoemsergipe.lovable.app/" },
            { "@type": "ListItem", "position": 2, "name": "Marketplace", "item": "https://conectadoemsergipe.lovable.app/marketplace" }
          ]}
        }}
      />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="bg-card border border-border p-3">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <h2 className="text-[16px] font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
              {t("marketplace.title")}
            </h2>
            {user && (
              <div className="flex gap-1">
                <button
                  onClick={() => navigate("/seller-dashboard")}
                  className="bg-muted text-foreground border border-border px-3 py-1 text-[11px] cursor-pointer hover:bg-accent"
                >
                  📢 {t("ads.my_ads")}
                </button>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90"
                >
                  {showForm ? t("marketplace.cancel") : t("marketplace.sell")}
                </button>
              </div>
            )}
          </div>

          {showForm && user && (
            <MarketplaceForm
              user={user}
              onClose={() => setShowForm(false)}
              onItemPosted={loadItems}
            />
          )}

          <div className="flex flex-wrap gap-1 mb-3 text-[11px]">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); trackCategoryFilter(c); }}
                className={`px-2 py-[2px] border border-border cursor-pointer text-[10px] ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
              >
                {t(CATEGORY_KEYS[c])}
              </button>
            ))}
          </div>

          {recommendations.length > 0 && category === "All" && (
            <div className="mb-4">
              <h3 className="text-[13px] font-bold text-primary mb-2 border-b border-border pb-1" style={{ fontFamily: 'Georgia, serif' }}>
                ⭐ {t("marketplace.recommended")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recommendations.map((item) => (
                  <MarketplaceItemCard
                    key={`rec-${item.id}`}
                    item={item}
                    variant="grid"
                    currentUserId={user?.id}
                    onTrackClick={trackClick}
                    onDelete={handleDelete}
                    onMarkSold={handleMarkSold}
                    onContact={(sellerId) => navigate(`/messages?with=${sellerId}`)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((item) => (
              <MarketplaceItemCard
                key={item.id}
                item={item}
                variant="list"
                currentUserId={user?.id}
                onTrackClick={trackClick}
                onDelete={handleDelete}
                onMarkSold={handleMarkSold}
                onContact={(sellerId) => navigate(`/messages?with=${sellerId}`)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-[11px] text-muted-foreground">{t("marketplace.no_items")}</p>
            )}
          </div>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Marketplace;
