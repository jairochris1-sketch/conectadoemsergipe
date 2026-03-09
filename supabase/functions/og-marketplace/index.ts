import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SITE_URL = "https://conectadoemsergipe-com.lovable.app";
const DEFAULT_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/7QRlYRXn6KMdpPSlH1neUmMRWDh1/social-images/social-1772944286796-fgfgfgfgfgfgfgfg.webp";

const formatPrice = (price: string): string => {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
};

const escapeHtml = (str: string): string =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Detect crawlers/bots that fetch OG previews
const isCrawler = (userAgent: string): boolean => {
  const crawlers = [
    'facebookexternalhit', 'Facebot', 'WhatsApp', 'Twitterbot', 
    'TelegramBot', 'LinkedInBot', 'Slackbot', 'Discordbot',
    'Pinterest', 'Googlebot', 'bingbot', 'Embedly', 'Iframely'
  ];
  return crawlers.some(c => userAgent.toLowerCase().includes(c.toLowerCase()));
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const userAgent = req.headers.get("user-agent") || "";

  const url = new URL(req.url);
  const itemId = url.searchParams.get("id");

  if (!itemId) {
    return Response.redirect(`${SITE_URL}/marketplace`, 302);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: item } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (!item) {
    return Response.redirect(`${SITE_URL}/marketplace`, 302);
  }

  // Get seller name
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("user_id", item.user_id)
    .single();

  const title = escapeHtml(`${item.title} - ${formatPrice(item.price)}`);
  const seller = escapeHtml(profile?.name || "Usuário");
  const description = escapeHtml(
    item.description
      ? `${item.description.slice(0, 150)} | Vendedor: ${profile?.name || "Usuário"}${item.city ? ` | ${item.city}` : ""}`
      : `À venda por ${seller}${item.city ? ` em ${item.city}` : ""} no Conectados em Sergipe`
  );

  const images = Array.isArray(item.images) ? item.images as string[] : [];
  const ogImage = escapeHtml(images[0] || item.image_url || DEFAULT_IMAGE);
  const redirectUrl = `${SITE_URL}/marketplace?item=${itemId}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>${title} | Conectados em Sergipe</title>
  <meta name="description" content="${description}"/>
  <meta property="og:type" content="product"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description}"/>
  <meta property="og:image" content="${ogImage}"/>
  <meta property="og:url" content="${escapeHtml(redirectUrl)}"/>
  <meta property="og:site_name" content="Conectados em Sergipe"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${description}"/>
  <meta name="twitter:image" content="${ogImage}"/>
  <meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}"/>
</head>
<body>
  <p>Redirecionando para <a href="${escapeHtml(redirectUrl)}">${title}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});
