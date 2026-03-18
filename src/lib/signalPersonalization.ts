/**
 * Signal Personalization Engine — Logic Bible V8.0
 * 
 * Maps the 6 canonical signal categories to user Work Profile dials,
 * selects top signals for job cards, and interprets mixed scores.
 */

import { WorkProfile, getStoredWorkProfile } from "@/components/WorkProfileQuiz";

// ── Signal category → UI statement mapping (Logic Bible V8.0 tables) ──

export type SignalLevel = "high" | "medium" | "low" | "not_disclosed";

export interface CanonicalSignal {
  signal_category: string;
  value_normalized: string;
  direction: string;
  summary: string;
  confidence_level: string;
  scan_timestamp: string;
  ui_statement?: string;
}

const UI_STATEMENTS: Record<string, Record<string, string>> = {
  compensation_transparency: {
    high: "Salary range provided",
    medium: "Compensation unclear",
    low: "Compensation not listed",
    not_disclosed: "Compensation not listed",
  },
  hiring_activity: {
    high: "Active hiring across roles",
    medium: "Hiring activity mixed",
    low: "Role reposted multiple times",
    not_disclosed: "No hiring data",
  },
  workforce_stability: {
    high: "Workforce appears stable",
    medium: "Stability data limited",
    low: "Recent layoffs reported",
    not_disclosed: "Stability data limited",
  },
  company_behavior: {
    high: "Federal contractor",
    medium: "Limited public activity data",
    low: "No public activity data found",
    not_disclosed: "No public activity data found",
  },
  innovation_activity: {
    high: "Growth signals present",
    medium: "Moderate innovation signals",
    low: "Limited growth activity",
    not_disclosed: "Limited growth activity",
  },
  public_sentiment: {
    high: "Employee sentiment trending positive",
    medium: "Employee sentiment mixed",
    low: "Recent employee concerns reported",
    not_disclosed: "No sentiment data",
  },
};

/** Get the Bible-compliant short UI statement for a signal */
export function getUiStatement(category: string, valueNormalized: string): string {
  return UI_STATEMENTS[category]?.[valueNormalized] || "Data unavailable";
}

// ── Dial-to-category mapping (Logic Bible V8.0 Part 2) ──

/** Maps user Work Profile priorities/sliders to signal categories */
const PRIORITY_TO_CATEGORY: Record<string, string> = {
  "Higher pay": "compensation_transparency",
  "Below-market compensation": "compensation_transparency",
  "Stability": "workforce_stability",
  "Frequent layoffs or instability": "workforce_stability",
  "Clear growth and advancement paths": "innovation_activity",
  "Limited growth opportunities": "innovation_activity",
  "Respectful team environment": "public_sentiment",
  "High turnover or negative culture signals": "public_sentiment",
  "Clear and consistent leadership": "company_behavior",
  "Transparent communication": "company_behavior",
};

const SLIDER_TO_CATEGORY: Record<string, string> = {
  stable_dynamic: "workforce_stability",
  steady_fastmoving: "innovation_activity",
  open_needtoknow: "company_behavior",
};

/** Compute user weight (0-100) for each signal category based on Work Profile */
export function getCategoryWeights(profile: WorkProfile | null): Record<string, number> {
  const weights: Record<string, number> = {
    compensation_transparency: 50,
    hiring_activity: 50,
    workforce_stability: 50,
    company_behavior: 50,
    innovation_activity: 50,
    public_sentiment: 50,
  };

  if (!profile) return weights;

  // Boost from priorities
  for (const p of profile.priorities) {
    const cat = PRIORITY_TO_CATEGORY[p];
    if (cat) weights[cat] = Math.min(100, weights[cat] + 25);
  }

  // Boost from avoidances
  for (const a of profile.avoids) {
    const cat = PRIORITY_TO_CATEGORY[a];
    if (cat) weights[cat] = Math.min(100, weights[cat] + 20);
  }

  // Boost from sliders (extreme positions = strong signal)
  for (const [key, val] of Object.entries(profile.sliders)) {
    const cat = SLIDER_TO_CATEGORY[key];
    if (cat) {
      const extremity = Math.abs(val - 50);
      if (extremity > 20) {
        weights[cat] = Math.min(100, weights[cat] + Math.round(extremity * 0.5));
      }
    }
  }

  return weights;
}

