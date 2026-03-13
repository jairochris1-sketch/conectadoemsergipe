import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import StoreStoryViewer from "@/components/StoreStoryViewer";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StoreStory {
  id: string;
  store_id: string;
  product_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
}

interface StoreWithStories {
  storeId: string;
  storeName: string;
  storePhoto: string;
  stories: (StoreStory & {
    productTitle: string;
    productPrice: string;
    productCity?: string;
  })[];
}

const StoreStoriesBar = () => {
  const [storesWithStories, setStoresWithStories] = useState<StoreWithStories[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStoreIndex, setActiveStoreIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    const { data: stories } = await supabase
      .from("store_stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (!stories || stories.length === 0) {
      setStoresWithStories([]);
      return;
    }

    const storeIds = [...new Set(stories.map((s: any) => s.store_id))];
    const productIds = [...new Set(stories.map((s: any) => s.product_id))];

    const [{ data: stores }, { data: products }] = await Promise.all([
      supabase.from("stores").select("id, name, photo_url").in("id", storeIds),
      supabase.from("store_products").select("id, title, price, city").in("id", productIds),
    ]);

    const storeMap = new Map((stores || []).map((s: any) => [s.id, s]));
    const productMap = new Map((products || []).map((p: any) => [p.id, p]));

    const grouped = new Map<string, StoreWithStories>();

    for (const story of stories) {
      const s = story as any;
      const store = storeMap.get(s.store_id);
      const product = productMap.get(s.product_id);
      if (!store || !product) continue;

      if (!grouped.has(s.store_id)) {
        grouped.set(s.store_id, {
          storeId: s.store_id,
          storeName: (store as any).name,
          storePhoto: (store as any).photo_url || "/placeholder.svg",
          stories: [],
        });
      }

      grouped.get(s.store_id)!.stories.push({
        ...s,
        productTitle: (product as any).title,
        productPrice: (product as any).price,
        productCity: (product as any).city,
      });
    }

    setStoresWithStories(Array.from(grouped.values()));
  };

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  if (storesWithStories.length === 0) return null;

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-3 mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          📸 Stories das Lojas
        </h3>
        <div className="relative group">
          {/* Scroll buttons */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 border border-border rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 border border-border rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {storesWithStories.map((store, idx) => (
              <button
                key={store.storeId}
                onClick={() => {
                  setActiveStoreIndex(idx);
                  setViewerOpen(true);
                }}
                className="flex flex-col items-center gap-1 shrink-0 group/item"
              >
                <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-primary via-accent to-destructive">
                  <div className="w-full h-full rounded-full border-2 border-card overflow-hidden">
                    <img
                      src={store.storePhoto}
                      alt={store.storeName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-foreground max-w-[72px] truncate text-center leading-tight">
                  {store.storeName}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewerOpen && (
        <StoreStoryViewer
          stores={storesWithStories}
          initialStoreIndex={activeStoreIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
};

export default StoreStoriesBar;
