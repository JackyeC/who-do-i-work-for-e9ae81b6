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
    label: "Who Do I Work For?",
    shortLabel: "Influence",
    description: "Corporate political influence, PAC activity, lobbying, and government ties.",
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
      "worker-sentiment",
      "ai-hiring",
      "hiring-transparency",
      "worker-benefits",
      "ai-accountability",
      "compensation",
    ],
  },
  {
    id: "safety",
    label: "Psychological Safety at Work",
    shortLabel: "Safety",
    description: "Workplace equity, hiring technology, benefits, and accountability signals.",
    modulePriority: [
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
    shortLabel: "Values",
    description: "Whether public messaging matches financial and workplace behavior.",
    modulePriority: [
      "public-stances",
      "intelligence-scores",
      "compensation",
      "worker-benefits",
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
    ],
  },
];

export function getLens(id: LensId): LensDefinition {
  return LENSES.find((l) => l.id === id) || LENSES[0];
}
