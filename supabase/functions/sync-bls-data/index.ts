import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BLS API endpoints
const BLS_API_V1 = "https://api.bls.gov/publicAPI/v1/timeseries/data/";
const BLS_API_V2 = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

const OES_OCCUPATIONS: Record<string, { code: string; title: string }> = {
  "software_dev": { code: "151252", title: "Software Developers" },
  "data_scientist": { code: "152051", title: "Data Scientists" },
  "product_manager": { code: "113021", title: "Computer and Information Systems Managers" },
  "financial_analyst": { code: "132051", title: "Financial and Insurance Analysts" },
  "marketing_manager": { code: "112021", title: "Marketing Managers" },
  "hr_manager": { code: "113121", title: "Human Resources Managers" },
  "accountant": { code: "132011", title: "Accountants and Auditors" },
  "nurse": { code: "291141", title: "Registered Nurses" },
  "mechanical_eng": { code: "172141", title: "Mechanical Engineers" },
  "electrical_eng": { code: "172071", title: "Electrical Engineers" },
  "civil_eng": { code: "172051", title: "Civil Engineers" },
  "lawyer": { code: "231011", title: "Lawyers" },
  "teacher_post": { code: "251011", title: "Business Teachers, Postsecondary" },
  "graphic_designer": { code: "271024", title: "Graphic Designers" },
  "ux_designer": { code: "151255", title: "Web and Digital Interface Designers" },
  "project_manager": { code: "131082", title: "Project Management Specialists" },
  "sales_manager": { code: "112022", title: "Sales Managers" },
  "operations_manager": { code: "111021", title: "General and Operations Managers" },
  "exec_admin": { code: "436011", title: "Executive Secretaries and Executive Administrative Assistants" },
  "customer_service": { code: "434051", title: "Customer Service Representatives" },
};

const ECI_SERIES = [
  "CIU1010000000000A",
  "CIU2010000000000A",
  "CIU3010000000000A",
  "CIU2020000000000A",
  "CIU2030000000000A",
];

const CPS_SERIES = [
  { id: "LEU0252881500", group: "sex", value: "Men", label: "Men, 16+" },
  { id: "LEU0252881600", group: "sex", value: "Women", label: "Women, 16+" },
  { id: "LEU0254530800", group: "race", value: "White", label: "White" },
  { id: "LEU0254530900", group: "race", value: "Black", label: "Black or African American" },
  { id: "LEU0254531000", group: "race", value: "Asian", label: "Asian" },
  { id: "LEU0254531100", group: "race", value: "Hispanic", label: "Hispanic or Latino" },
];

const NCS_SERIES = [
  { id: "NBU10000000000000028007", category: "healthcare", type: "Medical care", worker: "all" },
  { id: "NBU10000000000000028014", category: "healthcare", type: "Dental care", worker: "all" },
  { id: "NBU10000000000000028029", category: "retirement", type: "Retirement benefits", worker: "all" },
  { id: "NBU10000000000000028030", category: "retirement", type: "Defined benefit", worker: "all" },
  { id: "NBU10000000000000028031", category: "retirement", type: "Defined contribution", worker: "all" },
  { id: "NBU20500000000000028007", category: "healthcare", type: "Medical care", worker: "private" },
  { id: "NBU31000000000000028007", category: "healthcare", type: "Medical care", worker: "state_local" },
];

