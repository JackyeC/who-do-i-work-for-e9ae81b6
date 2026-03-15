import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { Activity } from "lucide-react";
import { useCompanyIntelligence } from "@/hooks/use-company-intelligence";
import { motion } from "framer-motion";
import {
  Building2, ArrowLeft, DollarSign, Users, Flag,
  Scale, Megaphone, ExternalLink, Shield, 
  AlertTriangle, EyeOff, RotateCcw, TrendingUp, Landmark,
  Loader2, Sparkles, Search, ClipboardCheck,
  Heart, Brain, Briefcase, ChevronDown, MessageSquareWarning,
  Scan, BarChart3, Award, GraduationCap, Hammer, Network, FileText, Radio, Eye, Clock
} from "lucide-react";
import { CompanyLogo } from "@/components/CompanyLogo";
import { StickyScoreHeader } from "@/components/StickyScoreHeader";
import { AlignmentDashboard } from "@/components/AlignmentDashboard";
import { ShareableScorecard } from "@/components/ShareableScorecard";
import { WatchCompanyButton } from "@/components/WatchCompanyButton";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { PartyBadge } from "@/components/PartyBadge";
import { CandidateDetailDrawer } from "@/components/CandidateDetailDrawer";
import { ExecutiveDetailDrawer } from "@/components/ExecutiveDetailDrawer";
import { LobbyingDetailDrawer } from "@/components/LobbyingDetailDrawer";
import { PACDetailDrawer } from "@/components/PACDetailDrawer";
import { ContractsDetailDrawer } from "@/components/ContractsDetailDrawer";
import { WorkerSentimentCard } from "@/components/WorkerSentimentCard";
import { AIHiringCard } from "@/components/AIHiringCard";
import { WorkerBenefitsCard } from "@/components/WorkerBenefitsCard";
import { CompensationTransparencyCard } from "@/components/CompensationTransparencyCard";
import { PromotionEquityCard } from "@/components/PromotionEquityCard";
import { WarnTrackerCard } from "@/components/WarnTrackerCard";
import { BLSDemographicsCard } from "@/components/bls/BLSDemographicsCard";
import { WorkforceDemographicsLayer } from "@/components/dossier/WorkforceDemographicsLayer";
import { ExecutiveInclusionSnapshot } from "@/components/intelligence/ExecutiveInclusionSnapshot";
import { EarlyWarningSignals } from "@/components/intelligence/EarlyWarningSignals";
import { EEO1WorkforceCard } from "@/components/intelligence/EEO1WorkforceCard";
import { DiversityDisclosureTracker } from "@/components/intelligence/DiversityDisclosureTracker";
import { GhostJobDetector } from "@/components/intelligence/GhostJobDetector";
import { RecruitingHealthCard } from "@/components/intelligence/RecruitingHealthCard";
import { RealityCheckCard } from "@/components/intelligence/RealityCheckCard";

import { ValuesNudgeBanner } from "@/components/onboarding/ValuesNudgeBanner";
import { AgencyContractsCard } from "@/components/AgencyContractsCard";
import { ROIPipelineCard } from "@/components/ROIPipelineCard";
import { OpenSecretsEnrichmentCard } from "@/components/OpenSecretsEnrichmentCard";
import { CompanyIntelligenceScanCard } from "@/components/CompanyIntelligenceScanCard";
import { RelatedReportsCard } from "@/components/RelatedReportsCard";
import { ValuesCheckSection, type ValuesCheckSignal } from "@/components/values-check/ValuesCheckSection";
import { InfluenceChainCard } from "@/components/InfluenceChainCard";
import { CorporateCharacterScore, calculateCharacterScore } from "@/components/CorporateCharacterScore";
import { TransparencyGhosting } from "@/components/TransparencyGhosting";
import { DataFreshnessCard } from "@/components/DataFreshnessCard";
import { useScanTracker } from "@/hooks/use-scan-tracker";
import { DecisionMakers } from "@/components/DecisionMakers";
import { AdminCompanyActions } from "@/components/AdminCompanyActions";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { companies, formatCurrency } from "@/data/sampleData";
import { cn } from "@/lib/utils";
import { useROIPipeline } from "@/hooks/use-roi-pipeline";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCompanySEO } from "@/hooks/use-company-seo";
import { useToast } from "@/hooks/use-toast";
import { ContentProtector } from "@/components/ContentProtector";
import { ReportTeaserGate } from "@/components/ReportTeaserGate";
import { PostReportNudge } from "@/components/PostReportNudge";
import { SankeyInfluenceDiagram } from "@/components/SankeyInfluenceDiagram";
import { CareerRiskReport } from "@/components/CareerRiskReport";
import { BoardGovernanceTab } from "@/components/BoardGovernanceTab";
import { CorporateBehaviorIndexCard } from "@/components/CorporateBehaviorIndexCard";
import { calculateCBI, type CBIInput } from "@/lib/corporateBehaviorIndex";
import { RecruiterRealityScoreCard } from "@/components/RecruiterRealityScoreCard";
import { calculateRRS, type RRSInput } from "@/lib/recruiterRealityScore";
import { GTMScoreCard } from "@/components/GTMScoreCard";
import { calculateGTM, type GTMInput } from "@/lib/gtmScore";
import { PersonaSelector } from "@/components/PersonaSelector";
import { type PersonaId, type PersonaBucket, isSectionVisible, getSectionOrder, getPersonaConfig } from "@/lib/personaConfig";
import { CourtRecordsCard } from "@/components/CourtRecordsCard";
import { NewsIntelligenceCard } from "@/components/NewsIntelligenceCard";
import { InsiderTradingCard } from "@/components/InsiderTradingCard";
import { PromotionVelocityCard } from "@/components/PromotionVelocityCard";
import { IntelligenceSnapshotCard } from "@/components/viral/IntelligenceSnapshotCard";
import { calculatePVS, deriveSubScores, computeConfidence } from "@/lib/promotionVelocityScore";
import { PublicRecordsExposure } from "@/components/public-records/PublicRecordsExposure";
import { NarrativePowerSection } from "@/components/narrative-power";
import { JackyeNote } from "@/components/JackyeNote";
import { CorporateOwnershipCard } from "@/components/CorporateOwnershipCard";
import { ReceiptsTimeline } from "@/components/ReceiptsTimeline";

