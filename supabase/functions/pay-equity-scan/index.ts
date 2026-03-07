const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAY_EQUITY_KEYWORDS = [
  'pay equity', 'equal pay', 'gender pay gap', 'racial pay gap',
  'compensation transparency', 'salary transparency', 'posted salary range',
  'pay audit', 'pay parity', 'unexplained pay gap', 'equal pay certification',
  'compensation review', 'wage discrimination', 'pay discrimination',
  'EEOC settlement', 'OFCCP', 'compensation analysis', 'workforce demographics',
  'diversity report', 'median pay', 'promotion equity', 'internal mobility equity',
  'pay band', 'salary band', 'compensation philosophy', 'total rewards',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!firecrawlKey || !lovableKey) {
      return new Response(JSON.stringify({ success: false, error: 'Required API keys not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Pay equity scan for: ${companyName}`);

    const searchQueries = [
      `"${companyName}" pay equity gender pay gap equal pay report`,
      `"${companyName}" salary transparency compensation disclosure pay band`,
      `"${companyName}" workforce demographics diversity report median pay`,
      `"${companyName}" pay discrimination EEOC OFCCP settlement lawsuit`,
      `"${companyName}" equal pay certification compensation philosophy`,
      `"${companyName}" ESG compensation transparency workforce disclosure`,
    ];

    let allContent = '';

    for (const query of searchQueries) {
      try {
        const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, limit: 5 }),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          const results = searchData.data || [];
          for (const r of results) {
            allContent += `\n\nSOURCE: ${r.url}\nTITLE: ${r.title}\n${r.description || ''}\n${r.markdown?.slice(0, 2000) || ''}`;
          }
        }
      } catch (e) {
        console.error(`Search failed for: ${query}`, e);
      }
    }

    // Try scraping careers/benefits page for salary ranges
    const { data: company } = await supabase
      .from('companies')
      .select('careers_url')
      .eq('id', companyId)
      .single();

    if (company?.careers_url) {
      try {
        const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: company.careers_url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });
        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          const md = scrapeData.data?.markdown || scrapeData.markdown || '';
          if (md.length > 50) {
            allContent += `\n\nSOURCE: ${company.careers_url}\nTYPE: company careers page\n${md.slice(0, 5000)}`;
          }
        }
      } catch (e) {
        console.error('Careers page scrape failed', e);
      }
    }

    const now = new Date().toISOString();

    if (!allContent || allContent.length < 100) {
      await supabase.from('pay_equity_signals').delete()
        .eq('company_id', companyId).eq('status', 'auto_detected');

      return new Response(JSON.stringify({
        success: true, signalsFound: 0,
        message: 'No pay equity or compensation transparency signals detected in scanned sources.',
        scannedAt: now,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const truncated = allContent.slice(0, 25000);

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at detecting pay equity, compensation transparency, and workforce disclosure signals from public corporate sources. Return only valid JSON. Be neutral and factual — do not make unsupported legal conclusions.',
          },
          {
            role: 'user',
            content: `Analyze the following content about "${companyName}" for evidence of pay equity practices, compensation transparency, and workforce disclosure.

Detect signals in these categories:
- pay_reporting: published pay equity reports or analyses
- salary_transparency: salary ranges in job postings, pay band disclosure
- workforce_disclosure: workforce demographic reports, diversity data
- litigation: pay discrimination lawsuits, EEOC complaints, settlements
- certification: equal pay certifications (e.g., EDGE, Fair Pay Workplace)
- compensation_policy: compensation philosophy statements, total rewards disclosures
- public_commitment: public pledges or commitments related to pay equity

Return a JSON array of detected signals:
[{
  "signal_type": "specific signal, e.g. 'pay equity report published', 'salary ranges disclosed in job postings', 'pay discrimination settlement detected'",
  "signal_category": "one of: pay_reporting, salary_transparency, workforce_disclosure, litigation, certification, compensation_policy, public_commitment",
  "source_url": "URL where evidence was found, or null",
  "source_type": "e.g. company ESG report, careers page, press release, court record, news source",
  "source_title": "title of the source document or page",
  "evidence_text": "1-2 sentence quote or factual summary of the evidence. Stay neutral.",
  "detection_method": "keyword_detection or source_parsing or structured_disclosure",
  "confidence": "direct, strong_inference, moderate_inference, or weak_inference",
  "jurisdiction": "state or federal jurisdiction if relevant, or null"
}]

Return [] if no evidence found. Be specific and factual. Do not claim a company discriminates unless a primary source explicitly states that.

Content:
${truncated}`,
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      console.error('AI extraction failed:', aiResp.status);
      return new Response(JSON.stringify({ success: false, error: 'AI analysis failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content || '[]';

    let signals: any[];
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      signals = JSON.parse(jsonMatch[1].trim());
      if (!Array.isArray(signals)) signals = [];
    } catch {
      console.error('Failed to parse AI output:', raw.slice(0, 500));
      signals = [];
    }

    console.log(`Detected ${signals.length} pay equity signals for ${companyName}`);

    // Clear old auto-detected signals
    await supabase.from('pay_equity_signals').delete()
      .eq('company_id', companyId).eq('status', 'auto_detected');

    if (signals.length === 0) {
      return new Response(JSON.stringify({
        success: true, signalsFound: 0,
        message: 'No pay equity or compensation transparency signals detected in scanned sources.',
        scannedAt: now,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: insertErr } = await supabase.from('pay_equity_signals').insert(
      signals.slice(0, 40).map((s: any) => ({
        company_id: companyId,
        signal_type: s.signal_type || 'unknown',
        signal_category: s.signal_category || 'pay_reporting',
        source_url: s.source_url || null,
        source_type: s.source_type || null,
        source_title: s.source_title || null,
        evidence_text: s.evidence_text || null,
        detection_method: s.detection_method || 'keyword_detection',
        confidence: s.confidence || 'moderate_inference',
        jurisdiction: s.jurisdiction || null,
        date_detected: now,
        status: 'auto_detected',
      }))
    );

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return new Response(JSON.stringify({ success: false, error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      signalsFound: signals.length,
      companyId,
      scannedAt: now,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Pay equity scan error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
