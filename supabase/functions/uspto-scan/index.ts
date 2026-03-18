import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Company Resolver ──────────────────────────────────────────────────

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,'"!?()]/g, '')
    .replace(/\b(inc|llc|ltd|corp|co|company|corporation|incorporated|limited|plc|lp|group|holdings)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateAliases(companyName: string, parentCompany?: string | null): string[] {
  const aliases = new Set<string>();
  aliases.add(companyName);
  aliases.add(normalizeCompanyName(companyName));

  // Common suffixes
  const base = normalizeCompanyName(companyName);
  if (base !== companyName.toLowerCase()) {
    aliases.add(base);
  }

  // Add with common suffixes
  for (const suffix of ['Inc', 'LLC', 'Corp', 'Corporation', 'Ltd']) {
    aliases.add(`${base} ${suffix}`.trim());
  }

  if (parentCompany) {
    aliases.add(parentCompany);
    aliases.add(normalizeCompanyName(parentCompany));
  }

  return [...aliases].filter(a => a.length > 1);
}

// ── PatentsView API Connector ─────────────────────────────────────────

interface PatentsViewPatent {
  patent_id: string;
  patent_number: string;
  patent_title: string;
  patent_date: string;
  patent_firstnamed_assignee_id: string;
  assignees?: Array<{
    assignee_organization: string;
    assignee_id: string;
  }>;
  inventors?: Array<{
    inventor_first_name: string;
    inventor_last_name: string;
  }>;
  cpcs?: Array<{
    cpc_group_id: string;
    cpc_category: string;
  }>;
  application?: Array<{
    app_number: string;
    app_date: string;
  }>;
}

async function queryPatentsView(aliases: string[]): Promise<PatentsViewPatent[]> {
  const allPatents: PatentsViewPatent[] = [];

  for (const alias of aliases.slice(0, 5)) {
    try {
      // PatentsView API v1 — query by assignee organization
      const query = {
        q: { _contains: { assignee_organization: alias } },
        f: [
          "patent_id", "patent_number", "patent_title", "patent_date",
          "assignee_organization", "assignee_id",
          "inventor_first_name", "inventor_last_name",
          "cpc_group_id", "cpc_category",
          "app_number", "app_date"
        ],
        o: { per_page: 100, page: 1 },
        s: [{ patent_date: "desc" }]
      };

      const response = await fetch("https://api.patentsview.org/patents/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        console.warn(`PatentsView query failed for "${alias}": ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (data.patents) {
        allPatents.push(...data.patents);
      }
    } catch (err) {
      console.warn(`PatentsView error for "${alias}":`, err);
    }
  }

  // Deduplicate by patent_number
  const seen = new Set<string>();
  return allPatents.filter(p => {
    const key = p.patent_number || p.patent_id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Fallback: Google Patents scrape (if PatentsView is down) ──────────

async function fallbackGooglePatents(companyName: string): Promise<{ titles: string[]; count: number }> {
  try {
    const query = encodeURIComponent(`"${companyName}"`);
    const response = await fetch(`https://patents.google.com/?q=${query}&oq=${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    const html = await response.text();
    const titleRegex = /<span class="style-scope search-result-item" id="htmlContent">(.*?)<\/span>/g;
    const countRegex = /About ([\d,]+) results/;
    const titles: string[] = [];
    let match;
    while ((match = titleRegex.exec(html)) !== null && titles.length < 20) {
      const title = match[1].replace(/<[^>]*>/g, '').trim();
      if (title && title.length > 5) titles.push(title);
    }
    const countMatch = countRegex.exec(html);
    const count = countMatch ? parseInt(countMatch[1].replace(/,/g, '')) : titles.length;
    return { titles, count };
  } catch {
    return { titles: [], count: 0 };
  }
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

function computeSignals(patents: PatentsViewPatent[]): IpSignals {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());

  const patents12m = patents.filter(p => p.patent_date && new Date(p.patent_date) >= oneYearAgo);
  const patents36m = patents.filter(p => p.patent_date && new Date(p.patent_date) >= threeYearsAgo);
  const patentsOlder = patents.filter(p => {
    if (!p.patent_date) return false;
    const d = new Date(p.patent_date);
    return d >= fiveYearsAgo && d < threeYearsAgo;
  });

  // Patent trend: compare last 12m vs average of prior 24m
  const count12m = patents12m.length;
  const countPrior24m = patents36m.length - count12m;
  const avgPrior12m = countPrior24m / 2;

  let patent_trend = 'unknown';
  if (patents.length > 0) {
    if (avgPrior12m === 0 && count12m > 0) patent_trend = 'rising';
    else if (count12m > avgPrior12m * 1.2) patent_trend = 'rising';
    else if (count12m < avgPrior12m * 0.8) patent_trend = 'declining';
    else patent_trend = 'flat';
  }

  // CPC categories
  const cpcCounts: Record<string, number> = {};
  for (const p of patents) {
    if (p.cpcs) {
      for (const cpc of p.cpcs) {
        const cat = cpc.cpc_category || cpc.cpc_group_id?.substring(0, 4) || 'Unknown';
        cpcCounts[cat] = (cpcCounts[cat] || 0) + 1;
      }
    }
  }
  const topCpc = Object.entries(cpcCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => k);

  // Innovation score: blend of count, recency, breadth
  const countScore = Math.min(count12m / 20, 1) * 40;
  const breadthScore = Math.min(topCpc.length / 5, 1) * 30;
  const recencyScore = count12m > 0 ? 30 : (patents36m.length > 0 ? 15 : 0);
  const innovation_signal_score = Math.round(countScore + breadthScore + recencyScore);

  // IP complexity: number of distinct CPC categories
  const ip_complexity_score = Math.min(Object.keys(cpcCounts).length * 10, 100);

  return {
    patent_count_12m: count12m,
    patent_count_36m: patents36m.length,
    patent_trend,
    trademark_count_12m: 0, // V1: trademarks filled separately
    trademark_trend: 'unknown',
    ownership_change_flag: false,
    innovation_signal_score,
    expansion_signal_score: 0,
    ip_complexity_score,
    top_cpc_categories: topCpc,
  };
}

// ── AI Categorization (reuse existing pattern) ────────────────────────

async function categorizePatents(companyName: string, patents: PatentsViewPatent[]): Promise<Array<{ theme: string; count: number; examples: string[] }>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || patents.length === 0) return [];

  const titles = patents.slice(0, 30).map(p => p.patent_title).filter(Boolean);
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

    console.log(`USPTO scan starting for: ${companyName} (${companyId || 'no id'})`);

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
          // Still fetch clusters + top patents from DB
          const { data: cachedPatents } = await db
            .from('patent_records')
            .select('title, patent_number, grant_date, cpc_codes')
            .eq('company_id', companyId)
            .order('grant_date', { ascending: false })
            .limit(30);

          const clusters = await categorizePatents(companyName, (cachedPatents || []).map(p => ({
            patent_id: '', patent_number: p.patent_number || '', patent_title: p.title || '',
            patent_date: p.grant_date || '', patent_firstnamed_assignee_id: '',
            cpcs: Array.isArray(p.cpc_codes) ? p.cpc_codes : [],
          })));

          return new Response(JSON.stringify({
            cached: true,
            signals: existing,
            clusters,
            topPatents: (cachedPatents || []).slice(0, 10).map(p => ({
              title: p.title,
              url: p.patent_number ? `https://patents.google.com/patent/US${p.patent_number}` : null,
            })),
            totalResults: existing.patent_count_36m || 0,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    // Create scan job
    let jobId: string | null = null;
    if (companyId) {
      const { data: job } = await db.from('ip_scan_jobs').insert({
        company_id: companyId,
        job_type: 'on_demand',
        status: 'running',
        started_at: new Date().toISOString(),
      }).select('id').single();
      jobId = job?.id || null;
    }

    // Resolve aliases
    const parentCompany = companyId
      ? (await db.from('companies').select('parent_company').eq('id', companyId).single()).data?.parent_company
      : null;
    const aliases = generateAliases(companyName, parentCompany);

    // Store aliases
    if (companyId) {
      for (const alias of aliases) {
        await db.from('company_aliases').upsert({
          company_id: companyId,
          alias_name: alias,
          alias_type: alias === companyName ? 'canonical' : 'fuzzy',
          confidence: alias === companyName ? 1.0 : 0.7,
        }, { onConflict: 'company_id,alias_name' }).select();
      }
    }

    // Query PatentsView
    let patents = await queryPatentsView(aliases);
    let usedFallback = false;

    // Fallback to Google Patents if PatentsView returns nothing
    if (patents.length === 0) {
      console.log("PatentsView returned no results, trying Google Patents fallback");
      const fallback = await fallbackGooglePatents(companyName);
      usedFallback = true;

      if (fallback.titles.length > 0) {
        // Convert fallback to pseudo-patent format for clustering
        patents = fallback.titles.map((title, i) => ({
          patent_id: `fallback-${i}`,
          patent_number: '',
          patent_title: title,
          patent_date: '',
          patent_firstnamed_assignee_id: '',
        }));
      }
    }

    // Store patent records
    if (companyId && patents.length > 0 && !usedFallback) {
      for (const p of patents.slice(0, 100)) {
        await db.from('patent_records').upsert({
          company_id: companyId,
          patent_number: p.patent_number,
          source_record_id: p.patent_id,
          title: p.patent_title,
          grant_date: p.patent_date || null,
          assignee_name: p.assignees?.[0]?.assignee_organization || null,
          assignee_normalized: normalizeCompanyName(p.assignees?.[0]?.assignee_organization || companyName),
          inventor_count: p.inventors?.length || 0,
          cpc_codes: p.cpcs || [],
          application_number: p.application?.[0]?.app_number || null,
          filing_date: p.application?.[0]?.app_date || null,
        }, { onConflict: 'company_id,patent_number' }).select();
      }
    }

    // Compute signals
    const signals = computeSignals(patents);

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

    // Complete job
    if (jobId) {
      await db.from('ip_scan_jobs').update({
        status: 'complete',
        finished_at: new Date().toISOString(),
      }).eq('id', jobId);
    }

    const topPatents = patents.slice(0, 10).map(p => ({
      title: p.patent_title,
      url: p.patent_number ? `https://patents.google.com/patent/US${p.patent_number}` : null,
    }));

    return new Response(JSON.stringify({
      cached: false,
      usedFallback,
      signals,
      clusters,
      topPatents,
      totalResults: usedFallback ? patents.length : (signals.patent_count_36m || patents.length),
      aliasesUsed: aliases.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("USPTO scan error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
