import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCompanyIntelligence } from "@/hooks/use-company-intelligence";
import { motion } from "framer-motion";
import { Building2, ArrowLeft, EyeOff, Loader2, Sparkles, Search, Scan, ExternalLink, FileSearch } from "lucide-react";
import { AuditRequestForm } from "@/components/AuditRequestForm";
import { IntegrityIndicators } from "@/components/company/IntegrityIndicators";
import { CareerFitReportCTA } from "@/components/CareerFitReportCTA";
import { JackyesInsightBlock } from "@/components/company/JackyesInsightBlock";
import { CompanyLogo } from "@/components/CompanyLogo";
import { WatchCompanyButton } from "@/components/WatchCompanyButton";
import { ShareableScorecard } from "@/components/ShareableScorecard";
import { CandidateDetailDrawer } from "@/components/CandidateDetailDrawer";
import { ExecutiveDetailDrawer } from "@/components/ExecutiveDetailDrawer";
import { LobbyingDetailDrawer } from "@/components/LobbyingDetailDrawer";
import { PACDetailDrawer } from "@/components/PACDetailDrawer";
import { ContractsDetailDrawer } from "@/components/ContractsDetailDrawer";
import { AdminCompanyActions } from "@/components/AdminCompanyActions";
import { InsiderBriefSection } from "@/components/company/InsiderBriefSection";
import { StructuredSignalsSection } from "@/components/company/StructuredSignalsSection";
import { HowToReadThis } from "@/components/company/HowToReadThis";
import { UpgradeMoment } from "@/components/company/UpgradeMoment";
import { ValuesSignalMatch } from "@/components/company/ValuesSignalMatch";
import { RealityGapBlock } from "@/components/company/RealityGapBlock";
import { DecisionCheckpointBeforeSign } from "@/components/company/DecisionCheckpointBeforeSign";
import { InnovationSignals } from "@/components/company/InnovationSignals";
import { RecruiterIntegrityCard, RecruiterIntegrityCardSkeleton } from "@/components/company/RecruiterIntegrityCard";
import { useCompanyIntegrity } from "@/hooks/use-company-integrity";
import { LeadershipInfluenceSection } from "@/components/company/LeadershipInfluenceSection";
import { WhatToWatch } from "@/components/company/WhatToWatch";
import { WhatToAsk } from "@/components/company/WhatToAsk";
import { ReportTeaserGate } from "@/components/ReportTeaserGate";
import { PostReportNudge } from "@/components/PostReportNudge";
import { ContentProtector } from "@/components/ContentProtector";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { companies, formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCompanySEO } from "@/hooks/use-company-seo";
import { useToast } from "@/hooks/use-toast";
import { useScanTracker } from "@/hooks/use-scan-tracker";