/* ─── Status labels ─── */
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  discovered: { label: "Discovered", color: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  identity_matched: { label: "Identity Verified", color: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30" },
  research_in_progress: { label: "Research In Progress", color: "bg-primary/10 text-primary border-primary/30" },
  partially_verified: { label: "Partially Verified", color: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  verified: { label: "Verified", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
  failed_to_verify: { label: "Unverified", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

/* ─── Report Section Header ─── */
function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 border border-primary/10 mt-0.5">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ─── Quick Intel Stat ─── */
function IntelStat({ label, value, status, onClick }: { label: string; value: string; status: "detected" | "none" | "unknown"; onClick?: () => void }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-colors",
        status === "detected" ? "bg-primary/[0.04] border-primary/15" : "bg-muted/30 border-border/40",
        onClick && "cursor-pointer hover:border-primary/30 hover:bg-primary/[0.06]"
      )}
    >
      <span className="text-base text-foreground font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-base font-semibold", status === "detected" ? "text-foreground" : "text-muted-foreground")}>{value}</span>
        {onClick && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
    </Wrapper>
  );
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePersona, setActivePersona] = useState<PersonaId>((searchParams.get("persona") as PersonaId) || "job_seeker");
  const handlePersonaChange = (p: PersonaId) => { setActivePersona(p); setSearchParams({ persona: p }); };

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
      if (!data) return [];
      const CSUITE_RE = /\b(CEO|CFO|COO|CTO|CIO|CISO|CMO|CPO|CLO|CDO|CSO|CHRO|CAO|CRO|CCO|CHAIRMAN|CHAIRWOMAN|CHAIR|PRESIDENT|VICE\s*PRESIDENT|VP|SVP|EVP|MANAGING\s*DIRECTOR|GENERAL\s*COUNSEL|PARTNER|FOUNDER|CO-?FOUNDER|OWNER|DIRECTOR|CHIEF|HEAD|EXECUTIVE|BOARD\s*MEMBER|TREASURER|SECRETARY|GENERAL\s*MANAGER|PRINCIPAL)\b/i;
      const filtered = data.filter(e => CSUITE_RE.test(e.title || ""));
      return filtered.length > 0 ? filtered : data.slice(0, 5);
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

  const { data: dbLobbyingDetails } = useQuery({
    queryKey: ["company-lobbying-details", dbCompanyId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("entity_linkages").select("target_entity_name, description, amount").eq("company_id", dbCompanyId!).eq("link_type", "lobbying_on_bill").order("amount", { ascending: false }).limit(10);
      return (data || []).map((d: any) => ({ target: d.target_entity_name, description: d.description || "", amount: d.amount || 0 }));
    },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  const { data: dbStateLobbying } = useQuery({
    queryKey: ["company-state-lobbying", dbCompanyId],
    queryFn: async () => { const { data } = await supabase.from("company_state_lobbying").select("issues, state, lobbying_spend").eq("company_id", dbCompanyId!).order("lobbying_spend", { ascending: false }); return data || []; },
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

  // Values Check
  const { data: valuesCheckSignals, refetch: refetchValuesCheck } = useQuery({
    queryKey: ["values-check-signals", dbCompanyId],
    queryFn: async () => {
      const { data } = await supabase.from("values_check_signals" as any).select("*").eq("company_id", dbCompanyId!).order("confidence_score", { ascending: false });
      return (data || []) as unknown as ValuesCheckSignal[];
    },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  const [isGeneratingValues, setIsGeneratingValues] = useState(false);
  const valuesAutoGenTriggered = useRef(false);
  const handleGenerateValuesCheck = async () => {
    if (!dbCompanyId) return;
    setIsGeneratingValues(true);
    try {
      const { error } = await supabase.functions.invoke("generate-values-check", { body: { companyId: dbCompanyId } });
      if (error) throw error;
      refetchValuesCheck();
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally { setIsGeneratingValues(false); }
  };

  useEffect(() => {
    if (dbCompanyId && valuesCheckSignals !== undefined && valuesCheckSignals.length === 0 && !isGeneratingValues && !valuesAutoGenTriggered.current) {
      valuesAutoGenTriggered.current = true;
      handleGenerateValuesCheck();
    }
  }, [dbCompanyId, valuesCheckSignals]);

  const { data: enrichmentData } = useQuery({
    queryKey: ["org-enrichment", dbCompanyId],
    queryFn: async () => { const { data } = await supabase.from("organization_profile_enrichment" as any).select("*").eq("company_id", dbCompanyId!).eq("source_name", "OpenSecrets").maybeSingle(); return data; },
    enabled: !!dbCompanyId, refetchInterval: pollInterval,
  });

  // Transparency counts
  const { data: tiAiHr } = useQuery({ queryKey: ["ti-ai-hr", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("ai_hr_signals" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiBenefits } = useQuery({ queryKey: ["ti-benefits", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("worker_benefit_signals" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiPayEquity } = useQuery({ queryKey: ["ti-pay", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("pay_equity_signals" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiSentiment } = useQuery({ queryKey: ["ti-sentiment", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("company_worker_sentiment" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiIdeology } = useQuery({ queryKey: ["ti-ideology", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("company_ideology_flags" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: dbBoardMembers } = useQuery({
    queryKey: ["board-members-count", dbCompanyId],
    queryFn: async () => { const { data } = await (supabase as any).from("board_members").select("id, is_independent").eq("company_id", dbCompanyId!); return data || []; },
    enabled: !!dbCompanyId,
  });

  const dbCompanyIdMap: Record<string, string> = {
    "google": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "home-depot": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "koch-industries": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  };
  const pipelineCompanyId = company ? dbCompanyIdMap[company.id] : dbCompany?.id;
  const pipelineCompanyName = company?.name || dbCompany?.name;
  const { data: livePipeline, isLoading: pipelineLoading, autoScanning, hasBeenScanned, triggerScan } = useROIPipeline(pipelineCompanyId, pipelineCompanyName);

  const seoTarget = dbCompany || (company ? { name: company.name, industry: company.industry || "", state: company.state || "", description: "", slug: company.id } : null);
  useCompanySEO({ name: seoTarget?.name || "", industry: seoTarget?.industry || "", state: seoTarget?.state || "", description: (seoTarget as any)?.description || "", slug: id || seoTarget?.slug || "", score: dbCompany?.civic_footprint_score });

  // Track scan for social proof
  useScanTracker(dbCompany?.id || undefined, dbCompany?.name || company?.name);

  // ─── Cache-first intelligence loading ───
  const {
    reports: intelligenceReports,
    loading: intelligenceLoading,
    refreshStatus,
    isAnyRefreshing,
    refreshSection,
    hasCachedData: hasIntelligenceData,
    getSection: getIntelligenceSection,
  } = useCompanyIntelligence({
    companyId: dbCompanyId,
    companyName: dbCompany?.name || company?.name,
    autoRefreshStale: true,
  });

  // ─── Full Scan Handler ───
  const handleFullScan = async () => {
    if (!dbCompany) return;
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("company-research", { body: { companyName: dbCompany.name, enrichExisting: true } });
      if (error) throw error;
      if (data?.success) {
        const count = Object.values(data.tablesPopulated || {}).reduce((a: number, b: any) => a + (b as number), 0);
        toast({ title: "Scan complete", description: `Found ${count} records for ${dbCompany.name}.` });
        const keys = ["company-profile", "company-candidates", "company-executives", "company-party-breakdown", "company-public-stances", "company-dark-money", "company-revolving-door", "company-trade-assoc", "company-lobbying-details", "company-state-lobbying", "company-issue-signals", "values-check-signals", "org-enrichment", "ti-ai-hr", "ti-benefits", "ti-pay", "ti-sentiment", "ti-ideology"];
        keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      } else { throw new Error(data?.error || "Scan failed"); }
    } catch (e: any) {
      // Never show raw technical errors to users
      const msg = e.message || '';
      const isProviderError = /insufficient|credits|timeout|non-2xx|502|503|firecrawl|scraping/i.test(msg);
      toast({
        title: isProviderError ? "Live refresh temporarily unavailable" : "Scan issue",
        description: isProviderError ? "Showing the most recent saved intelligence." : "Something went wrong. Please try again.",
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
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Company Not Found</h1>
          <p className="text-sm text-muted-foreground mb-4">This company isn't in our database yet.</p>
          <Link to="/search"><Button className="gap-2"><Search className="w-4 h-4" />Search & Discover</Button></Link>
        </div>
      </div>
    );
  }

  // Normalize fields
  const name = dbCompany?.name || company?.name || "";
  const industry = dbCompany?.industry || company?.industry || "";
  const state = dbCompany?.state || company?.state || "";
  const description = (dbCompany as any)?.description || company?.description || "";
  const civicScore = dbCompany?.civic_footprint_score ?? company?.civicFootprintScore ?? 0;
  const totalPac = dbCompany?.total_pac_spending ?? company?.totalPacSpending ?? 0;
  const lobbyingSpend = dbCompany?.lobbying_spend ?? company?.lobbyingSpend ?? 0;
  const govContracts = dbCompany?.government_contracts ?? company?.governmentContracts ?? 0;
  const subsidies = dbCompany?.subsidies_received ?? company?.subsidiesReceived ?? 0;
  const recordStatus = (dbCompany as any)?.record_status || "verified";
  const statusInfo = STATUS_LABELS[recordStatus] || STATUS_LABELS.verified;
  const isDiscovering = isResearching;
  const hasDetailedData = (dbCandidates?.length || 0) > 0 || (dbExecutives?.length || 0) > 0;

  // Transparency score (simple count-based)
  const transparencySignals = [!!tiAiHr, !!tiBenefits, !!tiPayEquity, !!tiSentiment, (dbPublicStances?.length || 0) > 0, (dbExecutives?.length || 0) > 0, !!tiIdeology, (dbBoardMembers?.length || 0) > 0];
  const transparencyScore = Math.round((transparencySignals.filter(Boolean).length / transparencySignals.length) * 100);

  // Corporate Character Score for sticky header
  const characterScore = calculateCharacterScore({
    hasDeiReports: false, hasPayTransparency: !!tiPayEquity, hasPromotionData: false,
    hasWorkforceDemographics: false, hasPublicReporting: !!dbCompany?.is_publicly_traded,
    hasPublicStances: (dbPublicStances?.length || 0) > 0, hasSentimentData: !!tiSentiment,
    hasLayoffSignals: false, hasWarnNotices: false, hasLaborViolations: false,
    hasWorkerLawsuits: false, hasBenefitsData: !!tiBenefits, employeeCount: (dbCompany as any)?.employee_count ?? null,
    totalPacSpending: totalPac, lobbyingSpend, hasTradeAssociations: (dbTradeAssociations?.length || 0) > 0,
    hasGovernmentContracts: govContracts > 0, hasDarkMoney: (dbDarkMoney?.length || 0) > 0,
    hasIssueSignals: (dbIssueSignals?.length || 0) > 0, hasSecInvestigations: false,
    hasDojEnforcement: false, hasFtcActions: false, hasClassActionLawsuits: false,
    hasPayEquitySignals: !!tiPayEquity, hasCompensationData: !!tiBenefits,
    hasGovernanceDisclosures: (dbBoardMembers?.length || 0) > 0, hasBoardDiversity: (dbBoardMembers?.length || 0) > 0, hasAiHrSignals: !!tiAiHr,
    hasJobPostings: false, scanCompletion: (dbCompany as any)?.scan_completion ?? null,
    recordStatus: recordStatus,
  });

  return (
    <ContentProtector className="flex flex-col min-h-0">
      {/* Sticky Score Header */}
      <StickyScoreHeader
        companyName={name}
        score={characterScore.totalScore}
        ticker={dbCompany?.ticker}
        industry={industry}
      />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Breadcrumb */}
        <Link to="/browse" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to directory
        </Link>

        <ValuesNudgeBanner />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

          {/* ═══════════════════════════════════════════════════════════
              REPORT HEADER
             ═══════════════════════════════════════════════════════════ */}
          <Card className="mb-6 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                <CompanyLogo
                  companyId={dbCompany?.id}
                  logoUrl={(dbCompany as any)?.logo_url}
                  websiteUrl={(dbCompany as any)?.website_url}
                  companyName={name}
                  slug={id}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{name}</h1>
                        {recordStatus !== "verified" && (
                          <span className={`text-xs px-2 py-0.5 rounded-md border font-medium whitespace-nowrap ${statusInfo.color}`}>
                            {isDiscovering && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                            {statusInfo.label}
                          </span>
                        )}
                      </div>
                      {(dbCompany as any)?.parent_company && (
                        <Link to={`/browse?q=${encodeURIComponent((dbCompany as any).parent_company)}`} className="inline-flex items-center gap-1.5 mt-1 group">
                          <Badge variant="outline" className="text-xs gap-1 border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5 text-[hsl(var(--civic-yellow))] group-hover:bg-[hsl(var(--civic-yellow))]/10 transition-colors">
                            <Building2 className="w-3 h-3" />
                            Owned by {(dbCompany as any).parent_company}
                          </Badge>
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <AdminCompanyActions companyId={dbCompany?.id || company?.id || ""} companyName={name} companySlug={id || ""} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={() => navigate(`/dossier/${id}`)}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        View Full Dossier
                      </Button>
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
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <Badge variant="secondary" className="text-xs">{industry}</Badge>
                    <Badge variant="secondary" className="text-xs">{state}</Badge>
                    {(dbCompany as any)?.employee_count && <Badge variant="secondary" className="text-xs">{(dbCompany as any).employee_count} employees</Badge>}
                    {(dbCompany as any)?.revenue && <Badge variant="secondary" className="text-xs">{(dbCompany as any).revenue}</Badge>}
                    {(dbCompany as any)?.ticker && <Badge variant="outline" className="font-mono text-[10px]">{(dbCompany as any).ticker}</Badge>}
                  </div>

                  {/* Score badges */}
                  <div className="flex items-center gap-3">
                    <CivicFootprintBadge score={civicScore} size="sm" />
                    {transparencyScore > 0 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Shield className="w-3 h-3" />
                        Transparency: {transparencyScore}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════
              PERSONA SELECTOR
             ═══════════════════════════════════════════════════════════ */}
          <PersonaSelector activePersona={activePersona} onPersonaChange={handlePersonaChange} />

          {/* ═══════════════════════════════════════════════════════════
              JACKYE'S NOTE — Signal Summary
             ═══════════════════════════════════════════════════════════ */}
          <JackyeNote
            companyName={name}
            industry={industry}
            totalPacSpending={totalPac}
            lobbyingSpend={lobbyingSpend}
            governmentContracts={govContracts}
            darkMoneyCount={dbDarkMoney?.length || 0}
            revolvingDoorCount={dbRevolvingDoor?.length || 0}
            executiveCount={dbExecutives?.length || 0}
            boardMemberCount={dbBoardMembers?.length || 0}
            hasLayoffSignals={false}
            hasSentimentData={!!tiSentiment}
            hasPayEquity={!!tiPayEquity}
            hasBenefitsData={!!tiBenefits}
            hasAiHrSignals={!!tiAiHr}
            isPubliclyTraded={!!dbCompany?.is_publicly_traded}
            transparencyScore={transparencyScore}
            civicFootprintScore={civicScore}
          />

          {/* ═══════════════════════════════════════════════════════════
              CORPORATE CHARACTER SCORE™
             ═══════════════════════════════════════════════════════════ */}
          <div className="mb-6 grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CorporateCharacterScore
                // Transparency
                hasPayTransparency={!!tiPayEquity}
                hasPublicStances={(dbPublicStances?.length || 0) > 0}
                hasPublicReporting={!!dbCompany?.is_publicly_traded}
                // Worker Treatment
                hasSentimentData={!!tiSentiment}
                hasLayoffSignals={false}
                hasWarnNotices={false}
                hasBenefitsData={!!tiBenefits}
                employeeCount={(dbCompany as any)?.employee_count}
                // Political Influence
                totalPacSpending={totalPac}
                lobbyingSpend={lobbyingSpend}
                hasTradeAssociations={(dbTradeAssociations?.length || 0) > 0}
                hasGovernmentContracts={govContracts > 0}
                hasDarkMoney={(dbDarkMoney?.length || 0) > 0}
                hasIssueSignals={(dbIssueSignals?.length || 0) > 0}
                // Ethical Conduct
                hasPayEquitySignals={!!tiPayEquity}
                // Leadership
                hasCompensationData={!!tiBenefits}
                hasAiHrSignals={!!tiAiHr}
                hasJobPostings={false}
                // Meta
                scanCompletion={(dbCompany as any)?.scan_completion}
                recordStatus={recordStatus}
              />
            </div>
            <DataFreshnessCard
              lastReviewed={dbCompany?.last_reviewed}
              updatedAt={dbCompany?.updated_at}
              recordStatus={recordStatus}
              scanCompletion={(dbCompany as any)?.scan_completion}
              intelligenceReports={intelligenceReports}
              refreshStatuses={refreshStatus}
              isAnyRefreshing={isAnyRefreshing}
              onRefreshAll={() => {
                const staleSections = Object.values(intelligenceReports).filter(r => r.isStale);
                staleSections.forEach(r => refreshSection(r.section_type));
              }}
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════
              CORPORATE BEHAVIOR INDEX™
             ═══════════════════════════════════════════════════════════ */}
          {(() => {
            const cbiInput: CBIInput = {
              warnNoticeCount: 0,
              hasLayoffSignals: false,
              hasBenefitsData: !!tiBenefits,
              hasSentimentData: !!tiSentiment,
              sentimentPositiveRatio: 0.5,
              hasPromotionData: false,
              promotionVelocityScore: 0,
              hasCareerPaths: false,
              hasInternalMobilitySignals: false,
              leadershipPipelineDiversity: false,
              hasPayEquitySignals: !!tiPayEquity,
              hasCompensationBands: false,
              hasPublicPayReporting: !!dbCompany?.is_publicly_traded,
              payTransparencySignalCount: tiPayEquity ? 1 : 0,
              executiveCount: dbExecutives?.length || 0,
              boardMemberCount: dbBoardMembers?.length || 0,
              boardIndependentCount: dbBoardMembers?.filter((b: any) => b.is_independent)?.length || 0,
              hasRevolvingDoor: (dbRevolvingDoor?.length || 0) > 0,
              hasDarkMoney: (dbDarkMoney?.length || 0) > 0,
              hasGovernanceDisclosures: (dbBoardMembers?.length || 0) > 0,
              isPubliclyTraded: !!dbCompany?.is_publicly_traded,
              aiHrSignalCount: tiAiHr ? 1 : 0,
              hasBiasAudit: false,
              hasAlgorithmTransparency: false,
              hasComplianceDisclosure: false,
              aiHiringToolCount: tiAiHr ? 1 : 0,
            };
            const cbiResult = calculateCBI(cbiInput);

            // Recruiter Reality Score
            const rrsInput: RRSInput = {
              hasApplicationAcknowledgment: false,
              hasTimelineDisclosure: false,
              hasRejectionNotification: false,
              candidateGhostingSignals: 0,
              interviewRoundCount: 0,
              hasStructuredInterviewProcess: false,
              hasInterviewFeedback: false,
              hasSalaryInPostings: !!tiPayEquity,
              hasCompensationBands: false,
              hasBenefitsInPostings: !!tiBenefits,
              salaryDisclosureRate: tiPayEquity ? 0.3 : 0,
              hasGlassdoorInterviewReviews: !!tiSentiment,
              glassdoorInterviewRating: tiSentiment ? 3.2 : 0,
              hasCandidateExperienceSurvey: false,
              hasEEODisclosure: false,
              hasAIDisclosure: !!tiAiHr,
              hasAccommodationsPolicy: false,
            };
            const rrsResult = calculateRRS(rrsInput);

            // GTM Score
            const gtmInput: GTMInput = {
              recentSalesHires: 0,
              totalRecentHires: 0,
              hasSalesLeadershipHires: false,
              recentMarketingHires: 0,
              hasMarketingLeadership: false,
              hasBrandInvestmentSignals: false,
              isPubliclyTraded: !!dbCompany?.is_publicly_traded,
              hasRevenueGrowth: false,
              hasFundingAnnouncement: false,
              revenue: (dbCompany as any)?.revenue || null,
              executiveTurnoverCount: 0,
              executiveCount: dbExecutives?.length || 0,
              hasCEOChange: false,
              hasRecentLayoffs: false,
              hasRecentHiringFreeze: false,
              warnNoticeCount: 0,
              isHiring: false,
            };
            const gtmResult = calculateGTM(gtmInput);

            return (
              <div className="space-y-4 mb-6">
                {isSectionVisible(activePersona, "cbi") && (
                  <CorporateBehaviorIndexCard result={cbiResult} companyName={name} />
                )}
                {isSectionVisible(activePersona, "recruiter_reality") && (
                  <RecruiterRealityScoreCard result={rrsResult} companyName={name} />
                )}
                {isSectionVisible(activePersona, "gtm") && (
                  <GTMScoreCard result={gtmResult} companyName={name} />
                )}
              </div>
            );
          })()}

          {/* CAREER RISK REPORT — Shareable viral scorecard */}
          <div className="mb-6">
            <CareerRiskReport
              companyName={name}
              slug={id || ""}
              ticker={dbCompany?.ticker}
              industry={industry}
              hasLayoffSignals={false}
              hasWarnNotices={false}
              totalPacSpending={totalPac}
              lobbyingSpend={lobbyingSpend}
              hasDarkMoney={(dbDarkMoney?.length || 0) > 0}
              hasPayTransparency={!!tiPayEquity}
              hasSentimentData={!!tiSentiment}
              hasBenefitsData={!!tiBenefits}
              hasPromotionData={false}
              executiveCount={dbExecutives?.length || 0}
              executiveTurnover={false}
              transparencyScore={transparencyScore}
              characterScore={characterScore.totalScore}
            />
          </div>

          {/* SHAREABLE INTELLIGENCE SNAPSHOT */}
          <div className="mb-6">
            <IntelligenceSnapshotCard
              companyName={name}
              overallScore={characterScore.totalScore}
              scoreLabel={characterScore.totalScore >= 65 ? "Responsible" : characterScore.totalScore >= 45 ? "Mixed" : "Concerning"}
              slug={id || ""}
              signals={[
                { label: "Workforce Stability", score: Math.min(100, Math.max(0, 100 - (totalPac > 100000 ? 30 : 0))), status: "neutral" as const },
                { label: "Pay Transparency", score: tiPayEquity ? 72 : 25, status: tiPayEquity ? "positive" as const : "negative" as const },
                { label: "Governance", score: (dbExecutives?.length || 0) > 3 ? 68 : 40, status: "neutral" as const },
                { label: "HR Tech Ethics", score: tiAiHr ? 55 : 50, status: "neutral" as const },
                { label: "Career Mobility", score: 45, status: "neutral" as const },
              ]}
              metrics={[
                { label: "Transparency", value: `${transparencyScore}%` },
                { label: "Character", value: `${characterScore.totalScore}/100` },
                { label: "Confidence", value: dbCompany?.confidence_rating || "Low" },
              ]}
            />
          </div>

          {/* TRANSPARENCY GHOSTING — Missing Data as Risk Signal */}
          <Card className="mb-6">
            <CardContent className="p-5">
              <TransparencyGhosting
                hasPayEquity={!!tiPayEquity}
                hasPromotionData={false}
                hasSentimentData={!!tiSentiment}
                hasBenefitsData={!!tiBenefits}
                hasAiHrSignals={!!tiAiHr}
                hasDeiReports={false}
                hasCompensationData={!!tiBenefits}
                hasWorkforceDemographics={false}
              />
            </CardContent>
          </Card>

          <ReportTeaserGate
            companyName={name}
            teaser={null}
          >
          {/* ═══════════════════════════════════════════════════════════
              SCAN PROGRESS (when actively scanning)
             ═══════════════════════════════════════════════════════════ */}
          {isDiscovering && (() => {
            const scanCompletion = (dbCompany as any).scan_completion as Record<string, boolean> | null;
            const scanItems = [
              { key: "political_spending", label: "Political spending" },
              { key: "lobbying", label: "Lobbying activity" },
              { key: "trade_associations", label: "Trade associations" },
              { key: "executives", label: "Executive donations" },
              { key: "ai_hiring", label: "AI hiring tools" },
              { key: "worker_sentiment", label: "Worker sentiment" },
              { key: "benefits", label: "Benefits scan" },
              { key: "government_contracts", label: "Gov contracts" },
            ];
            const completedCount = scanCompletion ? scanItems.filter(s => scanCompletion[s.key]).length : 0;
            return (
              <Card className="mb-6 border-dashed border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Building Intelligence Report — {completedCount}/{scanItems.length} modules complete</p>
                      <div className="w-full bg-muted rounded-full h-1 mt-2">
                        <div className="bg-primary h-1 rounded-full transition-all duration-500" style={{ width: `${(completedCount / scanItems.length) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* ═══════════════════════════════════════════════════════════
              1. COMPANY OVERVIEW
             ═══════════════════════════════════════════════════════════ */}
          {description && (
            <section id="section-overview" className="mb-10 scroll-mt-28">
              <SectionHeader icon={Building2} title="Company Overview" />
              <p className="text-base text-foreground/80 leading-relaxed">{description}</p>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════
              2. QUICK INTELLIGENCE SUMMARY
             ═══════════════════════════════════════════════════════════ */}
          <section id="section-intelligence" className="mb-10 scroll-mt-28">
            <SectionHeader icon={BarChart3} title="Quick Intelligence Summary" subtitle="Key signals at a glance" />
            <div className="grid sm:grid-cols-2 gap-3">
              <IntelStat
                label="Political Influence"
                value={totalPac > 0 || lobbyingSpend > 0 ? formatCurrency(totalPac + lobbyingSpend) + " total" : "Not detected"}
                status={totalPac > 0 || lobbyingSpend > 0 ? "detected" : "none"}
                onClick={totalPac > 0 ? () => setPacDrawerOpen(true) : undefined}
              />
              <IntelStat
                label="Workforce Transparency"
                value={transparencyScore > 0 ? `${transparencyScore}%` : "No data"}
                status={transparencyScore > 0 ? "detected" : "none"}
              />
              <IntelStat
                label="Hiring Technology Risk"
                value={tiAiHr ? "Signals detected" : "Not detected"}
                status={tiAiHr ? "detected" : "none"}
              />
              <IntelStat
                label="Layoff Risk"
                value="Review below"
                status="unknown"
              />
              <IntelStat
                label="Pay Transparency"
                value={tiPayEquity ? "Signals found" : "Not detected"}
                status={tiPayEquity ? "detected" : "none"}
              />
              <IntelStat
                label="Worker Sentiment"
                value={tiSentiment ? "Signals detected" : "Not detected"}
                status={tiSentiment ? "detected" : "none"}
              />
            </div>
          </section>

          <Separator className="mb-8" />

          {/* ═══════════════════════════════════════════════════════════
              3. DECISION MAKERS
             ═══════════════════════════════════════════════════════════ */}
          {dbExecutives && dbExecutives.length > 0 && (
            <section id="section-leadership" className="mb-8 scroll-mt-28">
              <SectionHeader icon={Users} title="Decision Makers" subtitle="C-suite executives and board members shaping company strategy" />
              <div className="pl-12">
                <DecisionMakers
                  executives={dbExecutives}
                  companyId={dbCompanyId}
                  companyName={name}
                  onExecutiveClick={handleExecutiveClick}
                />
              </div>
            </section>
          )}


          {/* ═══════════════════════════════════════════════════════════
              PERSONA-ORDERED SECTIONS
             ═══════════════════════════════════════════════════════════ */}
          {(() => {
            const sectionOrder = getSectionOrder(activePersona);

            const SECTION_RENDERERS: Record<string, () => React.ReactNode> = {
              governance: () => (
                <section id="section-governance" className="mb-10 scroll-mt-28">
                  <SectionHeader icon={Shield} title="Governance & Board Structure" subtitle="Board composition, committee oversight, ownership signals, and corporate family" />
                  <div className="space-y-4">
                    <CorporateOwnershipCard
                      companyId={dbCompanyId || ""}
                      companyName={name}
                      parentCompany={(dbCompany as any)?.parent_company}
                    />
                    <BoardGovernanceTab companyId={dbCompanyId || ""} companyName={name} ticker={dbCompany?.ticker} secCik={dbCompany?.sec_cik} />
                    {dbCompanyId && dbCompany?.is_publicly_traded && (
                      <div className="mt-4">
                        <InsiderTradingCard companyId={dbCompanyId} companyName={name} ticker={dbCompany?.ticker} cik={dbCompany?.sec_cik} />
                      </div>
                    )}
                  </div>
                </section>
              ),
              workforce_intel: () => (
                <section id="section-workforce" className="mb-10 scroll-mt-28">
                  <SectionHeader icon={TrendingUp} title="Workforce Intelligence" subtitle="Worker demographics, sentiment, hiring technology, and benefits signals" />
                  <div className="space-y-4">
                    <RealityCheckCard companyId={dbCompanyId} companyName={name} />
                    <EarlyWarningSignals companyId={dbCompanyId} companyName={name} />
                    <GhostJobDetector companyId={dbCompanyId} companyName={name} />
                    <RecruitingHealthCard companyId={dbCompanyId} companyName={name} />
                    <EEO1WorkforceCard companyId={dbCompanyId} companyName={name} />
                    <ExecutiveInclusionSnapshot companyId={dbCompanyId} companyName={name} />
                    <DiversityDisclosureTracker companyId={dbCompanyId} companyName={name} />
                    <WorkerSentimentCard companyName={name} dbCompanyId={dbCompanyId} />
                    <AIHiringCard companyName={name} dbCompanyId={dbCompanyId} />
                    <WorkerBenefitsCard companyName={name} dbCompanyId={dbCompanyId} />
                    {dbCompanyId && (
                      <WorkforceDemographicsLayer companyId={dbCompanyId} companyName={name} />
                    )}
                    <BLSDemographicsCard />
                  </div>
                </section>
              ),
              compensation: () => (
                <section id="section-compensation" className="mb-10 scroll-mt-28">
                  <SectionHeader icon={DollarSign} title="Compensation Transparency" subtitle="Pay equity signals and national benchmarks" />
                  <div className="space-y-4">
                    <CompensationTransparencyCard companyName={name} dbCompanyId={dbCompanyId} />
                  </div>
                </section>
              ),
              promotion_velocity: () => (
                <section className="mb-10">
                  <SectionHeader icon={Award} title="Workforce Mobility & Promotion Equity" subtitle="Internal promotion, leadership diversity, HBCU partnerships, skills-first hiring" />
                  <div className="space-y-4">
                    <PromotionEquityCard companyName={name} dbCompanyId={dbCompanyId} />
                    {(() => {
                      const subScores = deriveSubScores({ promotionSignals: [], mobilitySignals: [], diversitySignals: [], retentionSignals: [], learningSignals: [], transparencyCategories: 2, totalCategories: 6 });
                      const confidence = computeConfidence(3, false, 180);
                      const pvsResult = calculatePVS(subScores, confidence);
                      return <PromotionVelocityCard result={pvsResult} companyName={name} />;
                    })()}
                  </div>
                </section>
              ),
              workforce_stability: () => (
                <section id="section-stability" className="mb-10 scroll-mt-28">
                  <SectionHeader icon={AlertTriangle} title="Workforce Stability" subtitle="Layoffs, WARN notices, and workforce reduction signals" />
                  <div className="space-y-4">
                    <WarnTrackerCard companyName={name} dbCompanyId={dbCompanyId} />
                    {dbCompanyId && <CourtRecordsCard companyId={dbCompanyId} companyName={name} />}
                    {dbCompanyId && <NewsIntelligenceCard companyId={dbCompanyId} companyName={name} />}
                  </div>
                </section>
              ),
              influence: () => (
                <section id="section-influence" className="mb-10 scroll-mt-28">
                  <SectionHeader icon={Landmark} title="Policy & Influence Signals" subtitle="Political donations, lobbying, trade associations, federal contracts" />
                  <div className="space-y-4">
                    <SankeyInfluenceDiagram pacSpending={totalPac} lobbyingSpend={lobbyingSpend} federalContracts={govContracts} subsidies={subsidies} companyName={name} />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {totalPac > 0 && (
                        <button onClick={() => setPacDrawerOpen(true)} className="p-4 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors text-left group">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">PAC Spending</p>
                          <p className="text-xl font-bold text-foreground">{formatCurrency(totalPac)}</p>
                          <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
                        </button>
                      )}
                      {lobbyingSpend > 0 && (
                        <button onClick={() => setLobbyingDrawerOpen(true)} className="p-4 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors text-left group">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Federal Lobbying</p>
                          <p className="text-xl font-bold text-foreground">{formatCurrency(lobbyingSpend)}</p>
                          <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
                        </button>
                      )}
                      {govContracts > 0 && (
                        <button onClick={() => setContractsDrawerOpen(true)} className="p-4 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors text-left group">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Gov Contracts</p>
                          <p className="text-xl font-bold text-foreground">{formatCurrency(govContracts)}</p>
                          <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
                        </button>
                      )}
                      {(dbTradeAssociations?.length || 0) > 0 && (
                        <div className="p-4 rounded-lg bg-card border border-border/50 text-left">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Trade Associations</p>
                          <p className="text-xl font-bold text-foreground">{dbTradeAssociations?.length}</p>
                        </div>
                      )}
                    </div>
                    {dbPartyBreakdown && dbPartyBreakdown.length > 0 && dbPartyBreakdown.some(p => p.amount > 0) && (
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">Political Giving by Party</CardTitle></CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart><Pie data={dbPartyBreakdown.filter(p => p.amount > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="amount" nameKey="party">
                                {dbPartyBreakdown.filter(p => p.amount > 0).map((entry, i) => <Cell key={i} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />)}
                              </Pie><RechartsTooltip formatter={(val: number) => formatCurrency(val)} /></PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex justify-center gap-4 mt-1">
                            {dbPartyBreakdown.filter(p => p.amount > 0).map((p) => (
                              <span key={p.party} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                {p.party}: {formatCurrency(p.amount)}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {dbCandidates && dbCandidates.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Flag className="w-4 h-4" /> PAC Recipients ({dbCandidates.length})</CardTitle></CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Party</TableHead><TableHead>State</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                              <TableBody>
                                {dbCandidates.map((c) => (
                                  <TableRow key={c.id} className="cursor-pointer hover:bg-primary/5" onClick={() => handleCandidateClick(c)}>
                                    <TableCell className="font-medium text-sm">{c.name}{c.flagged && <Badge variant="destructive" className="ml-2 text-[10px]">Flagged</Badge>}</TableCell>
                                    <TableCell><PartyBadge party={c.party} entityType="politician" size="sm" /></TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{c.state}</TableCell>
                                    <TableCell className="text-sm">{formatCurrency(c.amount)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {dbPublicStances && dbPublicStances.length > 0 && (
                      <AlignmentDashboard stances={dbPublicStances} />
                    )}
                    {((dbDarkMoney?.length || 0) > 0 || (dbRevolvingDoor?.length || 0) > 0) && (
                      <div className="grid lg:grid-cols-2 gap-4">
                        {dbDarkMoney && dbDarkMoney.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><EyeOff className="w-4 h-4" /> Dark Money</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                              {dbDarkMoney.map((d) => (
                                <div key={d.id} className="p-2.5 rounded-lg bg-muted/50 border border-border">
                                  <div className="flex items-center justify-between mb-0.5"><span className="font-medium text-sm text-foreground">{d.name}</span><Badge variant="outline" className="text-[10px]">{d.org_type}</Badge></div>
                                  {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
                                  {d.estimated_amount && <p className="text-xs text-muted-foreground mt-0.5">Est. {formatCurrency(d.estimated_amount)}</p>}
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                        {dbRevolvingDoor && dbRevolvingDoor.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Revolving Door</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                              {dbRevolvingDoor.map((r) => (
                                <div key={r.id} className="p-2.5 rounded-lg bg-muted/50 border border-border">
                                  <div className="font-medium text-sm text-foreground">{r.person}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {r.prior_role} <span className="mx-1">→</span> {r.new_role}
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                    <ROIPipelineCard data={livePipeline || { moneyIn: [], network: [], benefitsOut: [], linkages: [], totalSpending: 0, totalBenefits: 0 }} isSearching={!livePipeline && !!dbCompanyId} onTriggerScan={triggerScan} autoScanning={autoScanning} hasBeenScanned={hasBeenScanned} enrichmentData={enrichmentData} />
                    {enrichmentData && <OpenSecretsEnrichmentCard data={enrichmentData} />}
                    <AgencyContractsCard companyName={name} dbCompanyId={dbCompanyId} />
                  </div>
                </section>
              ),
              values: () => (
                <section id="section-values" className="mb-10 scroll-mt-28">
                  <SectionHeader icon={Heart} title="Values Check" subtitle="How this company's actions align with your values" />
                  <div className="space-y-4">
                    <ValuesCheckSection
                      companyName={name}
                      companyId={dbCompany?.id || ""}
                      signals={valuesCheckSignals || []}
                      onGenerateSignals={handleGenerateValuesCheck}
                      isGenerating={isGeneratingValues}
                      onExecutiveClick={handleExecutiveClick}
                      onDonationsClick={() => setPacDrawerOpen(true)}
                    />
                    <InfluenceChainCard
                      companyId={dbCompany?.id || ""}
                      companyName={name}
                      onExecutiveClick={(exec) => {
                        const match = dbExecutives?.find(e => e.name.toLowerCase().includes(exec.name.toLowerCase().split(",")[0]) || exec.name.toLowerCase().includes(e.name.toLowerCase().split(",")[0]));
                        handleExecutiveClick(match || { id: "", name: exec.name, title: "Executive", total_donations: exec.total_donations || 0 });
                      }}
                      onCandidateClick={handleCandidateClick}
                    />
                  </div>
                </section>
              ),
              public_records: () => (
                <section id="section-public-records" className="mb-10 scroll-mt-28">
                  <SectionHeader icon={FileText} title="Public Records & Network Exposure" subtitle="Public records, legal filings, government disclosures, and documented network ties" />
                  <PublicRecordsExposure companyName={name} companyId={dbCompany?.id} />
                </section>
              ),
              narrative_power: () => (
                <section id="section-narrative-power" className="mb-10 scroll-mt-28">
                  <SectionHeader icon={Radio} title="Who Shapes the Narrative" subtitle="PR firms, influencers, advocacy groups, think tanks, and coordinated messaging networks" />
                  <NarrativePowerSection companyName={name} companyId={dbCompany?.id} />
                </section>
              ),
              receipts_timeline: () => (
                <section id="section-receipts-timeline" className="mb-10 scroll-mt-28">
                  <SectionHeader icon={Clock} title="Receipts Timeline" subtitle="Chronological evidence trail — what happened, when, and according to whom" />
                  {dbCompanyId && <ReceiptsTimeline companyId={dbCompanyId} companyName={name} />}
                </section>
              ),
            };

            const BUCKET_ICONS: Record<string, any> = {
              DollarSign, Users, Eye, TrendingUp, Shield, Activity,
            };

            const personaConfig = getPersonaConfig(activePersona);

            // If persona has buckets, render grouped sections with bucket headers
            if (personaConfig.buckets) {
              return (
                <>
                  {personaConfig.buckets.map((bucket) => {
                    const visibleSections = bucket.sections.filter(
                      key => SECTION_RENDERERS[key]
                    );
                    if (visibleSections.length === 0) return null;
                    const BucketIcon = BUCKET_ICONS[bucket.iconName] || Shield;

                    return (
                      <div key={bucket.id} className="mb-10">
                        {/* Bucket Header */}
                        <div className="flex items-start gap-3 mb-6 pb-4 border-b-2 border-primary/15">
                          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/15 mt-0.5">
                            <BucketIcon className="w-5.5 h-5.5 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">{bucket.title}</h2>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">{bucket.subtitle}</p>
                          </div>
                        </div>
                        {/* Sections inside bucket */}
                        {visibleSections.map(key => (
                          <div key={key}>{SECTION_RENDERERS[key]()}</div>
                        ))}
                      </div>
                    );
                  })}
                  {/* Remaining secondary sections not in any bucket */}
                  {sectionOrder
                    .filter(key => {
                      const inBucket = personaConfig.buckets!.some(b => b.sections.includes(key));
                      return !inBucket && SECTION_RENDERERS[key];
                    })
                    .map(key => (
                      <div key={key}>
                        {SECTION_RENDERERS[key]()}
                        <Separator className="mb-8" />
                      </div>
                    ))}
                </>
              );
            }

            // Default: render sections in flat order
            return sectionOrder
              .filter(key => isSectionVisible(activePersona, key) && SECTION_RENDERERS[key])
              .map((key) => (
                <div key={key}>
                  {SECTION_RENDERERS[key]()}
                  <Separator className="mb-8" />
                </div>
              ));
          })()}

          {/* ═══════════════════════════════════════════════════════════
              RUN FULL SCAN BUTTON
             ═══════════════════════════════════════════════════════════ */}
          <section className="mb-8">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/[0.04] to-transparent">
              <CardContent className="p-6 text-center">
                <Scan className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">Run Full Company Scan</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Pull the latest public records from FEC, Senate LDA, USAspending, and more. Updates all sections above.
                </p>
                <Button onClick={handleFullScan} disabled={isScanning || isDiscovering} size="lg" className="gap-2">
                  {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isScanning ? "Scanning all modules…" : "Run Full Company Scan"}
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Offer Check CTA */}
          <Card className="border-primary/15 bg-gradient-to-r from-primary/[0.03] to-transparent mb-8">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 border border-primary/10">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm">Got an offer from {name}?</h3>
                <p className="text-xs text-muted-foreground">Run an Offer Check for personalized signals.</p>
              </div>
              <Button size="sm" onClick={() => navigate(`/offer-check/${dbCompany?.id || id}`)}>
                Run Check
              </Button>
            </CardContent>
          </Card>

          {/* Related Reports */}
          <RelatedReportsCard companyName={name} companyId={dbCompanyId} />

          {/* Sources footer */}
          <div className="mt-8 mb-4">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Data from FEC.gov, Senate LDA, USASpending.gov, OpenCorporates, and public filings.
              Executive donations reflect personal giving. This platform provides publicly available data for informational purposes only.
            </p>
          </div>
          </ReportTeaserGate>

          <PostReportNudge />
        </motion.div>
      </div>

      {/* ─── Drawers ─── */}
      <CandidateDetailDrawer open={candidateDrawerOpen} onOpenChange={setCandidateDrawerOpen} candidate={selectedCandidate} companyName={name} />
      <ExecutiveDetailDrawer open={executiveDrawerOpen} onOpenChange={setExecutiveDrawerOpen} executive={selectedExecutive} companyName={name} onCandidateClick={(c) => { setExecutiveDrawerOpen(false); setTimeout(() => handleCandidateClick(c), 300); }} />
      <LobbyingDetailDrawer open={lobbyingDrawerOpen} onOpenChange={setLobbyingDrawerOpen} companyId={dbCompany?.id} companyName={name} totalLobbyingSpend={dbCompany?.lobbying_spend} />
      <PACDetailDrawer open={pacDrawerOpen} onOpenChange={setPacDrawerOpen} companyId={dbCompany?.id} companyName={name} totalPACSpending={totalPac} corporatePACExists={dbCompany?.corporate_pac_exists || false} />
      <ContractsDetailDrawer open={contractsDrawerOpen} onOpenChange={setContractsDrawerOpen} companyId={dbCompany?.id} companyName={name} totalContracts={govContracts || undefined} totalSubsidies={subsidies || undefined} />
    </ContentProtector>
  );
}
