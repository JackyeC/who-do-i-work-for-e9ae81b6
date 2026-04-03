import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CACHE_HOURS = 24;

/* ═══════════════════════════════════════════════════════════
   1. COMPANY NAME NORMALIZATION
   ═══════════════════════════════════════════════════════════ */

const SUFFIXES = [
  "inc", "incorporated", "corp", "corporation", "llc", "llp", "lp",
  "ltd", "limited", "co", "company", "group", "holdings", "enterprises",
  "international", "intl", "services", "solutions", "technologies",
  "tech", "partners", "associates", "consulting", "global", "usa",
  "us", "america", "north america", "na",
];

function normalizeName(raw: string): string {
  let n = raw.toLowerCase().trim();
  // Remove common punctuation and special chars
  n = n.replace(/[.,\-_'""''()&]/g, " ");
  // Collapse whitespace
  n = n.replace(/\s+/g, " ").trim();
  // Remove trailing suffixes
  const words = n.split(" ");
  while (words.length > 1 && SUFFIXES.includes(words[words.length - 1])) {
    words.pop();
  }
  return words.join(" ");
}

/** Compute similarity 0–1 between two company names */
function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1.0;
  // Check containment
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  // Levenshtein-based for short names
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1.0;
  return Math.max(0, 1 - dist / maxLen);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function determineMatchMethod(
  queryName: string,
  resultName: string,
  queryState: string | undefined,
  resultLocation: string | undefined
): { confidence: number; method: string } {
  const sim = nameSimilarity(queryName, resultName);
  const stateMatch =
    queryState && resultLocation &&
    resultLocation.toLowerCase().includes(queryState.toLowerCase());

  if (sim >= 0.95) {
    return { confidence: stateMatch ? 1.0 : 0.95, method: stateMatch ? "name_plus_state" : "exact_name" };
  }
  if (sim >= 0.75) {
    return { confidence: stateMatch ? 0.85 : 0.7, method: stateMatch ? "normalized_name_plus_state" : "normalized_name" };
  }
  if (sim >= 0.5) {
    return { confidence: stateMatch ? 0.6 : 0.4, method: "fuzzy" };
  }
  return { confidence: 0.2, method: "weak_fuzzy" };
}

/* ═══════════════════════════════════════════════════════════
   2. SOURCE ADAPTERS
   ═══════════════════════════════════════════════════════════ */

async function callApify(actorId: string, input: Record<string, unknown>, timeoutMs = 120000): Promise<any[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`Apify ${actorId}: ${res.status} ${await res.text()}`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error(`Apify ${actorId} timeout/error:`, err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

interface SignalRow {
  source: string;
  signal_type: string;
  label: string;
  value: string | null;
  numeric_value: number | null;
  detail: string | null;
  source_url: string | null;
  badge_label: string;
  confidence_score: number;
  company_match_method: string;
  raw_company_name: string | null;
}

// ── Indeed Adapter ──
async function fetchIndeed(companyName: string, state?: string): Promise<SignalRow[]> {
  const items = await callApify("misceres~indeed-scraper", {
    position: "",
    country: "US",
    location: state || "",
    maxItems: 10,
    parseCompanyReviews: true,
    companyName,
    startUrls: [],
  });

  if (!items?.length) return [];

  const signals: SignalRow[] = [];
  const reviews = items.filter((i: any) => i.rating || i.overallRating);
  if (!reviews.length) return [];

  // Determine match confidence from the first result
  const rawName = reviews[0]?.companyName || reviews[0]?.company || companyName;
  const { confidence, method } = determineMatchMethod(companyName, rawName, state, reviews[0]?.location);

  const avg = reviews.reduce((s: number, r: any) => s + (r.rating || r.overallRating || 0), 0) / reviews.length;
  signals.push({
    source: "Indeed", signal_type: "overall_rating", label: "Overall Rating",
    value: `${avg.toFixed(1)} / 5`, numeric_value: parseFloat(avg.toFixed(1)),
    detail: `Based on ${reviews.length} employee reviews`,
    source_url: reviews[0]?.url || null,
    badge_label: "Indeed Reviews", confidence_score: confidence,
    company_match_method: method, raw_company_name: rawName,
  });

  // Sub-scores
  const subKeys = ["workLifeBalance", "compensation", "management", "culture", "jobSecurity"] as const;
  const labelMap: Record<string, string> = {
    workLifeBalance: "Work-Life Balance", compensation: "Compensation",
    management: "Management", culture: "Culture", jobSecurity: "Job Security",
  };

  for (const key of subKeys) {
    const vals = reviews.map((r: any) => r[key] || r[key.toLowerCase()]).filter((v: any) => typeof v === "number" && v > 0);
    if (vals.length > 0) {
      const subAvg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
      signals.push({
        source: "Indeed", signal_type: `sub_score_${key}`, label: labelMap[key] || key,
        value: `${subAvg.toFixed(1)} / 5`, numeric_value: parseFloat(subAvg.toFixed(1)),
        detail: null, source_url: reviews[0]?.url || null,
        badge_label: "Indeed Reviews", confidence_score: confidence,
        company_match_method: method, raw_company_name: rawName,
      });
    }
  }

  // 3 most recent snippets
  const snippets = reviews
    .filter((r: any) => r.text || r.review || r.pros || r.cons)
    .slice(0, 3);

  snippets.forEach((r: any, i: number) => {
    const text = r.text || r.review || [r.pros, r.cons].filter(Boolean).join(" · ");
    if (text) {
      signals.push({
        source: "Indeed", signal_type: `review_snippet_${i + 1}`, label: `Employee Review ${i + 1}`,
        value: null, numeric_value: r.rating || r.overallRating || null,
        detail: text.slice(0, 300), source_url: r.url || null,
        badge_label: "From Indeed employees", confidence_score: confidence,
        company_match_method: method, raw_company_name: rawName,
      });
    }
  });

  return signals;
}

// ── BBB Adapter ──
async function fetchBBB(companyName: string, state?: string): Promise<SignalRow[]> {
  const items = await callApify("curious_coder~bbb-scraper", {
    searchQuery: companyName,
    location: state || "US",
    maxItems: 3,
  });

  if (!items?.length) return [];
  const match = items[0];
  const rawName = match.name || match.businessName || companyName;
  const resultLoc = match.city || match.state || match.location || "";
  const { confidence, method } = determineMatchMethod(companyName, rawName, state, resultLoc);
  const profileUrl = match.url || match.profileUrl || null;

  const signals: SignalRow[] = [];
  const base = { source: "Better Business Bureau" as const, source_url: profileUrl, confidence_score: confidence, company_match_method: method, raw_company_name: rawName };

  const isAccredited = match.isAccredited || match.accredited || false;
  signals.push({ ...base, signal_type: "accreditation", label: "BBB Accreditation", value: isAccredited ? "Accredited" : "Not Accredited", numeric_value: isAccredited ? 1 : 0, detail: null, badge_label: "BBB" });

  const rating = match.rating || match.bbbRating;
  if (rating) {
    const ratingScore: Record<string, number> = { "A+": 5, A: 4.5, "A-": 4, "B+": 3.5, B: 3, "B-": 2.5, "C+": 2, C: 1.5, "C-": 1, "D+": 0.75, D: 0.5, "D-": 0.25, F: 0 };
    signals.push({ ...base, signal_type: "rating", label: "BBB Rating", value: rating, numeric_value: ratingScore[rating] ?? null, detail: null, badge_label: "BBB" });
  }

  const years = match.yearsInBusiness || match.years;
  if (years) {
    signals.push({ ...base, signal_type: "years_in_business", label: "Years in Business", value: `${years} years`, numeric_value: typeof years === "number" ? years : parseInt(years) || null, detail: null, badge_label: "BBB" });
  }

  const complaints = match.complaintsCount || match.complaints || match.totalComplaints || 0;
  signals.push({ ...base, signal_type: "complaints", label: "Complaints (Last 3 Years)", value: `${complaints}`, numeric_value: typeof complaints === "number" ? complaints : parseInt(complaints) || 0, detail: complaints > 10 ? "Elevated complaint volume" : null, badge_label: "BBB" });

  return signals;
}

// ── Glassdoor Adapter ──
async function fetchGlassdoor(companyName: string, _state?: string): Promise<SignalRow[]> {
  // Use a Glassdoor scraper actor
  const items = await callApify("bebity~glassdoor-scraper", {
    searchTerms: [companyName],
    maxItems: 1,
    scrapeReviews: false,
    scrapeJobs: false,
  });

  if (!items?.length) return [];
  const match = items[0];
  const rawName = match.name || match.companyName || companyName;
  const { confidence, method } = determineMatchMethod(companyName, rawName, _state, match.headquarters || "");
  const profileUrl = match.url || match.glassdoorUrl || null;
  const signals: SignalRow[] = [];
  const base = { source: "Glassdoor" as const, source_url: profileUrl, confidence_score: confidence, company_match_method: method, raw_company_name: rawName };

  const overallRating = match.overallRating || match.rating;
  if (overallRating && typeof overallRating === "number") {
    signals.push({ ...base, signal_type: "overall_rating", label: "Overall Rating", value: `${overallRating.toFixed(1)} / 5`, numeric_value: overallRating, detail: match.numberOfReviews ? `Based on ${match.numberOfReviews} reviews` : null, badge_label: "Glassdoor" });
  }

  const ceoApproval = match.ceoApproval || match.ceoRating;
  if (ceoApproval != null) {
    const pct = typeof ceoApproval === "number" && ceoApproval <= 1 ? Math.round(ceoApproval * 100) : ceoApproval;
    signals.push({ ...base, signal_type: "ceo_approval", label: "CEO Approval", value: `${pct}%`, numeric_value: typeof pct === "number" ? pct / 100 * 5 : null, detail: match.ceoName ? `CEO: ${match.ceoName}` : null, badge_label: "Glassdoor" });
  }

  return signals;
}

/* ═══════════════════════════════════════════════════════════
   3. MAIN HANDLER
   ═══════════════════════════════════════════════════════════ */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { companyId, companyName, state } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ error: "companyId and companyName required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache freshness
    const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("company_community_signals")
      .select("id, fetched_at, source")
      .eq("company_id", companyId)
      .in("source", ["Indeed", "Better Business Bureau", "Glassdoor"])
      .gte("fetched_at", cutoff)
      .limit(1);

    if (existing && existing.length > 0) {
      const { data: cached } = await supabase
        .from("company_community_signals")
        .select("*")
        .eq("company_id", companyId)
        .in("source", ["Indeed", "Better Business Bureau", "Glassdoor"]);

      return new Response(JSON.stringify({ cached: true, signals: cached || [], debug: { cacheHit: true, cutoff } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch all sources in parallel
    console.log(`Fetching community signals for "${companyName}" (${state || "no state"})`);
    const [indeedSignals, bbbSignals, glassdoorSignals] = await Promise.all([
      fetchIndeed(companyName, state).catch(e => { console.error("Indeed adapter error:", e); return []; }),
      fetchBBB(companyName, state).catch(e => { console.error("BBB adapter error:", e); return []; }),
      fetchGlassdoor(companyName, state).catch(e => { console.error("Glassdoor adapter error:", e); return []; }),
    ]);

    const allSignals = [...indeedSignals, ...bbbSignals, ...glassdoorSignals];
    const now = new Date().toISOString();

    // Debug info
    const debug = {
      cacheHit: false,
      companyName,
      normalizedName: normalizeName(companyName),
      state: state || null,
      indeedCount: indeedSignals.length,
      bbbCount: bbbSignals.length,
      glassdoorCount: glassdoorSignals.length,
      totalSignals: allSignals.length,
      confidences: allSignals.map(s => ({ source: s.source, type: s.signal_type, confidence: s.confidence_score, method: s.company_match_method, rawName: s.raw_company_name })),
      fetchedAt: now,
    };

    console.log("Fetch result debug:", JSON.stringify(debug));

    if (allSignals.length > 0) {
      // Delete stale signals for these sources
      await supabase
        .from("company_community_signals")
        .delete()
        .eq("company_id", companyId)
        .in("source", ["Indeed", "Better Business Bureau", "Glassdoor"]);

      // Insert fresh signals
      const rows = allSignals.map(sig => ({
        company_id: companyId,
        source: sig.source,
        signal_type: sig.signal_type,
        label: sig.label,
        value: sig.value,
        numeric_value: sig.numeric_value,
        detail: sig.detail,
        source_url: sig.source_url,
        badge_label: sig.badge_label,
        confidence_score: sig.confidence_score,
        company_match_method: sig.company_match_method,
        raw_company_name: sig.raw_company_name,
        fetched_at: now,
      }));

      const { error: insertError } = await supabase.from("company_community_signals").insert(rows);
      if (insertError) console.error("Insert error:", insertError);
    }

    // Compute review flag
    const mgmt = indeedSignals.find(s => s.signal_type === "sub_score_management");
    const accredited = bbbSignals.find(s => s.signal_type === "accreditation");
    const complaints = bbbSignals.find(s => s.signal_type === "complaints");
    const reviewCarefully =
      (mgmt?.numeric_value != null && mgmt.numeric_value < 2.5) ||
      (accredited?.numeric_value === 0 && (complaints?.numeric_value ?? 0) >= 10);

    return new Response(JSON.stringify({ cached: false, signals: allSignals, reviewCarefully, debug }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
