import { useState, useMemo, ReactNode, useCallback, useEffect, useRef } from "react";
import { CompanyHistoryTimeline } from "@/components/CompanyHistoryTimeline";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, ArrowLeft, Calendar, DollarSign, Users, Flag,
  Network, Scale, MessageSquareWarning, ExternalLink, Shield, Megaphone,
  AlertTriangle, EyeOff, RotateCcw, TrendingUp, Landmark, FileText,
  BarChart3, Loader2, Sparkles, Search, ClipboardCheck, CheckCircle2, HelpCircle,
  Heart, Brain, Briefcase, ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LensSelector } from "@/components/LensSelector";
import { ValuesCheckSection, type ValuesCheckSignal } from "@/components/values-check/ValuesCheckSection";
import { DataGlossary } from "@/components/DataGlossary";
import { OpenSecretsEnrichmentCard } from "@/components/OpenSecretsEnrichmentCard";
import { ExplainableMetric } from "@/components/ExplainableMetric";
import { CompanyLogo } from "@/components/CompanyLogo";
import { PlatformPhilosophy } from "@/components/PlatformPhilosophy";
import { type LensId, getLens } from "@/lib/lensConfig";
import { ShareableScorecard } from "@/components/ShareableScorecard";
import { EmbedBadge } from "@/components/EmbedBadge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from "@/components/Footer";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { companies, formatCurrency, getFootprintLabel } from "@/data/sampleData";
import { cn } from "@/lib/utils";
import { InfluenceROICard } from "@/components/InfluenceROICard";
import { HypocrisyIndexCard } from "@/components/HypocrisyIndexCard";
import { PoliticalRiskCard } from "@/components/PoliticalRiskCard";
import { BenchmarkCard } from "@/components/BenchmarkCard";
import { ROIPipelineCard } from "@/components/ROIPipelineCard";
import { SocialMonitorCard } from "@/components/SocialMonitorCard";
import { AgencyContractsCard } from "@/components/AgencyContractsCard";
import { IdeologyFlagsCard } from "@/components/IdeologyFlagsCard";
import { WorkerSentimentCard } from "@/components/WorkerSentimentCard";
import { InfluenceChainCard } from "@/components/InfluenceChainCard";
import { AIHiringCard } from "@/components/AIHiringCard";
import { WorkerBenefitsCard } from "@/components/WorkerBenefitsCard";
import { AIAccountabilityCard } from "@/components/AIAccountabilityCard";
import { HiringTransparencyCard } from "@/components/HiringTransparencyCard";
import { CompensationTransparencyCard } from "@/components/CompensationTransparencyCard";
import { CompanyIntelligenceScanCard } from "@/components/CompanyIntelligenceScanCard";
import { ScanDebugPanel } from "@/components/ScanDebugPanel";
import { MonitoredPagesPanel } from "@/components/MonitoredPagesPanel";
import { SignalTimeline } from "@/components/SignalTimeline";
import { WatchCompanyButton } from "@/components/WatchCompanyButton";
import { ManualSignalEntry } from "@/components/ManualSignalEntry";
import { CandidateDetailDrawer } from "@/components/CandidateDetailDrawer";
import { PartyBadge } from "@/components/PartyBadge";
import { ExecutiveDetailDrawer } from "@/components/ExecutiveDetailDrawer";
import { LobbyingDetailDrawer } from "@/components/LobbyingDetailDrawer";
import { PACDetailDrawer } from "@/components/PACDetailDrawer";
import { ContractsDetailDrawer } from "@/components/ContractsDetailDrawer";
import { WarnTrackerCard } from "@/components/WarnTrackerCard";
import { SurvivorAlertCard } from "@/components/SurvivorAlertCard";
import { PromotionEquityCard } from "@/components/PromotionEquityCard";
import { RelatedReportsCard } from "@/components/RelatedReportsCard";
import { MonitoringStatusCard } from "@/components/MonitoringStatusCard";
import { ProfileInsightsSummary } from "@/components/ProfileInsightsSummary";
import { useROIPipeline } from "@/hooks/use-roi-pipeline";
import { WhatYoureSupportingCard } from "@/components/WhatYoureSupportingCard";
import { TransparencyIndex } from "@/components/TransparencyIndex";
import { TalentSignalsCard } from "@/components/recruiting/TalentSignalsCard";
import { CandidateAttractionScore } from "@/components/recruiting/CandidateAttractionScore";
import { SignalsDetectedSummary } from "@/components/recruiting/SignalsDetectedSummary";
import { TalentRiskSignals } from "@/components/recruiting/TalentRiskSignals";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCompanySEO } from "@/hooks/use-company-seo";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";

