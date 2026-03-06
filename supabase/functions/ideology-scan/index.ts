const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    if (!firecrawlKey || !lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Required API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Load watchlist org names for matching
    const { data: watchlist } = await supabase
      .from('ideology_watchlist')
      .select('id, org_name, category, severity, aliases, splc_designated, adl_designated');

    const watchlistOrgs = watchlist || [];
    const orgNames = watchlistOrgs.map(w => w.org_name);
    const aliasMap = new Map<string, any>();
    for (const w of watchlistOrgs) {
      aliasMap.set(w.org_name.toLowerCase(), w);
      if (w.aliases) {
        for (const alias of w.aliases) {
          aliasMap.set(alias.toLowerCase(), w);
        }
      }
    }

    // 2. Search for company ties to these orgs
    const searchQueries = [
      `"${companyName}" "Alliance Defending Freedom" OR "Family Research Council" OR "Heritage Foundation" OR "Council for National Policy" OR "ALEC" donation sponsorship`,
      `"${companyName}" SPLC hate group white nationalist Christian nationalist ties`,
      `"${companyName}" anti-LGBTQ anti-union voter suppression climate denial funding`,
      `"${companyName}" conversion therapy school voucher private prison reproductive rights lobbying`,
      `"${companyName}" PAC donation extremist organization radical group`,
    ];

    const allResults: any[] = [];
    for (const query of searchQueries) {
      try {
        const resp = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 5, scrapeOptions: { formats: ['markdown'] } }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.data) {
            allResults.push(...data.data.map((r: any) => ({
              title: r.title || '', url: r.url || '',
              description: r.description || '',
              markdown: (r.markdown || '').slice(0, 2000), query,
            })));
          }
        }
      } catch (e) {
        console.error(`Search failed: ${query}`, e);
      }
    }

    // 3. AI analysis with watchlist context
    const content = allResults.slice(0, 12).map((r, i) =>
      `[${i + 1}] "${r.title}" (${r.url})\n${r.description}\n${r.markdown?.slice(0, 500) || ''}`
    ).join('\n\n---\n\n');

    const categoryList = [
      'christian_nationalism', 'white_supremacy', 'anti_lgbtq', 'anti_labor',
      'voter_suppression', 'climate_denial', 'anti_reproductive_rights', 'privatization'
    ];

    const aiPrompt = `You are a corporate accountability analyst for CivicLens. Analyze these search results about "${companyName}" for ties to ideological organizations and movements.

KNOWN WATCHLIST ORGANIZATIONS (match against these):
${watchlistOrgs.slice(0, 30).map(w => `- ${w.org_name} (${w.category})${w.splc_designated ? ' [SPLC HATE GROUP]' : ''}${w.adl_designated ? ' [ADL DESIGNATED]' : ''}`).join('\n')}

CATEGORIES TO FLAG: ${categoryList.join(', ')}

Search Results:
${content}

Return JSON:
{
  "flags": [
    {
      "orgName": "organization name",
      "category": "one of: ${categoryList.join('|')}",
      "relationshipType": "direct_funding|pac_contribution|executive_donation|board_membership|trade_association|lobbying_alignment|event_sponsorship|foundation_grant",
      "description": "specific evidence of the connection",
      "amount": number|null,
      "evidenceUrl": "source URL",
      "severity": "critical|high|medium|low",
      "confidence": "direct|inferred|unverified"
    }
  ],
  "summary": "2-3 paragraph analysis of ideological alignment patterns",
  "riskLevel": "critical|high|medium|low|none"
}

Only include flags with actual evidence. Be specific about the nature of each connection. Return valid JSON only.`;

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
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        analysis.summary = raw.slice(0, 1000);
      }
    } else {
      const status = aiResp.status;
      if (status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limited. Please try again.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 4. Store flags and match to watchlist
    const flags = (analysis.flags || []).map((f: any) => {
      const match = aliasMap.get(f.orgName?.toLowerCase());
      return {
        company_id: companyId,
        watchlist_org_id: match?.id || null,
        category: f.category,
        org_name: f.orgName,
        relationship_type: f.relationshipType || 'lobbying_alignment',
        description: f.description,
        amount: f.amount,
        evidence_url: f.evidenceUrl,
        severity: f.severity || 'medium',
        confidence: f.confidence || 'inferred',
        detected_by: 'ai_scan',
      };
    });

    if (flags.length > 0) {
      const { error } = await supabase.from('company_ideology_flags').insert(flags);
      if (error) console.error('Insert ideology flags error:', error);
    }

    // 5. Create alerts for critical/high findings
    const criticalFlags = flags.filter((f: any) => f.severity === 'critical' || f.severity === 'high');
    if (criticalFlags.length > 0) {
      const alerts = criticalFlags.map((f: any) => ({
        company_id: companyId,
        scan_type: 'ideology',
        alert_type: 'controversy_detected',
        title: `${f.category.replace(/_/g, ' ')} tie: ${f.org_name}`,
        description: f.description,
        severity: f.severity,
        data: { category: f.category, orgName: f.org_name, relationship: f.relationship_type },
      }));
      await supabase.from('scan_alerts').insert(alerts);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        flags: analysis.flags || [],
        summary: analysis.summary || '',
        riskLevel: analysis.riskLevel || 'none',
        flagCount: flags.length,
        alertCount: criticalFlags.length,
        resultCount: allResults.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Ideology scan error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
