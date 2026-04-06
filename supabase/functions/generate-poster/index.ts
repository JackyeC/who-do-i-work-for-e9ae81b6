import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { articleId, batchSize } = await req.json();

    // Fetch articles that need posters
    let query = supabase
      .from("receipts_enriched")
      .select("id, headline, category, spice_level, source_name")
      .is("poster_url", null)
      .order("published_at", { ascending: false });

    if (articleId) {
      query = query.eq("id", articleId);
    } else {
      query = query.limit(batchSize || 5);
    }

    const { data: articles, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ message: "No articles need posters", generated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; poster_url: string | null; error?: string }[] = [];

    for (const article of articles) {
      try {
        // Generate image via Lovable AI (Gemini image model)
        const prompt = buildPosterPrompt(article.headline, article.category, article.spice_level);

        const aiResp = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error(`AI error for ${article.id}: ${aiResp.status} ${errText}`);
          results.push({ id: article.id, poster_url: null, error: `AI ${aiResp.status}` });
          continue;
        }

        const aiData = await aiResp.json();

        // Extract base64 image from response
        const choice = aiData.choices?.[0];
        const parts = choice?.message?.content;

        let imageBase64: string | null = null;
        let mimeType = "image/png";

        if (Array.isArray(parts)) {
          const imgPart = parts.find((p: any) => p.type === "image_url" || p.type === "image");
          if (imgPart?.image_url?.url) {
            const dataUrl = imgPart.image_url.url;
            const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
            if (match) {
              mimeType = match[1];
              imageBase64 = match[2];
            }
          }
        } else if (typeof parts === "string") {
          // Sometimes response is just text - skip
          console.log(`Text-only response for ${article.id}, skipping`);
          results.push({ id: article.id, poster_url: null, error: "text-only response" });
          continue;
        }

        if (!imageBase64) {
          console.error(`No image in response for ${article.id}`);
          results.push({ id: article.id, poster_url: null, error: "no image in response" });
          continue;
        }

        // Decode and upload to storage
        const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
        const ext = mimeType === "image/jpeg" ? "jpg" : "png";
        const filePath = `posters/${article.id}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("poster-images")
          .upload(filePath, imageBytes, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadErr) {
          console.error(`Upload error for ${article.id}:`, uploadErr);
          results.push({ id: article.id, poster_url: null, error: uploadErr.message });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("poster-images")
          .getPublicUrl(filePath);

        const posterUrl = urlData.publicUrl;

        // Update the article
        const { error: updateErr } = await supabase
          .from("receipts_enriched")
          .update({ poster_url: posterUrl })
          .eq("id", article.id);

        if (updateErr) {
          console.error(`Update error for ${article.id}:`, updateErr);
          results.push({ id: article.id, poster_url: posterUrl, error: updateErr.message });
        } else {
          results.push({ id: article.id, poster_url: posterUrl });
        }

        // Small delay between generations to avoid rate limits
        if (articles.length > 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err) {
        console.error(`Error processing ${article.id}:`, err);
        results.push({ id: article.id, poster_url: null, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ generated: results.filter((r) => r.poster_url).length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-poster error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPosterPrompt(headline: string, category: string | null, spiceLevel: number): string {
  const catLabel = category?.replace(/_/g, " ") || "workplace news";
  const intensity = spiceLevel >= 4 ? "bold, high-contrast, urgent" : spiceLevel >= 2 ? "striking, professional" : "clean, editorial";

  return `Create a dramatic editorial magazine poster image for a workplace news story. 

HEADLINE: "${headline}"
CATEGORY: ${catLabel}
STYLE: ${intensity}

Requirements:
- Magazine/newspaper editorial poster aesthetic, like a movie poster or magazine cover
- Dark moody background with strong accent colors
- Include the headline text "${headline}" prominently displayed in bold typography
- Add a small "WDIWF" watermark in the corner
- Professional, provocative, journalistic feel
- Bold typography with high visual impact
- 1:1 square aspect ratio
- No photographs of real people - use abstract shapes, icons, or silhouettes instead
- Color palette should feel urgent and newsworthy`;
}
