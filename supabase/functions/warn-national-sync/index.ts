import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Big Local News WARN Transformer — aggregated national WARN data from all 50 states
const NATIONAL_WARN_URL =
  "https://raw.githubusercontent.com/biglocalnews/warn-transformer/main/data/warn.json";

// Official state WARN sources for direct scraping
const STATE_SOURCES: Record<string, { name: string; url: string; type: string }> = {
  CA: { name: "California EDD WARN", url: "https://edd.ca.gov/en/jobs_and_training/layoff_services_warn", type: "official_state_warn" },
  TX: { name: "Texas Workforce Commission WARN", url: "https://www.twc.texas.gov/businesses/worker-adjustment-and-retraining-notification-warn-notices", type: "official_state_warn" },
  NY: { name: "New York WARN Dashboard", url: "https://dol.ny.gov/warn-notices", type: "official_state_warn" },
};

interface WarnEntry {
  company_name?: string;
  notice_date?: string;
  effective_date?: string;
  number_of_workers?: string | number;
  layoff_or_closure?: string;
  state?: string;
  city?: string;
  county?: string;
  [key: string]: unknown;
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[,.\-\/\\()'"!@#$%^&*]+/g, " ")
    .replace(/\b(inc|llc|corp|co|ltd|lp|plc|group|holdings|international|intl|na|usa|us)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function companiesMatch(warnName: string, targetName: string, subsidiaries: string[]): boolean {
  const normWarn = normalizeCompanyName(warnName);
  const normTarget = normalizeCompanyName(targetName);

  if (normWarn.includes(normTarget) || normTarget.includes(normWarn)) return true;

  for (const sub of subsidiaries) {
    const normSub = normalizeCompanyName(sub);
    if (normSub.length > 2 && (normWarn.includes(normSub) || normSub.includes(normWarn))) return true;
  }

  return false;
}

function parseDate(d: string | undefined): string | null {
  if (!d) return null;
  const cleaned = d.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) return cleaned.slice(0, 10);
  const parts = cleaned.split("/");
  if (parts.length === 3) {
    const [m, day, y] = parts;
    const year = y.length === 2 ? (parseInt(y) > 50 ? `19${y}` : `20${y}`) : y;
    return `${year}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return null;
}

function parseWorkers(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  return parseInt(val.replace(/[,\s]/g, "")) || 0;
}

function normalizeLayoffType(raw: string | undefined): string {
  if (!raw) return "layoff";
  const lower = raw.toLowerCase();
  if (lower.includes("clos")) return "closure";
  if (lower.includes("mass")) return "mass_layoff";
  if (lower.includes("temp")) return "temporary";
  if (lower.includes("reloc")) return "relocation";
  return "layoff";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { company_id, company_name, days_back = 365, mode = "company" } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch known subsidiaries for broader matching
    const subsidiaryNames: string[] = [];
    if (company_id) {
      const { data: subs } = await supabase
        .from("company_corporate_structure")
        .select("entity_name")
        .eq("company_id", company_id);
      if (subs) {
        for (const s of subs) {
          if (s.entity_name) subsidiaryNames.push(s.entity_name);
        }
      }
    }

    console.log(`[warn-national-sync] Fetching national WARN dataset...`);
    const response = await fetch(NATIONAL_WARN_URL);
    if (!response.ok) {
      const errText = await response.text();
      console.error("[warn-national-sync] Fetch failed:", response.status, errText);

      // Log sync failure
      await supabase.from("warn_sync_log").insert({
        source_name: "Big Local News WARN Transformer",
        source_url: NATIONAL_WARN_URL,
        source_type: "big_local_news",
        status: "error",
        error_message: `HTTP ${response.status}: ${errText.slice(0, 200)}`,
      });

      return new Response(
        JSON.stringify({ error: "Failed to fetch national WARN dataset" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allData: WarnEntry[] = await response.json();
    console.log(`[warn-national-sync] Dataset size: ${allData.length} entries`);

    // Filter by date range — prioritize current year
    const currentYear = new Date().getFullYear();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days_back);

    const recentData = allData.filter((entry) => {
      const nd = parseDate(entry.notice_date);
      return nd && new Date(nd) >= cutoff;
    });

    // Sort by notice_date descending — current year first
    recentData.sort((a, b) => {
      const da = parseDate(a.notice_date) || "";
      const db = parseDate(b.notice_date) || "";
      return db.localeCompare(da);
    });

    console.log(`[warn-national-sync] ${recentData.length} entries within last ${days_back} days`);

    // If no company filter, return national summary
    if (mode === "national" || !company_name) {
      const stateBreakdown: Record<string, { notices: number; affected: number }> = {};
      for (const entry of recentData) {
        const state = entry.state || "Unknown";
        if (!stateBreakdown[state]) stateBreakdown[state] = { notices: 0, affected: 0 };
        stateBreakdown[state].notices += 1;
        stateBreakdown[state].affected += parseWorkers(entry.number_of_workers);
      }

      // Current year stats
      const currentYearData = recentData.filter(e => {
        const nd = parseDate(e.notice_date);
        return nd && nd.startsWith(String(currentYear));
      });

      await supabase.from("warn_sync_log").insert({
        source_name: "Big Local News WARN Transformer",
        source_url: NATIONAL_WARN_URL,
        source_type: "big_local_news",
        records_fetched: allData.length,
        status: "success",
      });

      return new Response(
        JSON.stringify({
          success: true,
          totalNotices: recentData.length,
          currentYearNotices: currentYearData.length,
          totalAffected: recentData.reduce((s, e) => s + parseWorkers(e.number_of_workers), 0),
          currentYearAffected: currentYearData.reduce((s, e) => s + parseWorkers(e.number_of_workers), 0),
          stateBreakdown,
          topCompanies: getTopCompanies(recentData, 20),
          source: "Big Local News WARN Transformer",
          lastSynced: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Company-specific matching
    const matched = recentData.filter((entry) =>
      entry.company_name && companiesMatch(entry.company_name, company_name, subsidiaryNames)
    );
    console.log(`[warn-national-sync] ${matched.length} matches for "${company_name}"`);

    // Insert matched notices into DB
    let inserted = 0;
    let skipped = 0;
    const stateBreakdown: Record<string, { affected: number; notices: number; cities: string[] }> = {};

    for (const entry of matched) {
      const noticeDate = parseDate(entry.notice_date);
      if (!noticeDate) { skipped++; continue; }

      const employeesAffected = parseWorkers(entry.number_of_workers);
      const state = entry.state || null;
      const city = entry.city || null;

      // Deduplicate
      const { data: existing } = await supabase
        .from("company_warn_notices")
        .select("id")
        .eq("company_id", company_id)
        .eq("notice_date", noticeDate)
        .eq("employees_affected", employeesAffected)
        .limit(1);

      if (existing && existing.length > 0) { skipped++; continue; }

      // Determine reason type
      const rawReason = entry.company_name !== company_name ? `Filed as: ${entry.company_name}` : null;

      const { error } = await supabase.from("company_warn_notices").insert({
        company_id,
        notice_date: noticeDate,
        effective_date: parseDate(entry.effective_date),
        employees_affected: employeesAffected,
        layoff_type: normalizeLayoffType(entry.layoff_or_closure),
        location_city: city,
        location_state: state,
        reason: rawReason,
        reason_type: "not_stated",
        source_url: "https://github.com/biglocalnews/warn-transformer",
        source_state: state,
        source_type: "big_local_news",
        confidence: "direct",
        employer_name_raw: entry.company_name || null,
        last_synced_at: new Date().toISOString(),
      });

      if (error) {
        console.error("[warn-national-sync] Insert error:", error.message);
      } else {
        inserted++;
        if (state) {
          if (!stateBreakdown[state]) stateBreakdown[state] = { affected: 0, notices: 0, cities: [] };
          stateBreakdown[state].affected += employeesAffected;
          stateBreakdown[state].notices += 1;
          if (city && !stateBreakdown[state].cities.includes(city)) {
            stateBreakdown[state].cities.push(city);
          }
        }
      }
    }

    // Log signal scan
    if (inserted > 0) {
      const totalAffected = matched.reduce((s, e) => s + parseWorkers(e.number_of_workers), 0);
      const stateCount = Object.keys(stateBreakdown).length;

      await supabase.from("company_signal_scans").insert({
        company_id,
        signal_category: "warn_layoffs",
        signal_type: `${inserted} national WARN notice(s) synced from Big Local News dataset`,
        signal_value: `${totalAffected.toLocaleString()} employees affected across ${stateCount} state(s)`,
        confidence_level: "direct",
        source_url: "https://github.com/biglocalnews/warn-transformer",
      });
    }

    // Log sync
    await supabase.from("warn_sync_log").insert({
      source_name: "Big Local News WARN Transformer",
      source_url: NATIONAL_WARN_URL,
      source_type: "big_local_news",
      records_fetched: matched.length,
      records_inserted: inserted,
      status: "success",
    });

    console.log(`[warn-national-sync] Done: ${inserted} inserted, ${skipped} skipped for ${company_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        skipped,
        matched: matched.length,
        stateBreakdown,
        source: "Big Local News WARN Transformer",
        lastSynced: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[warn-national-sync] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getTopCompanies(entries: WarnEntry[], limit: number) {
  const counts: Record<string, { notices: number; affected: number }> = {};
  for (const e of entries) {
    const name = e.company_name || "Unknown";
    if (!counts[name]) counts[name] = { notices: 0, affected: 0 };
    counts[name].notices += 1;
    counts[name].affected += parseWorkers(e.number_of_workers);
  }
  return Object.entries(counts)
    .sort((a, b) => b[1].affected - a[1].affected)
    .slice(0, limit)
    .map(([name, data]) => ({ name, ...data }));
}
