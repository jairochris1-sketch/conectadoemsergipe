import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Store, Package, Trash2, MapPin, Plus, Settings, Eye, Camera, X, Edit2, Check, Sparkles, BarChart3, MessageSquare } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";
import StoreProductForm from "@/components/StoreProductForm";

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
  title: string;
  description: string;
  price: string;
  image_url: string;
  images: string[];
  city: string;
  category: string;
  is_active: boolean;
  created_at: string;
  is_boosted?: boolean;
}

const STORE_CATEGORIES = [
  "Geral", "Moda", "Eletrônicos", "Alimentos", "Artesanato", "Beleza",
  "Casa e Decoração", "Esportes", "Livros", "Brinquedos", "Pet Shop", "Outros"
];

const PRODUCT_CATEGORIES = [
  "Geral", "Moda", "Eletrônicos", "Alimentos", "Artesanato", "Beleza",
  "Casa e Decoração", "Esportes", "Livros", "Brinquedos", "Pet Shop",
  "Veículos", "Imóveis", "Móveis", "Outros"
];

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

const MyStore = () => {
  const { user, logout } = useAuth();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingStore, setEditingStore] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [storePhotoFile, setStorePhotoFile] = useState<File | null>(null);
  const [storePhotoPreview, setStorePhotoPreview] = useState("");
  const storePhotoRef = useRef<HTMLInputElement>(null);

  // Edit product state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [epTitle, setEpTitle] = useState("");
  const [epPrice, setEpPrice] = useState("");
  const [epPriceDisplay, setEpPriceDisplay] = useState("");
  const [epDescription, setEpDescription] = useState("");
  const [epCity, setEpCity] = useState("");
  const [epCategory, setEpCategory] = useState("Geral");
  const [epSaving, setEpSaving] = useState(false);
  const [boostingProduct, setBoostingProduct] = useState<string | null>(null);
  const [boostDays, setBoostDays] = useState("7");
  const [boostedIds, setBoostedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) fetchMyStore();
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  const fetchMyStore = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

  if (data) {
      setStore(data as unknown as StoreRow);
      const { data: prods } = await supabase
        .from("store_products")
        .select("*")
        .eq("store_id", data.id)
        .order("created_at", { ascending: false });
      
      const prodList = (prods as unknown as ProductRow[]) || [];
      
      // Check boosted status
      const prodIds = prodList.map(p => p.id);
      if (prodIds.length > 0) {
        const { data: campaigns } = await supabase
          .from("sponsored_campaigns")
          .select("item_id")
          .eq("status", "active")
          .in("item_id", prodIds);
        const boostedSet = new Set((campaigns || []).map((c: any) => c.item_id));
        setBoostedIds(boostedSet);
        prodList.forEach(p => { p.is_boosted = boostedSet.has(p.id); });
      }
      
      setProducts(prodList);
    }
    setLoading(false);
  };

  // Store editing
  const startEditStore = () => {
    if (!store) return;
    setEditName(store.name);
    setEditDesc(store.description);
    setEditCity(store.city);
    setEditCategory(store.category);
    setStorePhotoPreview(store.photo_url || "");
    setStorePhotoFile(null);
    setEditingStore(true);
  };

  const handleStorePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStorePhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setStorePhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveStore = async () => {
    if (!store || !user) return;
    setSaving(true);

    let photo_url = store.photo_url;
    if (storePhotoFile) {
      const ext = storePhotoFile.name.split(".").pop();
      const path = `${user.id}/store/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("post-images").upload(path, storePhotoFile, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from("stores")
      .update({ name: editName.trim(), description: editDesc.trim(), city: editCity, category: editCategory, photo_url } as any)
      .eq("id", store.id);

    if (error) {
      toast.error("Erro ao salvar");
    } else {
      toast.success("Loja atualizada!");
      setEditingStore(false);
      fetchMyStore();
    }
    setSaving(false);
  };

  // Product actions
  const deleteProduct = async (productId: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("store_products").delete().eq("id", productId);
    toast.success("Produto excluído");
    fetchMyStore();
  };

  const toggleProduct = async (productId: string, currentActive: boolean) => {
    await supabase.from("store_products").update({ is_active: !currentActive } as any).eq("id", productId);
    toast.success(currentActive ? "Produto desativado" : "Produto ativado");
    fetchMyStore();
  };

  const boostProduct = async (productId: string) => {
    if (!user) return;
    // Check ad credits balance
    const { data: credits } = await supabase
      .from("ad_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const balance = credits?.balance || 0;
    const cost = parseInt(boostDays) === 3 ? 5 : parseInt(boostDays) === 7 ? 10 : 20;
    
    if (balance < cost) {
      toast.error(`Créditos insuficientes. Necessário: ${cost}, Disponível: ${balance}`);
      setBoostingProduct(null);
      return;
    }
    
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + parseInt(boostDays));
    
    const { error: campaignError } = await supabase.from("sponsored_campaigns").insert({
      user_id: user.id,
      item_id: productId,
      budget: cost,
      ends_at: endsAt.toISOString(),
      status: "active",
    } as any);
    
    if (campaignError) {
      toast.error("Erro ao impulsionar produto");
      return;
    }
    
    // Deduct credits
    await supabase.from("ad_credits").update({ balance: balance - cost } as any).eq("user_id", user.id);
    
    toast.success(`Produto impulsionado por ${boostDays} dias!`);
    setBoostingProduct(null);
    fetchMyStore();
  };

  const startEditProduct = (p: ProductRow) => {
    setEditingProductId(p.id);
    setEpTitle(p.title);
    setEpDescription(p.description || "");
    setEpPrice(p.price);
    setEpPriceDisplay(parseFloat(p.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
    setEpCity(p.city || "");
    setEpCategory(p.category || "Geral");
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
  };

  const saveEditProduct = async () => {
    if (!editingProductId) return;
    setEpSaving(true);
    const { error } = await supabase
      .from("store_products")
      .update({
        title: epTitle.trim(),
        description: epDescription.trim(),
        price: epPrice,
        city: epCity,
        category: epCategory,
      } as any)
      .eq("id", editingProductId);

    if (error) {
      toast.error("Erro ao salvar produto");
    } else {
      toast.success("Produto atualizado!");
      setEditingProductId(null);
      fetchMyStore();
    }
    setEpSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
        <div className="max-w-4xl mx-auto px-4 py-6 pt-20">
          <div className="animate-pulse h-40 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Você ainda não tem uma loja</h1>
          <p className="text-sm text-muted-foreground mb-4">Crie sua loja para começar a vender</p>
          <Link to="/stores/create">
            <Button className="gap-2"><Plus className="w-4 h-4" /> Criar Loja</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Minha Loja - Conectadoemsergipe" description="Gerencie sua loja" />
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 pt-20">
        {/* Store Info */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden border border-border shrink-0">
                {store.photo_url ? (
                  <img src={store.photo_url} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{store.name}</h1>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {store.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.city}</span>}
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{store.category}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to={`/store/${store.slug}`}>
                <Button size="sm" variant="outline" className="gap-1.5"><Eye className="w-4 h-4" /> Ver Loja</Button>
              </Link>
              <Button size="sm" variant="outline" onClick={startEditStore} className="gap-1.5">
                <Settings className="w-4 h-4" /> Editar
              </Button>
            </div>
          </div>

          {editingStore && (
            <div className="border-t border-border pt-4 mt-4 space-y-3">
              {/* Store photo edit */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => storePhotoRef.current?.click()}
                  className="w-16 h-16 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
                >
                  {storePhotoPreview ? (
                    <img src={storePhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                <input ref={storePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleStorePhotoChange} />
                <span className="text-xs text-muted-foreground">Foto da loja</span>
              </div>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome da loja" />
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="Descrição" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={editCity} onChange={(e) => setEditCity(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10">
                  <option value="">Cidade</option>
                  {SERGIPE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10">
                  {STORE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveStore} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingStore(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </div>

        {/* Products Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Produtos ({products.length})
          </h2>
          <Button size="sm" onClick={() => setShowProductForm(!showProductForm)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>

        {/* Product Form */}
        {showProductForm && (
          <StoreProductForm
            storeId={store.id}
            userId={user.id}
            storeCity={store.city}
            onClose={() => setShowProductForm(false)}
            onProductAdded={fetchMyStore}
          />
        )}

        {/* Products List */}
        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum produto ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className={`bg-card border border-border rounded-xl overflow-hidden ${!p.is_active ? "opacity-60" : ""}`}>
                {editingProductId === p.id ? (
                  /* Edit mode */
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-foreground">Editando produto</h3>
                      <button onClick={cancelEditProduct} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <Input value={epTitle} onChange={(e) => setEpTitle(e.target.value)} placeholder="Nome do produto" />
                    <Input
                      value={epPriceDisplay}
                      onChange={(e) => {
                        setEpPriceDisplay(formatBRL(e.target.value));
                        setEpPrice(parseBRL(e.target.value));
                      }}
                      placeholder="Preço (R$)"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select value={epCategory} onChange={(e) => setEpCategory(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10">
                        {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={epCity} onChange={(e) => setEpCity(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10">
                        <option value="">Cidade</option>
                        {SERGIPE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <textarea
                      value={epDescription}
                      onChange={(e) => setEpDescription(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none"
                      placeholder="Descrição"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEditProduct} disabled={epSaving} className="gap-1.5">
                        <Check className="w-4 h-4" /> {epSaving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditProduct}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex flex-col sm:flex-row">
                    <Link to={`/produto/${p.id}`} className="sm:w-40 shrink-0 no-underline">
                      <div className="aspect-video sm:aspect-square bg-muted overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <Link to={`/produto/${p.id}`} className="no-underline">
                          <h3 className="font-semibold text-sm text-foreground hover:text-primary transition-colors">{p.title}</h3>
                        </Link>
                        <p className="text-primary font-bold text-sm mt-1">
                          {parseFloat(p.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1 text-xs text-muted-foreground">
                          {p.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {p.city}</span>}
                          {p.category && p.category !== "Geral" && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{p.category}</span>}
                          {!p.is_active && <span className="text-destructive font-medium">Desativado</span>}
                        </div>
                        {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => startEditProduct(p)}>
                          <Edit2 className="w-3 h-3" /> Editar
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => toggleProduct(p.id, p.is_active)}>
                          {p.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        {!boostedIds.has(p.id) && p.is_active && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs h-7 gap-1 text-amber-600 hover:text-amber-700" 
                            onClick={() => setBoostingProduct(p.id)}
                          >
                            <Sparkles className="w-3 h-3" /> Impulsionar
                          </Button>
                        )}
                        {boostedIds.has(p.id) && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                            <Sparkles className="w-3 h-3" /> Impulsionado
                          </span>
                        )}
                        <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive gap-1" onClick={() => deleteProduct(p.id)}>
                          <Trash2 className="w-3 h-3" /> Excluir
                        </Button>
                      </div>
                      
                      {/* Boost modal */}
                      {boostingProduct === p.id && (
                        <div className="mt-3 p-3 bg-accent/50 rounded-lg border border-border">
                          <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                            <Sparkles className="w-4 h-4 text-amber-500" /> Impulsionar Produto
                          </h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            Produtos impulsionados aparecem em destaque no marketplace e no feed.
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {[
                              { days: "3", cost: 5, label: "3 dias" },
                              { days: "7", cost: 10, label: "7 dias" },
                              { days: "15", cost: 20, label: "15 dias" },
                            ].map(opt => (
                              <button
                                key={opt.days}
                                onClick={() => setBoostDays(opt.days)}
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                  boostDays === opt.days 
                                    ? "bg-amber-500 text-white border-amber-500" 
                                    : "border-border hover:bg-accent"
                                }`}
                              >
                                {opt.label} ({opt.cost} créditos)
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => boostProduct(p.id)} className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white">
                              <Sparkles className="w-3 h-3" /> Confirmar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setBoostingProduct(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <FacebookFooter />
    </div>
  );
};

export default MyStore;
