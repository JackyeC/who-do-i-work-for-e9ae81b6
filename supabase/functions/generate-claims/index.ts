const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ClaimOutput {
  claim_text: string;
  source_url: string | null;
  evidence_type: 'direct_source' | 'multi_source' | 'inferred';
  confidence_score: number;
  event_date: string | null;
  decision_impact: string | null;
}

interface SignalSource {
  table: string;
  claimType: string;
  sourceLabel: string;
  query: (supabase: any, companyId: string) => Promise<any[]>;
  toClaim: (row: any, companyName: string) => ClaimOutput;
}

const DECISION_IMPACTS: Record<string, string> = {
  layoff: 'This may indicate changes in workforce planning or financial pressure that could affect job stability.',
  accountability: 'This public record may reflect patterns in corporate governance or regulatory compliance.',
  safety: 'Workplace safety records may affect employee well-being and indicate operational risk management practices.',
  labor: 'Labor relations filings may signal workforce dynamics relevant to employee experience and bargaining rights.',
  civil_rights: 'Civil rights records may indicate patterns in workplace equity and inclusion practices.',
  environmental: 'Environmental records may reflect the company\'s operational impact and regulatory compliance posture.',
  legal: 'Court records may indicate ongoing legal exposure or patterns in corporate conduct.',
  political: 'Political spending records may reflect leadership priorities, affiliations, or lobbying strategies.',
  ai_hiring: 'AI-driven hiring tools may affect transparency, fairness, and bias in recruitment processes.',
  ai_hr: 'Use of AI in HR operations may impact employee monitoring, evaluation, and workplace autonomy.',
  news: 'Media coverage may reflect public perception, controversies, or notable corporate developments.',
  signal_scan: 'This signal was detected through automated public record scanning and may reflect corporate behavior patterns.',
};

