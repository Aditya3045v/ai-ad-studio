import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { headline, style, brandName, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const stylePrompts: Record<string, string> = {
      photorealistic: `A premium, high-end product photography scene. Clean white studio background, dramatic lighting, professional commercial photography style. Feature the text "${headline}" prominently in elegant serif typography. Product context: ${description} for ${brandName}. Ultra high resolution, 1:1 aspect ratio.`,
      cyberpunk: `A vibrant neon cyberpunk scene. Dark moody background with electric blue, pink and purple neon glowing lights, futuristic cityscape. Feature the text "${headline}" in bold glowing neon typography. Brand: ${brandName}. Ultra high resolution, 1:1 aspect ratio.`,
      pastel: `A minimalist pastel composition. Soft blush pink, lavender, and mint colors, lots of negative space, clean geometric shapes. Feature the text "${headline}" in modern sans-serif typography. Brand: ${brandName}. Ultra high resolution, 1:1 aspect ratio.`,
      "3d-render": `A stunning 3D rendered scene. Abstract geometric shapes, octane render quality, glossy materials, dramatic lighting with reflections. Feature the text "${headline}" in bold 3D extruded typography. Brand: ${brandName}. Ultra high resolution, 1:1 aspect ratio.`,
      lifestyle: `A warm, candid lifestyle photograph. People enjoying life, golden hour warm lighting, authentic and relatable scene. Feature the text "${headline}" in friendly modern typography as an overlay. Product context: ${description} for ${brandName}. Ultra high resolution, 1:1 aspect ratio.`,
    };

    const prompt = stylePrompts[style] || stylePrompts.photorealistic;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI image error:", response.status, t);
      throw new Error("AI image generation failed");
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ad-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
