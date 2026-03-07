const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const HR_KEYWORDS = [
  // Recruiting & Screening
  'AI recruiting', 'automated candidate screening', 'automated screening', 'resume ranking',
  'applicant scoring', 'candidate scoring', 'AI resume screening', 'sourcing automation',
  'predictive hiring', 'algorithmic hiring', 'AI hiring',
  // Interview & Assessment
  'interview intelligence', 'video interview analysis', 'interview assessment',
  'recruiting chatbot', 'chatbot recruiting',
  // Talent Management
  'talent intelligence', 'skills inference', 'skills graph', 'matching engine',
  'talent marketplace', 'internal talent marketplace',
  // Workforce Analytics
  'workforce analytics', 'people analytics', 'performance analytics',
  'performance prediction', 'workforce planning AI',
  // Employee Monitoring
  'employee monitoring', 'scheduling automation', 'worker surveillance',
  // Compliance & Governance
  'automated employment decision tool', 'AEDT', 'bias audit',
  'algorithmic decision making', 'automated decision making', 'automated decision-making',
  'AI governance policy', 'algorithmic impact assessment', 'algorithmic transparency',
  'AI hiring transparency', 'Local Law 144', 'EU AI Act employment',
  // General
  'HR automation', 'HR tech', 'recruiting technology', 'talent acquisition technology',
];

const VENDOR_MAP: Record<string, string> = {
  'HireVue': 'video interview analysis',
  'Modern Hire': 'interview intelligence',
  'Eightfold AI': 'talent intelligence',
  'Eightfold': 'talent intelligence',
  'Paradox': 'chatbot recruiting assistant',
  'Olivia': 'chatbot recruiting assistant',
  'Phenom': 'talent marketplace',
  'SeekOut': 'sourcing automation',
  'Workday': 'workforce analytics',
  'iCIMS': 'applicant tracking',
  'Greenhouse': 'applicant tracking',
  'SAP SuccessFactors': 'workforce analytics',
  'SuccessFactors': 'workforce analytics',
  'Oracle HCM': 'workforce analytics',
  'Harver': 'automated candidate scoring',
  'pymetrics': 'automated candidate scoring',
  'Textio': 'AI job description optimization',
  'Beamery': 'talent marketplace',
  'HiredScore': 'AI resume screening',
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
    'Recruiting & Screening': ['AI resume screening', 'automated candidate scoring', 'applicant tracking', 'sourcing automation', 'automated candidate screening', 'AI job description optimization'],
    'Interview & Assessment': ['interview intelligence', 'video interview analysis', 'chatbot recruiting assistant', 'recruiting chatbot'],
    'Talent Management': ['talent intelligence', 'talent marketplace', 'internal talent marketplace', 'skills inference'],
    'Workforce Analytics': ['workforce analytics', 'people analytics', 'performance prediction', 'performance analytics'],
    'Employee Monitoring': ['employee monitoring', 'scheduling automation', 'worker surveillance'],
    'Compliance & Governance': ['bias audit', 'AEDT compliance', 'AI governance', 'algorithmic impact assessment', 'algorithmic transparency'],
    'HR Automation': ['HR automation'],
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

    console.log(`AI HR scan for: ${companyName}`);

    // Step 1: Search for evidence across multiple source categories
    const searchQueries = [
      `"${companyName}" AI hiring recruiting automation technology`,
      `"${companyName}" automated screening candidate assessment applicant scoring`,
      `"${companyName}" employee monitoring workforce analytics people analytics`,
      `"${companyName}" bias audit algorithmic decision automated employment`,
      `"${companyName}" HR technology vendor talent acquisition platform`,
      `"${companyName}" AI governance policy hiring transparency`,
      `"${companyName}" recruiting chatbot interview intelligence video interview`,
      `"${companyName}" privacy policy automated decision making`,
    ];

    let allContent = '';
    const allSourceUrls: string[] = [];

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
            allSourceUrls.push(r.url);
            allContent += `\n\nSOURCE: ${r.url}\nTITLE: ${r.title}\n${r.description || ''}\n${r.markdown?.slice(0, 2000) || ''}`;
          }
        }
      } catch (e) {
        console.error(`Search failed for: ${query}`, e);
      }
    }

    // Step 2: Crawl company careers page and privacy policy if available
    const { data: company } = await supabase
      .from('companies')
      .select('careers_url')
      .eq('id', companyId)
      .single();

    const pagesToScrape: { url: string; type: string }[] = [];
    if (company?.careers_url) {
      pagesToScrape.push({ url: company.careers_url, type: 'company careers page' });
    }

    // Try common privacy policy and AI governance URLs
    const companyDomain = extractDomain(companyName);
    if (companyDomain) {
      pagesToScrape.push(
        { url: `https://www.${companyDomain}/privacy`, type: 'privacy policy' },
        { url: `https://www.${companyDomain}/ai-principles`, type: 'AI governance policy' },
      );
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
            waitFor: 3000,
          }),
        });

        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          const md = scrapeData.data?.markdown || scrapeData.markdown || '';
          if (md.length > 50) {
            allContent += `\n\nSOURCE: ${page.url}\nTYPE: ${page.type}\n${md.slice(0, 5000)}`;
          }
        }
      } catch (e) {
        console.error(`Scrape failed for ${page.url}`, e);
      }
    }

    const now = new Date().toISOString();

    if (!allContent || allContent.length < 100) {
      // Record explicit "no signals" scan result
      await supabase
        .from('ai_hr_signals')
        .delete()
        .eq('company_id', companyId)
        .eq('status', 'auto_detected');

      return new Response(JSON.stringify({
        success: true, signalsFound: 0,
        message: 'No AI hiring technology signals detected in scanned public sources.',
        scannedAt: now,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 3: AI extraction with expanded prompt
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
            content: 'You are an expert at detecting AI and automation usage in corporate hiring and HR practices from public sources. Return only valid JSON.',
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

Return [] if no evidence found. Be conservative — only flag things with actual evidence.

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

    console.log(`Detected ${signals.length} AI/HR signals for ${companyName}`);

    // Step 4: Upsert signals (clear old auto-detected, keep verified/disputed)
    await supabase
      .from('ai_hr_signals')
      .delete()
      .eq('company_id', companyId)
      .eq('status', 'auto_detected');

    if (signals.length === 0) {
      return new Response(JSON.stringify({
        success: true, signalsFound: 0,
        message: 'No AI hiring technology signals detected in scanned public sources.',
        scannedAt: now,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: insertErr } = await supabase.from('ai_hr_signals').insert(
      signals.slice(0, 30).map((s: any) => ({
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
    console.error('AI HR scan error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
