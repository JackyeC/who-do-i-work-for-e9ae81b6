export type LensId = "influence" | "safety" | "values";

export interface LensDefinition {
  id: LensId;
  label: string;
  shortLabel: string;
  description: string;
  /** Module keys in priority order for this lens */
  modulePriority: string[];
}

export const LENSES: LensDefinition[] = [
  {
    id: "influence",
    label: "Who Do We Work For?",
    shortLabel: "Employer Signals",
    description: "Policy influence signals, lobbying activity, government contracts, and economic relationships.",
    modulePriority: [
      "money-trail",
      "public-stances",
      "influence-network",
      "intelligence-scores",
      "government-roi",
      "roi-pipeline",
      "influence-chain",
      "agency-contracts",
      "ideology-flags",
      "social-monitor",
      "warn-tracker",
      "worker-sentiment",
      "ai-hiring",
      "hiring-transparency",
      "worker-benefits",
      "promotion-equity",
      "ai-accountability",
      "compensation",
      "talent-signals",
    ],
  },
  {
    id: "safety",
    label: "Workforce Stability",
    shortLabel: "Workforce",
    description: "Workforce signals including hiring technology, benefits, equity, and stability indicators.",
    modulePriority: [
      "talent-signals",
      "warn-tracker",
      "promotion-equity",
      "compensation",
      "ai-hiring",
      "hiring-transparency",
      "ai-accountability",
      "worker-benefits",
      "worker-sentiment",
      "ideology-flags",
      "public-stances",
      "intelligence-scores",
      "money-trail",
      "influence-network",
      "government-roi",
      "roi-pipeline",
      "influence-chain",
      "agency-contracts",
      "social-monitor",
    ],
  },
  {
    id: "values",
    label: "Values Alignment",
    shortLabel: "Alignment",
    description: "Whether employer messaging matches documented financial and workforce behavior.",
    modulePriority: [
      "public-stances",
      "intelligence-scores",
      "compensation",
      "worker-benefits",
      "promotion-equity",
      "warn-tracker",
      "ideology-flags",
      "social-monitor",
      "worker-sentiment",
      "money-trail",
      "influence-network",
      "ai-hiring",
      "hiring-transparency",
      "ai-accountability",
      "government-roi",
      "roi-pipeline",
      "influence-chain",
      "agency-contracts",
      "talent-signals",
    ],
  },
];

export function getLens(id: LensId): LensDefinition {
  return LENSES.find((l) => l.id === id) || LENSES[0];
}
