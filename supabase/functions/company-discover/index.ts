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
    const { searchQuery, companyName } = await req.json();
    if (!companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const name = companyName.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    console.log(`Company discover: "${name}" (slug: ${slug})`);

    // Step 1: Check if company already exists (search by slug and name separately)
    const { data: bySlug } = await supabase
      .from('companies')
      .select('id, slug, record_status')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();

    const existing = bySlug || (await supabase
      .from('companies')
      .select('id, slug, record_status')
      .ilike('name', `%${name}%`)
      .limit(1)
      .maybeSingle()).data;

    if (existing) {
      console.log(`Company already exists: ${existing.slug}`);

      // Trigger job-scrape for stale existing companies (no scan or >48h old)
      const { data: companyDetail } = await supabase
        .from('companies')
        .select('last_scan_attempted, careers_url, name')
        .eq('id', existing.id)
        .single();

      const lastScan = companyDetail?.last_scan_attempted ? new Date(companyDetail.last_scan_attempted).getTime() : 0;
      const hoursSinceLastScan = (Date.now() - lastScan) / (1000 * 60 * 60);

      if (hoursSinceLastScan > 48) {
        console.log(`Triggering background job-scrape for stale company: ${existing.slug}`);
        fetch(`${supabaseUrl}/functions/v1/job-scrape`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName: companyDetail?.name || name,
            companyId: existing.id,
            careersUrl: companyDetail?.careers_url || null,
          }),
        }).catch(e => console.error('Background job-scrape (existing) failed:', e));

        // Update last_scan_attempted to prevent duplicate triggers
        await supabase.from('companies').update({
          last_scan_attempted: new Date().toISOString(),
        }).eq('id', existing.id);
      }

      return new Response(JSON.stringify({
        success: true,
        action: 'existing',
        companyId: existing.id,
        slug: existing.slug,
        status: existing.record_status,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: Create the company record (use upsert on slug to handle race conditions)
    const { data: newCompany, error: insertErr } = await supabase
      .from('companies')
      .upsert({
        name,
        slug,
        industry: 'Pending Verification',
        state: 'Unknown',
        record_status: 'discovered',
        creation_source: 'user_search',
        search_query: searchQuery || name,
        identity_matched: false,
        scan_completion: {},
        civic_footprint_score: 0,
        total_pac_spending: 0,
        confidence_rating: 'low',
      }, { onConflict: 'slug', ignoreDuplicates: true })
      .select('id, slug')
      .single();

    // If upsert returned nothing (duplicate ignored), fetch the existing record
    if (!newCompany) {
      const { data: existingBySlug } = await supabase
        .from('companies')
        .select('id, slug, record_status')
        .eq('slug', slug)
        .single();

      if (existingBySlug) {
        return new Response(JSON.stringify({
          success: true,
          action: 'existing',
          companyId: existingBySlug.id,
          slug: existingBySlug.slug,
          status: existingBySlug.record_status,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return new Response(JSON.stringify({ success: false, error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Created company: ${newCompany.id}`);

    // Step 3: Identity verification via AI (run inline — fast)
    let identityData: any = {};
    if (lovableKey) {
      try {
        // Quick web search for company identity
        let searchContent = '';
        const identityQueries = [`"${name}" company official website headquarters industry`];
        const { results: identityResults } = await resilientSearch(identityQueries, firecrawlKey, lovableKey!);
        for (const r of identityResults) {
          searchContent += `\nURL: ${r.url}\nTitle: ${r.title}\n${r.description || ''}\n`;
        }

        const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a company identity verification expert. Return only valid JSON.' },
              {
                role: 'user',
                content: `Identify the company "${name}". Return JSON:
{
  "official_name": "Full legal/official name",
  "website": "company website URL or null",
  "careers_url": "careers page URL or null",
  "headquarters_state": "US state abbreviation or country",
  "industry": "industry classification",
  "employee_count": "approximate employee count or null",
  "parent_company": "parent company name or null",
  "description": "1-2 sentence description",
  "confidence": "high, medium, or low",
  "multiple_matches": false
}

${searchContent ? `Search results:\n${searchContent}` : 'Use your knowledge.'}`,
              },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const raw = aiData.choices?.[0]?.message?.content || '{}';
          try {
            const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
            identityData = JSON.parse(jsonMatch[1].trim());
          } catch {
            console.error('Failed to parse identity AI output');
          }
        }
      } catch (e) {
        console.error('Identity verification failed:', e);
      }
    }

    // Step 4: Update company with verified identity
    const updateFields: any = {
      record_status: identityData.confidence === 'high' ? 'identity_matched' : 
                     identityData.confidence === 'medium' ? 'identity_matched' : 'discovered',
      identity_matched: identityData.confidence === 'high' || identityData.confidence === 'medium',
      updated_at: new Date().toISOString(),
    };

    if (identityData.official_name) updateFields.name = identityData.official_name;
    if (identityData.website) updateFields.description = identityData.description || null;
    if (identityData.careers_url) updateFields.careers_url = identityData.careers_url;
    if (identityData.headquarters_state) updateFields.state = identityData.headquarters_state;
    if (identityData.industry && identityData.industry !== 'Unknown') updateFields.industry = identityData.industry;
    if (identityData.employee_count) updateFields.employee_count = identityData.employee_count;
    if (identityData.parent_company) updateFields.parent_company = identityData.parent_company;
    if (identityData.description) updateFields.description = identityData.description;
    if (identityData.confidence) updateFields.confidence_rating = identityData.confidence;
    if (identityData.multiple_matches) {
      updateFields.verification_notes = 'Multiple possible matches found';
    }

    await supabase.from('companies').update(updateFields).eq('id', newCompany.id);

    // Step 5: Trigger company-research + job-scrape in background (fire-and-forget)
    // NOTE: Do NOT trigger company-intelligence-scan here — the profile page's
    // useROIPipeline hook auto-triggers it when it detects empty data, avoiding double invocation.
    try {
      fetch(`${supabaseUrl}/functions/v1/company-research`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: identityData.official_name || name, companyId: newCompany.id, enrichExisting: true }),
      }).catch(e => console.error('Background company-research failed:', e));
    } catch (e) {
      console.error('Failed to trigger company-research:', e);
    }

    // Step 5b: Trigger job-scrape if we have a careers URL
    const careersUrl = identityData.careers_url || null;
    try {
      console.log(`Triggering job-scrape for new company: ${newCompany.id} (careers: ${careersUrl || 'none'})`);
      fetch(`${supabaseUrl}/functions/v1/job-scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: identityData.official_name || name,
          companyId: newCompany.id,
          careersUrl,
        }),
      }).catch(e => console.error('Background job-scrape failed:', e));
    } catch (e) {
      console.error('Failed to trigger job-scrape:', e);
    }

    // Update status to research in progress
    await supabase.from('companies').update({
      record_status: 'research_in_progress',
      last_scan_attempted: new Date().toISOString(),
    }).eq('id', newCompany.id);

    return new Response(JSON.stringify({
      success: true,
      action: 'created',
      companyId: newCompany.id,
      slug: newCompany.slug,
      identity: {
        name: identityData.official_name || name,
        verified: identityData.confidence === 'high' || identityData.confidence === 'medium',
        multipleMatches: identityData.multiple_matches || false,
      },
      status: 'research_in_progress',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Company discover error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
