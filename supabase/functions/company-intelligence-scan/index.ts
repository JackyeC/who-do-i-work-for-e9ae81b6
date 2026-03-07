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

    // Update company scan timestamp
    await supabase.from('companies').update({
      last_scan_attempted: new Date().toISOString(),
    }).eq('id', companyId);

    // Run modules sequentially to avoid overwhelming APIs
    const moduleStatuses: Record<string, any> = {};
    let completed = 0, failed = 0, withSignals = 0, noSignals = 0;
    let totalSources = 0, totalSignals = 0;
    const warnings: string[] = [];
    const errorLog: any[] = [];

    for (const mod of MODULES) {
      console.log(`[intelligence-scan] Running module: ${mod.key}`);

      // Update module status to in_progress
      moduleStatuses[mod.key] = { status: 'in_progress', label: mod.label };
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

        if (moduleResp.ok) {
          const result = await moduleResp.json();
          const signalsFound = result.signalsFound || 0;
          const sourcesScanned = result.sourcesScanned || 0;

          totalSources += sourcesScanned;
          totalSignals += signalsFound;

          if (signalsFound > 0) {
            withSignals++;
            moduleStatuses[mod.key] = {
              status: 'completed_with_signals',
              label: mod.label,
              signalsFound,
              sourcesScanned,
            };
          } else {
            noSignals++;
            moduleStatuses[mod.key] = {
              status: 'completed_no_signals',
              label: mod.label,
              sourcesScanned,
            };
          }
          completed++;
          console.log(`[intelligence-scan] ${mod.key}: ${signalsFound} signals from ${sourcesScanned} sources`);
        } else {
          const errText = await moduleResp.text().catch(() => 'Unknown error');
          failed++;
          moduleStatuses[mod.key] = {
            status: 'failed',
            label: mod.label,
            error: `HTTP ${moduleResp.status}`,
          };
          warnings.push(`${mod.label} failed (HTTP ${moduleResp.status})`);
          errorLog.push({ module: mod.key, status: moduleResp.status, error: errText.slice(0, 500) });
          console.error(`[intelligence-scan] ${mod.key} failed: HTTP ${moduleResp.status}`);
        }
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : 'Unknown error';
        moduleStatuses[mod.key] = { status: 'failed', label: mod.label, error: msg };
        warnings.push(`${mod.label} failed: ${msg}`);
        errorLog.push({ module: mod.key, error: msg });
        console.error(`[intelligence-scan] ${mod.key} exception:`, e);
      }

      // Update progress after each module
      await supabase.from('scan_runs').update({
        modules_completed: completed,
        modules_failed: failed,
        modules_with_signals: withSignals,
        modules_with_no_signals: noSignals,
        total_sources_scanned: totalSources,
        total_signals_found: totalSignals,
        module_statuses: { ...moduleStatuses },
        warnings,
        error_log: errorLog,
      }).eq('id', scanId);
    }

    // Finalize
    const overallStatus = failed === MODULES.length
      ? 'failed'
      : failed > 0
        ? 'completed_with_warnings'
        : 'completed';

    await supabase.from('scan_runs').update({
      scan_status: overallStatus,
      scan_completed_at: new Date().toISOString(),
    }).eq('id', scanId);

    // Update company scan_completion
    const scanCompletion: Record<string, boolean> = {};
    for (const mod of MODULES) {
      scanCompletion[mod.key] = moduleStatuses[mod.key]?.status?.startsWith('completed') || false;
    }
    await supabase.from('companies').update({
      scan_completion: scanCompletion,
      record_status: 'verified',
    }).eq('id', companyId);

    console.log(`[intelligence-scan] COMPLETE: ${companyName} - ${overallStatus} (${completed}/${MODULES.length} modules, ${totalSignals} signals)`);

    return new Response(JSON.stringify({
      success: true,
      scanRunId: scanId,
      scanStatus: overallStatus,
      modulesCompleted: completed,
      modulesFailed: failed,
      modulesWithSignals: withSignals,
      modulesWithNoSignals: noSignals,
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
