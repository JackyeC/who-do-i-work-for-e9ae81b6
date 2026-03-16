/**
 * Bulk Refresh All Companies
 * 
 * One-time or periodic function to refresh ALL companies in the database,
 * not just tracked ones. Processes in batches with throttling.
 * Routes private companies to the private enrichment pipeline.
 * 
 * Input: { batchSize?: number, offset?: number, dryRun?: boolean }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 10;
const THROTTLE_MS = 2000; // 2s between companies to avoid rate limits

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize || BATCH_SIZE, 25);
    const offset = body.offset || 0;
    const dryRun = body.dryRun || false;
    const staleDays = body.staleDays || 2; // refresh anything older than N days

    console.log(`[bulk-refresh] START batch=${batchSize} offset=${offset} staleDays=${staleDays} dryRun=${dryRun}`);

    // Get companies that need refreshing: never scanned OR stale
    const { data: companies, error } = await supabase
      .from("companies")
      .select("id, name, slug, is_publicly_traded, last_scan_attempted")
      .or(`last_scan_attempted.is.null,last_scan_attempted.lt.${new Date(Date.now() - staleDays * 86400000).toISOString()}`)
      .order("last_scan_attempted", { ascending: true, nullsFirst: true })
      .range(offset, offset + batchSize - 1);

    if (error) throw error;

    if (!companies?.length) {
      return new Response(JSON.stringify({
        success: true,
        message: "All companies are current",
        processed: 0,
        remaining: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Count total remaining
    const { count: totalStale } = await supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .or(`last_scan_attempted.is.null,last_scan_attempted.lt.${new Date(Date.now() - staleDays * 86400000).toISOString()}`);

    const results: any[] = [];

    for (const company of companies) {
      const isPrivate = company.is_publicly_traded === false;

      if (dryRun) {
        results.push({ name: company.name, isPrivate, action: "would_refresh" });
        continue;
      }

      try {
        // Route to appropriate scanner
        if (isPrivate) {
          // Private companies: run private enrichment + civil rights + labor
          const scanPromises = [
            supabase.functions.invoke("enrich-private-company", {
              body: { companyId: company.id, companyName: company.name },
            }),
            supabase.functions.invoke("sync-civil-rights-signals", {
              body: { companyId: company.id, companyName: company.name },
            }),
            supabase.functions.invoke("sync-labor-rights", {
              body: { companyId: company.id, companyName: company.name },
            }),
          ];

          const scanResults = await Promise.allSettled(scanPromises);
          const succeeded = scanResults.filter(r => r.status === "fulfilled").length;

          results.push({
            name: company.name,
            isPrivate: true,
            scans: `${succeeded}/${scanPromises.length} succeeded`,
          });
        } else {
          // Public companies: full OSINT scan
          const { data, error: scanErr } = await supabase.functions.invoke("osint-parallel-scan", {
            body: { companyId: company.id, companyName: company.name },
          });

          results.push({
            name: company.name,
            isPrivate: false,
            success: !scanErr,
            sourcesRun: data?.sourcesRun || 0,
            succeeded: data?.succeeded || 0,
          });
        }
      } catch (e) {
        results.push({
          name: company.name,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }

      // Throttle between companies
      await sleep(THROTTLE_MS);
    }

    const nextOffset = offset + companies.length;
    const remaining = (totalStale || 0) - companies.length;

    console.log(`[bulk-refresh] COMPLETE: ${companies.length} processed, ${remaining} remaining`);

    return new Response(JSON.stringify({
      success: true,
      processed: companies.length,
      remaining: Math.max(remaining, 0),
      nextOffset,
      hasMore: remaining > 0,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[bulk-refresh] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
