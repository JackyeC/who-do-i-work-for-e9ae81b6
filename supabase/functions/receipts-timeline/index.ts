/**
 * Receipts Timeline Edge Function
 * 
 * Aggregates chronological events from multiple OSINT tables into a 
 * unified, structured timeline for a company. No scraping — pure DB aggregation.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TimelineEvent {
  date: string;
  event_type: string;
  headline: string;
  summary: string;
  source_name: string;
  source_url: string | null;
  confidence: 'high' | 'medium' | 'low';
  impact_tags: string[];
}

interface PatternFlag {
  pattern: string;
  label: string;
  description: string;
  event_count: number;
  confidence: 'high' | 'medium' | 'low';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { companyId } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ success: false, error: 'companyId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const events: TimelineEvent[] = [];

    // Parallel queries for speed
    const [
      newsRes, courtRes, execRes, boardRes, candidateRes,
      lobbyRes, contractRes, warnRes, ideologyRes, insiderRes,
    ] = await Promise.all([
      supabase.from('company_news_signals').select('*').eq('company_id', companyId).order('published_at', { ascending: false }).limit(50),
      supabase.from('company_court_cases').select('*').eq('company_id', companyId).order('date_filed', { ascending: false }).limit(30),
      supabase.from('company_executives').select('*').eq('company_id', companyId).order('updated_at', { ascending: false }).limit(30),
      supabase.from('board_members').select('*').eq('company_id', companyId).order('updated_at', { ascending: false }).limit(20),
      supabase.from('company_candidates').select('*').eq('company_id', companyId).order('amount', { ascending: false }).limit(30),
      supabase.from('company_lobbying' as any).select('*').eq('company_id', companyId).limit(30),
      supabase.from('company_agency_contracts').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20),
      supabase.from('warn_notices' as any).select('*').eq('company_id', companyId).order('notice_date', { ascending: false }).limit(20),
      supabase.from('company_ideology_flags').select('*').eq('company_id', companyId).order('scan_date', { ascending: false }).limit(20),
      supabase.from('insider_trades' as any).select('*').eq('company_id', companyId).order('filed_at', { ascending: false }).limit(20),
    ]);

    // ─── News → media_narrative_shift ───
    for (const n of newsRes.data || []) {
      events.push({
        date: n.published_at || n.created_at,
        event_type: n.is_controversy ? 'media_narrative_shift' : 'media_narrative_shift',
        headline: n.headline,
        summary: n.controversy_type 
          ? `${n.controversy_type} coverage detected. Sentiment: ${n.tone_label || 'neutral'}.`
          : `Media coverage detected. Sentiment: ${n.tone_label || 'neutral'}.`,
        source_name: n.source_name || 'GDELT',
        source_url: n.source_url,
        confidence: n.sentiment_score && Math.abs(n.sentiment_score) > 5 ? 'high' : 'medium',
        impact_tags: [
          'Reputation',
          ...(n.is_controversy ? ['Compliance'] : []),
          ...(n.themes?.includes('layoff') || n.themes?.includes('workforce') ? ['Workforce'] : []),
        ],
      });
    }

    // ─── Court Cases → lawsuit / regulatory_action ───
    for (const c of courtRes.data || []) {
      const isRegulatory = c.nature_of_suit?.toLowerCase().includes('civil rights') || 
        c.case_type?.toLowerCase().includes('regulatory');
      events.push({
        date: c.date_filed || c.created_at || new Date().toISOString(),
        event_type: isRegulatory ? 'regulatory_action' : 'lawsuit',
        headline: c.case_name,
        summary: c.summary || `${c.nature_of_suit || c.case_type || 'Legal'} case. Status: ${c.status || 'Unknown'}.`,
        source_name: 'CourtListener',
        source_url: c.courtlistener_url,
        confidence: c.confidence === 'high' ? 'high' : 'medium',
        impact_tags: ['Compliance', ...(c.nature_of_suit?.toLowerCase().includes('labor') ? ['Workforce'] : [])],
      });
    }

    // ─── Executives → leadership_change ───
    for (const e of execRes.data || []) {
      if (e.departed_at) {
        events.push({
          date: e.departed_at,
          event_type: 'leadership_change',
          headline: `${e.name} departed as ${e.title}`,
          summary: `Leadership departure detected. Verification: ${e.verification_status}.`,
          source_name: e.source || 'Company records',
          source_url: null,
          confidence: e.verification_status === 'verified' ? 'high' : 'medium',
          impact_tags: ['Leadership'],
        });
      }
    }

    // ─── Board → board_change ───
    for (const b of boardRes.data || []) {
      if (b.departed_at) {
        events.push({
          date: b.departed_at,
          event_type: 'board_change',
          headline: `${b.name} departed board (${b.title})`,
          summary: `Board member departure. ${b.is_independent ? 'Independent director.' : ''} Previously at ${b.previous_company || 'N/A'}.`,
          source_name: b.source || 'SEC/Company records',
          source_url: null,
          confidence: b.verification_status === 'verified' ? 'high' : 'medium',
          impact_tags: ['Leadership', 'Financial'],
        });
      }
    }

    // ─── Political Donations → political_contribution ───
    for (const c of candidateRes.data || []) {
      if (c.amount > 0) {
        events.push({
          date: new Date().toISOString(), // FEC doesn't always have exact dates in this table
          event_type: 'political_contribution',
          headline: `${c.donation_type === 'pac' ? 'PAC' : 'Executive'} contribution to ${c.name} (${c.party})`,
          summary: `$${c.amount.toLocaleString()} contribution detected. ${c.flagged ? `Flag: ${c.flag_reason || 'Flagged for review'}.` : ''}`,
          source_name: 'FEC',
          source_url: 'https://www.fec.gov/data/',
          confidence: 'high',
          impact_tags: ['Political', ...(c.flagged ? ['Reputation'] : [])],
        });
      }
    }

    // ─── Lobbying → lobbying_disclosure ───
    for (const l of lobbyRes.data || []) {
      events.push({
        date: (l as any).filing_date || (l as any).created_at || new Date().toISOString(),
        event_type: 'lobbying_disclosure',
        headline: `Lobbying disclosure: ${(l as any).issue_area || (l as any).registrant_name || 'Filed'}`,
        summary: `${(l as any).amount ? '$' + Number((l as any).amount).toLocaleString() + ' reported.' : ''} ${(l as any).specific_issues || ''}`.trim(),
        source_name: 'Senate LDA',
        source_url: (l as any).source_url || 'https://lda.senate.gov/filings/public/filing/search/',
        confidence: 'high',
        impact_tags: ['Political'],
      });
    }

    // ─── Government Contracts → funding_round (gov variant) ───
    for (const gc of contractRes.data || []) {
      events.push({
        date: gc.created_at,
        event_type: 'funding_round',
        headline: `Federal contract with ${gc.agency_name}`,
        summary: `${gc.contract_value ? '$' + gc.contract_value.toLocaleString() + ' contract.' : 'Contract detected.'} ${gc.controversy_flag ? 'Controversy flag raised.' : ''}`,
        source_name: 'USASpending',
        source_url: gc.source || 'https://www.usaspending.gov/',
        confidence: gc.confidence === 'direct' ? 'high' : 'medium',
        impact_tags: ['Financial', ...(gc.controversy_flag ? ['Compliance'] : [])],
      });
    }

    // ─── WARN → layoff ───
    for (const w of warnRes.data || []) {
      events.push({
        date: (w as any).notice_date || (w as any).created_at || new Date().toISOString(),
        event_type: 'layoff',
        headline: `WARN layoff notice: ${(w as any).number_affected || 'Multiple'} workers affected`,
        summary: `${(w as any).reason || 'Workforce reduction'} at ${(w as any).location || 'undisclosed location'}.`,
        source_name: 'WARN Database',
        source_url: 'https://www.dol.gov/agencies/eta/layoffs/warn',
        confidence: 'high',
        impact_tags: ['Workforce', 'Financial'],
      });
    }

    // ─── Ideology flags → public_values_statement ───
    for (const f of ideologyRes.data || []) {
      events.push({
        date: f.scan_date || f.created_at,
        event_type: 'public_values_statement',
        headline: `${f.category}: ${f.org_name}`,
        summary: f.description || `${f.relationship_type} relationship detected. Severity: ${f.severity}.`,
        source_name: f.detected_by || 'Public records',
        source_url: f.evidence_url,
        confidence: f.confidence === 'high' ? 'high' : f.confidence === 'medium' ? 'medium' : 'low',
        impact_tags: ['Political', 'Reputation'],
      });
    }

    // ─── Insider Trades → compensation_disclosure ───
    for (const t of insiderRes.data || []) {
      events.push({
        date: (t as any).filed_at || (t as any).transaction_date || (t as any).created_at,
        event_type: 'compensation_disclosure',
        headline: `Insider trade: ${(t as any).insider_name || 'Executive'} ${(t as any).transaction_type || 'transaction'}`,
        summary: `${(t as any).shares ? Number((t as any).shares).toLocaleString() + ' shares' : ''} ${(t as any).price_per_share ? '@ $' + (t as any).price_per_share : ''}. Filed with SEC.`,
        source_name: 'SEC Form 4',
        source_url: (t as any).sec_url || 'https://www.sec.gov/cgi-bin/browse-edgar',
        confidence: 'high',
        impact_tags: ['Financial', 'Leadership'],
      });
    }

    // ─── Sort newest first ───
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ─── Pattern Detection ───
    const patterns: PatternFlag[] = [];
    const typeCounts: Record<string, number> = {};
    for (const e of events) {
      typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
    }

    if ((typeCounts['leadership_change'] || 0) + (typeCounts['board_change'] || 0) >= 3) {
      patterns.push({
        pattern: 'leadership_instability',
        label: 'Leadership Instability',
        description: 'Multiple leadership or board departures detected within the observable period.',
        event_count: (typeCounts['leadership_change'] || 0) + (typeCounts['board_change'] || 0),
        confidence: 'medium',
      });
    }

    if ((typeCounts['lawsuit'] || 0) + (typeCounts['regulatory_action'] || 0) >= 3) {
      patterns.push({
        pattern: 'elevated_legal_exposure',
        label: 'Elevated Legal Exposure',
        description: 'Multiple legal or regulatory actions detected in public records.',
        event_count: (typeCounts['lawsuit'] || 0) + (typeCounts['regulatory_action'] || 0),
        confidence: 'high',
      });
    }

    if ((typeCounts['layoff'] || 0) >= 2) {
      patterns.push({
        pattern: 'hiring_slowdown',
        label: 'Hiring Slowdown Pattern',
        description: 'Multiple WARN notices or layoff events detected.',
        event_count: typeCounts['layoff'] || 0,
        confidence: 'high',
      });
    }

    if ((typeCounts['political_contribution'] || 0) + (typeCounts['lobbying_disclosure'] || 0) >= 5) {
      patterns.push({
        pattern: 'political_activity_spike',
        label: 'Political Activity Spike',
        description: 'Significant volume of political contributions and lobbying disclosures detected.',
        event_count: (typeCounts['political_contribution'] || 0) + (typeCounts['lobbying_disclosure'] || 0),
        confidence: 'high',
      });
    }

    const controversyNews = (newsRes.data || []).filter(n => n.is_controversy).length;
    if (controversyNews >= 3) {
      patterns.push({
        pattern: 'reputation_pressure',
        label: 'Reputation Pressure Building',
        description: 'Multiple controversy-tagged news signals detected in media monitoring.',
        event_count: controversyNews,
        confidence: 'medium',
      });
    }

    // Check for messaging vs action gap
    const hasValuesSignals = (typeCounts['public_values_statement'] || 0) > 0;
    const hasNegativeActions = (typeCounts['layoff'] || 0) + (typeCounts['lawsuit'] || 0) + (typeCounts['regulatory_action'] || 0) > 0;
    if (hasValuesSignals && hasNegativeActions) {
      patterns.push({
        pattern: 'messaging_vs_action_gap',
        label: 'Messaging vs. Action Gap',
        description: 'Public values statements coexist with adverse legal, regulatory, or workforce signals in the observable record.',
        event_count: (typeCounts['public_values_statement'] || 0) + (typeCounts['layoff'] || 0) + (typeCounts['lawsuit'] || 0),
        confidence: 'medium',
      });
    }

    return new Response(JSON.stringify({
      success: true,
      events: events.slice(0, 200),
      total_events: events.length,
      patterns,
      event_type_counts: typeCounts,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[receipts-timeline] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
