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

  // Track impressions for all visible banners
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
      <div className="ad-column space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="ad-block bg-card border border-border p-2 text-center text-[10px] text-muted-foreground h-[250px] flex items-center justify-center"
          >
            Anúncio
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="ad-column space-y-3">
      {banners.map((banner) => (
        <div key={banner.id} className="ad-block">
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick(banner.id)}
            className="ad-link block border border-border overflow-hidden hover:opacity-90 transition-opacity"
          >
            <img
              src={banner.image_url}
              alt={banner.title || "Anúncio"}
              className="ad-image w-full h-auto object-cover"
              loading="lazy"
            />
          </a>
          {banner.title && (
            <p className="text-[9px] text-muted-foreground mt-[2px] text-center truncate">
              {banner.title}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default BannerAdColumn;
