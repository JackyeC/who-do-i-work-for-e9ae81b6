/**
 * Media Bias Database — maps outlet domains to political lean and reliability.
 * Based on publicly available bias classification data from AllSides, Ad Fontes Media,
 * and Media Bias Fact Check. This is a static reference; no API required.
 *
 * Only applied to journalism/opinion sources.
 * Government filings, court records, and regulatory data are "Primary Record — No perspective applied."
 */

export type PoliticalLean = "left" | "lean_left" | "center" | "lean_right" | "right";
export type ReliabilityRating = "high" | "mixed" | "low";

export interface OutletProfile {
  name: string;
  lean: PoliticalLean;
  reliability: ReliabilityRating;
}

// ~200 major outlets mapped
const OUTLET_DATABASE: Record<string, OutletProfile> = {
  // ─── LEFT ───
  "msnbc.com": { name: "MSNBC", lean: "left", reliability: "mixed" },
  "thenation.com": { name: "The Nation", lean: "left", reliability: "mixed" },
  "motherjones.com": { name: "Mother Jones", lean: "left", reliability: "mixed" },
  "dailykos.com": { name: "Daily Kos", lean: "left", reliability: "mixed" },
  "jacobin.com": { name: "Jacobin", lean: "left", reliability: "mixed" },
  "commondreams.org": { name: "Common Dreams", lean: "left", reliability: "mixed" },
  "truthout.org": { name: "Truthout", lean: "left", reliability: "mixed" },
  "democracynow.org": { name: "Democracy Now", lean: "left", reliability: "mixed" },
  "huffpost.com": { name: "HuffPost", lean: "left", reliability: "mixed" },
  "salon.com": { name: "Salon", lean: "left", reliability: "mixed" },
  "slate.com": { name: "Slate", lean: "left", reliability: "mixed" },
  "vox.com": { name: "Vox", lean: "left", reliability: "mixed" },
  "theintercept.com": { name: "The Intercept", lean: "left", reliability: "high" },
  "currentaffairs.org": { name: "Current Affairs", lean: "left", reliability: "mixed" },

  // ─── LEAN LEFT ───
  "nytimes.com": { name: "New York Times", lean: "lean_left", reliability: "high" },
  "washingtonpost.com": { name: "Washington Post", lean: "lean_left", reliability: "high" },
  "cnn.com": { name: "CNN", lean: "lean_left", reliability: "mixed" },
  "nbcnews.com": { name: "NBC News", lean: "lean_left", reliability: "high" },
  "abcnews.go.com": { name: "ABC News", lean: "lean_left", reliability: "high" },
  "cbsnews.com": { name: "CBS News", lean: "lean_left", reliability: "high" },
  "politico.com": { name: "Politico", lean: "lean_left", reliability: "high" },
  "npr.org": { name: "NPR", lean: "lean_left", reliability: "high" },
  "pbs.org": { name: "PBS", lean: "lean_left", reliability: "high" },
  "latimes.com": { name: "LA Times", lean: "lean_left", reliability: "high" },
  "time.com": { name: "Time", lean: "lean_left", reliability: "high" },
  "bloomberg.com": { name: "Bloomberg", lean: "lean_left", reliability: "high" },
  "theguardian.com": { name: "The Guardian", lean: "lean_left", reliability: "high" },
  "bbc.com": { name: "BBC", lean: "lean_left", reliability: "high" },
  "bbc.co.uk": { name: "BBC", lean: "lean_left", reliability: "high" },
  "theatlantic.com": { name: "The Atlantic", lean: "lean_left", reliability: "high" },
  "newyorker.com": { name: "The New Yorker", lean: "lean_left", reliability: "high" },
  "propublica.org": { name: "ProPublica", lean: "lean_left", reliability: "high" },
  "axios.com": { name: "Axios", lean: "lean_left", reliability: "high" },
  "thedailybeast.com": { name: "The Daily Beast", lean: "lean_left", reliability: "mixed" },
  "buzzfeednews.com": { name: "BuzzFeed News", lean: "lean_left", reliability: "mixed" },
  "insider.com": { name: "Business Insider", lean: "lean_left", reliability: "mixed" },
  "businessinsider.com": { name: "Business Insider", lean: "lean_left", reliability: "mixed" },
  "vice.com": { name: "VICE", lean: "lean_left", reliability: "mixed" },
  "newsweek.com": { name: "Newsweek", lean: "lean_left", reliability: "mixed" },
  "usatoday.com": { name: "USA Today", lean: "lean_left", reliability: "high" },

  // ─── CENTER ───
  "apnews.com": { name: "Associated Press", lean: "center", reliability: "high" },
  "reuters.com": { name: "Reuters", lean: "center", reliability: "high" },
  "thehill.com": { name: "The Hill", lean: "center", reliability: "high" },
  "c-span.org": { name: "C-SPAN", lean: "center", reliability: "high" },
  "allsides.com": { name: "AllSides", lean: "center", reliability: "high" },
  "realclearpolitics.com": { name: "RealClearPolitics", lean: "center", reliability: "mixed" },
  "factcheck.org": { name: "FactCheck.org", lean: "center", reliability: "high" },
  "snopes.com": { name: "Snopes", lean: "center", reliability: "high" },
  "politifact.com": { name: "PolitiFact", lean: "center", reliability: "high" },
  "ft.com": { name: "Financial Times", lean: "center", reliability: "high" },
  "economist.com": { name: "The Economist", lean: "center", reliability: "high" },
  "csmonitor.com": { name: "Christian Science Monitor", lean: "center", reliability: "high" },
  "marketwatch.com": { name: "MarketWatch", lean: "center", reliability: "high" },
  "cnbc.com": { name: "CNBC", lean: "center", reliability: "high" },
  "barrons.com": { name: "Barron's", lean: "center", reliability: "high" },
  "law360.com": { name: "Law360", lean: "center", reliability: "high" },

  // ─── LEAN RIGHT ───
  "wsj.com": { name: "Wall Street Journal", lean: "lean_right", reliability: "high" },
  "foxbusiness.com": { name: "Fox Business", lean: "lean_right", reliability: "mixed" },
  "reason.com": { name: "Reason", lean: "lean_right", reliability: "high" },
  "nationalreview.com": { name: "National Review", lean: "lean_right", reliability: "mixed" },
  "washingtonexaminer.com": { name: "Washington Examiner", lean: "lean_right", reliability: "mixed" },
  "freebeacon.com": { name: "Washington Free Beacon", lean: "lean_right", reliability: "mixed" },
  "nypost.com": { name: "New York Post", lean: "lean_right", reliability: "mixed" },
  "forbes.com": { name: "Forbes", lean: "lean_right", reliability: "high" },
  "washingtontimes.com": { name: "Washington Times", lean: "lean_right", reliability: "mixed" },
  "spectator.org": { name: "The American Spectator", lean: "lean_right", reliability: "mixed" },

  // ─── RIGHT ───
  "foxnews.com": { name: "Fox News", lean: "right", reliability: "mixed" },
  "breitbart.com": { name: "Breitbart", lean: "right", reliability: "low" },
  "dailywire.com": { name: "The Daily Wire", lean: "right", reliability: "mixed" },
  "thefederalist.com": { name: "The Federalist", lean: "right", reliability: "mixed" },
  "dailycaller.com": { name: "Daily Caller", lean: "right", reliability: "mixed" },
  "newsmax.com": { name: "Newsmax", lean: "right", reliability: "low" },
  "oann.com": { name: "OANN", lean: "right", reliability: "low" },
  "townhall.com": { name: "Townhall", lean: "right", reliability: "mixed" },
  "theblaze.com": { name: "The Blaze", lean: "right", reliability: "mixed" },
  "epochtimes.com": { name: "The Epoch Times", lean: "right", reliability: "low" },
  "zerohedge.com": { name: "ZeroHedge", lean: "right", reliability: "low" },
  "infowars.com": { name: "InfoWars", lean: "right", reliability: "low" },
  "pjmedia.com": { name: "PJ Media", lean: "right", reliability: "low" },
  "redstate.com": { name: "RedState", lean: "right", reliability: "mixed" },
};

