import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InlineBannerAdData {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
}

const InlineBannerAd = () => {
  const [banner, setBanner] = useState<InlineBannerAdData | null>(null);

  useEffect(() => {
    supabase
      .from("banner_ads")
      .select("id, title, image_url, link_url")
      .eq("is_active", true)
      .or("position.eq.feed,position.eq.both")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Pick a random banner
          setBanner(data[Math.floor(Math.random() * data.length)]);
        }
      });
  }, []);

  if (!banner) return null;

  return (
    <div className="ad-slot ad-slot--feed border border-border bg-card p-2 my-1">
      <p className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">Patrocinado</p>
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer"
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
