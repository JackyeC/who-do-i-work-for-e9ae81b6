const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── AI Hiring Vendor Signatures ──────────────────────────────────────
const AI_VENDORS = [
  'Eightfold', 'Phenom', 'HireVue', 'Paradox', 'SeekOut', 'Findem',
  'Pymetrics', 'Harver', 'Beamery', 'Fetcher', 'Gem', 'Hiredge',
  'Textio', 'Datapeople', 'Moonhub', 'Arya', 'Entelo', 'Hiretual',
  'Humanly', 'Olivia', 'XOR', 'Mya Systems', 'AllyO', 'Ideal',
  'Greenhouse AI', 'Lever AI', 'Workday AI', 'SAP SuccessFactors AI',
  'iCIMS AI', 'SmartRecruiters AI',
];

const PSYCH_SAFETY_PATTERNS = [
  'sentiment ai', 'emotion ai', 'emotion detection', 'emotion recognition',
  'video interview analysis', 'facial analysis', 'behavioral analysis',
  'voice analysis', 'tone analysis', 'personality assessment',
  'psychometric ai', 'neuroscience-based hiring',
];

const AUDIT_PATTERNS = [
  'bias audit summary', 'bias audit', 'nyc local law 144', 'aedt disclosure',
  'aedt', 'automated employment decision tool', 'algorithmic audit',
  'bias audit results', 'annual bias audit',
];

