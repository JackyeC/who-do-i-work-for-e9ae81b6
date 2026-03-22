/**
 * Integrity Gap Score™
 *
 * Compares a candidate's post-interview experience against
 * the company's public data signals to detect "Diversity Wash"
 * and "Say-Do" disconnects.
 *
 * Each questionnaire dimension is scored 0-100 via a sentiment slider.
 * The Integrity Gap is the divergence between public signals and lived experience.
 */

import { z } from "zod";

// ─── Validation Schema ─────────────────────────────────────────────────────

export const vibeMatchSchema = z.object({
  companyId: z.string().uuid(),
  companyName: z.string().trim().min(1).max(200),
  jobTitle: z.string().trim().max(200).optional(),
  interviewDate: z.string().optional(),
  successClarity: z.number().min(0).max(100),
  challengeConsistency: z.number().min(0).max(100),
  panelDiversity: z.number().min(0).max(100),
  boundaryReaction: z.number().min(0).max(100),
  predecessorRespect: z.number().min(0).max(100),
  processOrganization: z.number().min(0).max(100),
  additionalNotes: z.string().trim().max(2000).optional(),
});

export type VibeMatchInput = z.infer<typeof vibeMatchSchema>;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PublicDataSignals {
  boardDiversityScore?: number;     // 0-100
  execTenureScore?: number;         // 0-100
  promotionVelocityScore?: number;  // 0-100
  payTransparencyScore?: number;    // 0-100
  retentionScore?: number;          // 0-100
  vibeScore?: number;               // 0-100 (Inclusive Vibe Score)
}

export interface DimensionComparison {
  dimension: string;
  experienceScore: number;
  publicDataScore: number;
  gap: number;
  signal: "aligned" | "caution" | "disconnect";
  insight: string;
}

export interface RealityGapResult {
  overallVibeScore: number;
  integrityGapScore: number;
  gapLabel: string;
  gapBand: "aligned" | "minor_gap" | "notable_gap" | "significant_disconnect" | "reality_check";
  dimensions: DimensionComparison[];
}

// ─── Dimension Mapping ──────────────────────────────────────────────────────

const DIMENSION_WEIGHTS = {
  leadership: 0.20,
  consistency: 0.15,
  inclusion: 0.20,
  boundaries: 0.15,
  respect: 0.15,
  process: 0.15,
} as const;

// ─── Scoring Logic ──────────────────────────────────────────────────────────

function getGapSignal(gap: number): DimensionComparison["signal"] {
  const absGap = Math.abs(gap);
  if (absGap <= 15) return "aligned";
  if (absGap <= 35) return "caution";
  return "disconnect";
}

function getGapBand(score: number): RealityGapResult["gapBand"] {
  if (score <= 10) return "aligned";
  if (score <= 25) return "minor_gap";
  if (score <= 40) return "notable_gap";
  if (score <= 60) return "significant_disconnect";
  return "reality_check";
}

const GAP_LABELS: Record<RealityGapResult["gapBand"], string> = {
  aligned: "Well Aligned",
  minor_gap: "Minor Gap",
  notable_gap: "Notable Gap",
  significant_disconnect: "Significant Disconnect",
  reality_check: "Reality Check Needed",
};

function generateInsight(
  dimension: string,
  experienceScore: number,
  publicDataScore: number,
): string {
  const gap = publicDataScore - experienceScore;

  if (Math.abs(gap) <= 15) {
    return `Your interview experience aligns with the public data. The company appears consistent in this area.`;
  }

  if (gap > 15) {
    // Public data is better than experience
    switch (dimension) {
      case "Leadership Transparency":
        return `The company's public disclosures suggest strong leadership, but your interview experience indicates less clarity at the hiring manager level. This is a classic "Diversity Wash" signal — the work at the top hasn't scaled down.`;
      case "Message Consistency":
        return `Public messaging is polished, but interviewers aren't aligned. This suggests a gap between the PR team and the people doing the actual work.`;
      case "Inclusion & Diversity":
        return `The Board/exec diversity data looks strong on paper, but your interview panel didn't reflect that. You might be entering an environment where you'll be expected to be the 'culture builder.'`;
      case "Boundary Culture":
        return `The company markets work-life balance, but the interview signals suggest a "we wear many hats" culture. Ask specifically about on-call expectations.`;
      case "Professional Respect":
        return `Public PR emphasizes "people first," but speaking negatively about predecessors is a character tell. Watch for a blame culture.`;
      case "Process Quality":
        return `The recruiting brand looks professional, but the actual process was disorganized. This often reflects how the company runs internally.`;
      default:
        return `Public signals exceed the interview experience, indicating a potential gap between marketing and reality.`;
    }
  }

  // Experience is better than public data
  return `Your interview experience was actually stronger than what the public data suggests. This is a positive signal — the company may be improving faster than their disclosures reflect.`;
}

// ─── Main Calculator ────────────────────────────────────────────────────────

export function calculateRealityGap(
  input: VibeMatchInput,
  publicSignals: PublicDataSignals,
): RealityGapResult {
  // Map questionnaire answers to dimensions with their public data counterparts
  const dimensionPairs: {
    name: string;
    experience: number;
    publicData: number;
    weight: number;
  }[] = [
    {
      name: "Leadership Transparency",
      experience: input.successClarity,
      publicData: publicSignals.execTenureScore ?? 50,
      weight: DIMENSION_WEIGHTS.leadership,
    },
    {
      name: "Message Consistency",
      experience: input.challengeConsistency,
      publicData: publicSignals.payTransparencyScore ?? 50,
      weight: DIMENSION_WEIGHTS.consistency,
    },
    {
      name: "Inclusion & Diversity",
      experience: input.panelDiversity,
      publicData: publicSignals.boardDiversityScore ?? 50,
      weight: DIMENSION_WEIGHTS.inclusion,
    },
    {
      name: "Boundary Culture",
      experience: input.boundaryReaction,
      publicData: publicSignals.retentionScore ?? 50,
      weight: DIMENSION_WEIGHTS.boundaries,
    },
    {
      name: "Professional Respect",
      experience: input.predecessorRespect,
      publicData: publicSignals.promotionVelocityScore ?? 50,
      weight: DIMENSION_WEIGHTS.respect,
    },
    {
      name: "Process Quality",
      experience: input.processOrganization,
      publicData: publicSignals.vibeScore ?? 50,
      weight: DIMENSION_WEIGHTS.process,
    },
  ];

  const dimensions: DimensionComparison[] = dimensionPairs.map((d) => {
    const gap = d.publicData - d.experience;
    return {
      dimension: d.name,
      experienceScore: d.experience,
      publicDataScore: d.publicData,
      gap,
      signal: getGapSignal(gap),
      insight: generateInsight(d.name, d.experience, d.publicData),
    };
  });

  // Overall vibe = weighted average of experience scores
  const overallVibeScore = Math.round(
    dimensionPairs.reduce((sum, d) => sum + d.experience * d.weight, 0),
  );

  // Integrity gap = weighted average of absolute gaps
  const integrityGapScore = Math.round(
    dimensionPairs.reduce((sum, d) => sum + Math.abs(d.publicData - d.experience) * d.weight, 0),
  );

  const gapBand = getGapBand(integrityGapScore);

  return {
    overallVibeScore,
    integrityGapScore,
    gapLabel: GAP_LABELS[gapBand],
    gapBand,
    dimensions,
  };
}
