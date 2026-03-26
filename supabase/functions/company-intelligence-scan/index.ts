const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Phase 1: Primary data connectors (federal APIs - highest confidence)
// These are the authoritative sources: FEC, Senate LDA, USASpending, Congress.gov
const PRIMARY_PIPELINE_MODULES = [
  { key: 'fec_campaign_finance', label: 'FEC Campaign Finance', fn: 'sync-openfec', phase: 'pipeline' },
  { key: 'federal_contracts', label: 'Federal Contracts (USASpending)', fn: 'sync-federal-contracts', phase: 'pipeline' },
  { key: 'lobbying_disclosure', label: 'Lobbying Disclosure (Senate LDA)', fn: 'sync-lobbying', phase: 'pipeline' },
  { key: 'sec_edgar', label: 'SEC EDGAR (Filings & Compensation)', fn: 'sync-sec-edgar', phase: 'pipeline' },
  { key: 'opencorporates', label: 'Corporate Structure (OpenCorporates)', fn: 'sync-opencorporates', phase: 'pipeline' },
  { key: 'workplace_enforcement', label: 'Workplace Enforcement (DOL)', fn: 'sync-workplace-enforcement', phase: 'pipeline' },
];

// Phase 1b: Congress cross-reference (depends on FEC data being present first)
const CONGRESS_MODULE = { key: 'congress_cross_ref', label: 'Congress Cross-Reference', fn: 'sync-congress-votes', phase: 'pipeline' };

// Phase 1 parallel enrichment: OpenSecrets runs alongside primary sources as discovery/validation
// NOT a prerequisite — just supplementary cross-reference data
const ENRICHMENT_MODULES = [
  { key: 'opensecrets', label: 'OpenSecrets (Discovery Only)', fn: 'sync-opensecrets', phase: 'enrichment' },
];

const PIPELINE_MODULES = [...PRIMARY_PIPELINE_MODULES, CONGRESS_MODULE];

