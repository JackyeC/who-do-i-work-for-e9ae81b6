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

const STALE_THRESHOLD = 90 * 24 * 60 * 60 * 1000;

function isStale(dateStr?: string | null): boolean {
  if (!dateStr) return true;
  return Date.now() - new Date(dateStr).getTime() > STALE_THRESHOLD;
}

function mapConfidence(raw: string): string {
  const map: Record<string, string> = {
    direct: "Direct Source", high: "Direct Source",
    strong_inference: "Multi-Source", moderate_inference: "Multi-Source", medium: "Multi-Source",
    weak_inference: "Inferred Signal", low: "Inferred Signal", unverified: "Inferred Signal",
  };
  return map[raw] || "Inferred Signal";
}

export function useOfferCheck(companyId?: string) {
  const { data: company } = useQuery({
    queryKey: ["offer-check-company", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").eq("id", companyId!).single();
      return data;
    },
    enabled: !!companyId,
  });

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

  const { data: sentiment } = useQuery({
    queryKey: ["oc-sentiment", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_worker_sentiment").select("*").eq("company_id", companyId!).order("created_at", { ascending: false }).limit(1);
      return data?.[0] || null;
    },
    enabled: !!companyId,
  });

  const { data: payEquity } = useQuery({
    queryKey: ["oc-pay-equity", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("pay_equity_signals" as any).select("*").eq("company_id", companyId!);
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const { data: benefits } = useQuery({
    queryKey: ["oc-benefits", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("worker_benefit_signals" as any).select("*").eq("company_id", companyId!);
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const { data: aiHr } = useQuery({
    queryKey: ["oc-ai-hr", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("ai_hr_signals" as any).select("*").eq("company_id", companyId!);
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const { data: ideology } = useQuery({
    queryKey: ["oc-ideology", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_ideology_flags").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: warnNotices } = useQuery({
    queryKey: ["oc-warn", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_warn_notices" as any).select("*").eq("company_id", companyId!).order("notice_date", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const { data: darkMoney } = useQuery({
    queryKey: ["oc-dark-money", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_dark_money").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: tradeAssociations } = useQuery({
    queryKey: ["oc-trade-assoc", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_trade_associations").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Build sections matching the requested structure

  const sections: OfferCheckSection[] = [];

  // 1. Company Overview (always present)
  const overviewSignals: OfferCheckSignal[] = [];
  if (company) {
    overviewSignals.push({ type: "Industry", description: `Industry: ${company.industry}`, confidence: "Direct Source" });
    overviewSignals.push({ type: "Location", description: `Headquartered in: ${company.state}`, confidence: "Direct Source" });
    if (company.employee_count) overviewSignals.push({ type: "Size", description: `Approximate size: ${company.employee_count} employees`, confidence: "Direct Source" });
    if (company.parent_company) overviewSignals.push({ type: "Parent Company", description: `Parent company: ${company.parent_company}`, confidence: "Direct Source" });
    overviewSignals.push({ type: "Data Confidence", description: `Overall confidence rating: ${company.confidence_rating}`, confidence: mapConfidence(company.confidence_rating) });
  }
  sections.push({ id: "overview", title: "Company Overview", signals: overviewSignals, stale: false, hasData: overviewSignals.length > 0 });

  // 2. Influence Signals
  const influenceSignals: OfferCheckSignal[] = [];
  if (company?.total_pac_spending && company.total_pac_spending > 0) {
    influenceSignals.push({ type: "Corporate PAC", description: `Total PAC spending detected: $${company.total_pac_spending.toLocaleString()}`, confidence: "Direct Source", detectionMethod: "government filing" });
  }
  if (company?.lobbying_spend && company.lobbying_spend > 0) {
    influenceSignals.push({ type: "Lobbying", description: `Lobbying expenditure detected: $${company.lobbying_spend.toLocaleString()}`, confidence: "Direct Source", detectionMethod: "government filing" });
  }
  if (company?.government_contracts && company.government_contracts > 0) {
    influenceSignals.push({ type: "Government Contracts", description: `Government contracts detected: $${company.government_contracts.toLocaleString()}`, confidence: "Direct Source", detectionMethod: "USASpending.gov" });
  }
  candidates?.forEach(c => {
    influenceSignals.push({ type: "Candidate Donation", description: `Donation to ${c.name} (${c.party}, ${c.state}): $${c.amount.toLocaleString()}`, confidence: "Direct Source", detectionMethod: "FEC filing" });
  });
  darkMoney?.forEach(d => {
    influenceSignals.push({ type: "Dark Money", description: `${d.relationship} with ${d.name} (${d.org_type})${d.estimated_amount ? `: ~$${d.estimated_amount.toLocaleString()}` : ''}`, confidence: mapConfidence(d.confidence), evidenceText: d.description || undefined });
  });
  sections.push({ id: "civic", title: "Influence Signals", signals: influenceSignals, stale: false, hasData: influenceSignals.length > 0 });

  // 3. Hiring Technology & AI Use
  const hiringSignals: OfferCheckSignal[] = [];
  aiHr?.forEach((s: any) => {
    hiringSignals.push({ type: s.signal_category || "Hiring Tech", description: s.signal_type + (s.vendor_name ? ` (Vendor: ${s.vendor_name})` : ""), confidence: mapConfidence(s.confidence), sourceUrl: s.source_url, evidenceText: s.evidence_text, detectedAt: s.date_detected, lastVerified: s.last_verified, detectionMethod: s.detection_method });
  });
  const hiringStaleDates = (aiHr || []).map((s: any) => s.last_verified || s.date_detected);
  sections.push({ id: "hiring-tech", title: "Hiring Technology & AI Use Signals", signals: hiringSignals, stale: hiringStaleDates.length > 0 && hiringStaleDates.every(d => isStale(d)), hasData: hiringSignals.length > 0 });

  // 4. Worker Benefits Signals
  const benefitSignals: OfferCheckSignal[] = [];
  benefits?.forEach((s: any) => {
    benefitSignals.push({ type: "Worker Benefit", description: `${s.benefit_category}: ${s.benefit_type}`, confidence: mapConfidence(s.confidence), sourceUrl: s.source_url, evidenceText: s.evidence_text, detectedAt: s.date_detected, lastVerified: s.last_verified, detectionMethod: s.detection_method });
  });
  sections.push({ id: "worker-benefits", title: "Worker Benefits Signals", signals: benefitSignals, stale: benefitSignals.length > 0 && benefits?.every((s: any) => isStale(s.last_verified || s.date_detected)), hasData: benefitSignals.length > 0 });

  // 5. Compensation Transparency Signals
  const compSignals: OfferCheckSignal[] = [];
  payEquity?.forEach((s: any) => {
    compSignals.push({ type: "Pay Equity", description: s.signal_type, confidence: mapConfidence(s.confidence), sourceUrl: s.source_url, evidenceText: s.evidence_text, detectedAt: s.date_detected, lastVerified: s.last_verified, detectionMethod: s.detection_method });
  });
  sections.push({ id: "compensation", title: "Compensation Transparency Signals", signals: compSignals, stale: compSignals.length > 0 && payEquity?.every((s: any) => isStale(s.last_verified || s.date_detected)), hasData: compSignals.length > 0 });

  // 6. Worker Sentiment Signals
  const sentimentSignals: OfferCheckSignal[] = [];
  if (sentiment) {
    if (sentiment.overall_rating) sentimentSignals.push({ type: "Overall Rating", description: `Overall worker satisfaction: ${sentiment.overall_rating}/5`, confidence: "Multi-Source", detectedAt: sentiment.created_at, detectionMethod: "review aggregation" });
    if (sentiment.ceo_approval) sentimentSignals.push({ type: "CEO Approval", description: `CEO approval rating: ${Math.round(sentiment.ceo_approval * 100)}%`, confidence: "Multi-Source", detectedAt: sentiment.created_at });
    if (sentiment.work_life_balance) sentimentSignals.push({ type: "Work-Life Balance", description: `Work-life balance rating: ${sentiment.work_life_balance}/5`, confidence: "Multi-Source", detectedAt: sentiment.created_at });
    if (sentiment.compensation_rating) sentimentSignals.push({ type: "Compensation Satisfaction", description: `Compensation satisfaction: ${sentiment.compensation_rating}/5`, confidence: "Multi-Source", detectedAt: sentiment.created_at });
    if (sentiment.ai_summary) sentimentSignals.push({ type: "AI Summary", description: sentiment.ai_summary, confidence: "Inferred Signal", detectedAt: sentiment.created_at, detectionMethod: "AI analysis" });
    const complaints = (sentiment.top_complaints as any[]) || [];
    complaints.forEach((c: any) => {
      sentimentSignals.push({ type: "Recurring Concern", description: `${c.theme}: "${c.summary || c.text || ''}"`, confidence: "Multi-Source", detectedAt: sentiment.created_at });
    });
    const praises = (sentiment.top_praises as any[]) || [];
    praises.forEach((p: any) => {
      sentimentSignals.push({ type: "Positive Signal", description: `${p.theme}: "${p.summary || p.text || ''}"`, confidence: "Multi-Source", detectedAt: sentiment.created_at });
    });
  }
  sections.push({ id: "worker-sentiment", title: "Worker Sentiment Signals", signals: sentimentSignals, stale: sentiment ? isStale(sentiment.created_at) : false, hasData: sentimentSignals.length > 0 });

  // 7. Organizational Affiliation Signals
  const affiliationSignals: OfferCheckSignal[] = [];
  ideology?.forEach(f => {
    affiliationSignals.push({ type: f.category, description: `${f.relationship_type} with ${f.org_name}: ${f.description || 'Detected'}`, confidence: mapConfidence(f.confidence), sourceUrl: f.evidence_url, detectedAt: f.scan_date, detectionMethod: f.detected_by });
  });
  tradeAssociations?.forEach(t => {
    affiliationSignals.push({ type: "Trade Association", description: `Member of: ${t.name}`, confidence: "Direct Source" });
  });
  sections.push({ id: "affiliations", title: "Organizational Affiliation Signals", signals: affiliationSignals, stale: false, hasData: affiliationSignals.length > 0 });

  // 8. WARN Act Layoff Signals
  const warnSignals: OfferCheckSignal[] = [];
  warnNotices?.forEach((n: any) => {
    const date = n.notice_date ? new Date(n.notice_date).toLocaleDateString() : "Unknown date";
    const location = [n.location_city, n.location_state].filter(Boolean).join(", ");
    warnSignals.push({
      type: "WARN Notice",
      description: `${n.employees_affected?.toLocaleString() || "Unknown"} employees affected${location ? ` in ${location}` : ""} (${date})${n.reason ? ` — ${n.reason}` : ""}`,
      confidence: "Direct Source",
      sourceUrl: n.source_url,
      detectedAt: n.notice_date,
      detectionMethod: "WARN Act filing",
    });
  });
  sections.push({ id: "warn-layoffs", title: "WARN Act Layoff Notices", signals: warnSignals, stale: false, hasData: warnSignals.length > 0 });

  // 9. Public Statement vs Observed Signals
  const sayDoSignals: OfferCheckSignal[] = [];
  publicStances?.forEach(s => {
    sayDoSignals.push({ type: "Say-Do Gap", description: `${s.topic}: States "${s.public_position}" — Observed: "${s.spending_reality}" (Gap: ${s.gap})`, confidence: "Multi-Source" });
  });
  const hypoFlags = (sentiment?.hypocrisy_flags as any[]) || [];
  hypoFlags.forEach((h: any) => {
    sayDoSignals.push({ type: "Hypocrisy Flag", description: h.description || h.text || "Contradiction detected between public stance and observed practice", confidence: "Inferred Signal" });
  });
  sections.push({ id: "say-do", title: "Public Statement vs Observed Signals", signals: sayDoSignals, stale: false, hasData: sayDoSignals.length > 0 });

  // 9. Confidence Rating summary
  const confidenceSignals: OfferCheckSignal[] = [];
  const directCount = sections.reduce((n, s) => n + s.signals.filter(sig => sig.confidence === "Direct Source").length, 0);
  const multiCount = sections.reduce((n, s) => n + s.signals.filter(sig => sig.confidence === "Multi-Source").length, 0);
  const inferredCount = sections.reduce((n, s) => n + s.signals.filter(sig => sig.confidence === "Inferred Signal").length, 0);
  if (directCount > 0) confidenceSignals.push({ type: "Direct Source", description: `${directCount} signal${directCount !== 1 ? 's' : ''} from official filings or direct disclosures`, confidence: "Direct Source" });
  if (multiCount > 0) confidenceSignals.push({ type: "Multi-Source", description: `${multiCount} signal${multiCount !== 1 ? 's' : ''} corroborated across multiple sources`, confidence: "Multi-Source" });
  if (inferredCount > 0) confidenceSignals.push({ type: "Inferred", description: `${inferredCount} signal${inferredCount !== 1 ? 's' : ''} from indirect public evidence`, confidence: "Inferred Signal" });
  sections.push({ id: "review", title: "Confidence Rating", signals: confidenceSignals, stale: false, hasData: confidenceSignals.length > 0 });

  const tiCategories = [
    { key: "civic-influence", label: "Civic Influence", hasSignals: influenceSignals.length > 0 },
    { key: "hiring-technology", label: "Hiring Technology", hasSignals: hiringSignals.length > 0 },
    { key: "worker-benefits", label: "Worker Benefits", hasSignals: benefitSignals.length > 0 },
    { key: "compensation-transparency", label: "Compensation Transparency", hasSignals: compSignals.length > 0 },
    { key: "worker-sentiment", label: "Worker Sentiment", hasSignals: sentimentSignals.length > 0 },
    { key: "organizational-affiliation", label: "Organizational Affiliations", hasSignals: affiliationSignals.length > 0 },
    { key: "say-do-gap", label: "Public Statement vs Observed", hasSignals: sayDoSignals.length > 0 },
  ];

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