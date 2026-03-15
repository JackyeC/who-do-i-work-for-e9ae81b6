import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyA, companyB, industryA, industryB } = await req.json();
    if (!companyA || !companyB) throw new Error("Both company names are required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a deterministic filename so we cache per pair
    const pair = [companyA, companyB].sort().join("-vs-").toLowerCase().replace(/[^a-z0-9-]/g, "");
    const fileName = `${pair}.png`;

    // Check if image already exists in storage
    const { data: existing } = await supabase.storage.from("battle-images").createSignedUrl(fileName, 3600);
    if (existing?.signedUrl) {
      // Verify it actually exists by trying to download
      const check = await fetch(existing.signedUrl, { method: "HEAD" });
      if (check.ok) {
        const { data: publicUrl } = supabase.storage.from("battle-images").getPublicUrl(fileName);
        return new Response(JSON.stringify({ imageUrl: publicUrl.publicUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Generate a fun battle image with Gemini
    const prompt = `Create a sophisticated, high-contrast corporate intelligence illustration in a premium editorial style — dark background (#080b0f), violet and cyan accent lighting, clean geometric composition. This is a "Corporate Transparency Showdown" between "${companyA}" (${industryA || "corporation"}) on the left and "${companyB}" (${industryB || "corporation"}) on the right.

Feature TWO real-looking, photorealistic people facing each other — everyday professionals who reflect what the actual workforce looks like. Randomly choose from: a Black woman in business attire, a Latino man with a prosthetic arm in a sharp blazer, a South Asian woman in a hijab reviewing documents, a short-statured white man at a standing desk, an elderly Asian woman with silver hair and reading glasses, a plus-size Indigenous woman with a laptop, a young blind professional with a white cane and earbuds, a wheelchair-using Black man in a crisp suit. Pick TWO DIFFERENT people each time — different ethnicities, body types, ages, and abilities. They should look like real professionals, NOT cartoon warriors.

Each person stands confidently on their side with subtle corporate iconography behind them (office towers, data screens, stock tickers). Between them: a bold "VS" in electric violet with subtle data-stream effects. At the bottom, a sleek status bar reads "${companyA} vs ${companyB} — WHO'S MORE TRANSPARENT?"

Style: Bloomberg Terminal meets editorial magazine cover. Moody lighting, sharp typography, premium and authoritative. NOT cartoonish, NOT cute — this is serious career intelligence. Dark, cinematic, high-end.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", status, t);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl) {
      console.error("No image in AI response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("No image generated");
    }

    // Extract base64 and upload to storage
    const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("battle-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to store image");
    }

    const { data: publicUrl } = supabase.storage.from("battle-images").getPublicUrl(fileName);

    return new Response(JSON.stringify({ imageUrl: publicUrl.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("battle-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
