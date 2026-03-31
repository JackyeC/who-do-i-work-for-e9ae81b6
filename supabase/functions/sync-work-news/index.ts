/**
 * Sync Work News — Dual-source workforce intelligence feed.
 * 
 * Sources:
 *   1. NewsAPI.org (keyword search, structured, fast)
 *   2. GDELT DOC API (global, free, sentiment-scored)
 * 
 * Runs every 4 hours via pg_cron.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";
const NEWSAPI_BASE = "https://newsapi.org/v2/everything";

// ─── Shared config ───

const NEWSAPI_QUERIES = [
  { q: "labor laws OR NLRB OR workplace regulation", category: "regulation" },
  { q: "future of work OR return to office OR remote work", category: "future_of_work" },
  { q: "AI hiring OR AI workplace OR automated hiring", category: "ai_workplace" },
  { q: "mass layoffs OR pay equity OR salary transparency", category: "layoffs" },
  { q: "union OR collective bargaining OR minimum wage", category: "labor_organizing" },
];

const GDELT_QUERIES = [
  { q: '("labor laws" OR "workplace regulation" OR "Department of Labor enforcement")', category: "regulation" },
  { q: '("future of work" OR "return to office policy" OR "AI workplace automation")', category: "future_of_work" },
  { q: '("mass layoffs announced" OR "salary transparency law" OR "pay equity audit")', category: "layoffs" },
  { q: '("labor union organizing" OR "collective bargaining agreement" OR "minimum wage increase")', category: "labor_organizing" },
];

function toneLabel(tone: number): string {
  if (tone >= 5) return "Very Positive";
  if (tone >= 1.5) return "Positive";
  if (tone >= -1.5) return "Neutral";
  if (tone >= -5) return "Negative";
  return "Very Negative";
}

const controversyPatterns = /lawsuit|sued|scandal|investigation|fraud|violation|fine|penalty|discrimination|harassment|layoff|recall|breach|whistleblow|strike|protest/i;

function detectControversyType(title: string): string | null {
  if (/lawsuit|sued|litigation/i.test(title)) return "litigation";
  if (/scandal|fraud/i.test(title)) return "scandal";
  if (/investigation|probe/i.test(title)) return "investigation";
  if (/discrimination|harassment/i.test(title)) return "workplace";
  if (/layoff|restructur|WARN/i.test(title)) return "workforce";
  if (/strike|protest|walkout/i.test(title)) return "labor_action";
  if (/fine|penalty|violation/i.test(title)) return "regulatory";
  return null;
}

function hashUrl(url: string): string {
  return url.slice(-100).replace(/[^a-zA-Z0-9]/g, "");
}

// ─── NewsAPI fetcher ───

async function fetchNewsAPI(apiKey: string): Promise<any[]> {
  const rows: any[] = [];

  for (const { q, category } of NEWSAPI_QUERIES) {
    try {
      const params = new URLSearchParams({
        q,
        language: "en",
        sortBy: "publishedAt",
        pageSize: "20",
        apiKey,
      });

      const res = await fetch(`${NEWSAPI_BASE}?${params}`);
      if (!res.ok) {
        console.warn(`[NewsAPI] Query "${q.slice(0, 30)}..." failed: ${res.status}`);
        continue;
      }

      const data = await res.json();
      for (const article of data.articles || []) {
        if (!article.url || !article.title || article.title === "[Removed]") continue;

        const title = article.title;
        const isControversy = controversyPatterns.test(title);

        rows.push({
          headline: title.slice(0, 500),
          source_name: article.source?.name || null,
          source_url: article.url,
          published_at: article.publishedAt || new Date().toISOString(),
          sentiment_score: null, // NewsAPI doesn't provide tone
          tone_label: null,
          themes: [],
          category,
          is_controversy: isControversy,
          controversy_type: isControversy ? detectControversyType(title) : null,
          gdelt_url_hash: hashUrl(article.url),
        });
      }

      // Small delay between queries
      await new Promise(r => setTimeout(r, 500));
    } catch (e: any) {
      console.warn(`[NewsAPI] Error for "${q.slice(0, 30)}...":`, e);
    }
  }

  console.log(`[NewsAPI] Fetched ${rows.length} articles`);
  return rows;
}

// ─── GDELT fetcher ───

async function fetchGDELT(): Promise<any[]> {
  const rows: any[] = [];

  for (const { q, category } of GDELT_QUERIES) {
    try {
      const encoded = encodeURIComponent(q);
      const url = `${GDELT_DOC_API}?query=${encoded}&mode=ArtList&maxrecords=15&format=json&timespan=48h&sort=DateDesc`;

      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[GDELT] Query failed: ${res.status}`);
        await new Promise(r => setTimeout(r, 6000));
        continue;
      }

      const text = await res.text();
      if (!text.startsWith("{") && !text.startsWith("[")) {
        console.warn(`[GDELT] Non-JSON response: ${text.slice(0, 80)}`);
        await new Promise(r => setTimeout(r, 6000));
        continue;
      }

      const data = JSON.parse(text);
      for (const a of data?.articles || []) {
        if (!a.url || !a.title) continue;

        const tone = a.tone ? parseFloat(String(a.tone).split(",")[0]) : 0;
        const title = a.title;
        const isControversy = controversyPatterns.test(title);

        rows.push({
          headline: title.slice(0, 500),
          source_name: a.domain || null,
          source_url: a.url,
          published_at: a.seendate
            ? new Date(a.seendate.slice(0, 4) + "-" + a.seendate.slice(4, 6) + "-" + a.seendate.slice(6, 8)).toISOString()
            : new Date().toISOString(),
          sentiment_score: tone,
          tone_label: toneLabel(tone),
          themes: a.themes ? String(a.themes).split(";").slice(0, 10) : [],
          category,
          is_controversy: isControversy,
          controversy_type: isControversy ? detectControversyType(title) : null,
          gdelt_url_hash: hashUrl(a.url),
        });
      }

      await new Promise(r => setTimeout(r, 6000));
    } catch (e: any) {
      console.warn(`[GDELT] Error:`, e);
    }
  }

  console.log(`[GDELT] Fetched ${rows.length} articles`);
  return rows;
}

// ─── Main handler ───

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // No auth gate — this function is called by pg_cron and internally only

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const newsApiKey = Deno.env.get("NEWS_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Fetch from both sources in parallel
    const [newsApiRows, gdeltRows] = await Promise.allSettled([
      newsApiKey ? fetchNewsAPI(newsApiKey) : Promise.resolve([]),
      fetchGDELT(),
    ]);

    const allRows = [
      ...(newsApiRows.status === "fulfilled" ? newsApiRows.value : []),
      ...(gdeltRows.status === "fulfilled" ? gdeltRows.value : []),
    ];

    // Deduplicate by URL hash
    const seen = new Set<string>();
    const unique = allRows.filter(r => {
      if (seen.has(r.gdelt_url_hash)) return false;
      seen.add(r.gdelt_url_hash);
      return true;
    });

    if (unique.length > 0) {
      const { error } = await supabase.from("work_news").upsert(unique, {
        onConflict: "gdelt_url_hash",
        ignoreDuplicates: true,
      });
      if (error) console.error("work_news upsert error:", error);
    }

    const { count } = await supabase
      .from("work_news")
      .select("*", { count: "exact", head: true });

    const sources = {
      newsapi: newsApiRows.status === "fulfilled" ? newsApiRows.value.length : 0,
      gdelt: gdeltRows.status === "fulfilled" ? gdeltRows.value.length : 0,
    };

    console.log(`[sync-work-news] Synced ${unique.length} unique articles (NewsAPI: ${sources.newsapi}, GDELT: ${sources.gdelt}). Total: ${count}`);

    return new Response(
      JSON.stringify({ success: true, newArticles: unique.length, totalArticles: count, sources }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[sync-work-news] error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
