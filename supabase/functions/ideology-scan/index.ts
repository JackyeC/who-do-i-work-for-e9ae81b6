const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resilientSearch } from '../_shared/resilient-search.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(JSON.stringify({ success: false, error: 'AI gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: watchlist } = await supabase
      .from('ideology_watchlist')
      .select('id, org_name, category, severity, aliases, splc_designated, adl_designated');

    const watchlistOrgs = watchlist || [];
    const aliasMap = new Map<string, any>();
    for (const w of watchlistOrgs) {
      aliasMap.set(w.org_name.toLowerCase(), w);
      if (w.aliases) {
        for (const alias of w.aliases) aliasMap.set(alias.toLowerCase(), w);
      }
    }

    const searchQueries = [
      `"${companyName}" "Alliance Defending Freedom" OR "Family Research Council" OR "Heritage Foundation" donation sponsorship`,
      `"${companyName}" SPLC hate group white nationalist Christian nationalist ties`,
      `"${companyName}" anti-LGBTQ anti-union voter suppression climate denial funding`,
      `"${companyName}" conversion therapy school voucher private prison reproductive rights lobbying`,
      `"${companyName}" PAC donation extremist organization radical group`,
      `"${companyName}" racial discrimination lawsuit EEOC class action settlement`,
      `"${companyName}" mass firing layoffs DOGE government workforce reduction`,
      `"${companyName}" union busting NLRB unfair labor practice retaliation`,
      `"${companyName}" DEI rollback diversity equity inclusion cuts controversy`,
      `"${companyName}" CEO executive political donation controversy statement`,
    ];

    const { results: allResults, source } = await resilientSearch(searchQueries, firecrawlKey, lovableKey);

    const content = allResults.slice(0, 12).map((r, i) =>
      `[${i + 1}] "${r.title}" (${r.url})\n${r.description}\n${r.markdown?.slice(0, 500) || ''}`
    ).join('\n\n---\n\n');

    const categoryList = ['christian_nationalism', 'white_supremacy', 'anti_lgbtq', 'anti_labor',
      'voter_suppression', 'climate_denial', 'anti_reproductive_rights', 'privatization',
      'racial_discrimination', 'mass_layoffs', 'executive_controversy', 'dei_rollback',
      'worker_retaliation', 'government_influence'];

    const aiPrompt = `You are a corporate accountability analyst for CivicLens. Analyze these search results about "${companyName}" for ties to ideological organizations and movements.

KNOWN WATCHLIST ORGANIZATIONS:
${watchlistOrgs.slice(0, 30).map(w => `- ${w.org_name} (${w.category})${w.splc_designated ? ' [SPLC]' : ''}${w.adl_designated ? ' [ADL]' : ''}`).join('\n')}

CATEGORIES: ${categoryList.join(', ')}

CRITICAL: Do NOT flag commercial brands with religious-sounding names. Only flag SPECIFIC, DOCUMENTED political connections.

Search Results:
${content || 'No search results available. Use your knowledge to provide analysis.'}

Return JSON:
{"flags": [{"orgName": "string", "category": "string", "relationshipType": "string", "description": "string", "amount": null, "evidenceUrl": "string", "severity": "critical|high|medium|low", "confidence": "direct|inferred|unverified"}], "summary": "2-3 paragraph analysis", "riskLevel": "critical|high|medium|low|none"}
Return valid JSON only.`;

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

    let analysis: any = { flags: [], summary: '', riskLevel: 'none' };
    if (aiResp.ok) {
      const aiData = await aiResp.json();
      const raw = aiData.choices?.[0]?.message?.content || '';
      try {
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
        analysis = JSON.parse(jsonMatch[1].trim());
      } catch { analysis.summary = raw.slice(0, 1000); }
    } else {
      if (aiResp.status === 429) return new Response(JSON.stringify({ success: false, error: 'Rate limited.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const FALSE_POSITIVE_NAMES = ["church's chicken", "church & dwight", "christian dior", "christian louboutin", "st. jude", "salvation army thrift", "goodwill industries"];

    const flags = (analysis.flags || [])
      .filter((f: any) => {
        const orgLower = (f.orgName || "").toLowerCase();
        if (FALSE_POSITIVE_NAMES.some(fp => orgLower.includes(fp))) return false;
        if (!f.orgName || f.orgName.trim().length < 3) return false;
        return true;
      })
      .map((f: any) => {
        const match = aliasMap.get(f.orgName?.toLowerCase());
        return {
          company_id: companyId, watchlist_org_id: match?.id || null,
          category: f.category, org_name: f.orgName,
          relationship_type: f.relationshipType || 'lobbying_alignment',
          description: f.description, amount: f.amount,
          evidence_url: f.evidenceUrl, severity: f.severity || 'medium',
          confidence: f.confidence || 'inferred', detected_by: 'ai_scan',
        };
      });

    if (flags.length > 0) {
      await supabase.from('company_ideology_flags').insert(flags);
    }

    const criticalFlags = flags.filter((f: any) => f.severity === 'critical' || f.severity === 'high');
    if (criticalFlags.length > 0) {
      await supabase.from('scan_alerts').insert(criticalFlags.map((f: any) => ({
        company_id: companyId, scan_type: 'ideology', alert_type: 'controversy_detected',
        title: `${f.category.replace(/_/g, ' ')} tie: ${f.org_name}`,
        description: f.description, severity: f.severity,
        data: { category: f.category, orgName: f.org_name, relationship: f.relationship_type },
      })));
    }

    return new Response(JSON.stringify({
      success: true, source, signalsFound: flags.length, sourcesScanned: allResults.length,
      data: { flags: analysis.flags || [], summary: analysis.summary || '', riskLevel: analysis.riskLevel || 'none',
        flagCount: flags.length, alertCount: criticalFlags.length, resultCount: allResults.length }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Ideology scan error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
