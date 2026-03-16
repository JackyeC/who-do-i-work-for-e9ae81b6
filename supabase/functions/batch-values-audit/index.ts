import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get all companies with active jobs
    const { data: jobCompanies, error: jobError } = await adminClient
      .from("company_jobs")
      .select("company_id")
      .eq("is_active", true);

    if (jobError) throw new Error(`Failed to fetch job companies: ${jobError.message}`);

    const companyIds = [...new Set((jobCompanies || []).map((j: any) => j.company_id))];
    console.log(`[batch-values-audit] Found ${companyIds.length} companies with active jobs`);

    const results: any[] = [];
    const errors: any[] = [];

    // Process each company sequentially (to avoid rate limits on Perplexity)
    for (const companyId of companyIds) {
      try {
        console.log(`[batch-values-audit] Scanning company ${companyId}...`);

        // Call values-scan for this company
        const response = await fetch(`${supabaseUrl}/functions/v1/values-scan`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ companyId }),
        });

        const result = await response.json();

        if (response.ok) {
          results.push({ companyId, signalsFound: result.signalsFound || 0, cached: result.cached || false });
          console.log(`[batch-values-audit] ✓ ${companyId}: ${result.signalsFound} signals (cached: ${result.cached || false})`);
        } else {
          errors.push({ companyId, error: result.error || "Unknown error" });
          console.error(`[batch-values-audit] ✗ ${companyId}: ${result.error}`);
        }

        // Throttle: 3 seconds between calls to respect Perplexity rate limits
        if (!result.cached) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (e: any) {
        errors.push({ companyId, error: e.message });
        console.error(`[batch-values-audit] ✗ ${companyId}: ${e.message}`);
      }
    }

    // Step 2: Recalculate civic scores for all job-board companies
    console.log(`[batch-values-audit] Recalculating civic scores...`);
    const scoreResults: any[] = [];

    for (const companyId of companyIds) {
      try {
        const { data: newScore } = await adminClient.rpc("compute_career_intelligence_score", {
          _company_id: companyId,
        });
        scoreResults.push({ companyId, newScore });
      } catch (e: any) {
        console.error(`[batch-values-audit] Score calc failed for ${companyId}: ${e.message}`);
      }
    }

    const totalSignals = results.reduce((sum, r) => sum + (r.signalsFound || 0), 0);

    return new Response(JSON.stringify({
      success: true,
      companiesProcessed: companyIds.length,
      totalSignalsFound: totalSignals,
      results,
      scoreResults,
      errors,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[batch-values-audit] Fatal error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
