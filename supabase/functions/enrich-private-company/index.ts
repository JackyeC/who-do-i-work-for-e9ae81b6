/**
 * Enrich Private Company
 * 
 * Specialized enrichment for privately held companies that lack SEC/FEC/lobbying data.
 * Sources: OSHA, NLRB, EEOC, FTC, CFPB, CourtListener, Perplexity AI (news/watchdog).
 * Writes structured signals to civil_rights_signals, company_court_cases, etc.
 * 
 * Input: { companyId: string, companyName: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeCompanyName(name: string): string {
  return name
    .replace(/[,.]?\s*(Inc|LLC|Corp|Corporation|Ltd|Holdings|Group|Company|Co|L\.P\.|LP|Brands?)\.?$/i, '')
    .replace(/'/g, "'")
    .trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    const sb = createClient(supabaseUrl, serviceKey);

    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ error: "companyId and companyName required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchName = normalizeCompanyName(companyName);
    console.log(`[enrich-private-company] START: ${companyName} → "${searchName}"`);
    const results: Record<string, number> = {};

    // ─── 1. OSHA Violations (DOL Enforcement API) ───
    try {
      const oshaUrl = `https://enforcedata.dol.gov/api/search?query=${encodeURIComponent(searchName)}&size=25&agency=osha`;
      const oshaResp = await fetch(oshaUrl, { headers: { "Accept": "application/json" } });
      if (oshaResp.ok) {
        const ct = oshaResp.headers.get("content-type") || "";
        if (ct.includes("json")) {
          const oshaData = await oshaResp.json();
          const violations = oshaData?.results || [];
          results.osha = violations.length;
          for (const v of violations.slice(0, 15)) {
            await sb.from("civil_rights_signals").insert({
              company_id: companyId,
              signal_type: "osha_violation",
              signal_category: "workplace_safety",
              source_name: "OSHA",
              source_url: "https://www.osha.gov",
              description: v.summary || v.case_name || `OSHA violation – penalty: ${v.penalty_amount ? '$' + Number(v.penalty_amount).toLocaleString() : 'see record'}`,
              evidence_text: JSON.stringify({ activity_nr: v.activity_nr, penalty: v.penalty_amount, inspection_type: v.inspection_type }),
              confidence: "high",
              filing_date: v.open_date || null,
              settlement_amount: v.penalty_amount ? Number(v.penalty_amount) : null,
            }).catch(() => {});
          }
        } else { results.osha = 0; }
      } else { results.osha = 0; }
    } catch (e: any) { console.warn("[OSHA]", e); results.osha = 0; }

    // ─── 2. WHD Wage & Hour Violations ───
    try {
      const whdUrl = `https://enforcedata.dol.gov/api/search?query=${encodeURIComponent(searchName)}&size=25&agency=whd`;
      const whdResp = await fetch(whdUrl, { headers: { "Accept": "application/json" } });
      if (whdResp.ok) {
        const ct = whdResp.headers.get("content-type") || "";
        if (ct.includes("json")) {
          const whdData = await whdResp.json();
          const cases = whdData?.results || [];
          results.whd = cases.length;
          for (const c of cases.slice(0, 10)) {
            await sb.from("civil_rights_signals").insert({
              company_id: companyId,
              signal_type: "wage_violation",
              signal_category: "wage_theft",
              source_name: "DOL WHD",
              source_url: "https://www.dol.gov/agencies/whd",
              description: c.summary || `Wage & Hour violation – back wages: ${c.bw_amt ? '$' + Number(c.bw_amt).toLocaleString() : 'see record'}`,
              evidence_text: JSON.stringify({ case_id: c.case_id, back_wages: c.bw_amt }),
              confidence: "high",
              filing_date: c.findings_start_date || null,
              settlement_amount: c.bw_amt ? Number(c.bw_amt) : null,
            }).catch(() => {});
          }
        } else { results.whd = 0; }
      } else { results.whd = 0; }
    } catch (e: any) { console.warn("[WHD]", e); results.whd = 0; }

    // ─── 3. NLRB Cases ───
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000);
      const nlrbUrl = `https://data.nlrb.gov/api/3/action/datastore_search?q=${encodeURIComponent(searchName)}&limit=25`;
      const nlrbResp = await fetch(nlrbUrl, { signal: controller.signal });
      if (nlrbResp.ok) {
        const nlrbData = await nlrbResp.json();
        const records = nlrbData?.result?.records || [];
        results.nlrb = records.length;
        for (const r of records.slice(0, 15)) {
          await sb.from("company_court_cases").insert({
            company_id: companyId,
            case_name: r.case_name || `NLRB Case ${r.case_number || ''}`,
            case_number: r.case_number || null,
            case_type: "NLRB",
            court_name: "National Labor Relations Board",
            date_filed: r.date_filed || null,
            status: r.status || "filed",
            summary: r.allegation || r.reason_closed || null,
            source: "NLRB",
            confidence: "high",
          }).catch(() => {});
        }
      } else { results.nlrb = 0; }
    } catch (e: any) { console.warn("[NLRB]", e); results.nlrb = 0; }

    // ─── 4. CourtListener — Employment Litigation ───
    try {
      const encoded = encodeURIComponent(`"${searchName}" AND (discrimination OR retaliation OR "wage theft" OR "wrongful termination" OR "unfair labor")`);
      const clUrl = `https://www.courtlistener.com/api/rest/v4/search/?q=${encoded}&type=r&order_by=dateFiled+desc&page_size=15`;
      const clResp = await fetch(clUrl, { headers: { "Accept": "application/json" } });
      if (clResp.ok) {
        const clData = await clResp.json();
        const cases = clData?.results || [];
        results.courtlistener = cases.length;
        for (const c of cases.slice(0, 15)) {
          const caseName = c.caseName || c.case_name || "Unknown Case";
          await sb.from("company_court_cases").insert({
            company_id: companyId,
            case_name: caseName,
            case_type: "Employment Litigation",
            court_name: c.court || null,
            date_filed: c.dateFiled || c.date_filed || null,
            nature_of_suit: c.suitNature || null,
            status: c.status || "filed",
            summary: c.snippet || null,
            source: "CourtListener",
            courtlistener_url: c.absolute_url ? `https://www.courtlistener.com${c.absolute_url}` : null,
            confidence: "high",
          }).catch(() => {});
        }
      } else { results.courtlistener = 0; }
    } catch (e: any) { console.warn("[CourtListener]", e); results.courtlistener = 0; }

    // ─── 5. FTC Enforcement Actions ───
    try {
      const ftcUrl = `https://www.ftc.gov/api/v1/search?query=${encodeURIComponent(searchName)}&type=case&format=json`;
      const ftcResp = await fetch(ftcUrl);
      if (ftcResp.ok) {
        const ct = ftcResp.headers.get("content-type") || "";
        if (ct.includes("json")) {
          const ftcData = await ftcResp.json();
          const items = ftcData?.results || ftcData?.items || [];
          results.ftc = Array.isArray(items) ? items.length : 0;
          for (const item of (Array.isArray(items) ? items.slice(0, 10) : [])) {
            await sb.from("company_court_cases").insert({
              company_id: companyId,
              case_name: item.title || `FTC Action: ${searchName}`,
              case_type: "FTC Enforcement",
              court_name: "Federal Trade Commission",
              date_filed: item.date || null,
              status: item.status || "enforcement action",
              summary: item.description || item.body || null,
              source: "FTC",
              confidence: "high",
            }).catch(() => {});
          }
        } else { results.ftc = 0; }
      } else { results.ftc = 0; }
    } catch (e: any) { console.warn("[FTC]", e); results.ftc = 0; }

    // ─── 6. CFPB Consumer Complaints ───
    try {
      const cfpbUrl = `https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?search_term=${encodeURIComponent(searchName)}&size=10&sort=created_date_desc`;
      const cfpbResp = await fetch(cfpbUrl);
      if (cfpbResp.ok) {
        const cfpbData = await cfpbResp.json();
        const hits = cfpbData?.hits?.hits || [];
        results.cfpb = hits.length;
        if (hits.length > 0) {
          await sb.from("civil_rights_signals").insert({
            company_id: companyId,
            signal_type: "consumer_complaints",
            signal_category: "consumer_protection",
            source_name: "CFPB",
            source_url: "https://www.consumerfinance.gov/data-research/consumer-complaints/",
            description: `${hits.length} consumer complaint(s) found in CFPB database for ${companyName}.`,
            evidence_text: JSON.stringify({ total_complaints: cfpbData?.hits?.total?.value || hits.length }),
            confidence: "high",
          }).catch(() => {});
        }
      } else { results.cfpb = 0; }
    } catch (e: any) { console.warn("[CFPB]", e); results.cfpb = 0; }

    // ─── 7. Perplexity AI — News & Watchdog Deep Enrichment ───
    let aiEnrichment = null;
    if (perplexityKey) {
      try {
        const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${perplexityKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content: `You are an investigative workplace intelligence analyst specializing in PRIVATE companies. Focus on who owns and runs the company, its history, labor disputes, regulatory enforcement, workplace safety, employee experience, and corporate controversies. Return factual, verifiable information only.`,
              },
              {
                role: "user",
                content: `Research "${companyName}" as a private company employer. Return a structured JSON analysis:
{
  "founder_names": ["string — full names of founders or current owners/principals"],
  "founder_previous_companies": ["string — notable companies founders previously worked at or founded"],
  "founded_year": 2000,
  "company_history": "string — 2-3 sentence history of the company including key milestones, acquisitions, or pivots",
  "ownership_type": "string — e.g. family-owned, PE-backed, employee-owned, franchise, cooperative, privately held",
  "employee_count_estimate": "string or null",
  "glassdoor_rating": "number or null",
  "union_activity": [{"description": "string", "year": 2024, "location": "string", "source": "string"}],
  "osha_incidents": [{"description": "string", "year": 2024, "penalty_amount": 0, "location": "string"}],
  "discrimination_cases": [{"description": "string", "year": 2024, "outcome": "string", "agency": "string"}],
  "wage_theft_cases": [{"description": "string", "year": 2024, "amount": 0}],
  "notable_policies": ["string"],
  "controversies": [{"description": "string", "year": 2024, "source_url": "string", "category": "string"}],
  "parent_company": "string or null",
  "ownership_structure": "string or null",
  "recent_news": [{"headline": "string", "date": "2024-01-01", "source": "string", "url": "string"}],
  "watchdog_flags": [{"organization": "string", "flag_type": "string", "description": "string"}]
}
Include ONLY verified, factual information. Empty arrays for fields with no data. null for unknown fields.`,
              },
            ],
            search_recency_filter: "year",
          }),
        });

        if (perplexityRes.ok) {
          const aiData = await perplexityRes.json();
          const content = aiData.choices?.[0]?.message?.content;
          const citations = aiData.citations || [];

          if (content) {
            // Try to extract JSON from content (may be wrapped in markdown code blocks)
            let jsonStr = content;
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) jsonStr = jsonMatch[1];

            try {
              aiEnrichment = JSON.parse(jsonStr);
              results.ai_enrichment = 1;

              // Write union activity signals
              for (const u of (aiEnrichment.union_activity || [])) {
                await sb.from("civil_rights_signals").insert({
                  company_id: companyId,
                  signal_type: "union_activity",
                  signal_category: "labor_organizing",
                  source_name: u.source || "AI Research (Perplexity)",
                  description: `${u.description}${u.location ? ' – ' + u.location : ''}`,
                  confidence: "medium",
                  filing_date: u.year ? `${u.year}-01-01` : null,
                  location_state: u.location || null,
                }).catch(() => {});
              }

              // Write discrimination cases from AI
              for (const d of (aiEnrichment.discrimination_cases || [])) {
                await sb.from("company_court_cases").insert({
                  company_id: companyId,
                  case_name: (d.description || "Discrimination Case").substring(0, 200),
                  case_type: "Employment Discrimination",
                  court_name: d.agency || "Federal Agency",
                  date_filed: d.year ? `${d.year}-01-01` : null,
                  status: d.outcome || "unknown",
                  summary: d.description,
                  source: "AI Research (Perplexity)",
                  confidence: "medium",
                }).catch(() => {});
              }

              // Write controversies
              for (const c of (aiEnrichment.controversies || [])) {
                await sb.from("civil_rights_signals").insert({
                  company_id: companyId,
                  signal_type: "controversy",
                  signal_category: c.category || "corporate_behavior",
                  source_name: "News / AI Research",
                  source_url: c.source_url || null,
                  description: c.description,
                  confidence: "medium",
                  filing_date: c.year ? `${c.year}-01-01` : null,
                }).catch(() => {});
              }

              // Write watchdog flags
              for (const w of (aiEnrichment.watchdog_flags || [])) {
                await sb.from("civil_rights_signals").insert({
                  company_id: companyId,
                  signal_type: "watchdog_flag",
                  signal_category: w.flag_type || "watchdog",
                  source_name: w.organization || "Watchdog Organization",
                  description: w.description,
                  confidence: "medium",
                }).catch(() => {});
              }

              // Update company metadata — founders, history, ownership
              const updateFields: Record<string, any> = {};
              if (aiEnrichment.employee_count_estimate) updateFields.employee_count = aiEnrichment.employee_count_estimate;
              if (aiEnrichment.parent_company) updateFields.parent_company = aiEnrichment.parent_company;
              if (aiEnrichment.founder_names?.length) updateFields.founder_names = aiEnrichment.founder_names;
              if (aiEnrichment.founder_previous_companies?.length) updateFields.founder_previous_companies = aiEnrichment.founder_previous_companies;
              if (aiEnrichment.founded_year) updateFields.founded_year = aiEnrichment.founded_year;
              if (aiEnrichment.company_history) updateFields.description = aiEnrichment.company_history;
              if (aiEnrichment.ownership_type) updateFields.funding_stage = aiEnrichment.ownership_type;
              if (Object.keys(updateFields).length > 0) {
                await sb.from("companies").update(updateFields).eq("id", companyId);
              }

              // Store ownership structure
              if (aiEnrichment.ownership_structure) {
                await sb.from("company_corporate_structure").insert({
                  company_id: companyId,
                  entity_name: companyName,
                  entity_type: "subsidiary",
                  evidence_text: aiEnrichment.ownership_structure,
                  source_name: "AI Research (Perplexity)",
                  confidence: "medium",
                }).catch(() => {});
              }
            } catch (parseErr: any) {
              console.warn("[Perplexity] JSON parse failed");
              results.ai_enrichment = 0;
            }
          }
        } else {
          console.warn(`[Perplexity] ${perplexityRes.status}`);
          results.ai_enrichment = 0;
        }
      } catch (e: any) { console.warn("[Perplexity]", e); results.ai_enrichment = 0; }
    } else {
      results.ai_enrichment = 0;
    }

    // ─── Update scan completion ───
    const { data: company } = await sb.from("companies").select("scan_completion").eq("id", companyId).single();
    const scanCompletion = (company?.scan_completion as Record<string, boolean>) || {};
    scanCompletion.private_company_enrichment = true;
    scanCompletion.osha = (results.osha || 0) > 0;
    scanCompletion.nlrb = (results.nlrb || 0) > 0;
    scanCompletion.ftc = true;
    scanCompletion.cfpb = true;
    await sb.from("companies").update({
      scan_completion: scanCompletion,
      is_publicly_traded: false,
      updated_at: new Date().toISOString(),
    }).eq("id", companyId);

    const totalSignals = Object.values(results).reduce((sum, v) => sum + (v || 0), 0);
    console.log(`[enrich-private-company] COMPLETE: ${totalSignals} total signals`);

    return new Response(JSON.stringify({
      success: true,
      companyName,
      isPrivate: true,
      results,
      totalSignals,
      aiEnrichment: aiEnrichment ? {
        unionActivity: aiEnrichment.union_activity?.length || 0,
        controversies: aiEnrichment.controversies?.length || 0,
        discriminationCases: aiEnrichment.discrimination_cases?.length || 0,
        recentNews: aiEnrichment.recent_news?.length || 0,
        watchdogFlags: aiEnrichment.watchdog_flags?.length || 0,
      } : null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("enrich-private-company error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
