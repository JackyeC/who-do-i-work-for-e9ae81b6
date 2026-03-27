import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COURTLISTENER_SEARCH_URL = "https://www.courtlistener.com/api/rest/v4/search/";

/**
 * Scans CourtListener (free, no API key required) for EEOC cases
 * where the commission moved to dismiss or withdrew.
 * 
 * Discovery layer: CourtListener RECAP search
 * Verification: Cross-reference with existing records to avoid duplicates
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth gate: require service-role key
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") || "";
  if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Search queries designed to find EEOC dropped/withdrawn cases
    const searchQueries = [
      'q="Equal Employment Opportunity Commission" "motion to dismiss"&type=r&filed_after=2025-01-20&order_by=dateFiled desc',
      'q="Equal Employment Opportunity Commission" "voluntary dismissal"&type=r&filed_after=2025-01-20&order_by=dateFiled desc',
      'q=EEOC "stipulation of dismissal"&type=r&filed_after=2025-01-20&order_by=dateFiled desc',
      'q=EEOC "notice of withdrawal"&type=r&filed_after=2025-01-20&order_by=dateFiled desc',
    ];

    // Get existing case numbers to avoid duplicates
    const { data: existingCases } = await supabaseAdmin
      .from("eeoc_dropped_cases")
      .select("case_name, company_name, courtlistener_id");
    
    const existingIds = new Set((existingCases || []).map((c: any) => c.courtlistener_id).filter(Boolean));
    const existingNames = new Set((existingCases || []).map((c: any) => c.case_name.toLowerCase()));

    let newCases: any[] = [];
    let totalSearched = 0;

    for (const queryStr of searchQueries) {
      try {
        const url = `${COURTLISTENER_SEARCH_URL}?${queryStr}&page_size=20`;
        console.log(`[EEOC-SCANNER] Searching: ${url}`);
        
        const resp = await fetch(url, {
          headers: {
            "Accept": "application/json",
          },
        });

        if (!resp.ok) {
          console.warn(`[EEOC-SCANNER] Search returned ${resp.status}`);
          continue;
        }

        const data = await resp.json();
        const results = data.results || [];
        totalSearched += results.length;

        for (const result of results) {
          const caseName = result.caseName || result.case_name || "";
          const docketId = result.docket_id?.toString() || result.id?.toString() || "";
          
          // Skip if already tracked
          if (existingIds.has(docketId) || existingNames.has(caseName.toLowerCase())) {
            continue;
          }

          // Must be an EEOC case
          if (!caseName.toLowerCase().includes("eeoc") && 
              !caseName.toLowerCase().includes("equal employment")) {
            continue;
          }

          // Extract defendant company name from case name
          // Typical format: "EEOC v. Company Name" or "Equal Employment Opportunity Commission v. Company"
          const companyMatch = caseName.match(/(?:EEOC|Equal Employment Opportunity Commission)\s+v\.\s+(.+?)(?:\s*$|\s*,\s*et al)/i);
          const companyName = companyMatch ? companyMatch[1].trim() : null;

          if (!companyName) continue;

          // Determine action type from snippet/description
          const snippet = (result.snippet || result.description || "").toLowerCase();
          let actionType = "moved_to_dismiss";
          if (snippet.includes("withdrew") || snippet.includes("withdrawal")) {
            actionType = "withdrew";
          } else if (snippet.includes("voluntary dismissal") || snippet.includes("stipulation of dismissal")) {
            actionType = "dismissed";
          }

          // Determine discrimination category from case text
          let discriminationType = "Employment discrimination";
          let discriminationCategory = "retaliation"; // default
          
          if (snippet.includes("gender identity") || snippet.includes("transgender") || snippet.includes("lgbtq") || snippet.includes("sexual orientation")) {
            discriminationType = "Gender identity / LGBTQ+ discrimination";
            discriminationCategory = "gender_identity";
          } else if (snippet.includes("race") || snippet.includes("racial")) {
            discriminationType = "Race discrimination";
            discriminationCategory = "race";
          } else if (snippet.includes("sex discrimination") || snippet.includes("sexual harassment")) {
            discriminationType = "Sex discrimination";
            discriminationCategory = "sex";
          } else if (snippet.includes("disability") || snippet.includes("ada")) {
            discriminationType = "Disability discrimination";
            discriminationCategory = "disability";
          } else if (snippet.includes("age") || snippet.includes("adea")) {
            discriminationType = "Age discrimination";
            discriminationCategory = "age";
          } else if (snippet.includes("disparate impact")) {
            discriminationType = "Disparate impact";
            discriminationCategory = "disparate_impact";
          }

          newCases.push({
            company_name: companyName,
            case_name: caseName,
            case_number: result.docketNumber || null,
            court_name: result.court || null,
            discrimination_type: discriminationType,
            discrimination_category: discriminationCategory,
            eeoc_filing_date: result.dateFiled || null,
            eeoc_drop_date: result.dateFiled || null, // filing date of the dismissal motion
            action_type: actionType,
            status: "tracked",
            state: extractState(result.court || ""),
            summary: result.snippet ? cleanSnippet(result.snippet) : `EEOC case against ${companyName} — ${actionType.replace(/_/g, " ")}`,
            court_filing_url: docketId ? `https://www.courtlistener.com/docket/${docketId}/` : null,
            courtlistener_id: docketId || null,
            confidence: "medium",
            detection_method: "courtlistener_auto_scan",
          });
        }
      } catch (searchErr: any) {
        console.error(`[EEOC-SCANNER] Search error:`, searchErr);
      }
    }

    // Deduplicate new cases by company name
    const seen = new Set<string>();
    newCases = newCases.filter(c => {
      const key = c.case_name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Insert new cases
    let inserted = 0;
    if (newCases.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from("eeoc_dropped_cases")
        .insert(newCases);
      
      if (insertErr) {
        console.error("[EEOC-SCANNER] Insert error:", insertErr);
      } else {
        inserted = newCases.length;
        console.log(`[EEOC-SCANNER] Inserted ${inserted} new cases`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalSearched,
      newCasesFound: newCases.length,
      inserted,
      cases: newCases.map(c => ({ company: c.company_name, case: c.case_name, action: c.action_type })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[EEOC-SCANNER] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function extractState(courtName: string): string | null {
  const stateMap: Record<string, string> = {
    "alabama": "Alabama", "alaska": "Alaska", "arizona": "Arizona", "arkansas": "Arkansas",
    "california": "California", "colorado": "Colorado", "connecticut": "Connecticut",
    "delaware": "Delaware", "florida": "Florida", "georgia": "Georgia", "hawaii": "Hawaii",
    "idaho": "Idaho", "illinois": "Illinois", "indiana": "Indiana", "iowa": "Iowa",
    "kansas": "Kansas", "kentucky": "Kentucky", "louisiana": "Louisiana", "maine": "Maine",
    "maryland": "Maryland", "massachusetts": "Massachusetts", "michigan": "Michigan",
    "minnesota": "Minnesota", "mississippi": "Mississippi", "missouri": "Missouri",
    "montana": "Montana", "nebraska": "Nebraska", "nevada": "Nevada",
    "new hampshire": "New Hampshire", "new jersey": "New Jersey", "new mexico": "New Mexico",
    "new york": "New York", "north carolina": "North Carolina", "north dakota": "North Dakota",
    "ohio": "Ohio", "oklahoma": "Oklahoma", "oregon": "Oregon", "pennsylvania": "Pennsylvania",
    "rhode island": "Rhode Island", "south carolina": "South Carolina",
    "south dakota": "South Dakota", "tennessee": "Tennessee", "texas": "Texas",
    "utah": "Utah", "vermont": "Vermont", "virginia": "Virginia", "washington": "Washington",
    "west virginia": "West Virginia", "wisconsin": "Wisconsin", "wyoming": "Wyoming",
    "d.c.": "DC", "district of columbia": "DC",
  };
  
  const lower = courtName.toLowerCase();
  for (const [key, val] of Object.entries(stateMap)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function cleanSnippet(snippet: string): string {
  // Remove HTML tags from CourtListener snippets
  return snippet.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 500);
}
