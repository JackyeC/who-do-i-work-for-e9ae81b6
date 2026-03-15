/**
 * Persona-based report configuration
 * Defines which sections each audience sees and in what order
 */

export type PersonaId = "job_seeker" | "employee" | "recruiter" | "hr_tech_buyer" | "journalist" | "employer";

export type PersonaAccessTier = "free" | "paid" | "freemium";

export interface PersonaBucket {
  id: string;
  title: string;
  subtitle: string;
  iconName: string; // lucide icon name
  sections: string[];
}

export interface PersonaConfig {
  id: PersonaId;
  label: string;
  shortLabel: string;
  icon: string; // lucide icon name
  description: string;
  question: string; // What question does this persona answer?
  accessTier: PersonaAccessTier;
  requiredPlan?: "candidate" | "professional"; // minimum plan for paid personas
  primarySections: string[];
  secondarySections: string[];
  hiddenSections: string[];
  primaryScores: string[];
  buckets?: PersonaBucket[]; // Grouped section view (optional)
}

export const PERSONAS: PersonaConfig[] = [
  {
    id: "job_seeker",
    label: "Job Seeker",
    shortLabel: "Seeker",
    icon: "Briefcase",
    description: "Should I work here? What a company really is — not what their careers page says.",
    question: "Should I work here?",
    accessTier: "free",
    primarySections: ["revenue_model", "leadership", "workforce_reality", "career_mobility", "ethical_footprint", "stability"],
    secondarySections: ["governance", "influence", "narrative_power", "public_records", "receipts_timeline"],
    hiddenSections: ["gtm"],
    primaryScores: ["cbi", "career_risk", "recruiter_reality", "promotion_velocity", "layoff_probability"],
    buckets: [
      {
        id: "money_model",
        title: "How the Company Makes Its Money",
        subtitle: "Revenue sources, government contracts, and business model incentives — because a company's money model tells you more than its mission statement.",
        iconName: "DollarSign",
        sections: ["influence"],
      },
      {
        id: "leadership_behavior",
        title: "Leadership Behavior & Track Record",
        subtitle: "Executive history, board composition, lawsuits, and crisis responses — leadership behavior predicts culture better than any HR document.",
        iconName: "Users",
        sections: ["governance"],
      },
      {
        id: "workforce_reality",
        title: "Workforce Reality vs Employer Branding",
        subtitle: "Sentiment patterns, transparency gaps, tenure signals, and diversity of leadership — when branding and workforce reality diverge, it shows up quickly.",
        iconName: "Eye",
        sections: ["workforce_intel", "compensation", "recruiter_reality"],
      },
      {
        id: "career_growth",
        title: "Career Mobility & Internal Growth",
        subtitle: "Promotion rates, leadership pipelines, internal mobility, and learning investment — a company that grows people tends to grow responsibly.",
        iconName: "TrendingUp",
        sections: ["promotion_velocity"],
      },
      {
        id: "ethical_footprint",
        title: "Ethical Footprint",
        subtitle: "Lawsuits, regulatory actions, political donations, labor practices, and social commitments vs actual spending — you don't need perfection, but patterns matter.",
        iconName: "Shield",
        sections: ["values", "public_records", "narrative_power"],
      },
      {
        id: "stability_health",
        title: "Stability & Business Health",
        subtitle: "Layoff history, WARN notices, leadership turnover, and market signals — even if a company aligns with your values, it still needs to survive.",
        iconName: "Activity",
        sections: ["workforce_stability"],
      },
    ],
  },
  {
    id: "employee",
    label: "Employee",
    shortLabel: "Employee",
    icon: "User",
    description: "Should I stay, move internally, or start looking? Power dynamics and future trajectory signals.",
    question: "Should I stay?",
    accessTier: "free",
    primarySections: ["promotion_velocity", "workforce_stability", "governance", "compensation", "workforce_intel", "values", "narrative_power", "public_records"],
    secondarySections: ["career_risk", "influence", "receipts_timeline"],
    hiddenSections: ["recruiter_reality", "gtm"],
    primaryScores: ["cbi", "promotion_velocity", "career_risk", "layoff_probability"],
    buckets: [
      {
        id: "promotion_velocity",
        title: "Promotion Velocity — Do People Actually Move Up?",
        subtitle: "How long people stay in roles, whether promotions come from inside or outside, and which paths actually work. This is one of the most powerful signals for retention.",
        iconName: "TrendingUp",
        sections: ["promotion_velocity"],
      },
      {
        id: "stability_risk",
        title: "Layoff & Stability Risk",
        subtitle: "Layoff history, WARN notices, revenue trends, hiring freezes, and leadership exits. Answering: is my job safe or should I start preparing?",
        iconName: "Activity",
        sections: ["workforce_stability"],
      },
      {
        id: "leadership_trust",
        title: "Leadership Trust Signals",
        subtitle: "Executive turnover, CEO tenure, board influence, crisis response. Are the people steering this company competent and honest?",
        iconName: "Users",
        sections: ["governance"],
      },
      {
        id: "compensation_trajectory",
        title: "Compensation & Pay Trajectory",
        subtitle: "How your salary compares to market, internal pay equity, and compensation transparency signals. Am I being fairly compensated for the value I'm creating?",
        iconName: "DollarSign",
        sections: ["compensation"],
      },
      {
        id: "internal_mobility",
        title: "Internal Mobility & Skill Growth",
        subtitle: "Learning investments, internal transfers, and workforce intelligence. Will this job make me more valuable in 3–5 years?",
        iconName: "TrendingUp",
        sections: ["workforce_intel"],
      },
      {
        id: "reputation",
        title: "Company Reputation in the Talent Market",
        subtitle: "Employer reputation trends, media coverage, narrative power, and alumni success. Does having this company on my resume open doors or close them?",
        iconName: "Eye",
        sections: ["narrative_power", "public_records"],
      },
      {
        id: "ethical_alignment",
        title: "Ethical Alignment",
        subtitle: "Political spending, lawsuits, regulatory actions, and social commitments vs actual spending. Am I proud to work here?",
        iconName: "Shield",
        sections: ["values", "influence"],
      },
    ],
  },
  {
    id: "recruiter",
    label: "Recruiter",
    shortLabel: "Recruiter",
    icon: "Users",
    description: "Can I successfully hire for this company? Hiring reality, talent brand, and search difficulty signals.",
    question: "Can I hire here?",
    accessTier: "paid",
    requiredPlan: "candidate",
    primarySections: ["recruiter_reality", "cbi", "gtm", "workforce_intel", "compensation", "promotion_velocity", "workforce_stability", "narrative_power"],
    secondarySections: [],
    hiddenSections: ["influence", "values", "public_records"],
    primaryScores: ["recruiter_reality", "cbi", "gtm", "promotion_velocity"],
    buckets: [
      {
        id: "recruiting_snapshot",
        title: "Recruiting Reality Snapshot",
        subtitle: "Recruiting difficulty, offer acceptance prediction, time-to-fill, and compensation positioning. Understand the hiring situation in 10 seconds.",
        iconName: "Activity",
        sections: ["recruiter_reality", "gtm"],
      },
      {
        id: "talent_brand",
        title: "Talent Brand Reality",
        subtitle: "Candidate sentiment, layoff impact, media reputation, and recruiter response rate signals. Will candidates trust this company?",
        iconName: "Eye",
        sections: ["workforce_intel", "narrative_power"],
      },
      {
        id: "hiring_manager_landscape",
        title: "Hiring Manager Landscape",
        subtitle: "Leadership turnover, manager tenure, team stability, and decision-making patterns. Where will hiring break down?",
        iconName: "Users",
        sections: ["governance"],
      },
      {
        id: "compensation_position",
        title: "Compensation Competitiveness",
        subtitle: "Base salary positioning, equity, bonus structure, and offer acceptance risk. Will offers actually land?",
        iconName: "DollarSign",
        sections: ["compensation"],
      },
      {
        id: "talent_flow",
        title: "Talent Flow & Internal Mobility",
        subtitle: "Where talent comes from, where it goes, promotion velocity, and internal transfer rates. Will hires actually stay?",
        iconName: "TrendingUp",
        sections: ["promotion_velocity"],
      },
      {
        id: "stability_signals",
        title: "Stability & Attrition Risk",
        subtitle: "Layoff history, WARN notices, hiring freezes, and workforce reduction signals. How stable is the hiring environment?",
        iconName: "Shield",
        sections: ["workforce_stability"],
      },
    ],
  },
  {
    id: "hr_tech_buyer",
    label: "HR Tech Buyer",
    shortLabel: "HR Tech",
    icon: "Brain",
    description: "Can this tool be trusted? AI bias transparency, audit disclosure, and compliance signals.",
    question: "Can this tool be trusted?",
    accessTier: "paid",
    requiredPlan: "candidate",
    primarySections: ["workforce_intel", "cbi", "compensation", "promotion_velocity"],
    secondarySections: ["workforce_stability", "governance"],
    hiddenSections: ["recruiter_reality", "gtm", "influence", "values", "narrative_power", "public_records"],
    primaryScores: ["cbi", "hr_tech_ethics"],
  },
  {
    id: "journalist",
    label: "Journalist / Analyst",
    shortLabel: "Analyst",
    icon: "FileText",
    description: "What is really happening inside and around this company? Power dynamics, controversies, and influence patterns.",
    question: "What is really happening here?",
    accessTier: "paid",
    requiredPlan: "professional",
    primarySections: ["cbi", "influence", "narrative_power", "public_records", "receipts_timeline", "governance", "workforce_stability", "compensation", "workforce_intel", "promotion_velocity", "gtm", "values"],
    secondarySections: ["recruiter_reality", "career_risk"],
    hiddenSections: [],
    primaryScores: ["cbi", "career_risk", "gtm", "promotion_velocity", "layoff_probability", "recruiter_reality"],
    buckets: [
      {
        id: "investigative_snapshot",
        title: "Investigative Snapshot",
        subtitle: "Influence score, controversy risk, political activity, layoff history, media attention, and transparency — the full investigative scorecard in 10 seconds.",
        iconName: "Search",
        sections: ["cbi"],
      },
      {
        id: "power_influence",
        title: "Power & Influence Network",
        subtitle: "Executives, board members, investors, political donations, lobbying activity, and industry organizations — who actually influences this company.",
        iconName: "Network",
        sections: ["governance", "influence"],
      },
      {
        id: "controversy_legal",
        title: "Controversy & Legal Signals",
        subtitle: "Major lawsuits, regulatory investigations, worker complaints, union activity, and ethics investigations — tracked with source documents.",
        iconName: "AlertTriangle",
        sections: ["public_records", "values"],
      },
      {
        id: "workforce_events",
        title: "Layoffs & Workforce Events",
        subtitle: "Layoff timeline, WARN notices, hiring freezes, executive departures, and workforce restructuring signals.",
        iconName: "Activity",
        sections: ["workforce_stability"],
      },
      {
        id: "media_narrative",
        title: "Media Narrative Analysis",
        subtitle: "Coverage trends, sentiment distribution, key topics, and narrative power signals — how the company controls and responds to its public story.",
        iconName: "Newspaper",
        sections: ["narrative_power"],
      },
      {
        id: "money_influence",
        title: "Money & Influence Signals",
        subtitle: "Political donations, PAC contributions, lobbying spending, trade groups, and policy influence — where the company sends money and why.",
        iconName: "DollarSign",
        sections: ["gtm"],
      },
      {
        id: "industry_position",
        title: "Industry Position & Compensation",
        subtitle: "Market position, compensation competitiveness, workforce intelligence, and promotion patterns — the company's standing in its market.",
        iconName: "BarChart3",
        sections: ["compensation", "workforce_intel", "promotion_velocity"],
      },
    ],
  },
  {
    id: "employer",
    label: "Employer",
    shortLabel: "Employer",
    icon: "Building2",
    description: "What does the talent market see about your company? Claim your profile and manage your employer brand.",
    question: "What do candidates see?",
    accessTier: "freemium",
    primarySections: ["cbi", "workforce_intel", "narrative_power", "compensation", "recruiter_reality", "workforce_stability"],
    secondarySections: ["governance", "values"],
    hiddenSections: ["influence", "public_records", "gtm"],
    primaryScores: ["cbi", "recruiter_reality"],
    buckets: [
      {
        id: "employer_snapshot",
        title: "Employer Brand Snapshot",
        subtitle: "What candidates and employees see when they research your company — scores, sentiment, and transparency signals.",
        iconName: "Eye",
        sections: ["cbi", "narrative_power"],
      },
      {
        id: "talent_perception",
        title: "Talent Market Perception",
        subtitle: "How your workforce data, compensation positioning, and hiring signals appear to the outside world.",
        iconName: "Users",
        sections: ["workforce_intel", "compensation"],
      },
      {
        id: "recruiting_readiness",
        title: "Recruiting Readiness",
        subtitle: "Your hiring funnel health, recruiter signals, and candidate experience indicators.",
        iconName: "Activity",
        sections: ["recruiter_reality"],
      },
      {
        id: "stability_reputation",
        title: "Stability & Reputation Signals",
        subtitle: "Layoff history, leadership stability, and governance signals that shape candidate confidence.",
        iconName: "Shield",
        sections: ["workforce_stability", "governance"],
      },
      {
        id: "values_alignment",
        title: "Values & Culture Alignment",
        subtitle: "How your public commitments, DEI signals, and ethical footprint are perceived by the talent market.",
        iconName: "Heart",
        sections: ["values"],
      },
    ],
  },
];

export function getPersonaConfig(id: PersonaId): PersonaConfig {
  return PERSONAS.find(p => p.id === id) || PERSONAS[0];
}

export function isSectionVisible(personaId: PersonaId, sectionKey: string): boolean {
  const config = getPersonaConfig(personaId);
  return !config.hiddenSections.includes(sectionKey);
}

export function isSectionPrimary(personaId: PersonaId, sectionKey: string): boolean {
  const config = getPersonaConfig(personaId);
  return config.primarySections.includes(sectionKey);
}

export function getSectionOrder(personaId: PersonaId): string[] {
  const config = getPersonaConfig(personaId);
  // If persona has buckets, flatten bucket sections + append secondary
  if (config.buckets) {
    const bucketSections = config.buckets.flatMap(b => b.sections);
    const remaining = config.secondarySections.filter(s => !bucketSections.includes(s));
    return [...bucketSections, ...remaining];
  }
  return [...config.primarySections, ...config.secondarySections];
}
