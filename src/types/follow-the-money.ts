/**
 * Follow the Money — TypeScript interfaces
 * Matches the target GET /api/company/:id/follow-the-money response shape.
 */

export type CoverageStatus = "strong" | "limited" | "none" | "error";
export type MatchConfidence = "high" | "medium" | "low";

export interface TopRecipient {
  name: string;
  amount: number;
  party?: string;
  state?: string;
}

export interface ElectionCycle {
  cycle: number;
  totalAmount: number;
  contributionCount: number;
  topRecipients: TopRecipient[];
}

export interface MoneyTrailSummary {
  totalLinkedContributions: number;
  contributionCount: number;
  lastRefreshedAt: string | null;
}

export interface FollowTheMoneyResponse {
  companyId: string;
  companyName: string;
  status: CoverageStatus;
  summary: MoneyTrailSummary;
  cycles: ElectionCycle[];
  aliasesSearched: string[];
  matchConfidence: MatchConfidence;
  disclaimer: string;
}
