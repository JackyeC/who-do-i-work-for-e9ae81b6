const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resilientSearch } from '../_shared/resilient-search.ts';

const PAY_EQUITY_VENDORS = [
  'PayAnalytics', 'Syndio', 'Beqom', 'Trusaic', 'Payscale',
  'Mercer', 'Aon', 'Willis Towers Watson', 'Korn Ferry', 'Salary.com',
  'Pave', 'Figures', 'Ravio', 'Compa', 'OpenComp',
];

const REFERENCE_SOURCES = {
  bls: { label: 'U.S. Bureau of Labor Statistics', url: 'https://www.bls.gov/cps/earnings.htm', stat: 'Women earn ~83¢ per $1 earned by men (2024 BLS data)' },
  aauw: { label: 'AAUW Pay Gap Tracker', url: 'https://www.aauw.org/resources/research/simple-truth/', stat: 'Women earn ~84% of what men earn' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (!lovableKey) {
      return new Response(JSON.stringify({ success: false, error: 'AI gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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

    const { results } = await resilientSearch(searchQueries, firecrawlKey, lovableKey);

    let allContent = results.map(r =>
      `SOURCE: ${r.url}\nTITLE: ${r.title}\n${r.description}\n${r.markdown?.slice(0, 2000) || ''}`
    ).join('\n\n');

    const now = new Date().toISOString();

    if (!allContent || allContent.length < 100) {
      await supabase.from('pay_equity_signals').delete().eq('company_id', companyId).eq('status', 'auto_detected');
      return new Response(JSON.stringify({
        success: true, signalsFound: 0, sourcesScanned: 0, referenceData: REFERENCE_SOURCES,
        message: 'No pay equity signals detected.', scannedAt: now,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const vendorList = PAY_EQUITY_VENDORS.join(', ');
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert at detecting pay equity signals. Return only valid JSON.' },
          { role: 'user', content: `Analyze content about "${companyName}" for pay equity evidence.\n\nCategories: pay_reporting, salary_transparency, workforce_disclosure, litigation, certification, compensation_policy, public_commitment, vendor_detection, gap_metrics\n\nReturn JSON:\n{"signals": [{"signal_type": "string", "signal_category": "string", "source_url": null, "source_type": "string", "source_title": null, "evidence_text": "string", "detection_method": "string", "confidence": "string", "jurisdiction": null}], "gap_metrics": {"gender_pay_gap_pct": null, "racial_pay_gap_pct": null, "ceo_worker_ratio": null, "disclosed_year": null}, "vendors_detected": [], "has_pay_audit": false, "salary_ranges_in_postings": false}\n\nContent:\n${allContent.slice(0, 28000)}` },
        ],
      }),
    });

    if (!aiResp.ok) {
      return new Response(JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content || '{}';
    let parsed: any;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch { parsed = { signals: [] }; }

    const signals = Array.isArray(parsed.signals) ? parsed.signals : (Array.isArray(parsed) ? parsed : []);

    await supabase.from('pay_equity_signals').delete().eq('company_id', companyId).eq('status', 'auto_detected');
    if (signals.length > 0) {
      await supabase.from('pay_equity_signals').insert(
        signals.slice(0, 40).map((s: any) => ({
          company_id: companyId, signal_type: s.signal_type || 'unknown',
          signal_category: s.signal_category || 'pay_reporting',
          source_url: s.source_url || null, source_type: s.source_type || null,
          source_title: s.source_title || null, evidence_text: s.evidence_text || null,
          detection_method: s.detection_method || 'keyword_detection',
          confidence: s.confidence || 'moderate_inference', jurisdiction: s.jurisdiction || null,
          date_detected: now, status: 'auto_detected',
        }))
      );
    }

    return new Response(JSON.stringify({
      success: true, signalsFound: signals.length, sourcesScanned: results.length,
      gapMetrics: parsed.gap_metrics || null, vendorsDetected: parsed.vendors_detected || [],
      hasPayAudit: parsed.has_pay_audit || false, salaryRangesInPostings: parsed.salary_ranges_in_postings || false,
      referenceData: REFERENCE_SOURCES, scannedAt: now,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Pay equity scan error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
