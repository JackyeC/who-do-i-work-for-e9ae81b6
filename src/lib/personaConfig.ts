/**
 * Persona-based report configuration
 * Defines which sections each audience sees and in what order
 */

export type PersonaId = "job_seeker" | "employee" | "recruiter" | "hr_tech_buyer" | "journalist";

export interface PersonaConfig {
  id: PersonaId;
  label: string;
  shortLabel: string;
  icon: string; // lucide icon name
  description: string;
  question: string; // What question does this persona answer?
  primarySections: string[];
  secondarySections: string[];
  hiddenSections: string[];
  primaryScores: string[];
}

export const PERSONAS: PersonaConfig[] = [
  {
    id: "job_seeker",
    label: "Job Seeker",
    shortLabel: "Seeker",
    icon: "Briefcase",
    description: "Should I work here? Career risk, recruiting experience, and offer intelligence.",
    question: "Should I work here?",
    primarySections: ["cbi", "career_risk", "recruiter_reality", "promotion_velocity", "workforce_stability", "compensation", "values"],
    secondarySections: ["governance", "influence", "narrative_power", "public_records"],
    hiddenSections: ["gtm"],
    primaryScores: ["cbi", "career_risk", "recruiter_reality", "promotion_velocity", "layoff_probability"],
  },
  {
    id: "employee",
    label: "Employee",
    shortLabel: "Employee",
    icon: "User",
    description: "Can I grow here? Career mobility, promotion velocity, and long-term trajectory.",
    question: "Can I grow here?",
    primarySections: ["cbi", "promotion_velocity", "workforce_stability", "compensation", "workforce_intel", "governance"],
    secondarySections: ["career_risk", "values", "influence", "narrative_power", "public_records"],
    hiddenSections: ["recruiter_reality", "gtm"],
    primaryScores: ["cbi", "promotion_velocity", "career_risk", "layoff_probability"],
  },
  {
    id: "recruiter",
    label: "Recruiter",
    shortLabel: "Recruiter",
    icon: "Users",
    description: "Is our hiring process working? Recruiting transparency and candidate experience signals.",
    question: "Is our hiring process working?",
    primarySections: ["recruiter_reality", "cbi", "gtm", "workforce_intel", "promotion_velocity"],
    secondarySections: ["compensation", "workforce_stability", "narrative_power"],
    hiddenSections: ["influence", "values", "public_records"],
    primaryScores: ["recruiter_reality", "cbi", "gtm", "promotion_velocity"],
  },
  {
    id: "hr_tech_buyer",
    label: "HR Tech Buyer",
    shortLabel: "HR Tech",
    icon: "Brain",
    description: "Can this tool be trusted? AI bias transparency, audit disclosure, and compliance signals.",
    question: "Can this tool be trusted?",
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
    description: "What patterns are emerging? Investigative insight, industry-level trends, and data patterns.",
    question: "What patterns are emerging?",
    primarySections: ["cbi", "influence", "narrative_power", "public_records", "governance", "workforce_stability", "compensation", "workforce_intel", "promotion_velocity", "gtm", "values"],
    secondarySections: ["recruiter_reality", "career_risk"],
    hiddenSections: [],
    primaryScores: ["cbi", "career_risk", "gtm", "promotion_velocity", "layoff_probability", "recruiter_reality"],
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
  return [...config.primarySections, ...config.secondarySections];
}
