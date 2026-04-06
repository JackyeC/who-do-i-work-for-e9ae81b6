/**
 * Sync Work News — Dual-source workforce intelligence feed.
 * Sources: NewsAPI.org + GDELT DOC API
 * Runs every 2 hours via pg_cron.
 * Dedup: ON CONFLICT (headline) DO UPDATE SET updated_at = now()
 * Purge: Deletes rows older than 30 days after each run.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";
const NEWSAPI_BASE = "https://newsapi.org/v2/everything";

// ─── Unified domain blocklist ───

const BLOCKED_DOMAINS = new Set([
  "psychologytoday.com", "kotaku.com", "ign.com", "gamespot.com",
  "polygon.com", "pcgamer.com", "eurogamer.net",
  "watoday.com.au", "ibtimes.co.uk", "hcamag.com", "ibtimes.com.au",
  "starcommunity.com.au", "abc.net.au",
  "colombogazette.com", "etnews.com", "sunstar.com.ph", "channelnewsasia.com",
  "terra.com.br", "g1.globo.com", "globo.com", "uol.com.br",
  "folha.uol.com.br", "senado.leg.br", "sonoticias.com.br",
  "lemonde.fr", "lefigaro.fr", "liberation.fr", "20minutes.fr", "francetvinfo.fr",
  "elpais.com", "rtve.es", "elmundo.es", "abc.es", "lavanguardia.com",
  "spiegel.de", "welt.de", "bild.de", "handelsblatt.com", "faz.net",
  "sueddeutsche.de", "zeit.de", "hna.de", "op-marburg.de",
  "merkur.de", "finanznachrichten.de",
  "corriere.it", "ideawebtv.it", "repubblica.it", "ilsole24ore.com",
  "ilfattoquotidiano.it", "ansa.it", "rainews.it", "spotandweb.it",
  "di.se", "dn.se", "dagensjuridik.se", "aftonbladet.se", "expressen.se",
  "nyteknik.se", "arbetet.se", "svensktnaringsliv.se",
  "demokraatti.fi",
  "nrc.nl",
  "tvn24.pl", "wp.pl", "onet.pl", "gazeta.pl",
]);

const BLOCKED_TLDS = new Set([
  ".se", ".fi", ".pl", ".it", ".de", ".fr", ".es", ".br",
  ".nl", ".ph", ".au", ".kr", ".jp", ".cn", ".tw", ".ru",
  ".ua", ".cz", ".sk", ".hu", ".ro", ".bg", ".hr", ".rs",
  ".no", ".dk", ".pt", ".gr", ".tr", ".in", ".pk", ".bd",
  ".lk", ".th", ".vn", ".id", ".my", ".sg",
]);

function isBlockedSource(domain: string | null): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase().trim();
  if (BLOCKED_DOMAINS.has(d)) return true;
  for (const tld of BLOCKED_TLDS) {
    if (d.endsWith(tld)) return true;
  }
  return false;
}

// ─── Source bias classification ───

const LEFT_SOURCES = new Set([
  "huffpost.com", "huffingtonpost.com", "msnbc.com", "theguardian.com",
  "vox.com", "slate.com", "salon.com", "motherjones.com", "thenation.com",
  "dailykos.com", "rawstory.com", "alternet.org", "commondreams.org",
  "democracynow.org", "jacobin.com", "theintercept.com", "newrepublic.com",
  "buzzfeednews.com", "cnn.com",
]);

const RIGHT_SOURCES = new Set([
  "foxnews.com", "foxbusiness.com", "dailywire.com", "breitbart.com",
  "nypost.com", "washingtontimes.com", "dailycaller.com", "theblaze.com",
  "oann.com", "newsmax.com", "freebeacon.com", "townhall.com",
  "nationalreview.com", "thefederalist.com", "americanthinker.com",
  "pjmedia.com", "redstate.com", "dailysignal.com",
]);

const CENTER_SOURCES = new Set([
  "apnews.com", "reuters.com", "bbc.com", "bbc.co.uk", "npr.org",
  "pbs.org", "usatoday.com", "thehill.com", "politico.com",
  "axios.com", "bloomberg.com", "wsj.com", "nytimes.com",
  "washingtonpost.com", "abcnews.go.com", "cbsnews.com", "nbcnews.com",
]);

function classifySourceBias(domain: string | null): "left" | "center" | "right" {
  if (!domain) return "center";
  const d = domain.toLowerCase().replace("www.", "");
  if (LEFT_SOURCES.has(d)) return "left";
  if (RIGHT_SOURCES.has(d)) return "right";
  return "center";
}

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

// ─── Content quality gates ───

const NON_LATIN_RE = /[\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u0900-\u097F\u0980-\u09FF\u0E00-\u0E7F\u1100-\u11FF\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u10A0-\u10FF\u0530-\u058F]/;
const ROMANCE_MARKERS = [
  /\b(país|empregos?|brasileiros?|trabalho|governo|milhares|milhões|promete|saem|vistos?|semanas?)\b/gi,
  /\b(según|también|durante|gobierno|trabajo|empleos?|millones|pueden|después|mientras)\b/gi,
  /\b(aussi|gouvernement|travail|emplois?|nouveau|peuvent|après|pendant|depuis|cette)\b/gi,
];
const FOREIGN_LIFESTYLE_RE = /\b(visa[s]?\s+(that|which|para|pour)|jobs?\s+abroad|work\s+abroad|move\s+to\s+(europe|portugal|spain|bali|dubai)|digital\s+nomad|expat\s+(life|jobs))\b/i;

function isServerEnglish(text: string): boolean {
  if (!text || text.length < 3) return false;
  if (NON_LATIN_RE.test(text)) return false;
  const slavic = text.match(/[łąęśźżćńřůțșđ]/gi);
  if (slavic && slavic.length >= 2) return false;
  const ext = text.match(/[\u00C0-\u024F]/g);
  if (ext && ext.length / text.length > 0.06) return false;
  const ascii = text.match(/[\x20-\x7E]/g);
  if (!ascii || ascii.length / text.length < 0.75) return false;
  let romanceHits = 0;
  for (const p of ROMANCE_MARKERS) {
    const m = text.match(p);
    if (m) romanceHits += m.length;
  }
  if (romanceHits >= 3) return false;
  const lower = text.toLowerCase();
  const germanHits = (lower.match(/\b(der|die|das|und|für|mit|auf|ist|von|nicht)\b/g) || []).length;
  if (germanHits >= 4) return false;
  const italianHits = (lower.match(/\b(il|la|le|lo|di|del|della|dei|per|che|non|con|una|più|nel|sul)\b/g) || []).length;
  if (italianHits >= 4) return false;
  const nordicHits = (lower.match(/\b(och|att|det|för|som|med|har|kan|inte|vara|eller|från|efter|denna|till)\b/g) || []).length;
  if (nordicHits >= 3) return false;
  return true;
}

function isServerRelevant(headline: string, source?: string | null): boolean {
  if (FOREIGN_LIFESTYLE_RE.test(headline)) return false;
  if (source && isBlockedSource(source)) return false;
  return true;
}

function passesContentGates(headline: string, source?: string | null): boolean {
  return isServerEnglish(headline) && isServerRelevant(headline, source);
}

function buildValidatedWorkNewsRow(row: any) {
  if (!passesContentGates(row.headline, row.source_name)) return null;
  const bias = classifySourceBias(row.source_name);
  return {
    ...row,
    language: "en",
    source_count_left: bias === "left" ? 1 : 0,
    source_count_center: bias === "center" ? 1 : 0,
    source_count_right: bias === "right" ? 1 : 0,
    source_total: 1,
  };
}

// ─── NewsAPI fetcher ───

async function fetchNewsAPI(apiKey: string): Promise<any[]> {
  const rows: any[] = [];

  for (const { q, category } of NEWSAPI_QUERIES) {
    try {
      const params = new URLSearchParams({
        q, language: "en", sortBy: "publishedAt", pageSize: "20", apiKey,
      });
      const res = await fetch(`${NEWSAPI_BASE}?${params}`);
      if (!res.ok) { console.warn(`[NewsAPI] "${q.slice(0, 30)}..." failed: ${res.status}`); continue; }

      const data = await res.json();
      for (const article of data.articles || []) {
        if (!article.url || !article.title || article.title === "[Removed]") continue;
        if (isBlockedSource(article.source?.name)) continue;
        try {
          const urlDomain = new URL(article.url).hostname.replace("www.", "");
          if (isBlockedSource(urlDomain)) continue;
        } catch { /* skip */ }

        const title = article.title;
        const isControversy = controversyPatterns.test(title);

        rows.push({
          headline: title.slice(0, 500),
          source_name: article.source?.name || null,
          source_url: article.url,
          published_at: article.publishedAt || new Date().toISOString(),
          sentiment_score: null, tone_label: null, themes: [], category,
          is_controversy: isControversy,
          controversy_type: isControversy ? detectControversyType(title) : null,
          gdelt_url_hash: hashUrl(article.url),
        });
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) { console.warn(`[NewsAPI] Error:`, e); }
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
      const url = `${GDELT_DOC_API}?query=${encoded} sourcelang:english sourcecountry:us&mode=ArtList&maxrecords=15&format=json&timespan=48h&sort=DateDesc`;
      const res = await fetch(url);
      if (!res.ok) { console.warn(`[GDELT] Query failed: ${res.status}`); await new Promise(r => setTimeout(r, 2000)); continue; }

      const text = await res.text();
      if (!text.startsWith("{") && !text.startsWith("[")) { await new Promise(r => setTimeout(r, 2000)); continue; }

      const data = JSON.parse(text);
      for (const a of data?.articles || []) {
        if (!a.url || !a.title) continue;
        const domain = a.domain || "";
        if (isBlockedSource(domain)) continue;

        const tone = a.tone ? parseFloat(String(a.tone).split(",")[0]) : 0;
        const title = a.title;
        const isControversy = controversyPatterns.test(title);

        rows.push({
          headline: title.slice(0, 500),
          source_name: domain || null,
          source_url: a.url,
          published_at: a.seendate
            ? new Date(a.seendate.slice(0, 4) + "-" + a.seendate.slice(4, 6) + "-" + a.seendate.slice(6, 8)).toISOString()
            : new Date().toISOString(),
          sentiment_score: tone, tone_label: toneLabel(tone),
          themes: a.themes ? String(a.themes).split(";").slice(0, 10) : [],
          category, is_controversy: isControversy,
          controversy_type: isControversy ? detectControversyType(title) : null,
          gdelt_url_hash: hashUrl(a.url),
        });
      }
      await new Promise(r => setTimeout(r, 2000));
    } catch (e: any) { console.warn(`[GDELT] Error:`, e); }
  }
  console.log(`[GDELT] Fetched ${rows.length} articles`);
  return rows;
}

