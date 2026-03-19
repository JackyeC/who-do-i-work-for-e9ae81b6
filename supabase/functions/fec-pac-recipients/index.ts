/**
 * FEC PAC Recipients
 * 
 * Queries OpenFEC API to find PAC disbursement recipients for a company,
 * stores them in company_candidates, and returns the results.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FEC_BASE = 'https://api.open.fec.gov/v1';

interface Disbursement {
  recipient_name: string;
  recipient_state: string;
  disbursement_amount: number;
  disbursement_description: string;
  recipient_committee_id?: string;
  memo_text?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const fecApiKey = Deno.env.get('OPENFEC_API_KEY');

  if (!fecApiKey) {
    return new Response(JSON.stringify({ error: 'FEC API key not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if we already have candidates (race condition guard)
    const { data: existing } = await supabase
      .from('company_candidates')
      .select('id')
      .eq('company_id', companyId)
      .limit(1);

    if (existing && existing.length > 0) {
      const { data: allCandidates } = await supabase
        .from('company_candidates')
        .select('*')
        .eq('company_id', companyId)
        .order('amount', { ascending: false });
      return new Response(JSON.stringify({ candidates: allCandidates, source: 'cached' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Find the company's PAC committee(s)
    const cleanName = companyName.replace(/[,.']/g, '').replace(/\s+inc$/i, '').replace(/\s+corp$/i, '').trim();
    const committeesUrl = `${FEC_BASE}/committees/?q=${encodeURIComponent(cleanName)}&committee_type=O&committee_type=U&committee_type=W&api_key=${fecApiKey}&per_page=5`;
    
    console.log(`[fec-pac-recipients] Searching committees for: ${cleanName}`);
    const committeesRes = await fetch(committeesUrl);
    if (!committeesRes.ok) {
      throw new Error(`FEC committees API returned ${committeesRes.status}`);
    }
    const committeesData = await committeesRes.json();
    const committees = committeesData.results || [];

    if (committees.length === 0) {
      // Try broader search without committee type filter
      const broaderUrl = `${FEC_BASE}/committees/?q=${encodeURIComponent(cleanName)}&api_key=${fecApiKey}&per_page=5`;
      const broaderRes = await fetch(broaderUrl);
      const broaderData = await broaderRes.json();
      committees.push(...(broaderData.results || []));
    }

    if (committees.length === 0) {
      return new Response(JSON.stringify({ 
        candidates: [], 
        source: 'fec',
        message: `No PAC committees found for "${companyName}" on FEC.gov` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[fec-pac-recipients] Found ${committees.length} committee(s): ${committees.map((c: any) => c.committee_id).join(', ')}`);

    // Step 2: Fetch disbursements for each committee
    const allDisbursements: Disbursement[] = [];
    for (const committee of committees.slice(0, 3)) {
      const disbUrl = `${FEC_BASE}/schedules/schedule_b/?committee_id=${committee.committee_id}&sort=-disbursement_amount&per_page=50&api_key=${fecApiKey}&two_year_transaction_period=2024&two_year_transaction_period=2022`;
      
      const disbRes = await fetch(disbUrl);
      if (!disbRes.ok) {
        console.warn(`[fec-pac-recipients] Disbursements failed for ${committee.committee_id}: ${disbRes.status}`);
        continue;
      }
      const disbData = await disbRes.json();
      allDisbursements.push(...(disbData.results || []));
      
      // Throttle
      await new Promise(r => setTimeout(r, 500));
    }

    if (allDisbursements.length === 0) {
      return new Response(JSON.stringify({ 
        candidates: [], 
        source: 'fec',
        message: 'Committee found but no disbursement records available' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Aggregate disbursements by recipient
    const recipientMap = new Map<string, {
      name: string;
      state: string;
      totalAmount: number;
      donationType: string;
      descriptions: string[];
    }>();

    for (const d of allDisbursements) {
      const name = (d.recipient_name || '').trim();
      if (!name || name.length < 2) continue;

      const key = name.toUpperCase();
      const existing = recipientMap.get(key);
      if (existing) {
        existing.totalAmount += d.disbursement_amount || 0;
        if (d.disbursement_description && !existing.descriptions.includes(d.disbursement_description)) {
          existing.descriptions.push(d.disbursement_description);
        }
      } else {
        recipientMap.set(key, {
          name,
          state: d.recipient_state || 'US',
          totalAmount: d.disbursement_amount || 0,
          donationType: d.memo_text?.toLowerCase().includes('earmark') ? 'Earmarked' : 'PAC Direct',
          descriptions: d.disbursement_description ? [d.disbursement_description] : [],
        });
      }
    }

    // Sort by total amount
    const sortedRecipients = [...recipientMap.values()]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 30);

    // Step 4: Try to infer party from description or recipient committee lookup
    // Simple heuristics
    function inferParty(name: string, descriptions: string[]): string {
      const combined = `${name} ${descriptions.join(' ')}`.toUpperCase();
      if (combined.includes('REPUBLICAN') || combined.includes('GOP') || combined.includes('NRCC') || combined.includes('NRSC')) return 'Republican';
      if (combined.includes('DEMOCRAT') || combined.includes('DNC') || combined.includes('DCCC') || combined.includes('DSCC')) return 'Democrat';
      return 'Other';
    }

    // Step 5: Insert into company_candidates
    const candidateRows = sortedRecipients.map(r => ({
      company_id: companyId,
      name: r.name,
      party: inferParty(r.name, r.descriptions),
      state: r.state || 'US',
      amount: Math.round(r.totalAmount),
      donation_type: r.donationType,
      flagged: false,
    }));

    if (candidateRows.length > 0) {
      const { error: insertError } = await supabase
        .from('company_candidates')
        .insert(candidateRows);

      if (insertError) {
        console.error('[fec-pac-recipients] Insert error:', insertError);
        // Still return the data even if storage fails
      }
    }

    // Fetch stored results (will include generated IDs)
    const { data: storedCandidates } = await supabase
      .from('company_candidates')
      .select('*')
      .eq('company_id', companyId)
      .order('amount', { ascending: false });

    console.log(`[fec-pac-recipients] Stored ${candidateRows.length} recipients for ${companyName}`);

    return new Response(JSON.stringify({ 
      candidates: storedCandidates || candidateRows,
      source: 'fec',
      committeesFound: committees.length,
      disbursementsProcessed: allDisbursements.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[fec-pac-recipients] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      candidates: [],
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
