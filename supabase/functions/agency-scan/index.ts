const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resilientSearch } from '../_shared/resilient-search.ts';
const CONTROVERSIAL_AGENCIES = [
  { name: 'Immigration and Customs Enforcement', acronym: 'ICE', category: 'immigration_enforcement' },
  { name: 'Customs and Border Protection', acronym: 'CBP', category: 'immigration_enforcement' },
  { name: 'Department of Homeland Security', acronym: 'DHS', category: 'surveillance' },
  { name: 'Department of Defense', acronym: 'DOD', category: 'military' },
  { name: 'National Security Agency', acronym: 'NSA', category: 'surveillance' },
  { name: 'Central Intelligence Agency', acronym: 'CIA', category: 'surveillance' },
  { name: 'Federal Bureau of Prisons', acronym: 'BOP', category: 'private_prisons' },
  { name: 'Drug Enforcement Administration', acronym: 'DEA', category: 'law_enforcement' },
  { name: 'Bureau of Alcohol Tobacco Firearms', acronym: 'ATF', category: 'law_enforcement' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName } = await req.json();

    if (!companyId || !companyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId and companyName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for agency contracts + international ties
    const searchQueries = [
      `${companyName} ICE CBP DHS contract federal government 2024 2025`,
      `${companyName} government contract military defense surveillance`,
      `${companyName} FARA foreign agent lobbying international`,
      `${companyName} China Saudi Arabia Russia human rights supply chain labor`,
      `${companyName} forced labor supply chain controversy`,
    ];

    const { results: searchResults } = await resilientSearch(searchQueries, firecrawlKey, lovableKey);
    const allResults = searchResults.map((r: any) => ({
      title: r.title || '', url: r.url || '',
      description: r.description || '',
      markdown: (r.markdown || '').slice(0, 2000), query: r.query,
    }));

    // AI analysis
    const content = allResults.slice(0, 12).map((r, i) =>
      `[${i + 1}] "${r.title}" (${r.url})\n${r.description}\n${r.markdown?.slice(0, 500) || ''}`
    ).join('\n\n---\n\n');

    const aiPrompt = `You are a corporate accountability analyst for CivicLens. Analyze these search results about "${companyName}".

Search Results:
${content}

Return JSON with this structure:
{
  "agencyContracts": [
    {"agencyName": "string", "agencyAcronym": "string", "description": "string", "estimatedValue": number|null, "controversyFlag": boolean, "controversyCategory": "immigration_enforcement|surveillance|military|private_prisons|law_enforcement", "controversyDescription": "string|null", "fiscalYear": number|null, "source": "string", "confidence": "direct|inferred|unverified"}
  ],
  "internationalInfluence": [
    {"country": "string", "influenceType": "fara_registration|foreign_lobbying|authoritarian_business|joint_venture", "entityName": "string|null", "description": "string", "amount": number|null, "confidence": "direct|inferred|unverified"}
  ],
  "supplyChainFlags": [
    {"country": "string", "flagType": "forced_labor|human_rights|authoritarian_regime|conflict_minerals|environmental", "description": "string", "severity": "high|medium|low", "entityName": "string|null", "source": "string", "confidence": "direct|inferred|unverified"}
  ],
  "summary": "2-3 paragraph summary of key findings"
}

Only include items with evidence. Return valid JSON only.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a corporate accountability analyst. Return only valid JSON.' },
          { role: 'user', content: aiPrompt },
        ],
      }),
    });

    let analysis: any = { agencyContracts: [], internationalInfluence: [], supplyChainFlags: [], summary: '' };

    if (aiResp.ok) {
      const aiData = await aiResp.json();
      const raw = aiData.choices?.[0]?.message?.content || '';
      try {
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
        analysis = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        analysis.summary = raw.slice(0, 1000);
      }
    }

    // Store results
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Store agency contracts
    const contracts = (analysis.agencyContracts || []).map((c: any) => ({
      company_id: companyId,
      agency_name: c.agencyName,
      agency_acronym: c.agencyAcronym,
      contract_description: c.description,
      contract_value: c.estimatedValue,
      controversy_flag: c.controversyFlag || false,
      controversy_category: c.controversyCategory,
      controversy_description: c.controversyDescription,
      fiscal_year: c.fiscalYear,
      source: c.source,
      confidence: c.confidence || 'inferred',
    }));

    if (contracts.length > 0) {
      const { error } = await supabase.from('company_agency_contracts').insert(contracts);
      if (error) console.error('Insert agency contracts error:', error);
    }

    // Store international influence
    const intl = (analysis.internationalInfluence || []).map((i: any) => ({
      company_id: companyId,
      country: i.country,
      influence_type: i.influenceType,
      entity_name: i.entityName,
      description: i.description,
      amount: i.amount,
      confidence: i.confidence || 'inferred',
    }));

    if (intl.length > 0) {
      const { error } = await supabase.from('company_international_influence').insert(intl);
      if (error) console.error('Insert intl influence error:', error);
    }

    // Store supply chain flags
    const scFlags = (analysis.supplyChainFlags || []).map((f: any) => ({
      company_id: companyId,
      country: f.country,
      flag_type: f.flagType,
      description: f.description,
      severity: f.severity || 'medium',
      entity_name: f.entityName,
      source: f.source,
      confidence: f.confidence || 'inferred',
    }));

    if (scFlags.length > 0) {
      const { error } = await supabase.from('company_supply_chain_flags').insert(scFlags);
      if (error) console.error('Insert supply chain flags error:', error);
    }

    // Create alerts for controversial findings
    const alerts: any[] = [];
    for (const c of contracts.filter((c: any) => c.controversy_flag)) {
      alerts.push({
        company_id: companyId,
        scan_type: 'agency',
        alert_type: 'controversy_detected',
        title: `${c.agency_acronym || c.agency_name} contract flagged`,
        description: c.controversy_description || c.contract_description,
        severity: 'high',
        data: { agency: c.agency_name, value: c.contract_value },
      });
    }
    for (const f of scFlags.filter((f: any) => f.severity === 'high')) {
      alerts.push({
        company_id: companyId,
        scan_type: 'international',
        alert_type: 'controversy_detected',
        title: `Supply chain flag: ${f.country}`,
        description: f.description,
        severity: 'high',
        data: { country: f.country, flagType: f.flag_type },
      });
    }

    if (alerts.length > 0) {
      await supabase.from('scan_alerts').insert(alerts);
    }

    // Update scan schedule
    await supabase.from('scan_schedules').upsert({
      company_id: companyId,
      scan_type: 'agency',
      last_scan_at: new Date().toISOString(),
      next_scan_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      last_scan_status: 'completed',
    }, { onConflict: 'company_id,scan_type' }).select();

    const totalSignals = (analysis.agencyContracts || []).length + (analysis.internationalInfluence || []).length + (analysis.supplyChainFlags || []).length;
    return new Response(JSON.stringify({
      success: true,
      signalsFound: totalSignals,
      sourcesScanned: allResults.length,
      data: {
        agencyContracts: analysis.agencyContracts || [],
        internationalInfluence: analysis.internationalInfluence || [],
        supplyChainFlags: analysis.supplyChainFlags || [],
        summary: analysis.summary || '',
        alertCount: alerts.length,
        resultCount: allResults.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Agency scan error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
