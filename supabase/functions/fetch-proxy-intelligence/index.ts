import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EDGAR_FULL_TEXT_BASE = "https://efts.sec.gov/LATEST/search-index?q=%22DEF+14A%22&dateRange=custom&startdt=2024-01-01&enddt=2026-12-31&forms=DEF+14A";

interface ProxyParsed {
  ceo_name: string | null;
  ceo_total_comp: number | null;
  ceo_salary: number | null;
  ceo_bonus: number | null;
  ceo_stock: number | null;
  ceo_other: number | null;
  ceo_median_pay_ratio: string | null;
  comp_interpretation: string | null;
  board_members: { name: string; title: string; independent: boolean; tenure_years: number | null }[];
  ceo_is_chair: boolean;
  power_concentration: string;
  shareholder_proposals: { proposal: string; tag: string }[];
  governance_rating: string;
  governance_notes: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: "companyId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if we already have recent data (< 30 days old)
    const { data: existing } = await supabase
      .from("proxy_intelligence")
      .select("id, updated_at")
      .eq("company_id", companyId)
      .maybeSingle();

    if (existing) {
      const age = Date.now() - new Date(existing.updated_at).getTime();
      if (age < 30 * 24 * 60 * 60 * 1000) {
        return new Response(JSON.stringify({ status: "cached", id: existing.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get company CIK
    const { data: company } = await supabase
      .from("companies")
      .select("sec_cik, name, ticker, is_publicly_traded")
      .eq("id", companyId)
      .single();

    if (!company?.sec_cik || !company.is_publicly_traded) {
      return new Response(
        JSON.stringify({ error: "Company is not publicly traded or has no SEC CIK" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch latest DEF 14A filing from EDGAR
    const cik = company.sec_cik.replace(/^0+/, "");
    const paddedCik = company.sec_cik.padStart(10, "0");
    const edgarUrl = `https://efts.sec.gov/LATEST/search-index?q=%22DEF+14A%22&forms=DEF+14A&dateRange=custom&startdt=2023-01-01&enddt=2026-12-31&entity=${encodeURIComponent(company.name)}`;

    // Use EDGAR full-text search API
    const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=%22${paddedCik}%22&forms=DEF+14A&dateRange=custom&startdt=2023-01-01&enddt=2026-12-31`;

    // Try the EDGAR filing search API
    const filingSearchUrl = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
    console.log(`[proxy] Fetching EDGAR submissions for CIK ${paddedCik}`);

    const edgarRes = await fetch(filingSearchUrl, {
      headers: { "User-Agent": "WDIWF/1.0 (contact@wdiwf.com)", Accept: "application/json" },
    });

    if (!edgarRes.ok) {
      throw new Error(`EDGAR API error: ${edgarRes.status}`);
    }

    const edgarData = await edgarRes.json();

    // Find latest DEF 14A
    const filings = edgarData.filings?.recent || {};
    const forms = filings.form || [];
    const dates = filings.filingDate || [];
    const accessions = filings.accessionNumber || [];
    const primaryDocs = filings.primaryDocument || [];

    let proxyIdx = -1;
    for (let i = 0; i < forms.length; i++) {
      if (forms[i] === "DEF 14A") {
        proxyIdx = i;
        break;
      }
    }

    if (proxyIdx === -1) {
      return new Response(
        JSON.stringify({ error: "No DEF 14A proxy filing found for this company" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accession = accessions[proxyIdx].replace(/-/g, "");
    const primaryDoc = primaryDocs[proxyIdx];
    const filingDate = dates[proxyIdx];
    const filingUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accession}/${primaryDoc}`;

    console.log(`[proxy] Found DEF 14A from ${filingDate}: ${filingUrl}`);

    // Fetch the proxy filing document (just the first portion for AI parsing)
    const docRes = await fetch(filingUrl, {
      headers: { "User-Agent": "WDIWF/1.0 (contact@wdiwf.com)" },
    });

    if (!docRes.ok) {
      throw new Error(`Failed to fetch proxy document: ${docRes.status}`);
    }

    let docText = await docRes.text();
    // Strip HTML tags for cleaner AI input
    docText = docText.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
    // Truncate to ~80k chars to stay within AI context limits
    const truncated = docText.slice(0, 80000);

    console.log(`[proxy] Document fetched, ${docText.length} chars, truncated to ${truncated.length}`);

    // Use Perplexity to parse the proxy filing (reliable from edge functions)
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    let aiContent = "";

    // Try Lovable AI first, fall back to Perplexity
    const aiProviders = [
      lovableKey ? {
        url: "https://ai.lovable.dev/api/generate",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: { model: "google/gemini-2.5-flash", messages: [{ role: "user", content: "" }], max_tokens: 4096 },
        name: "lovable-gemini",
      } : null,
      perplexityKey ? {
        url: "https://api.perplexity.ai/chat/completions",
        headers: { Authorization: `Bearer ${perplexityKey}`, "Content-Type": "application/json" },
        body: { model: "sonar", messages: [{ role: "user", content: "" }], max_tokens: 4096 },
        name: "perplexity",
      } : null,
    ].filter(Boolean);

    if (aiProviders.length === 0) {
      throw new Error("No AI provider configured (LOVABLE_API_KEY or PERPLEXITY_API_KEY)");
    }

    const aiPrompt = `You are analyzing an SEC Schedule 14A (proxy statement) filing for ${company.name} (${company.ticker}).

Extract the following information and return ONLY valid JSON (no markdown, no explanation):

{
  "ceo_name": "string or null",
  "ceo_total_comp": number_in_dollars_or_null,
  "ceo_salary": number_in_dollars_or_null,
  "ceo_bonus": number_in_dollars_or_null,
  "ceo_stock": number_in_dollars_or_null,
  "ceo_other": number_in_dollars_or_null,
  "ceo_median_pay_ratio": "string like '186:1' or null",
  "comp_interpretation": "One sentence interpreting the CEO pay structure",
  "board_members": [{"name":"string","title":"string","independent":true_or_false,"tenure_years":number_or_null}],
  "ceo_is_chair": true_or_false,
  "power_concentration": "concentrated" or "distributed",
  "shareholder_proposals": [{"proposal":"plain English description","tag":"Routine" or "Potentially controversial"}],
  "governance_rating": "Strong oversight" or "Moderate" or "Weak",
  "governance_notes": "One sentence about notable governance features or risks"
}

Rules:
- For board_members, include up to 10 members
- Mark ceo_is_chair true if the CEO also serves as Board Chair/Chairman
- power_concentration is "concentrated" if CEO is also chair AND board has few independents
- Tag shareholder proposals as "Routine" for standard items (elect directors, ratify auditor, approve exec comp) and "Potentially controversial" for anything else
- governance_rating: "Strong" if CEO/Chair split and majority independent board; "Weak" if combined roles and few independents; "Moderate" otherwise
- All dollar amounts should be integers (no decimals)

Here is the proxy filing text:
${truncated}`;

    let providerUsed = "unknown";
    for (const provider of aiProviders) {
      if (!provider) continue;
      try {
        provider.body.messages = [{ role: "user", content: aiPrompt }];
        console.log(`[proxy] Trying AI provider: ${provider.name}`);
        const aiRes = await fetch(provider.url, {
          method: "POST",
          headers: provider.headers,
          body: JSON.stringify(provider.body),
        });
        if (!aiRes.ok) {
          console.warn(`[proxy] ${provider.name} returned ${aiRes.status}`);
          continue;
        }
        const aiData = await aiRes.json();
        aiContent = aiData.choices?.[0]?.message?.content || "";
        if (aiContent) {
          providerUsed = provider.name;
          break;
        }
      } catch (providerErr) {
        console.warn(`[proxy] ${provider.name} failed:`, providerErr);
      }
    }

    if (!aiContent) {
      throw new Error("All AI providers failed to generate a response");
    }

    // Extract JSON from response
    let parsed: ProxyParsed;
    try {
      // Try to find JSON in the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[proxy] Failed to parse AI response:", aiContent.slice(0, 500));
      throw new Error("Failed to parse proxy intelligence from AI response");
    }

    // Upsert to database
    const record = {
      company_id: companyId,
      filing_date: filingDate,
      filing_url: filingUrl,
      ceo_name: parsed.ceo_name,
      ceo_total_comp: parsed.ceo_total_comp,
      ceo_salary: parsed.ceo_salary,
      ceo_bonus: parsed.ceo_bonus,
      ceo_stock: parsed.ceo_stock,
      ceo_other: parsed.ceo_other,
      ceo_median_pay_ratio: parsed.ceo_median_pay_ratio,
      comp_interpretation: parsed.comp_interpretation,
      board_members: parsed.board_members,
      ceo_is_chair: parsed.ceo_is_chair,
      power_concentration: parsed.power_concentration,
      shareholder_proposals: parsed.shareholder_proposals,
      governance_rating: parsed.governance_rating,
      governance_notes: parsed.governance_notes,
      provider_used: "gemini-2.5-flash",
      confidence_score: 0.8,
      updated_at: new Date().toISOString(),
    };

    const { data: upserted, error: upsertErr } = await supabase
      .from("proxy_intelligence")
      .upsert(record, { onConflict: "company_id" })
      .select("id")
      .single();

    if (upsertErr) {
      console.error("[proxy] Upsert error:", upsertErr);
      throw upsertErr;
    }

    console.log(`[proxy] Saved proxy intelligence for ${company.name}, id: ${upserted.id}`);

    return new Response(
      JSON.stringify({ status: "ok", id: upserted.id, data: record }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[proxy] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