async function fetchAll(supabase: any, table: string, companyId: string, selectCols = '*') {
  // Paginate to handle >1000 rows per company
  const rows: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(selectCols)
      .eq('company_id', companyId)
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

const SIGNAL_SOURCES: SignalSource[] = [
  // 1. WARN Notices
  {
    table: 'company_warn_notices',
    claimType: 'layoff',
    sourceLabel: 'WARN',
    query: (sb, cid) => fetchAll(sb, 'company_warn_notices', cid),
    toClaim: (row, name) => {
      const date = row.notice_date || row.effective_date;
      const dateStr = date ? new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'date unknown';
      const count = row.employees_affected ? ` affecting ${row.employees_affected} employees` : '';
      return {
        claim_text: `${name} conducted layoffs${count} (WARN filing, ${dateStr}).`,
        source_url: row.source_url || null,
        evidence_type: 'direct_source',
        confidence_score: 0.95,
        event_date: date || null,
        decision_impact: DECISION_IMPACTS.layoff,
      };
    },
  },
  // 2. Accountability Signals
  {
    table: 'accountability_signals',
    claimType: 'accountability',
    sourceLabel: 'Public Record',
    query: async (sb, cid) => {
      const { data } = await sb.from('accountability_signals').select('*').eq('company_id', cid).eq('is_verified', true);
      return data || [];
    },
    toClaim: (row, _name) => {
      const evidenceMap: Record<string, 'direct_source' | 'multi_source' | 'inferred'> = {
        government_record: 'direct_source',
        news_report: 'multi_source',
        corporate_filing: 'direct_source',
      };
      return {
        claim_text: row.headline || `Accountability signal: ${row.signal_type}`,
        source_url: row.source_url || null,
        evidence_type: evidenceMap[row.source_type] || 'multi_source',
        confidence_score: row.severity === 'critical' ? 0.95 : row.severity === 'high' ? 0.85 : 0.70,
        event_date: row.event_date || null,
        decision_impact: DECISION_IMPACTS.accountability,
      };
    },
  },
  // 3. Civil Rights
  {
    table: 'civil_rights_signals',
    claimType: 'civil_rights',
    sourceLabel: 'EEOC / Civil Rights',
    query: (sb, cid) => fetchAll(sb, 'civil_rights_signals', cid),
    toClaim: (row, name) => {
      const amount = row.settlement_amount ? ` ($${Number(row.settlement_amount).toLocaleString()} settlement)` : '';
      return {
        claim_text: `${name} has a ${row.signal_type || 'civil rights'} record${amount} via ${row.source_name || 'public records'}.`,
        source_url: row.source_url || null,
        evidence_type: 'direct_source',
        confidence_score: 0.90,
        event_date: row.filing_date || null,
        decision_impact: DECISION_IMPACTS.civil_rights,
      };
    },
  },
  // 4. Climate / Environmental
  {
    table: 'climate_signals',
    claimType: 'environmental',
    sourceLabel: 'EPA / Climate',
    query: (sb, cid) => fetchAll(sb, 'climate_signals', cid),
    toClaim: (row, name) => ({
      claim_text: row.description || `${name} has an environmental signal: ${row.signal_type}.`,
      source_url: row.source_url || null,
      evidence_type: 'direct_source',
      confidence_score: 0.80,
      event_date: row.created_at || null,
      decision_impact: DECISION_IMPACTS.environmental,
    }),
  },
  // 5. Court Cases
  {
    table: 'company_court_cases',
    claimType: 'legal',
    sourceLabel: 'Court Record',
    query: (sb, cid) => fetchAll(sb, 'company_court_cases', cid),
    toClaim: (row, _name) => {
      const damages = row.damages_amount ? ` ($${Number(row.damages_amount).toLocaleString()})` : '';
      return {
        claim_text: `${row.case_name}${damages} — ${row.nature_of_suit || row.case_type || 'civil case'}.`,
        source_url: row.courtlistener_url || null,
        evidence_type: 'direct_source',
        confidence_score: 0.90,
        event_date: row.date_filed || null,
        decision_impact: DECISION_IMPACTS.legal,
      };
    },
  },
  // 6. AI Hiring Signals
  {
    table: 'ai_hiring_signals',
    claimType: 'ai_hiring',
    sourceLabel: 'AI Hiring Audit',
    query: (sb, cid) => fetchAll(sb, 'ai_hiring_signals', cid),
    toClaim: (row, name) => {
      const vendor = row.vendor_name ? ` (vendor: ${row.vendor_name})` : '';
      return {
        claim_text: `${name} uses AI-driven hiring tools in ${row.category || 'recruitment'}${vendor}.`,
        source_url: row.evidence_url || row.bias_audit_link || null,
        evidence_type: row.bias_audit_status === 'completed' ? 'direct_source' : 'inferred',
        confidence_score: row.confidence_score || 0.70,
        event_date: row.last_scanned || null,
        decision_impact: DECISION_IMPACTS.ai_hiring,
      };
    },
  },
  // 7. AI HR Signals
  {
    table: 'ai_hr_signals',
    claimType: 'ai_hr',
    sourceLabel: 'AI HR Detection',
    query: (sb, cid) => fetchAll(sb, 'ai_hr_signals', cid),
    toClaim: (row, name) => {
      const tool = row.tool_name ? ` (${row.tool_name})` : '';
      return {
        claim_text: `${name} deploys AI in HR operations: ${row.signal_type}${tool}.`,
        source_url: row.source_url || null,
        evidence_type: row.detection_method === 'direct_observation' ? 'direct_source' : 'inferred',
        confidence_score: row.confidence === 'high' ? 0.90 : row.confidence === 'medium' ? 0.70 : 0.50,
        event_date: row.date_detected || null,
        decision_impact: DECISION_IMPACTS.ai_hr,
      };
    },
  },
  // 8. News Signals
  {
    table: 'company_news_signals',
    claimType: 'news',
    sourceLabel: 'News / Media',
    query: (sb, cid) => fetchAll(sb, 'company_news_signals', cid),
    toClaim: (row, _name) => ({
      claim_text: row.headline || 'News coverage detected.',
      source_url: row.source_url || null,
      evidence_type: 'multi_source',
      confidence_score: row.is_controversy ? 0.85 : 0.65,
      event_date: row.published_at || null,
      decision_impact: DECISION_IMPACTS.news,
    }),
  },
  // 9. Signal Scans (values, governance, etc.)
  {
    table: 'company_signal_scans',
    claimType: 'signal_scan',
    sourceLabel: 'Signal Scan',
    query: (sb, cid) => fetchAll(sb, 'company_signal_scans', cid),
    toClaim: (row, name) => ({
      claim_text: row.summary || `${name}: ${row.signal_type} signal detected (${row.signal_category}).`,
      source_url: row.source_url || null,
      evidence_type: row.confidence_level === 'high' ? 'direct_source' : row.confidence_level === 'medium' ? 'multi_source' : 'inferred',
      confidence_score: row.confidence_level === 'high' ? 0.90 : row.confidence_level === 'medium' ? 0.70 : 0.50,
      event_date: row.scan_timestamp || null,
      decision_impact: DECISION_IMPACTS.signal_scan,
    }),
  },
  // 10. FEC Candidates / Political Contributions
  {
    table: 'company_candidates',
    claimType: 'political',
    sourceLabel: 'FEC',
    query: (sb, cid) => fetchAll(sb, 'company_candidates', cid),
    toClaim: (row, name) => ({
      claim_text: `${name} or its PAC contributed $${Number(row.amount || 0).toLocaleString()} to ${row.name} (${row.party}-${row.state}).`,
      source_url: `https://www.fec.gov/data/receipts/?contributor_name=${encodeURIComponent(name)}`,
      evidence_type: 'direct_source',
      confidence_score: 0.90,
      event_date: null,
      decision_impact: DECISION_IMPACTS.political,
    }),
  },
];

async function generateClaimsForCompany(supabase: any, companyId: string, companyName: string) {
  let totalGenerated = 0;
  let totalSkipped = 0;

  for (const source of SIGNAL_SOURCES) {
    try {
      const signals = await source.query(supabase, companyId);
      for (const signal of signals) {
        const claim = source.toClaim(signal, companyName);

        // ATTRIBUTION ENFORCEMENT
        if (!claim.source_url) {
          totalSkipped++;
          continue;
        }

        // Deduplicate
        const { data: existing } = await supabase
          .from('company_claims')
          .select('id')
          .eq('company_id', companyId)
          .eq('signal_id', signal.id)
          .eq('signal_table', source.table)
          .maybeSingle();

        if (existing) {
          totalSkipped++;
          continue;
        }

        const { error: insertErr } = await supabase.from('company_claims').insert({
          company_id: companyId,
          claim_text: claim.claim_text,
          claim_type: source.claimType,
          source_label: source.sourceLabel,
          source_url: claim.source_url,
          evidence_type: claim.evidence_type,
          confidence_score: claim.confidence_score,
          signal_id: signal.id,
          signal_table: source.table,
          event_date: claim.event_date,
          decision_impact: claim.decision_impact,
          is_active: true,
          generated_by: 'claim_engine',
        });

        if (insertErr) {
          totalSkipped++;
        } else {
          totalGenerated++;
        }
      }
    } catch (_e) {
      // table may not exist for some deploys, skip silently
    }
  }

  return { generated: totalGenerated, skipped: totalSkipped };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const companyId = body.companyId;
    const backfillAll = body.backfillAll === true;
    const batchOffset = typeof body.batchOffset === 'number' ? body.batchOffset : 0;
    const batchSize = typeof body.batchSize === 'number' ? Math.min(body.batchSize, 100) : 50;

    if (backfillAll) {
      // Paginate through ALL companies (no limit)
      let totalGenerated = 0;
      let totalSkipped = 0;
      let companiesProcessed = 0;
      let companiesWithClaims = 0;
      let offset = 0;
      const pageSize = 500;

      while (true) {
        const { data: companies, error: listErr } = await supabase
          .from('companies')
          .select('id, name')
          .order('name')
          .range(offset, offset + pageSize - 1);

        if (listErr || !companies || companies.length === 0) break;

        for (const company of companies) {
          const result = await generateClaimsForCompany(supabase, company.id, company.name);
          totalGenerated += result.generated;
          totalSkipped += result.skipped;
          if (result.generated > 0) companiesWithClaims++;
          companiesProcessed++;
        }

        if (companies.length < pageSize) break;
        offset += pageSize;
      }

      console.log(`[generate-claims] Full backfill: ${companiesProcessed} companies, ${totalGenerated} claims generated, ${totalSkipped} skipped`);

      return new Response(JSON.stringify({
        success: true,
        mode: 'backfill_all',
        companiesProcessed,
        companiesWithClaims,
        totalGenerated,
        totalSkipped,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'companyId is required (or set backfillAll: true)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    if (companyErr || !company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await generateClaimsForCompany(supabase, companyId, company.name);

    return new Response(JSON.stringify({
      success: true,
      companyId,
      companyName: company.name,
      ...result,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
