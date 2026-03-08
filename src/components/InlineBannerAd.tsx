import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InlineBannerAdData {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
}

const InlineBannerAd = () => {
  const [banner, setBanner] = useState<InlineBannerAdData | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const now = new Date().toISOString();
    supabase
      .from("banner_ads")
      .select("id, title, image_url, link_url, ends_at")
      .eq("is_active", true)
      .or("position.eq.feed,position.eq.both")
      .lte("starts_at", now)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const active = (data || []).filter(
          (b: any) => !b.ends_at || new Date(b.ends_at) > new Date()
        );
        if (active.length > 0) {
          setBanner(active[Math.floor(Math.random() * active.length)]);
        }
      });
  }, []);

  useEffect(() => {
    if (!banner || tracked.current) return;
    tracked.current = true;
    supabase.rpc("increment_banner_impressions", { _banner_id: banner.id });
  }, [banner]);

  const handleClick = () => {
    if (!banner) return;
    supabase.rpc("increment_banner_clicks", { _banner_id: banner.id });
  };

  if (!banner) return null;

  return (
    <div className="ad-slot ad-slot--feed border border-border bg-card p-2 my-1">
      <p className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">Patrocinado</p>
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="ad-link block overflow-hidden hover:opacity-90 transition-opacity"
      >
        <img
          src={banner.image_url}
          alt={banner.title || "Anúncio"}
          className="ad-image w-full h-auto object-cover"
          loading="lazy"
        />
      </a>
    </div>
  );
};

export default InlineBannerAd;
