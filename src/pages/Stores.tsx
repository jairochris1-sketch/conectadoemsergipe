import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MapPin, Store } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface StoreRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string;
  photo_url: string;
  city: string;
  category: string;
  created_at: string;
}

const Stores = () => {
  const { user, logout } = useAuth();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [myStore, setMyStore] = useState<StoreRow | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle()
        .then(({ data }) => setMyStore(data as StoreRow | null));
    }
  }, [user]);

  const fetchStores = async () => {
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setStores((data as StoreRow[]) || []);
    setLoading(false);
  };

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Lojas - Conectadoemsergipe" description="Encontre lojas e vendedores em Sergipe" />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 pt-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              Lojas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Encontre lojas e vendedores em Sergipe</p>
          </div>
          <div className="flex gap-2">
            {user && !myStore && (
              <Link to="/stores/create">
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" /> Criar Loja
                </Button>
              </Link>
            )}
            {user && myStore && (
              <Link to={`/store/${myStore.slug}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Store className="w-4 h-4" /> Minha Loja
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lojas por nome, cidade ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border animate-pulse h-52" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma loja encontrada</p>
            {user && !myStore && (
              <Link to="/stores/create">
                <Button size="sm" className="mt-4">Criar sua loja</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((store) => (
              <Link
                key={store.id}
                to={`/store/${store.slug}`}
                className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-200 no-underline"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {store.photo_url ? (
                    <img src={store.photo_url} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-12 h-12 text-muted-foreground/40" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {store.category}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {store.name}
                  </h3>
                  {store.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {store.city}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Stores;