// ─── Worker Benefits Categories (reused from worker-benefits-scan) ────
const BENEFIT_CATEGORIES: Record<string, string[]> = {
  'Healthcare': ['health insurance', 'medical coverage', 'dental coverage', 'vision coverage'],
  'Parental Leave': ['parental leave', 'maternity leave', 'paternity leave', 'family leave'],
  'Paid Sick Leave': ['paid sick leave', 'sick days', 'sick time'],
  'Mental Health': ['mental health', 'EAP', 'employee assistance program', 'counseling benefit'],
  'Fertility Benefits': ['fertility benefit', 'fertility coverage', 'IVF coverage', 'egg freezing'],
  'Retirement': ['401k', '401(k)', 'retirement plan', 'pension', 'employer match'],
  'Remote Work': ['remote work', 'work from home', 'hybrid work', 'flexible work'],
  'Childcare': ['childcare', 'child care', 'daycare', 'dependent care'],
  'Education Benefits': ['tuition reimbursement', 'education benefit', 'student loan'],
  'Union Relationships': ['union', 'collective bargaining', 'organized labor'],
  'Caregiver Leave': ['caregiver leave', 'family caregiver', 'eldercare'],
  'Paid Time Off': ['PTO', 'paid time off', 'vacation days', 'unlimited PTO'],
  'Disability Benefits': ['disability insurance', 'short-term disability', 'long-term disability'],
  'Life Insurance': ['life insurance', 'AD&D', 'accidental death'],
  'Equity & Stock': ['stock options', 'RSU', 'restricted stock', 'equity compensation'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName, scanParts } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const parts = scanParts || ['benefits', 'ai_hiring', 'audit_hunt', 'pay_equity'];
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

    console.log(`CivicLens Intelligence Scan for: ${companyName}, parts: ${parts.join(', ')}`);

    // ─── Phase 1: Gather content via Firecrawl ──────────────────────
    const searchQueries = [
      `"${companyName}" employee benefits healthcare parental leave retirement`,
      `"${companyName}" AI hiring technology automated screening recruitment`,
      `"${companyName}" bias audit AEDT NYC Local Law 144 automated employment`,
      `"${companyName}" careers benefits 401k PTO remote work`,
      `"${companyName}" HireVue Eightfold Phenom Paradox SeekOut talent AI`,
      `"${companyName}" union collective bargaining worker protections`,
      `"${companyName}" pay equity gender pay gap equal pay report compensation`,
      `"${companyName}" salary transparency pay band PayAnalytics Syndio CEO pay ratio`,
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
        console.error(`Search failed: ${query}`, e);
      }
    }

    // Scrape careers page if available
    const { data: company } = await supabase
      .from('companies')
      .select('careers_url')
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
            allContent += `\n\nSOURCE: ${company.careers_url}\nTYPE: careers page\n${md.slice(0, 5000)}`;
            sourcesScanned++;
          }
        }
      } catch (e) {
        console.error('Careers scrape failed', e);
      }
    }

    const now = new Date().toISOString();
    const results: Record<string, any> = { benefits: 0, aiHiring: 0, payEquity: 0, auditStatus: 'unknown' };

    if (!allContent || allContent.length < 100) {
      return new Response(JSON.stringify({
        success: true, results, sourcesScanned, scannedAt: now,
        message: 'Insufficient content found in public sources.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const truncated = allContent.slice(0, 30000);

    // ─── Phase 2: AI Analysis ───────────────────────────────────────
    const PAY_EQUITY_VENDORS = 'PayAnalytics, Syndio, Beqom, Trusaic, Payscale, Mercer, Aon, Korn Ferry';

    const aiPrompt = `Analyze the following content about "${companyName}" and extract signals:

**Part A - Worker Benefits:** Detect evidence of employee benefits in these categories: ${Object.keys(BENEFIT_CATEGORIES).join(', ')}

**Part B - AI Hiring Stack:** Detect evidence of these AI hiring vendors: ${AI_VENDORS.join(', ')}
Also detect: ${PSYCH_SAFETY_PATTERNS.join(', ')}

**Part C - Bias Audit Hunt:** Look for: ${AUDIT_PATTERNS.join(', ')}

**Part D - Pay Equity:** Detect evidence of:
- Gender/racial pay gap disclosures (specific percentages)
- Salary transparency (ranges in job postings, pay bands)
- Pay equity audits, certifications (EDGE, Fair Pay Workplace)
- Pay analytics vendors (${PAY_EQUITY_VENDORS})
- CEO-to-worker pay ratios
- Pay discrimination litigation or settlements
- EEO-1 data or workforce demographic reports

Return JSON:
{
  "benefits": [{ "benefit_category": "string", "benefit_type": "string", "source_url": "string|null", "source_type": "string", "evidence_text": "string", "detection_method": "string", "confidence": "direct|strong_inference|moderate_inference|weak_inference" }],
  "ai_hiring": [{ "signal_category": "string (Recruiting & Screening|Interview & Assessment|Talent Management|Employee Monitoring|Compliance & Governance)", "signal_type": "string", "vendor_name": "string|null", "tool_name": "string|null", "source_url": "string|null", "source_type": "string", "evidence_text": "string", "detection_method": "string", "confidence": "direct|strong_inference|moderate_inference|weak_inference", "is_psych_safety_risk": false }],
  "pay_equity": [{ "signal_type": "string", "signal_category": "pay_reporting|salary_transparency|workforce_disclosure|litigation|certification|compensation_policy|public_commitment|vendor_detection|gap_metrics", "source_url": "string|null", "source_type": "string", "evidence_text": "string", "detection_method": "string", "confidence": "direct|strong_inference|moderate_inference|weak_inference", "jurisdiction": "string|null" }],
  "gap_metrics": { "gender_pay_gap_pct": null, "racial_pay_gap_pct": null, "ceo_worker_ratio": null, "disclosed_year": null },
  "pay_vendors_detected": [],
  "has_pay_audit": false,
  "salary_ranges_in_postings": false,
  "bias_audit_found": false,
  "bias_audit_details": "string|null"
}

Content:
${truncated}`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert at detecting employee benefits and AI hiring technology from public sources. Return only valid JSON.' },
          { role: 'user', content: aiPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      if (status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted. Add credits in Settings → Workspace → Usage.' }), {
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
      parsed = { benefits: [], ai_hiring: [], pay_equity: [], bias_audit_found: false };
    }

    // ─── Phase 3: Store results ─────────────────────────────────────
    // Benefits
    if (parts.includes('benefits') && parsed.benefits?.length > 0) {
      await supabase.from('worker_benefit_signals').delete()
        .eq('company_id', companyId).eq('status', 'auto_detected');

      await supabase.from('worker_benefit_signals').insert(
        parsed.benefits.slice(0, 40).map((s: any) => ({
          company_id: companyId,
          benefit_category: s.benefit_category || 'Other',
          benefit_type: s.benefit_type || 'unknown',
          source_url: s.source_url || null,
          source_type: s.source_type || null,
          evidence_text: s.evidence_text || null,
          detection_method: s.detection_method || 'keyword_detection',
          confidence: s.confidence || 'moderate_inference',
          date_detected: now,
          status: 'auto_detected',
        }))
      );
      results.benefits = parsed.benefits.length;
    }

    // AI Hiring
    if (parts.includes('ai_hiring') && parsed.ai_hiring?.length > 0) {
      await supabase.from('ai_hr_signals').delete()
        .eq('company_id', companyId).eq('status', 'auto_detected');

      await supabase.from('ai_hr_signals').insert(
        parsed.ai_hiring.slice(0, 30).map((s: any) => ({
          company_id: companyId,
          signal_category: s.signal_category || 'Recruiting & Screening',
          signal_type: s.signal_type || 'AI Tool Detected',
          vendor_name: s.vendor_name || null,
          tool_name: s.tool_name || null,
          source_url: s.source_url || null,
          source_type: s.source_type || null,
          evidence_text: s.evidence_text || null,
          detection_method: s.detection_method || 'keyword_detection',
          confidence: s.confidence || 'moderate_inference',
          date_detected: now,
          status: 'auto_detected',
        }))
      );
      results.aiHiring = parsed.ai_hiring.length;
    }

    // Pay Equity
    if (parts.includes('pay_equity') && parsed.pay_equity?.length > 0) {
      await supabase.from('pay_equity_signals').delete()
        .eq('company_id', companyId).eq('status', 'auto_detected');

      await supabase.from('pay_equity_signals').insert(
        parsed.pay_equity.slice(0, 30).map((s: any) => ({
          company_id: companyId,
          signal_type: s.signal_type || 'unknown',
          signal_category: s.signal_category || 'pay_reporting',
          source_url: s.source_url || null,
          source_type: s.source_type || null,
          source_title: null,
          evidence_text: s.evidence_text || null,
          detection_method: s.detection_method || 'keyword_detection',
          confidence: s.confidence || 'moderate_inference',
          jurisdiction: s.jurisdiction || null,
          date_detected: now,
          status: 'auto_detected',
        }))
      );
      results.payEquity = parsed.pay_equity.length;
    }

    // Audit status
    results.auditStatus = parsed.bias_audit_found ? 'audit_found' : 'no_audit';
    results.auditDetails = parsed.bias_audit_details || null;
    results.gapMetrics = parsed.gap_metrics || null;
    results.payVendorsDetected = parsed.pay_vendors_detected || [];
    results.hasPayAudit = parsed.has_pay_audit || false;
    results.salaryRangesInPostings = parsed.salary_ranges_in_postings || false;

    // If AI tools found but no audit → flag transparency warning
    if (parsed.ai_hiring?.length > 0 && !parsed.bias_audit_found) {
      results.transparencyWarning = true;
    }

    console.log(`Intelligence scan complete: ${results.benefits} benefits, ${results.aiHiring} AI hiring, ${results.payEquity} pay equity, audit: ${results.auditStatus}`);

    return new Response(JSON.stringify({
      success: true,
      results,
      sourcesScanned,
      scannedAt: now,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Intelligence scan error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