async function callBLS(seriesIds: string[], startYear: number, endYear: number, apiKey?: string): Promise<any> {
  const useV2 = !!apiKey;
  const url = useV2 ? BLS_API_V2 : BLS_API_V1;
  const maxSeries = useV2 ? 50 : 25;
  const batch = seriesIds.slice(0, maxSeries);

  const payload: any = {
    seriesid: batch,
    startyear: String(startYear),
    endyear: String(endYear),
  };
  if (apiKey) {
    payload.registrationKey = apiKey;
    payload.calculations = true;
    payload.annualaverage = true;
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) throw new Error(`BLS API error: ${resp.status}`);
  const json = await resp.json();

  if (json.status !== "REQUEST_SUCCEEDED") {
    console.error("BLS API message:", json.message);
    throw new Error(`BLS API: ${json.message?.join("; ") || "Request failed"}`);
  }

  return json.Results?.series || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── Auth gate: only service-role or admin users allowed ──
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const sb = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader! } },
      });
      const { data, error } = await sb.auth.getUser(token);
      if (error || !data?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Check admin/owner role
      const { data: roles } = await createClient(supabaseUrl, serviceKey)
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .in("role", ["admin", "owner"]);
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const blsApiKey = Deno.env.get("BLS_API_KEY");
    const sb = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const modules = body.modules || ["oes", "eci", "cps", "ncs"];
    const currentYear = new Date().getFullYear();
    const results: Record<string, any> = {};

    // ─── OES: Occupational Employment & Wages ───
    if (modules.includes("oes")) {
      const oesSeriesIds: string[] = [];
      const oesMap: Record<string, { occ: string; title: string; datatype: string }> = {};

      for (const [, occ] of Object.entries(OES_OCCUPATIONS)) {
        for (const dt of ["01", "04", "05", "07", "08", "10", "11", "12", "13"]) {
          const sid = `OEUM000000000000${occ.code}${dt}`;
          oesSeriesIds.push(sid);
          oesMap[sid] = { occ: occ.code, title: occ.title, datatype: dt };
        }
      }

      const batchSize = blsApiKey ? 50 : 25;
      const wageRows: any[] = [];

      for (let i = 0; i < oesSeriesIds.length; i += batchSize) {
        const batch = oesSeriesIds.slice(i, i + batchSize);
        try {
          const series = await callBLS(batch, currentYear - 2, currentYear, blsApiKey);

          for (const s of series) {
            const meta = oesMap[s.seriesID];
            if (!meta || !s.data?.length) continue;

            for (const dp of s.data) {
              if (dp.period !== "A01") continue;
              const year = parseInt(dp.year);
              const val = parseFloat(dp.value);
              if (isNaN(val)) continue;

              let existing = wageRows.find(r => r.occupation_code === meta.occ && r.data_year === year);
              if (!existing) {
                existing = {
                  occupation_code: meta.occ,
                  occupation_title: meta.title,
                  area_code: "0000000",
                  area_title: "National",
                  industry_code: "000000",
                  data_year: year,
                  source_program: "OES",
                };
                wageRows.push(existing);
              }

              const dtMap: Record<string, string> = {
                "01": "total_employment", "04": "hourly_mean", "05": "annual_mean",
                "07": "hourly_median", "08": "annual_median",
                "10": "annual_10th", "11": "annual_25th", "12": "annual_75th", "13": "annual_90th",
              };
              const col = dtMap[meta.datatype];
              if (col === "total_employment") {
                existing[col] = Math.round(val * 1000);
              } else {
                existing[col] = val;
              }
            }
          }

          if (i + batchSize < oesSeriesIds.length) await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.error(`OES batch error:`, e);
        }
      }

      if (wageRows.length > 0) {
        const { error } = await sb.from("bls_wage_benchmarks").upsert(wageRows, {
          onConflict: "occupation_code,area_code,industry_code,data_year",
        });
        if (error) console.error("OES upsert error:", error);
        results.oes = { synced: wageRows.length };
      }
    }

    // ─── ECI: Employment Cost Index ───
    if (modules.includes("eci")) {
      try {
        const series = await callBLS(ECI_SERIES, currentYear - 3, currentYear, blsApiKey);
        const eciRows: any[] = [];

        for (const s of series) {
          for (const dp of s.data || []) {
            const val = parseFloat(dp.value);
            if (isNaN(val)) continue;

            const pctChange = dp.calculations?.pct_changes?.["12"]
              ? parseFloat(dp.calculations.pct_changes["12"])
              : null;

            eciRows.push({
              series_id: s.seriesID,
              series_title: s.seriesID.includes("CIU1") ? "Total Compensation" :
                           s.seriesID.includes("CIU2") ? "Wages and Salaries" : "Benefits",
              period: dp.period,
              year: parseInt(dp.year),
              value: val,
              percent_change_12mo: pctChange,
              compensation_type: s.seriesID.includes("CIU1") ? "total" :
                                s.seriesID.includes("CIU2") ? "wages" : "benefits",
              industry_group: s.seriesID.includes("020") ? "Private Industry" :
                             s.seriesID.includes("030") ? "State and Local Government" : "All Workers",
              source_program: "ECI",
            });
          }
        }

        if (eciRows.length > 0) {
          const { error } = await sb.from("bls_eci_trends").upsert(eciRows, {
            onConflict: "series_id,year,period",
          });
          if (error) console.error("ECI upsert error:", error);
          results.eci = { synced: eciRows.length };
        }
      } catch (e) {
        console.error("ECI error:", e);
      }
    }

    // ─── CPS: Demographic Earnings ───
    if (modules.includes("cps")) {
      try {
        const cpsIds = CPS_SERIES.map(s => s.id);
        const series = await callBLS(cpsIds, currentYear - 3, currentYear, blsApiKey);
        const cpsRows: any[] = [];

        for (const s of series) {
          const meta = CPS_SERIES.find(c => c.id === s.seriesID);
          if (!meta) continue;

          for (const dp of s.data || []) {
            const val = parseFloat(dp.value);
            if (isNaN(val)) continue;

            cpsRows.push({
              demographic_group: meta.group,
              demographic_value: meta.value,
              median_weekly_earnings: val,
              median_annual_earnings: val * 52,
              data_year: parseInt(dp.year),
              data_quarter: dp.period.startsWith("Q") ? parseInt(dp.period.slice(1)) : null,
              source_program: "CPS",
            });
          }
        }

        if (cpsRows.length > 0) {
          const { error } = await sb.from("bls_demographic_earnings").insert(cpsRows);
          if (error) console.error("CPS insert error:", error);
          results.cps = { synced: cpsRows.length };
        }
      } catch (e) {
        console.error("CPS error:", e);
      }
    }

    // ─── NCS: Benefits ───
    if (modules.includes("ncs")) {
      try {
        const ncsIds = NCS_SERIES.map(s => s.id);
        const series = await callBLS(ncsIds, currentYear - 3, currentYear, blsApiKey);
        const ncsRows: any[] = [];

        for (const s of series) {
          const meta = NCS_SERIES.find(n => n.id === s.seriesID);
          if (!meta) continue;

          for (const dp of s.data || []) {
            const val = parseFloat(dp.value);
            if (isNaN(val)) continue;

            ncsRows.push({
              benefit_type: meta.type,
              benefit_category: meta.category,
              participation_rate: val,
              worker_type: meta.worker,
              data_year: parseInt(dp.year),
              source_program: "NCS",
            });
          }
        }

        if (ncsRows.length > 0) {
          const { error } = await sb.from("bls_benefits_benchmarks").insert(ncsRows);
          if (error) console.error("NCS insert error:", error);
          results.ncs = { synced: ncsRows.length };
        }
      } catch (e) {
        console.error("NCS error:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, results, apiVersion: blsApiKey ? 2 : 1 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sync-bls-data error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
