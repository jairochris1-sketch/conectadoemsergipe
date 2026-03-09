import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Store, Package, Trash2, Edit2, MapPin, Plus, Settings, Eye } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";
import { useMarketplaceCategories } from "@/hooks/useMarketplaceCategories";
import { Navigate } from "react-router-dom";
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
  price: string;
  image_url: string;
  city: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

const STORE_CATEGORIES = [
  "Geral", "Moda", "Eletrônicos", "Alimentos", "Artesanato", "Beleza",
  "Casa e Decoração", "Esportes", "Livros", "Brinquedos", "Pet Shop", "Outros"
];

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
      setProducts((prods as unknown as ProductRow[]) || []);
    }
    setLoading(false);
  };

  const startEditStore = () => {
    if (!store) return;
    setEditName(store.name);
    setEditDesc(store.description);
    setEditCity(store.city);
    setEditCategory(store.category);
    setEditingStore(true);
  };

  const saveStore = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        name: editName.trim(),
        description: editDesc.trim(),
        city: editCity,
        category: editCategory,
      } as any)
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
            <div className="flex gap-2">
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

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum produto ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => (
              <div key={p.id} className={`bg-card border border-border rounded-xl overflow-hidden ${!p.is_active ? "opacity-60" : ""}`}>
                <Link to={`/produto/${p.id}`} className="block no-underline">
                  <div className="aspect-video bg-muted overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-foreground truncate">{p.title}</h3>
                    <p className="text-primary font-bold text-sm mt-1">
                      {parseFloat(p.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    {!p.is_active && <span className="text-xs text-destructive font-medium">Desativado</span>}
                  </div>
                </Link>
                <div className="px-3 pb-3 flex gap-2">
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => toggleProduct(p.id, p.is_active)}>
                    {p.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive" onClick={() => deleteProduct(p.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Excluir
                  </Button>
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

export default MyStore;
