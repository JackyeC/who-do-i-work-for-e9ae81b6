/**
 * Generate Company Signals — The Signal Compiler
 * 
 * Reads existing data from multiple tables and writes standardized signals
 * back to company_signal_scans with the 6 canonical signal types.
 * 
 * Input: { companyId, companyName? }
 * Triggered after: job-scrape, osint-parallel-scan, bulk-refresh
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SignalOutput {
  company_id: string;
  signal_category: string;
  signal_type: string;
  signal_value: string;
  direction: string;
  summary: string;
  value_normalized: string;
  confidence_level: string;
  source_url: string | null;
  raw_excerpt: string | null;
  scan_timestamp: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { companyId } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'companyId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[generate-company-signals] START: ${companyId}`);
    const now = new Date().toISOString();

    // ── Parallel data fetch ──
    const [
      { data: company },
      { data: jobs },
      { data: warnNotices },
      { data: sentiment },
      { data: compensation },
      { data: patents },
      { data: newsSignals },
      { data: courtCases },
      { data: contracts },
    ] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).single(),
      supabase.from('company_jobs').select('id, title, salary_range, is_active, department, created_at, posting_date').eq('company_id', companyId),
      supabase.from('company_warn_notices').select('id, notice_date, num_affected').eq('company_id', companyId),
      supabase.from('company_worker_sentiment').select('id, sentiment, source, created_at').eq('company_id', companyId),
      supabase.from('compensation_data').select('id, source, confidence_level').eq('company', companyId),
      supabase.from('company_patents').select('id, filing_date, patent_category').eq('company_id', companyId),
      supabase.from('company_signal_scans').select('*').eq('company_id', companyId).eq('signal_category', 'news'),
      supabase.from('company_court_cases').select('id, case_type, status').eq('company_id', companyId),
      supabase.from('company_agency_contracts').select('id, contract_value, controversy_flag').eq('company_id', companyId),
    ]);

    if (!company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const signals: SignalOutput[] = [];

    // ═══════════════════════════════════════════
    // 1. COMPENSATION TRANSPARENCY
    // ═══════════════════════════════════════════
    const activeJobs = (jobs || []).filter(j => j.is_active);
    const jobsWithSalary = activeJobs.filter(j => j.salary_range);
    const salaryRate = activeJobs.length > 0 ? jobsWithSalary.length / activeJobs.length : 0;
    const hasCompData = (compensation || []).length > 0;

    let compValue: string;
    let compNorm: string;
    let compConfidence: string;
    let compSummary: string;

    if (salaryRate >= 0.7 || hasCompData) {
      compValue = `${Math.round(salaryRate * 100)}% of roles disclose salary`;
      compNorm = 'high';
      compConfidence = 'high';
      compSummary = hasCompData
        ? 'Salary data publicly available with third-party benchmarks.'
        : `${Math.round(salaryRate * 100)}% of open roles include salary ranges.`;
    } else if (salaryRate > 0.2) {
      compValue = `${Math.round(salaryRate * 100)}% salary disclosure`;
      compNorm = 'medium';
      compConfidence = 'medium';
      compSummary = 'Partial salary transparency — some roles disclose ranges.';
    } else if (activeJobs.length > 0) {
      compValue = 'minimal_disclosure';
      compNorm = 'low';
      compConfidence = 'high';
      compSummary = 'Most open roles do not include salary information.';
    } else {
      compValue = 'not_disclosed';
      compNorm = 'not_disclosed';
      compConfidence = 'low';
      compSummary = 'No compensation data available in public records.';
    }

    signals.push({
      company_id: companyId,
      signal_category: 'compensation_transparency',
      signal_type: 'salary_disclosure_rate',
      signal_value: compValue,
      direction: 'stable',
      summary: compSummary,
      value_normalized: compNorm,
      confidence_level: compConfidence,
      source_url: null,
      raw_excerpt: null,
      scan_timestamp: now,
    });

    // ═══════════════════════════════════════════
    // 2. HIRING ACTIVITY
    // ═══════════════════════════════════════════
    const totalActive = activeJobs.length;
    const recentJobs = activeJobs.filter(j => {
      const posted = new Date(j.posting_date || j.created_at);
      return (Date.now() - posted.getTime()) < 30 * 86400000;
    });

    let hiringValue: string;
    let hiringNorm: string;
    let hiringDir: string;
    let hiringSummary: string;
    let hiringConf: string;

    if (totalActive === 0) {
      hiringValue = 'no_active_postings';
      hiringNorm = 'low';
      hiringDir = 'unknown';
      hiringSummary = 'No active job postings detected.';
      hiringConf = 'medium';
    } else if (recentJobs.length > 10) {
      hiringValue = `${totalActive} active, ${recentJobs.length} posted last 30d`;
      hiringNorm = 'high';
      hiringDir = 'increase';
      hiringSummary = `Active hiring with ${recentJobs.length} new postings in the last 30 days.`;
      hiringConf = 'high';
    } else if (totalActive > 0) {
      hiringValue = `${totalActive} active roles`;
      hiringNorm = 'medium';
      hiringDir = 'stable';
      hiringSummary = `${totalActive} open role(s) detected. Hiring pace appears steady.`;
      hiringConf = 'medium';
    } else {
      hiringValue = 'limited_visibility';
      hiringNorm = 'low';
      hiringDir = 'unknown';
      hiringSummary = 'Limited hiring visibility from public sources.';
      hiringConf = 'low';
    }

    // Department concentration
    const depts = new Map<string, number>();
    activeJobs.forEach(j => {
      const d = j.department || 'Unknown';
      depts.set(d, (depts.get(d) || 0) + 1);
    });
    const topDept = [...depts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topDept && totalActive > 3) {
      const pct = Math.round((topDept[1] / totalActive) * 100);
      if (pct > 50) {
        hiringSummary += ` ${pct}% concentrated in ${topDept[0]}.`;
      }
    }

    signals.push({
      company_id: companyId,
      signal_category: 'hiring_activity',
      signal_type: 'job_posting_volume',
      signal_value: hiringValue,
      direction: hiringDir,
      summary: hiringSummary,
      value_normalized: hiringNorm,
      confidence_level: hiringConf,
      source_url: null,
      raw_excerpt: null,
      scan_timestamp: now,
    });

    // ═══════════════════════════════════════════
    // 3. WORKFORCE STABILITY
    // ═══════════════════════════════════════════
    const warnCount = (warnNotices || []).length;
    const recentWarns = (warnNotices || []).filter(w => {
      if (!w.notice_date) return false;
      return (Date.now() - new Date(w.notice_date).getTime()) < 365 * 86400000;
    });
    const negativeSentiment = (sentiment || []).filter(s => s.sentiment === 'negative').length;
    const positiveSentiment = (sentiment || []).filter(s => s.sentiment === 'positive').length;

    let stabilityNorm: string;
    let stabilityDir: string;
    let stabilitySummary: string;
    let stabilityConf: string;

    if (recentWarns.length > 0) {
      const totalAffected = recentWarns.reduce((sum, w) => sum + (w.num_affected || 0), 0);
      stabilityNorm = 'low';
      stabilityDir = 'decrease';
      stabilitySummary = `${recentWarns.length} WARN notice(s) filed in the past year` +
        (totalAffected > 0 ? `, affecting ${totalAffected.toLocaleString()} workers.` : '.');
      stabilityConf = 'high';
    } else if (negativeSentiment > positiveSentiment && negativeSentiment > 3) {
      stabilityNorm = 'medium';
      stabilityDir = 'decrease';
      stabilitySummary = 'Negative workforce sentiment outweighs positive signals.';
      stabilityConf = 'medium';
    } else if (warnCount === 0 && negativeSentiment === 0) {
      stabilityNorm = 'high';
      stabilityDir = 'stable';
      stabilitySummary = 'No WARN notices or layoff signals detected in public records.';
      stabilityConf = 'medium';
    } else {
      stabilityNorm = 'medium';
      stabilityDir = 'stable';
      stabilitySummary = 'No recent instability signals, but limited data available.';
      stabilityConf = 'low';
    }

    signals.push({
      company_id: companyId,
      signal_category: 'workforce_stability',
      signal_type: 'layoff_risk',
      signal_value: recentWarns.length > 0 ? `${recentWarns.length} WARN notices` : 'none_detected',
      direction: stabilityDir,
      summary: stabilitySummary,
      value_normalized: stabilityNorm,
      confidence_level: stabilityConf,
      source_url: null,
      raw_excerpt: null,
      scan_timestamp: now,
    });

    // ═══════════════════════════════════════════
    // 4. COMPANY BEHAVIOR (political/governance)
    // ═══════════════════════════════════════════
    const pacSpending = company.total_pac_spending || 0;
    const lobbySpend = company.lobbying_spend || 0;
    const govContracts = (contracts || []).length;
    const controversialContracts = (contracts || []).filter(c => c.controversy_flag).length;
    const caseCount = (courtCases || []).length;

    let behaviorNorm: string;
    let behaviorDir: string;
    let behaviorSummary: string;
    let behaviorConf: string;
    const parts: string[] = [];

    if (pacSpending > 100000) parts.push(`$${(pacSpending / 1000).toFixed(0)}K PAC spending`);
    if (lobbySpend > 50000) parts.push(`$${(lobbySpend / 1000).toFixed(0)}K lobbying`);
    if (govContracts > 0) parts.push(`${govContracts} government contract(s)`);
    if (controversialContracts > 0) parts.push(`${controversialContracts} flagged contract(s)`);
    if (caseCount > 0) parts.push(`${caseCount} court case(s)`);

    if (pacSpending > 500000 || lobbySpend > 1000000 || controversialContracts > 0) {
      behaviorNorm = 'high';
      behaviorDir = 'stable';
      behaviorSummary = `Significant political footprint: ${parts.join(', ')}.`;
      behaviorConf = 'high';
    } else if (parts.length > 0) {
      behaviorNorm = 'medium';
      behaviorDir = 'stable';
      behaviorSummary = `Moderate civic footprint: ${parts.join(', ')}.`;
      behaviorConf = 'medium';
    } else {
      behaviorNorm = 'low';
      behaviorDir = 'unknown';
      behaviorSummary = 'No significant political spending or government contracts detected.';
      behaviorConf = 'low';
    }

    signals.push({
      company_id: companyId,
      signal_category: 'company_behavior',
      signal_type: 'political_influence',
      signal_value: parts.length > 0 ? parts.join('; ') : 'none_detected',
      direction: behaviorDir,
      summary: behaviorSummary,
      value_normalized: behaviorNorm,
      confidence_level: behaviorConf,
      source_url: null,
      raw_excerpt: null,
      scan_timestamp: now,
    });

    // ═══════════════════════════════════════════
    // 5. INNOVATION ACTIVITY
    // ═══════════════════════════════════════════
    const patentCount = (patents || []).length;
    const recentPatents = (patents || []).filter(p => {
      if (!p.filing_date) return false;
      return (Date.now() - new Date(p.filing_date).getTime()) < 365 * 86400000;
    });

    let innovNorm: string;
    let innovDir: string;
    let innovSummary: string;
    let innovConf: string;

    if (recentPatents.length > 5) {
      innovNorm = 'high';
      innovDir = 'increase';
      innovSummary = `${recentPatents.length} patent filings in the past year. Active R&D investment.`;
      innovConf = 'high';
    } else if (patentCount > 0) {
      innovNorm = 'medium';
      innovDir = recentPatents.length > 0 ? 'stable' : 'decrease';
      innovSummary = `${patentCount} total patents on file${recentPatents.length > 0 ? `, ${recentPatents.length} recent.` : ', none recent.'}`;
      innovConf = 'medium';
    } else {
      innovNorm = 'not_disclosed';
      innovDir = 'unknown';
      innovSummary = 'No patent activity detected in public records.';
      innovConf = 'low';
    }

    signals.push({
      company_id: companyId,
      signal_category: 'innovation_activity',
      signal_type: 'patent_filings',
      signal_value: patentCount > 0 ? `${patentCount} patents` : 'none_detected',
      direction: innovDir,
      summary: innovSummary,
      value_normalized: innovNorm,
      confidence_level: innovConf,
      source_url: null,
      raw_excerpt: null,
      scan_timestamp: now,
    });

    // ═══════════════════════════════════════════
    // 6. PUBLIC SENTIMENT
    // ═══════════════════════════════════════════
    const totalSentiment = (sentiment || []).length;
    const newsCount = (newsSignals || []).length;

    let sentNorm: string;
    let sentDir: string;
    let sentSummary: string;
    let sentConf: string;

    if (totalSentiment === 0 && newsCount === 0) {
      sentNorm = 'not_disclosed';
      sentDir = 'unknown';
      sentSummary = 'No public sentiment or news coverage indexed.';
      sentConf = 'low';
    } else if (negativeSentiment > positiveSentiment * 2) {
      sentNorm = 'low';
      sentDir = 'decrease';
      sentSummary = `Sentiment skews negative (${negativeSentiment} negative vs ${positiveSentiment} positive signals).`;
      sentConf = 'medium';
    } else if (positiveSentiment > negativeSentiment) {
      sentNorm = 'high';
      sentDir = 'stable';
      sentSummary = `Generally positive public sentiment (${positiveSentiment} positive signals).`;
      sentConf = 'medium';
    } else {
      sentNorm = 'medium';
      sentDir = 'stable';
      sentSummary = `Mixed sentiment: ${positiveSentiment} positive, ${negativeSentiment} negative signals.`;
      sentConf = 'medium';
    }

    signals.push({
      company_id: companyId,
      signal_category: 'public_sentiment',
      signal_type: 'overall_sentiment',
      signal_value: totalSentiment > 0 ? `${totalSentiment} signals` : 'none_detected',
      direction: sentDir,
      summary: sentSummary,
      value_normalized: sentNorm,
      confidence_level: sentConf,
      source_url: null,
      raw_excerpt: null,
      scan_timestamp: now,
    });

    // ── Upsert all signals ──
    // Delete existing canonical signals for this company, then insert fresh
    const canonicalCategories = [
      'compensation_transparency', 'hiring_activity', 'workforce_stability',
      'company_behavior', 'innovation_activity', 'public_sentiment',
    ];

    await supabase
      .from('company_signal_scans')
      .delete()
      .eq('company_id', companyId)
      .in('signal_category', canonicalCategories);

    const { error: insertError } = await supabase
      .from('company_signal_scans')
      .insert(signals);

    if (insertError) {
      console.error('[generate-company-signals] Insert error:', insertError);
      throw insertError;
    }

    console.log(`[generate-company-signals] COMPLETE: ${signals.length} signals written for ${companyId}`);

    return new Response(JSON.stringify({
      success: true,
      signalsGenerated: signals.length,
      signals: signals.map(s => ({
        category: s.signal_category,
        value: s.value_normalized,
        direction: s.direction,
        summary: s.summary,
      })),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[generate-company-signals] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
