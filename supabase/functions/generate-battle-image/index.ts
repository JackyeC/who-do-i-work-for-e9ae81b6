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
    const prompt = `Create a fun, colorful, cartoon-style corporate battle illustration featuring people we rarely see as heroes — disabled warriors in wheelchairs with rocket boosters, short-statured champions, Latina queens, Indigenous warriors with traditional markings, hijabi fighters, amputee heroes with prosthetic power arms, people with vitiligo, plus-size warriors, elderly grandma generals, visually impaired fighters with cool canes-turned-swords. Mix it up every time! On the left side, show one such unexpected warrior champion representing "${companyA}" (${industryA || "corporation"}) — fierce, confident, in creative corporate armor. On the right side, show a DIFFERENT type of unexpected warrior representing "${companyB}" (${industryB || "corporation"}) — equally iconic but a completely different body type, ethnicity, or disability. They face each other in an epic showdown arena with dramatic lightning between them. Style: bold colors, vibrant, exaggerated expressions, humorous corporate satire. Include "VS" text in the center with electric effects. Make it fun, empowering, and shareable. Clean white background behind the arena. Celebrate the full spectrum of human diversity — bodies, abilities, ethnicities, ages.`;

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
