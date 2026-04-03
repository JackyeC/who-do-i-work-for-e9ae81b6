/**
 * WhoDoI Trail — Type definitions for the investigation game.
 */

export type InvestigationPath = "money" | "workers" | "executives" | "image";
export type TheoryChoice = "hypocrisy" | "elite_access" | "labor_extraction" | "image_management" | "quiet_influence";
export type PriorityChoice = "stability" | "ethics" | "prestige" | "pay" | "belonging";
export type CelebrationLevel = "quiet" | "standard" | "extra";

export type CardCategory = "receipt" | "person" | "claim" | "signal" | "network" | "reveal";
export type ConnectorType = "solid" | "dashed" | "dotted" | "double" | "wavy";
export type ConfidenceState = "verified" | "partial" | "emerging" | "unverified";

/** Bar chart data for receipt/signal cards */
export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

/** Stats badges like CongressWatch's "$36.2M  258  271" row */
export interface StatBadge {
  label: string;
  value: string;
  color?: string;
}

/** Person-specific metadata for profile-style cards */
export interface PersonMeta {
  role: string;
  org: string;
  photoInitials: string;     // Fallback initials for avatar
  compensation?: string;
  priorRole?: string;
  stats: StatBadge[];
  barData?: BarDatum[];
}

/** Receipt/signal enrichment data */
export interface DataViz {
  headline?: string;         // Big dollar or stat number
  headlineLabel?: string;
  stats?: StatBadge[];
  bars?: BarDatum[];
  breakdown?: { label: string; value: string; highlight?: boolean }[];
}

export interface EvidenceCard {
  id: string;
  category: CardCategory;
  title: string;
  takeaway: string;
  whyItMatters: string;
  icon: string;
  confidence: ConfidenceState;
  paths: InvestigationPath[];
  act: 1 | 2 | 3;
  position?: { x: number; y: number };
  connectedTo?: string[];
  isRevealed: boolean;
  revealFragmentId?: string;
  // Enrichment
  personMeta?: PersonMeta;
  dataViz?: DataViz;
}

export interface CardConnection {
  id: string;
  fromId: string;
  toId: string;
  type: ConnectorType;
  label?: string;
  isRevealed: boolean;
}

export interface ArchetypeFragment {
  id: string;
  archetypeId: string;
  label: string;
  isCollected: boolean;
}

export interface Archetype {
  id: string;
  title: string;
  emoji: string;
  verdict: string;
  traits: string[];
  workerImpact: string;
  colorAccent: string;
}

export interface ArtifactPrize {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  archetypeId: string;
}

export interface CaseFile {
  id: string;
  companyName: string;
  companyIndustry: string;
  companyDescription: string;
  cards: EvidenceCard[];
  connections: CardConnection[];
  archetypes: Archetype[];
  fragments: ArchetypeFragment[];
  artifacts: ArtifactPrize[];
}

export interface PlayerProfile {
  name: string;
  rank: string;
  score: number;
  casesSolved: number;
  streak: number;
  archetypesFound: string[];
  artifactCollection: string[];
}

export interface ScoreEvent {
  type: "clue_found" | "connection_made" | "hidden_path" | "case_solved" | "rare_archetype" | "speed_bonus";
  points: number;
  label: string;
}

export const SCORE_VALUES: Record<ScoreEvent["type"], number> = {
  clue_found: 10,
  connection_made: 25,
  hidden_path: 50,
  case_solved: 100,
  rare_archetype: 75,
  speed_bonus: 15,
};

export const RANK_THRESHOLDS = [
  { score: 0, title: "New to This", badge: "👋" },
  { score: 100, title: "Asking Questions", badge: "❓" },
  { score: 300, title: "Reading the Room", badge: "👁️" },
  { score: 600, title: "Seeing Patterns", badge: "🧩" },
  { score: 1000, title: "Knows What to Look For", badge: "🔍" },
  { score: 1500, title: "Can't Be Fooled", badge: "🛡️" },
  { score: 2500, title: "Career Intelligence Pro", badge: "⭐" },
];

export function getRank(score: number) {
  let rank = RANK_THRESHOLDS[0];
  for (const t of RANK_THRESHOLDS) {
    if (score >= t.score) rank = t;
  }
  return rank;
}
