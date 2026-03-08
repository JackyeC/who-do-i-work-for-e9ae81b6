const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MODULES = [
  { key: 'ai_hr_scan', label: 'Hiring Technology & AI Use', fn: 'ai-hr-scan' },
  { key: 'worker_benefits', label: 'Worker Benefits & Protections', fn: 'worker-benefits-scan' },
  { key: 'pay_equity', label: 'Pay Equity & Compensation Transparency', fn: 'pay-equity-scan' },
  { key: 'worker_sentiment', label: 'Worker Sentiment', fn: 'worker-sentiment-scan' },
  { key: 'ideology', label: 'Ideology & Controversy Signals', fn: 'ideology-scan' },
  { key: 'social', label: 'Social & Media Monitoring', fn: 'social-scan' },
  { key: 'agency_contracts', label: 'Government Contracts', fn: 'agency-scan' },
  { key: 'ai_accountability', label: 'AI Accountability', fn: 'ai-accountability-scan' },
];

// Determine truthful module status based on actual results
function resolveModuleStatus(sourcesScanned: number, signalsFound: number): string {
  if (sourcesScanned > 0 && signalsFound > 0) return 'completed_with_signals';
  if (sourcesScanned > 0 && signalsFound === 0) return 'completed_no_signals';
  return 'no_sources_found';
}

