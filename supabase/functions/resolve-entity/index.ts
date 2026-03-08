
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LEGAL_SUFFIXES = [
  ', Inc.', ', Inc', ' Inc.', ' Inc',
  ', LLC', ' LLC',
  ', Corp.', ', Corp', ' Corp.', ' Corp',
  ' Corporation',
  ', Ltd.', ', Ltd', ' Ltd.', ' Ltd',
  ' Holdings', ' Group', ' Company', ' Co.',
  ' Co', ', L.P.', ' L.P.', ' LP',
  ' International', ' Enterprises', ' Industries',
  ' & Co.', ' & Co', ' & Company',
];

function generateAliases(name: string): string[] {
  const aliases = new Set<string>();
  const trimmed = name.trim();
  aliases.add(trimmed);

  // Strip legal suffixes to get base name
  let baseName = trimmed;
  for (const suffix of LEGAL_SUFFIXES) {
    if (baseName.toLowerCase().endsWith(suffix.toLowerCase())) {
      baseName = baseName.slice(0, -suffix.length).trim();
      break;
    }
  }
  aliases.add(baseName);

  // Add common legal variants
  const variants = [
    `${baseName}, Inc.`,
    `${baseName} Inc`,
    `${baseName}, LLC`,
    `${baseName} LLC`,
    `${baseName} Corp`,
    `${baseName} Corporation`,
    `${baseName}, Ltd.`,
    `${baseName} Holdings`,
    `${baseName} Group`,
    `${baseName} Company`,
    `${baseName} Co`,
  ];
  variants.forEach(v => aliases.add(v));

  // Generate abbreviation from multi-word names
  const words = baseName.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    // Initials (e.g., "CMG" from "Chipotle Mexican Grill")
    const initials = words.map(w => w[0].toUpperCase()).join('');
    if (initials.length >= 2 && initials.length <= 5) {
      aliases.add(initials);
    }
    // First word only if distinctive enough
    if (words[0].length >= 4) {
      aliases.add(words[0]);
    }
  }

  // Remove the original to avoid duplication in output
  aliases.delete(trimmed);
  return Array.from(aliases);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[resolve-entity] Resolving: ${companyName} (${companyId})`);

    // 1. Get company record for parent_company field
    const { data: company } = await supabase
      .from('companies')
      .select('name, parent_company, search_query')
      .eq('id', companyId)
      .single();

    // 2. Generate automatic aliases
    const autoAliases = generateAliases(companyName);
    console.log(`[resolve-entity] Generated ${autoAliases.length} auto-aliases`);

    // 3. Store auto-generated aliases (upsert to avoid duplicates)
    const aliasRows = autoAliases.map(alias => ({
      primary_entity_id: companyId,
      related_entity_name: alias,
      relationship_type: 'legal_variant',
      confidence_score: 0.9,
      notes: 'Auto-generated legal variant',
    }));

    if (aliasRows.length > 0) {
      const { error: aliasErr } = await supabase
        .from('entity_relationships')
        .upsert(aliasRows, { onConflict: 'primary_entity_id,related_entity_name,relationship_type', ignoreDuplicates: true });
      if (aliasErr) console.error('[resolve-entity] Alias upsert error:', aliasErr);
    }

    // 4. Store parent company if known
    if (company?.parent_company) {
      await supabase.from('entity_relationships').upsert({
        primary_entity_id: companyId,
        related_entity_name: company.parent_company,
        relationship_type: 'parent_company',
        confidence_score: 0.8,
        notes: 'From company profile',
      }, { onConflict: 'primary_entity_id,related_entity_name,relationship_type', ignoreDuplicates: true });
    }

    // 5. Pull known PAC names from company_candidates
    const { data: pacs } = await supabase
      .from('company_candidates')
      .select('donation_type')
      .eq('company_id', companyId)
      .eq('donation_type', 'corporate-pac');

    // 6. Pull known trade associations
    const { data: tradeAssocs } = await supabase
      .from('company_trade_associations')
      .select('name')
      .eq('company_id', companyId);

    if (tradeAssocs && tradeAssocs.length > 0) {
      const taRows = tradeAssocs.map(ta => ({
        primary_entity_id: companyId,
        related_entity_name: ta.name,
        relationship_type: 'trade_association' as const,
        confidence_score: 0.85,
        notes: 'From company trade associations',
      }));
      await supabase.from('entity_relationships').upsert(taRows, {
        onConflict: 'primary_entity_id,related_entity_name,relationship_type',
        ignoreDuplicates: true,
      });
    }

    // 7. Pull known board affiliations as potential entity links
    const { data: boardAffs } = await supabase
      .from('company_board_affiliations')
      .select('name')
      .eq('company_id', companyId);

    // 8. Use AI to discover additional entities if available
    let aiDiscoveredEntities: any[] = [];
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (LOVABLE_API_KEY) {
      try {
        const prompt = `For the company "${companyName}", provide a JSON array of related corporate entities. Include:
