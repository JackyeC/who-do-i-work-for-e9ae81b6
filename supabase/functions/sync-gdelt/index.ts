import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ error: "companyId and companyName required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Query GDELT DOC API for recent news about this company
    const query = encodeURIComponent(`"${companyName}"`);
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=25&format=json&timespan=90d&sort=DateDesc`;

    console.log("Querying GDELT for:", companyName);
    const gdeltRes = await fetch(gdeltUrl);

    if (!gdeltRes.ok) {
      console.error("GDELT API error:", gdeltRes.status);
      return new Response(JSON.stringify({ success: true, count: 0, message: "GDELT API unavailable" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const gdeltData = await gdeltRes.json();
    const articles = gdeltData?.articles || [];

    if (articles.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Map GDELT tone to labels
    function toneLabel(tone: number): string {
      if (tone >= 5) return "Very Positive";
      if (tone >= 1.5) return "Positive";
      if (tone >= -1.5) return "Neutral";
      if (tone >= -5) return "Negative";
      return "Very Negative";
    }

    // Controversy detection keywords
    const controversyPatterns = /lawsuit|sued|scandal|investigation|fraud|violation|fine|penalty|discrimination|harassment|layoff|recall|breach|whistleblow/i;

    function detectControversyType(title: string): string | null {
      if (/lawsuit|sued|litigation/i.test(title)) return "litigation";
      if (/scandal|fraud/i.test(title)) return "scandal";
      if (/investigation|probe/i.test(title)) return "investigation";
      if (/discrimination|harassment/i.test(title)) return "workplace";
      if (/layoff|restructur/i.test(title)) return "workforce";
      if (/breach|hack|leak/i.test(title)) return "data_breach";
      if (/fine|penalty|violation/i.test(title)) return "regulatory";
      return null;
    }

    const rows = articles.slice(0, 25).map((a: any) => {
      const tone = a.tone ? parseFloat(String(a.tone).split(",")[0]) : 0;
      const title = a.title || "Untitled";
      const isControversy = controversyPatterns.test(title);

      return {
        company_id: companyId,
        headline: title.slice(0, 500),
        source_name: a.domain || a.sourcecountry || null,
        source_url: a.url || null,
        published_at: a.seendate ? new Date(
          a.seendate.slice(0, 4) + "-" + a.seendate.slice(4, 6) + "-" + a.seendate.slice(6, 8)
        ).toISOString() : null,
        sentiment_score: tone,
        tone_label: toneLabel(tone),
        themes: a.themes ? String(a.themes).split(";").slice(0, 10) : [],
        is_controversy: isControversy,
        controversy_type: isControversy ? detectControversyType(title) : null,
        gdelt_doc_id: a.url ? String(a.url).slice(-80) : null,
      };
    });

    // Upsert — avoid duplicates by deleting old data first (simple approach)
    await supabase.from("company_news_signals").delete().eq("company_id", companyId);
    const { error: insertErr } = await supabase.from("company_news_signals").insert(rows);
    if (insertErr) console.error("Insert error:", insertErr);

    return new Response(
      JSON.stringify({ success: true, count: rows.length, controversies: rows.filter((r: any) => r.is_controversy).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("GDELT sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
