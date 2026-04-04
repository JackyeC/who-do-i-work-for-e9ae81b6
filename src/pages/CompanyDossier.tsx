import { useMemo, useState, useEffect } from "react";
import { AdvocacyReport } from "@/components/dossier/AdvocacyReport";
import { CandidatePrepPack } from "@/components/dossier/CandidatePrepPack";
import { HardInterviewQuestions } from "@/components/dossier/HardInterviewQuestions";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CompanyZeroState } from "@/components/CompanyZeroState";
import { OfferIntelligencePanel } from "@/components/company/OfferIntelligencePanel";
import { WarnFilingsCard } from "@/components/company/WarnFilingsCard";
import { CompanyCoverageSummary } from "@/components/company/CompanyCoverageSummary";
import { SignalTimeline } from "@/components/company/SignalTimeline";
import { MediaSignalSummary } from "@/components/company/MediaSignalSummary";
import { useQuery } from "@tanstack/react-query";
import { usePageSEO } from "@/hooks/use-page-seo";
import { getOGImageUrl } from "@/lib/social-share";
import {
  Building2, Loader2, Sparkles, Users, Heart, FileSearch, FileText,
  BarChart3, Landmark, Eye, AlertTriangle, ChevronDown, ArrowRight,
  ShieldCheck, XCircle as XCircleIcon,
} from "lucide-react";
import { SourceLabel, type SourceTier } from "@/components/ui/source-label";
import { supabase } from "@/integrations/supabase/client";
import { AuditRequestForm } from "@/components/AuditRequestForm";
import { Skeleton } from "@/components/ui/skeleton";
import { DossierLayer, TransparencyDisclaimer } from "@/components/dossier/DossierLayout";
import { DossierProtector } from "@/components/dossier/DossierProtector";
import { useTrackedCompanies } from "@/hooks/use-tracked-companies";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Badge } from "@/components/ui/badge";
import { ExportDossierButton } from "@/components/dossier/ExportDossierButton";
import { useEEOCByCompanyName } from "@/hooks/use-eeoc-cases";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmployerReportDrawer, type EvidenceRecord } from "@/components/dossier/EmployerReportDrawer";
import { SignalRevealCard } from "@/components/dossier/SignalRevealCard";
import { PowerInfluenceView } from "@/components/dossier/PowerInfluenceView";
import { ApplyWithWDIWF } from "@/components/applications/ApplyWithWDIWF";
import { useEvaluation } from "@/contexts/EvaluationContext";
import { EvaluationView } from "@/components/evaluation/EvaluationView";
import { DossierVerdictHeader } from "@/components/evaluation/DossierVerdictHeader";
import { DossierSnapshotCards } from "@/components/evaluation/DossierSnapshotCards";
import { WhatThisMeansForYou } from "@/components/evaluation/WhatThisMeansForYou";
import { DossierActionBridge } from "@/components/evaluation/DossierActionBridge";

// Deep-dive layer components (power-user expandable)
import { ValuesSignalsLayer } from "@/components/dossier/ValuesSignalsLayer";
import { TalentContextLayer } from "@/components/dossier/TalentContextLayer";
import { WorkforceDemographicsLayer } from "@/components/dossier/WorkforceDemographicsLayer";
import { InfluencePolicyLayer } from "@/components/dossier/InfluencePolicyLayer";
import { PoliticalGivingCard } from "@/components/giving/PoliticalGivingCard";
import { ExecutiveGivingSection } from "@/components/giving/ExecutiveGivingCard";
import { InstitutionalDNACard } from "@/components/dossier/InstitutionalDNACard";
import { InsiderScoreBreakdown } from "@/components/dossier/InsiderScoreBreakdown";
import { PatternsSynthesisLayer } from "@/components/dossier/PatternsSynthesisLayer";
import { HighRiskConnectionCard } from "@/components/company/HighRiskConnectionCard";
import { PolicyScoreCard } from "@/components/policy-intelligence/PolicyScoreCard";
import { StateWomenStatusCard } from "@/components/StateWomenStatusCard";
import { SourceDocumentsLayer } from "@/components/dossier/SourceDocumentsLayer";
import { AccountabilitySignalsLayer } from "@/components/dossier/AccountabilitySignalsLayer";
import { CompanyClaimsSection } from "@/components/dossier/CompanyClaimsSection";

