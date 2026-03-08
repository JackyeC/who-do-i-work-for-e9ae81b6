const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OC_BASE = 'https://api.opencorporates.com/v0.4';

interface OCCompany {
  name: string;
  company_number: string;
  jurisdiction_code: string;
  incorporation_date: string | null;
  current_status: string | null;
  registered_address_in_full: string | null;
  opencorporates_url: string;
  officers?: OCOfficer[];
}

interface OCOfficer {
  name: string;
  position: string;
  start_date: string | null;
  end_date: string | null;
}

function normalizeForSearch(name: string): string {
  return name
    .replace(/[,.]?\s*(Inc|LLC|Corp|Corporation|Ltd|Holdings|Group|Company|Co|L\.P\.|LP|International|Enterprises|Industries)\.?$/i, '')
    .trim();
}

async function searchOpenCorporates(query: string): Promise<OCCompany[]> {
  const encoded = encodeURIComponent(normalizeForSearch(query));
  const url = `${OC_BASE}/companies/search?q=${encoded}&per_page=5&order=score`;

  try {
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        console.warn('[sync-opencorporates] Rate limited by OpenCorporates');
        return [];
      }
      console.warn(`[sync-opencorporates] API returned ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    const companies = data?.results?.companies || [];
    return companies.map((c: any) => c.company).filter(Boolean);
  } catch (err) {
    console.error('[sync-opencorporates] Search error:', err);
    return [];
  }
}

async function getOfficers(jurisdictionCode: string, companyNumber: string): Promise<OCOfficer[]> {
  const url = `${OC_BASE}/companies/${jurisdictionCode}/${companyNumber}/officers?per_page=10`;

  try {
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!resp.ok) return [];

    const data = await resp.json();
    const officers = data?.results?.officers || [];
    return officers.map((o: any) => o.officer).filter(Boolean);
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
    const { companyId, companyName, searchNames } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-opencorporates] START: ${companyName} (${companyId})`);

    const namesToSearch = searchNames?.length ? searchNames.slice(0, 3) : [companyName];
    let allResults: OCCompany[] = [];
    let sourcesScanned = 0;

    // Search OpenCorporates for each name variant
    for (const name of namesToSearch) {
      const results = await searchOpenCorporates(name);
      sourcesScanned++;
      allResults = [...allResults, ...results];
      // Rate limiting - be gentle with free tier
      if (namesToSearch.length > 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Deduplicate by company_number + jurisdiction
    const seen = new Set<string>();
    const uniqueResults = allResults.filter(c => {
      const key = `${c.jurisdiction_code}:${c.company_number}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`[sync-opencorporates] Found ${uniqueResults.length} unique entities`);

    let signalsFound = 0;
    const structureRecords: any[] = [];

    for (const company of uniqueResults.slice(0, 10)) {
      // Base company record
      structureRecords.push({
        company_id: companyId,
        entity_name: company.name,
        entity_type: 'registered_entity',
        jurisdiction: company.jurisdiction_code,
        registration_number: company.company_number,
        registration_date: company.incorporation_date || null,
        status: company.current_status || 'unknown',
        source_name: 'opencorporates',
        source_url: company.opencorporates_url,
        confidence: 'direct',
        evidence_text: company.registered_address_in_full || null,
        detected_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
      });

      // Try to get officers for the top match
      if (structureRecords.length <= 2) {
        const officers = await getOfficers(company.jurisdiction_code, company.company_number);
        for (const officer of officers.slice(0, 5)) {
          if (!officer.end_date) { // Only current officers
            structureRecords.push({
              company_id: companyId,
              entity_name: company.name,
              entity_type: 'officer',
              jurisdiction: company.jurisdiction_code,
              registration_number: company.company_number,
              officer_name: officer.name,
              officer_role: officer.position,
              source_name: 'opencorporates',
              source_url: company.opencorporates_url,
              confidence: 'direct',
              evidence_text: `${officer.position} since ${officer.start_date || 'unknown'}`,
              detected_at: new Date().toISOString(),
              last_verified_at: new Date().toISOString(),
            });
          }
        }
        // Rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Upsert records - delete old ones first to avoid duplicates
    if (structureRecords.length > 0) {
      await supabase
        .from('company_corporate_structure')
        .delete()
        .eq('company_id', companyId)
        .eq('source_name', 'opencorporates');

      const { error: insertErr } = await supabase
        .from('company_corporate_structure')
        .insert(structureRecords);

      if (insertErr) {
        console.error('[sync-opencorporates] Insert error:', insertErr);
      } else {
        signalsFound = structureRecords.length;
      }
    }

    // Also update entity_relationships for better identity resolution
    const entityRelationships = uniqueResults.slice(0, 5).map(c => ({
      primary_entity_id: companyId,
      related_entity_name: c.name,
      relationship_type: c.name.toLowerCase().includes(normalizeForSearch(companyName).toLowerCase()) ? 'legal_variant' : 'related_entity',
      confidence_score: 0.7,
      source_url: c.opencorporates_url,
      notes: `Jurisdiction: ${c.jurisdiction_code}, Status: ${c.current_status || 'unknown'}`,
    }));

    if (entityRelationships.length > 0) {
      await supabase.from('entity_relationships').upsert(entityRelationships, {
        onConflict: 'primary_entity_id,related_entity_name',
        ignoreDuplicates: true,
      }).then(({ error }) => {
        if (error) console.warn('[sync-opencorporates] Entity relationship upsert warning:', error.message);
      });
    }

    console.log(`[sync-opencorporates] COMPLETE: ${signalsFound} signals from ${sourcesScanned} sources`);

    return new Response(JSON.stringify({
      success: true,
      sourcesScanned,
      signalsFound,
      entitiesFound: uniqueResults.length,
      officersFound: structureRecords.filter(r => r.entity_type === 'officer').length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[sync-opencorporates] Unhandled error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: 'exception',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
