const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resilientSearch } from '../_shared/resilient-search.ts';
// Vendor fingerprint database: domain → { name, category, risk_flags }
const VENDOR_SIGNATURES: Record<string, { name: string; category: string; riskFlags: string[] }> = {
  // Sourcing AI
  'seekout.io': { name: 'SeekOut', category: 'Sourcing', riskFlags: [] },
  'seekout.com': { name: 'SeekOut', category: 'Sourcing', riskFlags: [] },
  'findem.ai': { name: 'Findem', category: 'Sourcing', riskFlags: [] },
  'hireez.com': { name: 'hireEZ', category: 'Sourcing', riskFlags: [] },
  'juicebox.ai': { name: 'Juicebox', category: 'Sourcing', riskFlags: [] },
  'fetcher.ai': { name: 'Fetcher', category: 'Sourcing', riskFlags: [] },
  'peoplegpt': { name: 'PeopleGPT', category: 'Sourcing', riskFlags: [] },

  // Screening/Ranking (AEDTs)
  'eightfold.ai': { name: 'Eightfold AI', category: 'Screening', riskFlags: ['black_box_ranking'] },
  'eightfold.com': { name: 'Eightfold AI', category: 'Screening', riskFlags: ['black_box_ranking'] },
  'phenom.com': { name: 'Phenom', category: 'Screening', riskFlags: ['black_box_ranking'] },
  'mokahr.io': { name: 'Moka HR', category: 'Screening', riskFlags: ['black_box_ranking'] },
  'ideal.com': { name: 'Ideal (Ceridian)', category: 'Screening', riskFlags: ['black_box_ranking'] },
  'x0pa.com': { name: 'X0PA AI', category: 'Screening', riskFlags: ['black_box_ranking'] },
  'cangrade.com': { name: 'Cangrade', category: 'Screening', riskFlags: ['black_box_ranking'] },
  'beamery.com': { name: 'Beamery', category: 'Screening', riskFlags: ['black_box_ranking'] },
  'ashbyhq.com': { name: 'Ashby', category: 'Screening', riskFlags: [] },

  // Interview/Sentiment AI
  'hirevue.com': { name: 'HireVue', category: 'Interview Intelligence', riskFlags: ['emotion_ai'] },
  'metaview.ai': { name: 'Metaview', category: 'Interview Intelligence', riskFlags: [] },
  'sapia.ai': { name: 'Sapia', category: 'Interview Intelligence', riskFlags: ['emotion_ai'] },
  'brighthire.ai': { name: 'BrightHire', category: 'Interview Intelligence', riskFlags: [] },
  'humanly.io': { name: 'Humanly', category: 'Interview Intelligence', riskFlags: [] },
  'modernloop.io': { name: 'ModernLoop', category: 'Interview Intelligence', riskFlags: [] },
  'teammates.ai': { name: 'Teammates.ai', category: 'Interview Intelligence', riskFlags: ['emotion_ai'] },

  // Assessment AI
  'harver.com': { name: 'Harver', category: 'Assessment', riskFlags: ['black_box_ranking'] },
  'pymetrics.com': { name: 'pymetrics', category: 'Assessment', riskFlags: [] },
  'makipeople.com': { name: 'Maki People', category: 'Assessment', riskFlags: [] },

  // Additional high-profile vendors
  'greenhouse.io': { name: 'Greenhouse', category: 'ATS', riskFlags: [] },
  'icims.com': { name: 'iCIMS', category: 'ATS', riskFlags: [] },
  'workday.com': { name: 'Workday', category: 'HCM', riskFlags: [] },
  'hiredscore.com': { name: 'HiredScore', category: 'Screening', riskFlags: ['black_box_ranking'] },
  'textio.com': { name: 'Textio', category: 'Sourcing', riskFlags: [] },
  'gloat.com': { name: 'Gloat', category: 'Talent Marketplace', riskFlags: [] },
  'visier.com': { name: 'Visier', category: 'Analytics', riskFlags: [] },
  'ukg.com': { name: 'UKG', category: 'HCM', riskFlags: [] },
  'paradox.ai': { name: 'Paradox', category: 'Chatbot', riskFlags: [] },
};

const BIAS_AUDIT_KEYWORDS = [
  'Bias Audit Summary', 'NYC Local Law 144', 'AEDT Notice',
  'Algorithmic Transparency', 'bias audit', 'automated employment decision tool',
  'AEDT disclosure', 'bias audit report', 'algorithmic impact assessment',
  'EU AI Act', 'Illinois AI Video Interview Act', 'Colorado AI Act',
];

