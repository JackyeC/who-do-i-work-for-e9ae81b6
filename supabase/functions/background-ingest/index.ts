/**
 * background-ingest — Orchestrator that pulls companies from the ingestion queue
 * and fans out to existing source-specific edge functions.
 * 
 * Designed to be called by pg_cron every 2 hours.
 * Processes up to BATCH_SIZE companies per run, ordered by priority + staleness.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireServiceRole } from "../_shared/auth-guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 10; // companies per run

// Cadence per source family (hours between runs)
const SOURCE_CADENCE: Record<string, number> = {
  news: 24,
  fec: 72,
  sec: 72,
  osha: 168, // weekly
  warn: 72,
  careers: 168, // weekly
};

// Map source_family to the edge function that handles it
const SOURCE_FUNCTIONS: Record<string, string> = {
  sec: 'sync-sec-edgar',
  fec: 'sync-openfec',
  osha: 'sync-workplace-enforcement',
  warn: 'warn-scan',
  news: 'sync-work-news',
  careers: 'scrape-careers-page',
};

Deno.serve(async (req: Request) => {

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }


  // Auth guard: require service-role key
  const authDenied = requireServiceRole(req);
  if (authDenied) return authDenied;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Pull next batch from queue — ordered by priority (1=highest), then staleness
    const { data: queue, error: qErr } = await supabase
      .from('company_ingestion_queue')
      .select('id, company_id, source_family, priority, error_count')
      .lte('next_run_at', new Date().toISOString())
      .neq('status', 'processing')
      .order('priority', { ascending: true })
      .order('next_run_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (qErr) throw qErr;
    if (!queue || queue.length === 0) {
      console.log('[background-ingest] No items in queue');
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[background-ingest] Processing ${queue.length} queue items`);

    // 2. Mark items as processing
    const queueIds = queue.map(q => q.id);
    await supabase
      .from('company_ingestion_queue')
      .update({ status: 'processing' })
      .in('id', queueIds);

    // 3. Get company names for all company_ids
    const companyIds = [...new Set(queue.map(q => q.company_id))];
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, sec_cik, ticker, state, careers_url')
      .in('id', companyIds);

    const companyMap = new Map(companies?.map(c => [c.id, c]) || []);

    // 4. Process each queue item
    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const item of queue) {
      const company = companyMap.get(item.company_id);
      if (!company) {
        results.push({ id: item.id, success: false, error: 'Company not found' });
        continue;
      }

      const fnName = SOURCE_FUNCTIONS[item.source_family];
      if (!fnName) {
        results.push({ id: item.id, success: false, error: `Unknown source: ${item.source_family}` });
        continue;
      }

      try {
        // Build the payload based on source family
        const payload = buildPayload(item.source_family, company);

        console.log(`[background-ingest] Invoking ${fnName} for ${company.name} (${item.source_family})`);

        const { error: fnErr } = await supabase.functions.invoke(fnName, {
          body: payload,
        });

        if (fnErr) throw fnErr;

        // Update coverage summary
        await updateCoverageSummary(supabase, item.company_id, item.source_family);

        results.push({ id: item.id, success: true });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[background-ingest] Error for ${company.name}/${item.source_family}: ${errMsg}`);
        results.push({ id: item.id, success: false, error: errMsg });
      }
    }

    // 5. Update queue items with results
    for (const result of results) {
      const item = queue.find(q => q.id === result.id)!;
      const cadenceHours = SOURCE_CADENCE[item.source_family] || 72;
      const nextRun = new Date(Date.now() + cadenceHours * 60 * 60 * 1000).toISOString();

      if (result.success) {
        await supabase
          .from('company_ingestion_queue')
          .update({
            status: 'completed',
            last_run_at: new Date().toISOString(),
            next_run_at: nextRun,
            error_count: 0,
            last_error: null,
          })
          .eq('id', result.id);
      } else {
        // Exponential backoff on errors (double the cadence per error, max 7 days)
        const backoffHours = Math.min(cadenceHours * Math.pow(2, item.error_count), 168);
        const errorNextRun = new Date(Date.now() + backoffHours * 60 * 60 * 1000).toISOString();

        await supabase
          .from('company_ingestion_queue')
          .update({
            status: 'error',
            last_run_at: new Date().toISOString(),
            next_run_at: errorNextRun,
            error_count: item.error_count + 1,
            last_error: result.error || 'Unknown error',
          })
          .eq('id', result.id);
      }
    }

    // 6. Log to ingestion log
    const successCount = results.filter(r => r.success).length;
    console.log(`[background-ingest] Done: ${successCount}/${results.length} succeeded`);

    return new Response(JSON.stringify({
      processed: results.length,
      succeeded: successCount,
      failed: results.length - successCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[background-ingest] Fatal error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildPayload(sourceFamily: string, company: any): Record<string, any> {
  switch (sourceFamily) {
    case 'sec':
      return {
        company_id: company.id,
        company_name: company.name,
        cik: company.sec_cik,
        ticker: company.ticker,
      };
    case 'fec':
      return {
        company_id: company.id,
        company_name: company.name,
      };
    case 'osha':
      return {
        company_id: company.id,
        company_name: company.name,
        state: company.state,
      };
    case 'warn':
      return {
        company_id: company.id,
        company_name: company.name,
        national: true,
      };
    case 'news':
      return {
        company_name: company.name,
      };
    case 'careers':
      return {
        company_id: company.id,
        company_name: company.name,
        careers_url: company.careers_url,
      };
    default:
      return { company_id: company.id, company_name: company.name };
  }
}

async function updateCoverageSummary(
  supabase: any,
  companyId: string,
  sourceFamily: string
) {
  // Count signals for this company + source family
  const signalCount = await countSignals(supabase, companyId, sourceFamily);

  const coverageStatus = signalCount >= 5 ? 'rich'
    : signalCount >= 1 ? 'limited'
    : 'no_trail';

  const summaryText = generateSummaryText(sourceFamily, signalCount);

  await supabase
    .from('company_coverage_summary')
    .upsert({
      company_id: companyId,
      source_family: sourceFamily,
      signal_count: signalCount,
      last_checked_at: new Date().toISOString(),
      coverage_status: coverageStatus,
      summary_text: summaryText,
    }, { onConflict: 'company_id,source_family' });
}

async function countSignals(supabase: any, companyId: string, sourceFamily: string): Promise<number> {
  // Map source families to their signal tables
  const tableMap: Record<string, { table: string; field: string }> = {
    sec: { table: 'company_source_documents', field: 'company_id' },
    fec: { table: 'company_executives', field: 'company_id' },
    osha: { table: 'accountability_signals', field: 'company_id' },
    warn: { table: 'company_warn_notices', field: 'company_id' },
    news: { table: 'work_news', field: 'id' }, // news is global, count differently
    careers: { table: 'company_careers_signals', field: 'company_id' },
  };

  const mapping = tableMap[sourceFamily];
  if (!mapping) return 0;

  if (sourceFamily === 'news') {
    // For news, we don't count per-company
    return 1;
  }

  const { count } = await supabase
    .from(mapping.table)
    .select('id', { count: 'exact', head: true })
    .eq(mapping.field, companyId);

  return count || 0;
}

function generateSummaryText(sourceFamily: string, count: number): string {
  if (count === 0) {
    const labels: Record<string, string> = {
      sec: 'No SEC filings indexed yet',
      fec: 'No FEC contribution records found',
      osha: 'No OSHA inspection records on file',
      warn: 'No WARN Act layoff notices reported',
      news: 'No recent news coverage detected',
      careers: 'Careers page not yet scanned',
    };
    return labels[sourceFamily] || 'No data found';
  }

  const templates: Record<string, (n: number) => string> = {
    sec: (n) => `${n} SEC filing${n > 1 ? 's' : ''} indexed`,
    fec: (n) => `${n} FEC contribution record${n > 1 ? 's' : ''} found`,
    osha: (n) => `${n} OSHA inspection${n > 1 ? 's' : ''} on record`,
    warn: (n) => `${n} WARN notice${n > 1 ? 's' : ''} reported`,
    news: (n) => `${n} recent article${n > 1 ? 's' : ''} detected`,
    careers: (n) => `Careers page analyzed — ${n} signal${n > 1 ? 's' : ''}`,
  };

  return (templates[sourceFamily] || ((n) => `${n} record(s)`))(count);
}
