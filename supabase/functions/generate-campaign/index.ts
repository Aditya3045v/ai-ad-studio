import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface CampaignRequest {
  brandName: string;
  industry: string;
  theme: string;
  headlineText: string;
  visualStyle: string;
  brandColor: string;
  productImageBase64?: string;
  productImageMimeType?: string;
  logoImageBase64?: string;
  logoImageMimeType?: string;
}

async function callLovableAI(apiKey: string, body: Record<string, unknown>) {
  const resp = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw { status: 429, message: "Rate limit exceeded. Please try again shortly." };
    if (resp.status === 402) throw { status: 402, message: "AI credits exhausted. Please add credits in your workspace." };
    const t = await resp.text();
    console.error("AI gateway error:", resp.status, t);
    throw { status: 500, message: `AI gateway error: ${resp.status}` };
  }
  return resp.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      brandName, industry, theme, headlineText, visualStyle, brandColor,
      productImageBase64, productImageMimeType, logoImageBase64, logoImageMimeType,
    }: CampaignRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw { status: 500, message: "LOVABLE_API_KEY is not configured" };

    // ============================
    // STEP 1: Analyze product image with Gemini Flash (if provided)
    // ============================
    let productContext = "";

    if (productImageBase64 && productImageMimeType) {
      console.log("Step 1: Analyzing product image...");
      const visionData = await callLovableAI(LOVABLE_API_KEY, {
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "You are an expert product analyst. Analyze this product image in detail. Describe the product, its colors, textures, materials, shape, and any notable features. Be specific and vivid so a text-to-image AI can recreate this product accurately in a new scene. Keep your description to 3-4 sentences.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${productImageMimeType};base64,${productImageBase64}` },
            },
          ],
        }],
      });
      productContext = visionData.choices?.[0]?.message?.content || "";
      console.log("Product context:", productContext);
    }

    // ============================
    // STEP 2: Engineer image generation prompt
    // ============================
    console.log("Step 2: Engineering image prompt...");

    const styleDescriptions: Record<string, string> = {
      Photorealistic: "photorealistic, high-end commercial photography, studio lighting, sharp details",
      Neon: "neon lights, dark moody atmosphere, vibrant glowing colors, cyberpunk-inspired",
      Pastel: "soft pastel colors, minimalist, clean, gentle gradients, calming aesthetic",
      Luxury: "luxury, gold accents, rich textures, premium feel, elegant composition, dark tones",
    };
    const styleDesc = styleDescriptions[visualStyle] || styleDescriptions.Photorealistic;

    const productSection = productContext
      ? `\n\nIMPORTANT PRODUCT CONTEXT (from analyzing the uploaded product photo):\n${productContext}\nYou MUST incorporate this exact product into the scene naturally.`
      : "";

    const promptData = await callLovableAI(LOVABLE_API_KEY, {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a Prompt Engineer for an AI image generator. Write a single, detailed prompt for a 1:1 square marketing image. The image must:
1. Feature the text "${headlineText}" rendered clearly and legibly as part of the design
2. Match the visual style: ${styleDesc}
3. Use the brand color ${brandColor} as a dominant accent
4. Be suitable for a ${theme}-themed ${industry} marketing campaign for the brand "${brandName}"
5. Look professional and eye-catching for social media

Rules:
- Output ONLY the prompt text, nothing else
- Do NOT include instructions like "generate" or "create" — just describe the scene
- The text "${headlineText}" must appear spelled correctly and be the focal point
- Keep the prompt under 200 words
- Describe specific composition, lighting, typography style, and visual elements`,
        },
        {
          role: "user",
          content: `Brand: ${brandName}\nIndustry: ${industry}\nTheme/Occasion: ${theme}\nHeadline Text: "${headlineText}"\nVisual Style: ${visualStyle}\nBrand Color: ${brandColor}${productSection}\n\nWrite the image generation prompt now.`,
        },
      ],
    });

    const imagenPrompt = promptData.choices?.[0]?.message?.content?.trim() || "";
    console.log("Engineered prompt:", imagenPrompt);
    if (!imagenPrompt) throw { status: 500, message: "Failed to generate image prompt" };

    // ============================
    // STEP 3: Generate image with Gemini 2.5 Flash Image
    // ============================
    console.log("Step 3: Generating image with gemini-2.5-flash-image...");

    // Build message content - include product/logo images as context for the generation
    const imageGenContent: any[] = [{ type: "text", text: imagenPrompt }];

    if (productImageBase64 && productImageMimeType) {
      imageGenContent.push({
        type: "image_url",
        image_url: { url: `data:${productImageMimeType};base64,${productImageBase64}` },
      });
    }

    if (logoImageBase64 && logoImageMimeType) {
      imageGenContent.push({
        type: "image_url",
        image_url: { url: `data:${logoImageMimeType};base64,${logoImageBase64}` },
      });
    }

    const imageData = await callLovableAI(LOVABLE_API_KEY, {
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: imageGenContent }],
      modalities: ["image", "text"],
    });

    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(imageData).slice(0, 500));
      throw { status: 500, message: "No image was generated" };
    }

    // ============================
    // STEP 4: Generate caption with Gemini Flash
    // ============================
    console.log("Step 4: Generating caption...");

    let caption = "";
    try {
      const captionData = await callLovableAI(LOVABLE_API_KEY, {
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert social media copywriter. Generate a compelling social media caption for a marketing post. The caption should:
1. Be engaging and on-brand
2. Include 2-3 relevant hashtags at the end
3. Be between 50-150 words
4. Match the tone of the campaign theme
5. Include a clear call to action
Output ONLY the caption text, nothing else.`,
          },
          {
            role: "user",
            content: `Brand: ${brandName}\nIndustry: ${industry}\nTheme/Occasion: ${theme}\nMain Headline: "${headlineText}"\nVisual Style: ${visualStyle}\n\nWrite a matching social media caption.`,
          },
        ],
      });
      caption = captionData.choices?.[0]?.message?.content?.trim() || "";
    } catch (e) {
      console.warn("Caption generation failed, continuing without caption:", e);
    }

    console.log("Campaign generation complete!");

    return new Response(
      JSON.stringify({ imageUrl, caption, prompt: imagenPrompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("generate-campaign error:", e);
    const status = e?.status || 500;
    const message = e?.message || (e instanceof Error ? e.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