// Check if a status counts as "truly completed"
function isTrulyCompleted(status: string): boolean {
  return status === 'completed_with_signals' || status === 'completed_no_signals';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[intelligence-scan] START: ${companyName} (${companyId})`);

    // Check for existing in-progress scan
    const { data: existingScan } = await supabase
      .from('scan_runs')
      .select('id, scan_status')
      .eq('company_id', companyId)
      .in('scan_status', ['queued', 'in_progress'])
      .maybeSingle();

    if (existingScan) {
      return new Response(JSON.stringify({
        success: false,
        error: 'A scan is already in progress for this company',
        scanRunId: existingScan.id,
      }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create scan run record
    const { data: scanRun, error: insertErr } = await supabase
      .from('scan_runs')
      .insert({
        company_id: companyId,
        scan_status: 'in_progress',
        triggered_by: 'user',
        total_modules_run: MODULES.length,
        module_statuses: Object.fromEntries(MODULES.map(m => [m.key, { status: 'queued', label: m.label }])),
      })
      .select()
      .single();

    if (insertErr || !scanRun) {
      console.error('[intelligence-scan] Failed to create scan run:', insertErr);
      return new Response(JSON.stringify({ success: false, error: 'Failed to create scan run' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const scanId = scanRun.id;
    console.log(`[intelligence-scan] Scan run created: ${scanId}`);

    await supabase.from('companies').update({
      last_scan_attempted: new Date().toISOString(),
    }).eq('id', companyId);

    // Run modules sequentially
    const moduleStatuses: Record<string, any> = {};
    let trulyCompleted = 0, failed = 0, noSourcesFound = 0, withSignals = 0;
    let totalSources = 0, totalSignals = 0;
    const warnings: string[] = [];
    const errorLog: any[] = [];

    for (const mod of MODULES) {
      console.log(`[intelligence-scan] Running module: ${mod.key}`);
      const moduleStartedAt = new Date().toISOString();

      // Update module status to in_progress
      moduleStatuses[mod.key] = { status: 'in_progress', label: mod.label, startedAt: moduleStartedAt };
      await supabase.from('scan_runs').update({
        module_statuses: { ...moduleStatuses },
      }).eq('id', scanId);

      try {
        const moduleResp = await fetch(`${supabaseUrl}/functions/v1/${mod.fn}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companyId, companyName }),
        });

        const moduleCompletedAt = new Date().toISOString();

        if (moduleResp.ok) {
          const result = await moduleResp.json();
          const signalsFound = result.signalsFound || 0;
          const sourcesScanned = result.sourcesScanned || 0;

          totalSources += sourcesScanned;
          totalSignals += signalsFound;

          // Apply truthful status rules
          const resolvedStatus = resolveModuleStatus(sourcesScanned, signalsFound);

          moduleStatuses[mod.key] = {
            status: resolvedStatus,
            label: mod.label,
            signalsFound,
            sourcesScanned,
            startedAt: moduleStartedAt,
            completedAt: moduleCompletedAt,
          };

          if (isTrulyCompleted(resolvedStatus)) {
            trulyCompleted++;
            if (resolvedStatus === 'completed_with_signals') withSignals++;
          } else {
            // no_sources_found
            noSourcesFound++;
            warnings.push(`${mod.label}: No usable sources were discovered or scanned.`);
          }

          console.log(`[intelligence-scan] ${mod.key}: status=${resolvedStatus}, ${signalsFound} signals from ${sourcesScanned} sources`);
        } else {
          const errText = await moduleResp.text().catch(() => 'Unknown error');
          failed++;

          // Detect specific error types
          let errorType = 'http_error';
          let errorExplanation = `Module returned HTTP ${moduleResp.status}`;
          if (moduleResp.status === 402) {
            errorType = 'quota_exceeded';
            errorExplanation = 'External provider quota or billing issue detected. The crawling service has run out of credits.';
          } else if (moduleResp.status === 429) {
            errorType = 'rate_limited';
            errorExplanation = 'Rate limited by external provider. Try again later.';
          } else if (moduleResp.status >= 500) {
            errorType = 'server_error';
            errorExplanation = 'The scan module encountered an internal error.';
          }

          moduleStatuses[mod.key] = {
            status: 'failed',
            label: mod.label,
            error: `HTTP ${moduleResp.status}`,
            errorType,
            errorExplanation,
            startedAt: moduleStartedAt,
            completedAt: moduleCompletedAt,
            sourcesScanned: 0,
            signalsFound: 0,
          };
          warnings.push(`${mod.label} failed (HTTP ${moduleResp.status}): ${errorExplanation}`);
          errorLog.push({
            module: mod.key,
            label: mod.label,
            status: moduleResp.status,
            errorType,
            errorExplanation,
            error: errText.slice(0, 500),
            timestamp: moduleCompletedAt,
          });
          console.error(`[intelligence-scan] ${mod.key} failed: HTTP ${moduleResp.status}`);
        }
      } catch (e) {
        const moduleCompletedAt = new Date().toISOString();
        failed++;
        const msg = e instanceof Error ? e.message : 'Unknown error';
        moduleStatuses[mod.key] = {
          status: 'failed',
          label: mod.label,
          error: msg,
          errorType: 'exception',
          errorExplanation: `Unhandled exception: ${msg}`,
          startedAt: moduleStartedAt,
          completedAt: moduleCompletedAt,
          sourcesScanned: 0,
          signalsFound: 0,
        };
        warnings.push(`${mod.label} failed: ${msg}`);
        errorLog.push({
          module: mod.key,
          label: mod.label,
          errorType: 'exception',
          errorExplanation: msg,
          error: msg,
          timestamp: moduleCompletedAt,
        });
        console.error(`[intelligence-scan] ${mod.key} exception:`, e);
      }

      // Update progress after each module
      await supabase.from('scan_runs').update({
        modules_completed: trulyCompleted,
        modules_failed: failed,
        modules_with_signals: withSignals,
        modules_with_no_signals: noSourcesFound,
        total_sources_scanned: totalSources,
        total_signals_found: totalSignals,
        module_statuses: { ...moduleStatuses },
        warnings,
        error_log: errorLog,
      }).eq('id', scanId);
    }

    // Finalize overall status
    const overallStatus = failed === MODULES.length
      ? 'failed'
      : (failed > 0 || noSourcesFound > 0)
        ? 'completed_with_warnings'
        : 'completed';

    await supabase.from('scan_runs').update({
      scan_status: overallStatus,
      scan_completed_at: new Date().toISOString(),
    }).eq('id', scanId);

    // Update company scan_completion — only truly completed modules count
    const scanCompletion: Record<string, boolean> = {};
    for (const mod of MODULES) {
      scanCompletion[mod.key] = isTrulyCompleted(moduleStatuses[mod.key]?.status);
    }
    await supabase.from('companies').update({
      scan_completion: scanCompletion,
      record_status: 'verified',
    }).eq('id', companyId);

    console.log(`[intelligence-scan] COMPLETE: ${companyName} - ${overallStatus} (${trulyCompleted}/${MODULES.length} truly completed, ${noSourcesFound} no_sources_found, ${failed} failed, ${totalSignals} signals)`);

    return new Response(JSON.stringify({
      success: true,
      scanRunId: scanId,
      scanStatus: overallStatus,
      modulesCompleted: trulyCompleted,
      modulesFailed: failed,
      modulesNoSourcesFound: noSourcesFound,
      modulesWithSignals: withSignals,
      totalSourcesScanned: totalSources,
      totalSignalsFound: totalSignals,
      warnings,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[intelligence-scan] Unhandled error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
