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
    const { companyId, websiteUrl } = await req.json();

    if (!companyId || !websiteUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId and websiteUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      // No Firecrawl — return favicon fallback
      try {
        const baseUrl = new URL(url);
        const logoUrl = `${baseUrl.origin}/favicon.ico`;
        const { error: updateError } = await supabase
          .from('companies')
          .update({ logo_url: logoUrl, website_url: url })
          .eq('id', companyId);
        if (updateError) console.error('Failed to update company logo:', updateError);
        return new Response(
          JSON.stringify({ success: true, logoUrl, source: 'favicon_fallback' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: 'Firecrawl not configured, no favicon available' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Format URL
    let url = websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    console.log(`Fetching branding for company ${companyId} from ${url}`);

    // Use Firecrawl branding format to extract logo and brand assets
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['branding'],
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl branding error:', data);
      // Fallback: try to get favicon/og:image via metadata
      return await tryFallbackLogo(firecrawlKey, url, companyId, supabase);
    }

    const branding = data?.data?.branding || data?.branding;
    let logoUrl = branding?.images?.logo || branding?.logo || null;

    // If no logo found via branding, try metadata og:image
    if (!logoUrl) {
      console.log('No logo in branding, trying metadata fallback...');
      return await tryFallbackLogo(firecrawlKey, url, companyId, supabase);
    }

    // Make relative URLs absolute
    if (logoUrl && !logoUrl.startsWith('http')) {
      try {
        const baseUrl = new URL(url);
        logoUrl = new URL(logoUrl, baseUrl.origin).toString();
      } catch {
        // keep as-is
      }
    }

    // Save to DB
    const { error: updateError } = await supabase
      .from('companies')
      .update({ logo_url: logoUrl, website_url: url })
      .eq('id', companyId);

    if (updateError) {
      console.error('Failed to update company logo:', updateError);
    }

    console.log(`Logo found for ${companyId}: ${logoUrl}`);

    return new Response(
      JSON.stringify({ success: true, logoUrl, source: 'branding' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching company branding:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function tryFallbackLogo(
  firecrawlKey: string,
  url: string,
  companyId: string,
  supabase: any
) {
  try {
    // Scrape metadata to find og:image or favicon
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: false,
      }),
    });

    const data = await response.json();
    const metadata = data?.data?.metadata || data?.metadata;

    let logoUrl = metadata?.ogImage || metadata?.['og:image'] || null;

    // Last resort: construct a favicon URL
    if (!logoUrl) {
      try {
        const baseUrl = new URL(url);
        logoUrl = `${baseUrl.origin}/favicon.ico`;
      } catch {
        logoUrl = null;
      }
    }

    if (logoUrl) {
      // Make relative URLs absolute
      if (!logoUrl.startsWith('http')) {
        try {
          const baseUrl = new URL(url);
          logoUrl = new URL(logoUrl, baseUrl.origin).toString();
        } catch {}
      }

      await supabase
        .from('companies')
        .update({ logo_url: logoUrl, website_url: url })
        .eq('id', companyId);
    }

    return new Response(
      JSON.stringify({ success: !!logoUrl, logoUrl, source: 'metadata_fallback' }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fallback logo fetch failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Could not extract logo' }),
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    );
  }
}
