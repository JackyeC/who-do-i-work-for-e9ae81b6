import { useState, useCallback, useSyncExternalStore } from "react";

export type PersonaId =
  | "job_seeker" | "recruiter" | "executive" | "researcher"
  | "sales" | "marketing" | "investor" | "journalist" | "career_changer";

export type NepotismFlag = "high" | "medium" | "low";
export type TrustLevel = "skeptic" | "balanced" | "believer";

export interface PersonaState {
  persona: PersonaId | null;
  nepotismFlag: NepotismFlag | null;
  trustLevel: TrustLevel | null;
  hasTakenQuiz: boolean;
}

/* ── Persona display names ── */
export const PERSONA_NAMES: Record<PersonaId, string> = {
  job_seeker: "The Informed Candidate",
  recruiter: "The Talent Mirror",
  executive: "The Reckoner",
  researcher: "The Pattern Hunter",
  sales: "The Deal Auditor",
  marketing: "The Brand Auditor",
  investor: "The Signal Reader",
  journalist: "The Accountability Auditor",
  career_changer: "The Navigator",
};

/* ── Section header copy by persona ── */
export const SECTION_HEADER_COPY: Record<PersonaId, string> = {
  job_seeker: "What this means for your decision",
  recruiter: "What this means for your pipeline",
  executive: "What this means for your talent brand",
  researcher: "What this means for your research",
  sales: "What this means for this opportunity",
  marketing: "What this means for your employer brand",
  investor: "What this means as a signal",
  journalist: "What this means for the story",
  career_changer: "What this means for your move",
};

/* ── CTA copy by persona ── */
export const CTA_COPY: Record<PersonaId, string> = {
  job_seeker: "Would you work here?",
  recruiter: "Would top candidates say yes?",
  executive: "Would you be proud of this audit?",
  researcher: "What does this data reveal?",
  sales: "Is this opportunity real?",
  marketing: "Does your brand match this?",
  investor: "What do the signals say?",
  journalist: "What's the story here?",
  career_changer: "Is this the right move?",
};

/* ── Trust level framing ── */
export const TRUST_FRAMING: Record<TrustLevel, string> = {
  skeptic: "We surfaced everything the public record shows. Draw your own conclusions.",
  balanced: "Here's what we found — the good signals and the ones worth questioning.",
  believer: "Here's what you might not have seen before you made your decision.",
};

/* ── Signal priority order by persona ── */
export const SIGNAL_PRIORITY: Record<PersonaId, string[]> = {
  job_seeker: ["Reality Gap score", "Comp Transparency", "Ghost Posting"],
  recruiter: ["Glassdoor Trajectory", "Employee Experience", "Hiring Activity"],
  executive: ["Reality Gap", "Workforce Stability", "Peer Benchmarking"],
  researcher: ["Lobbying/PAC data", "Institutional Links", "Civic Footprint"],
  sales: ["Financial Stability", "Leadership Network", "Government Contracts"],
  marketing: ["Employer Brand vs. Record", "Narrative Risk", "Glassdoor Gap"],
  investor: ["Leadership Stability", "Workforce Health", "Insider Score"],
  journalist: ["Civic Footprint", "Board Interlocks", "Institutional Links"],
  career_changer: ["Reality Gap", "Culture vs. Claims", "Industry Stability"],
};

/* ── Read from localStorage ── */
function getPersonaState(): PersonaState {
  try {
    const persona = localStorage.getItem("wdiwf_persona") as PersonaId | null;
    const nepotismFlag = localStorage.getItem("wdiwf_nepotism_flag") as NepotismFlag | null;
    const trustLevel = localStorage.getItem("wdiwf_trust") as TrustLevel | null;
    return {
      persona,
      nepotismFlag,
      trustLevel,
      hasTakenQuiz: !!persona,
    };
  } catch {
    return { persona: null, nepotismFlag: null, trustLevel: null, hasTakenQuiz: false };
  }
}

/* ── External store for reactivity across components ── */
let listeners: Array<() => void> = [];
let cachedState = getPersonaState();

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

function getSnapshot() {
  return cachedState;
}

function notifyListeners() {
  cachedState = getPersonaState();
  listeners.forEach(l => l());
}

// Listen for storage events (cross-tab) and custom events (same-tab)
if (typeof window !== "undefined") {
  window.addEventListener("storage", notifyListeners);
  window.addEventListener("persona-updated", notifyListeners);
}

export function usePersona() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setPersona = useCallback((id: PersonaId) => {
    localStorage.setItem("wdiwf_persona", id);
    window.dispatchEvent(new Event("persona-updated"));
  }, []);

  const clearPersona = useCallback(() => {
    localStorage.removeItem("wdiwf_persona");
    localStorage.removeItem("wdiwf_nepotism_flag");
    localStorage.removeItem("wdiwf_trust");
    window.dispatchEvent(new Event("persona-updated"));
  }, []);

  return {
    ...state,
    personaName: state.persona ? PERSONA_NAMES[state.persona] : null,
    sectionHeader: state.persona ? SECTION_HEADER_COPY[state.persona] : "What this means",
    ctaCopy: state.persona ? CTA_COPY[state.persona] : "View full report",
    trustFraming: state.trustLevel ? TRUST_FRAMING[state.trustLevel] : null,
    signalPriority: state.persona ? SIGNAL_PRIORITY[state.persona] : [],
    setPersona,
    clearPersona,
  };
}
