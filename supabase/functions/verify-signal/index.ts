import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Reputation Verification Engine
 * 3-layer validation: Identity → Claim → Freshness
 *
 * Accepts: { company_id, signal_table, signal_id }
 * Or batch: { company_id } (verifies all signals for a company)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { company_id, signal_table, signal_id } = await req.json();

    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch company for identity context
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .select("id, name, parent_company, industry, state, website_url, is_publicly_traded, ticker, sec_cik")
      .eq("id", company_id)
      .single();

    if (companyErr || !company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── LAYER 1: Identity Verification ──
    const identityResult = await verifyIdentity(company, perplexityKey);

    // ── LAYER 2 & 3: If single signal, verify it; otherwise batch
    if (signal_table && signal_id) {
      const result = await verifySingleSignal(
        supabase,
        company,
        signal_table,
        signal_id,
        identityResult,
        perplexityKey
      );
      return new Response(JSON.stringify({ success: true, verification: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch: verify all recent signals for the company
    const tables = [
      "ai_hr_signals",
      "civil_rights_signals",
      "climate_signals",
      "company_court_cases",
      "company_agency_contracts",
    ];

    const results: any[] = [];
    for (const table of tables) {
      const { data: signals } = await supabase
        .from(table)
        .select("id, created_at")
        .eq("company_id", company_id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!signals || signals.length === 0) continue;

      for (const sig of signals) {
        const result = await verifySingleSignal(
          supabase,
          company,
          table,
          sig.id,
          identityResult,
          perplexityKey
        );
        results.push(result);
      }
    }

    return new Response(
      JSON.stringify({ success: true, company: company.name, verified: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Verification engine error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── LAYER 1: Identity Verification ──
async function verifyIdentity(
  company: any,
  perplexityKey?: string
): Promise<{ verified: boolean; sources: any[]; notes: string }> {
  const sources: any[] = [];
  let verified = false;

  // Check 1: Do we have basic identity fields?
  const hasBasics = company.name && company.industry && company.state;
  if (hasBasics) {
    sources.push({ source: "internal_db", field: "name+industry+state", status: "present" });
  }

  // Check 2: Website exists
  if (company.website_url) {
    sources.push({ source: "company_website", url: company.website_url, status: "present" });
  }

  // Check 3: SEC verification for public companies
  if (company.is_publicly_traded && company.sec_cik) {
    sources.push({ source: "sec_edgar", cik: company.sec_cik, status: "verified" });
    verified = true;
  }

  // Check 4: If we have Perplexity, do a quick identity cross-check
  if (perplexityKey && !verified) {
    try {
      const pxResult = await perplexityIdentityCheck(company, perplexityKey);
      sources.push({
        source: "perplexity_search",
        status: pxResult.confirmed ? "verified" : "uncertain",
        details: pxResult.summary,
      });
      if (pxResult.confirmed) verified = true;
    } catch (e: any) {
      console.error("Perplexity identity check failed:", e.message);
      sources.push({ source: "perplexity_search", status: "error", details: e.message });
    }
  }

  // Fallback: if we have at least website + name, consider partially verified
  if (!verified && sources.length >= 2) {
    verified = true; // partial
  }

  return {
    verified,
    sources,
    notes: verified ? "Identity cross-referenced" : "Identity could not be fully confirmed",
  };
}

async function perplexityIdentityCheck(
  company: any,
  apiKey: string
): Promise<{ confirmed: boolean; summary: string }> {
  const query = `Verify: Is "${company.name}" a real company? Industry: ${company.industry}. ${
    company.parent_company ? `Parent company: ${company.parent_company}.` : ""
  } Confirm name, headquarters, and industry. Brief answer.`;

  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You verify company identities. Respond with JSON: {confirmed: boolean, summary: string}. Keep summary under 50 words.",
        },
        { role: "user", content: query },
      ],
      max_tokens: 200,
    }),
  });

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    const parsed = JSON.parse(content);
    return { confirmed: !!parsed.confirmed, summary: parsed.summary || content };
  } catch {
    return { confirmed: content.toLowerCase().includes("confirmed"), summary: content.slice(0, 200) };
  }
}

// ── LAYER 2 & 3: Claim + Freshness Verification ──
async function verifySingleSignal(
  supabase: any,
  company: any,
  signalTable: string,
  signalId: string,
  identityResult: any,
  perplexityKey?: string
) {
  // Fetch the signal
  const { data: signal } = await supabase
    .from(signalTable)
    .select("*")
    .eq("id", signalId)
    .single();

  if (!signal) return null;

  // ── LAYER 2: Claim Verification ──
  const claimSources: any[] = [];
  let claimVerified = false;

  // Check if signal has a source URL
  const sourceUrl = signal.source_url || signal.evidence_url || signal.courtlistener_url || null;
  if (sourceUrl) {
    claimSources.push({ type: "primary_source", url: sourceUrl, status: "linked" });
    claimVerified = true;
  }

  // Check for government filing source
  const sourceName = signal.source_name || signal.source || signal.source_type || "";
  const govSources = ["FEC", "SEC", "OSHA", "NLRB", "EEOC", "EPA", "USASpending", "LDA", "WARN", "BLS", "CDP"];
  const isGovSource = govSources.some((s) => sourceName.toLowerCase().includes(s.toLowerCase()));
  if (isGovSource) {
    claimSources.push({ type: "government_filing", source: sourceName, status: "authoritative" });
    claimVerified = true;
  }

  // Check for evidence text
  if (signal.evidence_text) {
    claimSources.push({ type: "evidence_text", excerpt: signal.evidence_text.slice(0, 100), status: "present" });
  }

  // ── LAYER 3: Freshness ──
  const signalDate = signal.created_at || signal.date_detected || signal.filing_date || signal.detected_at;
  const lastVerified = signal.last_verified || signal.last_verified_at;
  const referenceDate = lastVerified || signalDate;

  let freshnessStatus = "unknown";
  if (referenceDate) {
    const ageMs = Date.now() - new Date(referenceDate).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= 30) freshnessStatus = "fresh";
    else if (ageDays <= 90) freshnessStatus = "aging";
    else freshnessStatus = "stale";
  }

  // ── Compute overall confidence ──
  let confidenceLevel = "low";
  if (identityResult.verified && claimVerified && freshnessStatus !== "stale") {
    confidenceLevel = "high";
  } else if ((identityResult.verified || claimVerified) && freshnessStatus !== "stale") {
    confidenceLevel = "medium";
  }

  let verificationStatus = "unverified";
  if (confidenceLevel === "high") verificationStatus = "verified";
  else if (confidenceLevel === "medium") verificationStatus = "partially_verified";

  // ── Upsert verification record ──
  const record = {
    company_id: company.id,
    signal_table: signalTable,
    signal_id: signalId,
    identity_verified: identityResult.verified,
    identity_sources: identityResult.sources,
    identity_verified_at: identityResult.verified ? new Date().toISOString() : null,
    claim_verified: claimVerified,
    claim_sources: claimSources,
    claim_evidence_urls: sourceUrl ? [sourceUrl] : [],
    claim_verified_at: claimVerified ? new Date().toISOString() : null,
    data_last_updated: referenceDate || null,
    freshness_status: freshnessStatus,
    verification_status: verificationStatus,
    confidence_level: confidenceLevel,
    verified_by: "system",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("signal_verifications").upsert(record, {
    onConflict: "signal_table,signal_id",
  });

  if (error) console.error("Upsert verification error:", error);

  return record;
}
