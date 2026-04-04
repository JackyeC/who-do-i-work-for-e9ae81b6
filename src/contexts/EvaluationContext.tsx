import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";

export interface EvaluationCompany {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  state?: string;
  civic_footprint_score?: number;
  employer_clarity_score?: number;
  career_intelligence_score?: number;
  employee_count?: string;
}

export interface EvaluationJob {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  alignmentScore?: number;
  applicationLink?: string;
}

export interface EvaluationOffer {
  id: string;
  companyId: string;
  companyName: string;
  roleTitle?: string;
  salary?: number;
  riskScore?: number;
}

export interface UserPriorities {
  values: number;      // 0-100 weight
  pay: number;
  safety: number;
  growth: number;
  flexibility: number;
}

const DEFAULT_PRIORITIES: UserPriorities = {
  values: 60,
  pay: 70,
  safety: 80,
  growth: 50,
  flexibility: 50,
};

interface EvaluationContextType {
  activeCompany: EvaluationCompany | null;
  activeJob: EvaluationJob | null;
  activeOffer: EvaluationOffer | null;
  userPriorities: UserPriorities;
  setActiveCompany: (company: EvaluationCompany | null) => void;
  setActiveJob: (job: EvaluationJob | null) => void;
  setActiveOffer: (offer: EvaluationOffer | null) => void;
  updatePriorities: (priorities: Partial<UserPriorities>) => void;
  clearContext: () => void;
  /** Derived scores */
  alignmentScore: number;
  riskScore: number;
  verdictText: string;
  verdictReasons: string[];
  contextLabel: string;
}

const EvaluationContext = createContext<EvaluationContextType>({
  activeCompany: null,
  activeJob: null,
  activeOffer: null,
  userPriorities: DEFAULT_PRIORITIES,
  setActiveCompany: () => {},
  setActiveJob: () => {},
  setActiveOffer: () => {},
  updatePriorities: () => {},
  clearContext: () => {},
  alignmentScore: 0,
  riskScore: 0,
  verdictText: "",
  contextLabel: "",
});

export const useEvaluation = () => useContext(EvaluationContext);

function loadPriorities(): UserPriorities {
  try {
    const saved = localStorage.getItem("wdiwf-user-priorities");
    if (saved) return { ...DEFAULT_PRIORITIES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_PRIORITIES;
}

export function EvaluationProvider({ children }: { children: ReactNode }) {
  const [activeCompany, setActiveCompanyState] = useState<EvaluationCompany | null>(null);
  const [activeJob, setActiveJobState] = useState<EvaluationJob | null>(null);
  const [activeOffer, setActiveOfferState] = useState<EvaluationOffer | null>(null);
  const [userPriorities, setPriorities] = useState<UserPriorities>(loadPriorities);

  const setActiveCompany = useCallback((company: EvaluationCompany | null) => {
    setActiveCompanyState(company);
    // Clear job/offer if switching companies
    if (company && activeCompany && company.id !== activeCompany.id) {
      setActiveJobState(null);
      setActiveOfferState(null);
    }
  }, [activeCompany]);

  const setActiveJob = useCallback((job: EvaluationJob | null) => {
    setActiveJobState(job);
  }, []);

  const setActiveOffer = useCallback((offer: EvaluationOffer | null) => {
    setActiveOfferState(offer);
  }, []);

  const updatePriorities = useCallback((partial: Partial<UserPriorities>) => {
    setPriorities(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem("wdiwf-user-priorities", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearContext = useCallback(() => {
    setActiveCompanyState(null);
    setActiveJobState(null);
    setActiveOfferState(null);
  }, []);

  // Derived scores
  const { alignmentScore, riskScore, verdictText } = useMemo(() => {
    if (!activeCompany) return { alignmentScore: 0, riskScore: 0, verdictText: "" };

    const civic = activeCompany.civic_footprint_score ?? 0;
    const clarity = activeCompany.employer_clarity_score ?? 0;
    const career = activeCompany.career_intelligence_score ?? 0;

    // Alignment: weighted average of company scores against user priorities
    const { values, safety, growth } = userPriorities;
    const totalWeight = values + safety + growth || 1;
    const alignment = Math.round(
      ((civic * values) + (clarity * safety) + ((career * 10) * growth)) / totalWeight
    );
    const clampedAlignment = Math.min(100, Math.max(0, alignment));

    // Risk: inverse of max score
    const maxScore = Math.max(civic, clarity);
    const risk = Math.max(0, 100 - maxScore);

    // Offer can override
    const jobAlignment = activeJob?.alignmentScore ?? clampedAlignment;
    const offerRisk = activeOffer?.riskScore ?? risk;

    let verdict = "";
    if (jobAlignment >= 70 && offerRisk < 40) verdict = "Worth serious consideration";
    else if (jobAlignment >= 40 || offerRisk < 60) verdict = "Proceed with caution";
    else verdict = "Protect your peace";

    return { alignmentScore: jobAlignment, riskScore: offerRisk, verdictText: verdict };
  }, [activeCompany, activeJob, activeOffer, userPriorities]);

  const contextLabel = useMemo(() => {
    const parts: string[] = [];
    if (activeCompany) parts.push(activeCompany.name);
    if (activeJob) parts.push(activeJob.title);
    if (activeOffer) parts.push("Offer Review");
    return parts.join(" — ") || "";
  }, [activeCompany, activeJob, activeOffer]);

  return (
    <EvaluationContext.Provider
      value={{
        activeCompany,
        activeJob,
        activeOffer,
        userPriorities,
        setActiveCompany,
        setActiveJob,
        setActiveOffer,
        updatePriorities,
        clearContext,
        alignmentScore,
        riskScore,
        verdictText,
        contextLabel,
      }}
    >
      {children}
    </EvaluationContext.Provider>
  );
}
