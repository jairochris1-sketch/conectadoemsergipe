import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, MapPin, ShoppingBag } from "lucide-react";

interface StoryItem {
  id: string;
  store_id: string;
  product_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  productTitle: string;
  productPrice: string;
  productCity?: string;
}

interface StoreWithStories {
  storeId: string;
  storeName: string;
  storePhoto: string;
  stories: StoryItem[];
}

interface Props {
  stores: StoreWithStories[];
  initialStoreIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

const StoreStoryViewer = ({ stores, initialStoreIndex, onClose }: Props) => {
  const navigate = useNavigate();
  const [storeIndex, setStoreIndex] = useState(initialStoreIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const currentStore = stores[storeIndex];
  const currentStory = currentStore?.stories[storyIndex];

  const goNext = useCallback(() => {
    if (storyIndex < currentStore.stories.length - 1) {
      setStoryIndex((i) => i + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (storeIndex < stores.length - 1) {
      setStoreIndex((i) => i + 1);
      setStoryIndex(0);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      onClose();
    }
  }, [storyIndex, storeIndex, currentStore, stores.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (storeIndex > 0) {
      const prevStore = stores[storeIndex - 1];
      setStoreIndex((i) => i - 1);
      setStoryIndex(prevStore.stories.length - 1);
      setProgress(0);
      elapsedRef.current = 0;
    }
  }, [storyIndex, storeIndex, stores]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const totalElapsed = elapsedRef.current + (now - startTimeRef.current);
      const pct = Math.min((totalElapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        goNext();
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      elapsedRef.current += Date.now() - startTimeRef.current;
    };
  }, [storyIndex, storeIndex, isPaused, goNext]);

  // Reset elapsed on story change
  useEffect(() => {
    elapsedRef.current = 0;
  }, [storyIndex, storeIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  // Touch swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 100) {
      onClose();
    } else {
      setIsPaused(false);
    }
  };

  // Click left/right zones
  const handleAreaClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goPrev();
    } else if (x > (rect.width * 2) / 3) {
      goNext();
    }
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return price;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Desktop nav arrows */}
      <button
        onClick={goPrev}
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 text-white/70 hover:text-white hidden sm:block"
      >
        <ChevronLeft className="w-10 h-10" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 text-white/70 hover:text-white hidden sm:block"
      >
        <ChevronRight className="w-10 h-10" />
      </button>

      {/* Story container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[420px] h-full sm:h-[90vh] sm:max-h-[800px] sm:rounded-2xl overflow-hidden bg-black"
        onClick={handleAreaClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
      >
        {/* Story image */}
        <img
          src={currentStory.image_url}
          alt={currentStory.productTitle}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 pt-3 z-20">
          {currentStore.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    i < storyIndex
                      ? "100%"
                      : i === storyIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-3 z-20">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50">
              <img
                src={currentStore.storePhoto}
                alt={currentStore.storeName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight drop-shadow">
                {currentStore.storeName}
              </p>
              <p className="text-white/70 text-[10px] drop-shadow">
                {new Date(currentStory.created_at).toLocaleString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Product info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-20">
          <div className="bg-card/90 backdrop-blur-md rounded-xl p-4 border border-border/50">
            <h3 className="text-foreground font-bold text-base leading-tight mb-1 line-clamp-2">
              {currentStory.productTitle}
            </h3>
            <p className="text-primary font-bold text-xl mb-2">
              {formatPrice(currentStory.productPrice)}
            </p>
            {currentStory.productCity && (
              <p className="text-muted-foreground text-xs flex items-center gap-1 mb-3">
                <MapPin className="w-3 h-3" />
                {currentStory.productCity}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  navigate(`/produto/${currentStory.product_id}`);
                }}
                className="flex-1 bg-primary text-primary-foreground font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <ShoppingBag className="w-4 h-4" />
                Ver Produto
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  navigate(`/loja/${currentStore.storeId}`);
                }}
                className="bg-muted text-foreground font-medium text-sm py-2.5 px-4 rounded-lg hover:bg-accent transition-colors"
              >
                Loja
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreStoryViewer;