/* ─── Status labels ─── */
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  discovered: { label: "Discovered", color: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  identity_matched: { label: "Identity Verified", color: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30" },
  research_in_progress: { label: "Research In Progress", color: "bg-primary/10 text-primary border-primary/30" },
  partially_verified: { label: "Partially Verified", color: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  verified: { label: "Verified", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
  failed_to_verify: { label: "Unverified", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default function CompanyProfile() {
  const { id } = useParams();
  const company = companies.find((c) => c.id === id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false);
  const [selectedExecutive, setSelectedExecutive] = useState<any>(null);
  const [executiveDrawerOpen, setExecutiveDrawerOpen] = useState(false);
  const [lobbyingDrawerOpen, setLobbyingDrawerOpen] = useState(false);
  const [pacDrawerOpen, setPacDrawerOpen] = useState(false);
  const [contractsDrawerOpen, setContractsDrawerOpen] = useState(false);

  const handleCandidateClick = useCallback((candidate: any) => {
    setSelectedCandidate(candidate);
    setCandidateDrawerOpen(true);
  }, []);

  const handleExecutiveClick = useCallback((executive: any) => {
    setSelectedExecutive(executive);
    setExecutiveDrawerOpen(true);
  }, []);

  // ─── DB Queries ───
  const { data: dbCompany, isLoading: dbLoading } = useQuery({
    queryKey: ["company-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("slug", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.record_status;
      if (status && ["discovered", "identity_matched", "research_in_progress"].includes(status)) return 10000;
      return false;
    },
  });

  const dbCompanyId = dbCompany?.id;
  const isResearching = dbCompany && ["discovered", "identity_matched", "research_in_progress"].includes((dbCompany as any)?.record_status || "");
  const pollInterval = isResearching ? 10000 : false;

  const { data: dbCandidates } = useQuery({
    queryKey: ["company-candidates", dbCompanyId],
    queryFn: async () => { const { data } = await supabase.from("company_candidates").select("*").eq("company_id", dbCompanyId!).order("amount", { ascending: false }); return data || []; },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  const { data: dbExecutives } = useQuery({
    queryKey: ["company-executives", dbCompanyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_executives").select("*").eq("company_id", dbCompanyId!).order("total_donations", { ascending: false });
      return (data || []).map((e: any) => ({ ...e, last_verified_at: e.last_verified_at || null }));
    },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  const { data: dbPartyBreakdown } = useQuery({
    queryKey: ["company-party-breakdown", dbCompanyId],
    queryFn: async () => { const { data } = await supabase.from("company_party_breakdown").select("*").eq("company_id", dbCompanyId!); return data || []; },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  const { data: dbPublicStances } = useQuery({
    queryKey: ["company-public-stances", dbCompanyId],
    queryFn: async () => { const { data } = await supabase.from("company_public_stances").select("*").eq("company_id", dbCompanyId!); return data || []; },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  const { data: dbDarkMoney } = useQuery({
    queryKey: ["company-dark-money", dbCompanyId],
    queryFn: async () => { const { data } = await supabase.from("company_dark_money").select("*").eq("company_id", dbCompanyId!); return data || []; },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  const { data: dbRevolvingDoor } = useQuery({
    queryKey: ["company-revolving-door", dbCompanyId],
    queryFn: async () => { const { data } = await supabase.from("company_revolving_door").select("*").eq("company_id", dbCompanyId!); return data || []; },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  const { data: dbTradeAssociations } = useQuery({
    queryKey: ["company-trade-assoc", dbCompanyId],
    queryFn: async () => { const { data } = await supabase.from("company_trade_associations").select("id").eq("company_id", dbCompanyId!); return data || []; },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  const { data: dbIssueSignals } = useQuery({
    queryKey: ["company-issue-signals", dbCompanyId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("issue_signals").select("issue_category, signal_type, description, amount, confidence_score, source_url").eq("entity_id", dbCompanyId!).order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  // Transparency counts
  const { data: tiAiHr } = useQuery({ queryKey: ["ti-ai-hr", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("ai_hr_signals" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiBenefits } = useQuery({ queryKey: ["ti-benefits", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("worker_benefit_signals" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiPayEquity } = useQuery({ queryKey: ["ti-pay", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("pay_equity_signals" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiSentiment } = useQuery({ queryKey: ["ti-sentiment", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("company_worker_sentiment" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: dbBoardMembers } = useQuery({
    queryKey: ["board-members-full", dbCompanyId],
    queryFn: async () => { const { data } = await (supabase as any).from("board_members").select("id, name, title, is_independent, departed_at, verification_status, bio, committees, previous_company, start_year, photo_url, source, last_verified_at").eq("company_id", dbCompanyId!); return data || []; },
    enabled: !!dbCompanyId,
  });

  // ─── Jobs Data ───
  const { data: dbJobs } = useQuery({
    queryKey: ["company-jobs", dbCompanyId],
    queryFn: async () => {
      const { data, count } = await supabase
        .from("company_jobs")
        .select("id, title, location, work_mode, department, url, posted_at, salary_range, source_platform", { count: "exact" })
        .eq("company_id", dbCompanyId!)
        .eq("is_active", true)
        .order("posted_at", { ascending: false })
        .limit(20);
      return { jobs: data || [], count: count || 0 };
    },
    enabled: !!dbCompanyId,
  });

  const activeJobCount = dbJobs?.count || 0;
  const hasJobPostings = activeJobCount > 0;

  const seoTarget = dbCompany || (company ? { name: company.name, industry: company.industry || "", state: company.state || "", description: "", slug: company.id } : null);
  useCompanySEO({ name: seoTarget?.name || "", industry: seoTarget?.industry || "", state: seoTarget?.state || "", description: (seoTarget as any)?.description || "", slug: id || seoTarget?.slug || "", score: dbCompany?.civic_footprint_score });

  useScanTracker(dbCompany?.id || undefined, dbCompany?.name || company?.name);

  // Recruiter integrity check (must be before early returns)
  const integrityName = dbCompany?.name || company?.name;
  const { data: integrityResult, isLoading: integrityLoading } = useCompanyIntegrity(integrityName || undefined, id);

  const {
    reports: intelligenceReports,
    refreshSection,
  } = useCompanyIntelligence({
    companyId: dbCompanyId,
    companyName: dbCompany?.name || company?.name,
    autoRefreshStale: true,
  });

  // ─── Full Scan Handler ───
  const handleFullScan = async () => {
    const companyName = dbCompany?.name || company?.name || id?.replace(/-/g, ' ');
    if (!companyName) {
      toast({ title: "No company identified", description: "Could not determine company name.", variant: "destructive" });
      return;
    }
    setIsScanning(true);
    try {
      // If company isn't in DB yet, discover it first
      if (!dbCompany) {
        toast({ title: "Discovering company…", description: `"${companyName}" isn't in our database yet. Starting discovery scan.` });
        const { data: discoverData, error: discoverError } = await supabase.functions.invoke("company-research", { body: { companyName } });
        if (discoverError) throw discoverError;
        if (discoverData?.success) {
          const count = Object.values(discoverData.tablesPopulated || {}).reduce((a: number, b: any) => a + (b as number), 0);
          toast({ title: "Discovery complete", description: `Found ${count} records for ${companyName}. Reloading…` });
          queryClient.invalidateQueries({ queryKey: ["company-profile", id] });
        } else {
          throw new Error(discoverData?.error || "Discovery failed");
        }
        return;
      }

      const { data, error } = await supabase.functions.invoke("company-research", { body: { companyName: dbCompany.name, enrichExisting: true } });
      if (error) throw error;
      if (data?.success) {
        const count = Object.values(data.tablesPopulated || {}).reduce((a: number, b: any) => a + (b as number), 0);
        toast({ title: "Scan complete", description: `Found ${count} records for ${dbCompany.name}.` });
        const keys = ["company-profile", "company-candidates", "company-executives", "company-party-breakdown", "company-public-stances", "company-dark-money", "company-revolving-door", "company-trade-assoc", "company-issue-signals", "ti-ai-hr", "ti-benefits", "ti-pay", "ti-sentiment", "company-patents", "company-jobs"];
        keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      } else { throw new Error(data?.error || "Scan failed"); }
    } catch (e: any) {
      const msg = e.message || '';
      const isProviderError = /insufficient|credits|timeout|non-2xx|502|503|firecrawl|scraping/i.test(msg);
      toast({
        title: isProviderError ? "Live refresh temporarily unavailable" : "Scan issue",
        description: isProviderError ? "Showing the most recent saved intelligence." : (msg || "Something went wrong. Please try again."),
        variant: isProviderError ? undefined : "destructive",
      });
    } finally { setIsScanning(false); }
  };

  // ─── Loading / Not Found ───
  if (!company && dbLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayCompany = dbCompany || company;

  if (!displayCompany) {
    const companyNameFromSlug = id?.replace(/-/g, ' ') || "this company";
    return (
      <div className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <Link to="/browse" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to directory
        </Link>
        <AuditRequestForm companyName={companyNameFromSlug} />
        <div className="mt-6">
          <CareerFitReportCTA companyName={companyNameFromSlug} variant="inline" />
        </div>
      </div>
    );
  }

  // Normalize fields
  const name = dbCompany?.name || company?.name || "";
  const industry = dbCompany?.industry || company?.industry || "";
  const state = dbCompany?.state || company?.state || "";
  const civicScore = dbCompany?.civic_footprint_score ?? company?.civicFootprintScore ?? 0;
  const totalPac = dbCompany?.total_pac_spending ?? company?.totalPacSpending ?? 0;
  const lobbyingSpend = dbCompany?.lobbying_spend ?? company?.lobbyingSpend ?? 0;
  const govContracts = dbCompany?.government_contracts ?? company?.governmentContracts ?? 0;
  const subsidies = dbCompany?.subsidies_received ?? company?.subsidiesReceived ?? 0;

  // Recruiter integrity check
  // integrityResult & integrityLoading already declared above early returns
  const recordStatus = (dbCompany as any)?.record_status || "verified";
  const statusInfo = STATUS_LABELS[recordStatus] || STATUS_LABELS.verified;
  const isDiscovering = isResearching;

  return (
    <ContentProtector className="flex flex-col min-h-0">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Breadcrumb */}
        <Link to="/browse" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to directory
        </Link>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

          {/* ═══════════════════════════════════════════════════════
              COMPACT HEADER
             ═══════════════════════════════════════════════════════ */}
          <Card className="mb-6 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <CompanyLogo
                  companyId={dbCompany?.id}
                  logoUrl={(dbCompany as any)?.logo_url}
                  websiteUrl={(dbCompany as any)?.website_url}
                  companyName={name}
                  slug={id}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold text-foreground leading-tight">{name}</h1>
                        {recordStatus !== "verified" && (
                          <span className={`text-xs px-2 py-0.5 rounded-md border font-medium whitespace-nowrap ${statusInfo.color}`}>
                            {isDiscovering && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                            {statusInfo.label}
                          </span>
                        )}
                      </div>
                      {(dbCompany as any)?.parent_company && (
                        <p className="text-xs text-muted-foreground mt-0.5">Owned by {(dbCompany as any).parent_company}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <AdminCompanyActions companyId={dbCompany?.id || company?.id || ""} companyName={name} companySlug={id || ""} />
                      <WatchCompanyButton companyId={dbCompany?.id || company?.id || ""} companyName={name} />
                      <ShareableScorecard data={{
                        name, industry, state, civicFootprintScore: civicScore,
                        totalPacSpending: totalPac, lobbyingSpend: lobbyingSpend || undefined,
                        confidenceRating: dbCompany?.confidence_rating || company?.confidenceRating || "medium",
                        governmentContracts: govContracts || undefined,
                        partyBreakdown: dbPartyBreakdown?.map(p => ({ party: p.party, amount: p.amount, color: p.color })),
                      }} />
                    </div>
                  </div>

                  {/* Meta badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Badge variant="secondary" className="text-xs">{industry}</Badge>
                    <Badge variant="secondary" className="text-xs">{state}</Badge>
                    {(dbCompany as any)?.employee_count && <Badge variant="secondary" className="text-xs">{(dbCompany as any).employee_count} employees</Badge>}
                    {(dbCompany as any)?.ticker && <Badge variant="outline" className="font-mono text-xs">{(dbCompany as any).ticker}</Badge>}
                    {dbCompany?.is_publicly_traded === false && (
                      <Badge variant="outline" className="text-xs gap-1 border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5 text-[hsl(var(--civic-yellow))]">
                        <EyeOff className="w-3 h-3" />
                        Private
                      </Badge>
                    )}
                  </div>

                  {/* Website & Careers links */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {(dbCompany as any)?.website_url && (
                      <a href={(dbCompany as any).website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Website
                      </a>
                    )}
                    {(dbCompany as any)?.careers_url && (
                      <a href={(dbCompany as any).careers_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Careers
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrity Indicators — sticky badges */}
          {dbCompany?.id && <IntegrityIndicators companyId={dbCompany.id} />}

          {/* ═══════════════════════════════════════════════════════
              JACKYE'S INSIGHT / DESCRIPTION
             ═══════════════════════════════════════════════════════ */}
          <JackyesInsightBlock insight={dbCompany?.jackye_insight} description={(dbCompany as any)?.description} />

          {/* ═══════════════════════════════════════════════════════
              NO-DATA FALLBACK
             ═══════════════════════════════════════════════════════ */}
          {dbCompany && !dbCompany.jackye_insight && totalPac === 0 && lobbyingSpend === 0 && civicScore === 0 && (dbIssueSignals?.length || 0) === 0 && (dbPublicStances?.length || 0) === 0 && (
            <Card className="mb-6 border-dashed border-border/60 bg-muted/20">
              <CardContent className="p-6 text-center">
                <FileSearch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">We don't have receipts on this company yet.</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Our research team hasn't completed a full scan. You can request one or run an automated scan now.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Button onClick={handleFullScan} disabled={isScanning || !!isDiscovering} className="gap-2">
                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                    {isScanning ? "Scanning…" : "Run Full Company Scan"}
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/check")} className="gap-2">
                    <Search className="w-4 h-4" />
                    Request Company Scan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════════════════════════════════════════════════════
              1. INSIDER BRIEF
             ═══════════════════════════════════════════════════════ */}
          <InsiderBriefSection
            companyName={name}
            industry={industry}
            isPubliclyTraded={!!dbCompany?.is_publicly_traded}
            totalPacSpending={totalPac}
            lobbyingSpend={lobbyingSpend}
            governmentContracts={govContracts}
            darkMoneyCount={dbDarkMoney?.length || 0}
            revolvingDoorCount={dbRevolvingDoor?.length || 0}
            hasLayoffSignals={false}
            hasSentimentData={!!tiSentiment}
            hasPayEquity={!!tiPayEquity}
            hasBenefitsData={!!tiBenefits}
            hasAiHrSignals={!!tiAiHr}
            employeeCount={(dbCompany as any)?.employee_count ?? null}
            hasWarnNotices={false}
            hasJobPostings={hasJobPostings}
            hasTradeAssociations={(dbTradeAssociations?.length || 0) > 0}
            hasGovernmentContracts={govContracts > 0}
            hasDarkMoney={(dbDarkMoney?.length || 0) > 0}
            hasCompensationData={!!tiBenefits}
            scanCompletion={(dbCompany as any)?.scan_completion ?? null}
            recordStatus={recordStatus}
            hasPublicStances={(dbPublicStances?.length || 0) > 0}
            hasIssueSignals={(dbIssueSignals?.length || 0) > 0}
            lastReviewed={dbCompany?.last_reviewed}
            updatedAt={dbCompany?.updated_at}
          />

          {/* ═══════════════════════════════════════════════════════
              1.5 VALUES-SIGNAL MATCH (personalized)
             ═══════════════════════════════════════════════════════ */}
          <ValuesSignalMatch
            hasLayoffSignals={false}
            hasWarnNotices={false}
            hasPayEquity={!!tiPayEquity}
            hasBenefitsData={!!tiBenefits}
            hasAiHrSignals={!!tiAiHr}
            hasSentimentData={!!tiSentiment}
            hasCompensationData={!!tiBenefits}
            hasJobPostings={hasJobPostings}
            executiveCount={dbExecutives?.length || 0}
            revolvingDoorCount={dbRevolvingDoor?.length || 0}
            totalPacSpending={totalPac}
            lobbyingSpend={lobbyingSpend}
            lastReviewed={dbCompany?.last_reviewed}
            updatedAt={dbCompany?.updated_at}
          />

          {/* ═══════════════════════════════════════════════════════
              2. WHAT WE'RE SEEING (Structured Signals)
             ═══════════════════════════════════════════════════════ */}
          <ReportTeaserGate companyName={name} teaser={null}>
            <StructuredSignalsSection
              hasJobPostings={hasJobPostings}
              activeJobCount={activeJobCount}
              hasAiHrSignals={!!tiAiHr}
              hasGhostJobs={false}
              hasWarnNotices={false}
              hasLayoffSignals={false}
              hasPayEquity={!!tiPayEquity}
              hasBenefitsData={!!tiBenefits}
              hasCompensationData={!!tiBenefits}
              executiveCount={dbExecutives?.length || 0}
              totalPacSpending={totalPac}
              lobbyingSpend={lobbyingSpend}
              revolvingDoorCount={dbRevolvingDoor?.length || 0}
              darkMoneyCount={dbDarkMoney?.length || 0}
              companyId={dbCompanyId || ""}
              companyName={name}
              companySlug={id || ""}
              careersUrl={(dbCompany as any)?.careers_url || company?.careersUrl}
              lastReviewed={dbCompany?.last_reviewed}
              updatedAt={dbCompany?.updated_at}
            />
          </ReportTeaserGate>

          {/* ═══════════════════════════════════════════════════════
              2.3 LEADERSHIP & INFLUENCE (Detail)
             ═══════════════════════════════════════════════════════ */}
          <LeadershipInfluenceSection
            executives={dbExecutives || []}
            candidates={dbCandidates || []}
            partyBreakdown={dbPartyBreakdown?.map(p => ({ party: p.party, amount: p.amount, color: p.color })) || []}
            revolvingDoor={dbRevolvingDoor || []}
            darkMoney={dbDarkMoney || []}
            boardMembers={dbBoardMembers || []}
            companyName={name}
            totalPacSpending={totalPac}
            lobbyingSpend={lobbyingSpend}
            onExecutiveClick={handleExecutiveClick}
            onCandidateClick={handleCandidateClick}
            onPacClick={() => setPacDrawerOpen(true)}
            onLobbyingClick={() => setLobbyingDrawerOpen(true)}
            onContractsClick={() => setContractsDrawerOpen(true)}
          />

          {/* ═══════════════════════════════════════════════════════
              2.6 INNOVATION SIGNALS (Patents)
             ═══════════════════════════════════════════════════════ */}
          {dbCompanyId && (
            <InnovationSignals companyId={dbCompanyId} companyName={name} />
          )}

          {/* ═══════════════════════════════════════════════════════
              2.7 RECRUITER VIEW — Integrity Check
             ═══════════════════════════════════════════════════════ */}
          {integrityLoading && <RecruiterIntegrityCardSkeleton />}
          {integrityResult && <RecruiterIntegrityCard result={integrityResult} />}

          {/* ═══════════════════════════════════════════════════════
              2.5 REALITY GAP
             ═══════════════════════════════════════════════════════ */}
          {dbCompanyId && (
            <RealityGapBlock
              companyId={dbCompanyId}
              companyName={name}
              updatedAt={dbCompany?.updated_at}
            />
          )}

          {/* ═══════════════════════════════════════════════════════
              7. WHAT TO WATCH
             ═══════════════════════════════════════════════════════ */}
          <WhatToWatch
            companyName={name}
            hasLayoffSignals={false}
            hasWarnNotices={false}
            hasPayEquity={!!tiPayEquity}
            hasBenefitsData={!!tiBenefits}
            hasAiHrSignals={!!tiAiHr}
            hasSentimentData={!!tiSentiment}
            hasJobPostings={hasJobPostings}
            executiveCount={dbExecutives?.length || 0}
            revolvingDoorCount={dbRevolvingDoor?.length || 0}
            totalPacSpending={totalPac}
            lobbyingSpend={lobbyingSpend}
            darkMoneyCount={dbDarkMoney?.length || 0}
          />

          {/* ═══════════════════════════════════════════════════════
              8. WHAT TO ASK
             ═══════════════════════════════════════════════════════ */}
          <WhatToAsk
            companyName={name}
            hasLayoffSignals={false}
            hasWarnNotices={false}
            hasPayEquity={!!tiPayEquity}
            hasBenefitsData={!!tiBenefits}
            hasAiHrSignals={!!tiAiHr}
            hasSentimentData={!!tiSentiment}
            executiveCount={dbExecutives?.length || 0}
            revolvingDoorCount={dbRevolvingDoor?.length || 0}
            totalPacSpending={totalPac}
            lobbyingSpend={lobbyingSpend}
            darkMoneyCount={dbDarkMoney?.length || 0}
          />

          {/* ═══════════════════════════════════════════════════════
              DECISION CHECKPOINT — "Before You Sign"
             ═══════════════════════════════════════════════════════ */}
          <DecisionCheckpointBeforeSign
            companyName={name}
            companySlug={id || ""}
            hasLayoffSignals={false}
            hasWarnNotices={false}
            hasPayEquity={!!tiPayEquity}
            hasBenefitsData={!!tiBenefits}
            hasAiHrSignals={!!tiAiHr}
            hasSentimentData={!!tiSentiment}
            hasCompensationData={!!tiBenefits}
            hasJobPostings={hasJobPostings}
            executiveCount={dbExecutives?.length || 0}
            revolvingDoorCount={dbRevolvingDoor?.length || 0}
            totalPacSpending={totalPac}
            lobbyingSpend={lobbyingSpend}
          />

          {/* ═══════════════════════════════════════════════════════
              HOW TO READ THIS
             ═══════════════════════════════════════════════════════ */}
          <HowToReadThis />

          {/* ═══════════════════════════════════════════════════════
              UPGRADE MOMENT
             ═══════════════════════════════════════════════════════ */}
          <UpgradeMoment companyName={name} />

          {/* ═══════════════════════════════════════════════════════
              5. FULL SCAN + FOOTER
             ═══════════════════════════════════════════════════════ */}
          <section className="mb-8 relative z-10">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/[0.04] to-transparent">
              <CardContent className="p-6 text-center">
                <Scan className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">Refresh Intelligence Data</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Pull the latest public records from FEC, Senate LDA, USAspending, and more.
                </p>
                <Button onClick={handleFullScan} disabled={isScanning || !!isDiscovering} size="lg" className="gap-2 pointer-events-auto">
                  {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isScanning ? "Scanning…" : "Refresh Intelligence Data"}
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Sources footer */}
          <div className="mt-8 mb-4">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Data from FEC.gov, Senate LDA, USASpending.gov, OpenCorporates, and public filings.
              Executive donations reflect personal giving. This platform provides publicly available data for informational purposes only.
            </p>
          </div>

          <PostReportNudge />
        </motion.div>
      </div>

      {/* ─── Drawers ─── */}
      <CandidateDetailDrawer open={candidateDrawerOpen} onOpenChange={setCandidateDrawerOpen} candidate={selectedCandidate} companyName={name} />
      <ExecutiveDetailDrawer open={executiveDrawerOpen} onOpenChange={setExecutiveDrawerOpen} executive={selectedExecutive} companyName={name} onCandidateClick={(c) => { setExecutiveDrawerOpen(false); setTimeout(() => handleCandidateClick(c), 300); }} />
      <LobbyingDetailDrawer open={lobbyingDrawerOpen} onOpenChange={setLobbyingDrawerOpen} companyId={dbCompany?.id} companyName={name} totalLobbyingSpend={dbCompany?.lobbying_spend} />
      <PACDetailDrawer open={pacDrawerOpen} onOpenChange={setPacDrawerOpen} companyId={dbCompany?.id} companyName={name} totalPACSpending={totalPac} corporatePACExists={dbCompany?.corporate_pac_exists || false} onExecutiveClick={handleExecutiveClick} />
      <ContractsDetailDrawer open={contractsDrawerOpen} onOpenChange={setContractsDrawerOpen} companyId={dbCompany?.id} companyName={name} totalContracts={govContracts || undefined} totalSubsidies={subsidies || undefined} />
    </ContentProtector>
  );
}