/* ─── Status labels ─── */
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  discovered: { label: "Discovered", color: "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30" },
  identity_matched: { label: "Identity Verified", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  research_in_progress: { label: "Research In Progress", color: "bg-primary/10 text-primary border-primary/30" },
  partially_verified: { label: "Partially Verified", color: "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30" },
  verified: { label: "Verified", color: "bg-civic-green/10 text-civic-green border-civic-green/30" },
  failed_to_verify: { label: "Unverified", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, subtext, onClick }: {
  icon: any; label: string; value: string; subtext?: string; onClick?: () => void;
}) {
  return (
    <Card className={cn("overflow-hidden h-full", onClick && "cursor-pointer hover:border-primary/30 hover:shadow-md transition-all")} onClick={onClick}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </div>
        <div className="text-2xl font-bold text-foreground font-display-number leading-tight">{value}</div>
        {subtext && <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{subtext}</p>}
        {onClick && <span className="text-[10px] text-primary font-medium mt-1 block">View details →</span>}
      </CardContent>
    </Card>
  );
}

/* ─── Helper: check if a company has enough data to show full profile ─── */
function hasSubstantiveData(opts: {
  totalPac: number; lobbyingSpend: number; govContracts: number;
  candidates: number; executives: number; stances: number;
}) {
  return opts.totalPac > 0 || opts.lobbyingSpend > 0 || opts.govContracts > 0 ||
    opts.candidates > 0 || opts.executives > 0 || opts.stances > 0;
}

