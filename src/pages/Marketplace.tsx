import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useMarketplaceRecommendations } from "@/hooks/useMarketplaceRecommendations";

interface MarketItem {
  id: string;
  title: string;
  price: string;
  description: string;
  seller: string;
  sellerId: string;
  category: string;
  city: string;
  imageUrl: string;
  isSponsored?: boolean;
}

const CATEGORIES = [
  "All", "Móveis", "Imóveis", "Celulares", "Carros", "Motos", "Bicicletas",
  "Som", "Roupas", "Bolos/Doces", "Mudas Frutíferas", "Sofá/Mesa/Cadeiras",
  "Fogão", "Geladeira", "Guarda-Roupa", "Eletrônicos", "Livros", "Outros"
];

const CATEGORY_KEYS: Record<string, string> = {
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
  const [newItem, setNewItem] = useState({ title: "", price: "", description: "", category: "Outros", city: "" });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { recommendations, trackClick, trackImpression, trackCategoryFilter } = useMarketplaceRecommendations();
  const [sponsoredIds, setSponsoredIds] = useState<Set<string>>(new Set());
  const loadItems = useCallback(async () => {
    // Load active sponsored campaign item IDs
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
      isSponsored: sponsoredSet.has(d.id),
    }));

    // Sort: sponsored first, then by date
    mapped.sort((a, b) => {
      if (a.isSponsored && !b.isSponsored) return -1;
      if (!a.isSponsored && b.isSponsored) return 1;
      return 0;
    });

    setItems(mapped);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = category === "All" ? items : items.filter((i) => i.category === category);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!newItem.title || !newItem.price || !user) return;
    setPosting(true);

    let uploadedUrl = "";
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `marketplace/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, imageFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        uploadedUrl = urlData.publicUrl;
      }
    }

    await supabase.from("marketplace_items").insert({
      user_id: user.id,
      title: newItem.title,
      price: newItem.price,
      description: newItem.description,
      category: newItem.category,
      city: newItem.city,
      image_url: uploadedUrl,
    });

    setNewItem({ title: "", price: "", description: "", category: "Outros", city: "" });
    setImagePreview("");
    setImageFile(null);
    setShowForm(false);
    setPosting(false);
    await loadItems();
  };

  return (
    <div className="min-h-screen bg-background">
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
            <div className="border border-border p-2 bg-accent mb-3 text-[11px] space-y-2">
              <div>
                <label className="block font-bold mb-1">{t("marketplace.item_title")}</label>
                <input type="text" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-bold mb-1">{t("marketplace.price")}</label>
                  <input type="text" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card" placeholder="R$ 25" />
                </div>
                <div className="flex-1">
                  <label className="block font-bold mb-1">{t("marketplace.category")}</label>
                  <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card">
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{t(CATEGORY_KEYS[c])}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">{t("marketplace.city")}</label>
                <input type="text" value={newItem.city} onChange={(e) => setNewItem({ ...newItem, city: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card" placeholder="Aracaju" />
              </div>
              <div>
                <label className="block font-bold mb-1">{t("marketplace.image")}</label>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="text-[11px]" />
                {imagePreview && (
                  <div className="mt-1">
                    <img src={imagePreview} alt="Preview" className="w-[80px] h-[80px] object-cover border border-border" />
                  </div>
                )}
              </div>
              <div>
                <label className="block font-bold mb-1">{t("marketplace.description")}</label>
                <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="w-full border border-border p-1 text-[11px] resize-none bg-card" rows={2} />
              </div>
              <button onClick={handlePost} disabled={posting} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90 disabled:opacity-50">
                {posting ? "..." : t("marketplace.post_item")}
              </button>
            </div>
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

          {/* Recommendations section */}
          {recommendations.length > 0 && category === "All" && (
            <div className="mb-4">
              <h3 className="text-[13px] font-bold text-primary mb-2 border-b border-border pb-1" style={{ fontFamily: 'Georgia, serif' }}>
                ⭐ {t("marketplace.recommended")}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {recommendations.map((item) => (
                  <div
                    key={`rec-${item.id}`}
                    className={`relative border p-2 cursor-pointer hover:bg-accent transition-colors ${
                      item.isSponsored ? "border-primary/50 bg-primary/5" : "border-primary/30 bg-accent/50"
                    }`}
                    onClick={() => trackClick(item.id, item.category)}
                  >
                    {item.isSponsored && (
                      <span className="absolute top-0 right-0 text-[7px] font-bold text-primary-foreground bg-primary px-[4px] py-[1px]">
                        ⭐ {t("ads.sponsored")}
                      </span>
                    )}
                    <div className="w-full h-[60px] bg-muted border border-border flex items-center justify-center overflow-hidden mb-1">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[18px]">📦</span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold truncate">{item.title}</p>
                    <p className="text-[10px] font-bold text-primary">{item.price}</p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {item.city && <>📍 {item.city} · </>}
                      {item.seller}
                    </p>
                    {user && item.sellerId && item.sellerId !== user.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/messages?with=${item.sellerId}`); }}
                        className="mt-1 bg-primary text-primary-foreground border-none px-2 py-[1px] text-[9px] cursor-pointer hover:opacity-90"
                      >
                        💬 {t("marketplace.contact")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`relative border p-2 flex gap-3 cursor-pointer hover:bg-accent/30 transition-colors ${
                  item.isSponsored ? "border-primary/50 bg-primary/5" : "border-border"
                }`}
                onClick={() => trackClick(item.id, item.category)}
              >
                {item.isSponsored && (
                  <span className="absolute top-0 right-0 text-[8px] font-bold text-primary-foreground bg-primary px-[6px] py-[1px]">
                    ⭐ {t("ads.sponsored")}
                  </span>
                )}
                <div className="w-[70px] h-[70px] bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[20px]">📦</span>
                  )}
                </div>
                <div className="text-[11px] flex-1">
                  <div className="flex justify-between">
                    <a href="#" className="font-bold">{item.title}</a>
                    <span className="font-bold text-primary">{item.price}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{item.description}</p>
                  <p className="mt-1 flex items-center gap-1 flex-wrap">
                    {t("marketplace.seller")}: <a href="#">{item.seller}</a>
                    {item.city && <> · 📍 {item.city}</>}
                    {" · "}<span className="text-muted-foreground">{t(CATEGORY_KEYS[item.category] || "marketplace.other")}</span>
                    {user && item.sellerId && item.sellerId !== user.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/messages?with=${item.sellerId}`); }}
                        className="ml-1 bg-primary text-primary-foreground border-none px-2 py-[1px] text-[10px] cursor-pointer hover:opacity-90"
                      >
                        💬 {t("marketplace.contact")}
                      </button>
                    )}
                  </p>
                </div>
              </div>
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
