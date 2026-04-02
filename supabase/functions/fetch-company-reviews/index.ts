import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CACHE_HOURS = 24;

interface ApifyRunResult {
  items: any[];
}

async function runApifyActor(actorId: string, input: Record<string, unknown>): Promise<any[]> {
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    console.error(`Apify actor ${actorId} failed: ${res.status} ${await res.text()}`);
    return [];
  }
  return await res.json();
}

async function fetchIndeedReviews(companyName: string): Promise<any[]> {
  try {
    const items = await runApifyActor("misceres~indeed-scraper", {
      position: "",
      country: "US",
      location: "",
      maxItems: 10,
      parseCompanyReviews: true,
      companyName: companyName,
      startUrls: [],
    });

    if (!items || items.length === 0) return [];

    // Extract aggregate ratings and recent reviews
    const signals: any[] = [];

    // Look for rating data in the results
    const reviews = items.filter((item: any) => item.rating || item.overallRating);
    
    // Calculate aggregate scores
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((s: number, r: any) => s + (r.rating || r.overallRating || 0), 0) / reviews.length;
      
      signals.push({
        source: "Indeed",
        signal_type: "overall_rating",
        label: "Overall Rating",
        value: `${avgRating.toFixed(1)} / 5`,
        numeric_value: parseFloat(avgRating.toFixed(1)),
        detail: `Based on ${reviews.length} employee reviews`,
        badge_label: "Indeed Reviews",
      });

      // Extract sub-scores if available
      const subScores: Record<string, { sum: number; count: number }> = {};
      for (const r of reviews) {
        for (const key of ["workLifeBalance", "compensation", "management", "culture", "jobSecurity"]) {
          const val = r[key] || r[key.toLowerCase()];
          if (typeof val === "number" && val > 0) {
            if (!subScores[key]) subScores[key] = { sum: 0, count: 0 };
            subScores[key].sum += val;
            subScores[key].count += 1;
          }
        }
      }

      const labelMap: Record<string, string> = {
        workLifeBalance: "Work-Life Balance",
        compensation: "Compensation",
        management: "Management",
        culture: "Culture",
        jobSecurity: "Job Security",
      };

      for (const [key, data] of Object.entries(subScores)) {
        const avg = data.sum / data.count;
        signals.push({
          source: "Indeed",
          signal_type: `sub_score_${key}`,
          label: labelMap[key] || key,
          value: `${avg.toFixed(1)} / 5`,
          numeric_value: parseFloat(avg.toFixed(1)),
          detail: null,
          badge_label: "Indeed Reviews",
        });
      }

      // Get 3 most recent review snippets
      const recentReviews = reviews
        .filter((r: any) => r.text || r.review || r.pros || r.cons)
        .slice(0, 3);

      for (let i = 0; i < recentReviews.length; i++) {
        const r = recentReviews[i];
        const text = r.text || r.review || [r.pros, r.cons].filter(Boolean).join(" · ");
        if (text) {
          signals.push({
            source: "Indeed",
            signal_type: `review_snippet_${i + 1}`,
            label: `Employee Review ${i + 1}`,
            value: null,
            numeric_value: r.rating || r.overallRating || null,
            detail: text.slice(0, 300),
            badge_label: "From Indeed employees",
          });
        }
      }
    }

    return signals;
  } catch (err) {
    console.error("Indeed fetch error:", err);
    return [];
  }
}

