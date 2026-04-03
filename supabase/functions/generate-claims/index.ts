import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Claim Generation Engine
 * Transforms raw signals into structured, human-readable claims with evidence typing.
 * Scans signal tables, generates claim text, and stores in company_claims.
 */

interface SignalSource {
  table: string;
  claimType: string;
  sourceLabel: string;
  query: (supabase: any, companyId: string) => Promise<any[]>;
  toClaim: (row: any, companyName: string) => {
    claim_text: string;
    source_url: string | null;
    evidence_type: 'direct_source' | 'multi_source' | 'inferred';
    confidence_score: number;
    event_date: string | null;
  };
}

const SIGNAL_SOURCES: SignalSource[] = [
  {
    table: 'company_warn_notices',
    claimType: 'layoff',
    sourceLabel: 'WARN',
    query: async (sb, companyId) => {
      const { data } = await sb.from('company_warn_notices').select('*').eq('company_id', companyId);
      return data || [];
    },
    toClaim: (row, companyName) => {
      const date = row.notice_date || row.effective_date;
      const dateStr = date ? new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'date unknown';
      const count = row.employees_affected ? ` affecting ${row.employees_affected} employees` : '';
      return {
        claim_text: `${companyName} conducted layoffs${count} (WARN filing, ${dateStr}).`,
        source_url: row.source_url || null,
        evidence_type: 'direct_source' as const,
        confidence_score: 0.95,
        event_date: date || null,
      };
    },
  },
  {
    table: 'accountability_signals',
    claimType: 'accountability',
    sourceLabel: 'Public Record',
    query: async (sb, companyId) => {
      const { data } = await sb.from('accountability_signals').select('*').eq('company_id', companyId).eq('is_verified', true);
      return data || [];
    },
    toClaim: (row, _companyName) => {
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
      };
    },
  },
  {
    table: 'company_osha_violations',
    claimType: 'safety',
    sourceLabel: 'OSHA',
    query: async (sb, companyId) => {
      const { data } = await sb.from('company_osha_violations').select('*').eq('company_id', companyId);
      return data || [];
    },
    toClaim: (row, companyName) => {
      const penalty = row.penalty_amount ? ` with a $${Number(row.penalty_amount).toLocaleString()} penalty` : '';
      const date = row.inspection_date ? new Date(row.inspection_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
      return {
        claim_text: `${companyName} received an OSHA ${row.violation_type || 'safety'} violation${penalty}${date ? ` (${date})` : ''}.`,
        source_url: row.source_url || null,
        evidence_type: 'direct_source' as const,
        confidence_score: 0.95,
        event_date: row.inspection_date || null,
      };
    },
  },
  {
    table: 'company_nlrb_cases',
    claimType: 'labor',
    sourceLabel: 'NLRB',
    query: async (sb, companyId) => {
      const { data } = await sb.from('company_nlrb_cases').select('*').eq('company_id', companyId);
      return data || [];
    },
    toClaim: (row, companyName) => {
      const date = row.date_filed ? new Date(row.date_filed).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
      return {
        claim_text: `${companyName} has an NLRB case on file${row.case_type ? ` (${row.case_type})` : ''}${date ? `, filed ${date}` : ''}.`,
        source_url: row.source_url || null,
        evidence_type: 'direct_source' as const,
        confidence_score: 0.90,
        event_date: row.date_filed || null,
      };
    },
  },
  {
    table: 'civil_rights_signals',
    claimType: 'civil_rights',
    sourceLabel: 'EEOC / Civil Rights',
    query: async (sb, companyId) => {
      const { data } = await sb.from('civil_rights_signals').select('*').eq('company_id', companyId);
      return data || [];
    },
    toClaim: (row, companyName) => {
      const amount = row.settlement_amount ? ` ($${Number(row.settlement_amount).toLocaleString()} settlement)` : '';
      return {
        claim_text: `${companyName} has a ${row.signal_type || 'civil rights'} record${amount} via ${row.source_name || 'public records'}.`,
        source_url: row.source_url || null,
        evidence_type: 'direct_source' as const,
        confidence_score: 0.90,
        event_date: row.filing_date || null,
      };
    },
  },
  {
    table: 'climate_signals',
    claimType: 'environmental',
    sourceLabel: 'EPA / Climate',
    query: async (sb, companyId) => {
      const { data } = await sb.from('climate_signals').select('*').eq('company_id', companyId);
      return data || [];
    },
    toClaim: (row, companyName) => ({
      claim_text: row.description || `${companyName} has an environmental signal: ${row.signal_type}.`,
      source_url: row.source_url || null,
      evidence_type: 'direct_source' as const,
      confidence_score: 0.80,
      event_date: row.created_at || null,
    }),
  },
  {
    table: 'company_court_cases',
    claimType: 'legal',
    sourceLabel: 'Court Record',
    query: async (sb, companyId) => {
      const { data } = await sb.from('company_court_cases').select('*').eq('company_id', companyId);
      return data || [];
    },
    toClaim: (row, _companyName) => {
      const damages = row.damages_amount ? ` ($${Number(row.damages_amount).toLocaleString()})` : '';
      return {
        claim_text: `${row.case_name}${damages} — ${row.nature_of_suit || row.case_type || 'civil case'}.`,
        source_url: row.courtlistener_url || null,
        evidence_type: 'direct_source' as const,
        confidence_score: 0.90,
        event_date: row.date_filed || null,
      };
    },
  },
];

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

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'companyId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get company name
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

    let totalGenerated = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    for (const source of SIGNAL_SOURCES) {
      try {
        const signals = await source.query(supabase, companyId);

        for (const signal of signals) {
          const claim = source.toClaim(signal, company.name);

          // Suppress claims without source
          if (!claim.source_url && claim.evidence_type === 'direct_source') {
            claim.evidence_type = 'inferred';
            claim.confidence_score = Math.min(claim.confidence_score, 0.50);
          }

          // No source URL + low confidence → suppress
          if (!claim.source_url && claim.confidence_score < 0.40) {
            totalSkipped++;
            continue;
          }

          const { error: insertErr } = await supabase.from('company_claims').upsert({
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
            is_active: true,
            generated_by: 'claim_engine',
          }, {
            onConflict: 'company_id,signal_id,signal_table',
            ignoreDuplicates: false,
          });

          if (insertErr) {
            console.warn(`[generate-claims] Insert error for ${source.table}:`, insertErr.message);
            totalSkipped++;
          } else {
            totalGenerated++;
          }
        }
      } catch (sourceErr: any) {
        errors.push(`${source.table}: ${sourceErr.message}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      companyId,
      companyName: company.name,
      generated: totalGenerated,
      skipped: totalSkipped,
      errors: errors.length > 0 ? errors : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