- Known subsidiaries
- Known parent companies
- Known PAC names (e.g., "${companyName} PAC", "${companyName} Political Action Committee")
- Known brand names that are part of this company
- Known ticker symbol

Return ONLY a JSON array of objects with fields: name, relationship_type (one of: subsidiary, parent_company, pac_name, brand_name, ticker), confidence (0-1).
Only include entities you are confident about. Maximum 15 entries.`;

        const aiResp = await fetch('https://ai.lovable.dev/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          // Extract JSON from response
          const jsonMatch = content.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiDiscoveredEntities = Array.isArray(parsed) ? parsed : [];
            console.log(`[resolve-entity] AI discovered ${aiDiscoveredEntities.length} entities`);
          }
        }
      } catch (aiErr) {
        console.warn('[resolve-entity] AI entity discovery failed (non-critical):', aiErr);
      }
    }

    // Store AI-discovered entities
    if (aiDiscoveredEntities.length > 0) {
      const aiRows = aiDiscoveredEntities
        .filter((e: any) => e.name && e.relationship_type)
        .map((e: any) => ({
          primary_entity_id: companyId,
          related_entity_name: e.name,
          relationship_type: ['subsidiary', 'parent_company', 'pac_name', 'brand_name', 'ticker']
            .includes(e.relationship_type) ? e.relationship_type : 'affiliate',
          confidence_score: Math.min(e.confidence || 0.6, 0.85),
          notes: 'AI-discovered entity',
        }));

      await supabase.from('entity_relationships').upsert(aiRows, {
        onConflict: 'primary_entity_id,related_entity_name,relationship_type',
        ignoreDuplicates: true,
      });
    }

    // 9. Fetch the complete resolved entity list
    const { data: allRelationships } = await supabase
      .from('entity_relationships')
      .select('*')
      .eq('primary_entity_id', companyId);

    const searchNames = [companyName];
    const entityMap: Record<string, string> = { [companyName]: 'direct_company' };

    for (const rel of (allRelationships || [])) {
      if (!searchNames.includes(rel.related_entity_name)) {
        searchNames.push(rel.related_entity_name);
        entityMap[rel.related_entity_name] = rel.relationship_type;
      }
    }

    const resolutionLog = {
      canonical_name: companyName,
      total_search_names: searchNames.length,
      aliases_generated: autoAliases.length,
      ai_entities_discovered: aiDiscoveredEntities.length,
      parent_company: company?.parent_company || null,
      trade_associations: tradeAssocs?.length || 0,
      relationships: (allRelationships || []).map((r: any) => ({
        name: r.related_entity_name,
        type: r.relationship_type,
        confidence: r.confidence_score,
      })),
    };

    console.log(`[resolve-entity] Resolved ${searchNames.length} search names for ${companyName}`);

    return new Response(JSON.stringify({
      success: true,
      canonicalName: companyName,
      searchNames,
      entityMap,
      resolutionLog,
      totalRelationships: allRelationships?.length || 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[resolve-entity] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
