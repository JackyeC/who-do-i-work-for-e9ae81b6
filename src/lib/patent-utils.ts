import { supabase } from "@/integrations/supabase/client";

export interface PatentCluster {
  theme: string;
  count: number;
  examples?: string[];
}

export interface TopPatent {
  title: string;
  url?: string | null;
  patent_number?: string;
}

export interface IpSignals {
  patent_count_12m: number;
  patent_count_36m: number;
  patent_trend: string;
  trademark_count_12m: number;
  trademark_trend: string;
  ownership_change_flag: boolean;
  innovation_signal_score: number;
  expansion_signal_score: number;
  ip_complexity_score: number;
  top_cpc_categories?: string[];
}

export interface PatentScanResult {
  cached: boolean;
  usedFallback?: boolean;
  signals: IpSignals;
  clusters: PatentCluster[];
  topPatents: TopPatent[];
  totalResults: number;
}

export type InnovationLevel = "high" | "moderate" | "low" | "none";

export interface InnovationSignalInfo {
  level: InnovationLevel;
  label: string;
  description: string;
}

export async function fetchPatentData(
  companyName: string,
  companyId?: string
): Promise<PatentScanResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke("uspto-scan", {
      body: { companyName, companyId },
    });
    if (error) throw error;
    return data as PatentScanResult;
  } catch (err) {
    console.error("Patent fetch error:", err);
    return null;
  }
}

export function calculateInnovationSignal(
  totalCount: number,
  recentCount: number
): InnovationSignalInfo {
  if (totalCount >= 50 || recentCount >= 10) {
    return {
      level: "high",
      label: "Active Innovation",
      description: `${totalCount.toLocaleString()} USPTO patents filed. ${recentCount} in the last 3 years — consistent R&D investment detected.`,
    };
  }
  if (totalCount >= 10 || recentCount >= 3) {
    return {
      level: "moderate",
      label: "Moderate Innovation",
      description: `${totalCount.toLocaleString()} USPTO patents on record. ${recentCount} filed in the last 3 years — some active development.`,
    };
  }
  if (totalCount >= 1) {
    return {
      level: "low",
      label: "Limited Patent Activity",
      description: `${totalCount} USPTO patent${totalCount === 1 ? "" : "s"} found. Limited IP filing activity — may indicate service-focused or legacy business model.`,
    };
  }
  return {
    level: "none",
    label: "No Patents Found",
    description:
      "No USPTO patents found under this company name. May file under subsidiaries or a parent entity.",
  };
}

export function getPatentGoogleLink(patentNumber: string): string {
  const clean = patentNumber.replace(/[^a-zA-Z0-9]/g, "");
  return `https://patents.google.com/patent/US${clean}`;
}

export function getSignalDotColor(level: InnovationLevel): string {
  switch (level) {
    case "high":
      return "bg-[hsl(var(--civic-green))]";
    case "moderate":
      return "bg-[hsl(var(--civic-gold))]";
    case "low":
    case "none":
    default:
      return "bg-muted-foreground";
  }
}
