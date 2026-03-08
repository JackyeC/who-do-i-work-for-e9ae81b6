const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BROWSE_AI_API = 'https://api.browse.ai/v2';

// Expanded page types aligned with Offer Check signal categories
const PAGE_TYPES = [
  { type: 'careers', pathHints: ['/careers', '/jobs', '/join-us', '/work-with-us'] },
  { type: 'jobs', pathHints: ['/jobs', '/careers/search', '/open-positions', '/job-openings'] },
  { type: 'benefits', pathHints: ['/benefits', '/perks', '/total-rewards', '/compensation'] },
  { type: 'leadership', pathHints: ['/leadership', '/team', '/about/leadership', '/executives', '/board'] },
  { type: 'esg', pathHints: ['/esg', '/sustainability', '/responsibility', '/csr', '/impact'] },
  { type: 'diversity', pathHints: ['/diversity', '/inclusion', '/dei', '/belonging', '/workforce', '/people'] },
  { type: 'newsroom', pathHints: ['/newsroom', '/press', '/news', '/media', '/blog'] },
  { type: 'policy', pathHints: ['/political-activity', '/political-disclosure', '/pac', '/government-affairs', '/public-policy'] },
  { type: 'privacy', pathHints: ['/privacy', '/ai-disclosure', '/data-practices', '/transparency'] },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BROWSE_AI_API_KEY = Deno.env.get('BROWSE_AI_API_KEY');
    if (!BROWSE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: 'BROWSE_AI_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { companyId, companyName, websiteUrl, careersUrl } = await req.json();

    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ error: 'companyId and companyName are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[browse-ai-setup] Setting up monitors for: ${companyName}`);

    // Check which monitors already exist
    const { data: existingMonitors } = await supabase
      .from('browse_ai_monitors')
      .select('page_type')
      .eq('company_id', companyId);

    const existingTypes = new Set((existingMonitors || []).map((m: any) => m.page_type));

    // Build base URL
    const baseUrl = (websiteUrl || `https://www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`).replace(/\/$/, '');
    const candidatePages: { type: string; url: string }[] = [];

    for (const pageType of PAGE_TYPES) {
      if (existingTypes.has(pageType.type)) continue;

      // Use provided careers URL for careers/jobs page types
      if ((pageType.type === 'careers' || pageType.type === 'jobs') && careersUrl) {
        candidatePages.push({ type: pageType.type, url: careersUrl });
        continue;
      }

      candidatePages.push({ type: pageType.type, url: `${baseUrl}${pageType.pathHints[0]}` });
    }

    if (candidatePages.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All monitors already exist',
        monitorsCreated: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/browse-ai-webhook`;
    const results: any[] = [];

    for (const page of candidatePages) {
      try {
        const robotResp = await fetch(`${BROWSE_AI_API}/robots`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${BROWSE_AI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `CivicLens: ${companyName} - ${page.type}`,
            url: page.url,
            monitorMode: true,
            monitorInterval: 'daily',
            webhookUrl,
            description: `Monitor ${page.type} page for ${companyName}. Company ID: ${companyId}`,
          }),
        });

        if (!robotResp.ok) {
          const errText = await robotResp.text();
          console.error(`[browse-ai-setup] Robot creation failed for ${page.type}:`, errText);

          await supabase.from('browse_ai_monitors').upsert({
            company_id: companyId,
            page_type: page.type,
            page_url: page.url,
            status: 'error',
            error_message: `Robot creation failed: HTTP ${robotResp.status}`,
          }, { onConflict: 'company_id,page_type' });

          results.push({ type: page.type, status: 'error', error: `HTTP ${robotResp.status}` });
          continue;
        }

        const robotData = await robotResp.json();
        const robotId = robotData.result?.id || robotData.id;

        await supabase.from('browse_ai_monitors').upsert({
          company_id: companyId,
          page_type: page.type,
          page_url: page.url,
          browse_ai_robot_id: robotId,
          status: 'active',
          error_message: null,
        }, { onConflict: 'company_id,page_type' });

        results.push({ type: page.type, status: 'active', robotId });
        console.log(`[browse-ai-setup] Created robot ${robotId} for ${companyName} - ${page.type}`);
      } catch (pageErr) {
        const msg = pageErr instanceof Error ? pageErr.message : 'Unknown error';
        console.error(`[browse-ai-setup] Error for ${page.type}:`, msg);

        await supabase.from('browse_ai_monitors').upsert({
          company_id: companyId,
          page_type: page.type,
          page_url: page.url,
          status: 'error',
          error_message: msg,
        }, { onConflict: 'company_id,page_type' });

        results.push({ type: page.type, status: 'error', error: msg });
      }
    }

    const activeCount = results.filter(r => r.status === 'active').length;
    console.log(`[browse-ai-setup] Complete: ${activeCount}/${results.length} monitors active for ${companyName}`);

    return new Response(JSON.stringify({
      success: true,
      monitorsCreated: activeCount,
      totalAttempted: results.length,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[browse-ai-setup] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