// Phase 2: Web-crawled research modules (AI-analyzed - moderate confidence)
const RESEARCH_MODULES = [
  { key: 'ai_hr_scan', label: 'Hiring Technology & AI Use', fn: 'ai-hr-scan', phase: 'research' },
  { key: 'worker_benefits', label: 'Worker Benefits & Protections', fn: 'worker-benefits-scan', phase: 'research' },
  { key: 'pay_equity', label: 'Pay Equity & Compensation Transparency', fn: 'pay-equity-scan', phase: 'research' },
  { key: 'worker_sentiment', label: 'Worker Sentiment', fn: 'worker-sentiment-scan', phase: 'research' },
  { key: 'warn_notices', label: 'WARN Act & Layoff Tracker', fn: 'warn-scan', phase: 'research', paramStyle: 'snake' },
  { key: 'warn_national', label: 'National WARN Dataset Sync', fn: 'warn-national-sync', phase: 'research', paramStyle: 'snake' },
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

// ─── Configurable daily scan limits ───
// TODO: Connect these to Stripe subscription tiers so only free users are rate-limited.
// When Stripe integration is ready, replace `isPaidUser` logic below with actual plan lookup.
const DAILY_FREE_SCAN_LIMIT = 2;
const DAILY_PAID_SCAN_LIMIT = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { companyId, companyName } = body;
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Per-user daily scan cap ───
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let isPaidUser = false;

    if (authHeader) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
      const anonClient = createClient(supabaseUrl, anonKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await anonClient.auth.getUser(token);
      userId = userData?.user?.id || null;

      if (userId) {
        // Check if user has owner/admin role (bypass scan limits)
        let isPrivilegedUser = false;
        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .in('role', ['owner', 'admin', 'internal_test']);
          isPrivilegedUser = (roleData && roleData.length > 0);
        } catch (e) {
          console.warn('[intelligence-scan] Role check failed (non-critical):', e);
        }

        if (!isPrivilegedUser) {
          // Check Stripe subscription status
          try {
            const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
            if (stripeKey && userData?.user?.email) {
              const { default: Stripe } = await import('https://esm.sh/stripe@14.21.0?target=deno');
              const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
              const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
              if (customers.data.length > 0) {
                const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: 'active', limit: 1 });
                isPaidUser = subs.data.length > 0;
              }
            }
          } catch (e) {
            console.warn('[intelligence-scan] Subscription check failed (non-critical):', e);
          }

          // Check daily scan count
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const { count } = await supabase
            .from('scan_runs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', todayStart.toISOString())
            .eq('triggered_by', 'user');

          const maxScans = isPaidUser ? DAILY_PAID_SCAN_LIMIT : DAILY_FREE_SCAN_LIMIT;
          if ((count || 0) >= maxScans) {
            return new Response(JSON.stringify({
              success: false,
              error: `Daily scan limit reached (${maxScans} per day). ${isPaidUser ? 'Try again tomorrow.' : 'Upgrade to a paid plan for more scans.'}`,
              code: 'DAILY_SCAN_LIMIT_REACHED',
              upgradeRequired: !isPaidUser,
            }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        } else {
          // Privileged users bypass free-tier limits and paid-module gating during build/demo
          isPaidUser = true;
          console.log(`[intelligence-scan] Privileged user ${userId} — scan limits and tier gates bypassed`);
        }
      }
    }

    console.log(`[intelligence-scan] START: ${companyName} (${companyId})`);

    // Check for existing in-progress scan FIRST (before entity resolution to prevent race conditions)
    const forceRescan = body?.forceRescan === true;
    const { data: existingScan } = await supabase
      .from('scan_runs')
      .select('id, scan_status, created_at')
      .eq('company_id', companyId)
      .in('scan_status', ['queued', 'in_progress'])
      .maybeSingle();

    if (existingScan) {
      const scanAge = Date.now() - new Date(existingScan.created_at).getTime();
      const FIVE_MINUTES = 5 * 60 * 1000;

      if (forceRescan || scanAge > FIVE_MINUTES) {
        const reason = forceRescan ? 'Force re-scan requested by user' : `Auto-expired: scan exceeded 5-minute timeout`;
        console.warn(`[intelligence-scan] Expiring scan ${existingScan.id}: ${reason} (age: ${Math.round(scanAge / 1000)}s)`);
        await supabase
          .from('scan_runs')
          .update({ scan_status: 'failed', error_log: { reason, expired_at: new Date().toISOString() } })
          .eq('id', existingScan.id);
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'A scan is already in progress for this company',
          scanRunId: existingScan.id,
        }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ─── Phase 0: Entity Resolution (after concurrency check) ───
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

    // Run modules in parallel batches for speed
    const moduleStatuses: Record<string, any> = {};
    let trulyCompleted = 0, failed = 0, noSourcesFound = 0, withSignals = 0;
    let totalSources = 0, totalSignals = 0;
    const warnings: string[] = [];
    const errorLog: any[] = [];
    const retryQueue: { mod: typeof ALL_MODULES[0]; isPipeline: boolean }[] = [];

    // Circuit breaker: stop processing if too many consecutive modules fail
    let consecutiveFailures = 0;
    const CIRCUIT_BREAKER_THRESHOLD = 3;
    let circuitBreakerTripped = false;

    // Helper: run a single module and return its result
    async function runModule(mod: typeof ALL_MODULES[0], isPipeline: boolean, isRetry = false) {
      const moduleStartedAt = new Date().toISOString();
      moduleStatuses[mod.key] = { status: isRetry ? 'retrying' : 'in_progress', label: mod.label, phase: mod.phase, startedAt: moduleStartedAt };

      try {
        const controller = new AbortController();
        // 55s timeout for first attempt, 45s for retries
        const timeoutMs = isRetry ? 45_000 : 55_000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        // Some modules use snake_case params (e.g. warn-scan)
        const bodyPayload = (mod as any).paramStyle === 'snake'
          ? { company_id: companyId, company_name: companyName, searchNames, entityMap }
          : { companyId, companyName, searchNames, entityMap };

        const moduleResp = await fetch(`${supabaseUrl}/functions/v1/${mod.fn}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const moduleCompletedAt = new Date().toISOString();

        if (moduleResp.ok) {
          const result = await moduleResp.json();
          let sourcesScanned: number, signalsFound: number;

          if (isPipeline) {
            const interpreted = interpretPipelineResult(result);
            sourcesScanned = interpreted.sourcesScanned;
            signalsFound = interpreted.signalsFound;
          } else {
            signalsFound = result.signalsFound || result.data?.flagCount || 0;
            sourcesScanned = result.sourcesScanned || result.data?.resultCount || 0;
          }

          totalSources += sourcesScanned;
          totalSignals += signalsFound;
          const resolvedStatus = resolveModuleStatus(sourcesScanned, signalsFound);

          moduleStatuses[mod.key] = {
            status: resolvedStatus, label: mod.label, phase: mod.phase,
            signalsFound, sourcesScanned,
            startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
            ...(isPipeline ? {
              pipelineResult: {
                totalSpend: result.stats?.totalPacSpending || result.totalContractValue || result.totalLobbyingSpend || 0,
                linkagesCreated: result.stats?.linkagesCreated || result.linkagesCreated || 0,
              },
            } : {}),
            ...(mod.phase === 'enrichment' ? {
              profileFound: result.profileFound || false,
              profileUrl: result.profileUrl || null,
            } : {}),
          };

          if (isTrulyCompleted(resolvedStatus)) {
            trulyCompleted++;
            consecutiveFailures = 0; // Reset circuit breaker on success
            if (resolvedStatus === 'completed_with_signals') withSignals++;
          } else {
            noSourcesFound++;
            if (isPipeline) warnings.push(`${mod.label}: No records found in federal databases.`);
            else if (mod.phase === 'research') warnings.push(`${mod.label}: No usable sources were discovered or scanned.`);
          }

          console.log(`[intelligence-scan] ${mod.key}: ${resolvedStatus}, ${signalsFound} signals from ${sourcesScanned} sources`);
        } else {
          const errText = await moduleResp.text().catch(() => 'Unknown error');
          failed++;
          consecutiveFailures++;

          let parsedErr: any = {};
          try { parsedErr = JSON.parse(errText); } catch { /* raw text */ }

          const upstreamErrorType = parsedErr.errorType || null;
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
            upstreamStatus: parsedErr.upstreamStatus || moduleResp.status,
            upstreamBody: (parsedErr.upstreamBody || errText).slice(0, 300),
            startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
            sourcesScanned: 0, signalsFound: 0,
          };
          warnings.push(`${mod.label}: ${errorMessage}`);
          errorLog.push({ module: mod.key, status: moduleResp.status, errorType, error: errorMessage, timestamp: moduleCompletedAt });
          console.error(`[intelligence-scan] ${mod.key} failed: HTTP ${moduleResp.status}`);
        }
      } catch (e) {
        const moduleCompletedAt = new Date().toISOString();
        const msg = e instanceof Error ? e.message : 'Unknown error';
        const isTimeout = msg.includes('abort') || msg.includes('timeout') || msg.includes('signal');

        // Queue for retry if it was a timeout on first attempt
        if (isTimeout && !isRetry) {
          retryQueue.push({ mod, isPipeline });
          moduleStatuses[mod.key] = {
            status: 'queued_retry', label: mod.label, phase: mod.phase,
            error: 'Timed out, will retry', errorType: 'timeout',
            startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
            sourcesScanned: 0, signalsFound: 0,
          };
          console.warn(`[intelligence-scan] ${mod.key} timed out, queued for retry`);
          return; // Don't count as failed yet
        }

        failed++;
        consecutiveFailures++;
        moduleStatuses[mod.key] = {
          status: 'failed', label: mod.label, phase: mod.phase,
          error: msg, errorType: isTimeout ? 'timeout' : 'exception',
          startedAt: moduleStartedAt, completedAt: moduleCompletedAt,
          sourcesScanned: 0, signalsFound: 0,
          retried: isRetry,
        };
        warnings.push(`${mod.label} failed: ${msg}`);
        errorLog.push({ module: mod.key, errorType: isTimeout ? 'timeout' : 'exception', error: msg, timestamp: moduleCompletedAt, retried: isRetry });
        console.error(`[intelligence-scan] ${mod.key} ${isRetry ? '(retry) ' : ''}exception:`, e);
      }
    }

    // Helper: update scan progress in DB
    async function updateProgress() {
      await supabase.from('scan_runs').update({
        modules_completed: trulyCompleted, modules_failed: failed,
        modules_with_signals: withSignals, modules_with_no_signals: noSourcesFound,
        total_sources_scanned: totalSources, total_signals_found: totalSignals,
        module_statuses: { ...moduleStatuses }, warnings, error_log: errorLog,
      }).eq('id', scanId);
    }

    // Helper: run module and immediately persist progress (with circuit breaker)
    async function runAndSave(mod: typeof ALL_MODULES[0], isPipeline: boolean) {
      if (circuitBreakerTripped) {
        moduleStatuses[mod.key] = { status: 'skipped', label: mod.label, phase: mod.phase, reason: 'Circuit breaker tripped — too many consecutive failures' };
        console.warn(`[intelligence-scan] SKIPPING ${mod.key} — circuit breaker tripped after ${CIRCUIT_BREAKER_THRESHOLD} consecutive failures`);
        return;
      }
      moduleStatuses[mod.key] = { status: 'in_progress', label: mod.label, phase: mod.phase, startedAt: new Date().toISOString() };
      await runModule(mod, isPipeline);
      if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD && !circuitBreakerTripped) {
        circuitBreakerTripped = true;
        const msg = `Circuit breaker tripped: ${consecutiveFailures} consecutive module failures. Stopping remaining modules to prevent cascading failures.`;
        console.error(`[intelligence-scan] ${msg}`);
        warnings.push(msg);
      }
      await updateProgress();
    }

    // ─── Phase 1: Primary Pipeline + Enrichment (ALL IN PARALLEL) ───
    console.log(`[intelligence-scan] ═══ Phase 1: Primary Sources + Enrichment (parallel) ═══`);
    const phase1Modules = [...PRIMARY_PIPELINE_MODULES, ...ENRICHMENT_MODULES];
    await Promise.all(phase1Modules.map(mod => {
      const isPipeline = mod.phase === 'pipeline';
      console.log(`[intelligence-scan] Running ${mod.phase} module: ${mod.key}`);
      return runAndSave(mod, isPipeline);
    }));

    // ─── Phase 1b: Congress Cross-Reference (depends on FEC data) ───
    console.log(`[intelligence-scan] ═══ Phase 1b: Congress Cross-Reference (post-FEC) ═══`);
    await runAndSave(CONGRESS_MODULE, true);

    // ─── Phase 2: Web research modules — STAGGERED BATCHES ───
    // Free users: skip Firecrawl-heavy modules to save credits
    const FIRECRAWL_HEAVY_MODULES = ['worker_sentiment', 'social', 'ideology', 'ai_accountability', 'ai_hr_scan'];
    const researchModulesToRun = isPaidUser
      ? RESEARCH_MODULES
      : RESEARCH_MODULES.filter(m => !FIRECRAWL_HEAVY_MODULES.includes(m.key));

    if (researchModulesToRun.length < RESEARCH_MODULES.length) {
      const skipped = RESEARCH_MODULES.filter(m => FIRECRAWL_HEAVY_MODULES.includes(m.key));
      for (const mod of skipped) {
        moduleStatuses[mod.key] = { status: 'skipped', label: mod.label, phase: mod.phase, reason: 'Requires paid plan' };
      }
      console.log(`[intelligence-scan] Skipping ${skipped.length} Firecrawl modules (free user)`);
      await updateProgress();
    }

    console.log(`[intelligence-scan] ═══ Phase 2: Web Research Modules (staggered, ${researchModulesToRun.length} modules) ═══`);
    const BATCH_SIZE = 3; // Reduced from 4 to save credits
    for (let i = 0; i < researchModulesToRun.length; i += BATCH_SIZE) {
      const batch = researchModulesToRun.slice(i, i + BATCH_SIZE);
      console.log(`[intelligence-scan] Research batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.map(m => m.key).join(', ')}`);
      await Promise.all(batch.map(mod => {
        return runAndSave(mod, false);
      }));
    }

    // ─── Phase 2b: Retry timed-out modules sequentially ───
    if (retryQueue.length > 0) {
      console.log(`[intelligence-scan] ═══ Phase 2b: Retrying ${retryQueue.length} timed-out modules ═══`);
      for (const { mod, isPipeline } of retryQueue) {
        console.log(`[intelligence-scan] Retrying: ${mod.key}`);
        moduleStatuses[mod.key] = { status: 'retrying', label: mod.label, phase: mod.phase, startedAt: new Date().toISOString() };
        await runModule(mod, isPipeline, true);
        await updateProgress();
      }
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

    // ─── Phase 3.5: Map Issue Signals ───
    console.log(`[intelligence-scan] ═══ Phase 3.5: Mapping Issue Signals ═══`);

    try {
      const issueResp = await fetch(`${supabaseUrl}/functions/v1/map-issue-signals`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      if (issueResp.ok) {
        const issueResult = await issueResp.json();
        console.log(`[intelligence-scan] Issue signals mapped: ${issueResult.signalsFound} signals across ${Object.keys(issueResult.categoryCounts || {}).length} categories`);
      } else {
        console.warn(`[intelligence-scan] Issue signal mapping failed: HTTP ${issueResp.status}`);
        warnings.push('Issue signal mapping failed (non-critical)');
      }
    } catch (issueErr) {
      console.warn('[intelligence-scan] Issue signal mapping error (non-critical):', issueErr);
      warnings.push('Issue signal mapping error (non-critical)');
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

    // ─── Post-scan: Issue Signal Mapping ───
    try {
      console.log(`[intelligence-scan] Running issue signal mapping for ${companyName}`);
      await fetch(`${supabaseUrl}/functions/v1/map-issue-signals`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });
    } catch (issueErr) {
      console.warn('[intelligence-scan] Issue signal mapping failed (non-critical):', issueErr);
    }

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
      circuit_breaker_tripped: circuitBreakerTripped,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[intelligence-scan] Unhandled error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
