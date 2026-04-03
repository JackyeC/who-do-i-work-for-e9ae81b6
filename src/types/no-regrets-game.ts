export interface PlayerStats {
  money: number;
  safety: number;
  sanity: number;
  power: number;
}

export type PlayerArchetype = "stability-first" | "pause-and-reassess" | "overstay-and-hope";
export type CompanyArchetype = "safe-pay-shaky-ethics" | "mission-driven-unstable" | "prestige-burnout";
export type ConsequenceLabel = "moral-injury" | "mission-collapse" | "burnout-spiral";

export interface ReceiptHint {
  emoji: string;
  label: string;
  detail: string;
}

export interface Choice {
  id: string;
  label: string;
  statChanges: Partial<PlayerStats>;
  recapText: string;
  archetype: PlayerArchetype | CompanyArchetype | ConsequenceLabel;
  receiptHints?: ReceiptHint[];
}

export interface EpisodeBranch {
  forArchetype: CompanyArchetype;
  narrative: string[];
  warningSign: { emoji: string; title: string; detail: string };
  selfJustification: { emoji: string; title: string; detail: string };
  choices: Choice[];
}

export interface Episode {
  id: string;
  title: string;
  narrative: string[];
  choices: Choice[];
  initialStats: PlayerStats;
  branches?: EpisodeBranch[];
}

export interface GameState {
  episodeId: string;
  choiceId: string | null;
  stats: PlayerStats;
}
