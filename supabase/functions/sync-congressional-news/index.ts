import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── RSS Feed Sources ────────────────────────────────────
const FEEDS = [
  { key: "the_hill", url: "http://thehill.com/rss/syndicator/19109", label: "The Hill" },
  { key: "politico", url: "https://rss.politico.com/congress.xml", label: "Politico Congress" },
  { key: "house_clerk", url: "https://clerk.house.gov/Home/Feed", label: "House Clerk" },
];

// Keywords that signal workplace/labor relevance
const WORKPLACE_KEYWORDS = [
  "labor", "worker", "employee", "union", "osha", "wage", "minimum wage",
  "overtime", "workplace", "nlrb", "eeoc", "discrimination", "hiring",
  "layoff", "workforce", "apprenticeship", "pension", "benefits",
  "paid leave", "family leave", "child care", "childcare", "dei",
  "diversity", "equity", "inclusion", "safety", "whistleblower",
  "non-compete", "gig economy", "contractor", "h-1b", "immigration",
  "dhs", "ice", "deportation", "remote work", "telework", "ai hiring",
  "automation", "right to work", "collective bargaining",
];

// Topic tags to apply based on content
const TOPIC_TAGS: Record<string, string[]> = {
  labor: ["labor", "union", "nlrb", "collective bargaining", "right to work", "worker", "minimum wage", "overtime", "osha"],
  immigration: ["immigration", "h-1b", "ice", "dhs", "deportation", "visa"],
  defense: ["defense", "pentagon", "military", "dod", "contract"],
  healthcare: ["healthcare", "aca", "medicare", "medicaid", "health insurance"],
  tech: ["ai", "artificial intelligence", "data privacy", "tech", "algorithm", "automation", "semiconductor", "chips act"],
  finance: ["sec", "wall street", "banking", "financial", "fdic", "cfpb"],
  energy: ["climate", "epa", "emissions", "renewable", "fossil fuel", "oil", "gas", "ev", "electric vehicle"],
  education: ["student loan", "education", "title ix", "university", "college"],
  trade: ["tariff", "trade", "import", "export", "customs"],
};

// ─── XML Parser (lightweight, no deps) ───────────────────
function parseRSSItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"))
        || block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? m[1].trim() : "";
    };
    items.push({
      title: get("title"),
      link: get("link") || get("guid"),
      description: get("description") || get("summary") || get("content:encoded"),
      pubDate: get("pubDate") || get("published") || get("updated"),
    });
  }

  // Atom feed fallback
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1];
      const get = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"))
          || block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
        return m ? m[1].trim() : "";
      };
      const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
      items.push({
        title: get("title"),
        link: linkMatch ? linkMatch[1] : get("link"),
        description: get("summary") || get("content"),
        pubDate: get("published") || get("updated"),
      });
    }
  }

  return items;
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

// ─── Matching Strategies ─────────────────────────────────

/** Strategy 1: Direct name match (existing) */
function matchByName(
  lower: string,
  companies: Array<{ id: string; name: string; canonical_name: string | null }>
): string[] {
  const ids: string[] = [];
  for (const co of companies) {
    const names = [co.name, co.canonical_name].filter(Boolean).map((n: string) => n.toLowerCase());
    for (const name of names) {
      if (name.length > 3 && lower.includes(name)) {
        ids.push(co.id);
        break;
      }
    }
  }
  return ids;
}

/** Strategy 2: Ticker mention match ($TSLA, TSLA) */
function matchByTicker(
  text: string,
  companies: Array<{ id: string; ticker: string }>
): string[] {
  const ids: string[] = [];
  for (const co of companies) {
    const t = co.ticker;
    if (!t || t.length < 2) continue;
    // Match $TSLA or standalone TSLA (word boundary, case-sensitive for tickers)
    const pattern = new RegExp(`(\\$${t}|\\b${t}\\b)`, t.length <= 2 ? "g" : "gi");
    if (pattern.test(text)) {
      ids.push(co.id);
    }
  }
  return ids;
}

/** Strategy 3: Industry-topic match — map article tags to companies by industry */
function matchByIndustryTopic(
  relevanceTags: string[],
  lower: string,
  industryMap: Array<{ industry: string; topic_tag: string; topic_keywords: string[] }>,
  companiesByIndustry: Map<string, string[]>
): string[] {
  const ids: string[] = [];

  for (const mapping of industryMap) {
    // Check if article has this topic tag
    const hasTag = relevanceTags.includes(mapping.topic_tag);
    if (!hasTag) continue;

    // Check if article text contains any of the specific topic keywords
    const keywordHits = mapping.topic_keywords.filter(kw => lower.includes(kw));
    if (keywordHits.length === 0) continue;

    // Get companies in this industry
    const companyIds = companiesByIndustry.get(mapping.industry) || [];
    ids.push(...companyIds);
  }

  return ids;
}

function getRelevanceTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(TOPIC_TAGS)) {
    if (keywords.some((kw) => lower.includes(kw))) tags.push(tag);
  }
  return tags;
}

// ─── Main Handler ────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results = { fetched: 0, inserted: 0, skipped: 0, matched: { byName: 0, byTicker: 0, byIndustry: 0 }, errors: [] as string[] };

    // Fetch feeds in parallel
    const feedPromises = FEEDS.map(async (feed) => {
      try {
        console.log(`Fetching ${feed.label}: ${feed.url}`);
        const resp = await fetch(feed.url, {
          headers: { "User-Agent": "WDIWF-Bot/1.0 (Congressional News Aggregator)" },
        });
        if (!resp.ok) {
          results.errors.push(`${feed.label}: HTTP ${resp.status}`);
          return [];
        }
        const xml = await resp.text();
        const items = parseRSSItems(xml);
        console.log(`${feed.label}: parsed ${items.length} items`);
        return items.map((item) => ({ ...item, feedKey: feed.key }));
      } catch (e) {
        results.errors.push(`${feed.label}: ${(e as Error).message}`);
        return [];
      }
    });

    const allItems = (await Promise.all(feedPromises)).flat();
    results.fetched = allItems.length;

    // Pre-fetch all matching data in parallel
    const [lobbyingRes, tickerRes, industryMapRes] = await Promise.all([
      supabase.from("companies").select("id, name, canonical_name").gt("lobbying_spend", 0).limit(500),
      supabase.from("companies").select("id, ticker").not("ticker", "is", null).limit(500),
      supabase.from("industry_topic_map").select("industry, topic_tag, topic_keywords"),
    ]);

    const lobbyingCompanies = lobbyingRes.data || [];
    const tickerCompanies = (tickerRes.data || []).filter((c: any) => c.ticker && c.ticker.length >= 2);
    const industryMap = industryMapRes.data || [];

    // Build industry → company IDs lookup (only companies with lobbying spend = most relevant)
    const companiesByIndustry = new Map<string, string[]>();
    {
      const { data: allCompanies } = await supabase
        .from("companies")
        .select("id, industry")
        .gt("lobbying_spend", 0)
        .limit(1000);

      for (const co of allCompanies || []) {
        if (!co.industry) continue;
        const list = companiesByIndustry.get(co.industry) || [];
        list.push(co.id);
        companiesByIndustry.set(co.industry, list);
      }
    }

    // Process items
    for (const item of allItems) {
      if (!item.link && !item.title) continue;

      const fullText = `${item.title} ${stripHtml(item.description)}`;
      const lower = fullText.toLowerCase();

      // Match keywords
      const matchedKeywords: string[] = [];
      for (const kw of WORKPLACE_KEYWORDS) {
        if (lower.includes(kw)) matchedKeywords.push(kw);
      }

      const relevanceTags = getRelevanceTags(fullText);

      // ── Three matching strategies ──
      const nameMatches = matchByName(lower, lobbyingCompanies as any);
      const tickerMatches = matchByTicker(fullText, tickerCompanies as any);
      const industryMatches = matchByIndustryTopic(relevanceTags, lower, industryMap as any, companiesByIndustry);

      // Deduplicate
      const allCompanyIds = [...new Set([...nameMatches, ...tickerMatches, ...industryMatches])];

      // Track stats
      if (nameMatches.length > 0) results.matched.byName++;
      if (tickerMatches.length > 0) results.matched.byTicker++;
      if (industryMatches.length > 0) results.matched.byIndustry++;

      const isWorkplaceRelevant = matchedKeywords.length > 0 || relevanceTags.includes("labor");
      const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : null;

      const row = {
        source_feed: item.feedKey,
        title: item.title.slice(0, 500),
        summary: stripHtml(item.description).slice(0, 1000) || null,
        source_url: item.link || null,
        published_at: publishedAt,
        matched_company_ids: allCompanyIds,
        matched_keywords: matchedKeywords,
        relevance_tags: relevanceTags,
        is_workplace_relevant: isWorkplaceRelevant,
        raw_content: item.description?.slice(0, 2000) || null,
      };

      const { error } = await supabase
        .from("congressional_news")
        .upsert(row, { onConflict: "source_url", ignoreDuplicates: true });

      if (error) {
        results.skipped++;
      } else {
        results.inserted++;
      }
    }

    console.log("Sync complete:", JSON.stringify(results));
    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Congressional news sync failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