const SAFEPATH_RISK_KEYWORDS = [
  'emotion ai', 'emotion detection', 'sentiment analysis', 'facial analysis',
  'facial recognition', 'personality assessment', 'behavioral analysis',
  'black-box', 'black box', 'proprietary algorithm', 'undisclosed scoring',
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

    if (!lovableKey) {
      return new Response(JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`AI Accountability scan for: ${companyName}`);

    // Step 1: Gather content from multiple source types
    const searchQueries = [
      `"${companyName}" careers hiring AI automated screening`,
      `"${companyName}" bias audit AEDT Local Law 144 algorithmic`,
      `"${companyName}" HireVue Eightfold Phenom AI hiring vendor`,
      `"${companyName}" privacy policy automated decision employment`,
      `"${companyName}" AI governance hiring transparency algorithmic`,
      `site:${companyName.toLowerCase().replace(/\s+/g, '')}.com careers`,
    ];

    const { results: searchResults } = await resilientSearch(searchQueries, firecrawlKey, lovableKey);

    let allContent = '';
    const foundUrls: string[] = [];

    for (const r of searchResults) {
      foundUrls.push(r.url || '');
      allContent += `\n\nSOURCE: ${r.url}\nTITLE: ${r.title}\n${r.description || ''}\n${(r.markdown || '').slice(0, 2500)}`;
    }

    // Step 2: Optionally scrape company careers and privacy pages (only if Firecrawl available)
    if (firecrawlKey) {
      const { data: company } = await supabase
        .from('companies')
        .select('careers_url')
        .eq('id', companyId)
        .single();

      const pagesToScrape: { url: string; label: string }[] = [];
      if (company?.careers_url) {
        pagesToScrape.push({ url: company.careers_url, label: 'careers page' });
      }

      const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      pagesToScrape.push(
        { url: `https://www.${domain}.com/privacy`, label: 'privacy policy' },
        { url: `https://www.${domain}.com/careers`, label: 'careers page' },
      );

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
              formats: ['markdown', 'html'],
              onlyMainContent: false,
              waitFor: 4000,
            }),
          });
          if (scrapeResp.ok) {
            const scrapeData = await scrapeResp.json();
            const md = scrapeData.data?.markdown || scrapeData.markdown || '';
            const html = scrapeData.data?.html || scrapeData.html || '';
            if (md.length > 50 || html.length > 50) {
              allContent += `\n\nSOURCE: ${page.url}\nTYPE: ${page.label}\nMARKDOWN:\n${md.slice(0, 5000)}\nHTML_EXCERPT:\n${html.slice(0, 5000)}`;
            }
          }
        } catch (e) {
          console.error(`Scrape failed for ${page.url}`, e);
        }
      }
    }

    const now = new Date().toISOString();

    if (!allContent || allContent.length < 100) {
      await supabase.from('ai_hiring_signals').delete()
        .eq('company_id', companyId).eq('status', 'Detected');

      return new Response(JSON.stringify({
        success: true, signalsFound: 0, transparencyScore: null,
        message: 'Insufficient public data found for analysis.',
        scannedAt: now,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 3: AI analysis with vendor fingerprinting + bias audit detection
    const truncated = allContent.slice(0, 28000);
    const vendorDomains = Object.entries(VENDOR_SIGNATURES)
      .map(([domain, info]) => `${domain} → ${info.name} (${info.category})`)
      .join('\n');

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
            content: `You are an expert at detecting AI hiring vendors and regulatory compliance from corporate web content. You analyze HTML, scripts, and text for technical signatures of AI hiring tools. Return only valid JSON.`,
          },
          {
            role: 'user',
            content: `Analyze the following content from "${companyName}" for:

1. AI VENDOR DETECTION: Find any of these vendor domains/scripts/references in the HTML or text:
${vendorDomains}

Also detect any other AI hiring vendors not in this list.

2. BIAS AUDIT COMPLIANCE: Search for mandatory 2026 disclosures. Look for:
- Links or text containing: ${BIAS_AUDIT_KEYWORDS.join(', ')}
- Published bias audit reports or summaries
- AEDT notices or algorithmic transparency disclosures

3. SAFEPATH RISK FLAGS: Flag any evidence of:
- Emotion AI or emotion detection in hiring
- Facial analysis or facial recognition for candidates
- Black-box ranking algorithms without disclosure
- Undisclosed proprietary scoring of candidates

CRITICAL RULE: If a vendor is found but NO Bias Audit link is present, flag as "Transparency Warning".

Return a JSON object:
{
  "vendors": [{
    "vendor_name": "string",
    "category": "Sourcing | Screening | Interview Intelligence | Assessment | ATS | HCM | Chatbot | Analytics | Talent Marketplace",
    "signal_type": "Technical Signature | Regulatory Disclosure | Privacy Policy | Vendor Reference",
    "evidence_url": "URL or null",
    "evidence_text": "1-2 sentence evidence",
    "confidence_score": 0.0-1.0,
    "risk_flags": ["emotion_ai", "black_box_ranking"] or []
  }],
  "bias_audits": [{
    "audit_type": "NYC LL144 | EU AI Act | State Law | Voluntary",
    "audit_url": "direct link to audit report or null",
    "description": "what was found",
    "status": "Verified | Detected | Not Found"
  }],
  "safepath_warnings": [{
    "warning_type": "emotion_ai | black_box_ranking | facial_analysis | undisclosed_scoring",
    "vendor": "vendor name if applicable",
    "evidence": "description of the risk",
    "severity": "high | medium | low"
  }],
  "transparency_warnings": ["list of vendors found without corresponding bias audits"]
}

Content:
${truncated}`,
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      console.error('AI analysis failed:', aiResp.status);
      return new Response(JSON.stringify({ success: false, error: 'AI analysis failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content || '{}';

    let analysis: any;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      analysis = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error('Failed to parse AI output:', raw.slice(0, 500));
      analysis = { vendors: [], bias_audits: [], safepath_warnings: [], transparency_warnings: [] };
    }

    const vendors = analysis.vendors || [];
    const biasAudits = analysis.bias_audits || [];
    const safepathWarnings = analysis.safepath_warnings || [];
    const transparencyWarnings = analysis.transparency_warnings || [];

    console.log(`Found ${vendors.length} vendors, ${biasAudits.length} audits, ${safepathWarnings.length} safepath warnings`);

    // Calculate transparency score
    const vendorCount = vendors.length;
    const auditedCount = biasAudits.filter((a: any) => a.status === 'Verified').length;
    let transparencyScore: number | null = null;
    if (vendorCount > 0) {
      const auditRatio = auditedCount / vendorCount;
      const warningPenalty = safepathWarnings.length * 10;
      const transparencyPenalty = transparencyWarnings.length * 15;
      transparencyScore = Math.max(0, Math.min(100, Math.round(
        (auditRatio * 70) + (biasAudits.length > 0 ? 20 : 0) + (safepathWarnings.length === 0 ? 10 : 0) - warningPenalty - transparencyPenalty
      )));
    }

    // Step 4: Upsert signals
    await supabase.from('ai_hiring_signals').delete()
      .eq('company_id', companyId).eq('status', 'Detected');

    const signalRecords = vendors.map((v: any) => {
      const matchingAudit = biasAudits.find((a: any) => a.status === 'Verified');
      const hasTransparencyWarning = transparencyWarnings.includes(v.vendor_name);

      return {
        company_id: companyId,
        category: v.category || 'Other',
        vendor_name: v.vendor_name || null,
        signal_type: v.signal_type || 'Technical Signature',
        evidence_url: v.evidence_url || null,
        evidence_text: v.evidence_text || null,
        confidence_score: v.confidence_score || 0.5,
        status: 'Detected',
        bias_audit_link: matchingAudit?.audit_url || null,
        bias_audit_status: hasTransparencyWarning ? 'missing' : (matchingAudit ? 'verified' : 'unknown'),
        safepath_flags: v.risk_flags || [],
        transparency_score: transparencyScore,
        last_scanned: now,
      };
    });

    // Add bias audit records as separate signals
    for (const audit of biasAudits) {
      signalRecords.push({
        company_id: companyId,
        category: 'Compliance',
        vendor_name: null,
        signal_type: 'Regulatory Disclosure',
        evidence_url: audit.audit_url || null,
        evidence_text: audit.description || null,
        confidence_score: audit.status === 'Verified' ? 0.95 : 0.6,
        status: 'Detected',
        bias_audit_link: audit.audit_url || null,
        bias_audit_status: audit.status?.toLowerCase() || 'detected',
        safepath_flags: [],
        transparency_score: transparencyScore,
        last_scanned: now,
      });
    }

    if (signalRecords.length > 0) {
      const { error: insertErr } = await supabase.from('ai_hiring_signals').insert(signalRecords);
      if (insertErr) {
        console.error('Insert error:', insertErr);
        return new Response(JSON.stringify({ success: false, error: insertErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Step 5: Create entity linkages for detected vendors
    for (const v of vendors) {
      if (!v.vendor_name) continue;
      try {
        // Check if linkage already exists
        const { data: existing } = await supabase.from('entity_linkages')
          .select('id')
          .eq('company_id', companyId)
          .eq('target_entity_name', v.vendor_name)
          .eq('link_type', 'interlocking_directorate')
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from('entity_linkages').insert({
            company_id: companyId,
            source_entity_name: companyName,
            source_entity_type: 'company',
            target_entity_name: v.vendor_name,
            target_entity_type: 'ai_vendor',
            link_type: 'interlocking_directorate',
            description: `Uses ${v.vendor_name} for ${v.category} in hiring pipeline`,
            confidence_score: v.confidence_score || 0.5,
            amount: null,
          });
        }
      } catch (e) {
        console.error(`Entity linkage failed for ${v.vendor_name}:`, e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      signalsFound: signalRecords.length,
      vendorsDetected: vendors.length,
      auditsFound: biasAudits.length,
      safepathWarnings: safepathWarnings.length,
      transparencyScore,
      transparencyWarnings,
      companyId,
      scannedAt: now,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('AI Accountability scan error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