export default function CompanyDossier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCompanyTracked } = useTrackedCompanies();
  const [showPrep, setShowPrep] = useState(false);
  const [showRawLayers, setShowRawLayers] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string | null>(null);
  const { setActiveCompany } = useEvaluation();

  /* ─── Data fetching ─── */
  const { data: company, isLoading } = useQuery({
    queryKey: ["dossier-company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const companyId = company?.id;
  const isTracked = companyId ? isCompanyTracked(companyId) : false;

  // Set evaluation context when company loads
  useEffect(() => {
    if (company) {
      setActiveCompany({
        id: company.id,
        name: company.name,
        slug: company.slug,
        industry: company.industry,
        state: company.state,
        civic_footprint_score: company.civic_footprint_score,
        employer_clarity_score: company.employer_clarity_score ?? undefined,
        career_intelligence_score: company.career_intelligence_score ?? undefined,
        employee_count: company.employee_count ?? undefined,
      });
    }
  }, [company, setActiveCompany]);
  const { data: eeocCases } = useEEOCByCompanyName(company?.name);

  const seoCompanyName = company?.name ?? "Company";
  usePageSEO({
    title: `${seoCompanyName} — Employer Intelligence Report | WDIWF`,
    description: `Before you apply to ${seoCompanyName}, see the receipts. Leadership stability, labor record, political spending, and values alignment — all from public sources.`,
    path: `/dossier/${id}`,
    image: getOGImageUrl({ type: "company", companyA: seoCompanyName }),
  });

  const { data: executives } = useQuery({
    queryKey: ["dossier-executives", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_executives").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: candidates } = useQuery({
    queryKey: ["dossier-candidates", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_candidates").select("*").eq("company_id", companyId!).order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: dossierBoardMembers } = useQuery({
    queryKey: ["dossier-board-members", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("board_members").select("*").eq("company_id", companyId!).order("name");
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: partyBreakdown } = useQuery({
    queryKey: ["dossier-party-breakdown", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_party_breakdown").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: lobbyingLinkages } = useQuery({
    queryKey: ["dossier-lobbying-linkages", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("entity_linkages").select("*").eq("company_id", companyId!).in("link_type", ["trade_association_lobbying", "lobbying_on_bill"]).order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: stateLobbyingData } = useQuery({
    queryKey: ["dossier-state-lobbying", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_state_lobbying").select("*").eq("company_id", companyId!).order("year", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: contracts } = useQuery({
    queryKey: ["dossier-contracts", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_agency_contracts").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: valuesSignals } = useQuery({
    queryKey: ["dossier-values", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("values_check_signals" as any).select("*").eq("company_id", companyId!);
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const { data: issueSignals } = useQuery({
    queryKey: ["dossier-issue-signals", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("issue_signals").select("issue_category, signal_type, description, amount, confidence_score, source_url, transaction_date").eq("entity_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: publicStances } = useQuery({
    queryKey: ["dossier-public-stances", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_public_stances").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  /* ─── Derived data ─── */
  const politicalGiving = useMemo(() => {
    if (!executives) return [];
    return executives
      .filter((e) => e.total_donations > 0)
      .map((e) => ({
        label: `${e.name} — ${e.title}`,
        summary: `Personal political donations totaling $${e.total_donations.toLocaleString()}`,
        sourceType: "FEC",
        confidence: "strong" as const,
        amount: e.total_donations,
      }));
  }, [executives]);

  const governmentContractSignals = useMemo(() => {
    if (!contracts) return [];
    return contracts.slice(0, 10).map((c) => ({
      label: c.agency_name,
      summary: c.contract_description || `Federal contract with ${c.agency_name}`,
      sourceType: c.source || "USAspending",
      confidence: c.confidence === "high" ? ("strong" as const) : c.confidence === "medium" ? ("likely" as const) : ("possible" as const),
      amount: c.contract_value || 0,
    }));
  }, [contracts]);

  // Snapshot card summaries — must be before early returns to preserve hook order
  const civicScoreEarly = company?.civic_footprint_score ?? 0;
  const snapshotData = useMemo(() => {
    if (!company) return { workerSummary: "", stabilitySummary: "", moneySummary: "", leadershipSummary: "" };
    const hasEEOCData = (eeocCases?.length || 0) > 0;
    const pacSpend = company.total_pac_spending ?? 0;
    const lobbySpend = company.lobbying_spend ?? 0;
    const execCount = (executives || []).length;
    const departedExecs = (executives || []).filter((e: any) => e.departed_at).length;

    return {
      workerSummary: hasEEOCData
        ? `${eeocCases!.length} EEOC filing(s) on record. That's worth understanding before you interview.`
        : civicScoreEarly >= 60
        ? "No enforcement red flags on file. Transparency score is above average."
        : "Limited public worker data. Ask about internal complaint processes in your interview.",
      stabilitySummary: company.employee_count
        ? `${company.employee_count} employees. Check the WARN filings section below for layoff history.`
        : "Employee count not publicly confirmed. WARN filing data shown below if available.",
      moneySummary: pacSpend > 0 || lobbySpend > 0
        ? `$${(pacSpend + lobbySpend).toLocaleString()} in political spending and lobbying on public record.`
        : "No significant political spending found in public filings.",
      leadershipSummary: execCount > 0
        ? `${execCount} executive(s) tracked.${departedExecs > 0 ? ` ${departedExecs} departed — turnover worth noting.` : " Leadership appears stable on paper."}`
        : "Executive data still being indexed. Check back or request an audit.",
    };
  }, [company, eeocCases, executives, civicScoreEarly]);
  const mappedValues = useMemo(() => {
    if (!valuesSignals) return [];
    return valuesSignals.map((s: any) => ({
      issueCategory: s.issue_category || s.signal_category || "General",
      summary: s.signal_summary || s.evidence_text || "",
      direction: s.signal_direction || "informational_signal",
      sourceUrl: s.source_url,
      verificationStatus: s.verification_status,
      confidence: s.confidence_score >= 0.8 ? ("strong" as const) : s.confidence_score >= 0.5 ? ("likely" as const) : ("possible" as const),
    }));
  }, [valuesSignals]);

  /* ─── Build evidence records for the full report drawer ─── */
  const evidenceRecords: EvidenceRecord[] = useMemo(() => {
    if (!company) return [];
    const records: EvidenceRecord[] = [];

    // --- Political Spending: prefer itemized recipients > party breakdown > aggregate total ---
    const hasCandidates = (candidates || []).length > 0;
    const hasPartyBreakdown = (partyBreakdown || []).length > 0;

    if (hasCandidates) {
      (candidates || []).forEach((c: any) => {
        records.push({
          eventType: "PAC Recipient", category: "Political Spending", date: null,
          amount: c.amount ?? 0,
          description: `${c.name} (${c.party}${c.state ? `, ${c.state}` : ""}) — ${c.donation_type || "PAC contribution"} of $${(c.amount ?? 0).toLocaleString()}.${c.flagged ? ` ⚠ ${c.flag_reason || "Flagged"}` : ""}`,
          sourceUrl: `https://www.fec.gov/data/disbursements/?recipient_name=${encodeURIComponent(c.name)}`, sourceName: "FEC",
        });
      });
    } else if (hasPartyBreakdown) {
      (partyBreakdown || []).forEach((p: any) => {
        records.push({
          eventType: "Party Allocation", category: "Political Spending", date: null,
          amount: p.amount ?? 0,
          description: `$${(p.amount ?? 0).toLocaleString()} directed to ${p.party} candidates and committees. Recipient-level detail is being indexed from FEC disbursement records.`,
          sourceUrl: "https://www.opensecrets.org/political-action-committees-pacs", sourceName: "FEC / OpenSecrets",
        });
      });
    } else if ((company.total_pac_spending ?? 0) > 0) {
      records.push({
        eventType: "PAC Total", category: "Political Spending", date: null,
        amount: company.total_pac_spending ?? 0,
        description: `Corporate PAC spending totaling $${(company.total_pac_spending ?? 0).toLocaleString()} on public record. Recipient-level receipts are still being indexed.`,
        sourceUrl: "https://www.opensecrets.org/political-action-committees-pacs", sourceName: "OpenSecrets / FEC",
      });
    }

    (executives || []).filter((e: any) => e.total_donations > 0).forEach((e: any) => {
      records.push({
        eventType: "Individual Donation", category: "Political Spending", date: null,
        amount: e.total_donations,
        description: `${e.name} (${e.title}) — personal political donations totaling $${e.total_donations.toLocaleString()}.`,
        sourceUrl: "https://www.fec.gov/data/receipts/individual-contributions/", sourceName: "FEC",
      });
    });

    // --- Lobbying: prefer entity_linkages > state lobbying > aggregate total ---
    const hasLobbyingLinkages = (lobbyingLinkages || []).length > 0;
    const hasStateLobby = (stateLobbyingData || []).length > 0;

    if (hasLobbyingLinkages) {
      (lobbyingLinkages || []).forEach((l: any) => {
        const meta = (() => { try { return JSON.parse(l.metadata || "{}"); } catch { return {}; } })();
        const citation = (() => { try { const c = JSON.parse(l.source_citation || "[]"); return c?.[0]?.url; } catch { return null; } })();
        records.push({
          eventType: "Lobbying Filing", category: "Lobbying",
          date: meta.filing_year ? `${meta.filing_year}-01-01` : null,
          amount: l.amount ?? 0,
          description: l.description || `Lobbying expenditure to ${l.target_entity_name}: $${(l.amount ?? 0).toLocaleString()}.`,
          sourceUrl: citation || "https://lda.senate.gov/filings/public/filing/search/",
          sourceName: "Senate LDA",
        });
      });
    } else if (hasStateLobby) {
      (stateLobbyingData || []).forEach((s: any) => {
        const issues = (s.issues || []).slice(0, 3).join(", ");
        records.push({
          eventType: "State Lobbying", category: "Lobbying",
          date: `${s.year}-01-01`, amount: s.lobbying_spend ?? 0,
          description: `State-level lobbying in ${s.state}: $${(s.lobbying_spend ?? 0).toLocaleString()}${issues ? ` on ${issues}` : ""}.`,
          sourceUrl: s.source || "https://lda.senate.gov/filings/public/filing/search/",
          sourceName: s.source || "State Records",
        });
      });
    } else if ((company.lobbying_spend ?? 0) > 0) {
      records.push({
        eventType: "Lobbying Total", category: "Lobbying", date: null,
        amount: company.lobbying_spend ?? 0,
        description: `Reported lobbying spend: $${(company.lobbying_spend ?? 0).toLocaleString()}. Filing-level detail is being indexed from Senate LDA records.`,
        sourceUrl: "https://www.opensecrets.org/federal-lobbying", sourceName: "OpenSecrets / LDA",
      });
    }

    (contracts || []).forEach((c: any) => {
      records.push({
        eventType: "Federal Contract", category: "Government Contracts", date: null,
        amount: c.contract_value ?? null,
        description: c.contract_description || `Federal contract with ${c.agency_name}`,
        sourceUrl: c.source || "https://www.usaspending.gov/", sourceName: c.source || "USAspending",
      });
    });
    (eeocCases || []).forEach((c: any) => {
      records.push({
        eventType: "EEOC Filing", category: "Enforcement & EEOC",
        date: c.filing_date || c.created_at || null, amount: c.settlement_amount ?? null,
        description: c.description || c.case_summary || `EEOC case filed against ${company.name}.`,
        sourceUrl: c.source_url || "https://www.eeoc.gov/", sourceName: "EEOC",
      });
    });
    (issueSignals || []).forEach((s: any) => {
      records.push({
        eventType: s.signal_type || "Signal", category: "Issue Signals",
        date: s.transaction_date || null, amount: s.amount ?? null,
        description: s.description || `${s.issue_category} signal detected.`,
        sourceUrl: s.source_url || null, sourceName: s.issue_category || "Multi-source",
      });
    });
    return records;
  }, [company, executives, candidates, partyBreakdown, lobbyingLinkages, stateLobbyingData, contracts, eeocCases, issueSignals]);

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-5 mb-8">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mb-4 border border-border/30 p-6">
            <Skeleton className="h-5 w-40 mb-3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
        ))}
      </section>
    );
  }

  /* ─── Not found ─── */
  if (!company) {
    const derivedName = id
      ? id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
      : "Unknown Company";

    return (
      <section className="px-6 py-16 max-w-2xl mx-auto">
        <CompanyZeroState
          companyName={derivedName}
          onDiscovered={(_, slug) => navigate(`/dossier/${slug}`)}
        />
      </section>
    );
  }

  const influenceScore = company.employer_clarity_score || 0;
  const civicScore = company.civic_footprint_score ?? 0;

  // Verdict logic
  const verdictScore = Math.max(civicScore, influenceScore);
  const verdict = verdictScore >= 60
    ? { label: "Low Risk", color: "text-civic-green", bg: "bg-civic-green/10", border: "border-civic-green/30", Icon: ShieldCheck }
    : verdictScore >= 35
    ? { label: "Medium Risk", color: "text-civic-yellow", bg: "bg-civic-yellow/10", border: "border-civic-yellow/30", Icon: AlertTriangle }
    : { label: "High Risk", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", Icon: XCircleIcon };

  // Build top signals from real data (max 5)
  const topSignals: { title: string; explanation: string; tier: SourceTier }[] = [];

  if ((company.total_pac_spending ?? 0) > 0) {
    topSignals.push({
      title: "Political Spending",
      explanation: `$${(company.total_pac_spending ?? 0).toLocaleString()} in PAC spending on public record.`,
      tier: "verified",
    });
  }
  if ((company.lobbying_spend ?? 0) > 0) {
    topSignals.push({
      title: "Lobbying Activity",
      explanation: `$${(company.lobbying_spend ?? 0).toLocaleString()} in reported lobbying expenditures.`,
      tier: "verified",
    });
  }
  if ((eeocCases?.length || 0) > 0) {
    topSignals.push({
      title: "EEOC Filings",
      explanation: `${eeocCases!.length} equal employment opportunity case(s) found in public records.`,
      tier: "verified",
    });
  }
  if ((issueSignals?.length || 0) > 0) {
    topSignals.push({
      title: "Issue Signals Detected",
      explanation: `${issueSignals!.length} policy or issue-related signal(s) identified across sources.`,
      tier: "multi_source",
    });
  }
  if (influenceScore > 0) {
    topSignals.push({
      title: "Employer Transparency",
      explanation: `Scored ${influenceScore}/100 based on available public evidence depth.`,
      tier: "multi_source",
    });
  }
  if (topSignals.length === 0) {
    topSignals.push({
      title: "Public Record Coverage",
      explanation: "Limited public data available for this company. A full scan may surface additional signals.",
      tier: "no_evidence",
    });
  }
  const displaySignals = topSignals.slice(0, 5);

  // No-data detection
  const hasNoData =
    influenceScore === 0 &&
    !company.jackye_insight &&
    !(company as any).description &&
    (company.total_pac_spending ?? 0) === 0 &&
    (company.lobbying_spend ?? 0) === 0 &&
    (issueSignals?.length || 0) === 0 &&
    (publicStances?.length || 0) === 0;



  /* ─── Signal → Report category mapping ─── */
  const SIGNAL_CATEGORY_MAP: Record<string, string> = {
    "Political Spending": "Political Spending",
    "Lobbying Activity": "Lobbying",
    "EEOC Filings": "Enforcement & EEOC",
    "Issue Signals Detected": "Issue Signals",
    "Employer Transparency": "",
    "Public Record Coverage": "",
  };

  const openReportToCategory = (category: string) => {
    setReportCategory(category);
    setReportOpen(true);
  };

  /* ─── Report header + advocacy report ─── */
  const overviewContent = (
    <>
      {/* ── ABOVE THE FOLD: Verdict Header + Snapshot Cards ── */}
      <DossierVerdictHeader company={company} />

      {/* ── Data Coverage + Signal Timeline + Media Intelligence ── */}
      <div className="mb-6 space-y-4">
        <CompanyCoverageSummary companyId={companyId!} companyName={company?.name} />
        <SignalTimeline companyId={companyId!} />
        <MediaSignalSummary companyId={companyId!} companyName={company.name} />
      </div>

      <DossierSnapshotCards data={snapshotData} />

      {/* Action buttons row */}
      <div className="flex items-center gap-2 mb-6">
        <ExportDossierButton companyId={companyId!} companyName={company.name} company={company} />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold"
          onClick={() => { setReportCategory(null); setReportOpen(true); }}
        >
          <FileText className="w-3.5 h-3.5" />
          View full report
          <ArrowRight className="w-3 h-3" />
        </Button>
        {isTracked && (
          <Badge className="bg-primary/10 text-primary text-xs ml-auto">Tracked</Badge>
        )}
      </div>

      {/* ── SIGNAL INTELLIGENCE BREAKDOWN ── */}
      <SignalIntelligenceBreakdown
        companyName={company.name}
        totalPacSpending={company.total_pac_spending ?? 0}
        lobbyingSpend={company.lobbying_spend ?? 0}
        candidates={(candidates || []) as any}
        executives={(executives || []).filter((e: any) => e.total_donations != null) as any}
        partyBreakdown={(partyBreakdown || []) as any}
        evidenceRecords={evidenceRecords}
        eeocCount={eeocCases?.length || 0}
        issueSignalCount={issueSignals?.length || 0}
        clarityScore={influenceScore}
      />

      <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mb-6">
        This is a background check on the employer — built from public records, not opinions.
        Every signal traces back to a source. Use it before you apply, interview, or sign.
      </p>

      {/* ── VERIFIED CLAIMS ── */}
      <CompanyClaimsSection companyId={companyId!} companyName={company.name} />

      {/* WARN Filings — always show when data exists */}
      {companyId && (
        <div className="mb-6" id="warn-filings">
          <WarnFilingsCard companyId={companyId} companyName={company.name} prominent />
        </div>
      )}

      {/* No-data fallback */}
      {hasNoData && (
        <OfferIntelligencePanel company={company} companyId={companyId!} />
      )}

      {/* ── THE ADVOCACY REPORT ── */}
      <AdvocacyReport
        company={{ ...company, id: companyId!, slug: company.slug } as any}
        executives={executives as any}
        contracts={contracts as any}
        issueSignals={issueSignals as any}
        publicStances={publicStances as any}
        eeocCases={eeocCases as any}
      />

      {/* ── WHAT THIS MEANS FOR YOU ── */}
      <WhatThisMeansForYou
        companyName={company.name}
        hasLayoffs={false}
        hasPoliticalSpending={(company.total_pac_spending ?? 0) > 0 || (company.lobbying_spend ?? 0) > 0}
        hasEEOC={(eeocCases?.length || 0) > 0}
        civicScore={civicScore}
        employeeCount={company.employee_count}
      />

      {/* ── ACTION BRIDGE ── */}
      <DossierActionBridge
        companyId={companyId!}
        companyName={company.name}
        companySlug={company.slug}
        alignmentScore={company.civic_footprint_score}
        civicScore={civicScore}
        hasLayoffs={false}
        hasEEOC={(eeocCases?.length || 0) > 0}
        hasPoliticalSpending={(company.total_pac_spending ?? 0) > 0 || (company.lobbying_spend ?? 0) > 0}
      />

      {/* ── INTERVIEW PREP ── */}
      <div className="mt-8">
        <button
          onClick={() => setShowPrep(!showPrep)}
          className={cn(
            "w-full flex items-center justify-between px-6 py-4 border text-left transition-colors",
            showPrep
              ? "border-primary/30 bg-primary/5"
              : "border-border/40 bg-card hover:bg-muted/30"
          )}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Interview Prep</p>
              <p className="text-xs text-muted-foreground">What to say, what to ask, what to avoid</p>
            </div>
          </div>
          <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", showPrep && "rotate-180")} />
        </button>
        {showPrep && (
          <div className="border border-t-0 border-border/40 p-6">
            <CandidatePrepPack companyId={companyId} companyName={company.name} />
          </div>
        )}
      </div>

      {/* ── RAW DATA LAYERS (power users) ── */}
      <div className="mt-4">
        <button
          onClick={() => setShowRawLayers(!showRawLayers)}
          className="w-full flex items-center justify-between px-6 py-3 border border-border/30 bg-background hover:bg-muted/20 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Raw Data Layers
            </span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showRawLayers && "rotate-180")} />
        </button>
      </div>

      {showRawLayers && (
        <div className="mt-4 space-y-4">
          <DossierLayer title="Values Filter" subtitle="Evidence-based filtering across 14 issue lenses" icon={Heart} layerNumber={1} defaultOpen>
            <ValuesSignalsLayer signals={mappedValues} companyName={company.name} />
          </DossierLayer>

          <DossierLayer title="Workforce Signals" subtitle="WARN notices, hiring stability, workforce signals" icon={Users} layerNumber={2} defaultOpen>
            <TalentContextLayer signals={[]} companyName={company.name} />
          </DossierLayer>

          <DossierLayer title="Workforce Demographics" subtitle="Role distribution, pay equity, diversity, and promotion signals" icon={BarChart3} layerNumber={3}>
            <WorkforceDemographicsLayer companyId={companyId!} companyName={company.name} />
          </DossierLayer>

          {company.state && (
            <StateWomenStatusCard stateCode={company.state} companyName={company.name} />
          )}

          <DossierLayer title="Influence & Policy Signals" subtitle="PAC giving, lobbying, government contracts" icon={Landmark} layerNumber={4}>
            <InfluencePolicyLayer
              politicalGiving={politicalGiving}
              lobbyingActivity={[]}
              governmentContracts={governmentContractSignals}
              policyLinks={[]}
            />
            {companyId && (
              <div className="mt-6 space-y-6">
                <HighRiskConnectionCard companyId={companyId} companyName={company.name} />
                <InstitutionalDNACard companyId={companyId} companyName={company.name} />
                <PolicyScoreCard companyId={companyId} companyName={company.name} />
              </div>
            )}
          </DossierLayer>

          {companyId && (
            <DossierLayer title="Political Giving" subtitle="PAC spending, lobbying, institutional links" icon={Landmark} layerNumber={5}>
              <PoliticalGivingCard companyId={companyId} companyName={company.name} companySlug={company.slug} />
            </DossierLayer>
          )}

          {companyId && (
            <DossierLayer title="Leadership Political Giving" subtitle="Individual executive donation records from FEC public filings" icon={Users} layerNumber={6}>
              <ExecutiveGivingSection companyId={companyId} companyName={company.name} companySlug={company.slug} />
            </DossierLayer>
          )}

          <DossierLayer title="Connected Dots" subtitle="Leadership network concentration and hiring pattern transparency" icon={Eye} layerNumber={7}>
            <InsiderScoreBreakdown companyId={companyId!} companyName={company.name} insiderScore={(company as any).insider_score ?? null} />
          </DossierLayer>

          <DossierLayer title="Patterns & Synthesis" subtitle="Key observations and notable patterns" icon={Sparkles} layerNumber={8}>
            <PatternsSynthesisLayer patterns={[]} companyName={company.name} />
          </DossierLayer>

          {companyId && (
            <DossierLayer title="Source Documents" subtitle="Primary-source filings, reports, and disclosures" icon={FileSearch} layerNumber={9}>
              <SourceDocumentsLayer companyId={companyId} companyName={company.name} />
            </DossierLayer>
          )}

          {companyId && (
            <DossierLayer title="Accountability Signals" subtitle="Power, conduct, governance, and narrative gap patterns from public records" icon={ShieldCheck} layerNumber={10}>
              <AccountabilitySignalsLayer companyId={companyId} companyName={company.name} />
            </DossierLayer>
          )}
        </div>
      )}
    </>
  );

  return (
    <EvaluationView hideVerdict>
    <section className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="space-y-4">
        <DossierProtector
          companyId={companyId!}
          companyName={company.name}
          influenceScore={influenceScore}
          overviewContent={overviewContent}
          fullContent={null}
        />

        {/* ── HARD INTERVIEW QUESTIONS (always free, outside paywall) ── */}
        <HardInterviewQuestions
          companyName={company.name}
          lobbyingSpend={company.lobbying_spend}
          eeocCount={eeocCases?.length || 0}
        />

        <TransparencyDisclaimer />

        {/* ── EXPLORE MORE (secondary tools, demoted) ── */}
        <div className="mt-6">
          <button
            onClick={() => setShowSecondary(!showSecondary)}
            className="w-full flex items-center justify-between px-5 py-3 border border-border/40 bg-card hover:bg-muted/20 transition-colors text-left"
          >
            <span className="text-sm font-medium text-muted-foreground">Explore more</span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showSecondary && "rotate-180")} />
          </button>
          {showSecondary && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/offer-check"
                className="flex items-center gap-3 p-4 border border-border/40 bg-card hover:bg-muted/30 transition-colors group"
              >
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Got an offer from {company.name}?
                  </p>
                  <p className="text-xs text-muted-foreground">Quick risk check before you sign →</p>
                </div>
              </Link>
              <Link
                to="/ask-jackye"
                className="flex items-center gap-3 p-4 border border-border/40 bg-card hover:bg-muted/30 transition-colors group"
              >
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Ask Jackye about {company.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Should I apply? What should I negotiate? →</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      <EmployerReportDrawer
        open={reportOpen}
        onOpenChange={setReportOpen}
        companyName={company.name}
        records={evidenceRecords}
        initialCategory={reportCategory}
      />
    </section>
    </EvaluationView>
  );
}
