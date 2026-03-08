import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  jsonLd?: Record<string, any>;
}

const BASE_URL = "https://conectadoemsergipe.lovable.app";
const DEFAULT_OG_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/7QRlYRXn6KMdpPSlH1neUmMRWDh1/social-images/social-1772944286796-fgfgfgfgfgfgfgfg.webp";

const SEOHead = ({ title, description, path = "/", ogImage }: SEOHeadProps) => {
  useEffect(() => {
    const fullTitle = title === "Conectados em Sergipe" ? title : `${title} | Conectados em Sergipe`;
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const url = `${BASE_URL}${path}`;
    const image = ogImage || DEFAULT_OG_IMAGE;

    setMeta("name", "description", description);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image);
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:card", "summary_large_image");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, path, ogImage]);

  return null;
};

export default SEOHead;
