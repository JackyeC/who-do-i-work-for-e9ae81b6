export interface PlayerStats {
  money: number;
  safety: number;
  sanity: number;
  power: number;
}

export interface Choice {
  id: string;
  label: string;
  statChanges: Partial<PlayerStats>;
  recapText: string;
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
