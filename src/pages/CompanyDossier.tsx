import { useMemo, useState } from "react";
import { AdvocacyReport } from "@/components/dossier/AdvocacyReport";
import { CandidatePrepPack } from "@/components/dossier/CandidatePrepPack";
import { HardInterviewQuestions } from "@/components/dossier/HardInterviewQuestions";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CompanyZeroState } from "@/components/CompanyZeroState";
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

export default function CompanyDossier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCompanyTracked } = useTrackedCompanies();
  const [showPrep, setShowPrep] = useState(false);
  const [showRawLayers, setShowRawLayers] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string | null>(null);

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

    if ((company.total_pac_spending ?? 0) > 0) {
      records.push({
        eventType: "PAC Contribution", category: "Political Spending", date: null,
        amount: company.total_pac_spending ?? 0,
        description: `Corporate PAC spending totaling $${(company.total_pac_spending ?? 0).toLocaleString()} on public record.`,
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
    if ((company.lobbying_spend ?? 0) > 0) {
      records.push({
        eventType: "Lobbying Expenditure", category: "Lobbying", date: null,
        amount: company.lobbying_spend ?? 0,
        description: `Reported lobbying spend: $${(company.lobbying_spend ?? 0).toLocaleString()}.`,
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
  }, [company, executives, contracts, eeocCases, issueSignals]);

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
      {/* ── ABOVE THE FOLD: Company + Verdict + Top Signals ── */}
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-primary mb-4">
          Employer Intelligence Report
        </p>

        <div className="flex items-start gap-4 mb-5">
          <CompanyLogo companyName={company.name} logoUrl={company.logo_url} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight">
              {company.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {company.industry} · {company.state}
              {company.employee_count && ` · ${company.employee_count} employees`}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>

        {/* ── VERDICT CARD ── */}
        <div className={cn("rounded-xl border p-5 mb-5", verdict.bg, verdict.border)}>
          <div className="flex items-center gap-2.5">
            <verdict.Icon className={cn("w-5 h-5", verdict.color)} />
            <Badge variant="outline" className={cn("text-sm font-semibold px-3 py-0.5", verdict.color, verdict.border)}>
              {verdict.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on political spending, labor record, enforcement history, and transparency disclosures from public sources.
          </p>
        </div>

        {/* ── TOP SIGNALS ── */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Top Signals</h2>
          <div className="space-y-2">
            {displaySignals.map((signal, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{signal.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{signal.explanation}</p>
                  </div>
                  <SourceLabel tier={signal.tier} className="shrink-0 mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {isTracked && (
          <Badge className="bg-primary/10 text-primary text-xs mb-4">Tracked</Badge>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
          This is a background check on the employer — built from public records, not opinions.
          Every signal traces back to a source. Use it before you apply, interview, or sign.
        </p>
      </div>

      {/* No-data fallback */}
      {hasNoData && (
        <Card className="mb-6 border-dashed border-border/60 bg-muted/20 rounded-none">
          <CardContent className="p-6 text-center">
            <FileSearch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">We don't have receipts on this company yet.</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Our research team hasn't completed a full scan. You can request one below.
            </p>
            <div className="flex flex-col items-center gap-4">
              <CompanyZeroState companyName={company.name} />
              <AuditRequestForm companyName={company.name} />
            </div>
          </CardContent>
        </Card>
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
        </div>
      )}
    </>
  );

  return (
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
    </section>
  );
}
