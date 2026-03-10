import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CareerProfile {
  jobTitle: string;
  yearsExperience: string;
  industries: string[];
  responsibilities: string;
  technicalSkills: string[];
  softSkills: string[];
  workStyles: string[];
  lifestylePrefs: string[];
  values: string[];
  anchors: string[];
  targetRole: string | null;
}

export interface CareerDiscoveryData {
  likely: { from: string; to: string; confidence: number; skills: string[] }[];
  adjacent: { role: string; industry: string; match: number; reason: string }[];
  unexpected: { role: string; match: number; reason: string; skills: string[] }[];
}

export interface CompanyDiscoveryData {
  companies: {
    name: string; industry: string; overview: string; valuesMatch: number;
    hiringSignal: string; valuesSignals: string[]; talentSignals: string[];
  }[];
}

export interface SkillGapData {
  skills: { name: string; level: number; category: "strong" | "transferable" | "bridge" | "develop" }[];
}

export interface MultipleFuturesData {
  futures: {
    type: "expected" | "pivot" | "wildcard"; label: string; description: string;
    roles: string; skills: string[]; companies: string[]; timeline: string;
  }[];
}

export interface ActionPlanData {
  milestones: {
    period: string;
    actions: { type: "course" | "skill" | "project" | "connect" | "company"; text: string }[];
  }[];
}

type DiscoveryType = "career_discovery" | "company_discovery" | "skill_gap" | "multiple_futures" | "action_plan";

interface DiscoveryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useCareerDiscovery(profile: CareerProfile | null) {
  const [careerPaths, setCareerPaths] = useState<DiscoveryState<CareerDiscoveryData>>({ data: null, loading: false, error: null });
  const [companies, setCompanies] = useState<DiscoveryState<CompanyDiscoveryData>>({ data: null, loading: false, error: null });
  const [skillGap, setSkillGap] = useState<DiscoveryState<SkillGapData>>({ data: null, loading: false, error: null });
  const [futures, setFutures] = useState<DiscoveryState<MultipleFuturesData>>({ data: null, loading: false, error: null });
  const [actionPlan, setActionPlan] = useState<DiscoveryState<ActionPlanData>>({ data: null, loading: false, error: null });

  const stateMap = { career_discovery: setCareerPaths, company_discovery: setCompanies, skill_gap: setSkillGap, multiple_futures: setFutures, action_plan: setActionPlan };

  const discover = useCallback(async (type: DiscoveryType) => {
    if (!profile) return;
    const setter = stateMap[type];
    setter({ data: null, loading: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke("career-discovery", {
        body: { type, profile },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Discovery failed");

      setter({ data: data.data, loading: false, error: null });
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setter({ data: null, loading: false, error: msg });
      toast({ title: "Discovery Error", description: msg, variant: "destructive" });
    }
  }, [profile]);

  return { careerPaths, companies, skillGap, futures, actionPlan, discover };
}
