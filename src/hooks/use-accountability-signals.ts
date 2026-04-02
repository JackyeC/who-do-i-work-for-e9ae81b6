/**
 * useAccountabilitySignals
 * ════════════════════════════════════════════════════════════════
 * SINGLE SOURCE OF TRUTH for Accountability Signals across WDIWF.
 *
 * Every page that needs accountability data MUST use this hook.
 * Do NOT query the accountability_signals table directly elsewhere.
 * Do NOT duplicate, transform, or re-shape this data per-page.
 *
 * Feature gate: Returns empty data for companies not in the
 * APPROVED_COMPANY_IDS set. Query is skipped entirely (no network).
 *
 * Consumers (current and planned):
 *   ✅ CompanyDossier  — Layer 10 (AccountabilitySignalsLayer)
 *   🔜 CompanyProfile  — summary badge / count indicator
 *   🔜 OfferIntelligencePanel — conduct flags on fallback pages
 *   🔜 Search/browse result cards — severity badge preview
 *   🔜 House/Senate pages — if accountability data is linked
 *
 * To add a new company to the approved list, add its UUID below.
 * To enable broadly, replace the gate with `true`.
 * ════════════════════════════════════════════════════════════════
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Canonical type (matches DB schema exactly) ───
export interface AccountabilitySignal {
  id: string;
  company_id: string;
  signal_category: "power_influence" | "conduct_culture" | "nepotism_governance" | "narrative_gap";
  signal_type: string;
  status_label: "reported" | "alleged" | "settled" | "confirmed" | "convicted" | "under_investigation" | "dismissed";
  headline: string;
  description: string | null;
  why_it_matters: string | null;
  subject_name: string | null;
  subject_role: string | null;
  source_type: string;
  source_url: string | null;
  source_name: string | null;
  event_date: string | null;
  severity: "low" | "medium" | "high" | "critical";
  is_verified: boolean;
  source_hash: string | null;
  ingestion_source_key: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Grouped shape for UI consumers ───
export interface AccountabilitySignalGroup {
  category: AccountabilitySignal["signal_category"];
  signals: AccountabilitySignal[];
  highSeverityCount: number;
}

// ─── Feature flag: reviewed and approved company IDs ───
const APPROVED_COMPANY_IDS = new Set([
  "179c69f3-6d11-41ce-97c0-45e6f677af61", // JPMorgan Chase
  "d4e5f6a7-b8c9-0123-defa-234567890123", // Amazon
]);

export function isAccountabilityEnabled(companyId: string): boolean {
  return APPROVED_COMPANY_IDS.has(companyId);
}

// ─── Canonical query key (for cache consistency) ───
export const accountabilityQueryKey = (companyId: string) =>
  ["accountability-signals", companyId] as const;

// ─── The hook ───
export function useAccountabilitySignals(companyId: string | undefined) {
  const enabled = !!companyId && isAccountabilityEnabled(companyId);

  const query = useQuery({
    queryKey: accountabilityQueryKey(companyId || ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accountability_signals")
        .select("*")
        .eq("company_id", companyId!)
        .order("severity", { ascending: true })
        .order("event_date", { ascending: false });
      if (error) throw error;
      return (data || []) as AccountabilitySignal[];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min — same data everywhere
  });

  // Pre-grouped for UI convenience (derived, not duplicated)
  const grouped: AccountabilitySignalGroup[] = enabled
    ? (["power_influence", "conduct_culture", "nepotism_governance", "narrative_gap"] as const)
        .map(cat => {
          const catSignals = (query.data || []).filter(s => s.signal_category === cat);
          return {
            category: cat,
            signals: catSignals,
            highSeverityCount: catSignals.filter(s => s.severity === "critical" || s.severity === "high").length,
          };
        })
        .filter(g => g.signals.length > 0)
    : [];

  return {
    /** Raw flat list of signals */
    signals: query.data || [],
    /** Grouped by category with counts */
    grouped,
    /** Whether this company has any accountability signals */
    hasSignals: (query.data?.length || 0) > 0,
    /** Total count */
    totalCount: query.data?.length || 0,
    /** Count of high/critical severity signals */
    highSeverityCount: (query.data || []).filter(s => s.severity === "critical" || s.severity === "high").length,
    /** Whether the feature is enabled for this company */
    isEnabled: enabled,
    /** Loading state */
    isLoading: query.isLoading && enabled,
  };
}