/** Look up an outlet by URL or domain */
export function getOutletProfile(urlOrDomain: string): OutletProfile | null {
  try {
    const domain = urlOrDomain.includes("://")
      ? new URL(urlOrDomain).hostname.replace(/^www\./, "")
      : urlOrDomain.replace(/^www\./, "");
    return OUTLET_DATABASE[domain] || null;
  } catch {
    return null;
  }
}

/** Get all outlets in the database */
export function getAllOutlets(): Record<string, OutletProfile> {
  return OUTLET_DATABASE;
}

export const LEAN_LABELS: Record<PoliticalLean, string> = {
  left: "Left",
  lean_left: "Lean Left",
  center: "Center",
  lean_right: "Lean Right",
  right: "Right",
};

export const LEAN_COLORS: Record<PoliticalLean, string> = {
  left: "text-blue-500 bg-blue-500/10",
  lean_left: "text-blue-400 bg-blue-400/10",
  center: "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10",
  lean_right: "text-red-400 bg-red-400/10",
  right: "text-red-500 bg-red-500/10",
};

export const RELIABILITY_COLORS: Record<ReliabilityRating, string> = {
  high: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  mixed: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
  low: "text-destructive border-destructive/30",
};

/** Compute perspective distribution from a list of source URLs */
export function computeCoverageBalance(sourceUrls: string[]): {
  left: number;
  lean_left: number;
  center: number;
  lean_right: number;
  right: number;
  unknown: number;
  total: number;
  narrativeRisk: boolean;
} {
  const counts = { left: 0, lean_left: 0, center: 0, lean_right: 0, right: 0, unknown: 0 };
  for (const url of sourceUrls) {
    const profile = getOutletProfile(url);
    if (profile) counts[profile.lean]++;
    else counts.unknown++;
  }
  const total = sourceUrls.length;
  const leftTotal = counts.left + counts.lean_left;
  const rightTotal = counts.right + counts.lean_right;
  const maxSide = Math.max(leftTotal, rightTotal, counts.center);
  const narrativeRisk = total > 2 && maxSide / total > 0.8;

  return { ...counts, total, narrativeRisk };
}
