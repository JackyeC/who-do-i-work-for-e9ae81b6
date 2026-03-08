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
    const { companyId, websiteUrl, companyName } = await req.json();

    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get executives for this company
    const { data: executives } = await supabase
      .from('company_executives')
      .select('id, name, title, photo_url')
      .eq('company_id', companyId);

    if (!executives || executives.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No executives found for this company' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip if all already have photos
    const needsPhotos = executives.filter(e => !e.photo_url);
    if (needsPhotos.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'All executives already have photos', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try common leadership/about page patterns
    let baseUrl = websiteUrl?.trim() || `https://www.${(companyName || '').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

    const leadershipPaths = ['/about/leadership', '/leadership', '/about/team', '/team', '/about-us', '/about'];
    
    let pageData: any = null;

    // Use Firecrawl map to find leadership page
    console.log(`Mapping ${baseUrl} for leadership pages...`);
    try {
      const mapResp = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: baseUrl,
          search: 'leadership team about executives',
          limit: 20,
        }),
      });

      const mapData = await mapResp.json();
      const links = mapData?.links || [];
      
      // Find best leadership page
      const leadershipUrl = links.find((l: string) => 
        /leader|team|executive|about.*us|management|people/i.test(l)
      ) || links.find((l: string) => /about/i.test(l));

      if (leadershipUrl) {
        console.log(`Found leadership page: ${leadershipUrl}`);
        const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: leadershipUrl,
            formats: ['html', 'markdown'],
            waitFor: 3000,
          }),
        });
        pageData = await scrapeResp.json();
      }
    } catch (e) {
      console.error('Map/scrape failed:', e);
    }

    // Fallback: try common paths directly
    if (!pageData?.data?.html) {
      for (const path of leadershipPaths) {
        try {
          const tryUrl = new URL(path, baseUrl).toString();
          console.log(`Trying ${tryUrl}...`);
          const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: tryUrl,
              formats: ['html'],
              waitFor: 3000,
            }),
          });
          const data = await resp.json();
          if (data?.data?.html && data.data.html.length > 5000) {
            pageData = data;
            console.log(`Found content at ${tryUrl}`);
            break;
          }
        } catch {
          continue;
        }
      }
    }

    if (!pageData?.data?.html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not find leadership page' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = pageData.data.html;
    let updated = 0;

    // For each executive, try to find their photo in the HTML
    for (const exec of needsPhotos) {
      const nameParts = exec.name.split(' ');
      const lastName = nameParts[nameParts.length - 1];
      const firstName = nameParts[0];

      // Look for img tags near the executive's name
      // Strategy: find the name in HTML, then look for nearby img src
      const namePatterns = [
        exec.name,
        `${firstName}.*${lastName}`,
        `${lastName}`,
      ];

      let photoUrl: string | null = null;

      for (const pattern of namePatterns) {
        const regex = new RegExp(`(?:<img[^>]*src=["']([^"']+)["'][^>]*>[\\s\\S]{0,500}${pattern}|${pattern}[\\s\\S]{0,500}<img[^>]*src=["']([^"']+)["'])`, 'i');
        const match = html.match(regex);
        
        if (match) {
          const rawUrl = match[1] || match[2];
          if (rawUrl && !rawUrl.includes('icon') && !rawUrl.includes('logo') && !rawUrl.includes('favicon') && !rawUrl.includes('.svg')) {
            // Make absolute
            if (rawUrl.startsWith('http')) {
              photoUrl = rawUrl;
            } else {
              try {
                photoUrl = new URL(rawUrl, baseUrl).toString();
              } catch {
                photoUrl = rawUrl;
              }
            }
            break;
          }
        }
      }

      if (photoUrl) {
        console.log(`Found photo for ${exec.name}: ${photoUrl}`);
        const { error } = await supabase
          .from('company_executives')
          .update({ photo_url: photoUrl })
          .eq('id', exec.id);
        
        if (!error) updated++;
      }
    }

    console.log(`Updated ${updated} executive photos for company ${companyId}`);

    return new Response(
      JSON.stringify({ success: true, updated, total: executives.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching executive photos:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
