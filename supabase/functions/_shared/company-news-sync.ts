const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";

function toneLabel(tone: number): string {
  if (tone >= 5) return "Very Positive";
  if (tone >= 1.5) return "Positive";
  if (tone >= -1.5) return "Neutral";
  if (tone >= -5) return "Negative";
  return "Very Negative";
}

const controversyPatterns = /lawsuit|sued|scandal|investigation|fraud|violation|fine|penalty|discrimination|harassment|layoff|recall|breach|whistleblow/i;

function detectControversyType(title: string): string | null {
  if (/lawsuit|sued|litigation/i.test(title)) return "litigation";
  if (/scandal|fraud/i.test(title)) return "scandal";
  if (/investigation|probe/i.test(title)) return "investigation";
  if (/discrimination|harassment/i.test(title)) return "workplace";
  if (/layoff|restructur/i.test(title)) return "workforce";
  if (/breach|hack|leak/i.test(title)) return "data_breach";
  if (/fine|penalty|violation/i.test(title)) return "regulatory";
  return null;
}

export async function syncCompanyNews(supabase: any, companyId: string, companyName: string) {
  const query = encodeURIComponent(`"${companyName}"`);
  const gdeltUrl = `${GDELT_DOC_API}?query=${query}&mode=ArtList&maxrecords=25&format=json&timespan=90d&sort=DateDesc`;

  console.log("Querying GDELT for:", companyName);
  const gdeltRes = await fetch(gdeltUrl);

  if (!gdeltRes.ok) {
    console.error("GDELT API error:", gdeltRes.status);
    return { success: true, count: 0, message: "GDELT API unavailable", controversies: 0 };
  }

  const gdeltData = await gdeltRes.json();
  const articles = gdeltData?.articles || [];

  if (articles.length === 0) {
    return { success: true, count: 0, controversies: 0 };
  }

  const rows = articles.slice(0, 25).map((a: any) => {
    const tone = a.tone ? parseFloat(String(a.tone).split(",")[0]) : 0;
    const title = a.title || "Untitled";
    const isControversy = controversyPatterns.test(title);

    return {
      company_id: companyId,
      headline: title.slice(0, 500),
      source_name: a.domain || a.sourcecountry || null,
      source_url: a.url || null,
      published_at: a.seendate ? new Date(
        a.seendate.slice(0, 4) + "-" + a.seendate.slice(4, 6) + "-" + a.seendate.slice(6, 8)
      ).toISOString() : null,
      sentiment_score: tone,
      tone_label: toneLabel(tone),
      themes: a.themes ? String(a.themes).split(";").slice(0, 10) : [],
      is_controversy: isControversy,
      controversy_type: isControversy ? detectControversyType(title) : null,
      gdelt_doc_id: a.url ? String(a.url).slice(-80) : null,
    };
  });

  const { error: deleteErr } = await supabase.from("company_news_signals").delete().eq("company_id", companyId);
  if (deleteErr) {
    console.error("Delete error:", deleteErr);
    throw deleteErr;
  }

  const { error: insertErr } = await supabase.from("company_news_signals").insert(rows);
  if (insertErr) {
    console.error("Insert error:", insertErr);
    throw insertErr;
  }

  return {
    success: true,
    count: rows.length,
    controversies: rows.filter((r: any) => r.is_controversy).length,
  };
}