import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId, ticker, cik } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: "companyId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!ticker && !cik) {
      return new Response(JSON.stringify({ success: true, count: 0, message: "No ticker or CIK available" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use SEC EDGAR XBRL API for Form 4 filings
    let filings: any[] = [];

    if (cik) {
      const paddedCik = String(cik).padStart(10, "0");
      const edgarUrl = `https://efts.sec.gov/LATEST/search-index?q=%22${paddedCik}%22&dateRange=custom&startdt=${getDateMonthsAgo(6)}&enddt=${getToday()}&forms=4&from=0&size=20`;

      // Use the EDGAR full-text search for recent Form 4s
      const submissionsUrl = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
      console.log("Fetching SEC submissions for CIK:", paddedCik);

      const res = await fetch(submissionsUrl, {
        headers: { "User-Agent": "WhoDoIWorkFor/1.0 contact@whodoimworkfor.com" },
      });

      if (res.ok) {
        const data = await res.json();
        const recent = data.filings?.recent;
        if (recent) {
          const form4Indices: number[] = [];
          for (let i = 0; i < (recent.form || []).length && form4Indices.length < 20; i++) {
            if (recent.form[i] === "4") form4Indices.push(i);
          }

          filings = form4Indices.map((i) => ({
            accession: recent.accessionNumber?.[i],
            filingDate: recent.filingDate?.[i],
            primaryDoc: recent.primaryDocument?.[i],
            reportOwner: recent.reportOwner?.[i] || null,
          }));
        }
      }
    }

    // Parse Form 4 XML for each filing (limit to 10 to avoid timeouts)
    const trades: any[] = [];
    for (const f of filings.slice(0, 10)) {
      try {
        const accessionPath = f.accession.replace(/-/g, "");
        const paddedCik2 = String(cik).padStart(10, "0");
        const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${paddedCik2}/${accessionPath}/${f.primaryDoc}`;

        const xmlRes = await fetch(xmlUrl, {
          headers: { "User-Agent": "WhoDoIWorkFor/1.0 contact@whodoimworkfor.com" },
        });

        if (!xmlRes.ok) continue;
        const xmlText = await xmlRes.text();

        // Simple XML parsing for key fields
        const filerName = extractXml(xmlText, "rptOwnerName") || "Unknown";
        const filerTitle = extractXml(xmlText, "officerTitle");
        const txnDate = extractXml(xmlText, "transactionDate>.*?<value") || f.filingDate;
        const shares = extractXml(xmlText, "transactionShares>.*?<value");
        const price = extractXml(xmlText, "transactionPricePerShare>.*?<value");
        const acqDisp = extractXml(xmlText, "transactionAcquiredDisposedCode>.*?<value");
        const sharesAfter = extractXml(xmlText, "sharesOwnedFollowingTransaction>.*?<value");
        const is10b5 = xmlText.includes("Rule 10b5-1") || xmlText.includes("10b5-1");

        const sharesNum = shares ? parseInt(shares) : null;
        const priceNum = price ? parseFloat(price) : null;

        trades.push({
          company_id: companyId,
          filer_name: filerName,
          filer_title: filerTitle,
          transaction_type: acqDisp === "D" ? "sale" : "purchase",
          transaction_date: txnDate || null,
          shares_traded: sharesNum,
          price_per_share: priceNum,
          total_value: sharesNum && priceNum ? Math.round(sharesNum * priceNum * 100) / 100 : null,
          shares_owned_after: sharesAfter ? parseInt(sharesAfter) : null,
          sec_filing_url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=4&dateb=&owner=include&count=40`,
          form_type: "4",
          is_10b5_plan: is10b5,
        });
      } catch (parseErr) {
        console.error("Error parsing Form 4:", parseErr);
      }
    }

    if (trades.length > 0) {
      await supabase.from("insider_trades").delete().eq("company_id", companyId);
      const { error } = await supabase.from("insider_trades").insert(trades);
      if (error) console.error("Insert error:", error);
    }

    return new Response(
      JSON.stringify({ success: true, count: trades.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Insider trades sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function extractXml(xml: string, pattern: string): string | null {
  const regex = new RegExp(`<${pattern}>([^<]+)<`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function getDateMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
