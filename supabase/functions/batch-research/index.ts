const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Fortune 500 + major politically active companies target list
const TARGET_COMPANIES = [
  // Tech
  "Apple", "Microsoft", "Alphabet", "Amazon", "Meta Platforms", "Tesla", "NVIDIA", "Intel", "IBM", "Oracle",
  "Salesforce", "Adobe", "Cisco Systems", "Qualcomm", "AMD", "Dell Technologies", "Hewlett Packard Enterprise",
  "HP Inc", "Broadcom", "Texas Instruments", "Micron Technology", "Applied Materials", "Palantir Technologies",
  "Snowflake", "ServiceNow", "Intuit", "Palo Alto Networks", "CrowdStrike", "Uber Technologies", "Lyft",
  "Airbnb", "DoorDash", "Snap Inc", "Pinterest", "Spotify", "Netflix", "PayPal", "Block Inc", "Coinbase",
  
  // Finance
  "JPMorgan Chase", "Bank of America", "Wells Fargo", "Citigroup", "Goldman Sachs", "Morgan Stanley",
  "Charles Schwab", "BlackRock", "Vanguard Group", "State Street", "Capital One", "American Express",
  "Visa", "Mastercard", "Fidelity Investments", "US Bancorp", "PNC Financial", "Truist Financial",
  "Bank of New York Mellon", "Northern Trust", "Raymond James", "Edward Jones", "Berkshire Hathaway",
  "Prudential Financial", "MetLife", "AIG", "Aflac", "Progressive", "Allstate", "Travelers Companies",
  
  // Energy
  "ExxonMobil", "Chevron", "ConocoPhillips", "Phillips 66", "Valero Energy", "Marathon Petroleum",
  "Occidental Petroleum", "Devon Energy", "Pioneer Natural Resources", "Hess Corporation",
  "Baker Hughes", "Halliburton", "Schlumberger", "Kinder Morgan", "Williams Companies",
  "Sempra Energy", "Dominion Energy", "Duke Energy", "Southern Company", "NextEra Energy",
  "AES Corporation", "Entergy", "Exelon", "FirstEnergy", "Xcel Energy",
  "Cheniere Energy", "Diamondback Energy", "Continental Resources", "EOG Resources", "Marathon Oil",
  
  // Healthcare & Pharma
  "UnitedHealth Group", "Johnson & Johnson", "Pfizer", "AbbVie", "Merck", "Eli Lilly", "Bristol-Myers Squibb",
  "Amgen", "Gilead Sciences", "Regeneron", "Moderna", "Biogen", "Vertex Pharmaceuticals",
  "Cigna Group", "Elevance Health", "Humana", "Centene", "Molina Healthcare",
  "CVS Health", "McKesson", "AmerisourceBergen", "Cardinal Health", "Walgreens Boots Alliance",
  "HCA Healthcare", "Tenet Healthcare", "Universal Health Services",
  "Medtronic", "Abbott Laboratories", "Baxter International", "Boston Scientific", "Stryker",
  "Becton Dickinson", "Edwards Lifesciences", "Intuitive Surgical", "Danaher",
  
  // Defense & Aerospace
  "Lockheed Martin", "Raytheon Technologies", "Boeing", "Northrop Grumman", "General Dynamics",
  "L3Harris Technologies", "Leidos", "BAE Systems", "Huntington Ingalls", "Textron",
  "SAIC", "Booz Allen Hamilton", "ManTech International", "CACI International",
  "Honeywell", "General Electric", "TransDigm Group", "Howmet Aerospace",
  
  // Retail & Consumer
  "Walmart", "Costco", "Target", "Home Depot", "Lowe's", "Best Buy", "Dollar General", "Dollar Tree",
  "TJX Companies", "Ross Stores", "Macy's", "Nordstrom", "Gap Inc", "Nike", "Under Armour",
  "Procter & Gamble", "Colgate-Palmolive", "Kimberly-Clark", "Church & Dwight",
  "Estée Lauder", "Clorox", "Henkel", "Spectrum Brands",
  "Coca-Cola", "PepsiCo", "Mondelez International", "Kraft Heinz", "General Mills", "Kellogg",
  "ConAgra Brands", "Hormel Foods", "Tyson Foods", "JBS USA", "Archer Daniels Midland", "Cargill",
  "Bunge Limited", "Pilgrim's Pride", "Smithfield Foods",
  
  // Telecom & Media
  "AT&T", "Verizon", "T-Mobile", "Comcast", "Charter Communications", "Lumen Technologies",
  "Walt Disney Company", "Warner Bros Discovery", "Paramount Global", "Fox Corporation",
  "News Corp", "iHeartMedia", "Sinclair Broadcast Group",
  
  // Industrials & Manufacturing
  "3M", "Caterpillar", "John Deere", "Illinois Tool Works", "Emerson Electric", "Parker Hannifin",
  "Cummins", "PACCAR", "Danaher", "Eaton Corporation", "Rockwell Automation",
  "Nucor", "US Steel", "Cleveland-Cliffs", "Freeport-McMoRan", "Newmont Corporation",
  "Dow Inc", "DuPont", "LyondellBasell", "Eastman Chemical", "PPG Industries",
  "Sherwin-Williams", "Air Products", "Linde", "Praxair",
  
  // Transportation & Logistics
  "FedEx", "UPS", "XPO Logistics", "JB Hunt", "Union Pacific", "CSX", "Norfolk Southern", "BNSF Railway",
  "Delta Air Lines", "United Airlines", "American Airlines", "Southwest Airlines", "JetBlue",
  "Uber Technologies", "Lyft",
  
  // Real Estate & Construction
  "CBRE Group", "Jones Lang LaSalle", "Prologis", "American Tower", "Crown Castle",
  "Simon Property Group", "Brookfield Asset Management", "Lennar", "DR Horton", "PulteGroup",
  "Toll Brothers", "KB Home", "NVR Inc",
  
  // Agriculture & Food
  "Deere & Company", "AGCO Corporation", "Bayer", "Corteva Agriscience", "Syngenta",
  "Monsanto", "Land O'Lakes", "CHS Inc", "Ocean Spray", "Dole Food Company",
  
  // Tobacco & Alcohol
  "Altria Group", "Philip Morris International", "Reynolds American", "Anheuser-Busch InBev",
  "Diageo", "Constellation Brands", "Molson Coors", "Brown-Forman",
  
  // Casino & Entertainment
  "Las Vegas Sands", "MGM Resorts", "Wynn Resorts", "Caesars Entertainment",
  "DraftKings", "FanDuel", "Penn Entertainment",
  
  // Koch & Major Political Spenders  
  "Koch Industries", "Koch Industries Inc", "Marathon Petroleum", "Georgia-Pacific",
  "Flint Hills Resources", "Invista", "Guardian Industries", "Molex",
  
  // Private Equity & Hedge Funds
  "Blackstone", "KKR", "Carlyle Group", "Apollo Global Management", "Bain Capital",
  "Citadel LLC", "Bridgewater Associates", "Renaissance Technologies", "Two Sigma",
  "Elliott Management", "Pershing Square",
  
  // Consulting & Services
  "Deloitte", "PricewaterhouseCoopers", "Ernst & Young", "KPMG", "McKinsey & Company",
  "Boston Consulting Group", "Bain & Company", "Accenture", "Cognizant", "Infosys", "Wipro",
  
  // Auto
  "General Motors", "Ford Motor Company", "Stellantis", "Toyota Motor North America",
  "Honda Motor", "Rivian", "Lucid Motors",
  
  // Misc large politically active
  "Berkshire Hathaway", "Alphabet Inc", "Walt Disney", "Comcast Corporation",
  "Charter Communications", "21st Century Fox"
];

