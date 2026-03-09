const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Phase 0.5: Third-party enrichment (discovery & cross-reference)
const ENRICHMENT_MODULES = [
  { key: 'opensecrets', label: 'OpenSecrets Organization Profiles', fn: 'sync-opensecrets', phase: 'enrichment' },
];

// Phase 1: Structured data connectors (federal APIs - high confidence)
const PIPELINE_MODULES = [
  { key: 'fec_campaign_finance', label: 'FEC Campaign Finance', fn: 'sync-openfec', phase: 'pipeline' },
  { key: 'federal_contracts', label: 'Federal Contracts (USASpending)', fn: 'sync-federal-contracts', phase: 'pipeline' },
  { key: 'lobbying_disclosure', label: 'Lobbying Disclosure (Senate LDA)', fn: 'sync-lobbying', phase: 'pipeline' },
  { key: 'sec_edgar', label: 'SEC EDGAR (Filings & Compensation)', fn: 'sync-sec-edgar', phase: 'pipeline' },
  { key: 'congress_cross_ref', label: 'Congress Cross-Reference', fn: 'sync-congress-votes', phase: 'pipeline' },
  { key: 'opencorporates', label: 'Corporate Structure (OpenCorporates)', fn: 'sync-opencorporates', phase: 'pipeline' },
  { key: 'workplace_enforcement', label: 'Workplace Enforcement (DOL)', fn: 'sync-workplace-enforcement', phase: 'pipeline' },
];

// Phase 2: Web-crawled research modules (AI-analyzed - moderate confidence)
const RESEARCH_MODULES = [
  { key: 'ai_hr_scan', label: 'Hiring Technology & AI Use', fn: 'ai-hr-scan', phase: 'research' },
  { key: 'worker_benefits', label: 'Worker Benefits & Protections', fn: 'worker-benefits-scan', phase: 'research' },
  { key: 'pay_equity', label: 'Pay Equity & Compensation Transparency', fn: 'pay-equity-scan', phase: 'research' },
  { key: 'worker_sentiment', label: 'Worker Sentiment', fn: 'worker-sentiment-scan', phase: 'research' },
  { key: 'ideology', label: 'Ideology & Controversy Signals', fn: 'ideology-scan', phase: 'research' },
  { key: 'social', label: 'Social & Media Monitoring', fn: 'social-scan', phase: 'research' },
  { key: 'agency_contracts', label: 'Government Contracts', fn: 'agency-scan', phase: 'research' },
  { key: 'ai_accountability', label: 'AI Accountability', fn: 'ai-accountability-scan', phase: 'research' },
];

const ALL_MODULES = [...ENRICHMENT_MODULES, ...PIPELINE_MODULES, ...RESEARCH_MODULES];

function resolveModuleStatus(sourcesScanned: number, signalsFound: number): string {
  if (sourcesScanned > 0 && signalsFound > 0) return 'completed_with_signals';
  if (sourcesScanned > 0 && signalsFound === 0) return 'completed_no_signals';
  return 'no_sources_found';
}

function isTrulyCompleted(status: string): boolean {
  return status === 'completed_with_signals' || status === 'completed_no_signals';
}

