const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOBBY_API_BASE = 'https://lda.senate.gov/api/v1';

// Generate company name variants for matching
function generateNameVariants(name: string): string[] {
  const base = name.trim();
  const variants = [base, base.toUpperCase(), base.toLowerCase()];

  const suffixes = [', Inc.', ', Inc', ' Inc.', ' Inc', ', LLC', ' LLC', ', Corp.', ' Corp.', ' Corp', ' Corporation', ' Company', ' Co.', ' Co', ' Group', ' Holdings', ' Enterprises'];
  for (const suffix of suffixes) {
    if (base.toLowerCase().endsWith(suffix.toLowerCase())) {
      const stripped = base.slice(0, -suffix.length).trim();
      variants.push(stripped, stripped.toUpperCase());
    }
  }

  const cleanName = variants[0].replace(/,?\s*(Inc\.?|LLC|Corp\.?|Corporation|Company|Co\.?|Group|Holdings|Enterprises)\s*$/i, '').trim();
  if (cleanName !== base) variants.push(cleanName);

  return [...new Set(variants)];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName, searchNames, entityMap } = await req.json();

    if (!companyId || !companyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId and companyName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[sync-lobbying] Starting for ${companyName}...`);

    // Use entity resolution names if available, otherwise generate variants
    const resolvedNames = searchNames?.length
      ? searchNames.filter((n: string) => {
          const type = entityMap?.[n];
          return !type || type !== 'ticker'; // Skip ticker symbols for lobbying search
        }).slice(0, 5)
      : [];

    const localVariants = generateNameVariants(companyName);
    const allVariants = [...new Set([...resolvedNames, ...localVariants])].slice(0, 6);

    let allFilings: any[] = [];
    let sourcesSearched = 0;

    // Search Senate LDA API with all name variants
    for (const variant of allVariants) {
      try {
        // Search as registrant (company does own lobbying)
        const url = new URL(`${LOBBY_API_BASE}/filings/`);
        url.searchParams.set('registrant_name', variant);
        url.searchParams.set('filing_year', new Date().getFullYear().toString());
        url.searchParams.set('filing_type', 'Q');
        sourcesSearched++;

        const resp = await fetch(url.toString(), {
          headers: { 'Accept': 'application/json' },
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.results && data.results.length > 0) {
            allFilings = allFilings.concat(data.results);
            console.log(`[sync-lobbying] Found ${data.results.length} registrant filings for "${variant}"`);
          }
        }

        // Search as client (company hires a lobbying firm)
        const clientUrl = new URL(`${LOBBY_API_BASE}/filings/`);
        clientUrl.searchParams.set('client_name', variant);
        clientUrl.searchParams.set('filing_year', new Date().getFullYear().toString());
        sourcesSearched++;

        const clientResp = await fetch(clientUrl.toString(), {
          headers: { 'Accept': 'application/json' },
        });

        if (clientResp.ok) {
          const clientData = await clientResp.json();
          if (clientData.results && clientData.results.length > 0) {
            allFilings = allFilings.concat(clientData.results);
            console.log(`[sync-lobbying] Found ${clientData.results.length} client filings for "${variant}"`);
          }
        }

        // Also search previous year for broader coverage
        const prevYear = (new Date().getFullYear() - 1).toString();
        const prevUrl = new URL(`${LOBBY_API_BASE}/filings/`);
        prevUrl.searchParams.set('client_name', variant);
        prevUrl.searchParams.set('filing_year', prevYear);
        sourcesSearched++;

        const prevResp = await fetch(prevUrl.toString(), {
          headers: { 'Accept': 'application/json' },
        });

        if (prevResp.ok) {
          const prevData = await prevResp.json();
          if (prevData.results && prevData.results.length > 0) {
            allFilings = allFilings.concat(prevData.results);
            console.log(`[sync-lobbying] Found ${prevData.results.length} previous year filings for "${variant}"`);
          }
        }

        await new Promise(r => setTimeout(r, 300));

        // If we have enough results, stop searching more variants
        if (allFilings.length >= 20) break;
      } catch (e) {
        console.error(`[sync-lobbying] Error searching variant "${variant}":`, e);
      }
    }

    // Deduplicate by filing UUID
    const seenIds = new Set<string>();
    const uniqueFilings = allFilings.filter(f => {
      const id = f.filing_uuid || f.id || JSON.stringify(f);
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });

    console.log(`[sync-lobbying] ${uniqueFilings.length} unique filings found (searched ${sourcesSearched} endpoints)`);

    if (uniqueFilings.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `No lobbying filings found for ${companyName} in Senate LDA records`,
          filingsFound: 0,
          linkagesCreated: 0,
          totalLobbyingSpend: 0,
          sourcesScanned: sourcesSearched,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse filings into entity_linkages + company data
    const linkages: any[] = [];
    let totalLobbyingSpend = 0;
    const lobbyingFirms = new Set<string>();
    const issuesTracked = new Set<string>();

    for (const filing of uniqueFilings) {
      const income = filing.income || filing.expenses || 0;
      const amount = typeof income === 'number' ? income : parseFloat(income) || 0;
      totalLobbyingSpend += amount;

      const registrantName = filing.registrant?.name || filing.registrant_name || 'Unknown';
      const clientName = filing.client?.name || filing.client_name || companyName;
      const filingYear = filing.filing_year || new Date().getFullYear();

      lobbyingFirms.add(registrantName);

      if (filing.lobbying_activities) {
        for (const activity of filing.lobbying_activities) {
          if (activity.general_issue_code_display) {
            issuesTracked.add(activity.general_issue_code_display);
          }
        }
      }

      if (amount > 0) {
        // Build a clear plain-English description
        const clientClean = clientName.replace(/,?\s*(Inc\.?|LLC|Corp\.?|Corporation|Company|Co\.?|Group|Holdings)\s*$/i, '').trim();
        const registrantClean = registrantName.replace(/,?\s*(Inc\.?|LLC|Corp\.?|Corporation|Company|Co\.?|Group|Holdings)\s*$/i, '').trim();
        const isSelfLobby = clientClean.toLowerCase() === registrantClean.toLowerCase()
          || registrantClean.toLowerCase().includes(clientClean.toLowerCase())
          || clientClean.toLowerCase().includes(registrantClean.toLowerCase());

        const issueList = [...issuesTracked].slice(0, 3);
        const issueStr = issueList.length > 0 ? ` on issues including ${issueList.join(', ')}` : '';

        const plainDescription = isSelfLobby
          ? `${clientClean} spent $${amount.toLocaleString()} on in-house lobbying in ${filingYear}${issueStr}`
          : `${clientClean} hired ${registrantClean} to lobby on their behalf ($${amount.toLocaleString()}) in ${filingYear}${issueStr}`;

        linkages.push({
          company_id: companyId,
          source_entity_name: clientName,
          source_entity_type: 'company',
          source_entity_id: companyId,
          target_entity_name: registrantName,
          target_entity_type: 'lobbying_firm',
          target_entity_id: null,
          link_type: 'trade_association_lobbying',
          amount: Math.round(amount),
          confidence_score: 0.90,
          description: plainDescription,
          source_citation: JSON.stringify([{
            source: 'Senate LDA',
            url: filing.filing_uuid
              ? `https://lda.senate.gov/filings/public/filing/${filing.filing_uuid}/`
              : 'https://lda.senate.gov/filings/public/filing/search/',
            filing_id: filing.filing_uuid,
            year: filingYear,
            retrieved_at: new Date().toISOString(),
          }]),
          metadata: JSON.stringify({
            filing_type: filing.filing_type_display || filing.filing_type,
            filing_year: filingYear,
            issues: [...issuesTracked].slice(0, 10),
            registrant: registrantName,
          }),
        });
      }
    }

    // Clear old lobbying linkages
    await supabase
      .from('entity_linkages')
      .delete()
      .eq('company_id', companyId)
      .eq('link_type', 'trade_association_lobbying')
      .like('description', 'Lobbying expenditure:%');

    let inserted = 0;
    for (let i = 0; i < linkages.length; i += 50) {
      const batch = linkages.slice(i, i + 50);
      const { error } = await supabase.from('entity_linkages').insert(batch);
      if (error) {
        console.error(`[sync-lobbying] Insert error:`, error);
      } else {
        inserted += batch.length;
      }
    }

    if (totalLobbyingSpend > 0) {
      await supabase.from('companies').update({
        lobbying_spend: Math.round(totalLobbyingSpend),
      }).eq('id', companyId);
    }

    console.log(`✅ [sync-lobbying] ${inserted} linkages, $${totalLobbyingSpend.toLocaleString()} total spend for ${companyName}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${inserted} lobbying linkages for ${companyName}`,
        filingsFound: uniqueFilings.length,
        linkagesCreated: inserted,
        totalLobbyingSpend: Math.round(totalLobbyingSpend),
        lobbyingFirms: [...lobbyingFirms],
        issuesTracked: [...issuesTracked],
        sourcesScanned: sourcesSearched,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-lobbying] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
