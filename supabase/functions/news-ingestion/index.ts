// ============================================================
// WDIWF Edge Function: news-ingestion
// Fetches world-of-work news from external API + internal signals
// Deploy: supabase functions deploy news-ingestion
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceRole } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

// --- CONFIGURE YOUR NEWS API HERE ---
// Option A: NewsMesh ($29/mo) — recommended for value
// Option B: Mediastack ($25/mo) — simpler, less enrichment
// Option C: NewsAPI.org ($449/mo) — most comprehensive
// Option D: NewsData.io (free tier, 200 credits/day)
const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY") || "";
const NEWS_API_PROVIDER = Deno.env.get("NEWS_API_PROVIDER") || "newsdata"; // 'newsmesh' | 'mediastack' | 'newsapi' | 'newsdata'

// Topics that map to WDIWF's world-of-work focus
const SEARCH_QUERIES = [
  "workplace diversity equity inclusion",
  "corporate layoffs restructuring",
  "pay equity salary transparency",
  "remote work return to office",
  "AI hiring discrimination employment",
  "labor union NLRB worker rights",
  "corporate lobbying PAC spending",
  "OSHA workplace safety",
  "EEOC discrimination lawsuit",
  "whistleblower corporate fraud",
  "DEI programs corporate",
  "government contractor ethics",
];

// Map keywords to WDIWF value tags
const VALUE_TAG_RULES: Record<string, string[]> = {
  "diversity|equity|inclusion|dei|discrimination": ["Diversity & Inclusion"],
  "pay equity|salary|compensation|wage": ["Pay Equity"],
  "environment|climate|sustainability|esg": ["Environmental Sustainability"],
  "union|labor|worker|nlrb|strike": ["Worker Rights"],
  "ai hiring|algorithm|bias|automated": ["Ethical AI"],
  "transparency|disclose|whistleblower|audit": ["Transparency"],
  "community|local|impact|philanthropy": ["Community Impact"],
  "mental health|wellness|burnout|wellbeing": ["Mental Health Support"],
  "remote work|hybrid|work from home|flexible": ["Remote Work"],
  "anti-discrimination|eeoc|civil rights": ["Anti-Discrimination"],
  "whistleblower|retaliation|reporting": ["Whistleblower Protection"],
  "lobbying|pac|political|donation": ["Fair Lobbying"],
  "privacy|data protection|surveillance": ["Data Privacy"],
  "veteran|military|service member": ["Veteran Support"],
  "disability|ada|accessible|accommodation": ["Disability Inclusion"],
};

const CATEGORY_RULES: Record<string, string> = {
  "layoff|restructuring|job cuts|rif|downsizing": "layoffs",
  "dei|diversity|equity|inclusion": "dei",
  "remote work|return to office|hybrid|wfh": "workplace",
  "policy|legislation|bill|act|regulation|eeoc|osha": "policy",
  "lobbying|pac|political|donation|campaign": "wdiwf_intel",
  "industry|market|earnings|ipo|merger|acquisition": "industry",
};

const INDUSTRY_TAG_RULES: Record<string, string[]> = {
  "tech|software|google|meta|microsoft|apple|amazon": ["Technology"],
  "bank|finance|goldman|jpmorgan|wall street": ["Finance"],
  "hospital|health|pharma|medical": ["Healthcare"],
  "defense|military|lockheed|raytheon|boeing": ["Defense"],
  "hr tech|workday|greenhouse|lever|ats": ["HR Tech"],
  "oil|gas|energy|solar|wind": ["Energy"],
  "retail|walmart|target|costco|store": ["Retail"],
  "media|news|entertainment|streaming": ["Media"],
  "education|school|university|college": ["Education"],
  "government|federal|state|agency": ["Government"],
};

// Known WDIWF company slugs for cross-referencing
const COMPANY_SLUG_MAP: Record<string, string> = {
  "google": "google", "alphabet": "google",
  "amazon": "amazon", "meta": "meta", "facebook": "meta",
  "apple": "apple", "microsoft": "microsoft",
  "tesla": "tesla", "walmart": "walmart",
  "salesforce": "salesforce", "deloitte": "deloitte",
  "lockheed martin": "lockheed-martin", "boeing": "boeing",
  "raytheon": "raytheon", "palantir": "palantir",
  "costco": "costco", "target": "target",
  "jpmorgan": "jpmorgan", "goldman sachs": "goldman-sachs",
  "wells fargo": "wells-fargo", "disney": "disney",
  "starbucks": "starbucks", "nike": "nike",
  "uber": "uber", "lyft": "lyft",
  // Add more as your companies table grows
};

// ─── Content quality gates (English-only, US/AI/world-scale focus) ───