// For pipeline modules, interpret their response format (they return success/stats not sourcesScanned)
function interpretPipelineResult(result: any): { sourcesScanned: number; signalsFound: number } {
  // sync-openfec returns stats.committeesFound, stats.candidatesFunded, stats.linkagesCreated
  // sync-federal-contracts returns contractsFound, linkagesCreated
  // sync-lobbying returns filingsFound, linkagesCreated

  const sourcesScanned =
    (result.stats?.committeesFound || 0) +
    (result.contractsFound || 0) +
    (result.filingsFound || 0) +
    (result.sourcesScanned || 0) +
    (result.entitiesFound || 0) +
    (result.oshaRecords || 0) +
    (result.whdRecords || 0) +
    (result.stats ? 1 : 0); // At least 1 if stats exist

  const signalsFound =
    (result.stats?.candidatesFunded || 0) +
    (result.stats?.linkagesCreated || 0) +
    (result.linkagesCreated || 0) +
    (result.contractsInserted || 0) +
    (result.signalsFound || 0) +
    (result.officersFound || 0);

  return { sourcesScanned: Math.max(sourcesScanned, result.success ? 1 : 0), signalsFound };
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

    // ─── Phase 0: Entity Resolution ───
    console.log(`[intelligence-scan] ═══ Phase 0: Entity Resolution ═══`);
    let searchNames = [companyName];
    let entityMap: Record<string, string> = { [companyName]: 'direct_company' };
    let resolutionLog: any = { canonical_name: companyName, total_search_names: 1 };

    try {
      const resolveResp = await fetch(`${supabaseUrl}/functions/v1/resolve-entity`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, companyName }),
      });

      if (resolveResp.ok) {
        const resolveResult = await resolveResp.json();
        searchNames = resolveResult.searchNames || [companyName];
        entityMap = resolveResult.entityMap || entityMap;
        resolutionLog = resolveResult.resolutionLog || resolutionLog;
        console.log(`[intelligence-scan] Resolved ${searchNames.length} search names`);
      } else {
        console.warn(`[intelligence-scan] Entity resolution failed (HTTP ${resolveResp.status}), using company name only`);
      }
    } catch (resolveErr) {
      console.warn('[intelligence-scan] Entity resolution error (non-critical):', resolveErr);
    }

    // Check for existing in-progress scan (auto-expire stale scans older than 10 minutes)
    const { data: existingScan } = await supabase
      .from('scan_runs')
      .select('id, scan_status, created_at')
      .eq('company_id', companyId)
      .in('scan_status', ['queued', 'in_progress'])
      .maybeSingle();

    if (existingScan) {
      const scanAge = Date.now() - new Date(existingScan.created_at).getTime();
      const TEN_MINUTES = 10 * 60 * 1000;

      if (scanAge > TEN_MINUTES) {
        // Auto-expire stale scan
        console.warn(`[intelligence-scan] Auto-expiring stale scan ${existingScan.id} (age: ${Math.round(scanAge / 1000)}s)`);
        await supabase
          .from('scan_runs')
          .update({ scan_status: 'failed', error_log: { reason: 'Auto-expired: scan exceeded 10-minute timeout', expired_at: new Date().toISOString() } })
          .eq('id', existingScan.id);
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'A scan is already in progress for this company',
          scanRunId: existingScan.id,
        }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Create scan run record
    const { data: scanRun, error: insertErr } = await supabase
      .from('scan_runs')
      .insert({
        company_id: companyId,
        scan_status: 'in_progress',
        triggered_by: 'user',
        total_modules_run: ALL_MODULES.length,
        module_statuses: Object.fromEntries(ALL_MODULES.map(m => [m.key, { status: 'queued', label: m.label, phase: m.phase }])),
        entity_resolution_log: resolutionLog,
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

    // Run all modules sequentially
    const moduleStatuses: Record<string, any> = {};
    let trulyCompleted = 0, failed = 0, noSourcesFound = 0, withSignals = 0;
    let totalSources = 0, totalSignals = 0;
    const warnings: string[] = [];
    const errorLog: any[] = [];

    // ─── Phase 0.5: Third-party Enrichment (OpenSecrets) ───
    console.log(`[intelligence-scan] ═══ Phase 0.5: Third-party Enrichment ═══`);

    for (const mod of ENRICHMENT_MODULES) {
      console.log(`[intelligence-scan] Running enrichment module: ${mod.key}`);
      const moduleStartedAt = new Date().toISOString();

      moduleStatuses[mod.key] = { status: 'in_progress', label: mod.label, phase: mod.phase, startedAt: moduleStartedAt };
      await supabase.from('scan_runs').update({ module_statuses: { ...moduleStatuses } }).eq('id', scanId);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90_000);

        const moduleResp = await fetch(`${supabaseUrl}/functions/v1/${mod.fn}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId, companyName, searchNames, entityMap }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const moduleCompletedAt = new Date().toISOString();

        if (moduleResp.ok) {
          const result = await moduleResp.json();
          const sScanned = result.sourcesScanned || 0;
          const sFound = result.signalsFound || 0;
          totalSources += sScanned;
          totalSignals += sFound;
          const resolvedStatus = resolveModuleStatus(sScanned, sFound);

          moduleStatuses[mod.key] = {
            status: resolvedStatus, label: mod.label, phase: mod.phase,
            signalsFound: sFound, sourcesScanned: sScanned,
            startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
            profileFound: result.profileFound || false,
            profileUrl: result.profileUrl || null,
          };

          if (isTrulyCompleted(resolvedStatus)) {
            trulyCompleted++;
            if (resolvedStatus === 'completed_with_signals') withSignals++;
          } else {
            noSourcesFound++;
          }

          console.log(`[intelligence-scan] ${mod.key}: ${resolvedStatus}, ${sFound} signals from ${sScanned} sources`);
        } else {
          const errText = await moduleResp.text().catch(() => 'Unknown error');
          failed++;
          moduleStatuses[mod.key] = {
            status: 'failed', label: mod.label, phase: mod.phase,
            error: errText.slice(0, 200), startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
            sourcesScanned: 0, signalsFound: 0,
          };
          warnings.push(`${mod.label}: HTTP ${moduleResp.status}`);
          errorLog.push({ module: mod.key, status: moduleResp.status, error: errText.slice(0, 500), timestamp: moduleCompletedAt });
        }
      } catch (e) {
        const moduleCompletedAt = new Date().toISOString();
        failed++;
        const msg = e instanceof Error ? e.message : 'Unknown error';
        moduleStatuses[mod.key] = {
          status: 'failed', label: mod.label, phase: mod.phase,
          error: msg, startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
          sourcesScanned: 0, signalsFound: 0,
        };
        warnings.push(`${mod.label} failed: ${msg}`);
        errorLog.push({ module: mod.key, error: msg, timestamp: moduleCompletedAt });
      }

      await supabase.from('scan_runs').update({
        modules_completed: trulyCompleted, modules_failed: failed,
        modules_with_signals: withSignals, modules_with_no_signals: noSourcesFound,
        total_sources_scanned: totalSources, total_signals_found: totalSignals,
        module_statuses: { ...moduleStatuses }, warnings, error_log: errorLog,
      }).eq('id', scanId);
    }

    // ─── Phase 1: Pipeline connectors (structured federal data) ───
    console.log(`[intelligence-scan] ═══ Phase 1: Structured Data Connectors ═══`);

    for (const mod of PIPELINE_MODULES) {
      console.log(`[intelligence-scan] Running pipeline module: ${mod.key}`);
      const moduleStartedAt = new Date().toISOString();

      moduleStatuses[mod.key] = { status: 'in_progress', label: mod.label, phase: mod.phase, startedAt: moduleStartedAt };
      await supabase.from('scan_runs').update({ module_statuses: { ...moduleStatuses } }).eq('id', scanId);

      try {
        // Add per-module timeout (90 seconds) to prevent stuck scans
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90_000);

        const moduleResp = await fetch(`${supabaseUrl}/functions/v1/${mod.fn}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId, companyName, searchNames, entityMap }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const moduleCompletedAt = new Date().toISOString();

        if (moduleResp.ok) {
          const result = await moduleResp.json();
          const { sourcesScanned, signalsFound } = interpretPipelineResult(result);

          totalSources += sourcesScanned;
          totalSignals += signalsFound;

          const resolvedStatus = resolveModuleStatus(sourcesScanned, signalsFound);

          moduleStatuses[mod.key] = {
            status: resolvedStatus, label: mod.label, phase: mod.phase,
            signalsFound, sourcesScanned,
            startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
            pipelineResult: {
              totalSpend: result.stats?.totalPacSpending || result.totalContractValue || result.totalLobbyingSpend || 0,
              linkagesCreated: result.stats?.linkagesCreated || result.linkagesCreated || 0,
            },
          };

          if (isTrulyCompleted(resolvedStatus)) {
            trulyCompleted++;
            if (resolvedStatus === 'completed_with_signals') withSignals++;
          } else {
            noSourcesFound++;
            warnings.push(`${mod.label}: No records found in federal databases.`);
          }

          console.log(`[intelligence-scan] ${mod.key}: ${resolvedStatus}, ${signalsFound} signals from ${sourcesScanned} sources`);
        } else {
          const errText = await moduleResp.text().catch(() => 'Unknown error');
          failed++;
          
          // Parse upstream error details if available
          let parsedErr: any = {};
          try { parsedErr = JSON.parse(errText); } catch { /* raw text */ }
          
          const upstreamErrorType = parsedErr.errorType || null;
          const upstreamStatus = parsedErr.upstreamStatus || null;
          const upstreamBody = parsedErr.upstreamBody || null;
          
          // Determine error type with granularity
          const errorType = upstreamErrorType === 'failed_validation' ? 'failed_validation'
            : upstreamErrorType === 'upstream_api_error' ? 'upstream_api_error'
            : moduleResp.status === 402 ? 'quota_exceeded'
            : moduleResp.status === 429 ? 'rate_limited'
            : moduleResp.status === 422 ? 'failed_validation'
            : moduleResp.status >= 500 ? 'server_error'
            : 'http_error';

          const errorMessage = parsedErr.error || `HTTP ${moduleResp.status}`;

          moduleStatuses[mod.key] = {
            status: 'failed', label: mod.label, phase: mod.phase,
            error: errorMessage, errorType,
            upstreamStatus: upstreamStatus || moduleResp.status,
            upstreamBody: upstreamBody || errText.slice(0, 300),
            startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
            sourcesScanned: 0, signalsFound: 0,
          };
          warnings.push(`${mod.label}: ${errorMessage}`);
          errorLog.push({ module: mod.key, status: moduleResp.status, errorType, error: errorMessage, upstreamStatus, upstreamBody: (upstreamBody || errText).slice(0, 500), timestamp: moduleCompletedAt });
          console.error(`[intelligence-scan] ${mod.key} failed: HTTP ${moduleResp.status}`);
        }
      } catch (e) {
        const moduleCompletedAt = new Date().toISOString();
        failed++;
        const msg = e instanceof Error ? e.message : 'Unknown error';
        moduleStatuses[mod.key] = {
          status: 'failed', label: mod.label, phase: mod.phase,
          error: msg, errorType: 'exception',
          startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
          sourcesScanned: 0, signalsFound: 0,
        };
        warnings.push(`${mod.label} failed: ${msg}`);
        errorLog.push({ module: mod.key, errorType: 'exception', error: msg, timestamp: moduleCompletedAt });
        console.error(`[intelligence-scan] ${mod.key} exception:`, e);
      }

      // Update progress
      await supabase.from('scan_runs').update({
        modules_completed: trulyCompleted, modules_failed: failed,
        modules_with_signals: withSignals, modules_with_no_signals: noSourcesFound,
        total_sources_scanned: totalSources, total_signals_found: totalSignals,
        module_statuses: { ...moduleStatuses }, warnings, error_log: errorLog,
      }).eq('id', scanId);
    }

    // ─── Phase 2: Web research modules ───
    console.log(`[intelligence-scan] ═══ Phase 2: Web Research Modules ═══`);

    for (const mod of RESEARCH_MODULES) {
      console.log(`[intelligence-scan] Running research module: ${mod.key}`);
      const moduleStartedAt = new Date().toISOString();

      moduleStatuses[mod.key] = { status: 'in_progress', label: mod.label, phase: mod.phase, startedAt: moduleStartedAt };
      await supabase.from('scan_runs').update({ module_statuses: { ...moduleStatuses } }).eq('id', scanId);

      try {
        // Add per-module timeout (90 seconds) to prevent stuck scans
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90_000);

        const moduleResp = await fetch(`${supabaseUrl}/functions/v1/${mod.fn}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId, companyName, searchNames, entityMap }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const moduleCompletedAt = new Date().toISOString();

        if (moduleResp.ok) {
          const result = await moduleResp.json();
          const signalsFound = result.signalsFound || result.data?.flagCount || 0;
          const sourcesScanned = result.sourcesScanned || result.data?.resultCount || 0;

          totalSources += sourcesScanned;
          totalSignals += signalsFound;

          const resolvedStatus = resolveModuleStatus(sourcesScanned, signalsFound);

          moduleStatuses[mod.key] = {
            status: resolvedStatus, label: mod.label, phase: mod.phase,
            signalsFound, sourcesScanned,
            startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
          };

          if (isTrulyCompleted(resolvedStatus)) {
            trulyCompleted++;
            if (resolvedStatus === 'completed_with_signals') withSignals++;
          } else {
            noSourcesFound++;
            warnings.push(`${mod.label}: No usable sources were discovered or scanned.`);
          }

          console.log(`[intelligence-scan] ${mod.key}: ${resolvedStatus}, ${signalsFound} signals from ${sourcesScanned} sources`);
        } else {
          const errText = await moduleResp.text().catch(() => 'Unknown error');
          failed++;
          
          let parsedErr: any = {};
          try { parsedErr = JSON.parse(errText); } catch { /* raw text */ }
          
          const upstreamErrorType = parsedErr.errorType || null;
          const upstreamStatus = parsedErr.upstreamStatus || null;
          const upstreamBody = parsedErr.upstreamBody || null;
          
          const errorType = upstreamErrorType === 'failed_validation' ? 'failed_validation'
            : upstreamErrorType === 'upstream_api_error' ? 'upstream_api_error'
            : moduleResp.status === 402 ? 'quota_exceeded'
            : moduleResp.status === 429 ? 'rate_limited'
            : moduleResp.status === 422 ? 'failed_validation'
            : moduleResp.status >= 500 ? 'server_error'
            : 'http_error';

          const errorMessage = parsedErr.error || `HTTP ${moduleResp.status}`;

          moduleStatuses[mod.key] = {
            status: 'failed', label: mod.label, phase: mod.phase,
            error: errorMessage, errorType,
            upstreamStatus: upstreamStatus || moduleResp.status,
            upstreamBody: upstreamBody || errText.slice(0, 300),
            startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
            sourcesScanned: 0, signalsFound: 0,
          };
          warnings.push(`${mod.label}: ${errorMessage}`);
          errorLog.push({ module: mod.key, status: moduleResp.status, errorType, error: errorMessage, upstreamStatus, upstreamBody: (upstreamBody || errText).slice(0, 500), timestamp: moduleCompletedAt });
          console.error(`[intelligence-scan] ${mod.key} failed: HTTP ${moduleResp.status}`);
        }
      } catch (e) {
        const moduleCompletedAt = new Date().toISOString();
        failed++;
        const msg = e instanceof Error ? e.message : 'Unknown error';
        moduleStatuses[mod.key] = {
          status: 'failed', label: mod.label, phase: mod.phase,
          error: msg, errorType: 'exception',
          startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
          sourcesScanned: 0, signalsFound: 0,
        };
        warnings.push(`${mod.label} failed: ${msg}`);
        errorLog.push({ module: mod.key, errorType: 'exception', error: msg, timestamp: moduleCompletedAt });
        console.error(`[intelligence-scan] ${mod.key} exception:`, e);
      }

      await supabase.from('scan_runs').update({
        modules_completed: trulyCompleted, modules_failed: failed,
        modules_with_signals: withSignals, modules_with_no_signals: noSourcesFound,
        total_sources_scanned: totalSources, total_signals_found: totalSignals,
        module_statuses: { ...moduleStatuses }, warnings, error_log: errorLog,
      }).eq('id', scanId);
    }

    // ─── Phase 3: Calculate influence ROI from pipeline data ───
    console.log(`[intelligence-scan] ═══ Phase 3: Calculating Influence ROI ═══`);

    try {
      // Sum Money In (donations + lobbying)
      const { data: moneyInData } = await supabase
        .from('entity_linkages')
        .select('amount')
        .eq('company_id', companyId)
        .in('link_type', ['donation_to_member', 'trade_association_lobbying', 'dark_money_channel']);

      const totalPoliticalSpending = (moneyInData || []).reduce((sum, r) => sum + (r.amount || 0), 0);

      // Sum Benefits Out (contracts + grants)
      const { data: benefitsData } = await supabase
        .from('entity_linkages')
        .select('amount')
        .eq('company_id', companyId)
        .in('link_type', ['committee_oversight_of_contract', 'foundation_grant_to_district', 'state_lobbying_contract']);

      const totalGovernmentBenefits = (benefitsData || []).reduce((sum, r) => sum + (r.amount || 0), 0);

      // Calculate ROI
      const roiRatio = totalPoliticalSpending > 0 ? totalGovernmentBenefits / totalPoliticalSpending : null;
      const roiGrade = roiRatio === null ? 'Insufficient Data'
        : roiRatio >= 10 ? 'A+'
        : roiRatio >= 5 ? 'A'
        : roiRatio >= 2 ? 'B'
        : roiRatio >= 1 ? 'C'
        : 'D';

      // Upsert influence ROI record
      await supabase.from('company_influence_roi').upsert({
        company_id: companyId,
        total_political_spending: totalPoliticalSpending,
        total_government_benefits: totalGovernmentBenefits,
        roi_ratio: roiRatio || 0,
        roi_grade: roiGrade,
        last_calculated: new Date().toISOString(),
      }, { onConflict: 'company_id' });

      console.log(`[intelligence-scan] ROI: $${totalPoliticalSpending.toLocaleString()} in → $${totalGovernmentBenefits.toLocaleString()} out (${roiRatio?.toFixed(1) || 'N/A'}x)`);
    } catch (roiErr) {
      console.error('[intelligence-scan] ROI calculation error:', roiErr);
      warnings.push('ROI calculation failed');
    }

    // ─── Phase 4: Set up Browse AI page monitors ───
    console.log(`[intelligence-scan] ═══ Phase 4: Browse AI Monitoring Setup ═══`);

    try {
      // Get company details for monitoring
      const { data: companyData } = await supabase
        .from('companies')
        .select('careers_url')
        .eq('id', companyId)
        .single();

      const monitorResp = await fetch(`${supabaseUrl}/functions/v1/browse-ai-setup-monitors`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          companyName,
          careersUrl: companyData?.careers_url || null,
        }),
      });

      if (monitorResp.ok) {
        const monitorResult = await monitorResp.json();
        console.log(`[intelligence-scan] Browse AI: ${monitorResult.monitorsCreated} monitors created`);
      } else {
        console.warn(`[intelligence-scan] Browse AI setup failed: HTTP ${monitorResp.status}`);
        warnings.push('Browse AI monitoring setup failed (non-critical)');
      }
    } catch (monitorErr) {
      console.warn('[intelligence-scan] Browse AI setup error (non-critical):', monitorErr);
      warnings.push('Browse AI monitoring setup error (non-critical)');
    }

    // ─── Emit signal change events for watchers ───
    if (totalSignals > 0) {
      const signalCategories = Object.entries(moduleStatuses)
        .filter(([_, v]: [string, any]) => v.status === 'completed_with_signals' && v.signalsFound > 0)
        .map(([key, v]: [string, any]) => ({
          company_id: companyId,
          signal_category: v.label || key,
          change_type: 'new_signal',
          change_description: `${v.signalsFound} signal(s) detected in ${v.label || key}.`,
          confidence_level: v.phase === 'pipeline' ? 'direct_source' : 'moderate_inference',
        }));

      if (signalCategories.length > 0) {
        const { error: sceErr } = await supabase.from('signal_change_events').insert(signalCategories);
        if (sceErr) console.error('[intelligence-scan] Failed to emit signal change events:', sceErr);
        else console.log(`[intelligence-scan] Emitted ${signalCategories.length} signal change events`);
      }
    }

    // Finalize overall status
    const overallStatus = failed === ALL_MODULES.length
      ? 'failed'
      : (failed > 0 || noSourcesFound > 0)
        ? 'completed_with_warnings'
        : 'completed';

    await supabase.from('scan_runs').update({
      scan_status: overallStatus,
      scan_completed_at: new Date().toISOString(),
    }).eq('id', scanId);

    // Update company scan_completion
    const scanCompletion: Record<string, boolean> = {};
    for (const mod of ALL_MODULES) {
      scanCompletion[mod.key] = isTrulyCompleted(moduleStatuses[mod.key]?.status);
    }
    await supabase.from('companies').update({
      scan_completion: scanCompletion,
      record_status: 'verified',
    }).eq('id', companyId);

    // Auto-fetch company logo if not already set
    try {
      const { data: companyCheck } = await supabase.from('companies').select('logo_url, careers_url').eq('id', companyId).maybeSingle();
      if (!companyCheck?.logo_url) {
        const guessedUrl = companyCheck?.careers_url
          ? companyCheck.careers_url.replace(/\/careers.*$/i, '')
          : `https://www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
        console.log(`[intelligence-scan] Fetching logo for ${companyName} from ${guessedUrl}`);
        await supabase.functions.invoke('fetch-company-branding', {
          body: { companyId, websiteUrl: guessedUrl },
        });
      }
      // Also fetch executive headshots
      console.log(`[intelligence-scan] Fetching executive photos for ${companyName}`);
      await supabase.functions.invoke('fetch-executive-photos', {
        body: { companyId, websiteUrl: companyCheck?.careers_url ? companyCheck.careers_url.replace(/\/careers.*$/i, '') : undefined, companyName },
      });
    } catch (logoErr) {
      console.warn('[intelligence-scan] Logo/photo fetch failed (non-critical):', logoErr);
    }

    console.log(`[intelligence-scan] COMPLETE: ${companyName} - ${overallStatus} (${trulyCompleted}/${ALL_MODULES.length} completed, ${totalSignals} signals)`);

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
      entityResolution: resolutionLog,
      searchNamesUsed: searchNames.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[intelligence-scan] Unhandled error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
