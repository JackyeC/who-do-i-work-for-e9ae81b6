const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Backfill website_url for companies missing it.
 * Uses AI to discover likely domains from Wikipedia, LinkedIn, SEC, etc.
 * Only auto-assigns if confidence is HIGH; medium/low go to review queue.
 */

function extractDomain(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '').toLowerCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize || 20, 50);
    const companyId = body.companyId; // optional: resolve single company

    // Fetch companies missing website_url
    let query = supabase
      .from('companies')
      .select('id, name, sec_cik, ticker, industry, parent_company')
      .is('website_url', null);

    if (companyId) {
      query = query.eq('id', companyId);
    } else {
      query = query.not('description', 'is', null) // only companies with dossiers
        .order('name', { ascending: true })
        .limit(batchSize);
    }

    const { data: companies, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No companies need website backfill',
        processed: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({
        error: 'LOVABLE_API_KEY not configured — AI discovery unavailable',
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: Array<{
      companyId: string;
      companyName: string;
      url: string | null;
      confidence: string;
      source: string;
      action: 'auto_filled' | 'queued_for_review' | 'no_result';
    }> = [];

    // Process in small batches to avoid timeout
    for (const company of companies) {
      try {
        const contextParts = [
          `Company name: "${company.name}"`,
          company.sec_cik ? `SEC CIK: ${company.sec_cik}` : null,
          company.ticker ? `Stock ticker: ${company.ticker}` : null,
          company.industry ? `Industry: ${company.industry}` : null,
          company.parent_company ? `Parent company: ${company.parent_company}` : null,
        ].filter(Boolean).join('\n');

        const prompt = `Find the official website URL for this company:

${contextParts}

Search strategy:
1. Check if there's a known official website from SEC EDGAR filings
2. Check Wikipedia for an official website
3. Check LinkedIn company page
4. Use known domain patterns (e.g., companyname.com)

Return ONLY a JSON object (no markdown, no explanation) with these fields:
- url: the official website URL (full https:// URL), or null if not found
- confidence: "high" (very sure this is correct), "medium" (likely correct but not certain), or "low" (best guess)
- source: which method found it (one of: "sec_filing", "wikipedia", "linkedin", "domain_pattern", "general_knowledge")
- reasoning: one-sentence explanation of why you chose this URL

IMPORTANT: Only return "high" confidence if you are very sure. For companies you're less certain about, use "medium" or "low".`;

        const aiResp = await fetch('https://ai.lovable.dev/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!aiResp.ok) {
          console.warn(`[backfill-website] AI request failed for ${company.name}: ${aiResp.status}`);
          results.push({ companyId: company.id, companyName: company.name, url: null, confidence: 'none', source: 'error', action: 'no_result' });
          continue;
        }

        const aiData = await aiResp.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*?\}/);

        if (!jsonMatch) {
          console.warn(`[backfill-website] No JSON in AI response for ${company.name}`);
          results.push({ companyId: company.id, companyName: company.name, url: null, confidence: 'none', source: 'parse_error', action: 'no_result' });
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const discoveredUrl = parsed.url;
        const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low';
        const source = parsed.source || 'general_knowledge';

        if (!discoveredUrl) {
          results.push({ companyId: company.id, companyName: company.name, url: null, confidence, source, action: 'no_result' });
          continue;
        }

        const domain = extractDomain(discoveredUrl);

        if (confidence === 'high') {
          // Auto-fill: high confidence
          const { error: updateErr } = await supabase.from('companies').update({
            website_url: discoveredUrl,
            domain,
            domain_confidence: 'high',
            domain_source: source,
            domain_auto_filled: true,
          }).eq('id', company.id);

          if (updateErr) {
            console.error(`[backfill-website] Update failed for ${company.name}:`, updateErr);
          }

          results.push({ companyId: company.id, companyName: company.name, url: discoveredUrl, confidence, source, action: 'auto_filled' });
        } else {
          // Queue for review: medium/low confidence
          await supabase.from('domain_review_queue').upsert({
            company_id: company.id,
            discovered_url: discoveredUrl,
            discovered_domain: domain,
            confidence,
            source_method: source,
            source_detail: parsed.reasoning || null,
            status: 'pending',
          }, { onConflict: 'company_id,discovered_url', ignoreDuplicates: true });

          // Update confidence on the company record
          await supabase.from('companies').update({
            domain_confidence: confidence,
          }).eq('id', company.id);

          results.push({ companyId: company.id, companyName: company.name, url: discoveredUrl, confidence, source, action: 'queued_for_review' });
        }

        console.log(`[backfill-website] ${company.name}: ${confidence} confidence → ${confidence === 'high' ? 'auto-filled' : 'queued'} (${discoveredUrl})`);
      } catch (companyErr: any) {
        console.error(`[backfill-website] Error processing ${company.name}:`, companyErr);
        results.push({ companyId: company.id, companyName: company.name, url: null, confidence: 'error', source: 'error', action: 'no_result' });
      }
    }

    const summary = {
      processed: results.length,
      autoFilled: results.filter(r => r.action === 'auto_filled').length,
      queuedForReview: results.filter(r => r.action === 'queued_for_review').length,
      noResult: results.filter(r => r.action === 'no_result').length,
    };

    console.log(`[backfill-website] Complete: ${JSON.stringify(summary)}`);

    return new Response(JSON.stringify({
      success: true,
      ...summary,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[backfill-website] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