const NON_LATIN_RE = /[\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u0900-\u097F\u0980-\u09FF\u0E00-\u0E7F\u1100-\u11FF\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u10A0-\u10FF\u0530-\u058F]/;
const ROMANCE_MARKERS_SERVER = [
  /\b(país|empregos?|brasileiros?|trabalho|governo|milhares|milhões|promete|saem|vistos?|semanas?)\b/gi,
  /\b(según|también|durante|gobierno|trabajo|empleos?|millones|pueden|después|mientras)\b/gi,
  /\b(aussi|gouvernement|travail|emplois?|nouveau|peuvent|après|pendant|depuis|cette)\b/gi,
];
const FOREIGN_LIFESTYLE_RE = /\b(visa[s]?\s+(that|which|para|pour)|jobs?\s+abroad|work\s+abroad|move\s+to\s+(europe|portugal|spain|bali|dubai)|digital\s+nomad|expat\s+(life|jobs))\b/i;
const NON_US_DOMAINS_SET = new Set([
  "watoday.com.au", "ibtimes.co.uk", "hcamag.com", "colombogazette.com",
  "demokraatti.fi", "di.se", "etnews.com", "sunstar.com.ph",
  "terra.com.br", "channelnewsasia.com", "bbc.co.uk", "theguardian.com",
  "g1.globo.com", "globo.com", "uol.com.br", "folha.uol.com.br",
  "lemonde.fr", "elpais.com", "spiegel.de", "corriere.it",
]);

function passesContentGates(title: string, source?: string | null): boolean {
  if (!title || title.length < 3) return false;
  if (NON_LATIN_RE.test(title)) return false;
  const slavic = title.match(/[łąęśźżćńřůțșđ]/gi);
  if (slavic && slavic.length >= 2) return false;
  const ext = title.match(/[\u00C0-\u024F]/g);
  if (ext && ext.length / title.length > 0.06) return false;
  const ascii = title.match(/[\x20-\x7E]/g);
  if (!ascii || ascii.length / title.length < 0.75) return false;
  let romanceHits = 0;
  for (const p of ROMANCE_MARKERS_SERVER) {
    const m = title.match(p);
    if (m) romanceHits += m.length;
  }
  if (romanceHits >= 3) return false;
  if (FOREIGN_LIFESTYLE_RE.test(title)) return false;
  if (source && NON_US_DOMAINS_SET.has(source.toLowerCase())) return false;
  return true;
}

function toValidatedWorkNewsRow(n: any) {
  if (!passesContentGates(n.title, n.source)) return null;

  return {
    headline: n.title,
    source_name: n.source,
    source_url: n.source_url,
    published_at: n.published_at,
    category: n.category || "general",
    themes: [...(n.value_tags || []), ...(n.industry_tags || [])],
    is_controversy: (n.tags || []).some((t: string) =>
      ["lawsuit", "whistleblower", "osha", "nlrb", "eeoc", "strike"].includes(t)
    ),
    controversy_type: null,
    sentiment_score: n.importance_score > 0.7 ? 0.3 : 0.5,
    tone_label: n.importance_score > 0.7 ? "Alert" : "Neutral",
    language: "en",
  };
}

