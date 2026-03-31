import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DRAFT_KEY = "wdiwf-values-draft-v1";

export interface ForcedChoice {
  scenario: number;
  pick: "a" | "b" | "skip";
}

export interface DealbreakersData {
  selected: string[]; // column names, max 5
  walkAway: string[]; // column names, max 2 (subset of selected)
}

export interface WorkStyleData {
  growthVsStability: "startup" | "enterprise" | null;
  companySize: "large" | "small" | null;
  remote: "remote" | "hybrid" | "in-person" | null;
  missionVsComp: "mission" | "compensation" | null;
}

export interface SalaryData {
  salaryFloor: number | null;
  walkAway: string;
}

export interface TopicRating {
  column: string;
  value: number; // 90, 70, 40, 10
}

export interface ValuesDraft {
  forcedChoices: ForcedChoice[];
  dealbreakers: DealbreakersData;
  workStyle: WorkStyleData;
  salary: SalaryData;
  topics: TopicRating[];
  completedSteps: number[];
}

const EMPTY_DRAFT: ValuesDraft = {
  forcedChoices: [],
  dealbreakers: { selected: [], walkAway: [] },
  workStyle: { growthVsStability: null, companySize: null, remote: null, missionVsComp: null },
  salary: { salaryFloor: null, walkAway: "" },
  topics: [],
  completedSteps: [],
};

// Scenario → column mappings
const SCENARIO_MAPPINGS: { a: string[]; b: string[] }[] = [
  { a: ["benefits_importance"], b: ["pay_transparency_importance"] },
  { a: ["dei_equity_importance"], b: ["labor_rights_importance"] },
  { a: ["worker_protections_importance"], b: ["mission_alignment_importance"] },
  { a: ["remote_flexibility_importance"], b: ["community_investment_importance"] },
  { a: ["political_transparency_importance"], b: ["mission_alignment_importance"] },
  { a: ["ai_ethics_importance"], b: ["data_privacy_importance"] },
];

const COLUMN_LABELS: Record<string, string> = {
  pay_transparency_importance: "Pay Transparency",
  benefits_importance: "Benefits & Compensation",
  dei_equity_importance: "Inclusion & Equity",
  labor_rights_importance: "Labor Rights",
  worker_protections_importance: "Worker Protections",
  mission_alignment_importance: "Mission Alignment",
  remote_flexibility_importance: "Remote Flexibility",
  community_investment_importance: "Community & Culture",
  political_transparency_importance: "Political Transparency",
  ai_ethics_importance: "AI Ethics",
  data_privacy_importance: "Data Privacy",
  union_rights_importance: "Union Rights",
  environment_climate_importance: "Environment",
  political_donations_importance: "Political Spending",
  workplace_safety_importance: "Workplace Safety",
  anti_discrimination_importance: "Anti-Discrimination",
  anti_corruption_importance: "Leadership Ethics",
  pay_equity_importance: "Compensation Fairness",
  reproductive_rights_importance: "Reproductive Healthcare",
  education_access_importance: "Education Access",
};

