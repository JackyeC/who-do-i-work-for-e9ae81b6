const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EDGAR_BASE = 'https://data.sec.gov';
const EDGAR_SEARCH = 'https://efts.sec.gov/LATEST/search-index?q=';
const USER_AGENT = 'CivicLens/1.0 (civic-transparency-platform; admin@civiclens.org)';

interface EdgarSubmission {
  cik: string;
  entityType: string;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein: string;
  description: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
}

interface CompanyFact {
  label: string;
  description: string;
  units: Record<string, Array<{
    val: number;
    accn: string;
    fy: number;
    fp: string;
    form: string;
    filed: string;
    end: string;
    start?: string;
  }>>;
}

async function edgarFetch(url: string): Promise<any> {
  const resp = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw Object.assign(new Error(`EDGAR ${resp.status}: ${body.slice(0, 200)}`), { upstreamStatus: resp.status });
  }
  return resp.json();
}

// Look up CIK from company name using the SEC tickers file
async function findCIK(companyName: string): Promise<{ cik: string; ticker: string; name: string } | null> {
  try {
    // Try EDGAR full-text search first for better name matching
    const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(companyName)}%22&dateRange=custom&startdt=2020-01-01&forms=10-K,DEF%2014A&hits.hits.total=1`;
    
    // Fallback: use company_tickers.json
    const tickersResp = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!tickersResp.ok) return null;

    const tickers: Record<string, { cik_str: number; ticker: string; title: string }> = await tickersResp.json();
    
    const normalizedSearch = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    // Exact match first
    for (const entry of Object.values(tickers)) {
      const normalizedTitle = entry.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      if (normalizedTitle === normalizedSearch) {
        return { cik: String(entry.cik_str).padStart(10, '0'), ticker: entry.ticker, name: entry.title };
      }
    }
    
    // Partial match
    for (const entry of Object.values(tickers)) {
      const normalizedTitle = entry.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      if (normalizedTitle.includes(normalizedSearch) || normalizedSearch.includes(normalizedTitle)) {
        return { cik: String(entry.cik_str).padStart(10, '0'), ticker: entry.ticker, name: entry.title };
      }
    }

    // Word-based fuzzy match (match first 2 words)
    const searchWords = normalizedSearch.split(/\s+/).slice(0, 2);
    if (searchWords.length >= 1 && searchWords[0].length > 3) {
      for (const entry of Object.values(tickers)) {
        const titleWords = entry.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
        if (searchWords.every(w => titleWords.some(tw => tw.startsWith(w) || w.startsWith(tw)))) {
          return { cik: String(entry.cik_str).padStart(10, '0'), ticker: entry.ticker, name: entry.title };
        }
      }
    }

    return null;
  } catch (e) {
    console.error('[sync-sec-edgar] CIK lookup error:', e);
    return null;
  }
}

// Extract executive compensation from XBRL facts
function extractCompensation(facts: Record<string, Record<string, CompanyFact>>): any[] {
  const compensationTags = [
    'RemunerationOfDirectorsAndOfficers',
    'ShareBasedCompensation', 
    'StockBasedCompensation',
    'OfficersCompensation',
  ];

  // US-GAAP facts
  const usGaap = facts['us-gaap'] || {};
  const results: any[] = [];

  // Look for CEO/executive pay indicators
  const ceoPayTag = usGaap['CompensationExpenseExcludingCostOfGoodAndServiceSold'];
  const stockCompTag = usGaap['ShareBasedCompensation'] || usGaap['AllocatedShareBasedCompensationExpense'];
  
  if (stockCompTag) {
    const units = stockCompTag.units?.USD || [];
    const recent = units
      .filter(u => u.form === '10-K' || u.form === 'DEF 14A')
      .sort((a, b) => b.fy - a.fy)
      .slice(0, 3);

    for (const entry of recent) {
      results.push({
        type: 'stock_based_compensation',
        label: 'Stock-Based Compensation Expense',
        amount: entry.val,
        fiscal_year: entry.fy,
        form: entry.form,
        filed: entry.filed,
        period_end: entry.end,
      });
    }
  }

  // Total compensation / SGA which often includes exec pay
  const sgaTag = usGaap['SellingGeneralAndAdministrativeExpense'];
  if (sgaTag) {
    const units = sgaTag.units?.USD || [];
    const recent = units
      .filter(u => u.form === '10-K')
      .sort((a, b) => b.fy - a.fy)
      .slice(0, 3);

    for (const entry of recent) {
      results.push({
        type: 'sga_expense',
        label: 'SG&A Expense (includes exec compensation)',
        amount: entry.val,
        fiscal_year: entry.fy,
        form: entry.form,
        filed: entry.filed,
        period_end: entry.end,
      });
    }
  }

  return results;
}

// Extract insider trading signals from recent filings
function extractInsiderFilings(submissions: EdgarSubmission): any[] {
  const results: any[] = [];
  const recent = submissions.filings?.recent;
  if (!recent) return results;

  const insiderForms = ['4', '3', '5']; // Insider trading forms
  const proxyForms = ['DEF 14A', 'DEF 14C']; // Proxy statements
  const annualForms = ['10-K', '10-K/A'];

  for (let i = 0; i < Math.min(recent.form.length, 200); i++) {
    const form = recent.form[i];
    const date = recent.filingDate[i];
    const accession = recent.accessionNumber[i];
    const desc = recent.primaryDocDescription?.[i] || '';

    if (insiderForms.includes(form)) {
      results.push({
        type: 'insider_transaction',
        form,
        filing_date: date,
        accession_number: accession,
        description: desc,
        url: `https://www.sec.gov/Archives/edgar/data/${submissions.cik}/${accession.replace(/-/g, '')}/${recent.primaryDocument[i]}`,
      });
    }

    if (proxyForms.includes(form)) {
      results.push({
        type: 'proxy_statement',
        form,
        filing_date: date,
        accession_number: accession,
        description: desc || 'Proxy Statement (Executive Compensation Disclosure)',
        url: `https://www.sec.gov/Archives/edgar/data/${submissions.cik}/${accession.replace(/-/g, '')}/${recent.primaryDocument[i]}`,
      });
    }

    if (annualForms.includes(form)) {
      results.push({
        type: 'annual_report',
        form,
        filing_date: date,
        accession_number: accession,
        description: desc || 'Annual Report',
        url: `https://www.sec.gov/Archives/edgar/data/${submissions.cik}/${accession.replace(/-/g, '')}/${recent.primaryDocument[i]}`,
      });
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { companyId, companyName, searchNames } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-sec-edgar] Starting for ${companyName}...`);

    // Step 1: Find CIK
    const namesToTry = [companyName, ...(searchNames || []).slice(0, 5)];
    let cikResult: { cik: string; ticker: string; name: string } | null = null;

    for (const name of namesToTry) {
      cikResult = await findCIK(name);
      if (cikResult) break;
      await new Promise(r => setTimeout(r, 200)); // rate limit
    }

    if (!cikResult) {
      console.log(`[sync-sec-edgar] No CIK found for ${companyName}`);
      return new Response(JSON.stringify({
        success: true,
        message: `No SEC filing entity found for ${companyName}`,
        stats: { cikFound: false, filings: 0, signals: 0 },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[sync-sec-edgar] Found CIK ${cikResult.cik} (${cikResult.name}, ticker: ${cikResult.ticker})`);

    // Step 2: Fetch submissions (filing history)
    await new Promise(r => setTimeout(r, 200));
    const submissions: EdgarSubmission = await edgarFetch(`${EDGAR_BASE}/submissions/CIK${cikResult.cik}.json`);

    // Step 3: Extract insider filings
    const filingSignals = extractInsiderFilings(submissions);
    const insiderCount = filingSignals.filter(f => f.type === 'insider_transaction').length;
    const proxyCount = filingSignals.filter(f => f.type === 'proxy_statement').length;

    console.log(`[sync-sec-edgar] Found ${insiderCount} insider filings, ${proxyCount} proxy statements`);

    // Step 4: Fetch XBRL company facts for compensation data
    let compensationSignals: any[] = [];
    try {
      await new Promise(r => setTimeout(r, 200));
      const factsData = await edgarFetch(`${EDGAR_BASE}/api/xbrl/companyfacts/CIK${cikResult.cik}.json`);
      compensationSignals = extractCompensation(factsData.facts || {});
      console.log(`[sync-sec-edgar] Extracted ${compensationSignals.length} compensation data points`);
    } catch (e: any) {
      console.warn(`[sync-sec-edgar] XBRL facts not available: ${e.message}`);
    }

    // Step 5: Store as signal scans
    const signalRows: any[] = [];

    // Recent insider transactions (last 30 days = high signal)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const recentInsider = filingSignals.filter(f => f.type === 'insider_transaction' && f.filing_date >= thirtyDaysAgo);
    if (recentInsider.length > 0) {
      signalRows.push({
        company_id: companyId,
        signal_category: 'sec_insider_trading',
        signal_type: 'recent_insider_transactions',
        signal_value: `${recentInsider.length} insider transactions in last 30 days`,
        confidence_level: 'direct',
        source_url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikResult.cik}&type=4&dateb=&owner=include&count=40`,
        raw_excerpt: JSON.stringify(recentInsider.slice(0, 10)),
      });
    }

    // Proxy statements (executive compensation)
    const recentProxies = filingSignals.filter(f => f.type === 'proxy_statement').slice(0, 3);
    for (const proxy of recentProxies) {
      signalRows.push({
        company_id: companyId,
        signal_category: 'sec_executive_compensation',
        signal_type: 'proxy_statement_filed',
        signal_value: `Proxy statement filed ${proxy.filing_date}`,
        confidence_level: 'direct',
        source_url: proxy.url,
        raw_excerpt: proxy.description,
      });
    }

    // Stock-based compensation data
    for (const comp of compensationSignals.filter(c => c.type === 'stock_based_compensation')) {
      signalRows.push({
        company_id: companyId,
        signal_category: 'sec_executive_compensation',
        signal_type: 'stock_compensation_expense',
        signal_value: `$${(comp.amount / 1e6).toFixed(1)}M stock-based compensation (FY${comp.fiscal_year})`,
        confidence_level: 'direct',
        source_url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikResult.cik}&type=10-K&dateb=&owner=include&count=10`,
        raw_excerpt: JSON.stringify(comp),
      });
    }

    // Store entity linkages for SEC data
    const linkages: any[] = [];
    
    // Link company to SEC entity
    linkages.push({
      company_id: companyId,
      source_entity_name: companyName,
      source_entity_type: 'company',
      target_entity_name: `SEC CIK ${cikResult.cik}`,
      target_entity_type: 'sec_entity',
      target_entity_id: cikResult.cik,
      link_type: 'interlocking_directorate',
      confidence_score: 1.0,
      description: `SEC EDGAR entity: ${cikResult.name} (CIK: ${cikResult.cik}, Ticker: ${cikResult.ticker})`,
      source_citation: JSON.stringify([{
        source: 'SEC EDGAR',
        url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikResult.cik}`,
        retrieved_at: new Date().toISOString(),
      }]),
    });

    // Insert signals
    if (signalRows.length > 0) {
      // Clear old SEC signals
      await supabase
        .from('company_signal_scans')
        .delete()
        .eq('company_id', companyId)
        .in('signal_category', ['sec_insider_trading', 'sec_executive_compensation']);

      const { error: sigErr } = await supabase.from('company_signal_scans').insert(signalRows);
      if (sigErr) console.error('[sync-sec-edgar] Signal insert error:', sigErr);
    }

    // Insert linkages
    if (linkages.length > 0) {
      await supabase
        .from('entity_linkages')
        .delete()
        .eq('company_id', companyId)
        .eq('target_entity_type', 'sec_entity');

      const { error: linkErr } = await supabase.from('entity_linkages').insert(linkages);
      if (linkErr) console.error('[sync-sec-edgar] Linkage insert error:', linkErr);
    }

    const stats = {
      cikFound: true,
      cik: cikResult.cik,
      ticker: cikResult.ticker,
      secName: cikResult.name,
      insiderFilings: insiderCount,
      proxyStatements: proxyCount,
      compensationDataPoints: compensationSignals.length,
      signalsCreated: signalRows.length,
    };

    console.log(`[sync-sec-edgar] ✅ Complete for ${companyName}: ${signalRows.length} signals, CIK ${cikResult.cik}`);

    return new Response(JSON.stringify({
      success: true,
      message: `SEC EDGAR sync complete for ${companyName}`,
      stats,
      sourcesScanned: 1,
      signalsFound: signalRows.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[sync-sec-edgar] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error',
      errorType: error.upstreamStatus ? 'upstream_api_error' : 'server_error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
