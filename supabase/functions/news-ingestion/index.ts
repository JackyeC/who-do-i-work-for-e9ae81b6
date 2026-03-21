import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const newsApiKey = Deno.env.get("NEWS_API_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const inserted: string[] = [];

    // === SOURCE 1: Convert existing work_news into personalized_news ===
    const { data: workNews } = await supabase
      .from("work_news")
      .select("id, headline, source_name, source_url, category, is_controversy, themes, published_at, jackye_take")
      .order("published_at", { ascending: false })
      .limit(30);

    if (workNews && workNews.length > 0) {
      for (const item of workNews) {
        // Check if already imported
        const { data: existing } = await supabase
          .from("personalized_news")
          .select("id")
          .eq("source", "wdiwf_intel")
          .eq("title", item.headline)
          .maybeSingle();

        if (existing) continue;

        const categoryMap: Record<string, string> = {
          labor: "workplace",
          regulation: "policy",
          dei: "dei",
          layoffs: "layoffs",
          technology: "ai_hiring",
          culture: "workplace",
          compensation: "industry",
        };

        const valueTags: string[] = [];
        const cat = (item.category || "").toLowerCase();
        if (cat.includes("dei") || cat.includes("diversity")) valueTags.push("Diversity & Inclusion");
        if (cat.includes("comp") || cat.includes("pay")) valueTags.push("Pay Equity");
        if (cat.includes("labor") || cat.includes("union")) valueTags.push("Worker Rights");
        if (cat.includes("ai") || cat.includes("tech")) valueTags.push("Ethical AI");
        if (item.is_controversy) valueTags.push("Transparency");

        const { error } = await supabase.from("personalized_news").insert({
          title: item.headline,
          summary: item.jackye_take || `${item.headline} — via ${item.source_name || "WDIWF Intel"}`,
          source: "wdiwf_intel",
          source_url: item.source_url,
          category: categoryMap[cat] || "workplace",
          tags: item.themes || [],
          value_tags: valueTags,
          industry_tags: [],
          location_tags: [],
          company_slugs: [],
          importance_score: item.is_controversy ? 0.9 : 0.6,
          published_at: item.published_at || new Date().toISOString(),
          is_active: true,
        });

        if (!error) inserted.push(item.headline);
      }
    }

    // === SOURCE 2: External news API (if configured) ===
    if (newsApiKey) {
      const queries = [
        "hiring OR layoffs OR workplace",
        "DEI OR diversity OR pay equity",
        "labor rights OR union OR NLRB",
      ];

      for (const q of queries) {
        try {
          const url = `https://newsdata.io/api/1/latest?apikey=${newsApiKey}&q=${encodeURIComponent(q)}&language=en&size=5`;
          const res = await fetch(url);
          if (!res.ok) continue;
          const json = await res.json();

          for (const article of json.results || []) {
            const { data: existing } = await supabase
              .from("personalized_news")
              .select("id")
              .eq("title", article.title)
              .maybeSingle();

            if (existing) continue;

            // Auto-categorize
            const title = (article.title || "").toLowerCase();
            let category = "industry";
            if (title.includes("layoff") || title.includes("cut")) category = "layoffs";
            else if (title.includes("dei") || title.includes("diversity")) category = "dei";
            else if (title.includes("policy") || title.includes("regulation") || title.includes("law")) category = "policy";
            else if (title.includes("remote") || title.includes("hybrid")) category = "remote_work";
            else if (title.includes("ai") || title.includes("artificial")) category = "ai_hiring";
            else if (title.includes("workplace") || title.includes("culture")) category = "workplace";

            const valueTags: string[] = [];
            if (title.includes("dei") || title.includes("diversity")) valueTags.push("Diversity & Inclusion");
            if (title.includes("pay") || title.includes("salary") || title.includes("wage")) valueTags.push("Pay Equity");
            if (title.includes("union") || title.includes("labor") || title.includes("worker")) valueTags.push("Worker Rights");
            if (title.includes("ai") || title.includes("algorithm")) valueTags.push("Ethical AI");
            if (title.includes("climate") || title.includes("environment")) valueTags.push("Environmental Sustainability");

            const { error } = await supabase.from("personalized_news").insert({
              title: article.title,
              summary: article.description || article.title,
              source: article.source_name || article.source_id || "External",
              source_url: article.link,
              category,
              tags: article.keywords || [],
              value_tags: valueTags,
              industry_tags: [],
              location_tags: [],
              company_slugs: [],
              importance_score: 0.5,
              published_at: article.pubDate || new Date().toISOString(),
              is_active: true,
            });

            if (!error) inserted.push(article.title);
          }
        } catch (e) {
          console.error("News API query error:", e);
        }
      }
    }

    // === Cleanup: deactivate old news ===
    await supabase
      .from("personalized_news")
      .update({ is_active: false })
      .lt("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq("is_active", true);

    return new Response(
      JSON.stringify({ success: true, inserted_count: inserted.length, items: inserted.slice(0, 10) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("News ingestion error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
