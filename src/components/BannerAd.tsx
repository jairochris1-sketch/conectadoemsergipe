import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BannerAdData {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
}

interface BannerAdProps {
  position: "left" | "right";
  rotationInterval?: number;
}

const BannerAd = ({ position, rotationInterval = 8000 }: BannerAdProps) => {
  const [banners, setBanners] = useState<BannerAdData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackedImpressions = useRef(new Set<string>());

  useEffect(() => {
    supabase
      .from("banner_ads")
      .select("id, title, image_url, link_url")
      .eq("is_active", true)
      .or(`position.eq.${position},position.eq.both`)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setBanners(data);
      });
  }, [position]);

  // Track impression when banner becomes visible
  useEffect(() => {
    if (banners.length === 0) return;
    const current = banners[currentIndex];
    if (!current || trackedImpressions.current.has(current.id)) return;
    trackedImpressions.current.add(current.id);
    supabase.rpc("increment_banner_impressions", { _banner_id: current.id });
  }, [currentIndex, banners]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, rotationInterval);
    return () => clearInterval(timer);
  }, [banners.length, rotationInterval]);

  const handleClick = useCallback((bannerId: string) => {
    supabase.rpc("increment_banner_clicks", { _banner_id: bannerId });
  }, []);

  if (banners.length === 0) {
    return (
      <div className="bg-card border border-border p-2 text-center text-[10px] text-muted-foreground min-h-[600px] flex items-center justify-center">
        Espaço para anúncio
      </div>
    );
  }

  const current = banners[currentIndex];

  return (
    <div className="space-y-2">
      <a
        href={current.link_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleClick(current.id)}
        className="block border border-border overflow-hidden hover:opacity-90 transition-opacity"
      >
        <img
          src={current.image_url}
          alt={current.title || "Anúncio"}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      </a>
      {banners.length > 1 && (
        <div className="flex justify-center gap-1">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-[6px] h-[6px] rounded-full border-none cursor-pointer transition-colors ${
                i === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerAd;