async function fetchBBBProfile(companyName: string, state: string): Promise<any[]> {
  try {
    const items = await runApifyActor("curious_coder~bbb-scraper", {
      searchQuery: companyName,
      location: state || "US",
      maxItems: 3,
    });

    if (!items || items.length === 0) return [];

    // Find the best match
    const match = items[0];
    if (!match) return [];

    const signals: any[] = [];

    // Accreditation status
    const isAccredited = match.isAccredited || match.accredited || false;
    signals.push({
      source: "Better Business Bureau",
      signal_type: "accreditation",
      label: "BBB Accreditation",
      value: isAccredited ? "Accredited" : "Not Accredited",
      numeric_value: isAccredited ? 1 : 0,
      detail: null,
      badge_label: "BBB",
    });

    // BBB Rating
    const rating = match.rating || match.bbbRating;
    if (rating) {
      const ratingScore: Record<string, number> = {
        "A+": 5, "A": 4.5, "A-": 4, "B+": 3.5, "B": 3, "B-": 2.5,
        "C+": 2, "C": 1.5, "C-": 1, "D+": 0.75, "D": 0.5, "D-": 0.25, "F": 0,
      };
      signals.push({
        source: "Better Business Bureau",
        signal_type: "rating",
        label: "BBB Rating",
        value: rating,
        numeric_value: ratingScore[rating] ?? null,
        detail: null,
        badge_label: "BBB",
      });
    }

    // Years in business
    const years = match.yearsInBusiness || match.years;
    if (years) {
      signals.push({
        source: "Better Business Bureau",
        signal_type: "years_in_business",
        label: "Years in Business",
        value: `${years} years`,
        numeric_value: typeof years === "number" ? years : parseInt(years) || null,
        detail: null,
        badge_label: "BBB",
      });
    }

    // Complaint count
    const complaints = match.complaintsCount || match.complaints || match.totalComplaints || 0;
    signals.push({
      source: "Better Business Bureau",
      signal_type: "complaints",
      label: "Complaints (Last 3 Years)",
      value: `${complaints}`,
      numeric_value: typeof complaints === "number" ? complaints : parseInt(complaints) || 0,
      detail: complaints > 10 ? "Elevated complaint volume" : null,
      badge_label: "BBB",
    });

    // Source URL
    const sourceUrl = match.url || match.profileUrl || null;
    if (sourceUrl) {
      for (const sig of signals) {
        sig.source_url = sourceUrl;
      }
    }

    return signals;
  } catch (err) {
    console.error("BBB fetch error:", err);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { companyId, companyName, state } = await req.json();

    if (!companyId || !companyName) {
      return new Response(
        JSON.stringify({ error: "companyId and companyName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache freshness
    const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("company_community_signals")
      .select("id, fetched_at")
      .eq("company_id", companyId)
      .in("source", ["Indeed", "Better Business Bureau"])
      .gte("fetched_at", cutoff)
      .limit(1);

    if (existing && existing.length > 0) {
      // Cache is fresh, return existing data
      const { data: cached } = await supabase
        .from("company_community_signals")
        .select("*")
        .eq("company_id", companyId)
        .in("source", ["Indeed", "Better Business Bureau"]);
      
      return new Response(
        JSON.stringify({ cached: true, signals: cached || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch fresh data from both sources in parallel
    const [indeedSignals, bbbSignals] = await Promise.all([
      fetchIndeedReviews(companyName),
      fetchBBBProfile(companyName, state || ""),
    ]);

    const allSignals = [...indeedSignals, ...bbbSignals];
    const now = new Date().toISOString();

    if (allSignals.length > 0) {
      // Delete old signals for this company from these sources
      await supabase
        .from("company_community_signals")
        .delete()
        .eq("company_id", companyId)
        .in("source", ["Indeed", "Better Business Bureau"]);

      // Insert new signals
      const rows = allSignals.map((sig) => ({
        company_id: companyId,
        source: sig.source,
        signal_type: sig.signal_type,
        label: sig.label,
        value: sig.value,
        numeric_value: sig.numeric_value,
        detail: sig.detail,
        source_url: sig.source_url || null,
        badge_label: sig.badge_label,
        fetched_at: now,
      }));

      const { error: insertError } = await supabase
        .from("company_community_signals")
        .insert(rows);

      if (insertError) {
        console.error("Insert error:", insertError);
      }
    }

    // Compute review flag
    const managementScore = indeedSignals.find(
      (s) => s.signal_type === "sub_score_management"
    )?.numeric_value;
    const bbbAccredited = bbbSignals.find(
      (s) => s.signal_type === "accreditation"
    )?.numeric_value;
    const bbbComplaints = bbbSignals.find(
      (s) => s.signal_type === "complaints"
    )?.numeric_value;

    const reviewCarefully =
      (managementScore != null && managementScore < 2.5) ||
      (bbbAccredited === 0 && (bbbComplaints ?? 0) >= 10);

    return new Response(
      JSON.stringify({
        cached: false,
        signals: allSignals,
        reviewCarefully,
        fetchedAt: now,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
