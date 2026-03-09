import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// State name to abbreviation mapping
const STATE_ABBREV: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX",
  utah: "UT", vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY", "district of columbia": "DC",
};

function stateAbbrev(name: string): string {
  return STATE_ABBREV[name.toLowerCase().trim()] || name.trim();
}

function parseDate(d: string): string | null {
  if (!d || !d.trim()) return null;
  const cleaned = d.trim();
  // Try MM/DD/YYYY
  const parts = cleaned.split("/");
  if (parts.length === 3) {
    const [m, day, y] = parts;
    const year = y.length === 2 ? (parseInt(y) > 50 ? `19${y}` : `20${y}`) : y;
    return `${year}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return null;
}

function parseWorkers(val: string): number {
  if (!val) return 0;
  return parseInt(val.replace(/,/g, "").trim()) || 0;
}

function normalizeLayoffType(closure: string, tempPerm: string): string {
  const combined = `${closure} ${tempPerm}`.toLowerCase().trim();
  if (combined.includes("clos")) return "closure";
  if (combined.includes("mass")) return "mass_layoff";
  if (combined.includes("temporary") || combined.includes("temp")) return "temporary";
  if (combined.includes("reduction")) return "layoff";
  return "layoff";
}

function isBoARecord(company: string): boolean {
  const name = company.toLowerCase().replace(/[*\\]/g, "").replace(/update/gi, "").trim();
  return (
    name.includes("bank of america") ||
    name.includes("bank of america") ||
    name === "merrill lynch" ||
    name.startsWith("merrill lynch") ||
    name.includes("countrywide") ||
    name.includes("first franklin") ||
    name.includes("nationsbank") ||
    name.includes("nations bank")
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spreadsheet_url, company_id } = await req.json();
    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the CSV export of the spreadsheet
    const csvUrl = spreadsheet_url || 
      "https://docs.google.com/spreadsheets/d/17MHv8gcqANcAlbDx39VcC7v4VRqYGGK_pQFsit7P_no/export?format=csv";
    
    console.log("Fetching WARN spreadsheet CSV...");
    const csvRes = await fetch(csvUrl);
    if (!csvRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch spreadsheet" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const csvText = await csvRes.text();
    const lines = csvText.split("\n").filter(l => l.trim());
    
    // Skip header row
    const dataLines = lines.slice(1);
    console.log(`Parsed ${dataLines.length} rows from CSV`);

    let inserted = 0;
    let skipped = 0;
    let totalAffected = 0;

    for (const line of dataLines) {
      // Simple CSV parse (handles commas inside quotes)
      const cols: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; continue; }
        if (char === "," && !inQuotes) { cols.push(current.trim()); current = ""; continue; }
        current += char;
      }
      cols.push(current.trim());

      const [state, company, city, workers, warnDate, effectiveDate, closureLayoff, tempPerm] = cols;

      if (!company || !isBoARecord(company)) {
        skipped++;
        continue;
      }

      const noticeDate = parseDate(warnDate);
      const effDate = parseDate(effectiveDate);
      const employeesAffected = parseWorkers(workers);

      if (!noticeDate && !effDate) {
        skipped++;
        continue;
      }

      const actualNoticeDate = noticeDate || effDate!;
      const stateCode = stateAbbrev(state || "");
      const layoffType = normalizeLayoffType(closureLayoff || "", tempPerm || "");

      // Check for duplicate
      const { data: existing } = await supabase
        .from("company_warn_notices")
        .select("id")
        .eq("company_id", company_id)
        .eq("notice_date", actualNoticeDate)
        .eq("employees_affected", employeesAffected)
        .eq("location_state", stateCode)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("company_warn_notices").insert({
        company_id,
        notice_date: actualNoticeDate,
        effective_date: effDate,
        employees_affected: employeesAffected,
        layoff_type: layoffType,
        location_city: city || null,
        location_state: stateCode || null,
        reason: company !== "Bank of America" ? `Filed as: ${company}` : null,
        source_url: "https://docs.google.com/spreadsheets/d/17MHv8gcqANcAlbDx39VcC7v4VRqYGGK_pQFsit7P_no",
        source_state: stateCode || null,
        confidence: "direct",
      });

      if (error) {
        console.error("Insert error:", error);
      } else {
        inserted++;
        totalAffected += employeesAffected;
      }
    }

    // Log to signal scans
    if (inserted > 0) {
      await supabase.from("company_signal_scans").insert({
        company_id,
        signal_category: "warn_layoffs",
        signal_type: `${inserted} WARN Act notices imported from public dataset`,
        signal_value: `${totalAffected.toLocaleString()} employees affected across ${inserted} filings (2000-2019)`,
        confidence_level: "direct",
        source_url: "https://docs.google.com/spreadsheets/d/17MHv8gcqANcAlbDx39VcC7v4VRqYGGK_pQFsit7P_no",
      });
    }

    console.log(`Import complete: ${inserted} inserted, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ success: true, inserted, skipped, totalAffected }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Bulk import error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
