import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface MarketItem {
  id: number;
  title: string;
  price: string;
  description: string;
  seller: string;
  sellerId: string;
  category: string;
  city: string;
  imageUrl: string;
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

const INITIAL_ITEMS: MarketItem[] = [
  { id: 1, title: "Geladeira Consul 340L", price: "R$ 800", description: "Funcionando perfeitamente, pouco uso.", seller: "Maria Silva", sellerId: "", category: "Geladeira", city: "Aracaju", imageUrl: "" },
  { id: 2, title: "Moto Honda CG 160", price: "R$ 12.000", description: "2022, única dona, revisada.", seller: "João Santos", sellerId: "", category: "Motos", city: "Itabaiana", imageUrl: "" },
  { id: 3, title: "Samsung Galaxy A54", price: "R$ 1.200", description: "6 meses de uso, com nota fiscal.", seller: "Pedro Lima", sellerId: "", category: "Celulares", city: "Lagarto", imageUrl: "" },
  { id: 4, title: "Sofá 3 lugares", price: "R$ 450", description: "Bom estado, cor cinza.", seller: "Ana Costa", sellerId: "", category: "Sofá/Mesa/Cadeiras", city: "Estância", imageUrl: "" },
  { id: 5, title: "Bolo de chocolate decorado", price: "R$ 80", description: "Encomendas com 2 dias de antecedência.", seller: "Carla Oliveira", sellerId: "", category: "Bolos/Doces", city: "Aracaju", imageUrl: "" },
  { id: 6, title: "Mudas de manga e acerola", price: "R$ 15", description: "Mudas saudáveis, prontas para plantar.", seller: "José Ferreira", sellerId: "", category: "Mudas Frutíferas", city: "Tobias Barreto", imageUrl: "" },
];

const Marketplace = () => {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<MarketItem[]>(INITIAL_ITEMS);
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", price: "", description: "", category: "Outros", city: "" });
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const filtered = category === "All" ? items : items.filter((i) => i.category === category);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePost = () => {
    if (!newItem.title || !newItem.price || !user) return;
    setItems([{ id: Date.now(), ...newItem, seller: user.name, sellerId: user.id, imageUrl: imagePreview }, ...items]);
    setNewItem({ title: "", price: "", description: "", category: "Outros", city: "" });
    setImagePreview("");
    setShowForm(false);
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
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90"
              >
                {showForm ? t("marketplace.cancel") : t("marketplace.sell")}
              </button>
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
              <button onClick={handlePost} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
                {t("marketplace.post_item")}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1 mb-3 text-[11px]">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-2 py-[2px] border border-border cursor-pointer text-[10px] ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
              >
                {t(CATEGORY_KEYS[c])}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((item) => (
              <div key={item.id} className="border border-border p-2 flex gap-3">
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
                        onClick={() => navigate(`/messages?with=${item.sellerId}`)}
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
