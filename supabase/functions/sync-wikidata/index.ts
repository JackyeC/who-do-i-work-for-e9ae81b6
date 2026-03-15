/**
 * Wikidata Entity Enrichment Edge Function
 * 
 * Enriches company profiles with structured data from Wikidata SPARQL endpoint.
 * Free API, no key required. Returns founding date, HQ, subsidiaries, etc.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';

interface WikidataEntity {
  id: string;
  label: string;
  description: string;
  properties: Record<string, any>;
}

async function searchWikidata(query: string): Promise<{ id: string; label: string; description: string }[]> {
  const params = new URLSearchParams({
    action: 'wbsearchentities',
    search: query,
    language: 'en',
    limit: '5',
    format: 'json',
    type: 'item',
  });

  try {
    const resp = await fetch(`${WIKIDATA_API}?${params}`, {
      headers: { 'User-Agent': 'WDIWF-Intelligence/1.0 (workplace-intelligence-platform)' },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.search || []).map((r: any) => ({
      id: r.id,
      label: r.label,
      description: r.description || '',
    }));
  } catch {
    return [];
  }
}

async function getEntityDetails(entityId: string): Promise<WikidataEntity | null> {
  // Use SPARQL for rich structured data
  const sparql = `
    SELECT ?item ?itemLabel ?itemDescription
      ?founded ?hq ?hqLabel ?industry ?industryLabel
      ?parentOrg ?parentOrgLabel ?ceo ?ceoLabel
      ?employees ?revenue ?website ?ticker ?exchange ?exchangeLabel
      (COUNT(DISTINCT ?subsidiary) AS ?subsidiaryCount)
    WHERE {
      BIND(wd:${entityId} AS ?item)
      OPTIONAL { ?item wdt:P571 ?founded. }
      OPTIONAL { ?item wdt:P159 ?hq. }
      OPTIONAL { ?item wdt:P452 ?industry. }
      OPTIONAL { ?item wdt:P749 ?parentOrg. }
      OPTIONAL { ?item wdt:P169 ?ceo. }
      OPTIONAL { ?item wdt:P1128 ?employees. }
      OPTIONAL { ?item wdt:P2139 ?revenue. }
      OPTIONAL { ?item wdt:P856 ?website. }
      OPTIONAL { ?item wdt:P249 ?ticker. }
      OPTIONAL { ?item wdt:P414 ?exchange. }
      OPTIONAL { ?subsidiary wdt:P749 wd:${entityId}. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    GROUP BY ?item ?itemLabel ?itemDescription ?founded ?hq ?hqLabel
      ?industry ?industryLabel ?parentOrg ?parentOrgLabel ?ceo ?ceoLabel
      ?employees ?revenue ?website ?ticker ?exchange ?exchangeLabel
    LIMIT 1
  `;

  try {
    const resp = await fetch(`${WIKIDATA_SPARQL}?query=${encodeURIComponent(sparql)}`, {
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'WDIWF-Intelligence/1.0',
      },
    });

    if (!resp.ok) {
      console.warn(`[sync-wikidata] SPARQL returned ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const bindings = data.results?.bindings;
    if (!bindings?.length) return null;

    const b = bindings[0];
    const val = (key: string) => b[key]?.value || null;

    return {
      id: entityId,
      label: val('itemLabel') || '',
      description: val('itemDescription') || '',
      properties: {
        founded: val('founded'),
        headquarters: val('hqLabel'),
        industry: val('industryLabel'),
        parentOrg: val('parentOrgLabel'),
        ceo: val('ceoLabel'),
        employees: val('employees'),
        revenue: val('revenue'),
        website: val('website'),
        ticker: val('ticker'),
        exchange: val('exchangeLabel'),
        subsidiaryCount: parseInt(val('subsidiaryCount') || '0'),
      },
    };
  } catch (err) {
    console.error('[sync-wikidata] SPARQL error:', err);
    return null;
  }
}

async function getExecutiveConnections(entityId: string): Promise<any[]> {
  const sparql = `
    SELECT ?person ?personLabel ?role ?roleLabel ?start ?end
    WHERE {
      {
        wd:${entityId} wdt:P169 ?person.
        BIND("CEO" AS ?roleLabel)
      } UNION {
        wd:${entityId} wdt:P3320 ?person.
        BIND("Board Member" AS ?roleLabel)
      } UNION {
        ?person wdt:P108 wd:${entityId}.
        ?person wdt:P106 ?role.
      }
      OPTIONAL { ?person p:P108 ?stmt. ?stmt ps:P108 wd:${entityId}. ?stmt pq:P580 ?start. ?stmt pq:P582 ?end. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 20
  `;

  try {
    const resp = await fetch(`${WIKIDATA_SPARQL}?query=${encodeURIComponent(sparql)}`, {
      headers: { 'Accept': 'application/sparql-results+json', 'User-Agent': 'WDIWF-Intelligence/1.0' },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.results?.bindings || []).map((b: any) => ({
      name: b.personLabel?.value,
      role: b.roleLabel?.value,
      start: b.start?.value,
      end: b.end?.value,
    }));
  } catch {
    return [];
  }
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

    console.log(`[sync-wikidata] START: ${companyName} (${companyId})`);

    // Search for the company
    const searchResults = await searchWikidata(companyName);
    if (!searchResults.length) {
      console.log(`[sync-wikidata] No results for ${companyName}`);
      return new Response(JSON.stringify({ success: true, found: false, message: 'No Wikidata entity found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the top match (highest relevance)
    const topMatch = searchResults[0];
    console.log(`[sync-wikidata] Top match: ${topMatch.label} (${topMatch.id})`);

    // Get detailed entity data
    const entity = await getEntityDetails(topMatch.id);
    if (!entity) {
      return new Response(JSON.stringify({ success: true, found: false, message: 'Could not fetch entity details' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get executive connections
    const executives = await getExecutiveConnections(topMatch.id);

    const props = entity.properties;
    const foundedYear = props.founded ? new Date(props.founded).getFullYear() : null;

    // Upsert company wikidata record
    await supabase.from('company_wikidata').upsert({
      company_id: companyId,
      entity_type: 'company',
      entity_name: entity.label,
      wikidata_id: entity.id,
      description: entity.description,
      founded_year: foundedYear && !isNaN(foundedYear) ? foundedYear : null,
      headquarters: props.headquarters,
      industry_wikidata: props.industry,
      parent_org: props.parentOrg,
      subsidiary_count: props.subsidiaryCount || null,
      employee_count_wikidata: props.employees,
      revenue_wikidata: props.revenue,
      stock_exchange: props.exchange,
      official_website: props.website,
      properties: {
        ...props,
        executives: executives.slice(0, 10),
        alternativeResults: searchResults.slice(1).map(r => ({ id: r.id, label: r.label })),
      },
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'company_id,wikidata_id' });

    // Update report section cache
    await supabase.from('company_report_sections').upsert({
      company_id: companyId,
      section_type: 'wikidata_enrichment',
      content: {
        wikidata_id: entity.id,
        label: entity.label,
        description: entity.description,
        ...props,
        executives: executives.slice(0, 10),
        fetched_at: new Date().toISOString(),
      },
      summary: `${entity.label}: ${entity.description}`,
      source_urls: [`https://www.wikidata.org/wiki/${entity.id}`],
      provider_used: 'wikidata_sparql',
      last_successful_update: new Date().toISOString(),
      last_attempted_update: new Date().toISOString(),
      freshness_ttl_hours: 336, // 14 days - wikidata changes slowly
    }, { onConflict: 'company_id,section_type' });

    console.log(`[sync-wikidata] COMPLETE: ${entity.label} (${executives.length} executives)`);

    return new Response(JSON.stringify({
      success: true,
      found: true,
      wikidataId: entity.id,
      label: entity.label,
      description: entity.description,
      foundedYear,
      headquarters: props.headquarters,
      executivesFound: executives.length,
      subsidiaryCount: props.subsidiaryCount,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[sync-wikidata] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
