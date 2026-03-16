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
    const prompt = `Create a FUN, vibrant, cartoon-style corporate battle illustration — bold colors, playful energy, like a Pixar movie poster meets a comic book cover. "${companyA}" (${industryA || "corporation"}) on the left vs "${companyB}" (${industryB || "corporation"}) on the right.

Feature TWO cartoon characters facing off — pick two DIFFERENT people each time from: a Black woman with natural hair in a power suit, a short-statured Latino guy with a giant briefcase, a hijabi woman holding a glowing tablet, a wheelchair-using dude with rocket boosters on the wheels, an elderly Asian grandma cracking her knuckles, a plus-size Indigenous woman with a cape, a blind guy with a high-tech white cane that shoots lightning, a tall lanky redhead woman with vitiligo flexing. They should be EXAGGERATED, expressive, and funny — big heads, dynamic poses, confident grins. NOT realistic — think Overwatch character select screen energy.

Between them: a huge electric "VS" with cartoon lightning bolts and sparkle effects. Behind each character: simplified cartoon buildings or industry icons for their company. Bottom text: "${companyA} vs ${companyB}" in a fun bold font.

Style: Saturday morning cartoon meets corporate satire. Bright saturated colors, thick outlines, cel-shaded look, exaggerated proportions, tons of personality. FUN and shareable. Clean background.`;

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

    // Handle error payloads wrapped in 200 responses
    if (aiData.error) {
      const code = aiData.error.code || 500;
      console.error("AI gateway error payload:", JSON.stringify(aiData.error));
      if (code === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(aiData.error.message || "AI generation failed");
    }

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
