/**
 * dopamine-engine.ts — Rank tiers, badge definitions, mission rotation,
 * and readiness scoring for the WDIWF dashboard dopamine layer.
 *
 * Design principles (from WhoDoI Trail game design):
 *   - Identity-rich rewards, not arcade points
 *   - Earned, collectible, socially shareable
 *   - Short-term hits + longer-term progression
 *   - "The Devil Wears Prada" editorial polish
 */

/* ═══════════════════════════════════════════════════════════
   INVESTIGATOR RANKS
   Derived from civic impact counts (signals + tracked + actions).
   ═══════════════════════════════════════════════════════════ */

export interface RankTier {
  id: string;
  label: string;
  /** Minimum total impact points to reach this rank */
  threshold: number;
  /** Short tagline shown on rank-up */
  tagline: string;
  /** Color class for the rank badge */
  color: string;
  /** Background color class */
  bg: string;
  /** Border color class */
  border: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    id: "rookie",
    label: "Rookie",
    threshold: 0,
    tagline: "Just getting started",
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border/40",
  },
  {
    id: "investigator",
    label: "Investigator",
    threshold: 3,
    tagline: "You're asking the right questions",
    color: "text-civic-blue",
    bg: "bg-civic-blue/10",
    border: "border-civic-blue/25",
  },
  {
    id: "analyst",
    label: "Analyst",
    threshold: 10,
    tagline: "Few candidates go this deep",
    color: "text-civic-green",
    bg: "bg-civic-green/10",
    border: "border-civic-green/25",
  },
  {
    id: "watchdog",
    label: "Watchdog",
    threshold: 25,
    tagline: "You see what others miss",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/25",
  },
  {
    id: "pattern-hunter",
    label: "Pattern Hunter",
    threshold: 50,
    tagline: "Operating at analyst depth",
    color: "text-civic-gold",
    bg: "bg-civic-gold/10",
    border: "border-civic-gold/25",
  },
  {
    id: "whistleblower",
    label: "Whistleblower",
    threshold: 100,
    tagline: "The receipts speak for themselves",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/25",
  },
];

export function getRank(totalImpact: number): RankTier {
  let rank = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (totalImpact >= tier.threshold) rank = tier;
  }
  return rank;
}

export function getNextRank(totalImpact: number): RankTier | null {
  for (const tier of RANK_TIERS) {
    if (totalImpact < tier.threshold) return tier;
  }
  return null;
}

export function getRankProgress(totalImpact: number): number {
  const current = getRank(totalImpact);
  const next = getNextRank(totalImpact);
  if (!next) return 100;
  const range = next.threshold - current.threshold;
  const progress = totalImpact - current.threshold;
  return Math.min(100, Math.round((progress / range) * 100));
}

/* ═══════════════════════════════════════════════════════════
   RECEIPT BADGES
   Unlockable badges earned for specific actions.
   Each badge has a check function that runs against user data.
   ═══════════════════════════════════════════════════════════ */

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  /** Icon identifier (maps to lucide icon in component) */
  icon: string;
  /** Color class */
  color: string;
  bg: string;
  /** Category for grouping */
  category: "intelligence" | "career" | "community" | "mastery";
  /** Rarity for visual treatment */
  rarity: "common" | "uncommon" | "rare" | "legendary";
}