/** Get top 1-3 personalized signal statements for a job card */
export function getTopSignalsForJob(
  companySignals: CanonicalSignal[],
  profile: WorkProfile | null,
  maxSignals = 3
): { statement: string; category: string; level: SignalLevel }[] {
  if (!companySignals || companySignals.length === 0) return [];

  const weights = getCategoryWeights(profile);

  const ranked = companySignals
    .map(s => ({
      statement: s.ui_statement || getUiStatement(s.signal_category, s.value_normalized),
      category: s.signal_category,
      level: s.value_normalized as SignalLevel,
      weight: weights[s.signal_category] || 50,
      // Boost signals that are non-neutral (high/low) since they carry more info
      importance: s.value_normalized === "high" || s.value_normalized === "low" ? 10 : 0,
    }))
    .sort((a, b) => (b.weight + b.importance) - (a.weight + a.importance))
    .slice(0, maxSignals);

  return ranked.map(r => ({
    statement: r.statement,
    category: r.category,
    level: r.level,
  }));
}

// ── Mixed-Score Personalization Rule (Logic Bible V8.0) ──

const CATEGORY_PRIORITY_LABELS: Record<string, string> = {
  compensation_transparency: "pay clarity",
  hiring_activity: "hiring transparency",
  workforce_stability: "stability",
  company_behavior: "company visibility",
  innovation_activity: "growth potential",
  public_sentiment: "work culture",
};

export interface MixedSignalInterpretation {
  isRisk: boolean;
  advisory: string;
}

/** Interpret mixed scores: if user dial >70%, treat as risk */
export function interpretMixedSignal(
  signalCategory: string,
  valueNormalized: string,
  profile: WorkProfile | null
): MixedSignalInterpretation | null {
  if (valueNormalized !== "medium") return null;

  const weights = getCategoryWeights(profile);
  const weight = weights[signalCategory] || 50;
  const label = CATEGORY_PRIORITY_LABELS[signalCategory] || signalCategory;

  if (weight > 70) {
    return {
      isRisk: true,
      advisory: `This signal is mixed, and ${label} matters to you — consider asking directly.`,
    };
  }

  return {
    isRisk: false,
    advisory: `Mixed signal on ${label} — may warrant further research.`,
  };
}

// ── "Before You Sign" signal generation ──

export interface BeforeYouSignItem {
  type: "positive" | "warning" | "neutral";
  label: string;
  detail: string;
}

export function generateBeforeYouSignItems(
  signals: CanonicalSignal[],
  profile: WorkProfile | null,
  job?: { salary_range?: string | null }
): BeforeYouSignItem[] {
  const items: BeforeYouSignItem[] = [];

  for (const signal of signals) {
    const statement = signal.ui_statement || getUiStatement(signal.signal_category, signal.value_normalized);
    const mixed = interpretMixedSignal(signal.signal_category, signal.value_normalized, profile);

    if (signal.value_normalized === "high") {
      items.push({ type: "positive", label: statement, detail: signal.summary });
    } else if (signal.value_normalized === "low") {
      items.push({ type: "warning", label: statement, detail: signal.summary });
    } else if (mixed?.isRisk) {
      items.push({ type: "warning", label: statement, detail: mixed.advisory });
    } else if (signal.value_normalized === "medium") {
      items.push({ type: "neutral", label: statement, detail: signal.summary });
    }
  }

  // Explicit missing-data callouts
  if (job && !job.salary_range) {
    const hasCompSignal = signals.some(s => s.signal_category === "compensation_transparency");
    if (!hasCompSignal) {
      items.push({ type: "warning", label: "Salary range not listed", detail: "No compensation data has been disclosed for this role." });
    }
  }

  return items;
}

// ── "What This Could Mean For You" dual-framing ──

export interface DualFraming {
  category: string;
  cautionary: string;
  neutral: string;
}

export function generateDualFramings(
  signals: CanonicalSignal[],
  profile: WorkProfile | null
): DualFraming[] {
  const weights = getCategoryWeights(profile);
  const framings: DualFraming[] = [];

  for (const signal of signals) {
    const cat = signal.signal_category;
    const label = CATEGORY_PRIORITY_LABELS[cat] || cat;
    const w = weights[cat] || 50;

    if (w < 40) continue; // Skip categories user doesn't care about

    const framing = DUAL_FRAMING_TEMPLATES[cat]?.[signal.value_normalized];
    if (framing) {
      framings.push({ category: cat, ...framing });
    }
  }

  return framings.sort((a, b) => (weights[b.category] || 0) - (weights[a.category] || 0)).slice(0, 4);
}

