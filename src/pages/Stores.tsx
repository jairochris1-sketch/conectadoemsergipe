import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MapPin, Store, Package, Heart, Crown } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import StorePlanBadge from "@/components/StorePlanBadge";
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
  created_at: string;
  product_count?: number;
  follower_count?: number;
  plan_type?: string;
}

const Stores = () => {
  const { user, logout } = useAuth();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [myStore, setMyStore] = useState<StoreRow | null>(null);
  const [cityFilter, setCityFilter] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [userCity, setUserCity] = useState("");

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

      // Get user city
      supabase
        .from("profiles")
        .select("city")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.city) setUserCity(data.city);
        });
    }
  }, [user]);

  const fetchStores = async () => {
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Fetch product counts and follower counts
    const storeIds = data.map((s: any) => s.id);
    const [{ data: productCounts }, { data: followerCounts }, { data: storePlans }] = await Promise.all([
      supabase.from("store_products").select("store_id").eq("is_active", true).in("store_id", storeIds),
      supabase.from("store_followers").select("store_id").in("store_id", storeIds),
      supabase.from("store_plans").select("store_id, plan_type").eq("is_active", true).in("store_id", storeIds),
    ]);

    const pCountMap = new Map<string, number>();
    (productCounts || []).forEach((p: any) => {
      pCountMap.set(p.store_id, (pCountMap.get(p.store_id) || 0) + 1);
    });

    const fCountMap = new Map<string, number>();
    (followerCounts || []).forEach((f: any) => {
      fCountMap.set(f.store_id, (fCountMap.get(f.store_id) || 0) + 1);
    });

    const planMap = new Map<string, string>();
    (storePlans || []).forEach((p: any) => {
      planMap.set(p.store_id, p.plan_type);
    });

    const enriched = data.map((s: any) => ({
      ...s,
      product_count: pCountMap.get(s.id) || 0,
      follower_count: fCountMap.get(s.id) || 0,
      plan_type: planMap.get(s.id) || "free",
    }));

    // Sort: premium stores first (ouro > prata > bronze > free)
    const planPriority: Record<string, number> = { ouro: 3, premium: 3, prata: 2, professional: 2, bronze: 1, basic: 1, free: 0 };
    enriched.sort((a: any, b: any) => (planPriority[b.plan_type] || 0) - (planPriority[a.plan_type] || 0));

    setStores(enriched as StoreRow[]);
    setLoading(false);
  };

  const handleNearMe = () => {
    if (!nearMe && userCity) {
      setCityFilter(userCity);
    } else {
      setCityFilter("");
    }
    setNearMe(!nearMe);
  };

  const filtered = stores.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.toLowerCase().includes(search.toLowerCase());
    const matchCity = !cityFilter || s.city === cityFilter;
    return matchSearch && matchCity;
  });

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

        {/* Search + Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lojas por nome, cidade ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {user && userCity && (
              <Button
                size="sm"
                variant={nearMe ? "default" : "outline"}
                onClick={handleNearMe}
                className="gap-1.5 text-xs"
              >
                <MapPin className="w-3 h-3" /> Perto de mim
              </Button>
            )}
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setNearMe(false); }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs h-9"
            >
              <option value="">Todas as cidades</option>
              {SERGIPE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border animate-pulse h-64" />
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
                className={`group bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-200 no-underline ${
                  store.plan_type === "ouro" ? "border-yellow-400 ring-1 ring-yellow-400/30" :
                  store.plan_type === "prata" ? "border-slate-400 ring-1 ring-slate-400/20" :
                  store.plan_type === "bronze" ? "border-amber-600/40" :
                  "border-border"
                }`}
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
                  <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                    {store.name}
                    <StorePlanBadge planType={store.plan_type || "free"} />
                  </h3>
                  {store.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {store.city}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Package className="w-3 h-3" /> {store.product_count || 0} produtos
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-3 h-3" /> {store.follower_count || 0}
                    </span>
                  </div>
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
