/**
 * usePersonalizedSignals
 * ════════════════════════════════════════════════════════════════
 * Layer 2 of the personalization stack.
 *
 * Reads the user's values profile and provides a function to check
 * whether a given signal category or keyword is important to them.
 *
 * This is the SINGLE source of truth for "does this signal matter
 * to this user?" across all WDIWF surfaces.
 * ════════════════════════════════════════════════════════════════
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Threshold: values scoring >= this are considered "important" ───
const IMPORTANCE_THRESHOLD = 70;

// ─── Signal keyword → user_values_profile column(s) mapping ───
const SIGNAL_TO_VALUES_COLUMNS: Record<string, string[]> = {
  // Accountability signal categories
  power_influence: ["political_transparency_importance", "lobbying_activity_importance", "political_donations_importance"],
  conduct_culture: ["workplace_safety_importance", "anti_discrimination_importance", "labor_rights_importance"],
  nepotism_governance: ["anti_corruption_importance", "political_transparency_importance"],
  narrative_gap: ["anti_corruption_importance", "consumer_protection_importance"],

  // Structured signal keywords
  pac: ["political_donations_importance", "political_transparency_importance"],
  lobbying: ["lobbying_activity_importance", "political_transparency_importance"],
  layoff: ["worker_protections_importance", "labor_rights_importance"],
  warn: ["worker_protections_importance", "labor_rights_importance"],
  pay_equity: ["pay_equity_importance", "pay_transparency_importance", "gender_equality_importance"],
  pay_transparency: ["pay_transparency_importance", "pay_equity_importance"],
  compensation: ["pay_equity_importance", "benefits_importance"],
  benefits: ["benefits_importance", "healthcare_importance"],
  sentiment: ["labor_rights_importance", "worker_protections_importance"],
  safety: ["workplace_safety_importance"],
  osha: ["workplace_safety_importance"],
  eeoc: ["anti_discrimination_importance", "dei_equity_importance"],
  nlrb: ["union_rights_importance", "labor_rights_importance"],
  union: ["union_rights_importance"],
  dei: ["dei_equity_importance", "anti_discrimination_importance"],
  discrimination: ["anti_discrimination_importance"],
  lgbtq: ["lgbtq_rights_importance"],
  climate: ["environment_climate_importance", "pollution_waste_importance"],
  environment: ["environment_climate_importance"],
  pollution: ["pollution_waste_importance"],
  privacy: ["data_privacy_importance"],
  ai_hiring: ["ai_ethics_importance", "ai_transparency_importance"],
  ai: ["ai_ethics_importance", "ai_transparency_importance"],
  dark_money: ["political_transparency_importance", "anti_corruption_importance"],
  revolving_door: ["political_transparency_importance", "anti_corruption_importance"],
  government_contract: ["government_contract_preference"],
  supply_chain: ["sustainable_supply_chains_importance"],
  immigration: ["immigration_importance"],
  reproductive: ["reproductive_rights_importance"],
  healthcare: ["healthcare_importance"],
  gig_worker: ["gig_worker_treatment_importance"],
  corruption: ["anti_corruption_importance"],
};

export interface PersonalizedMatch {
  isImportant: boolean;
  importance: number; // 0-100, highest matching column
  label: string;      // Human-readable value name
}

const VALUES_LABELS: Record<string, string> = {
  political_transparency_importance: "Political Transparency",
  lobbying_activity_importance: "Lobbying Activity",
  political_donations_importance: "Political Donations",
  workplace_safety_importance: "Workplace Safety",
  anti_discrimination_importance: "Anti-Discrimination",
  labor_rights_importance: "Labor Rights",
  anti_corruption_importance: "Anti-Corruption",
  consumer_protection_importance: "Consumer Protection",
  pay_equity_importance: "Pay Equity",
  pay_transparency_importance: "Pay Transparency",
  gender_equality_importance: "Gender Equality",
  worker_protections_importance: "Worker Protections",
  benefits_importance: "Benefits",
  healthcare_importance: "Healthcare",
  dei_equity_importance: "DEI & Equity",
  union_rights_importance: "Union Rights",
  environment_climate_importance: "Climate & Environment",
  pollution_waste_importance: "Pollution & Waste",
  data_privacy_importance: "Data Privacy",
  ai_ethics_importance: "AI Ethics",
  ai_transparency_importance: "AI Transparency",
  sustainable_supply_chains_importance: "Supply Chain Ethics",
  lgbtq_rights_importance: "LGBTQ+ Rights",
  reproductive_rights_importance: "Reproductive Rights",
  immigration_importance: "Immigration",
  gig_worker_treatment_importance: "Gig Worker Treatment",
  government_contract_preference: "Government Contracts",
};

export function usePersonalizedSignals() {
  const { user } = useAuth();

  const { data: valuesProfile } = useQuery({
    queryKey: ["user-values-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("user_values_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 min cache
  });

  const hasProfile = !!valuesProfile;

  /**
   * Check if a signal keyword/category matters to this user.
   * Accepts any key from SIGNAL_TO_VALUES_COLUMNS, or a signal_category
   * from accountability_signals, or a free-text keyword that partially matches.
   */
  const checkSignalRelevance = useMemo(() => {
    if (!valuesProfile) {
      return (_keyword: string): PersonalizedMatch => ({
        isImportant: false,
        importance: 0,
        label: "",
      });
    }

    return (keyword: string): PersonalizedMatch => {
      const normalizedKey = keyword.toLowerCase().replace(/[\s-]+/g, "_");

      // Direct match
      let columns = SIGNAL_TO_VALUES_COLUMNS[normalizedKey];

      // Partial match fallback
      if (!columns) {
        const matchingKey = Object.keys(SIGNAL_TO_VALUES_COLUMNS).find(
          (k) => normalizedKey.includes(k) || k.includes(normalizedKey)
        );
        if (matchingKey) columns = SIGNAL_TO_VALUES_COLUMNS[matchingKey];
      }

      if (!columns) return { isImportant: false, importance: 0, label: "" };

      let maxImportance = 0;
      let matchedColumn = "";

      for (const col of columns) {
        const val = (valuesProfile as any)[col];
        if (typeof val === "number" && val > maxImportance) {
          maxImportance = val;
          matchedColumn = col;
        }
      }

      return {
        isImportant: maxImportance >= IMPORTANCE_THRESHOLD,
        importance: maxImportance,
        label: VALUES_LABELS[matchedColumn] || matchedColumn.replace(/_importance$/, "").replace(/_/g, " "),
      };
    };
  }, [valuesProfile]);

  /**
   * Get the user's top N values (sorted by importance desc).
   */
  const topValues = useMemo(() => {
    if (!valuesProfile) return [];
    const entries: { key: string; label: string; importance: number }[] = [];
    for (const [col, label] of Object.entries(VALUES_LABELS)) {
      const val = (valuesProfile as any)[col];
      if (typeof val === "number" && val >= IMPORTANCE_THRESHOLD) {
        entries.push({ key: col, label, importance: val });
      }
    }
    return entries.sort((a, b) => b.importance - a.importance);
  }, [valuesProfile]);

  return {
    hasProfile,
    checkSignalRelevance,
    topValues,
    valuesProfile,
  };
}