const BATCH_SIZE = 3; // Process 3 companies per invocation to stay within timeout

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all existing company names/slugs
    const { data: existingCompanies, error: fetchErr } = await supabase
      .from('companies')
      .select('name, slug');

    if (fetchErr) {
      console.error('Failed to fetch existing companies:', fetchErr);
      return new Response(JSON.stringify({ success: false, error: fetchErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const existingSlugs = new Set((existingCompanies || []).map(c => c.slug));
    const existingNames = new Set((existingCompanies || []).map(c => c.name.toLowerCase()));

    // Find companies not yet in the database
    const missing = TARGET_COMPANIES.filter(name => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return !existingSlugs.has(slug) && !existingNames.has(name.toLowerCase());
    });

    console.log(`Directory: ${existingCompanies?.length || 0} companies. Missing: ${missing.length}. Processing batch of ${BATCH_SIZE}.`);

    if (missing.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All target companies are already in the directory!',
        totalInDirectory: existingCompanies?.length || 0,
        targetListSize: TARGET_COMPANIES.length,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Take next batch
    const batch = missing.slice(0, BATCH_SIZE);
    const results: any[] = [];

    for (const companyName of batch) {
      console.log(`Researching: ${companyName}...`);
      try {
        // Call the existing company-research function internally
        const resp = await fetch(`${supabaseUrl}/functions/v1/company-research`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companyName }),
        });

        const data = await resp.json();
        results.push({
          company: companyName,
          success: data.success,
          alreadyExists: data.alreadyExists,
          error: data.error,
        });

        if (data.success) {
          console.log(`✅ ${companyName} added successfully`);
        } else {
          console.error(`❌ ${companyName} failed: ${data.error}`);
        }

        // Brief pause between calls to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.error(`❌ ${companyName} error:`, e);
        results.push({ company: companyName, success: false, error: String(e) });
      }
    }

    const succeeded = results.filter(r => r.success).length;

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${batch.length} companies. ${succeeded} succeeded.`,
      remaining: missing.length - batch.length,
      totalInDirectory: (existingCompanies?.length || 0) + succeeded,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Batch research error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