export const BADGES: BadgeDef[] = [
  // ── Intelligence badges ──
  {
    id: "first-signal",
    label: "First Signal",
    description: "Surfaced your first employer alert",
    icon: "Bell",
    color: "text-civic-blue",
    bg: "bg-civic-blue/10",
    category: "intelligence",
    rarity: "common",
  },
  {
    id: "five-signals",
    label: "Signal Scanner",
    description: "5 employer signals uncovered",
    icon: "Radio",
    color: "text-civic-blue",
    bg: "bg-civic-blue/10",
    category: "intelligence",
    rarity: "uncommon",
  },
  {
    id: "watchlist-started",
    label: "Eyes Open",
    description: "Started tracking your first company",
    icon: "Eye",
    color: "text-civic-green",
    bg: "bg-civic-green/10",
    category: "intelligence",
    rarity: "common",
  },
  {
    id: "watchlist-five",
    label: "Pattern Watcher",
    description: "5 companies on your watchlist",
    icon: "Shield",
    color: "text-civic-green",
    bg: "bg-civic-green/10",
    category: "intelligence",
    rarity: "uncommon",
  },
  {
    id: "ten-signals",
    label: "Deep Digger",
    description: "10 employer signals uncovered",
    icon: "Search",
    color: "text-primary",
    bg: "bg-primary/10",
    category: "intelligence",
    rarity: "rare",
  },
  {
    id: "receipt-collector",
    label: "Receipt Collector",
    description: "25 signals — your diligence trail is rare",
    icon: "FileText",
    color: "text-civic-gold",
    bg: "bg-civic-gold/10",
    category: "intelligence",
    rarity: "legendary",
  },

  // ── Career badges ──
  {
    id: "values-set",
    label: "Know Thyself",
    description: "Completed your values profile",
    icon: "Heart",
    color: "text-destructive",
    bg: "bg-destructive/10",
    category: "career",
    rarity: "common",
  },
  {
    id: "first-application",
    label: "In Motion",
    description: "Submitted your first tracked application",
    icon: "Send",
    color: "text-civic-blue",
    bg: "bg-civic-blue/10",
    category: "career",
    rarity: "common",
  },
  {
    id: "five-applications",
    label: "Momentum",
    description: "5 applications in motion",
    icon: "TrendingUp",
    color: "text-civic-green",
    bg: "bg-civic-green/10",
    category: "career",
    rarity: "uncommon",
  },
  {
    id: "resume-uploaded",
    label: "Armed & Ready",
    description: "Uploaded your resume to the arsenal",
    icon: "FileCheck",
    color: "text-civic-blue",
    bg: "bg-civic-blue/10",
    category: "career",
    rarity: "common",
  },
  {
    id: "offer-checked",
    label: "Eyes Wide Open",
    description: "Ran your first Offer Clarity Check",
    icon: "CheckCircle",
    color: "text-civic-green",
    bg: "bg-civic-green/10",
    category: "career",
    rarity: "uncommon",
  },

  // ── Mastery badges ──
  {
    id: "streak-7",
    label: "Consistent",
    description: "7-day login streak",
    icon: "Flame",
    color: "text-civic-gold",
    bg: "bg-civic-gold/10",
    category: "mastery",
    rarity: "uncommon",
  },
  {
    id: "streak-30",
    label: "On Fire",
    description: "30-day login streak — unstoppable",
    icon: "Flame",
    color: "text-destructive",
    bg: "bg-destructive/10",
    category: "mastery",
    rarity: "legendary",
  },
  {
    id: "quiz-taken",
    label: "DNA Decoded",
    description: "Completed the Workplace DNA quiz",
    icon: "Dna",
    color: "text-primary",
    bg: "bg-primary/10",
    category: "mastery",
    rarity: "common",
  },
  {
    id: "power-user",
    label: "Power User",
    description: "50+ intelligence actions taken",
    icon: "Zap",
    color: "text-civic-gold",
    bg: "bg-civic-gold/10",
    category: "mastery",
    rarity: "rare",
  },
];

/** Evaluate which badges a user has earned based on their data. */
export interface BadgeInput {
  signalsUncovered: number;
  employersTracked: number;
  intelligenceActions: number;
  applications: number;
  hasValuesProfile: boolean;
  hasResume: boolean;
  hasTakenQuiz: boolean;
  streakDays: number;
  /** Set of any additional badge IDs already manually awarded */
  manualBadges?: Set<string>;
}

export function evaluateBadges(input: BadgeInput): string[] {
  const earned: string[] = [];

  // Intelligence
  if (input.signalsUncovered >= 1) earned.push("first-signal");
  if (input.signalsUncovered >= 5) earned.push("five-signals");
  if (input.signalsUncovered >= 10) earned.push("ten-signals");
  if (input.signalsUncovered >= 25) earned.push("receipt-collector");
  if (input.employersTracked >= 1) earned.push("watchlist-started");
  if (input.employersTracked >= 5) earned.push("watchlist-five");

  // Career
  if (input.hasValuesProfile) earned.push("values-set");
  if (input.applications >= 1) earned.push("first-application");
  if (input.applications >= 5) earned.push("five-applications");
  if (input.hasResume) earned.push("resume-uploaded");

  // Mastery
  if (input.streakDays >= 7) earned.push("streak-7");
  if (input.streakDays >= 30) earned.push("streak-30");
  if (input.hasTakenQuiz) earned.push("quiz-taken");
  if (input.intelligenceActions >= 50) earned.push("power-user");

  // Manual overrides
  if (input.manualBadges) {
    input.manualBadges.forEach((id) => {
      if (!earned.includes(id)) earned.push(id);
    });
  }

  return earned;
}

/* ═══════════════════════════════════════════════════════════
   DAILY MISSIONS
   Rotating daily challenge that gives users one thing to do.
   ═══════════════════════════════════════════════════════════ */

export interface DailyMission {
  id: string;
  label: string;
  description: string;
  action: string;
  /** Tab or route to navigate to */
  target: string;
  /** Whether target is a dashboard tab or a route */
  targetType: "tab" | "route";
  icon: string;
  /** XP reward for completing */
  xp: number;
}

