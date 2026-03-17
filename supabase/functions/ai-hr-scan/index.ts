const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resilientSearch } from '../_shared/resilient-search.ts';

const HR_KEYWORDS = [
  'AI recruiting', 'automated candidate screening', 'automated screening', 'resume ranking',
  'applicant scoring', 'candidate scoring', 'AI resume screening', 'sourcing automation',
  'predictive hiring', 'algorithmic hiring', 'AI hiring',
  'interview intelligence', 'video interview analysis', 'interview assessment',
  'recruiting chatbot', 'chatbot recruiting',
  'talent intelligence', 'skills inference', 'skills graph', 'matching engine',
  'talent marketplace', 'internal talent marketplace',
  'workforce analytics', 'people analytics', 'performance analytics',
  'performance prediction', 'workforce planning AI',
  'employee monitoring', 'scheduling automation', 'worker surveillance',
  'automated employment decision tool', 'AEDT', 'bias audit',
  'algorithmic decision making', 'automated decision making', 'automated decision-making',
  'AI governance policy', 'algorithmic impact assessment', 'algorithmic transparency',
  'AI hiring transparency', 'Local Law 144', 'EU AI Act employment',
  'HR automation', 'HR tech', 'recruiting technology', 'talent acquisition technology',
  'candidate matching', 'recruiting automation', 'HR automation',
];

const VENDOR_MAP: Record<string, string> = {
  'HireVue': 'video interview assessment',
  'Modern Hire': 'interview intelligence',
  'Eightfold AI': 'talent intelligence / matching',
  'Eightfold': 'talent intelligence / matching',
  'Paradox': 'recruiting chatbot',
  'Olivia': 'recruiting chatbot',
  'Phenom': 'talent experience platform',
  'SeekOut': 'sourcing intelligence',
  'Workday': 'HCM with AI recruiting features',
  'iCIMS': 'applicant tracking',
  'Greenhouse': 'ATS with automation',
  'SAP SuccessFactors': 'workforce analytics',
  'SuccessFactors': 'workforce analytics',
  'Oracle HCM': 'workforce analytics',
  'Harver': 'automated candidate scoring',
  'pymetrics': 'automated candidate scoring',
  'Textio': 'AI job description optimization',
  'Beamery': 'talent CRM and automation',
  'HiredScore': 'AI candidate ranking',
  'UKG': 'workforce analytics',
  'Visier': 'people analytics',
  'Gloat': 'internal talent marketplace',
  'Cornerstone OnDemand': 'talent marketplace',
  'Lattice': 'performance prediction',
  'BambooHR': 'HR automation',
  'Lever': 'applicant tracking',
  'SmartRecruiters': 'AI resume screening',
  'Fetcher': 'sourcing automation',
  'Humanly': 'chatbot recruiting assistant',
  'Entelo': 'sourcing automation',
  'Jobvite': 'applicant tracking',
  'Avature': 'talent marketplace',
  'Hiretual': 'sourcing automation',
  'hireEZ': 'sourcing automation',
  'Censia': 'talent intelligence',
  'Arya': 'AI resume screening',
  'Ideal': 'automated candidate screening',
  'Mya Systems': 'chatbot recruiting assistant',
  'X0PA AI': 'automated candidate scoring',
  'Retrain.ai': 'skills inference',
  'SkyHive': 'skills inference',
  'Degreed': 'talent marketplace',
  'Fuel50': 'internal talent marketplace',
  'Teramind': 'employee monitoring',
  'ActivTrak': 'employee monitoring',
  'Hubstaff': 'employee monitoring',
  'Time Doctor': 'employee monitoring',
  'Veriato': 'employee monitoring',
  'Aware': 'employee monitoring',
};

