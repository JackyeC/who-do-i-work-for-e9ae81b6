/**
 * WhoDoI Trail — Game state context.
 */
import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import type {
  InvestigationPath, TheoryChoice, PriorityChoice,
  CelebrationLevel, EvidenceCard, CardConnection,
  ArchetypeFragment, ScoreEvent, PlayerProfile,
} from "./types";
import { SCORE_VALUES, getRank } from "./types";
import { DEMO_CASE } from "./mockCase";
import type { CaseFile, Archetype, ArtifactPrize } from "./types";

type GamePhase = "intro" | "act1" | "act2" | "act3" | "board" | "reveal";

interface GameState {
  phase: GamePhase;
  caseFile: CaseFile;
  path: InvestigationPath | null;
  theory: TheoryChoice | null;
  priority: PriorityChoice | null;
  revealedCards: Set<string>;
  revealedConnections: Set<string>;
  collectedFragments: Set<string>;
  selectedCardId: string | null;
  score: number;
  scoreLog: ScoreEvent[];
  celebration: CelebrationLevel;
  reducedMotion: boolean;
  profile: PlayerProfile;
  finalArchetype: Archetype | null;
  finalArtifact: ArtifactPrize | null;
}

type Action =
  | { type: "SET_PATH"; path: InvestigationPath }
  | { type: "SET_THEORY"; theory: TheoryChoice }
  | { type: "SET_PRIORITY"; priority: PriorityChoice }
  | { type: "REVEAL_CARD"; cardId: string }
  | { type: "REVEAL_CONNECTION"; connId: string }
  | { type: "COLLECT_FRAGMENT"; fragId: string }
  | { type: "SELECT_CARD"; cardId: string | null }
  | { type: "ADD_SCORE"; event: ScoreEvent }
  | { type: "SET_PHASE"; phase: GamePhase }
  | { type: "SET_CELEBRATION"; level: CelebrationLevel }
  | { type: "SET_REDUCED_MOTION"; enabled: boolean }
  | { type: "COMPLETE_CASE"; archetype: Archetype; artifact: ArtifactPrize }
  | { type: "RESET" };

const initialState: GameState = {
  phase: "intro",
  caseFile: DEMO_CASE,
  path: null,
  theory: null,
  priority: null,
  revealedCards: new Set(),
  revealedConnections: new Set(),
  collectedFragments: new Set(),
  selectedCardId: null,
  score: 0,
  scoreLog: [],
  celebration: "standard",
  reducedMotion: false,
  profile: {
    name: "Investigator",
    rank: "Curious Bystander",
    score: 0,
    casesSolved: 0,
    streak: 0,
    archetypesFound: [],
    artifactCollection: [],
  },
  finalArchetype: null,
  finalArtifact: null,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_PATH": {
      const newRevealed = new Set(state.revealedCards);
      // Reveal cards that match the chosen path for act 1
      state.caseFile.cards.forEach(c => {
        if (c.paths.includes(action.path) && c.act === 1) newRevealed.add(c.id);
      });
      return { ...state, path: action.path, phase: "act1", revealedCards: newRevealed };
    }
    case "SET_THEORY": {
      const newRevealed = new Set(state.revealedCards);
      state.caseFile.cards.forEach(c => {
        if (c.act <= 2 && c.paths.includes(state.path!)) newRevealed.add(c.id);
      });
      return { ...state, theory: action.theory, phase: "act2", revealedCards: newRevealed };
    }
    case "SET_PRIORITY": {
      const newRevealed = new Set(state.revealedCards);
      state.caseFile.cards.forEach(c => newRevealed.add(c.id));
      return { ...state, priority: action.priority, phase: "board", revealedCards: newRevealed };
    }
    case "REVEAL_CARD": {
      const newSet = new Set(state.revealedCards);
      newSet.add(action.cardId);
      return { ...state, revealedCards: newSet };
    }
    case "REVEAL_CONNECTION": {
      const newSet = new Set(state.revealedConnections);
      newSet.add(action.connId);
      return { ...state, revealedConnections: newSet };
    }
    case "COLLECT_FRAGMENT": {
      const newSet = new Set(state.collectedFragments);
      newSet.add(action.fragId);
      return { ...state, collectedFragments: newSet };
    }
    case "SELECT_CARD":
      return { ...state, selectedCardId: action.cardId };
    case "ADD_SCORE":
      return {
        ...state,
        score: state.score + action.event.points,
        scoreLog: [...state.scoreLog, action.event],
        profile: { ...state.profile, score: state.profile.score + action.event.points, rank: getRank(state.profile.score + action.event.points).title },
      };
    case "SET_PHASE":
      return { ...state, phase: action.phase };
    case "SET_CELEBRATION":
      return { ...state, celebration: action.level };
    case "SET_REDUCED_MOTION":
      return { ...state, reducedMotion: action.enabled };
    case "COMPLETE_CASE":
      return {
        ...state,
        phase: "reveal",
        finalArchetype: action.archetype,
        finalArtifact: action.artifact,
        profile: {
          ...state.profile,
          casesSolved: state.profile.casesSolved + 1,
          archetypesFound: [...state.profile.archetypesFound, action.archetype.id],
          artifactCollection: [...state.profile.artifactCollection, action.artifact.id],
        },
      };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