const MISSIONS: DailyMission[] = [
  {
    id: "track-company",
    label: "Add to your watchlist",
    description: "Track a new company and we'll monitor it for you",
    action: "Search & track",
    target: "/search",
    targetType: "route",
    icon: "Eye",
    xp: 15,
  },
  {
    id: "run-dossier",
    label: "Pull a dossier",
    description: "Research any employer — see what the public record shows",
    action: "Start a dossier",
    target: "/search",
    targetType: "route",
    icon: "FileText",
    xp: 20,
  },
  {
    id: "check-alerts",
    label: "Review your alerts",
    description: "See what changed in the companies you're watching",
    action: "View alerts",
    target: "alerts",
    targetType: "tab",
    icon: "Bell",
    xp: 10,
  },
  {
    id: "update-values",
    label: "Refine your values",
    description: "Make sure your values profile reflects what matters now",
    action: "Open values",
    target: "values",
    targetType: "tab",
    icon: "Heart",
    xp: 15,
  },
  {
    id: "mock-interview",
    label: "Practice an interview",
    description: "Run a mock interview and sharpen your story",
    action: "Start practice",
    target: "mock-interview",
    targetType: "tab",
    icon: "Mic",
    xp: 25,
  },
  {
    id: "offer-check",
    label: "Run an offer check",
    description: "Got an offer? See what the receipts say about that company",
    action: "Check an offer",
    target: "/offer-check",
    targetType: "route",
    icon: "Shield",
    xp: 25,
  },
  {
    id: "browse-jobs",
    label: "Explore the board",
    description: "Browse integrity-screened roles that match your values",
    action: "View jobs",
    target: "jobs",
    targetType: "tab",
    icon: "Briefcase",
    xp: 10,
  },
];

/** Get today's mission based on day-of-year rotation. */
export function getTodaysMission(): DailyMission {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((+now - +start) / 86400000);
  return MISSIONS[dayOfYear % MISSIONS.length];
}

/** Check if today's mission was completed (localStorage). */
export function isMissionCompleted(): boolean {
  const key = `wdiwf_mission_${new Date().toISOString().slice(0, 10)}`;
  return localStorage.getItem(key) === "done";
}

/** Mark today's mission as completed. */
export function completeMission(): void {
  const key = `wdiwf_mission_${new Date().toISOString().slice(0, 10)}`;
  localStorage.setItem(key, "done");
}

/* ═══════════════════════════════════════════════════════════
   CAREER READINESS SCORE
   Percentage of key profile items completed.
   ═══════════════════════════════════════════════════════════ */

export interface ReadinessInput {
  hasResume: boolean;
  hasValuesProfile: boolean;
  hasTakenQuiz: boolean;
  hasTrackedCompany: boolean;
  hasApplication: boolean;
  hasAlerts: boolean;
}

export interface ReadinessItem {
  label: string;
  done: boolean;
  action: string;
  target: string;
  targetType: "tab" | "route";
}

export function evaluateReadiness(input: ReadinessInput): {
  score: number;
  items: ReadinessItem[];
} {
  const items: ReadinessItem[] = [
    {
      label: "Upload resume",
      done: input.hasResume,
      action: "Upload",
      target: "apply-kit",
      targetType: "tab",
    },
    {
      label: "Set values profile",
      done: input.hasValuesProfile,
      action: "Set values",
      target: "values",
      targetType: "tab",
    },
    {
      label: "Take Work DNA quiz",
      done: input.hasTakenQuiz,
      action: "Take quiz",
      target: "/quiz",
      targetType: "route",
    },
    {
      label: "Track a company",
      done: input.hasTrackedCompany,
      action: "Search",
      target: "/search",
      targetType: "route",
    },
    {
      label: "Submit an application",
      done: input.hasApplication,
      action: "Browse jobs",
      target: "jobs",
      targetType: "tab",
    },
    {
      label: "Set up signal alerts",
      done: input.hasAlerts,
      action: "Configure",
      target: "alerts",
      targetType: "tab",
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const score = Math.round((completed / items.length) * 100);

  return { score, items };
}

/* ═══════════════════════════════════════════════════════════
   RARITY VISUAL CONFIG
   ═══════════════════════════════════════════════════════════ */

export const RARITY_STYLES: Record<string, { ring: string; glow: string; label: string }> = {
  common: { ring: "ring-border/40", glow: "", label: "Common" },
  uncommon: { ring: "ring-civic-blue/40", glow: "", label: "Uncommon" },
  rare: { ring: "ring-civic-gold/50", glow: "shadow-[0_0_8px_rgba(240,192,64,0.15)]", label: "Rare" },
  legendary: {
    ring: "ring-civic-gold/60",
    glow: "shadow-[0_0_12px_rgba(240,192,64,0.25)]",
    label: "Legendary",
  },
};
