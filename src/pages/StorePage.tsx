import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Store, MapPin, MessageCircle, Plus, Trash2, Camera, Package } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";

interface StoreRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string;
  photo_url: string;
  city: string;
  category: string;
}

interface ProductRow {
  id: string;
  store_id: string;
  user_id: string;
  title: string;
  description: string;
  price: string;
  image_url: string;
  city: string;
  is_active: boolean;
  created_at: string;
}

const formatBRL = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (parseInt(digits, 10) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
const parseBRL = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "0";
  return (parseInt(digits, 10) / 100).toFixed(2);
};

const StorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, logout } = useAuth();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Product form state
  const [pTitle, setPTitle] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pPriceDisplay, setPPriceDisplay] = useState("");
  const [pDescription, setPDescription] = useState("");
  const [pCity, setPCity] = useState("");
  const [pPhotoFile, setPPhotoFile] = useState<File | null>(null);
  const [pPhotoPreview, setPPhotoPreview] = useState("");
  const [posting, setPosting] = useState(false);
  const pFileRef = useRef<HTMLInputElement>(null);

  const isOwner = user && store && user.id === store.user_id;

  useEffect(() => {
    if (slug) fetchStore();
  }, [slug]);

  const fetchStore = async () => {
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!storeData) {
      setLoading(false);
      return;
    }
    setStore(storeData as unknown as StoreRow);

    const { data: prods } = await supabase
      .from("store_products")
      .select("*")
      .eq("store_id", storeData.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setProducts((prods as unknown as ProductRow[]) || []);
    setLoading(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async () => {
    if (!pTitle.trim() || !pPrice || !store || !user) {
      toast.error("Preencha título e preço");
      return;
    }
    setPosting(true);

    let image_url = "";
    if (pPhotoFile) {
      const ext = pPhotoFile.name.split(".").pop();
      const path = `${user.id}/store-products/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("post-images").upload(path, pPhotoFile, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("store_products").insert({
      store_id: store.id,
      user_id: user.id,
      title: pTitle.trim(),
      description: pDescription.trim(),
      price: pPrice,
      image_url,
      city: pCity || store.city,
    } as any);

    if (error) {
      toast.error("Erro ao adicionar produto");
      setPosting(false);
      return;
    }

    toast.success("Produto adicionado!");
    setPTitle(""); setPPrice(""); setPPriceDisplay(""); setPDescription(""); setPCity(""); setPPhotoFile(null); setPPhotoPreview("");
    setShowForm(false);
    setPosting(false);
    fetchStore();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("store_products").delete().eq("id", productId);
    toast.success("Produto excluído");
    fetchStore();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
        <div className="max-w-6xl mx-auto px-4 py-6 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-xl" />
            <div className="h-6 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <h1 className="text-xl font-bold text-foreground">Loja não encontrada</h1>
          <Link to="/stores"><Button variant="outline" className="mt-4">Ver todas as lojas</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${store.name} - Conectadoemsergipe`} description={store.description || `Loja ${store.name}`} />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 pt-20">
        {/* Store Header */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
          <div className="h-32 sm:h-44 bg-gradient-to-br from-primary/20 to-primary/5 relative">
            {store.photo_url && (
              <img src={store.photo_url} alt={store.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12 relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-4 border-card bg-muted overflow-hidden shrink-0 shadow-md">
              {store.photo_url ? (
                <img src={store.photo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">{store.name}</h1>
              <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                {store.city && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.city}</span>
                )}
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{store.category}</span>
              </div>
              {store.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{store.description}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {!isOwner && (
                <Link to={`/messages?to=${store.user_id}`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <MessageCircle className="w-4 h-4" /> Mensagem
                  </Button>
                </Link>
              )}
              {isOwner && (
                <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Adicionar Produto
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        {showForm && isOwner && (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Novo Produto</h3>
            <div className="flex flex-col items-center">
              <button onClick={() => pFileRef.current?.click()} className="w-24 h-24 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                {pPhotoPreview ? (
                  <img src={pPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
              <input ref={pFileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <Input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="Nome do produto *" />
            <Input
              value={pPriceDisplay}
              onChange={(e) => {
                setPPriceDisplay(formatBRL(e.target.value));
                setPPrice(parseBRL(e.target.value));
              }}
              placeholder="Preço (R$) *"
            />
            <select
              value={pCity}
              onChange={(e) => setPCity(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
            >
              <option value="">Cidade (usa da loja)</option>
              {SERGIPE_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <textarea
              value={pDescription}
              onChange={(e) => setPDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none"
              placeholder="Descrição do produto"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddProduct} disabled={posting} size="sm">
                {posting ? "Salvando..." : "Adicionar"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* Products */}
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Produtos ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum produto publicado ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-200">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-foreground truncate">{product.title}</h3>
                  <p className="text-primary font-bold text-sm mt-1">
                    {parseFloat(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  {product.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {product.city}
                    </p>
                  )}
                  {product.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FacebookFooter />
    </div>
  );
};

export default StorePage;
