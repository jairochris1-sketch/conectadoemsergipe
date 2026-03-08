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
      images: Array.isArray((d as any).images) ? ((d as any).images as string[]) : [],
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
      <div className="max-w-[760px] mx-auto px-3 py-4">
        <div className="fb-box">
          <div className="fb-box-header flex items-center justify-between">
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '13px', fontWeight: 'bold' }}>
              {t("marketplace.title")}
            </span>
            {user && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/seller-dashboard")}
                  className="bg-[#f2f2f2] border border-[#ccc] px-2 py-[2px] text-[11px] font-bold text-black cursor-pointer hover:bg-[#e6e6e6]"
                >
                  📢 {t("ads.my_ads")}
                </button>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-[#3b5998] text-white border border-[#29447e] px-2 py-[2px] text-[11px] font-bold cursor-pointer hover:bg-[#2d4373]"
                >
                  {showForm ? t("marketplace.cancel") : "+ " + t("marketplace.sell")}
                </button>
              </div>
            )}
          </div>

          <div className="p-2">

          {showForm && user && (
            <MarketplaceForm
              user={user}
              onClose={() => setShowForm(false)}
              onItemPosted={loadItems}
            />
          )}

          <div className="flex flex-wrap gap-1 mb-3">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); trackCategoryFilter(c); }}
                className={`px-2 py-[2px] border cursor-pointer text-[11px] ${category === c ? "border-[#3b5998] bg-[#6d84b4] text-white font-bold" : "border-[#d8dfea] bg-[#edeff4] text-[#3b5998] hover:bg-[#d8dfea]"}`}
              >
                {t(CATEGORY_KEYS[c])}
              </button>
            ))}
          </div>

          {recommendations.length > 0 && category === "All" && (
            <div className="mb-4">
              <div className="fb-section-title mb-2">
                ⭐ {t("marketplace.recommended")}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="space-y-3">
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
              <p className="text-sm text-muted-foreground">{t("marketplace.no_items")}</p>
            )}
          </div>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Marketplace;
