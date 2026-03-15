/**
 * Sync Work News — GDELT-powered global workforce intelligence feed.
 * 
 * Queries GDELT DOC API with workforce-related keywords every 4 hours.
 * No API key needed — completely free.
 * 
 * Keywords: labor laws, future of work, workplace regulation, employment bills,
 * return to office, AI workplace, layoffs, NLRB, Department of Labor.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";

// Workforce-related search queries
const SEARCH_QUERIES = [
  '"labor laws" OR "NLRB" OR "Department of Labor" OR "workplace regulation"',
  '"future of work" OR "return to office" OR "AI workplace" OR "AI hiring"',
  '"mass layoffs" OR "WARN Act" OR "pay equity" OR "salary transparency"',
  '"union" OR "collective bargaining" OR "employment bill" OR "minimum wage"',
];

// Category mapping based on query content
const QUERY_CATEGORIES: Record<number, string> = {
  0: "regulation",
  1: "future_of_work",
  2: "worker_rights",
  3: "ai_workplace",
  4: "legislation",
  5: "layoffs",
  6: "pay_equity",
  7: "labor_organizing",
};

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

// Simple hash for dedup
function hashUrl(url: string): string {
  // Use last 100 chars of URL as a simple hash key
  return url.slice(-100).replace(/[^a-zA-Z0-9]/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const allRows: any[] = [];

    for (let i = 0; i < SEARCH_QUERIES.length; i++) {
      const query = SEARCH_QUERIES[i];
      const category = QUERY_CATEGORIES[i] || "general";

      try {
        const encoded = encodeURIComponent(query);
        const url = `${GDELT_DOC_API}?query=${encoded}&mode=ArtList&maxrecords=15&format=json&timespan=48h&sort=DateDesc`;
        
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`GDELT query ${i} failed: ${res.status}`);
          continue;
        }

        const data = await res.json();
        const articles = data?.articles || [];

        for (const a of articles) {
          if (!a.url || !a.title) continue;

          const tone = a.tone ? parseFloat(String(a.tone).split(",")[0]) : 0;
          const title = a.title || "Untitled";
          const isControversy = controversyPatterns.test(title);
          const urlHash = hashUrl(a.url);

          allRows.push({
            headline: title.slice(0, 500),
            source_name: a.domain || null,
            source_url: a.url,
            published_at: a.seendate
              ? new Date(
                  a.seendate.slice(0, 4) + "-" + a.seendate.slice(4, 6) + "-" + a.seendate.slice(6, 8)
                ).toISOString()
              : new Date().toISOString(),
            sentiment_score: tone,
            tone_label: toneLabel(tone),
            themes: a.themes ? String(a.themes).split(";").slice(0, 10) : [],
            category,
            is_controversy: isControversy,
            controversy_type: isControversy ? detectControversyType(title) : null,
            gdelt_url_hash: urlHash,
          });
        }

        // Throttle between GDELT queries (free API, be respectful)
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
        console.warn(`GDELT query ${i} error:`, e);
      }
    }

    // Deduplicate by URL hash
    const seen = new Set<string>();
    const unique = allRows.filter(r => {
      if (seen.has(r.gdelt_url_hash)) return false;
      seen.add(r.gdelt_url_hash);
      return true;
    });

    if (unique.length > 0) {
      // Upsert to avoid duplicates
      const { error } = await supabase.from("work_news").upsert(unique, {
        onConflict: "gdelt_url_hash",
        ignoreDuplicates: true,
      });
      if (error) console.error("work_news upsert error:", error);
    }

    // Get total count for stats
    const { count } = await supabase
      .from("work_news")
      .select("*", { count: "exact", head: true });

    console.log(`[sync-work-news] Synced ${unique.length} new articles. Total: ${count}`);

    return new Response(
      JSON.stringify({ success: true, newArticles: unique.length, totalArticles: count }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync-work-news] error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
