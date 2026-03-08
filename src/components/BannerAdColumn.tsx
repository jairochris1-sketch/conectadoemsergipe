import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BannerAdData {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
}

interface BannerAdColumnProps {
  position: "left" | "right";
}

const BannerAdColumn = ({ position }: BannerAdColumnProps) => {
  const [banners, setBanners] = useState<BannerAdData[]>([]);
  const trackedImpressions = useRef(new Set<string>());

  useEffect(() => {
    const now = new Date().toISOString();
    supabase
      .from("banner_ads")
      .select("id, title, image_url, link_url")
      .eq("is_active", true)
      .or(`position.eq.${position},position.eq.both`)
      .lte("starts_at", now)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const active = (data || []).filter(
          (b: any) => !b.ends_at || new Date(b.ends_at) > new Date()
        );
        if (active.length > 0) setBanners(active);
      });
  }, [position]);

  useEffect(() => {
    banners.forEach((b) => {
      if (!trackedImpressions.current.has(b.id)) {
        trackedImpressions.current.add(b.id);
        supabase.rpc("increment_banner_impressions", { _banner_id: b.id });
      }
    });
  }, [banners]);

  const handleClick = useCallback((bannerId: string) => {
    supabase.rpc("increment_banner_clicks", { _banner_id: bannerId });
  }, []);

  if (banners.length === 0) {
    return (
      <div className="fb-box">
        <div className="fb-box-header">Sponsored</div>
        <div className="p-2 text-center text-[10px] text-muted-foreground" style={{ minHeight: '200px' }}>
          <p className="mt-10">Anúncio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="fb-box">
        <div className="fb-box-header">Sponsored</div>
        <div className="p-1.5 space-y-1.5">
          {banners.map((banner) => (
            <div key={banner.id}>
              <a
                href={banner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClick(banner.id)}
                className="block border border-border overflow-hidden hover:opacity-90 transition-opacity"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title || "Anúncio"}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </a>
              {banner.title && (
                <p className="text-[9px] text-muted-foreground mt-[2px] truncate">
                  {banner.title}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerAdColumn;