interface TrailContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  choosePath: (p: InvestigationPath) => void;
  chooseTheory: (t: TheoryChoice) => void;
  choosePriority: (p: PriorityChoice) => void;
  revealCard: (id: string) => void;
  makeConnection: (connId: string) => void;
  selectCard: (id: string | null) => void;
  solveCase: () => void;
  resetGame: () => void;
}

const TrailContext = createContext<TrailContextValue | null>(null);

export function TrailProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const choosePath = useCallback((p: InvestigationPath) => {
    dispatch({ type: "SET_PATH", path: p });
    dispatch({ type: "ADD_SCORE", event: { type: "clue_found", points: SCORE_VALUES.clue_found, label: "Investigation started" } });
  }, []);

  const chooseTheory = useCallback((t: TheoryChoice) => {
    dispatch({ type: "SET_THEORY", theory: t });
    dispatch({ type: "ADD_SCORE", event: { type: "clue_found", points: SCORE_VALUES.clue_found, label: "Theory formed" } });
  }, []);

  const choosePriority = useCallback((p: PriorityChoice) => {
    dispatch({ type: "SET_PRIORITY", priority: p });
    dispatch({ type: "ADD_SCORE", event: { type: "hidden_path", points: SCORE_VALUES.hidden_path, label: "Full board unlocked" } });
  }, []);

  const revealCard = useCallback((id: string) => {
    if (!state.revealedCards.has(id)) {
      dispatch({ type: "REVEAL_CARD", cardId: id });
      dispatch({ type: "ADD_SCORE", event: { type: "clue_found", points: SCORE_VALUES.clue_found, label: "Clue uncovered" } });
    }
  }, [state.revealedCards]);

  const makeConnection = useCallback((connId: string) => {
    if (!state.revealedConnections.has(connId)) {
      dispatch({ type: "REVEAL_CONNECTION", connId });
      dispatch({ type: "ADD_SCORE", event: { type: "connection_made", points: SCORE_VALUES.connection_made, label: "Connection confirmed" } });

      // Check if this connection reveals a fragment
      const conn = state.caseFile.connections.find(c => c.id === connId);
      if (conn?.type === "wavy" || conn?.type === "double") {
        const unCollected = state.caseFile.fragments.find(f => !state.collectedFragments.has(f.id));
        if (unCollected) {
          dispatch({ type: "COLLECT_FRAGMENT", fragId: unCollected.id });
        }
      }
    }
  }, [state.revealedConnections, state.caseFile, state.collectedFragments]);

  const selectCard = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_CARD", cardId: id });
  }, []);

  const solveCase = useCallback(() => {
    // Determine archetype based on path + theory
    const archetypeMap: Record<string, string> = {
      money: "arch-country",
      workers: "arch-snack",
      image: "arch-mission",
      executives: "arch-shadow",
    };
    const archId = archetypeMap[state.path || "money"];
    const archetype = state.caseFile.archetypes.find(a => a.id === archId)!;
    const artifact = state.caseFile.artifacts.find(a => a.archetypeId === archId)!;

    dispatch({ type: "ADD_SCORE", event: { type: "case_solved", points: SCORE_VALUES.case_solved, label: "Case closed" } });
    dispatch({ type: "COMPLETE_CASE", archetype, artifact });
  }, [state.path, state.caseFile]);

  const resetGame = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <TrailContext.Provider value={{ state, dispatch, choosePath, chooseTheory, choosePriority, revealCard, makeConnection, selectCard, solveCase, resetGame }}>
      {children}
    </TrailContext.Provider>
  );
}

export function useTrail() {
  const ctx = useContext(TrailContext);
  if (!ctx) throw new Error("useTrail must be used within TrailProvider");
  return ctx;
}
