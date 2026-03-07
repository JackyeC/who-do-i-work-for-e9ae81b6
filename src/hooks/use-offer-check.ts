import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OfferCheckSection {
  id: string;
  title: string;
  signals: OfferCheckSignal[];
  stale: boolean;
  hasData: boolean;
}

export interface OfferCheckSignal {
  type: string;
  description: string;
  confidence: string;
  sourceUrl?: string | null;
  detectedAt?: string | null;
  lastVerified?: string | null;
  detectionMethod?: string | null;
  evidenceText?: string | null;
}

const STALE_THRESHOLD = 90 * 24 * 60 * 60 * 1000; // 90 days

function isStale(dateStr?: string | null): boolean {
  if (!dateStr) return true;
  return Date.now() - new Date(dateStr).getTime() > STALE_THRESHOLD;
}

function mapConfidence(raw: string): string {
  const map: Record<string, string> = {
    direct: "High", high: "High",
    strong_inference: "Medium", moderate_inference: "Medium", medium: "Medium",
    weak_inference: "Low", low: "Low", unverified: "Low",
  };
  return map[raw] || "Low";
}

export function useOfferCheck(companyId?: string) {
  // Company data
  const { data: company } = useQuery({
    queryKey: ["offer-check-company", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").eq("id", companyId!).single();
      return data;
    },
    enabled: !!companyId,
  });

  // Civic influence signals
  const { data: candidates } = useQuery({
    queryKey: ["oc-candidates", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_candidates").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: publicStances } = useQuery({
    queryKey: ["oc-stances", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_public_stances").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Worker sentiment
  const { data: sentiment } = useQuery({
    queryKey: ["oc-sentiment", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_worker_sentiment").select("*").eq("company_id", companyId!).order("created_at", { ascending: false }).limit(1);
      return data?.[0] || null;
    },
    enabled: !!companyId,
  });

  // Pay equity
  const { data: payEquity } = useQuery({
    queryKey: ["oc-pay-equity", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("pay_equity_signals" as any).select("*").eq("company_id", companyId!);
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  // Worker benefits
  const { data: benefits } = useQuery({
    queryKey: ["oc-benefits", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("worker_benefit_signals" as any).select("*").eq("company_id", companyId!);
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  // AI hiring
  const { data: aiHr } = useQuery({
    queryKey: ["oc-ai-hr", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("ai_hr_signals" as any).select("*").eq("company_id", companyId!);
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  // Ideology flags
  const { data: ideology } = useQuery({
    queryKey: ["oc-ideology", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_ideology_flags").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Transparency index categories
  const tiCategories = [
    { key: "civic-influence", label: "Civic Influence", hasSignals: (candidates?.length || 0) > 0 || (company?.lobbying_spend ?? 0) > 0 || (company?.total_pac_spending ?? 0) > 0 },
    { key: "workforce-disclosure", label: "Workforce Disclosure", hasSignals: (publicStances?.length || 0) > 0 },
    { key: "hiring-technology", label: "Hiring Technology", hasSignals: (aiHr?.length || 0) > 0 },
    { key: "compensation-transparency", label: "Compensation Transparency", hasSignals: (payEquity?.length || 0) > 0 },
    { key: "worker-benefits", label: "Worker Benefits", hasSignals: (benefits?.length || 0) > 0 },
    { key: "organizational-affiliation", label: "Organizational Affiliations", hasSignals: (ideology?.length || 0) > 0 },
    { key: "worker-sentiment", label: "Worker Sentiment", hasSignals: !!sentiment },
  ];

  // Build sections
  const sections: OfferCheckSection[] = [];

  // Section 1: Who Do I Work For
  const civicSignals: OfferCheckSignal[] = [];
  if (company?.total_pac_spending && company.total_pac_spending > 0) {
    civicSignals.push({ type: "Corporate PAC Activity", description: `Total PAC spending detected: $${company.total_pac_spending.toLocaleString()}`, confidence: "High", detectionMethod: "government filing" });
  }
  if (company?.lobbying_spend && company.lobbying_spend > 0) {
    civicSignals.push({ type: "Lobbying Activity", description: `Lobbying expenditure detected: $${company.lobbying_spend.toLocaleString()}`, confidence: "High", detectionMethod: "government filing" });
  }
  candidates?.forEach(c => {
    civicSignals.push({ type: "Candidate Donation", description: `Donation to ${c.name} (${c.party}, ${c.state}): $${c.amount.toLocaleString()}`, confidence: "High", detectionMethod: "government filing" });
  });
  publicStances?.forEach(s => {
    civicSignals.push({ type: "Public Statement vs Observed Signal", description: `${s.topic}: Public position "${s.public_position}" — Observed: "${s.spending_reality}"`, confidence: "Medium" });
  });
  sections.push({ id: "civic", title: "Who Do I Work For", signals: civicSignals, stale: false, hasData: civicSignals.length > 0 });

  // Section 2: Psychological Safety
  const safetySignals: OfferCheckSignal[] = [];
  if (sentiment) {
    if (sentiment.overall_rating) safetySignals.push({ type: "Worker Sentiment", description: `Overall rating: ${sentiment.overall_rating}/5`, confidence: "Medium", detectedAt: sentiment.created_at, detectionMethod: "worker review aggregation" });
    const complaints = (sentiment.top_complaints as any[]) || [];
    complaints.forEach((c: any) => {
      safetySignals.push({ type: "Recurring Concern Signal", description: `${c.theme}: "${c.summary || c.text || ''}"`, confidence: "Medium", detectedAt: sentiment.created_at, detectionMethod: "worker review aggregation" });
    });
  }
  payEquity?.forEach((s: any) => {
    safetySignals.push({ type: "Pay Equity Signal", description: s.signal_type, confidence: mapConfidence(s.confidence), sourceUrl: s.source_url, evidenceText: s.evidence_text, detectedAt: s.date_detected, lastVerified: s.last_verified, detectionMethod: s.detection_method });
  });
  benefits?.forEach((s: any) => {
    safetySignals.push({ type: "Worker Benefit Signal", description: `${s.benefit_category}: ${s.benefit_type}`, confidence: mapConfidence(s.confidence), sourceUrl: s.source_url, evidenceText: s.evidence_text, detectedAt: s.date_detected, lastVerified: s.last_verified, detectionMethod: s.detection_method });
  });
  const safetyStaleDates = [...(payEquity || []).map((s: any) => s.last_verified || s.date_detected), ...(benefits || []).map((s: any) => s.last_verified || s.date_detected)];
  const safetyStale = safetyStaleDates.length > 0 && safetyStaleDates.every(d => isStale(d));
  sections.push({ id: "safety", title: "Psychological Safety Signals", signals: safetySignals, stale: safetyStale, hasData: safetySignals.length > 0 });

  // Section 3: Hiring Technology
  const hiringSignals: OfferCheckSignal[] = [];
  aiHr?.forEach((s: any) => {
    hiringSignals.push({ type: s.signal_category || "Hiring Technology Signal", description: s.signal_type + (s.vendor_name ? ` (Vendor: ${s.vendor_name})` : ""), confidence: mapConfidence(s.confidence), sourceUrl: s.source_url, evidenceText: s.evidence_text, detectedAt: s.date_detected, lastVerified: s.last_verified, detectionMethod: s.detection_method });
  });
  const hiringStaleDates = (aiHr || []).map((s: any) => s.last_verified || s.date_detected);
  const hiringStale = hiringStaleDates.length > 0 && hiringStaleDates.every(d => isStale(d));
  sections.push({ id: "hiring-tech", title: "Hiring Technology & AI Use", signals: hiringSignals, stale: hiringStale, hasData: hiringSignals.length > 0 });

  // Section 4: Transparency Summary (derived from tiCategories)
  const transparencySignals: OfferCheckSignal[] = tiCategories.map(cat => ({
    type: cat.label,
    description: cat.hasSignals ? "Public signal detected in this category." : "No public evidence detected in scanned sources for this category.",
    confidence: cat.hasSignals ? "High" : "Low",
  }));
  sections.push({ id: "transparency", title: "Transparency and Disclosure Summary", signals: transparencySignals, stale: false, hasData: tiCategories.some(c => c.hasSignals) });

  // Section 5: Things to Review
  const reviewItems: OfferCheckSignal[] = [];
  if (hiringSignals.length > 0) reviewItems.push({ type: "Review Area", description: "Review hiring technology signals detected for this company.", confidence: "Medium" });
  if (payEquity?.length === 0) reviewItems.push({ type: "Review Area", description: "Review public compensation transparency — no disclosures detected.", confidence: "Low" });
  if (benefits?.length === 0) reviewItems.push({ type: "Review Area", description: "Review worker benefit disclosures — no public evidence detected.", confidence: "Low" });
  if (ideology?.length ?? 0 > 0) reviewItems.push({ type: "Review Area", description: "Review organizational affiliation signals.", confidence: "Medium" });
  if (civicSignals.length > 0) reviewItems.push({ type: "Review Area", description: "Review lobbying and civic influence activity signals.", confidence: "Medium" });
  if (safetySignals.some(s => s.type === "Recurring Concern Signal")) reviewItems.push({ type: "Review Area", description: "Review recurring worker concern signals.", confidence: "Medium" });
  sections.push({ id: "review", title: "Things to Review Before You Say Yes", signals: reviewItems, stale: false, hasData: reviewItems.length > 0 });

  const totalSignals = sections.reduce((sum, s) => sum + s.signals.length, 0);
  const staleSections = sections.filter(s => s.stale).length;

  return {
    company,
    sections,
    tiCategories,
    totalSignals,
    staleSections,
    isLoading: !company,
  };
}
