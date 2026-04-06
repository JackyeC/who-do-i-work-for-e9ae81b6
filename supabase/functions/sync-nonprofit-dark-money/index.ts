import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceRole } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PROPUBLICA_API = "https://projects.propublica.org/nonprofits/api/v2";

// Key 501(c)(4) organizations involved in political spending
// These are the major dark money conduits from the NYT article and OpenSecrets tracking
const DARK_MONEY_ORGS = [
  "Future Forward USA Action",
  "Our American Future",
  "American Opportunity Action",
  "Securing American Greatness",
  "Concord Fund",
  "Arabella Advisors",
  "Sixteen Thirty Fund",
  "One Nation",
  "Senate Majority Fund",
  "American Action Network",
  "Americans for Prosperity",
  "Club for Growth",
  "League of Conservation Voters",
  "Planned Parenthood",
  "NRA",
  "AIPAC",
  "Heritage Action",
  "FreedomWorks",
  "Priorities USA",
  "Majority Forward",
];

async function searchOrg(query: string): Promise<any[]> {
  try {
    const res = await fetch(
      `${PROPUBLICA_API}/search.json?q=${encodeURIComponent(query)}&c_code%5Bid%5D=4`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.organizations || [];
  } catch {
    return [];
  }
}

async function getOrgDetails(ein: string): Promise<any | null> {
  try {
    const res = await fetch(`${PROPUBLICA_API}/organizations/${ein}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.organization || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }


  // Auth guard: require service-role key
  const authDenied = requireServiceRole(req);
  if (authDenied) return authDenied;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results = { orgs_found: 0, filings_saved: 0, errors: [] as string[] };

    for (const orgName of DARK_MONEY_ORGS) {
      try {
        const orgs = await searchOrg(orgName);

        for (const org of orgs.slice(0, 3)) {
          const ein = org.ein?.toString();
          if (!ein) continue;

          const details = await getOrgDetails(ein);
          if (!details) continue;

          results.orgs_found++;

          const filings = details.filings_with_data || [];
          const latestFiling = filings[0];

          const row = {
            ein,
            org_name: details.name || org.name,
            city: details.city,
            state: details.state,
            ntee_code: details.ntee_code,
            total_revenue: latestFiling?.totrevenue || details.income_amount || null,
            total_expenses: latestFiling?.totfuncexpns || null,
            total_assets: latestFiling?.totassetsend || null,
            total_contributions: latestFiling?.totcntrbgfts || null,
            political_spending: null, // 990 Schedule C data not directly in API
            tax_period: latestFiling?.tax_prd?.toString() || null,
            form_type: latestFiling?.formtype || null,
            filing_year: latestFiling?.tax_prd_yr || null,
            ruling_date: details.ruling_date || null,
            raw_payload: { search: org, details, latest_filing: latestFiling },
          };

          const { error } = await supabase
            .from("nonprofit_dark_money")
            .upsert(row, { onConflict: "ein,filing_year" });

          if (error) {
            results.errors.push(`${orgName} (${ein}): ${error.message}`);
          } else {
            results.filings_saved++;
          }
        }

        // Rate limit: ProPublica is free but be respectful
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        results.errors.push(`${orgName}: ${(e as Error).message}`);
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-nonprofit-dark-money error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
