/**
 * Evidence Quality Score — computes per-section confidence (0–100)
 * based on source tier mix, recency, cross-verification, and entity match.
 */

export type SourceTier = 1 | 2 | 3 | 4 | 5;

export interface SourceSignal {
  tier: SourceTier;
  dateRetrieved: string | Date;
  datePublished?: string | Date | null;
  matchConfidence?: number; // 0–1
  verificationStatus?: "verified" | "cross_verified" | "pending" | "stale" | "conflict";
}

const TIER_WEIGHTS: Record<SourceTier, number> = {
  1: 1.0,   // Government filings (SEC, FEC, LDA, USAspending, EPA, OSHA, courts)
  2: 0.8,   // Company disclosures (proxy, IR, annual reports)
  3: 0.6,   // Major reporting (ProPublica, Reuters, AP, investigative journalism)
  4: 0.4,   // Commercial enrichment (People Data Labs, Crunchbase)
  5: 0.1,   // Unverified (forums, anonymous reviews, social posts)
};

export const TIER_LABELS: Record<SourceTier, string> = {
  1: "Government Record",
  2: "Company Disclosure",
  3: "Major Reporting",
  4: "Commercial Enrichment",
  5: "Unverified",
};

export const TIER_COLORS: Record<SourceTier, string> = {
  1: "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/30",
  2: "text-[hsl(var(--civic-blue))] bg-[hsl(var(--civic-blue))]/10 border-[hsl(var(--civic-blue))]/30",
  3: "text-primary bg-primary/10 border-primary/30",
  4: "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/30",
  5: "text-destructive bg-destructive/10 border-destructive/30",
};

function recencyWeight(date: string | Date): number {
  const diffDays = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 30) return 1.0;
  if (diffDays < 90) return 0.7;
  if (diffDays < 180) return 0.5;
  return 0.4;
}

export function computeEvidenceQuality(sources: SourceSignal[]): {
  score: number;
  primarySourceCoverage: number;
  crossVerifiedCount: number;
  conflictsDetected: number;
  breakdown: { tier: SourceTier; count: number; weight: number }[];
} {
  if (sources.length === 0) {
    return { score: 0, primarySourceCoverage: 0, crossVerifiedCount: 0, conflictsDetected: 0, breakdown: [] };
  }

  const tierCounts = new Map<SourceTier, number>();
  let totalWeight = 0;
  let crossVerified = 0;
  let conflicts = 0;

  for (const s of sources) {
    tierCounts.set(s.tier, (tierCounts.get(s.tier) || 0) + 1);

    const tierW = TIER_WEIGHTS[s.tier];
    const recW = recencyWeight(s.dateRetrieved);
    const matchW = s.matchConfidence ?? 0.8;
    totalWeight += tierW * recW * matchW;

    if (s.verificationStatus === "cross_verified") crossVerified++;
    if (s.verificationStatus === "conflict") conflicts++;
  }

  // Base score from weighted average
  let score = (totalWeight / sources.length) * 100;

  // Cross-verification bonus: +10 per cross-verified, max +20
  score += Math.min(crossVerified * 10, 20);

  // Contradiction penalty
  score -= conflicts * 15;

  // Primary source coverage bonus
  const primaryCount = (tierCounts.get(1) || 0) + (tierCounts.get(2) || 0);
  const primaryCoverage = primaryCount / sources.length;
  score += primaryCoverage * 10;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const breakdown = Array.from(tierCounts.entries()).map(([tier, count]) => ({
    tier,
    count,
    weight: TIER_WEIGHTS[tier],
  }));

  return {
    score,
    primarySourceCoverage: Math.round(primaryCoverage * 100),
    crossVerifiedCount: crossVerified,
    conflictsDetected: conflicts,
    breakdown,
  };
}

/** Map a source_type string from the DB to a tier number */
export function sourceTypeToTier(sourceType: string): SourceTier {
  switch (sourceType) {
    case "government_filing": return 1;
    case "company_disclosure": return 2;
    case "major_reporting": return 3;
    case "commercial_enrichment": return 4;
    default: return 5;
  }
}