export function useValuesFlow() {
  const [draft, setDraft] = useState<ValuesDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ValuesDraft;
        setDraft(parsed);
      }
    } catch {
      // ignore corrupt draft
    }
  }, []);

  const saveDraft = useCallback((updated: ValuesDraft) => {
    setDraft(updated);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
    } catch {
      // storage full, ignore
    }
  }, []);

  const updateForcedChoices = useCallback((choices: ForcedChoice[]) => {
    saveDraft({ ...draft, forcedChoices: choices, completedSteps: [...new Set([...draft.completedSteps, 0])] });
  }, [draft, saveDraft]);

  const updateDealbreakers = useCallback((data: DealbreakersData) => {
    saveDraft({ ...draft, dealbreakers: data, completedSteps: [...new Set([...draft.completedSteps, 1])] });
  }, [draft, saveDraft]);

  const updateWorkStyle = useCallback((data: WorkStyleData) => {
    saveDraft({ ...draft, workStyle: data, completedSteps: [...new Set([...draft.completedSteps, 2])] });
  }, [draft, saveDraft]);

  const updateSalary = useCallback((data: SalaryData) => {
    saveDraft({ ...draft, salary: data, completedSteps: [...new Set([...draft.completedSteps, 3])] });
  }, [draft, saveDraft]);

  const updateTopics = useCallback((data: TopicRating[]) => {
    saveDraft({ ...draft, topics: data, completedSteps: [...new Set([...draft.completedSteps, 4])] });
  }, [draft, saveDraft]);

  const buildPayload = useCallback(() => {
    const cols: Record<string, number> = {};

    // Step 1: Forced choices — baseline 50, winner +15
    draft.forcedChoices.forEach((choice) => {
      const mapping = SCENARIO_MAPPINGS[choice.scenario];
      if (!mapping || choice.pick === "skip") return;
      const winnerCols = choice.pick === "a" ? mapping.a : mapping.b;
      winnerCols.forEach((col) => {
        cols[col] = Math.max(cols[col] || 50, 65);
      });
      // Set baseline for loser cols if not already set
      const loserCols = choice.pick === "a" ? mapping.b : mapping.a;
      loserCols.forEach((col) => {
        if (!cols[col]) cols[col] = 50;
      });
    });

    // Step 2: Dealbreakers — selected=92, walkAway=98
    draft.dealbreakers.selected.forEach((col) => {
      cols[col] = Math.max(cols[col] || 50, 92);
    });
    draft.dealbreakers.walkAway.forEach((col) => {
      cols[col] = Math.max(cols[col] || 50, 98);
    });

    // Step 3: Work style
    const ws = draft.workStyle;
    if (ws.remote === "remote") cols["remote_flexibility_importance"] = Math.max(cols["remote_flexibility_importance"] || 50, 90);
    else if (ws.remote === "hybrid") cols["remote_flexibility_importance"] = Math.max(cols["remote_flexibility_importance"] || 50, 60);
    else if (ws.remote === "in-person") cols["remote_flexibility_importance"] = Math.max(cols["remote_flexibility_importance"] || 50, 30);

    if (ws.missionVsComp === "mission") cols["mission_alignment_importance"] = Math.max(cols["mission_alignment_importance"] || 50, 85);
    else if (ws.missionVsComp === "compensation") cols["mission_alignment_importance"] = Math.max(cols["mission_alignment_importance"] || 50, 40);

    // Step 5: Topics — Math.max with existing
    draft.topics.forEach((t) => {
      cols[t.column] = Math.max(cols[t.column] || 0, t.value);
    });

    // Build the DB payload
    const payload: Record<string, any> = {};
    Object.entries(cols).forEach(([col, val]) => {
      payload[col] = val;
    });

    // Work style string fields
    if (ws.growthVsStability) payload["startup_vs_enterprise_preference"] = ws.growthVsStability;
    if (ws.companySize) payload["company_size_preference"] = ws.companySize;

    // Notes as JSON with salary data
    const notesObj: Record<string, any> = {};
    if (draft.salary.salaryFloor) notesObj.salary_floor = draft.salary.salaryFloor;
    if (draft.salary.walkAway) notesObj.walk_away = draft.salary.walkAway;
    if (draft.dealbreakers.walkAway.length > 0) {
      notesObj.top_walk_away_issues = draft.dealbreakers.walkAway.map((c) => COLUMN_LABELS[c] || c);
    }
    if (Object.keys(notesObj).length > 0) payload["notes"] = JSON.stringify(notesObj);

    return payload;
  }, [draft]);

  const getTopValues = useCallback(() => {
    const payload = buildPayload();
    const importanceCols = Object.entries(payload)
      .filter(([k, v]) => k.endsWith("_importance") && typeof v === "number")
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5);
    return importanceCols.map(([col, val]) => ({
      label: COLUMN_LABELS[col] || col.replace(/_importance$/, "").replace(/_/g, " "),
      value: val as number,
      column: col,
    }));
  }, [buildPayload]);

  const getDealbreakers = useCallback(() => {
    return draft.dealbreakers.selected.map((col) => ({
      label: COLUMN_LABELS[col] || col,
      column: col,
      isWalkAway: draft.dealbreakers.walkAway.includes(col),
    }));
  }, [draft.dealbreakers]);

  const getRiskTolerance = useCallback(() => {
    const dealCount = draft.dealbreakers.selected.length;
    const isStability = draft.workStyle.growthVsStability === "enterprise";
    if (dealCount >= 4 || (dealCount >= 3 && isStability)) return "Conservative";
    if (dealCount <= 1 && !isStability) return "Open";
    return "Moderate";
  }, [draft]);

  const getFitSummary = useCallback(() => {
    const top = getTopValues();
    if (top.length === 0) return "";
    const topLabels = top.slice(0, 3).map((t) => t.label.toLowerCase());
    const prefix = draft.workStyle.missionVsComp === "mission" ? "a mission-driven" : "a well-compensating";
    return `You're looking for ${prefix} employer with strong ${topLabels.join(", ")}.`;
  }, [getTopValues, draft.workStyle.missionVsComp]);

  const getWarningSummary = useCallback(() => {
    const deals = getDealbreakers();
    if (deals.length === 0) return "";
    const labels = deals.slice(0, 3).map((d) => d.label.toLowerCase());
    return `Watch out for companies with ${labels.join(", ")}.`;
  }, [getDealbreakers]);

  const saveToDb = useCallback(async (userId: string) => {
    setSaving(true);
    try {
      const payload = buildPayload();
      payload.user_id = userId;

      const { error } = await (supabase as any)
        .from("user_values_profile")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      localStorage.removeItem(DRAFT_KEY);
      toast({ title: "Values profile saved", description: "We'll use this to evaluate companies and opportunities for you." });
      return true;
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message || "Please try again.", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  }, [buildPayload, toast]);

  return {
    draft,
    saving,
    saveDraft,
    updateForcedChoices,
    updateDealbreakers,
    updateWorkStyle,
    updateSalary,
    updateTopics,
    buildPayload,
    getTopValues,
    getDealbreakers,
    getRiskTolerance,
    getFitSummary,
    getWarningSummary,
    saveToDb,
    COLUMN_LABELS,
  };
}
