import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle, ChevronLeft, ChevronRight, Store, Package, Calendar } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface ProductDetail {
  id: string;
  store_id: string;
  user_id: string;
  title: string;
  description: string;
  price: string;
  image_url: string;
  images: string[];
  city: string;
  category: string;
  created_at: string;
}

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  photo_url: string;
  user_id: string;
}

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from("store_products")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (!data) { setLoading(false); return; }

    const rawImages = (data as any).images;
    const imgs: string[] = Array.isArray(rawImages) ? rawImages : [];
    if ((data as any).image_url && !imgs.includes((data as any).image_url)) {
      imgs.unshift((data as any).image_url);
    }

    setProduct({ ...(data as any), images: imgs });

    const { data: storeData } = await supabase
      .from("stores")
      .select("id, name, slug, photo_url, user_id")
      .eq("id", (data as any).store_id)
      .maybeSingle();
    setStore(storeData as StoreInfo | null);
    setLoading(false);
  };

  const allImages = product?.images?.length ? product.images : (product?.image_url ? [product.image_url] : []);

  const nextImage = () => setCurrentImage((p) => (p + 1) % allImages.length);
  const prevImage = () => setCurrentImage((p) => (p - 1 + allImages.length) % allImages.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
        <div className="max-w-5xl mx-auto px-4 py-6 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-72 bg-muted rounded-xl" />
            <div className="h-8 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <h1 className="text-xl font-bold text-foreground">Produto não encontrado</h1>
          <Link to="/stores"><Button variant="outline" className="mt-4">Ver lojas</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${product.title} - Conectadoemsergipe`}
        description={product.description || product.title}
      />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 pt-20">
        {/* Breadcrumb */}
        {store && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/stores" className="hover:text-primary transition-colors">Lojas</Link>
            <span>/</span>
            <Link to={`/store/${store.slug}`} className="hover:text-primary transition-colors">{store.name}</Link>
            <span>/</span>
            <span className="text-foreground truncate">{product.title}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image Gallery */}
          <div className="lg:w-[55%]">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {allImages.length > 0 ? (
                <div className="relative">
                  <div
                    className="aspect-square bg-muted cursor-pointer"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={allImages[currentImage]}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full w-9 h-9 flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full w-9 h-9 flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {allImages.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImage(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImage ? "bg-primary scale-110" : "bg-muted-foreground/40"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${i === currentImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:w-[45%] space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{product.title}</h1>
              <p className="text-2xl sm:text-3xl font-bold text-primary mt-3">
                {parseFloat(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>

              <div className="flex flex-wrap gap-2 mt-4 text-xs">
                {product.category && product.category !== "Geral" && (
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{product.category}</span>
                )}
                {product.city && (
                  <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {product.city}
                  </span>
                )}
                <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(product.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>

              {product.description && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Descrição</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                </div>
              )}
            </div>

            {/* Seller card */}
            {store && (
              <div className="bg-card border border-border rounded-xl p-4">
                <Link to={`/store/${store.slug}`} className="flex items-center gap-3 no-underline group">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                    {store.photo_url ? (
                      <img src={store.photo_url} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{store.name}</p>
                    <p className="text-xs text-muted-foreground">Ver loja completa</p>
                  </div>
                </Link>

                {user && store.user_id !== user.id && (
                  <Link to={`/messages?to=${store.user_id}`} className="block mt-3">
                    <Button className="w-full gap-2">
                      <MessageCircle className="w-4 h-4" /> Enviar mensagem ao vendedor
                    </Button>
                  </Link>
                )}
                {!user && (
                  <Link to="/login" className="block mt-3">
                    <Button variant="outline" className="w-full gap-2">
                      <MessageCircle className="w-4 h-4" /> Faça login para contatar
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            ✕
          </button>
          <img
            src={allImages[currentImage]}
            alt={product?.title}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}

      <FacebookFooter />
    </div>
  );
};

export default ProductPage;
