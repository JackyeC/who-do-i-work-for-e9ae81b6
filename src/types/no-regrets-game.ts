export interface PlayerStats {
  money: number;
  safety: number;
  sanity: number;
  power: number;
}

export type PlayerArchetype = "stability-first" | "pause-and-reassess" | "overstay-and-hope";

export interface Choice {
  id: string;
  label: string;
  statChanges: Partial<PlayerStats>;
  recapText: string;
  archetype: PlayerArchetype;
}

export interface Episode {
  id: string;
  title: string;
  narrative: string[];
  choices: Choice[];
  initialStats: PlayerStats;
}

export interface GameState {
  episodeId: string;
  choiceId: string | null;
  stats: PlayerStats;
}