export default function CompanyProfile() {
  const { id } = useParams();
  const company = companies.find((c) => c.id === id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEnriching, setIsEnriching] = useState(false);
  const [activeLens, setActiveLens] = useState<LensId>("influence");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false);
  const [selectedExecutive, setSelectedExecutive] = useState<any>(null);
  const [executiveDrawerOpen, setExecutiveDrawerOpen] = useState(false);
  const [partyFilteredCandidates, setPartyFilteredCandidates] = useState<any[] | null>(null);
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

  const hasDetailedData = (dbCandidates?.length || 0) > 0 || (dbExecutives?.length || 0) > 0;

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
      toast({ title: "Values Check generated", description: "Values signals have been mapped from available evidence." });
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

  // Transparency Index signals
  const { data: tiAiHr } = useQuery({ queryKey: ["ti-ai-hr", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("ai_hr_signals" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiBenefits } = useQuery({ queryKey: ["ti-benefits", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("worker_benefit_signals" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiPayEquity } = useQuery({ queryKey: ["ti-pay", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("pay_equity_signals" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiSentiment } = useQuery({ queryKey: ["ti-sentiment", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("company_worker_sentiment" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const { data: tiIdeology } = useQuery({ queryKey: ["ti-ideology", dbCompanyId], queryFn: async () => { const { count } = await supabase.from("company_ideology_flags" as any).select("id", { count: "exact", head: true }).eq("company_id", dbCompanyId!); return (count || 0) > 0; }, enabled: !!dbCompanyId });
  const hasCivicInfluence = (dbCandidates?.length || 0) > 0 || (dbCompany as any)?.lobbying_spend > 0 || (dbCompany as any)?.total_pac_spending > 0;
  const hasWorkforceDisclosure = (dbPublicStances?.length || 0) > 0;

  const transparencyCategories = [
    { key: "civic-influence", label: "Civic Influence", hasSignals: !!hasCivicInfluence },
    { key: "workforce-disclosure", label: "Workforce Disclosure", hasSignals: !!hasWorkforceDisclosure },
    { key: "hiring-technology", label: "Hiring Technology", hasSignals: !!tiAiHr },
    { key: "compensation-transparency", label: "Compensation Transparency", hasSignals: !!tiPayEquity },
    { key: "worker-benefits", label: "Worker Benefits", hasSignals: !!tiBenefits },
    { key: "organizational-affiliation", label: "Organizational Affiliations", hasSignals: !!tiIdeology },
    { key: "worker-sentiment", label: "Worker Sentiment", hasSignals: !!tiSentiment },
  ];

  const handleEnrich = async () => {
    if (!dbCompany) return;
    setIsEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke("company-research", { body: { companyName: dbCompany.name, enrichExisting: true } });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Data enriched!", description: `AI populated ${Object.values(data.tablesPopulated || {}).reduce((a: number, b: any) => a + (b as number), 0)} records for ${dbCompany.name}.` });
        queryClient.invalidateQueries({ queryKey: ["company-profile", id] });
        queryClient.invalidateQueries({ queryKey: ["company-candidates", dbCompanyId] });
        queryClient.invalidateQueries({ queryKey: ["company-executives", dbCompanyId] });
        queryClient.invalidateQueries({ queryKey: ["company-party-breakdown", dbCompanyId] });
        queryClient.invalidateQueries({ queryKey: ["company-public-stances", dbCompanyId] });
        queryClient.invalidateQueries({ queryKey: ["company-dark-money", dbCompanyId] });
        queryClient.invalidateQueries({ queryKey: ["company-revolving-door", dbCompanyId] });
      } else { throw new Error(data?.error || "Enrichment failed"); }
    } catch (e: any) {
      toast({ title: "Enrichment failed", description: e.message, variant: "destructive" });
    } finally { setIsEnriching(false); }
  };

  const dbCompanyIdMap: Record<string, string> = {
    "google": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "home-depot": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "koch-industries": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  };
  const pipelineCompanyId = company ? dbCompanyIdMap[company.id] : dbCompany?.id;
  const pipelineCompanyName = company?.name || dbCompany?.name;
  const { data: livePipeline, isLoading: pipelineLoading, autoScanning, hasBeenScanned, triggerScan } = useROIPipeline(pipelineCompanyId, pipelineCompanyName);

  const seoTarget = dbCompany || (company ? { name: company.name, industry: company.industry || "", state: company.state || "", description: "", slug: company.id } : null);
  useCompanySEO({ name: seoTarget?.name || "", industry: seoTarget?.industry || "", state: seoTarget?.state || "", description: (seoTarget as any)?.description || "", slug: id || seoTarget?.slug || "" });

  // ─── Loading / Not Found ───
  if (!company && dbLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Use DB company for the primary view; fall back to sample data
  const displayCompany = dbCompany || company;

  if (!displayCompany) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Company Not Found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This company isn't in our database yet. Search for it to start building its transparency profile.
          </p>
          <Link to="/search">
            <Button className="gap-2"><Search className="w-4 h-4" />Search & Discover</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Normalize fields from DB or sample data
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

  return (
    <div className="flex flex-col min-h-0">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Breadcrumb */}
        <Link to="/browse" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to directory
        </Link>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* ═══════════════════════════════════════════════════════════
              HERO: Company Header
             ═══════════════════════════════════════════════════════════ */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-6">
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
                      <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium whitespace-nowrap ${statusInfo.color}`}>
                        {isDiscovering && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                        {statusInfo.label}
                      </span>
                    )}
                    <CivicFootprintBadge score={civicScore} size="sm" />
                  </div>
                  {(dbCompany as any)?.parent_company && (
                    <p className="text-xs text-muted-foreground mt-0.5">Parent: {(dbCompany as any).parent_company}</p>
                  )}
                </div>
                {/* Actions — compact */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <WatchCompanyButton companyId={dbCompany?.id || company?.id || ""} companyName={name} />
                  <ShareableScorecard data={{
                    name, industry, state, civicFootprintScore: civicScore,
                    totalPacSpending: totalPac, lobbyingSpend: lobbyingSpend || undefined,
                    confidenceRating: dbCompany?.confidence_rating || company?.confidenceRating || "medium",
                    governmentContracts: govContracts || undefined,
                    partyBreakdown: dbPartyBreakdown?.map(p => ({ party: p.party, amount: p.amount, color: p.color })),
                  }} />
                  <Button
                    onClick={handleEnrich}
                    disabled={isEnriching}
                    size="sm"
                    variant={hasDetailedData ? "outline" : "default"}
                    className="gap-1.5"
                  >
                    {isEnriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isEnriching ? "Researching…" : hasDetailedData ? "Refresh" : "AI Research"}</span>
                  </Button>
                </div>
              </div>

              {/* Description — truncated */}
              {description && (
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2 max-w-2xl">{description}</p>
              )}

              {/* Meta badges — single row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">{industry}</Badge>
                <Badge variant="secondary" className="text-xs">{state}</Badge>
                {(dbCompany as any)?.revenue && <Badge variant="secondary" className="text-xs">{(dbCompany as any).revenue}</Badge>}
                {(dbCompany as any)?.employee_count && <Badge variant="secondary" className="text-xs">{(dbCompany as any).employee_count} employees</Badge>}
                {(dbCompany as any)?.ticker && <Badge variant="outline" className="font-mono text-[10px]">{(dbCompany as any).ticker}</Badge>}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              DISCOVERY BANNER (when scanning)
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
                      <p className="text-sm font-medium text-foreground">Building Transparency Profile — {completedCount}/{scanItems.length} complete</p>
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
              KEY STATS ROW — only show cards with actual data
             ═══════════════════════════════════════════════════════════ */}
          {(() => {
            const stats = [
              totalPac > 0 && <StatCard key="pac" icon={DollarSign} label="PAC Spending" value={formatCurrency(totalPac)} subtext="Current cycle" onClick={() => setPacDrawerOpen(true)} />,
              lobbyingSpend > 0 && <StatCard key="lobby" icon={Megaphone} label="Federal Lobbying" value={formatCurrency(lobbyingSpend)} subtext="Senate LDA filings" onClick={() => setLobbyingDrawerOpen(true)} />,
              govContracts > 0 && <StatCard key="contracts" icon={Landmark} label="Gov Contracts" value={formatCurrency(govContracts)} subtext="Federal awards" onClick={() => setContractsDrawerOpen(true)} />,
              civicScore > 0 && <StatCard key="civic" icon={Scale} label="Civic Footprint" value={`${civicScore}/100`} subtext="Political activity level" />,
            ].filter(Boolean);

            if (stats.length === 0) return null;
            return (
              <div className={`grid grid-cols-2 gap-3 mb-6 ${stats.length === 1 ? 'md:grid-cols-1 max-w-xs' : stats.length === 2 ? 'md:grid-cols-2' : stats.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                {stats}
              </div>
            );
          })()}

          {/* ═══════════════════════════════════════════════════════════
              NO DATA YET — Show clear CTA when company lacks data
             ═══════════════════════════════════════════════════════════ */}
          {dbCompany && !isDiscovering && !hasSubstantiveData({
            totalPac, lobbyingSpend, govContracts,
            candidates: dbCandidates?.length || 0,
            executives: dbExecutives?.length || 0,
            stances: dbPublicStances?.length || 0,
          }) && (
            <Card className="mb-6 border-dashed border-primary/20">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">No intelligence data yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  This company hasn't been scanned. Run an AI research scan to pull public records from FEC, Senate LDA, USAspending, and more.
                </p>
                <Button onClick={handleEnrich} disabled={isEnriching} className="gap-1.5">
                  {isEnriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isEnriching ? "Scanning…" : "Run Intelligence Scan"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TABBED CONTENT AREA
             ═══════════════════════════════════════════════════════════ */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto border-b border-border bg-transparent rounded-none h-auto p-0 gap-0">
              {[
                { value: "overview", label: "Overview", show: true },
                { value: "money", label: "Money Trail", show: totalPac > 0 || lobbyingSpend > 0 || (dbCandidates?.length || 0) > 0 || (dbDarkMoney?.length || 0) > 0 },
                { value: "workforce", label: "Workforce", show: true },
                { value: "values", label: "Values Check", show: true },
                { value: "signals", label: "Signals & Timeline", show: !!dbCompany },
              ].filter(tab => tab.show).map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ─── OVERVIEW TAB ─── */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Insights summary — only when there's at least some data */}
              {dbCompany && (() => {
                const hasPoliticalSpending = totalPac > 0 || lobbyingSpend > 0 || (dbCandidates?.length || 0) > 0;
                const insights = [
                  { key: "executives", label: "Leadership Identified", found: (dbExecutives?.length || 0) > 0, detail: (dbExecutives || []).map((e: any) => `${e.name} (${e.title})`).join(", ") || "None found", icon: <Users className="w-4 h-4 text-primary" /> },
                  { key: "stances", label: "Public Stances Mapped", found: (dbPublicStances?.length || 0) > 0, detail: (dbPublicStances || []).map((s: any) => s.topic).join(", ") || "None found", icon: <Shield className="w-4 h-4 text-primary" /> },
                  { key: "values", label: "Values Signals", found: (valuesCheckSignals?.length || 0) > 0, detail: `${valuesCheckSignals?.length || 0} signal(s)`, icon: <Heart className="w-4 h-4 text-primary" /> },
                  { key: "sentiment", label: "Worker Sentiment", found: !!tiSentiment, detail: "Signals detected", icon: <TrendingUp className="w-4 h-4 text-primary" /> },
                  { key: "hiring", label: "Hiring Technology", found: !!tiAiHr, detail: "AI tools detected", icon: <Brain className="w-4 h-4 text-primary" /> },
                  { key: "benefits", label: "Benefits Data", found: !!tiBenefits, detail: "Signals found", icon: <Briefcase className="w-4 h-4 text-primary" /> },
                ];
                const hasAnyInsight = insights.some(i => i.found) || hasPoliticalSpending;
                if (!hasAnyInsight) return null;
                return <ProfileInsightsSummary companyName={name} hasPoliticalSpending={hasPoliticalSpending} insights={insights} />;
              })()}

              {/* Transparency Index — only show when there's at least one signal */}
              {transparencyCategories.some(c => c.hasSignals) && (
                <TransparencyIndex categories={transparencyCategories} />
              )}

              {/* What You're Supporting — only when there's political/influence data */}
              {dbCompany && (totalPac > 0 || lobbyingSpend > 0 || (dbCandidates?.length || 0) > 0 || (dbIssueSignals?.length || 0) > 0) && (
                <WhatYoureSupportingCard
                  companyName={name}
                  totalPacSpending={totalPac}
                  lobbyingSpend={lobbyingSpend}
                  topCandidates={(dbCandidates || []).sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0)).slice(0, 5).map((c: any) => ({ name: c.name, party: c.party, amount: c.amount, state: c.state }))}
                  lobbyingDetails={dbLobbyingDetails || []}
                  publicStances={(dbPublicStances || []).map((s: any) => ({ topic: s.topic, public_position: s.public_position, spending_reality: s.spending_reality }))}
                  topIssuesLobbied={[
                    ...(dbStateLobbying || []).flatMap((s: any) => s.issues || []),
                    ...(dbIssueSignals || []).map((s: any) => s.issue_category?.replace(/_/g, " ")),
                  ].filter((v: string, i: number, a: string[]) => v && a.indexOf(v) === i).slice(0, 12)}
                  darkMoneyConnections={(dbDarkMoney || []).length}
                  darkMoneyRecords={(dbDarkMoney || []).map((dm: any) => ({ name: dm.name, org_type: dm.org_type, relationship: dm.relationship, estimated_amount: dm.estimated_amount, description: dm.description, source: dm.source, confidence: dm.confidence }))}
                  flaggedOrgCount={0}
                  issueSignals={dbIssueSignals || []}
                />
              )}

              {/* Offer Check CTA */}
              <Card className="border-primary/15 bg-gradient-to-r from-primary/[0.03] to-transparent">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 border border-primary/10">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm">Run the Offer Check</h3>
                    <p className="text-xs text-muted-foreground">Public signals to review before you say yes.</p>
                  </div>
                  <Button size="sm" onClick={() => window.location.href = `/offer-check/${dbCompany?.id || id}`}>
                    Run Check
                  </Button>
                </CardContent>
              </Card>

              {/* Monitoring status */}
              {dbCompany && <MonitoringStatusCard companyId={dbCompany.id} />}
            </TabsContent>

            {/* ─── MONEY TRAIL TAB ─── */}
            <TabsContent value="money" className="mt-6 space-y-6">
              {/* Party breakdown + executives */}
              <div className="grid lg:grid-cols-2 gap-4">
                {dbPartyBreakdown && dbPartyBreakdown.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">PAC Spending by Party</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={dbPartyBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="amount" nameKey="party" className="cursor-pointer" onClick={(_, index) => {
                            const party = dbPartyBreakdown[index]?.party;
                            const filtered = dbCandidates?.filter(c => c.party === party);
                            if (filtered && filtered.length > 0) setPartyFilteredCandidates(filtered);
                            else setPacDrawerOpen(true);
                          }}>
                            {dbPartyBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} className="hover:opacity-80 transition-opacity" />)}
                          </Pie><RechartsTooltip formatter={(val: number) => formatCurrency(val)} /></PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 mt-1">
                        {dbPartyBreakdown.map((p) => (
                          <span key={p.party} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            {p.party}: {formatCurrency(p.amount)}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {dbExecutives && dbExecutives.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Executive Donors</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {dbExecutives.map((exec) => (
                          <button key={exec.id} onClick={() => handleExecutiveClick(exec)} className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors text-left">
                            <div className="flex items-center gap-2.5">
                              {exec.photo_url ? (
                                <img src={exec.photo_url} alt={exec.name} className="w-8 h-8 rounded-full object-cover border border-border/60" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/60"><Users className="w-3.5 h-3.5 text-muted-foreground/70" /></div>
                              )}
                              <div>
                                <div className="font-medium text-sm text-foreground">{exec.name}</div>
                                <div className="text-[11px] text-muted-foreground">{exec.title}</div>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">{formatCurrency(exec.total_donations)}</Badge>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* PAC Recipients table */}
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

              {/* Dark Money + Revolving Door */}
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

              {/* Say vs. Do */}
              {dbPublicStances && dbPublicStances.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><MessageSquareWarning className="w-4 h-4 text-primary" /> Say vs. Do</h3>
                  <div className="space-y-3">
                    {dbPublicStances.map((stance) => (
                      <Card key={stance.id}><CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground text-sm mb-2">{stance.topic}</h4>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div><p className="text-[11px] font-medium text-muted-foreground mb-0.5">🗣️ Public Position</p><p className="text-sm text-foreground">{stance.public_position}</p></div>
                              <div><p className="text-[11px] font-medium text-muted-foreground mb-0.5">💰 Spending Reality</p><p className="text-sm text-foreground">{stance.spending_reality}</p></div>
                            </div>
                          </div>
                          <Badge variant={stance.gap === "direct-conflict" ? "destructive" : stance.gap === "aligned" ? "secondary" : "outline"} className="shrink-0 text-xs">
                            {stance.gap === "direct-conflict" ? "Conflict" : stance.gap === "aligned" ? "Aligned" : "Mixed"}
                          </Badge>
                        </div>
                      </CardContent></Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ROI Pipeline */}
              <ROIPipelineCard data={livePipeline || { moneyIn: [], network: [], benefitsOut: [], linkages: [], totalSpending: 0, totalBenefits: 0 }} isSearching={!livePipeline && !!dbCompanyId} onTriggerScan={triggerScan} autoScanning={autoScanning} hasBeenScanned={hasBeenScanned} enrichmentData={enrichmentData} />
              {enrichmentData && <OpenSecretsEnrichmentCard data={enrichmentData} />}

              {/* Agency Contracts */}
              <AgencyContractsCard companyName={name} dbCompanyId={dbCompanyId} />
            </TabsContent>

            {/* ─── WORKFORCE TAB ─── */}
            <TabsContent value="workforce" className="mt-6 space-y-6">
              <WorkerSentimentCard companyName={name} dbCompanyId={dbCompanyId} />
              <AIHiringCard companyName={name} dbCompanyId={dbCompanyId} />
              <HiringTransparencyCard companyName={name} dbCompanyId={dbCompanyId} />
              <WorkerBenefitsCard companyName={name} dbCompanyId={dbCompanyId} />
              <CompensationTransparencyCard companyName={name} dbCompanyId={dbCompanyId} />
              <AIAccountabilityCard companyName={name} dbCompanyId={dbCompanyId} />
              <PromotionEquityCard companyName={name} dbCompanyId={dbCompanyId} />
              <WarnTrackerCard companyName={name} dbCompanyId={dbCompanyId} />
              <SurvivorAlertCard companyName={name} dbCompanyId={dbCompanyId} />
              <IdeologyFlagsCard companyName={name} dbCompanyId={dbCompanyId} />
            </TabsContent>

            {/* ─── VALUES CHECK TAB ─── */}
            <TabsContent value="values" className="mt-6 space-y-6">
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
              <SocialMonitorCard companyId={dbCompany?.slug || id || ""} companyName={name} executiveNames={dbExecutives?.map(e => e.name) || []} dbCompanyId={dbCompanyId} />
            </TabsContent>

            {/* ─── SIGNALS & TIMELINE TAB ─── */}
            <TabsContent value="signals" className="mt-6 space-y-6">
              {dbCompany && <CompanyIntelligenceScanCard companyId={dbCompany.id} companyName={name} />}
              {dbCompany && <CompanyHistoryTimeline companyId={dbCompany.id} companyName={name} />}
              {dbCompany && <SignalTimeline companyId={dbCompany.id} />}
              {dbCompany && <MonitoredPagesPanel companyId={dbCompany.id} />}
              <RelatedReportsCard companyName={name} companyId={dbCompanyId} />

              {/* Advanced / Debug — collapsed */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs">
                    <ChevronDown className="w-3.5 h-3.5" />
                    Advanced Tools
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-3">
                  {dbCompany && <ManualSignalEntry companyId={dbCompany.id} companyName={name} />}
                  {dbCompany && <ScanDebugPanel companyId={dbCompany.id} />}
                  <DataGlossary />
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>
          </Tabs>

          {/* Party-filtered candidates overlay */}
          {partyFilteredCandidates && partyFilteredCandidates.length > 0 && (
            <Card className="mt-6 border-primary/20 overflow-hidden">
              <div className="bg-primary/5 border-b border-primary/10 px-4 py-2.5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <PartyBadge party={partyFilteredCandidates[0]?.party} entityType="politician" size="sm" />
                    {partyFilteredCandidates[0]?.party} Recipients
                    <Badge variant="secondary" className="text-[10px]">{partyFilteredCandidates.length}</Badge>
                  </h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPartyFilteredCandidates(null)} className="text-xs h-7">✕ Close</Button>
              </div>
              <CardContent className="p-3">
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {partyFilteredCandidates.sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0)).map((c: any) => (
                    <button key={c.id} onClick={() => handleCandidateClick(c)} className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-card hover:bg-accent/50 border border-border/60 hover:border-primary/30 transition-all text-left">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <span className="text-[11px] text-muted-foreground ml-2">{c.state}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(c.amount)}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sources footer */}
          <div className="mt-8 mb-4">
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              Data from FEC.gov, Senate LDA, USASpending.gov, OpenCorporates, and public filings.
              Executive donations reflect personal giving. This platform provides publicly available data for informational purposes only.
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── Drawers ─── */}
      <CandidateDetailDrawer open={candidateDrawerOpen} onOpenChange={setCandidateDrawerOpen} candidate={selectedCandidate} companyName={name} />
      <ExecutiveDetailDrawer open={executiveDrawerOpen} onOpenChange={setExecutiveDrawerOpen} executive={selectedExecutive} companyName={name} onCandidateClick={(c) => { setExecutiveDrawerOpen(false); setTimeout(() => handleCandidateClick(c), 300); }} />
      <LobbyingDetailDrawer open={lobbyingDrawerOpen} onOpenChange={setLobbyingDrawerOpen} companyId={dbCompany?.id} companyName={name} totalLobbyingSpend={dbCompany?.lobbying_spend} />
      <PACDetailDrawer open={pacDrawerOpen} onOpenChange={setPacDrawerOpen} companyId={dbCompany?.id} companyName={name} totalPACSpending={totalPac} corporatePACExists={dbCompany?.corporate_pac_exists || false} />
      <ContractsDetailDrawer open={contractsDrawerOpen} onOpenChange={setContractsDrawerOpen} companyId={dbCompany?.id} companyName={name} totalContracts={govContracts || undefined} totalSubsidies={subsidies || undefined} />
    </div>
  );
}
