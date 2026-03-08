import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ safe: false, reason: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Gemini vision to analyze the image for NSFW content
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a content moderation system. Analyze the image and determine if it contains NSFW content (nudity, pornography, explicit sexual content, gore, extreme violence). 
Respond ONLY with a JSON object: {"safe": true} or {"safe": false, "reason": "brief reason"}
Be strict about nudity and pornography. Allow normal marketplace product photos.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` },
              },
              { type: "text", text: "Is this image safe for a marketplace listing? Analyze for NSFW content." },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ safe: false, reason: "Rate limited, try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ safe: false, reason: "Service unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      // On AI error, allow the image (fail open for marketplace usability)
      return new Response(JSON.stringify({ safe: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response from the model
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify({ safe: !!result.safe, reason: result.reason || "" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      // If parsing fails, check for keywords
    }

    // Fallback: check content for safety indicators
    const lowerContent = content.toLowerCase();
    const isSafe = !lowerContent.includes('"safe": false') && !lowerContent.includes("nsfw") && !lowerContent.includes("inappropriate");

    return new Response(JSON.stringify({ safe: isSafe, reason: isSafe ? "" : "Content flagged as potentially inappropriate" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("NSFW check error:", e);
    // Fail open - allow image if check fails
    return new Response(JSON.stringify({ safe: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
