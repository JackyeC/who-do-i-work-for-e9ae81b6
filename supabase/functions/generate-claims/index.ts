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
};

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
        evidence_type: 'direct_source',
        confidence_score: 0.95,
        event_date: date || null,
        decision_impact: DECISION_IMPACTS.layoff,
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
        decision_impact: DECISION_IMPACTS.accountability,
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
        evidence_type: 'direct_source',
        confidence_score: 0.90,
        event_date: row.filing_date || null,
        decision_impact: DECISION_IMPACTS.civil_rights,
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
      evidence_type: 'direct_source',
      confidence_score: 0.80,
      event_date: row.created_at || null,
      decision_impact: DECISION_IMPACTS.environmental,
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
        evidence_type: 'direct_source',
        confidence_score: 0.90,
        event_date: row.date_filed || null,
        decision_impact: DECISION_IMPACTS.legal,
      };
    },
  },
];

async function generateClaimsForCompany(supabase: any, companyId: string, companyName: string) {
  let totalGenerated = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const source of SIGNAL_SOURCES) {
    try {
      const signals = await source.query(supabase, companyId);
      for (const signal of signals) {
        const claim = source.toClaim(signal, companyName);

        // ATTRIBUTION ENFORCEMENT: discard if missing source
        if (!claim.source_url) {
          totalSkipped++;
          continue;
        }

        // Check for existing claim from this signal (partial unique index)
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

  return { generated: totalGenerated, skipped: totalSkipped, errors };
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

    // BACKFILL ALL MODE
    if (backfillAll) {
      const { data: companies, error: listErr } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (listErr) {
        return new Response(JSON.stringify({ error: listErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let totalGenerated = 0;
      let totalSkipped = 0;
      let companiesProcessed = 0;
      let companiesWithClaims = 0;
      const allErrors: string[] = [];

      for (const company of (companies || [])) {
        const result = await generateClaimsForCompany(supabase, company.id, company.name);
        totalGenerated += result.generated;
        totalSkipped += result.skipped;
        if (result.generated > 0) companiesWithClaims++;
        companiesProcessed++;
        allErrors.push(...result.errors);
      }

      console.log(`[generate-claims] Backfill complete: ${companiesProcessed} companies, ${totalGenerated} claims, ${totalSkipped} skipped`);

      return new Response(JSON.stringify({
        success: true,
        mode: 'backfill_all',
        companiesProcessed,
        companiesWithClaims,
        totalGenerated,
        totalSkipped,
        errors: allErrors.length > 0 ? allErrors : undefined,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // SINGLE COMPANY MODE
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