const DUAL_FRAMING_TEMPLATES: Record<string, Record<string, { cautionary: string; neutral: string }>> = {
  compensation_transparency: {
    high: {
      cautionary: "Salary disclosed — but verify total compensation (equity, bonuses) during interviews.",
      neutral: "Salary range is public, which lets you assess fit before investing time.",
    },
    medium: {
      cautionary: "If pay clarity matters → ask about compensation in the first interview.",
      neutral: "Some compensation data exists but may be incomplete.",
    },
    low: {
      cautionary: "No salary posted — ask about compensation early in the process.",
      neutral: "Many employers don't post salaries; this alone isn't a red flag.",
    },
  },
  workforce_stability: {
    high: {
      cautionary: "Stable workforce — but check for recent leadership changes.",
      neutral: "If stability matters → the workforce signal is a positive indicator.",
    },
    medium: {
      cautionary: "Mixed stability data — ask about team tenure during interviews.",
      neutral: "Limited data doesn't necessarily indicate instability.",
    },
    low: {
      cautionary: "Recent layoffs detected — ask about the affected teams and timeline.",
      neutral: "Layoffs may be restructuring, not necessarily decline.",
    },
  },
  innovation_activity: {
    high: {
      cautionary: "Active innovation — but rapid growth can mean shifting priorities.",
      neutral: "If growth matters → patent and product signals look strong.",
    },
    medium: {
      cautionary: "If growth matters → limited innovation data means dig deeper before deciding.",
      neutral: "Moderate signals — company may be in a steady phase.",
    },
    low: {
      cautionary: "Limited growth activity — ask about R&D investment and product roadmap.",
      neutral: "Not all valuable companies prioritize patent filing.",
    },
  },
  public_sentiment: {
    high: {
      cautionary: "Positive reviews — but check for review patterns and recency.",
      neutral: "Employee sentiment trends positive across sources.",
    },
    medium: {
      cautionary: "Mixed sentiment — look for specific themes in recent reviews.",
      neutral: "Mixed reviews are normal; focus on themes relevant to your role.",
    },
    low: {
      cautionary: "Declining sentiment detected — ask about recent culture changes.",
      neutral: "Negative reviews may reflect a specific team, not the whole company.",
    },
  },
  company_behavior: {
    high: {
      cautionary: "Significant public footprint — research specific contracts or lobbying.",
      neutral: "Active in public policy — traceable and on the record.",
    },
    medium: {
      cautionary: "Partial public data — some areas lack transparency.",
      neutral: "Limited public records don't necessarily indicate problems.",
    },
    low: {
      cautionary: "No public activity detected — may be too small or too opaque.",
      neutral: "Many private companies have limited public footprints.",
    },
  },
  hiring_activity: {
    high: {
      cautionary: "High hiring volume — ask about team structure and onboarding.",
      neutral: "Active hiring across multiple roles signals growth.",
    },
    medium: {
      cautionary: "Hiring has slowed — ask about current headcount plans.",
      neutral: "Moderate hiring pace is typical for established companies.",
    },
    low: {
      cautionary: "Repeated reposts detected — confirm this role is actively being filled.",
      neutral: "Low hiring volume may reflect a stable, mature organization.",
    },
  },
};

// ── "Why This Is Ranked For You" explanation ──

export function generateRankingExplanation(
  signals: CanonicalSignal[],
  profile: WorkProfile | null,
  matchScore?: number
): string {
  if (!profile) {
    return "Set up your Work Profile to see personalized ranking explanations.";
  }

  const weights = getCategoryWeights(profile);
  const topCategories = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  const parts: string[] = [];

  for (const [cat] of topCategories) {
    const signal = signals.find(s => s.signal_category === cat);
    if (!signal) continue;
    const label = CATEGORY_PRIORITY_LABELS[cat];
    const level = signal.value_normalized;

    if (level === "high") {
      parts.push(`strong match on ${label}`);
    } else if (level === "medium") {
      parts.push(`mixed signal on ${label}`);
    } else if (level === "low") {
      parts.push(`lower match on ${label} — this matters to you based on your settings`);
    }
  }

  if (parts.length === 0) return "Ranked based on available signal data.";

  const sentence = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  if (parts.length === 1) return `${sentence}.`;
  return `${sentence}. ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}.`;
}