function classifySignalCategory(signalType: string): string {
  const categories: Record<string, string[]> = {
    'Recruiting & Screening': ['AI resume screening', 'automated candidate scoring', 'applicant tracking', 'sourcing automation', 'automated candidate screening', 'AI job description optimization', 'AI candidate ranking', 'candidate matching', 'predictive hiring'],
    'Interview & Assessment': ['interview intelligence', 'video interview', 'chatbot recruiting', 'recruiting chatbot'],
    'Talent Management': ['talent intelligence', 'talent marketplace', 'internal talent marketplace', 'skills inference', 'talent CRM', 'talent experience'],
    'Workforce Analytics': ['workforce analytics', 'people analytics', 'performance prediction', 'performance analytics', 'HCM'],
    'Employee Monitoring': ['employee monitoring', 'scheduling automation', 'worker surveillance'],
    'Compliance & Governance': ['bias audit', 'AEDT', 'AI governance', 'algorithmic impact', 'algorithmic transparency', 'Local Law 144'],
    'HR Automation': ['HR automation', 'ATS with automation'],
  };
  for (const [category, types] of Object.entries(categories)) {
    if (types.some(t => signalType.toLowerCase().includes(t.toLowerCase()))) return category;
  }
  return 'Other';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const scanLog: Record<string, any> = {
    scan_timestamp: new Date().toISOString(),
    steps: {},
  };

  try {
    const { companyId, companyName, searchNames, entityMap } = await req.json();
    scanLog.company_id = companyId;
    scanLog.company_name = companyName;

    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required', scanStatus: 'failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableKey) {
      console.error('SCAN_LOG:', JSON.stringify({ ...scanLog, steps: { config: 'MISSING_LOVABLE_KEY' } }));
      return new Response(JSON.stringify({ success: false, error: 'AI gateway not configured', scanStatus: 'failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[ai-hr-scan] START: ${companyName} (${companyId})`);

    // Use resolved entity names for broader search coverage
    const entityNames = (searchNames && searchNames.length > 0)
      ? searchNames.filter((n: string) => n.length >= 3).slice(0, 5)
      : [companyName];
    const primaryName = companyName;
    const additionalNames = entityNames.filter((n: string) => n !== primaryName).slice(0, 3);

    console.log(`[ai-hr-scan] Searching with ${entityNames.length} entity names`);

    // ── Step 1: Build search queries ──
    const searchQueries = [
      `"${primaryName}" AI hiring recruiting automation technology`,
      `"${primaryName}" automated screening candidate assessment applicant scoring`,
      `"${primaryName}" employee monitoring workforce analytics people analytics`,
      `"${primaryName}" bias audit algorithmic decision automated employment`,
      `"${primaryName}" HR technology vendor talent acquisition platform`,
      `"${primaryName}" AI governance policy hiring transparency`,
      `"${primaryName}" recruiting chatbot interview intelligence video interview`,
      `"${primaryName}" privacy policy automated decision making`,
      `"${primaryName}" HireVue`,
      `"${primaryName}" Eightfold AI`,
      `"${primaryName}" Phenom recruiting`,
      `"${primaryName}" Paradox chatbot`,
      `"${primaryName}" talent intelligence recruiting automation`,
    ];

    for (const altName of additionalNames) {
      searchQueries.push(`"${altName}" AI hiring recruiting automation HR technology`);
      searchQueries.push(`"${altName}" employee monitoring workforce analytics bias audit`);
    }

    // Use resilient search: Firecrawl → Gemini fallback (free)
    const { results: searchResults, source: searchSource } = await resilientSearch(
      searchQueries, firecrawlKey, lovableKey, { batchSize: 3 }
    );

    let allContent = '';
    const allSourceUrls: string[] = [];
    let pagesReturnedCount = searchResults.length;

    for (const r of searchResults) {
      allSourceUrls.push(r.url);
      allContent += `\n\nSOURCE: ${r.url}\nTITLE: ${r.title}\n${r.description || ''}\n${r.markdown?.slice(0, 2000) || ''}`;
    }

    scanLog.steps.search = { source: searchSource, pages_returned: pagesReturnedCount };
    console.log(`[ai-hr-scan] Search complete via ${searchSource}: ${pagesReturnedCount} results`);

    // ── Step 2: Crawl company pages (only if Firecrawl is available) ──
    let scrapeSuccessCount = 0;
    let scrapeFailCount = 0;

    if (firecrawlKey) {
      const { data: companyRow } = await supabase
        .from('companies')
        .select('careers_url')
        .eq('id', companyId)
        .single();

      const pagesToScrape: { url: string; type: string }[] = [];
      if (companyRow?.careers_url) {
        pagesToScrape.push({ url: companyRow.careers_url, type: 'company careers page' });
      }

      const companyDomain = extractDomain(companyName);
      if (companyDomain) {
        const paths = ['/careers', '/jobs', '/privacy', '/about'];
        for (const path of paths) {
          pagesToScrape.push({ url: `https://www.${companyDomain}${path}`, type: `company ${path.slice(1)} page` });
        }
      }

      for (const page of pagesToScrape) {
        try {
          const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: page.url,
              formats: ['markdown'],
              onlyMainContent: true,
              waitFor: 4000,
            }),
          });

          if (scrapeResp.status === 402) {
            console.log('[ai-hr-scan] Firecrawl credits exhausted, skipping remaining scrapes');
            break;
          }

          if (scrapeResp.ok) {
            const scrapeData = await scrapeResp.json();
            const md = scrapeData.data?.markdown || scrapeData.markdown || '';
            if (md.length > 50) {
              scrapeSuccessCount++;
              pagesReturnedCount++;
              allContent += `\n\nSOURCE: ${page.url}\nTYPE: ${page.type}\n${md.slice(0, 5000)}`;
              allSourceUrls.push(page.url);
            }
          } else {
            scrapeFailCount++;
          }
        } catch (e) {
          scrapeFailCount++;
        }
      }
    } else {
      console.log('[ai-hr-scan] No Firecrawl key, skipping page scraping');
    }

    scanLog.steps.scrape = { attempted: scrapeSuccessCount + scrapeFailCount, success: scrapeSuccessCount, failed: scrapeFailCount };
    console.log(`[ai-hr-scan] Scrape: ${scrapeSuccessCount} succeeded`);

    const now = new Date().toISOString();
    const totalSourcesScanned = pagesReturnedCount;

    // ── Step 3: Handle no content ──
    if (!allContent || allContent.length < 100) {
      console.log(`[ai-hr-scan] No content gathered for ${companyName}, marking completed_no_signals`);

      await supabase
        .from('ai_hr_signals')
        .delete()
        .eq('company_id', companyId)
        .eq('status', 'auto_detected');

      scanLog.steps.result = 'completed_no_signals_no_content';
      console.log('[ai-hr-scan] SCAN_LOG:', JSON.stringify(scanLog));

      return new Response(JSON.stringify({
        success: true,
        signalsFound: 0,
        scanStatus: 'completed_no_signals',
        sourcesScanned: totalSourcesScanned,
        message: 'No AI hiring technology signals detected in scanned public sources.',
        scannedAt: now,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Step 4: AI analysis ──
    console.log(`[ai-hr-scan] Starting Gemini analysis with ${allContent.length} chars of content`);
    const truncated = allContent.slice(0, 25000);
    const vendorList = Object.keys(VENDOR_MAP).join(', ');
    const keywordList = HR_KEYWORDS.join(', ');

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
            content: 'You are an expert at detecting AI and automation usage in corporate hiring and HR practices from public sources. Return only valid JSON arrays. Be conservative — only flag things with actual evidence from the provided content. Never fabricate signals.',
          },
          {
            role: 'user',
            content: `Analyze the following content about "${companyName}" for evidence of AI, automation, or algorithmic tools used in hiring, recruiting, HR, workforce analytics, employee monitoring, or performance management.

Look for these vendors: ${vendorList}
Look for these concepts: ${keywordList}

Also specifically look for:
- Bias audit disclosures (NYC Local Law 144, EU AI Act references)
- AI governance policies or commitments related to hiring
- Privacy policy mentions of automated decision-making in employment
- Vendor case studies naming this company as a customer
- Procurement or contracting records for HR technology
- Worker surveillance or monitoring tool evidence

Return a JSON array of detected signals:
[{
  "signal_type": "e.g. AI resume screening, automated candidate scoring, video interview analysis, bias audit disclosure, AI governance policy",
  "tool_name": "specific tool name if mentioned, or null",
  "vendor_name": "vendor company if identified, or null",
  "source_url": "URL where evidence was found, or null",
  "source_type": "e.g. job description, press release, vendor case study, privacy policy, careers page, bias audit, AI governance policy, procurement record, blog post",
  "evidence_text": "1-2 sentence quote or summary of the evidence",
  "detection_method": "keyword_detection or vendor_match or source_parsing or structured_compliance_signal",
  "confidence": "direct, strong_inference, moderate_inference, or weak_inference"
}]

Return [] if no evidence found. Be conservative — only flag things with actual evidence. Never generate generic or placeholder links.

Content:
${truncated}`,
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error(`[ai-hr-scan] AI gateway error: ${aiResp.status} - ${errText.slice(0, 500)}`);
      scanLog.steps.ai = { status: 'failed', http_status: aiResp.status };
      console.log('[ai-hr-scan] SCAN_LOG:', JSON.stringify(scanLog));
      return new Response(JSON.stringify({
        success: false,
        error: `AI analysis failed (${aiResp.status})`,
        scanStatus: 'failed',
        sourcesScanned: totalSourcesScanned,
      }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content || '[]';
    scanLog.steps.ai = { status: 'success', response_length: raw.length };
    console.log(`[ai-hr-scan] AI response received: ${raw.length} chars`);

    let signals: any[];
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      signals = JSON.parse(jsonMatch[1].trim());
      if (!Array.isArray(signals)) signals = [];
    } catch {
      console.error('[ai-hr-scan] Failed to parse AI output:', raw.slice(0, 500));
      signals = [];
    }

    console.log(`[ai-hr-scan] Extracted ${signals.length} signals for ${companyName}`);
    scanLog.steps.extraction = { signals_count: signals.length };

    // ── Step 5: Persist signals ──
    const { error: deleteErr } = await supabase
      .from('ai_hr_signals')
      .delete()
      .eq('company_id', companyId)
      .eq('status', 'auto_detected');

    if (deleteErr) {
      console.error('[ai-hr-scan] Delete old signals error:', deleteErr);
    }

    if (signals.length === 0) {
      scanLog.steps.result = 'completed_no_signals';
      console.log('[ai-hr-scan] SCAN_LOG:', JSON.stringify(scanLog));
      return new Response(JSON.stringify({
        success: true,
        signalsFound: 0,
        scanStatus: 'completed_no_signals',
        sourcesScanned: totalSourcesScanned,
        message: 'No AI hiring technology signals detected in scanned public sources.',
        scannedAt: now,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rows = signals.slice(0, 30).map((s: any) => ({
      company_id: companyId,
      signal_type: s.signal_type || 'unknown',
      signal_category: classifySignalCategory(s.signal_type || ''),
      tool_name: s.tool_name || null,
      vendor_name: s.vendor_name || null,
      source_url: s.source_url || null,
      source_type: s.source_type || null,
      evidence_text: s.evidence_text || null,
      detection_method: s.detection_method || 'keyword_detection',
      confidence: s.confidence || 'moderate_inference',
      date_detected: now,
      last_verified: null,
      status: 'auto_detected',
    }));

    const { error: insertErr } = await supabase.from('ai_hr_signals').insert(rows);

    if (insertErr) {
      console.error('[ai-hr-scan] Insert error:', insertErr);
      scanLog.steps.db_insert = { status: 'failed', error: insertErr.message };
      console.log('[ai-hr-scan] SCAN_LOG:', JSON.stringify(scanLog));
      return new Response(JSON.stringify({
        success: false,
        error: `Database insert failed: ${insertErr.message}`,
        scanStatus: 'failed',
        sourcesScanned: totalSourcesScanned,
      }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    scanLog.steps.db_insert = { status: 'success', rows_inserted: rows.length };
    scanLog.steps.result = 'completed_with_signals';
    console.log(`[ai-hr-scan] SUCCESS: ${rows.length} signals saved for ${companyName}`);
    console.log('[ai-hr-scan] SCAN_LOG:', JSON.stringify(scanLog));

    return new Response(JSON.stringify({
      success: true,
      signalsFound: rows.length,
      scanStatus: 'completed_with_signals',
      sourcesScanned: totalSourcesScanned,
      companyId,
      scannedAt: now,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[ai-hr-scan] Unhandled error:', error);
    scanLog.steps.error = error instanceof Error ? error.message : 'Unknown error';
    console.log('[ai-hr-scan] SCAN_LOG:', JSON.stringify(scanLog));
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      scanStatus: 'failed',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function extractDomain(companyName: string): string | null {
  const simplified = companyName.toLowerCase()
    .replace(/\s+(inc|corp|corporation|llc|ltd|co|company|group|holdings)\.?$/i, '')
    .replace(/[^a-z0-9]/g, '');
  if (simplified.length < 2) return null;
  return `${simplified}.com`;
}
