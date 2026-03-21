import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Company Name Helpers ──────────────────────────────────────────────

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,'\"!?()]/g, '')
    .replace(/\b(inc|llc|ltd|corp|co|company|corporation|incorporated|limited|plc|lp|group|holdings)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateSearchQueries(companyName: string, parentCompany?: string | null): string[] {
  const queries = new Set<string>();
  queries.add(companyName);

  const base = normalizeCompanyName(companyName);
  if (base !== companyName.toLowerCase()) {
    queries.add(base);
  }

  // Add with common suffixes
  for (const suffix of ['Inc', 'Inc.', 'LLC', 'Corp', 'Corporation']) {
    queries.add(`${base} ${suffix}`.trim());
  }

  if (parentCompany) {
    queries.add(parentCompany);
    queries.add(normalizeCompanyName(parentCompany));
  }

  return [...queries].filter(a => a.length > 1).slice(0, 5);
}

// ── Google Patents XHR API ────────────────────────────────────────────
// Uses the publicly accessible Google Patents search endpoint
// Returns structured JSON with patent data, no API key needed

interface GooglePatentResult {
  title: string;
  publication_number: string;
  filing_date?: string;
  grant_date?: string;
  publication_date?: string;
  assignees: string[];
  inventors: string[];
  snippet?: string;
}

async function queryGooglePatents(
  companyName: string,
  page: number = 0,
  perPage: number = 10
): Promise<{ patents: GooglePatentResult[]; totalResults: number }> {
  try {
    // Build the Google Patents XHR query URL
    // assignee: search targets the assignee field specifically
    const query = encodeURIComponent(`assignee:${companyName}`);
    const oq = encodeURIComponent(`assignee:${companyName}`);
    const url = `https://patents.google.com/xhr/query?url=q%3D${query}%26num%3D${perPage}%26page%3D${page}%26oq%3D${oq}&exp=&tags=`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WDIWF-IntelligenceBot/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Google Patents query failed: ${response.status}`);
      return { patents: [], totalResults: 0 };
    }

    const data = await response.json();
    const results = data?.results;
    if (!results) return { patents: [], totalResults: 0 };

    const totalResults = results.total_num_results || 0;
    const clusters = results.cluster || [];

    const patents: GooglePatentResult[] = [];
    for (const cluster of clusters) {
      const resultList = cluster?.result || [];
      for (const item of resultList) {
        const pat = item?.patent;
        if (!pat) continue;

        // Clean HTML from title
        const title = (pat.title || '')
          .replace(/<[^>]*>/g, '')
          .replace(/&[a-z]+;/g, (m: string) => {
            const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&hel': '...' };
            return entities[m] || m;
          })
          .trim();

        patents.push({
          title,
          publication_number: pat.publication_number || '',
          filing_date: pat.filing_date || undefined,
          grant_date: pat.grant_date || undefined,
          publication_date: pat.publication_date || undefined,
          assignees: Array.isArray(pat.assignee)
            ? pat.assignee.map((a: any) => typeof a === 'string' ? a : (a?.name || '')).filter(Boolean)
            : (typeof pat.assignee === 'string' ? [pat.assignee] : []),
          inventors: Array.isArray(pat.inventor)
            ? pat.inventor.map((i: any) => typeof i === 'string' ? i : (i?.name || '')).filter(Boolean)
            : (typeof pat.inventor === 'string' ? [pat.inventor] : []),
          snippet: (pat.snippet || '').replace(/<[^>]*>/g, '').trim() || undefined,
        });
      }
    }

    return { patents, totalResults };
  } catch (err) {
    console.warn(`Google Patents error for "${companyName}":`, err);
    return { patents: [], totalResults: 0 };
  }
}

// ── Multi-query search ────────────────────────────────────────────────

async function searchAllAliases(queries: string[]): Promise<{ patents: GooglePatentResult[]; totalResults: number }> {
  let bestResult = { patents: [] as GooglePatentResult[], totalResults: 0 };

  for (const query of queries) {
    const result = await queryGooglePatents(query, 0, 25);
    if (result.totalResults > bestResult.totalResults) {
      bestResult = result;
    }
    // If we found a good result, don't burn more queries
    if (bestResult.totalResults >= 10) break;

    // Brief pause to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  // Deduplicate by publication_number
  const seen = new Set<string>();
  bestResult.patents = bestResult.patents.filter(p => {
    if (seen.has(p.publication_number)) return false;
    seen.add(p.publication_number);
    return true;
  });

  return bestResult;
}

// ── Signal Computation ────────────────────────────────────────────────

interface IpSignals {
  patent_count_12m: number;
  patent_count_36m: number;
  patent_trend: string;
  trademark_count_12m: number;
  trademark_trend: string;
  ownership_change_flag: boolean;
  innovation_signal_score: number;
  expansion_signal_score: number;
  ip_complexity_score: number;
  top_cpc_categories: string[];
}

function computeSignals(patents: GooglePatentResult[], totalResults: number): IpSignals {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

  const patents12m = patents.filter(p => {
    const d = p.grant_date || p.filing_date || p.publication_date;
    return d && new Date(d) >= oneYearAgo;
  });
  const patents36m = patents.filter(p => {
    const d = p.grant_date || p.filing_date || p.publication_date;
    return d && new Date(d) >= threeYearsAgo;
  });

  const count12m = patents12m.length;
  const count36m = patents36m.length;
  const countPrior24m = count36m - count12m;
  const avgPrior12m = countPrior24m / 2;

  let patent_trend = 'unknown';
  if (totalResults > 0) {
    if (avgPrior12m === 0 && count12m > 0) patent_trend = 'rising';
    else if (count12m > avgPrior12m * 1.2) patent_trend = 'rising';
    else if (count12m < avgPrior12m * 0.8) patent_trend = 'declining';
    else patent_trend = 'flat';
  }

  // Innovation score
  const countScore = Math.min(totalResults / 100, 1) * 40;
  const recencyScore = count12m > 0 ? 30 : (count36m > 0 ? 15 : 0);
  const volumeScore = Math.min(count36m / 10, 1) * 30;
  const innovation_signal_score = Math.round(countScore + recencyScore + volumeScore);

  return {
    patent_count_12m: count12m,
    patent_count_36m: count36m,
    patent_trend,
    trademark_count_12m: 0,
    trademark_trend: 'unknown',
    ownership_change_flag: false,
    innovation_signal_score,
    expansion_signal_score: 0,
    ip_complexity_score: 0,
    top_cpc_categories: [],
  };
}

// ── AI Clustering ─────────────────────────────────────────────────────

async function categorizePatents(companyName: string, patents: GooglePatentResult[]): Promise<Array<{ theme: string; count: number; examples: string[] }>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || patents.length === 0) return [];

  const titles = patents.slice(0, 30).map(p => p.title).filter(Boolean);
  if (titles.length === 0) return [];

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an innovation analyst. Return only valid JSON arrays." },
          {
            role: "user",
            content: `Given the following patent titles from "${companyName}", categorize them into Innovation Clusters.\n\nPatent titles:\n${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nReturn a JSON array of clusters. Each cluster:\n- "theme": concise category (e.g. "Artificial Intelligence", "Cloud Infrastructure", "Biotech")\n- "count": number of patents in cluster\n- "examples": array of up to 3 example patent titles\n\nReturn ONLY the JSON array.`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) return [{ theme: "General Innovation", count: titles.length, examples: titles.slice(0, 3) }];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [{ theme: "General Innovation", count: titles.length, examples: titles.slice(0, 3) }];
  }
}

// ── Main Handler ──────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceKey);

  try {
    const { companyId, companyName } = await req.json();
    if (!companyName) {
      return new Response(JSON.stringify({ error: "Missing companyName" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Patent scan starting for: ${companyName} (${companyId || 'no id'})`);

    // Check cache — skip if scanned in last 7 days
    if (companyId) {
      const { data: existing } = await db
        .from('company_ip_signals')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (existing?.last_scanned_at) {
        const scannedAt = new Date(existing.last_scanned_at);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (scannedAt > sevenDaysAgo) {
          console.log("Returning cached IP signals");
          const { data: cachedPatents } = await db
            .from('patent_records')
            .select('title, patent_number, grant_date, cpc_codes')
            .eq('company_id', companyId)
            .order('grant_date', { ascending: false })
            .limit(30);

          const clusters = await categorizePatents(companyName, (cachedPatents || []).map(p => ({
            title: p.title || '',
            publication_number: p.patent_number || '',
            grant_date: p.grant_date || undefined,
            assignees: [],
            inventors: [],
          })));

          // Use the larger of cached count or stored count
          const cachedCount = cachedPatents?.length || 0;
          const storedCount = existing.patent_count_36m || 0;
          const totalResults = Math.max(cachedCount, storedCount, existing.innovation_signal_score > 0 ? 1 : 0);

          return new Response(JSON.stringify({
            cached: true,
            signals: existing,
            clusters,
            topPatents: (cachedPatents || []).slice(0, 10).map(p => ({
              title: p.title,
              url: p.patent_number ? `https://patents.google.com/patent/${p.patent_number}` : null,
              patent_number: p.patent_number,
            })),
            totalResults,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    // Resolve search queries (company name + aliases)
    const parentCompany = companyId
      ? (await db.from('companies').select('parent_company').eq('id', companyId).single()).data?.parent_company
      : null;
    const searchQueries = generateSearchQueries(companyName, parentCompany);

    // Query Google Patents (primary source — free, no API key, real-time)
    const { patents, totalResults } = await searchAllAliases(searchQueries);

    console.log(`Google Patents: ${totalResults} total results, ${patents.length} detailed`);

    // Store patent records in DB
    if (companyId && patents.length > 0) {
      for (const p of patents.slice(0, 100)) {
        await db.from('patent_records').upsert({
          company_id: companyId,
          patent_number: p.publication_number,
          source_record_id: p.publication_number,
          title: p.title,
          grant_date: p.grant_date || p.filing_date || null,
          assignee_name: p.assignees[0] || null,
          assignee_normalized: normalizeCompanyName(p.assignees[0] || companyName),
          inventor_count: p.inventors.length,
          cpc_codes: [],
          application_number: null,
          filing_date: p.filing_date || null,
        }, { onConflict: 'company_id,patent_number' }).select();
      }
    }

    // Compute signals
    const signals = computeSignals(patents, totalResults);

    // Store signals
    if (companyId) {
      await db.from('company_ip_signals').upsert({
        company_id: companyId,
        ...signals,
        top_cpc_categories: signals.top_cpc_categories,
        last_scanned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id' }).select();
    }

    // AI clustering
    const clusters = await categorizePatents(companyName, patents);

    // Ticker update for notable patent portfolios
    if (companyId && totalResults >= 50) {
      await db.from('ticker_items' as any).upsert({
        company_name: companyName,
        message: `${totalResults.toLocaleString()} patents on record — active IP portfolio`,
        source_tag: "Google Patents",
        item_type: "innovation",
        is_hidden: false,
      } as any, { onConflict: 'company_name,item_type' as any }).then(() => {});
    }

    const topPatents = patents.slice(0, 10).map(p => ({
      title: p.title,
      url: p.publication_number ? `https://patents.google.com/patent/${p.publication_number}` : null,
      patent_number: p.publication_number,
    }));

    return new Response(JSON.stringify({
      cached: false,
      signals,
      clusters,
      topPatents,
      totalResults,
      aliasesUsed: searchQueries.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Patent scan error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
