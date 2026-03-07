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
    const { companyName, enrichExisting } = await req.json();

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'A valid company name is required (min 2 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedName = companyName.trim().slice(0, 200);

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if company already exists
    const slug = sanitizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { data: existing } = await supabase
      .from('companies')
      .select('id, name, slug')
      .or(`slug.eq.${slug},name.ilike.${sanitizedName}`)
      .limit(1)
      .maybeSingle();

    // If exists and NOT enriching, just return
    if (existing && !enrichExisting) {
      return new Response(JSON.stringify({
        success: true,
        alreadyExists: true,
        company: existing,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Researching company: ${sanitizedName} (enrich: ${!!enrichExisting})`);

    // Use AI to research the company
    const aiPrompt = `You are a corporate political intelligence researcher for CivicLens. Research "${sanitizedName}" and provide comprehensive data about this company.

Return a JSON object with this EXACT structure. Use real, publicly available information. If you're unsure about a value, use reasonable estimates and mark confidence as "inferred". Use null for truly unknown values.

{
  "company": {
    "name": "Official company name",
    "industry": "Primary industry sector",
    "state": "US state of HQ (2-letter code)",
    "revenue": "Annual revenue string like '$50B'",
    "employee_count": "Employee count string like '150,000'",
    "description": "2-3 sentence description of the company and what they do",
    "parent_company": "Parent company name or null",
    "effective_tax_rate": "Estimated effective tax rate like '21%' or null",
    "corporate_pac_exists": true,
    "total_pac_spending": 500000,
    "lobbying_spend": 1000000,
    "government_contracts": 0,
    "subsidies_received": 0,
    "civic_footprint_score": 50,
    "confidence_rating": "medium"
  },
  "executives": [
    {"name": "CEO Name", "title": "Chief Executive Officer", "total_donations": 50000},
    {"name": "CFO Name", "title": "Chief Financial Officer", "total_donations": 25000}
  ],
  "party_breakdown": [
    {"party": "Republican", "amount": 300000, "color": "hsl(0, 72%, 51%)"},
    {"party": "Democrat", "amount": 200000, "color": "hsl(211, 69%, 50%)"},
    {"party": "Other/Independent", "amount": 50000, "color": "hsl(215, 15%, 47%)"}
  ],
  "candidates": [
    {"name": "Politician Name", "party": "Republican", "state": "TX", "amount": 10000, "donation_type": "corporate-pac", "flagged": false}
  ],
  "public_stances": [
    {"topic": "Topic name", "public_position": "What company says publicly", "spending_reality": "Where money actually goes", "gap": "aligned|mixed|direct-conflict"}
  ],
  "dark_money": [
    {"name": "Org Name", "org_type": "501c4", "relationship": "donor", "confidence": "inferred", "description": "Brief description", "estimated_amount": 100000}
  ],
  "board_affiliations": ["US Chamber of Commerce", "Business Roundtable"],
  "revolving_door": [
    {"person": "Person Name", "prior_role": "Former government role", "new_role": "Company role", "confidence": "inferred", "relevance": "How this connection matters"}
  ],
  "spending_history": [
    {"cycle": "2020", "pac_spending": 400000, "lobbying_spend": 800000, "executive_giving": 150000},
    {"cycle": "2022", "pac_spending": 450000, "lobbying_spend": 900000, "executive_giving": 175000},
    {"cycle": "2024", "pac_spending": 500000, "lobbying_spend": 1000000, "executive_giving": 200000}
  ]
}

IMPORTANT: For the "candidates" array, include at least 8-15 real politicians who have received donations from this company's PAC or executives. Include their actual party, state, and estimated amounts. Include both Republican and Democrat recipients. Flag any candidates who are controversial or have notable policy positions relevant to the company.

Return ONLY valid JSON. No markdown, no explanation.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a corporate political intelligence researcher. Return only valid JSON with real, publicly available data about companies. Be thorough with candidate/politician recipient lists.' },
          { role: 'user', content: aiPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      if (status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limited. Please try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: false, error: `AI request failed with status ${status}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    let research: any;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      research = JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error('Failed to parse AI research:', e, content.slice(0, 500));
      return new Response(JSON.stringify({ success: false, error: 'Failed to parse AI research results' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const co = research.company;
    if (!co || !co.name) {
      return new Response(JSON.stringify({ success: false, error: 'AI did not return valid company data' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let companyId: string;
    let companyRecord: any;

    if (existing) {
      // Enrich existing company - update its core data too
      companyId = existing.id;
      companyRecord = existing;
      
      await supabase.from('companies').update({
        description: co.description || undefined,
        effective_tax_rate: co.effective_tax_rate || undefined,
        corporate_pac_exists: co.corporate_pac_exists ?? undefined,
        total_pac_spending: co.total_pac_spending || undefined,
        lobbying_spend: co.lobbying_spend || undefined,
        government_contracts: co.government_contracts || undefined,
        subsidies_received: co.subsidies_received || undefined,
      }).eq('id', companyId);

      // Delete existing related data so we can repopulate
      await Promise.all([
        supabase.from('company_executives').delete().eq('company_id', companyId),
        supabase.from('company_party_breakdown').delete().eq('company_id', companyId),
        supabase.from('company_candidates').delete().eq('company_id', companyId),
        supabase.from('company_public_stances').delete().eq('company_id', companyId),
        supabase.from('company_dark_money').delete().eq('company_id', companyId),
        supabase.from('company_board_affiliations').delete().eq('company_id', companyId),
        supabase.from('company_revolving_door').delete().eq('company_id', companyId),
        supabase.from('company_spending_history').delete().eq('company_id', companyId),
      ]);
    } else {
      // Insert new company
      const finalSlug = co.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const { data: newCompany, error: companyError } = await supabase.from('companies').insert({
        name: co.name,
        slug: finalSlug,
        industry: co.industry || 'Unknown',
        state: co.state || 'N/A',
        revenue: co.revenue || null,
        employee_count: co.employee_count || null,
        description: co.description || null,
        parent_company: co.parent_company || null,
        effective_tax_rate: co.effective_tax_rate || null,
        corporate_pac_exists: co.corporate_pac_exists ?? false,
        total_pac_spending: co.total_pac_spending || 0,
        lobbying_spend: co.lobbying_spend || null,
        government_contracts: co.government_contracts || null,
        subsidies_received: co.subsidies_received || null,
        civic_footprint_score: co.civic_footprint_score || 50,
        confidence_rating: co.confidence_rating || 'inferred',
      }).select('id, name, slug').single();

      if (companyError) {
        console.error('Failed to insert company:', companyError);
        return new Response(JSON.stringify({ success: false, error: `Failed to create company: ${companyError.message}` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      companyId = newCompany.id;
      companyRecord = newCompany;
    }

    const insertErrors: string[] = [];

    // Insert executives
    if (research.executives?.length) {
      const { error } = await supabase.from('company_executives').insert(
        research.executives.slice(0, 10).map((e: any) => ({
          company_id: companyId,
          name: e.name,
          title: e.title,
          total_donations: e.total_donations || 0,
        }))
      );
      if (error) insertErrors.push(`executives: ${error.message}`);
    }

    // Insert party breakdown
    if (research.party_breakdown?.length) {
      const { error } = await supabase.from('company_party_breakdown').insert(
        research.party_breakdown.map((p: any) => ({
          company_id: companyId,
          party: p.party,
          amount: p.amount || 0,
          color: p.color || 'hsl(215, 15%, 47%)',
        }))
      );
      if (error) insertErrors.push(`party_breakdown: ${error.message}`);
    }

    // Insert candidates
    if (research.candidates?.length) {
      const { error } = await supabase.from('company_candidates').insert(
        research.candidates.slice(0, 30).map((c: any) => ({
          company_id: companyId,
          name: c.name,
          party: c.party,
          state: c.state || co.state || 'N/A',
          amount: c.amount || 0,
          donation_type: c.donation_type || 'corporate-pac',
          flagged: c.flagged || false,
          flag_reason: c.flag_reason || null,
        }))
      );
      if (error) insertErrors.push(`candidates: ${error.message}`);
    }

    // Insert public stances
    if (research.public_stances?.length) {
      const { error } = await supabase.from('company_public_stances').insert(
        research.public_stances.slice(0, 10).map((s: any) => ({
          company_id: companyId,
          topic: s.topic,
          public_position: s.public_position,
          spending_reality: s.spending_reality,
          gap: s.gap || 'mixed',
        }))
      );
      if (error) insertErrors.push(`public_stances: ${error.message}`);
    }

    // Insert dark money
    if (research.dark_money?.length) {
      const { error } = await supabase.from('company_dark_money').insert(
        research.dark_money.slice(0, 10).map((d: any) => ({
          company_id: companyId,
          name: d.name,
          org_type: d.org_type || '501c4',
          relationship: d.relationship || 'donor',
          confidence: d.confidence || 'inferred',
          description: d.description || null,
          estimated_amount: d.estimated_amount || null,
        }))
      );
      if (error) insertErrors.push(`dark_money: ${error.message}`);
    }

    // Insert board affiliations
    if (research.board_affiliations?.length) {
      const { error } = await supabase.from('company_board_affiliations').insert(
        research.board_affiliations.slice(0, 10).map((name: string) => ({
          company_id: companyId,
          name: typeof name === 'string' ? name : String(name),
        }))
      );
      if (error) insertErrors.push(`board_affiliations: ${error.message}`);
    }

    // Insert revolving door
    if (research.revolving_door?.length) {
      const { error } = await supabase.from('company_revolving_door').insert(
        research.revolving_door.slice(0, 10).map((r: any) => ({
          company_id: companyId,
          person: r.person,
          prior_role: r.prior_role,
          new_role: r.new_role,
          confidence: r.confidence || 'inferred',
          relevance: r.relevance || null,
        }))
      );
      if (error) insertErrors.push(`revolving_door: ${error.message}`);
    }

    // Insert spending history
    if (research.spending_history?.length) {
      const { error } = await supabase.from('company_spending_history').insert(
        research.spending_history.slice(0, 10).map((h: any) => ({
          company_id: companyId,
          cycle: h.cycle,
          pac_spending: h.pac_spending || 0,
          lobbying_spend: h.lobbying_spend || 0,
          executive_giving: h.executive_giving || 0,
        }))
      );
      if (error) insertErrors.push(`spending_history: ${error.message}`);
    }

    if (insertErrors.length) {
      console.error('Some inserts failed:', insertErrors);
    }

    console.log(`Successfully ${existing ? 'enriched' : 'created'} company: ${co.name} (${companyId})`);

    return new Response(JSON.stringify({
      success: true,
      alreadyExists: false,
      enriched: !!existing,
      company: companyRecord,
      tablesPopulated: {
        executives: research.executives?.length || 0,
        party_breakdown: research.party_breakdown?.length || 0,
        candidates: research.candidates?.length || 0,
        public_stances: research.public_stances?.length || 0,
        dark_money: research.dark_money?.length || 0,
        board_affiliations: research.board_affiliations?.length || 0,
        revolving_door: research.revolving_door?.length || 0,
        spending_history: research.spending_history?.length || 0,
      },
      warnings: insertErrors.length ? insertErrors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Company research error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