// ─── Main handler ───

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const newsApiKey = Deno.env.get("NEWS_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const seen = new Set<string>();
    let totalInserted = 0;

    async function upsertBatch(rows: any[], label: string) {
      const unique = rows.flatMap(r => {
        if (seen.has(r.gdelt_url_hash)) return [];
        const validatedRow = buildValidatedWorkNewsRow(r);
        if (!validatedRow) return [];
        seen.add(r.gdelt_url_hash);
        return [validatedRow];
      });

      if (unique.length === 0) return;

      // Use ON CONFLICT (headline) to dedup by headline
      // Also upsert on gdelt_url_hash for URL-level dedup
      const { error } = await supabase.from("work_news").upsert(unique, {
        onConflict: "headline",
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(`[${label}] upsert error:`, error);
        // Fallback: try individual inserts to skip dupes
        for (const row of unique) {
          const { error: singleErr } = await supabase.from("work_news").upsert([row], {
            onConflict: "headline",
            ignoreDuplicates: true,
          });
          if (!singleErr) totalInserted++;
        }
      } else {
        console.log(`[${label}] Upserted ${unique.length} articles`);
        totalInserted += unique.length;
      }
    }

    // 1. NewsAPI
    if (newsApiKey) {
      try {
        const newsRows = await fetchNewsAPI(newsApiKey);
        await upsertBatch(newsRows, "NewsAPI");
      } catch (e) { console.warn("[NewsAPI] Failed:", e); }
    }

    // 2. GDELT
    try {
      const gdeltRows = await fetchGDELT();
      await upsertBatch(gdeltRows, "GDELT");
    } catch (e) { console.warn("[GDELT] Failed:", e); }

    // 3. Purge stories older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: purgeErr, count: purgeCount } = await supabase
      .from("work_news")
      .delete()
      .lt("published_at", thirtyDaysAgo)
      .select("*", { count: "exact", head: true });
    
    if (purgeErr) console.warn("[Purge] Error:", purgeErr);
    else console.log(`[Purge] Removed old articles before ${thirtyDaysAgo}`);

    const { count } = await supabase
      .from("work_news")
      .select("*", { count: "exact", head: true });

    console.log(`[sync-work-news] Synced ${totalInserted} articles. Total in DB: ${count}`);

    return new Response(
      JSON.stringify({ success: true, newArticles: totalInserted, totalArticles: count }),
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