Deno.serve(async (req: Request) => {

  // Auth guard: require service-role key
  const authDenied = requireServiceRole(req);
  if (authDenied) return authDenied;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const newsItems = [];

    // === SOURCE 1: External News API ===
    if (NEWS_API_KEY) {
      const externalNews = await fetchExternalNews();
      newsItems.push(...externalNews);
    }

    // === SOURCE 2: WDIWF Internal Signals ===
    // Convert recent company_signal_scans into news-format items
    const internalNews = await fetchInternalSignals(supabase);
    newsItems.push(...internalNews);

    // === SOURCE 3: Recent ticker_items (already curated) ===
    const tickerNews = await fetchTickerAsNews(supabase);
    newsItems.push(...tickerNews);

    // Deduplicate by title similarity + content quality gates
    const uniqueNews = deduplicateNews(newsItems).filter((n: any) => passesContentGates(n.title, n.source));

    // Upsert into personalized_news (update existing rows to refresh published_at)
    if (uniqueNews.length > 0) {
      const { error } = await supabase
        .from("personalized_news")
        .upsert(uniqueNews, {
          onConflict: "title",
          ignoreDuplicates: false
        });

      if (error) {
        console.error("Insert personalized_news error:", error);
      }

      // === ALSO write to work_news (what the live ticker actually reads) ===
      const workNewsRows = uniqueNews.flatMap((n: any) => {
        const validatedRow = toValidatedWorkNewsRow(n);
        if (!validatedRow) {
          console.log(`[news-ingestion] Rejected work_news row: "${n.title?.slice(0, 60)}" from ${n.source}`);
          return [];
        }

        return [validatedRow];
      });

      if (workNewsRows.length > 0) {
        const { error: wnError } = await supabase
          .from("work_news")
          .upsert(workNewsRows, {
            onConflict: "headline",
            ignoreDuplicates: true,
          });

        if (wnError) {
          console.error("Insert work_news error:", wnError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: uniqueNews.length,
        sources: {
          external: newsItems.filter(n => n.source !== "WDIWF Intelligence" && n.source !== "WDIWF Ticker").length,
          internal: newsItems.filter(n => n.source === "WDIWF Intelligence").length,
          ticker: newsItems.filter(n => n.source === "WDIWF Ticker").length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("News ingestion error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// === EXTERNAL NEWS FETCHER ===
async function fetchExternalNews() {
  const items: any[] = [];

  for (const query of SEARCH_QUERIES.slice(0, 6)) {
    // Rotate through queries to stay within rate limits
    try {
      let articles: any[] = [];

      if (NEWS_API_PROVIDER === "newsdata") {
        // NewsData.io (free tier available)
        const url = `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(query)}&language=en&category=business,politics&size=5`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(`[newsdata] query="${query}" status=${res.status} results_type=${typeof data.results} count=${Array.isArray(data.results) ? data.results.length : 'n/a'}`);
        const results = Array.isArray(data.results) ? data.results : [];
        articles = results.map((a: any) => ({
          title: a.title,
          summary: a.description || a.content?.slice(0, 300) || "",
          source: a.source_name || a.source_id || "External",
          source_url: a.link,
          published_at: a.pubDate || new Date().toISOString(),
        }));
      } else if (NEWS_API_PROVIDER === "newsmesh") {
        // NewsMesh ($29/mo)
        const url = `https://api.newsmesh.co/v1/search?q=${encodeURIComponent(query)}&language=en&limit=5`;
        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${NEWS_API_KEY}` },
        });
        const data = await res.json();
        articles = (data.articles || []).map((a: any) => ({
          title: a.title,
          summary: a.description || a.content?.slice(0, 300) || "",
          source: a.source?.name || "External",
          source_url: a.url,
          published_at: a.published_at || new Date().toISOString(),
        }));
      } else if (NEWS_API_PROVIDER === "mediastack") {
        // Mediastack ($25/mo)
        const url = `http://api.mediastack.com/v1/news?access_key=${NEWS_API_KEY}&keywords=${encodeURIComponent(query)}&languages=en&limit=5&categories=business,general`;
        const res = await fetch(url);
        const data = await res.json();
        articles = (data.data || []).map((a: any) => ({
          title: a.title,
          summary: a.description || "",
          source: a.source || "External",
          source_url: a.url,
          published_at: a.published_at || new Date().toISOString(),
        }));
      }

      for (const article of articles) {
        if (!article.title || !article.summary) continue;
        
        const titleLower = article.title.toLowerCase();
        const textLower = (article.title + " " + article.summary).toLowerCase();

        // Ensure published_at is within the 48h window used by get_personalized_news.
        // If the API returns an old date or no date, use the current time.
        const now = new Date();
        const cutoff = new Date(now.getTime() - 47 * 60 * 60 * 1000); // 47h to stay safely inside 48h window
        let pubDate = article.published_at ? new Date(article.published_at) : now;
        if (isNaN(pubDate.getTime()) || pubDate < cutoff) {
          pubDate = now;
        }

        items.push({
          title: article.title,
          summary: article.summary.slice(0, 500),
          source: article.source,
          source_url: article.source_url,
          category: categorizeText(textLower),
          tags: extractTags(textLower),
          value_tags: extractValueTags(textLower),
          industry_tags: extractIndustryTags(textLower),
          location_tags: extractLocationTags(textLower),
          company_slugs: extractCompanySlugs(textLower),
          importance_score: 0.5,
          published_at: pubDate.toISOString(),
          fetched_at: now.toISOString(),
          is_active: true,
        });
      }

      // Rate limit courtesy: small delay between queries
      await new Promise(r => setTimeout(r, 500));
    } catch (err: any) {
      console.error(`Error fetching query "${query}":`, err);
    }
  }

  return items;
}

// === INTERNAL SIGNALS → NEWS ===
async function fetchInternalSignals(supabase: any) {
  const items: any[] = [];

  // Get recent signal scans (last 24 hours) with high confidence
  const { data: signals } = await supabase
    .from("company_signal_scans")
    .select("signal_category, signal_type, signal_value, confidence_level, summary, direction, company_id")
    .gte("scan_timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .in("confidence_level", ["High", "Very High"])
    .order("scan_timestamp", { ascending: false })
    .limit(20);

  if (!signals || signals.length === 0) return items;

  // Get company names for these signals
  const companyIds = [...new Set(signals.map((s: any) => s.company_id))];
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, slug")
    .in("id", companyIds);

  const companyMap = (companies || []).reduce((acc: any, c: any) => {
    acc[c.id] = c;
    return acc;
  }, {});

  for (const signal of signals) {
    const company = companyMap[signal.company_id];
    if (!company || !signal.summary) continue;

    const title = `${company.name}: ${signal.signal_type.replace(/_/g, " ")} — ${signal.direction === "positive" ? "Positive Signal" : signal.direction === "negative" ? "Red Flag" : "Update"}`;

    items.push({
      title,
      summary: signal.summary,
      source: "WDIWF Intelligence",
      source_url: `https://wdiwf.jackyeclayton.com/company/${company.slug}`,
      category: "wdiwf_intel",
      tags: [signal.signal_category, signal.signal_type, company.name.toLowerCase()],
      value_tags: extractValueTags(signal.signal_type + " " + signal.summary),
      industry_tags: [],
      location_tags: [],
      company_slugs: [company.slug],
      importance_score: signal.confidence_level === "Very High" ? 0.9 : 0.7,
      published_at: new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      is_active: true,
    });
  }

  return items;
}

// === TICKER → NEWS ===
async function fetchTickerAsNews(supabase: any) {
  const items: any[] = [];

  // Get recent ticker items not yet in personalized_news
  const { data: tickers } = await supabase
    .from("ticker_items")
    .select("id, company_name, message, source_tag, item_type, created_at")
    .eq("is_hidden", false)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  for (const ticker of tickers || []) {
    const textLower = (ticker.company_name + " " + ticker.message).toLowerCase();

    items.push({
      title: `${ticker.company_name}: ${ticker.message}`,
      summary: ticker.message,
      source: "WDIWF Ticker",
      source_url: `https://wdiwf.jackyeclayton.com`,
      category: "wdiwf_intel",
      tags: [ticker.source_tag, ticker.company_name?.toLowerCase()].filter(Boolean),
      value_tags: extractValueTags(textLower),
      industry_tags: extractIndustryTags(textLower),
      location_tags: [],
      company_slugs: extractCompanySlugs(textLower),
      importance_score: ticker.item_type === "score_update" ? 0.8 : 0.6,
      published_at: ticker.created_at,
      fetched_at: new Date().toISOString(),
      is_active: true,
    });
  }

  return items;
}

// === TAGGING HELPERS ===
function categorizeText(text: string): string {
  for (const [pattern, category] of Object.entries(CATEGORY_RULES)) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(text)) return category;
  }
  return "industry";
}

function extractValueTags(text: string): string[] {
  const tags: string[] = [];
  for (const [pattern, values] of Object.entries(VALUE_TAG_RULES)) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(text)) tags.push(...values);
  }
  return [...new Set(tags)];
}

function extractIndustryTags(text: string): string[] {
  const tags: string[] = [];
  for (const [pattern, industries] of Object.entries(INDUSTRY_TAG_RULES)) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(text)) tags.push(...industries);
  }
  return [...new Set(tags)];
}

function extractLocationTags(text: string): string[] {
  const states: Record<string, string> = {
    "texas": "Texas", "california": "California", "new york": "New York",
    "florida": "Florida", "illinois": "Illinois", "washington": "Washington",
    "georgia": "Georgia", "ohio": "Ohio", "pennsylvania": "Pennsylvania",
    "virginia": "Virginia", "massachusetts": "Massachusetts",
    "colorado": "Colorado", "arizona": "Arizona", "michigan": "Michigan",
    "north carolina": "North Carolina", "oregon": "Oregon",
  };
  const tags: string[] = [];
  for (const [key, value] of Object.entries(states)) {
    if (text.includes(key)) tags.push(value);
  }
  return tags;
}

function extractCompanySlugs(text: string): string[] {
  const slugs: string[] = [];
  for (const [keyword, slug] of Object.entries(COMPANY_SLUG_MAP)) {
    if (text.includes(keyword.toLowerCase())) slugs.push(slug);
  }
  return [...new Set(slugs)];
}

function extractTags(text: string): string[] {
  const keywords = [
    "layoffs", "dei", "remote work", "rto", "union", "strike",
    "lawsuit", "eeoc", "osha", "nlrb", "whistleblower", "pac",
    "lobbying", "sec", "contract", "merger", "acquisition",
    "ai hiring", "pay equity", "transparency",
  ];
  return keywords.filter(k => text.includes(k));
}

function deduplicateNews(items: any[]): any[] {
  const seen = new Set<string>();
  return items.filter(item => {
    // Normalize title for dedup
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
