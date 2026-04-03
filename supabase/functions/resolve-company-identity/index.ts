const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Normalize a company name to canonical form for matching.
 */
function canonicalize(name: string): string {
  let s = name.toLowerCase().trim();
  // Strip legal suffixes
  s = s.replace(/,?\s*(inc\.?|llc|corp\.?|corporation|ltd\.?|l\.?p\.?|holdings|group|company|co\.?|enterprises|industries|international)\s*$/gi, '');
  // Remove non-alphanumeric except spaces
  s = s.replace(/[^a-z0-9\s]/g, '');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Simple similarity score between two canonical names (Jaccard on trigrams).
 */
function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const trigramsOf = (s: string) => {
    const t = new Set<string>();
    const padded = `  ${s} `;
    for (let i = 0; i < padded.length - 2; i++) t.add(padded.slice(i, i + 3));
    return t;
  };
  const ta = trigramsOf(a);
  const tb = trigramsOf(b);
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Generate common aliases from a company name.
 */
function generateAliases(name: string): string[] {
  const aliases = new Set<string>();
  const trimmed = name.trim();

  const suffixes = [
    ', Inc.', ', Inc', ' Inc.', ' Inc', ', LLC', ' LLC',
    ', Corp.', ', Corp', ' Corp.', ' Corp', ' Corporation',
    ', Ltd.', ', Ltd', ' Ltd.', ' Ltd', ' Holdings', ' Group',
    ' Company', ' Co.', ' Co', ', L.P.', ' L.P.', ' LP',
    ' International', ' Enterprises', ' Industries',
  ];

  let baseName = trimmed;
  for (const suffix of suffixes) {
    if (baseName.toLowerCase().endsWith(suffix.toLowerCase())) {
      baseName = baseName.slice(0, -suffix.length).trim();
      break;
    }
  }

  if (baseName !== trimmed) aliases.add(baseName);

  // Common variants
  for (const sfx of [', Inc.', ' Inc', ' LLC', ' Corp', ' Corporation', ', Ltd.']) {
    aliases.add(`${baseName}${sfx}`);
  }

  // & vs "and"
  if (baseName.includes(' & ')) aliases.add(baseName.replace(/ & /g, ' and '));
  if (baseName.includes(' and ')) aliases.add(baseName.replace(/ and /g, ' & '));

  aliases.delete(trimmed);
  return Array.from(aliases);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { companyId, mode } = await req.json();
    // mode: 'single' (resolve one company) or 'scan' (scan all for duplicates)

    if (mode === 'scan') {
      // Scan all companies for potential duplicates
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, canonical_name, domain, website_url')
        .order('name');

      if (!companies || companies.length === 0) {
        return new Response(JSON.stringify({ success: true, duplicatesFound: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const duplicates: { a: string; b: string; score: number; reason: string }[] = [];

      for (let i = 0; i < companies.length; i++) {
        for (let j = i + 1; j < companies.length; j++) {
          const a = companies[i];
          const b = companies[j];
          const ca = a.canonical_name || canonicalize(a.name);
          const cb = b.canonical_name || canonicalize(b.name);

          // Exact canonical match
          if (ca === cb && ca.length > 2) {
            duplicates.push({ a: a.id, b: b.id, score: 1.0, reason: 'exact_canonical_match' });
            continue;
          }

          // Same domain
          if (a.domain && b.domain && a.domain === b.domain) {
            duplicates.push({ a: a.id, b: b.id, score: 0.95, reason: 'same_domain' });
            continue;
          }

          // High trigram similarity
          const sim = trigramSimilarity(ca, cb);
          if (sim >= 0.7) {
            duplicates.push({ a: a.id, b: b.id, score: sim, reason: 'name_similarity' });
          }
        }
      }

      // Insert flagged duplicates
      if (duplicates.length > 0) {
        const rows = duplicates.map(d => ({
          company_a_id: d.a,
          company_b_id: d.b,
          similarity_score: d.score,
          match_reason: d.reason,
          status: 'pending',
        }));

        await supabase.from('potential_duplicates').upsert(rows, {
          onConflict: 'company_a_id,company_b_id',
          ignoreDuplicates: true,
        });
      }

      return new Response(JSON.stringify({ success: true, duplicatesFound: duplicates.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single company resolution
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'companyId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, name, website_url, domain, canonical_name, identity_status')
      .eq('id', companyId)
      .single();

    if (!company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate and store aliases
    const aliases = generateAliases(company.name);
    const aliasRows = aliases.map(alias => ({
      company_id: companyId,
      alias_name: alias,
      alias_type: 'legal_variant',
      confidence: 0.9,
    }));

    if (aliasRows.length > 0) {
      await supabase.from('company_aliases').upsert(aliasRows, {
        onConflict: 'company_id,alias_name',
        ignoreDuplicates: true,
      });
    }

    // If website_url missing, try AI discovery
    let domainDiscovery: { url: string; confidence: string } | null = null;
    if (!company.website_url) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        try {
          const aiResp = await fetch('https://ai.lovable.dev/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{
                role: 'user',
                content: `What is the official website URL for the company "${company.name}"? Return ONLY a JSON object with fields: url (string), confidence (one of: high, medium, low). If you are not sure, set confidence to "low". Return ONLY the JSON, no other text.`,
              }],
            }),
          });

          if (aiResp.ok) {
            const aiData = await aiResp.json();
            const content = aiData.choices?.[0]?.message?.content || '';
            const jsonMatch = content.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.url && parsed.confidence) {
                domainDiscovery = parsed;

                // Only auto-fill if high confidence
                if (parsed.confidence === 'high') {
                  const domain = parsed.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
                  await supabase.from('companies').update({
                    website_url: parsed.url,
                    domain,
                    domain_confidence: 'high',
                  }).eq('id', companyId);
                } else {
                  // Store confidence but don't auto-fill
                  await supabase.from('companies').update({
                    domain_confidence: parsed.confidence,
                  }).eq('id', companyId);
                }
              }
            }
          }
        } catch (err) {
          console.warn('[resolve-company-identity] AI domain discovery failed:', err);
        }
      }
    }

    // Find potential duplicates for this company
    const cn = company.canonical_name || canonicalize(company.name);
    const { data: allCompanies } = await supabase
      .from('companies')
      .select('id, canonical_name, domain')
      .neq('id', companyId)
      .limit(500);

    const dupes: { id: string; score: number; reason: string }[] = [];
    for (const other of (allCompanies || [])) {
      const otherCn = other.canonical_name || '';
      if (otherCn === cn && cn.length > 2) {
        dupes.push({ id: other.id, score: 1.0, reason: 'exact_canonical_match' });
      } else if (company.domain && other.domain && company.domain === other.domain) {
        dupes.push({ id: other.id, score: 0.95, reason: 'same_domain' });
      } else {
        const sim = trigramSimilarity(cn, otherCn);
        if (sim >= 0.7) {
          dupes.push({ id: other.id, score: sim, reason: 'name_similarity' });
        }
      }
    }

    if (dupes.length > 0) {
      const dupeRows = dupes.map(d => ({
        company_a_id: companyId < d.id ? companyId : d.id,
        company_b_id: companyId < d.id ? d.id : companyId,
        similarity_score: d.score,
        match_reason: d.reason,
        status: 'pending',
      }));
      await supabase.from('potential_duplicates').upsert(dupeRows, {
        onConflict: 'company_a_id,company_b_id',
        ignoreDuplicates: true,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      companyId,
      canonicalName: cn,
      aliasesGenerated: aliases.length,
      domainDiscovery,
      potentialDuplicates: dupes.length,
      identityStatus: company.identity_status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[resolve-company-identity] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
