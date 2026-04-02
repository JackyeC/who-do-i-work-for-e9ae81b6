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

export interface EvidenceCard {
  id: string;
  category: CardCategory;
  title: string;
  takeaway: string;
  whyItMatters: string;
  icon: string;
  confidence: ConfidenceState;
  paths: InvestigationPath[];     // Which paths unlock this card
  act: 1 | 2 | 3;
  position?: { x: number; y: number };
  connectedTo?: string[];         // IDs of connected cards
  isRevealed: boolean;
  revealFragmentId?: string;      // Links to archetype fragment
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
  { score: 0, title: "Curious Bystander", badge: "👀" },
  { score: 100, title: "Paper Chaser", badge: "📄" },
  { score: 300, title: "Receipt Collector", badge: "🧾" },
  { score: 600, title: "Trail Finder", badge: "🔍" },
  { score: 1000, title: "Deep Diver", badge: "🤿" },
  { score: 1500, title: "Pattern Spotter", badge: "🧩" },
  { score: 2500, title: "Chief Investigator", badge: "🕵️" },
];

export function getRank(score: number) {
  let rank = RANK_THRESHOLDS[0];
  for (const t of RANK_THRESHOLDS) {
    if (score >= t.score) rank = t;
  }
  return rank;
}
