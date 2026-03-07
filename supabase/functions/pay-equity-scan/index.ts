const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Pay Equity Analytics Vendors ─────────────────────────────────────
const PAY_EQUITY_VENDORS = [
  'PayAnalytics', 'Syndio', 'Beqom', 'Trusaic', 'Payscale',
  'Compensation Advisory Partners', 'Mercer', 'Aon', 'Willis Towers Watson',
  'Korn Ferry', 'Salary.com', 'CompAnalyst', 'Carta Total Comp',
  'Pave', 'Figures', 'Ravio', 'Compa', 'OpenComp',
];

// ─── Reference Data Sources ───────────────────────────────────────────
const REFERENCE_SOURCES = {
  bls: {
    label: 'U.S. Bureau of Labor Statistics',
    url: 'https://www.bls.gov/cps/earnings.htm',
    stat: 'Women earn ~83¢ per $1 earned by men (2024 BLS data)',
  },
  aauw: {
    label: 'AAUW Pay Gap Tracker',
    url: 'https://www.aauw.org/resources/research/simple-truth/',
    stat: 'Women earn ~84% of what men earn; gap widens for women of color',
  },
  equalPayDay: {
    label: 'Equal Pay Day',
    description: 'Symbolic date showing how far into the next year women must work to match men\'s prior-year earnings',
    dates: {
      all_women: 'March 12',
      black_women: 'July 9',
      latina_women: 'October 3',
      native_women: 'September 21',
      aapi_women: 'April 3',
    },
  },
};

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

    console.log(`Enhanced pay equity scan for: ${companyName}`);

    // ─── Phase 1: Expanded search queries ─────────────────────────
    const searchQueries = [
      `"${companyName}" pay equity gender pay gap equal pay report`,
      `"${companyName}" salary transparency compensation disclosure pay band`,
      `"${companyName}" workforce demographics diversity report median pay EEO-1`,
      `"${companyName}" pay discrimination EEOC OFCCP settlement lawsuit`,
      `"${companyName}" equal pay certification EDGE Fair Pay Workplace`,
      `"${companyName}" ESG compensation transparency workforce disclosure`,
      `"${companyName}" PayAnalytics Syndio Beqom Trusaic pay audit vendor`,
      `"${companyName}" gender pay gap report racial pay disparity executive compensation ratio`,
      `"${companyName}" salary range job posting pay transparency law`,
    ];

    let allContent = '';
    let sourcesScanned = 0;

    for (const query of searchQueries) {
      try {
        const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 5 }),
        });
        if (searchResp.ok) {
          const searchData = await searchResp.json();
          const results = searchData.data || [];
          sourcesScanned += results.length;
          for (const r of results) {
            allContent += `\n\nSOURCE: ${r.url}\nTITLE: ${r.title}\n${r.description || ''}\n${r.markdown?.slice(0, 2000) || ''}`;
          }
        }
      } catch (e) {
        console.error(`Search failed for: ${query}`, e);
      }
    }

    // Scrape careers page for salary ranges
    const { data: company } = await supabase
      .from('companies')
      .select('careers_url, industry')
      .eq('id', companyId)
      .single();

    if (company?.careers_url) {
      try {
        const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: company.careers_url, formats: ['markdown'], onlyMainContent: true, waitFor: 3000 }),
        });
        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          const md = scrapeData.data?.markdown || scrapeData.markdown || '';
          if (md.length > 50) {
            allContent += `\n\nSOURCE: ${company.careers_url}\nTYPE: company careers page\n${md.slice(0, 5000)}`;
            sourcesScanned++;
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
        success: true, signalsFound: 0, sourcesScanned,
        referenceData: REFERENCE_SOURCES,
        message: 'No pay equity signals detected in scanned sources.',
        scannedAt: now,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const truncated = allContent.slice(0, 28000);
    const vendorList = PAY_EQUITY_VENDORS.join(', ');

    // ─── Phase 2: Enhanced AI Analysis ────────────────────────────
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at detecting pay equity, compensation transparency, and workforce disclosure signals. Return only valid JSON. Be neutral — do not make legal conclusions.',
          },
          {
            role: 'user',
            content: `Analyze content about "${companyName}" for pay equity evidence.

Detect signals in these categories:
- pay_reporting: published pay equity reports, gender/racial pay gap disclosures, median pay data
- salary_transparency: salary ranges in job postings, pay band disclosure, pay transparency compliance
- workforce_disclosure: EEO-1 data, workforce demographic reports, diversity data, board composition
- litigation: pay discrimination lawsuits, EEOC complaints, OFCCP audits, settlements
- certification: equal pay certifications (EDGE, Fair Pay Workplace, etc.)
- compensation_policy: compensation philosophy, total rewards, CEO-to-worker pay ratio
- public_commitment: public pledges on pay equity, signed commitments
- vendor_detection: use of pay equity analytics tools (${vendorList})
- gap_metrics: any specific gender or racial pay gap percentages disclosed

Return JSON:
{
  "signals": [{
    "signal_type": "specific signal description",
    "signal_category": "one of the categories above",
    "source_url": "URL or null",
    "source_type": "e.g. ESG report, careers page, press release, court record",
    "source_title": "title or null",
    "evidence_text": "1-2 sentence neutral factual summary",
    "detection_method": "keyword_detection|source_parsing|structured_disclosure",
    "confidence": "direct|strong_inference|moderate_inference|weak_inference",
    "jurisdiction": "state/federal or null"
  }],
  "gap_metrics": {
    "gender_pay_gap_pct": null,
    "racial_pay_gap_pct": null,
    "ceo_worker_ratio": null,
    "disclosed_year": null
  },
  "vendors_detected": [],
  "has_pay_audit": false,
  "salary_ranges_in_postings": false
}

Content:
${truncated}`,
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      if (status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: false, error: 'AI analysis failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content || '{}';

    let parsed: any;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error('Failed to parse AI output:', raw.slice(0, 500));
      parsed = { signals: [] };
    }

    const signals = Array.isArray(parsed.signals) ? parsed.signals : (Array.isArray(parsed) ? parsed : []);

    console.log(`Detected ${signals.length} pay equity signals, vendors: ${(parsed.vendors_detected || []).join(', ')}`);

    // Clear old auto-detected
    await supabase.from('pay_equity_signals').delete()
      .eq('company_id', companyId).eq('status', 'auto_detected');

    if (signals.length > 0) {
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
      }
    }

    return new Response(JSON.stringify({
      success: true,
      signalsFound: signals.length,
      sourcesScanned,
      gapMetrics: parsed.gap_metrics || null,
      vendorsDetected: parsed.vendors_detected || [],
      hasPayAudit: parsed.has_pay_audit || false,
      salaryRangesInPostings: parsed.salary_ranges_in_postings || false,
      referenceData: REFERENCE_SOURCES,
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
