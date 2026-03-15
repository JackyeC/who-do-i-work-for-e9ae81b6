/**
 * OpenSanctions Screening Edge Function
 * 
 * Screens companies and their executives against the OpenSanctions database
 * for sanctions, PEP status, crime, and watchlist exposure.
 * API: https://api.opensanctions.org (free for non-commercial use)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OS_API = 'https://api.opensanctions.org';

interface MatchResult {
  id: string;
  caption: string;
  schema: string;
  properties: Record<string, string[]>;
  datasets: string[];
  referents: string[];
  score: number;
  features: Record<string, number>;
  match: boolean;
  topics?: string[];
  first_seen?: string;
  last_seen?: string;
}

async function searchOpenSanctions(query: string, schema: string = 'Thing'): Promise<MatchResult[]> {
  try {
    const params = new URLSearchParams({ q: query, schema, limit: '10' });
    const resp = await fetch(`${OS_API}/search/default?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!resp.ok) {
      console.warn(`[sync-opensanctions] API returned ${resp.status} for query: ${query}`);
      return [];
    }

    const data = await resp.json();
    return (data.results || []).filter((r: MatchResult) => r.score > 0.5);
  } catch (err) {
    console.error('[sync-opensanctions] Search error:', err);
    return [];
  }
}

async function matchEntity(name: string, schema: string = 'LegalEntity'): Promise<MatchResult[]> {
  try {
    const resp = await fetch(`${OS_API}/match/default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        queries: {
          q1: { schema, properties: { name: [name] } }
        }
      }),
    });

    if (!resp.ok) {
      // Fall back to search
      return searchOpenSanctions(name, schema);
    }

    const data = await resp.json();
    const results = data.responses?.q1?.results || [];
    return results.filter((r: MatchResult) => r.score > 0.5);
  } catch {
    return searchOpenSanctions(name, schema);
  }
}

function extractTopics(result: MatchResult): string[] {
  const topics: string[] = [];
  const props = result.properties || {};
  if (props.topics) topics.push(...props.topics);
  // Infer from datasets
  for (const ds of result.datasets || []) {
    if (ds.includes('sanction')) topics.push('sanction');
    if (ds.includes('pep') || ds.includes('political')) topics.push('pep');
    if (ds.includes('crime') || ds.includes('wanted')) topics.push('crime');
    if (ds.includes('debarment')) topics.push('debarment');
  }
  return [...new Set(topics)];
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
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-opensanctions] START: ${companyName} (${companyId})`);

    const records: any[] = [];
    let totalMatches = 0;

    // 1. Screen the company itself
    const companyMatches = await matchEntity(companyName, 'Company');
    for (const match of companyMatches) {
      const topics = extractTopics(match);
      records.push({
        company_id: companyId,
        entity_name: match.caption,
        match_type: 'company',
        schema_type: match.schema,
        sanctions_list: (match.datasets || []).join(', '),
        dataset: (match.datasets || [])[0] || null,
        topics,
        match_score: match.score,
        properties: match.properties || {},
        source_url: `https://opensanctions.org/entities/${match.id}/`,
        first_seen: match.first_seen || null,
        last_seen: match.last_seen || null,
        screened_at: new Date().toISOString(),
      });
      totalMatches++;
    }

    // 2. Screen executives
    const { data: executives } = await supabase
      .from('company_executives')
      .select('name, title')
      .eq('company_id', companyId)
      .neq('verification_status', 'former')
      .limit(10);

    if (executives?.length) {
      for (const exec of executives) {
        // Rate limit - be respectful
        await new Promise(r => setTimeout(r, 300));
        
        const execMatches = await matchEntity(exec.name, 'Person');
        for (const match of execMatches) {
          const topics = extractTopics(match);
          records.push({
            company_id: companyId,
            entity_name: match.caption,
            match_type: 'executive',
            schema_type: match.schema,
            sanctions_list: (match.datasets || []).join(', '),
            dataset: (match.datasets || [])[0] || null,
            topics,
            match_score: match.score,
            properties: { ...match.properties, matched_executive: [exec.name], title: [exec.title] },
            source_url: `https://opensanctions.org/entities/${match.id}/`,
            first_seen: match.first_seen || null,
            last_seen: match.last_seen || null,
            screened_at: new Date().toISOString(),
          });
          totalMatches++;
        }
      }
    }

    // 3. Screen board members
    const { data: board } = await supabase
      .from('board_members')
      .select('name, title')
      .eq('company_id', companyId)
      .neq('verification_status', 'former')
      .limit(10);

    if (board?.length) {
      for (const member of board) {
        await new Promise(r => setTimeout(r, 300));
        
        const boardMatches = await matchEntity(member.name, 'Person');
        for (const match of boardMatches) {
          const topics = extractTopics(match);
          records.push({
            company_id: companyId,
            entity_name: match.caption,
            match_type: 'board_member',
            schema_type: match.schema,
            sanctions_list: (match.datasets || []).join(', '),
            dataset: (match.datasets || [])[0] || null,
            topics,
            match_score: match.score,
            properties: { ...match.properties, matched_board_member: [member.name], title: [member.title] },
            source_url: `https://opensanctions.org/entities/${match.id}/`,
            first_seen: match.first_seen || null,
            last_seen: match.last_seen || null,
            screened_at: new Date().toISOString(),
          });
          totalMatches++;
        }
      }
    }

    // Upsert - clear old screenings first
    if (records.length > 0) {
      await supabase
        .from('company_sanctions_screening')
        .delete()
        .eq('company_id', companyId);

      const { error } = await supabase
        .from('company_sanctions_screening')
        .insert(records);

      if (error) console.error('[sync-opensanctions] Insert error:', error);
    }

    // Update report section cache
    await supabase.from('company_report_sections').upsert({
      company_id: companyId,
      section_type: 'sanctions_screening',
      content: {
        total_matches: totalMatches,
        company_matches: records.filter(r => r.match_type === 'company').length,
        executive_matches: records.filter(r => r.match_type === 'executive').length,
        board_matches: records.filter(r => r.match_type === 'board_member').length,
        high_risk_topics: [...new Set(records.flatMap(r => r.topics || []))],
        screened_at: new Date().toISOString(),
      },
      summary: totalMatches > 0
        ? `${totalMatches} potential match(es) found in sanctions/watchlist databases`
        : 'No sanctions or watchlist matches detected',
      source_urls: ['https://opensanctions.org/'],
      provider_used: 'opensanctions_api',
      last_successful_update: new Date().toISOString(),
      last_attempted_update: new Date().toISOString(),
      freshness_ttl_hours: 168,
    }, { onConflict: 'company_id,section_type' });

    console.log(`[sync-opensanctions] COMPLETE: ${totalMatches} matches for ${companyName}`);

    return new Response(JSON.stringify({
      success: true,
      totalMatches,
      companyMatches: records.filter(r => r.match_type === 'company').length,
      executiveMatches: records.filter(r => r.match_type === 'executive').length,
      boardMatches: records.filter(r => r.match_type === 'board_member').length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[sync-opensanctions] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
