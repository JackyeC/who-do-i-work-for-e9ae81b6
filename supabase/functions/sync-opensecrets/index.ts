const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENSECRETS_BASE = 'https://www.opensecrets.org';

interface EnrichmentRecord {
  company_id: string;
  source_name: string;
  source_type: string;
  profile_url: string | null;
  opensecrets_org_name: string | null;
  opensecrets_org_identifier: string | null;
  contributions_total: number | null;
  lobbying_total: number | null;
  outside_spending_total: number | null;
  party_split_json: any;
  top_recipients_json: any;
  pac_names_json: any;
  industry_label: string | null;
  sector_label: string | null;
  issue_tags: string[];
  source_note: string | null;
  source_release_date: string | null;
  confidence_score: number;
  verification_status: string;
}

function normalizeOrgName(name: string): string {
  return name
    .replace(/\b(inc|llc|ltd|corp|corporation|co|company|group|holdings|plc|lp|na)\b\.?/gi, '')
    .replace(/[.,&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function buildSearchNames(companyName: string, searchNames?: string[]): string[] {
  const names = new Set<string>();
  names.add(companyName);
  if (searchNames) {
    for (const n of searchNames) names.add(n);
  }
  // Add stripped version
  const stripped = companyName
    .replace(/\b(inc|llc|ltd|corp|corporation|co|company|group|holdings|plc|lp|na)\b\.?/gi, '')
    .replace(/[.,]/g, '')
    .trim();
  if (stripped && stripped !== companyName) names.add(stripped);
  return Array.from(names);
}

async function scrapeWithFirecrawl(url: string, firecrawlKey: string | undefined): Promise<string | null> {
  if (!firecrawlKey) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[sync-opensecrets] Firecrawl returned ${response.status} for ${url}`);
      return null;
    }

    const data = await response.json();
    return data?.data?.markdown || data?.markdown || null;
  } catch (e) {
    console.warn(`[sync-opensecrets] Firecrawl error for ${url}:`, e);
    return null;
  }
}

function parseOrgProfile(markdown: string): Partial<EnrichmentRecord> {
  const result: Partial<EnrichmentRecord> = {};

  // Extract dollar amounts with labels
  const contributionsMatch = markdown.match(/(?:total|contributions?|campaign\s+finance)[^$]*\$([0-9,]+(?:\.\d+)?)/i);
  if (contributionsMatch) {
    result.contributions_total = parseFloat(contributionsMatch[1].replace(/,/g, ''));
  }

  const lobbyingMatch = markdown.match(/(?:lobbying)[^$]*\$([0-9,]+(?:\.\d+)?)/i);
  if (lobbyingMatch) {
    result.lobbying_total = parseFloat(lobbyingMatch[1].replace(/,/g, ''));
  }

  const outsideMatch = markdown.match(/(?:outside\s+spending)[^$]*\$([0-9,]+(?:\.\d+)?)/i);
  if (outsideMatch) {
    result.outside_spending_total = parseFloat(outsideMatch[1].replace(/,/g, ''));
  }

  // Extract party split
  const demMatch = markdown.match(/(?:democrat|dem)[^0-9]*(\d+(?:\.\d+)?)\s*%/i);
  const repMatch = markdown.match(/(?:republican|rep|gop)[^0-9]*(\d+(?:\.\d+)?)\s*%/i);
  if (demMatch || repMatch) {
    result.party_split_json = {
      democrat_pct: demMatch ? parseFloat(demMatch[1]) : null,
      republican_pct: repMatch ? parseFloat(repMatch[1]) : null,
    };
  }

  // Extract industry/sector
  const industryMatch = markdown.match(/(?:industry|sector)\s*:\s*([^\n|]+)/i);
  if (industryMatch) {
    result.industry_label = industryMatch[1].trim();
  }

  // Extract PAC names
  const pacMatches = markdown.match(/([A-Z][A-Za-z\s&]+(?:PAC|Political Action Committee))/g);
  if (pacMatches && pacMatches.length > 0) {
    result.pac_names_json = [...new Set(pacMatches.map(p => p.trim()))];
  }

  // Extract source notes
  const sourceMatch = markdown.match(/(?:source|data\s+from|based\s+on)[:\s]+([^\n]+)/i);
  if (sourceMatch) {
    result.source_note = sourceMatch[1].trim().slice(0, 500);
  }

  // Extract date/cycle
  const cycleMatch = markdown.match(/(?:20\d{2})\s*(?:cycle|election)/i);
  if (cycleMatch) {
    result.source_release_date = cycleMatch[0].trim();
  }

  // Extract issue tags from common keywords
  const issueKeywords = ['climate', 'gun', 'abortion', 'reproductive', 'labor', 'immigration', 'healthcare', 'defense', 'energy', 'tech', 'finance', 'pharmaceutical'];
  const foundIssues: string[] = [];
  const lowerMarkdown = markdown.toLowerCase();
  for (const kw of issueKeywords) {
    if (lowerMarkdown.includes(kw)) foundIssues.push(kw);
  }
  if (foundIssues.length > 0) {
    result.issue_tags = foundIssues;
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { companyId, companyName, searchNames: inputSearchNames, entityMap } = await req.json();

    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!firecrawlKey) {
      console.warn('[sync-opensecrets] FIRECRAWL_API_KEY not configured, using limited mode');
    }

    console.log(`[sync-opensecrets] START: ${companyName} (${companyId})`);

    const searchNames = buildSearchNames(companyName, inputSearchNames);
    let sourcesScanned = 0;
    let signalsFound = 0;
    let bestMatch: (Partial<EnrichmentRecord> & { profile_url: string; opensecrets_org_name: string }) | null = null;

    // Try each search name as an OpenSecrets org slug
    for (const name of searchNames.slice(0, 5)) {
      // Build a plausible OpenSecrets org URL slug
      const slug = name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '+');

      const profileUrl = `${OPENSECRETS_BASE}/orgs/${encodeURIComponent(slug)}/summary`;

      console.log(`[sync-opensecrets] Trying: ${profileUrl}`);

      // Respectful delay between requests (1.5s)
      if (sourcesScanned > 0) {
        await new Promise(r => setTimeout(r, 1500));
      }

      const markdown = await scrapeWithFirecrawl(profileUrl, firecrawlKey);
      sourcesScanned++;

      if (!markdown || markdown.length < 200) {
        console.log(`[sync-opensecrets] No useful content for slug: ${slug}`);
        continue;
      }

      // Verify this page is actually about the right organization
      const normalizedSearch = normalizeOrgName(name);
      const normalizedContent = markdown.toLowerCase();
      if (!normalizedContent.includes(normalizedSearch.slice(0, Math.min(normalizedSearch.length, 10)))) {
        console.log(`[sync-opensecrets] Content doesn't match org name for: ${name}`);
        continue;
      }

      const parsed = parseOrgProfile(markdown);
      const hasData = parsed.contributions_total || parsed.lobbying_total || parsed.outside_spending_total || parsed.pac_names_json;

      if (hasData) {
        bestMatch = {
          ...parsed,
          profile_url: profileUrl,
          opensecrets_org_name: name,
        };
        signalsFound++;
        console.log(`[sync-opensecrets] Match found for: ${name}`);
        break; // Found a good match, no need to continue
      }
    }

    // Also try the OpenSecrets search page as fallback
    if (!bestMatch) {
      const searchUrl = `${OPENSECRETS_BASE}/search?q=${encodeURIComponent(companyName)}&type=orgs`;
      console.log(`[sync-opensecrets] Trying search fallback: ${searchUrl}`);

      await new Promise(r => setTimeout(r, 1500));
      const searchMarkdown = await scrapeWithFirecrawl(searchUrl, firecrawlKey);
      sourcesScanned++;

      if (searchMarkdown && searchMarkdown.length > 100) {
        // Try to find org profile links in search results
        const orgLinkMatch = searchMarkdown.match(/\/orgs\/([^\/\s\)]+)/);
        if (orgLinkMatch) {
          const orgSlug = orgLinkMatch[1];
          const profileUrl = `${OPENSECRETS_BASE}/orgs/${orgSlug}/summary`;
          console.log(`[sync-opensecrets] Found org from search: ${profileUrl}`);

          await new Promise(r => setTimeout(r, 1500));
          const profileMarkdown = await scrapeWithFirecrawl(profileUrl, firecrawlKey);
          sourcesScanned++;

          if (profileMarkdown && profileMarkdown.length > 200) {
            const parsed = parseOrgProfile(profileMarkdown);
            if (parsed.contributions_total || parsed.lobbying_total || parsed.outside_spending_total) {
              bestMatch = {
                ...parsed,
                profile_url: profileUrl,
                opensecrets_org_name: companyName,
                opensecrets_org_identifier: orgSlug,
              };
              signalsFound++;
            }
          }
        }
      }
    }

    // Save enrichment record
    if (bestMatch) {
      const record: any = {
        company_id: companyId,
        source_name: 'OpenSecrets',
        source_type: 'third_party_summary',
        profile_url: bestMatch.profile_url,
        opensecrets_org_name: bestMatch.opensecrets_org_name,
        opensecrets_org_identifier: bestMatch.opensecrets_org_identifier || null,
        contributions_total: bestMatch.contributions_total || null,
        lobbying_total: bestMatch.lobbying_total || null,
        outside_spending_total: bestMatch.outside_spending_total || null,
        party_split_json: bestMatch.party_split_json || null,
        top_recipients_json: bestMatch.top_recipients_json || null,
        pac_names_json: bestMatch.pac_names_json || null,
        industry_label: bestMatch.industry_label || null,
        sector_label: bestMatch.sector_label || null,
        issue_tags: bestMatch.issue_tags || [],
        source_note: bestMatch.source_note || null,
        source_release_date: bestMatch.source_release_date || null,
        confidence_score: 0.5,
        verification_status: 'unverified_opensecrets_only',
        fetched_at: new Date().toISOString(),
      };

      // Upsert: replace existing enrichment for same company+source
      const { error: upsertErr } = await supabase
        .from('organization_profile_enrichment')
        .upsert(record, {
          onConflict: 'company_id',
          ignoreDuplicates: false,
        });

      if (upsertErr) {
        // Fallback: delete + insert
        await supabase
          .from('organization_profile_enrichment')
          .delete()
          .eq('company_id', companyId)
          .eq('source_name', 'OpenSecrets');

        const { error: insertErr } = await supabase
          .from('organization_profile_enrichment')
          .insert(record);

        if (insertErr) {
          console.error('[sync-opensecrets] Failed to save enrichment:', insertErr);
        }
      }

      console.log(`[sync-opensecrets] Saved enrichment for ${companyName}: contributions=$${bestMatch.contributions_total || 0}, lobbying=$${bestMatch.lobbying_total || 0}`);

      // Cross-check: compare with existing FEC/USASpending data
      try {
        const crossCheckResults: any = {};

        // Check FEC data
        const { data: fecData } = await supabase
          .from('entity_linkages')
          .select('amount')
          .eq('company_id', companyId)
          .in('link_type', ['donation_to_member']);

        const fecTotal = (fecData || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
        if (fecTotal > 0 && bestMatch.contributions_total) {
          crossCheckResults.fec = {
            our_total: fecTotal,
            opensecrets_total: bestMatch.contributions_total,
            ratio: fecTotal / bestMatch.contributions_total,
            status: Math.abs(1 - fecTotal / bestMatch.contributions_total) < 0.3 ? 'consistent' : 'divergent',
          };
        }

        // Check USASpending data
        const { data: contractsData } = await supabase
          .from('entity_linkages')
          .select('amount')
          .eq('company_id', companyId)
          .in('link_type', ['committee_oversight_of_contract']);

        const contractsTotal = (contractsData || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

        // Check lobbying data
        const { data: lobbyData } = await supabase
          .from('entity_linkages')
          .select('amount')
          .eq('company_id', companyId)
          .in('link_type', ['trade_association_lobbying']);

        const lobbyTotal = (lobbyData || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
        if (lobbyTotal > 0 && bestMatch.lobbying_total) {
          crossCheckResults.lobbying = {
            our_total: lobbyTotal,
            opensecrets_total: bestMatch.lobbying_total,
            status: Math.abs(1 - lobbyTotal / bestMatch.lobbying_total) < 0.3 ? 'consistent' : 'divergent',
          };
        }

        // Determine overall verification status
        const hasAnyCrossCheck = Object.keys(crossCheckResults).length > 0;
        const allConsistent = hasAnyCrossCheck && Object.values(crossCheckResults).every((v: any) => v.status === 'consistent');
        const someConsistent = hasAnyCrossCheck && Object.values(crossCheckResults).some((v: any) => v.status === 'consistent');

        const verificationStatus = allConsistent
          ? 'cross_checked_primary_source'
          : someConsistent
            ? 'partially_verified'
            : 'unverified_opensecrets_only';

        const confidenceScore = allConsistent ? 0.85 : someConsistent ? 0.65 : 0.5;

        await supabase
          .from('organization_profile_enrichment')
          .update({
            cross_check_results: crossCheckResults,
            verification_status: verificationStatus,
            confidence_score: confidenceScore,
          })
          .eq('company_id', companyId)
          .eq('source_name', 'OpenSecrets');

        console.log(`[sync-opensecrets] Cross-check: ${verificationStatus} (confidence: ${confidenceScore})`);
      } catch (crossErr) {
        console.warn('[sync-opensecrets] Cross-check failed (non-critical):', crossErr);
      }
    }

    console.log(`[sync-opensecrets] COMPLETE: ${signalsFound} signals from ${sourcesScanned} sources`);

    return new Response(JSON.stringify({
      success: true,
      signalsFound,
      sourcesScanned,
      profileFound: !!bestMatch,
      profileUrl: bestMatch?.profile_url || null,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[sync-opensecrets] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      signalsFound: 0,
      sourcesScanned: 0,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
