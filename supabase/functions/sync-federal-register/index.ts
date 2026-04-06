/**
 * Sync Federal Register Rules
 * 
 * Pulls proposed rules, final rules, and presidential documents from the
 * Federal Register API (free, no key needed) and cross-references them
 * against company lobbying issue codes from Senate LDA filings.
 * 
 * API docs: https://www.federalregister.gov/developers/documentation/api/v1
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireServiceRole } from "../_shared/auth-guard.ts";

const FR_API = 'https://www.federalregister.gov/api/v1';

// Map Senate LDA general issue codes to Federal Register search terms
const ISSUE_CODE_TO_SEARCH: Record<string, string[]> = {
  'Taxes': ['tax', 'IRS', 'revenue', 'taxation'],
  'Budget/Appropriations': ['appropriations', 'budget', 'fiscal'],
  'Health Issues': ['health', 'CMS', 'Medicare', 'Medicaid', 'FDA', 'pharmaceutical'],
  'Energy/Nuclear': ['energy', 'DOE', 'nuclear', 'renewable', 'oil', 'gas', 'pipeline'],
  'Environment/Superfund': ['EPA', 'environment', 'emissions', 'pollution', 'superfund', 'climate'],
  'Defense': ['defense', 'DoD', 'military', 'Pentagon', 'procurement'],
  'Transportation': ['transportation', 'DOT', 'FAA', 'highway', 'aviation', 'rail'],
  'Trade (Domestic & Foreign)': ['trade', 'tariff', 'import', 'export', 'USTR', 'customs'],
  'Labor/Antitrust/Workplace': ['labor', 'OSHA', 'NLRB', 'workplace', 'wage', 'worker', 'DOL'],
  'Banking': ['banking', 'FDIC', 'OCC', 'financial', 'lending'],
  'Telecommunications': ['telecommunications', 'FCC', 'broadband', 'spectrum', 'wireless'],
  'Agriculture': ['agriculture', 'USDA', 'farm', 'crop', 'food safety'],
  'Education': ['education', 'student loan', 'Title IX', 'Department of Education'],
  'Immigration': ['immigration', 'USCIS', 'visa', 'border', 'asylum', 'H-1B'],
  'Financial Institutions/Investments/Securities': ['SEC', 'securities', 'investment', 'Dodd-Frank', 'FINRA'],
  'Homeland Security': ['homeland security', 'DHS', 'cybersecurity', 'TSA'],
  'Housing': ['housing', 'HUD', 'mortgage', 'fair housing'],
  'Copyright/Patent/Trademark': ['patent', 'copyright', 'trademark', 'intellectual property', 'USPTO'],
  'Pharmacy': ['pharmacy', 'drug pricing', 'prescription', 'pharmaceutical'],
  'Consumer Issues/Safety/Protection': ['consumer', 'CFPB', 'FTC', 'CPSC', 'product safety'],
  'Science/Technology': ['science', 'technology', 'NIST', 'NSF', 'AI', 'artificial intelligence'],
  'Clean Air & Water (Env)': ['clean air', 'clean water', 'air quality', 'water quality'],
  'Firearms/Guns/Ammunition': ['firearms', 'ATF', 'gun', 'ammunition'],
  'Civil Rights/Civil Liberties': ['civil rights', 'EEOC', 'discrimination', 'voting rights'],
  'Utilities': ['utilities', 'FERC', 'electric', 'natural gas', 'power grid'],
  'Insurance': ['insurance', 'ACA', 'health insurance', 'underwriting'],
  'Mining/Money': ['mining', 'MSHA', 'minerals', 'critical minerals'],
  'Chemicals/Chemical Industry': ['chemical', 'TSCA', 'hazardous', 'PFAS'],
};

// Flatten: get search terms for a set of issue codes
function getSearchTerms(issueCodes: string[]): string[] {
  const terms = new Set<string>();
  for (const code of issueCodes) {
    const mapped = ISSUE_CODE_TO_SEARCH[code];
    if (mapped) {
      for (const t of mapped) terms.add(t);
    }
  }
  return [...terms];
}

async function searchFederalRegister(terms: string[], docTypes: string[]): Promise<any[]> {
  const allDocs: any[] = [];
  const seenNumbers = new Set<string>();
  
  // Search in batches of 2-3 terms combined
  const termBatches: string[][] = [];
  for (let i = 0; i < terms.length; i += 3) {
    termBatches.push(terms.slice(i, i + 3));
  }

  for (const batch of termBatches.slice(0, 5)) { // Max 5 batches to stay within reason
    const query = batch.join(' OR ');
    const typeParams = docTypes.map(t => `conditions[type][]=${t}`).join('&');
    
    // Only get recent docs (last 90 days)
    const sinceDate = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
    
    const url = `${FR_API}/documents.json?conditions[term]=${encodeURIComponent(query)}&${typeParams}&conditions[publication_date][gte]=${sinceDate}&per_page=20&order=newest&fields[]=document_number&fields[]=title&fields[]=type&fields[]=abstract&fields[]=agencies&fields[]=publication_date&fields[]=effective_on&fields[]=html_url&fields[]=pdf_url&fields[]=agency_names`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[sync-federal-register] API ${res.status} for query: ${query}`);
        continue;
      }
      const data = await res.json();
      
      for (const doc of (data.results || [])) {
        if (!seenNumbers.has(doc.document_number)) {
          seenNumbers.add(doc.document_number);
          allDocs.push(doc);
        }
      }
    } catch (e) {
      console.warn(`[sync-federal-register] Fetch error for "${query}":`, e);
    }
    
    // Be polite to the free API
    await new Promise(r => setTimeout(r, 500));
  }

  return allDocs;
}

// Score relevance of a document to a company's lobbying topics
function scoreRelevance(doc: any, issueSearchTerms: string[]): number {
  const text = `${doc.title || ''} ${doc.abstract || ''}`.toLowerCase();
  let matches = 0;
  for (const term of issueSearchTerms) {
    if (text.includes(term.toLowerCase())) matches++;
  }
  return Math.min(matches / Math.max(issueSearchTerms.length, 1), 1.0);
}

Deno.serve(async (req: Request) => {

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }


  // Auth guard: require service-role key
  const authDenied = requireServiceRole(req);
  if (authDenied) return authDenied;

  try {
    const { companyId, companyName } = await req.json();

    if (!companyId || !companyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId and companyName required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    console.log(`[sync-federal-register] Starting for ${companyName} (${companyId})`);

    // Step 1: Get this company's lobbying issue codes from entity_linkages metadata
    const { data: linkages } = await supabase
      .from('entity_linkages')
      .select('metadata, description')
      .eq('company_id', companyId)
      .eq('link_type', 'trade_association_lobbying')
      .limit(50);

    // Extract issue codes from linkage metadata or descriptions
    const issueCodes = new Set<string>();
    for (const link of (linkages || [])) {
      // Check metadata for issue codes
      const meta = link.metadata as any;
      if (meta?.issue_codes) {
        for (const code of meta.issue_codes) issueCodes.add(code);
      }
      if (meta?.issues_tracked) {
        for (const code of meta.issues_tracked) issueCodes.add(code);
      }
      // Parse from description text
      const desc = link.description || '';
      for (const [code] of Object.entries(ISSUE_CODE_TO_SEARCH)) {
        if (desc.toLowerCase().includes(code.toLowerCase())) {
          issueCodes.add(code);
        }
      }
    }

    // Also check accountability_signals for lobbying categories
    const { data: signals } = await supabase
      .from('accountability_signals')
      .select('signal_category, description')
      .eq('company_id', companyId)
      .eq('signal_type', 'lobbying')
      .limit(20);

    for (const sig of (signals || [])) {
      const desc = (sig.description || '').toLowerCase();
      for (const [code] of Object.entries(ISSUE_CODE_TO_SEARCH)) {
        if (desc.includes(code.toLowerCase())) {
          issueCodes.add(code);
        }
      }
    }

    const issueCodesArr = [...issueCodes];
    console.log(`[sync-federal-register] Found ${issueCodesArr.length} issue codes: ${issueCodesArr.join(', ')}`);

    if (issueCodesArr.length === 0) {
      // Fallback: search by company name + industry
      const { data: company } = await supabase
        .from('companies')
        .select('industry, sub_industry')
        .eq('id', companyId)
        .single();

      const fallbackTerms = [companyName];
      if (company?.industry) fallbackTerms.push(company.industry);
      if (company?.sub_industry) fallbackTerms.push(company.sub_industry);

      const docs = await searchFederalRegister(fallbackTerms, ['RULE', 'PRORULE', 'PRESDOCU']);
      
      if (docs.length === 0) {
        return new Response(
          JSON.stringify({ success: true, matched: 0, message: 'No lobbying issue codes or matching rules found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store with low relevance
      const rows = docs.slice(0, 10).map(doc => ({
        company_id: companyId,
        document_number: doc.document_number,
        document_type: (doc.type || 'rule').toLowerCase().replace(' ', '_'),
        title: doc.title || 'Untitled',
        abstract: doc.abstract || null,
        agency_names: doc.agency_names || [],
        publication_date: doc.publication_date || null,
        effective_date: doc.effective_on || null,
        html_url: doc.html_url || null,
        pdf_url: doc.pdf_url || null,
        matched_issue_codes: [],
        relevance_score: 0.3,
        raw_payload: doc,
      }));

      const { error } = await supabase
        .from('federal_register_rules')
        .upsert(rows, { onConflict: 'company_id,document_number' });

      if (error) console.warn('[sync-federal-register] Upsert error:', error.message);

      return new Response(
        JSON.stringify({ success: true, matched: rows.length, method: 'name_fallback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Build search terms from issue codes
    const searchTerms = getSearchTerms(issueCodesArr);
    console.log(`[sync-federal-register] Searching ${searchTerms.length} terms across Federal Register`);

    // Step 3: Search Federal Register for proposed rules, final rules, and presidential docs
    const docs = await searchFederalRegister(searchTerms, ['RULE', 'PRORULE', 'PRESDOCU']);
    console.log(`[sync-federal-register] Found ${docs.length} documents`);

    if (docs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, matched: 0, issueCodes: issueCodesArr }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Score and store
    const rows = docs.map(doc => {
      const relevance = scoreRelevance(doc, searchTerms);
      // Which issue codes matched this doc?
      const matchedCodes = issueCodesArr.filter(code => {
        const terms = ISSUE_CODE_TO_SEARCH[code] || [];
        const text = `${doc.title || ''} ${doc.abstract || ''}`.toLowerCase();
        return terms.some(t => text.includes(t.toLowerCase()));
      });

      return {
        company_id: companyId,
        document_number: doc.document_number,
        document_type: (doc.type || 'rule').toLowerCase().replace(' ', '_'),
        title: doc.title || 'Untitled',
        abstract: doc.abstract || null,
        agency_names: doc.agency_names || [],
        publication_date: doc.publication_date || null,
        effective_date: doc.effective_on || null,
        html_url: doc.html_url || null,
        pdf_url: doc.pdf_url || null,
        matched_issue_codes: matchedCodes,
        relevance_score: relevance,
        raw_payload: doc,
      };
    });

    // Only keep docs with relevance > 0.1
    const relevant = rows.filter(r => r.relevance_score > 0.1).slice(0, 30);

    if (relevant.length > 0) {
      const { error } = await supabase
        .from('federal_register_rules')
        .upsert(relevant, { onConflict: 'company_id,document_number' });

      if (error) {
        console.error('[sync-federal-register] Upsert error:', error.message);
      }

      // Also create entity_linkages for high-relevance matches
      const highRelevance = relevant.filter(r => r.relevance_score >= 0.4);
      for (const rule of highRelevance) {
        const linkage = {
          company_id: companyId,
          source_entity_name: companyName,
          source_entity_type: 'company',
          source_entity_id: companyId,
          target_entity_name: rule.title.slice(0, 200),
          target_entity_type: 'regulation',
          target_entity_id: rule.document_number,
          link_type: 'lobbying_on_bill',
          confidence_score: rule.relevance_score,
          amount: 0,
          description: `${companyName} lobbies on issues related to: "${rule.title.slice(0, 150)}" (${rule.agency_names.join(', ')}). Matched issue codes: ${rule.matched_issue_codes.join(', ')}`,
          source_citation: JSON.stringify([{
            source: 'Federal Register',
            url: rule.html_url,
            document_number: rule.document_number,
            publication_date: rule.publication_date,
          }]),
        };

        await supabase.from('entity_linkages').upsert(linkage, {
          onConflict: 'company_id,source_entity_name,target_entity_name,link_type',
        }).then(({ error }) => {
          if (error) console.warn('[sync-federal-register] Linkage upsert error:', error.message);
        });
      }
    }

    const summary = {
      success: true,
      matched: relevant.length,
      highRelevance: relevant.filter(r => r.relevance_score >= 0.4).length,
      issueCodes: issueCodesArr,
      documentTypes: {
        rules: relevant.filter(r => r.document_type === 'rule').length,
        proposed: relevant.filter(r => r.document_type === 'proposed_rule').length,
        presidential: relevant.filter(r => r.document_type === 'presidential_document').length,
      },
    };

    console.log(`[sync-federal-register] Done: ${JSON.stringify(summary)}`);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[sync-federal-register] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
