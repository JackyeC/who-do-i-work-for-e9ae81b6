import { useState, useMemo, ReactNode } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, ArrowLeft, Calendar, DollarSign, Users, Flag,
  Network, Scale, MessageSquareWarning, ExternalLink, Shield, Megaphone,
  AlertTriangle, EyeOff, RotateCcw, TrendingUp, Landmark, FileText,
  BarChart3, Loader2, Sparkles, Search, ClipboardCheck, CheckCircle2
} from "lucide-react";
import { LensSelector } from "@/components/LensSelector";
import { PlatformPhilosophy } from "@/components/PlatformPhilosophy";
import { type LensId, getLens } from "@/lib/lensConfig";
import { ShareableScorecard } from "@/components/ShareableScorecard";
import { EmbedBadge } from "@/components/EmbedBadge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
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
import { useROIPipeline } from "@/hooks/use-roi-pipeline";
import { TransparencyIndex } from "@/components/TransparencyIndex";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

/** Renders DB-only company modules in lens priority order */
function DbLensModules({ activeLens, dbCompany, dbPartyBreakdown, dbCandidates, dbExecutives, dbPublicStances, dbDarkMoney, dbRevolvingDoor, livePipeline }: {
  activeLens: LensId;
  dbCompany: any;
  dbPartyBreakdown: any[] | null | undefined;
  dbCandidates: any[] | null | undefined;
  dbExecutives: any[] | null | undefined;
  dbPublicStances: any[] | null | undefined;
  dbDarkMoney: any[] | null | undefined;
  dbRevolvingDoor: any[] | null | undefined;
  livePipeline: any;
}) {
  const lens = getLens(activeLens);

  const modules: Record<string, ReactNode> = {
    "money-trail": ((dbPartyBreakdown?.length || 0) > 0 || (dbCandidates?.length || 0) > 0 || (dbExecutives?.length || 0) > 0) ? (
      <div key="money-trail" className="mb-10">
        <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" /> Money Trail
        </h2>
        <p className="text-sm text-muted-foreground mb-4">PAC contributions, candidate support, and executive personal giving.</p>
        <div className="grid lg:grid-cols-2 gap-6">
          {dbPartyBreakdown && dbPartyBreakdown.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">PAC Spending by Party</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={dbPartyBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="amount" nameKey="party">
                      {dbPartyBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie><Tooltip formatter={(val: number) => formatCurrency(val)} /></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {dbPartyBreakdown.map((p) => (
                    <div key={p.party} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-muted-foreground">{p.party}: {formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {dbExecutives && dbExecutives.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-4 h-4" /> Executive Donors</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dbExecutives.map((exec) => (
                    <div key={exec.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <div className="font-medium text-sm text-foreground">{exec.name}</div>
                        <div className="text-xs text-muted-foreground">{exec.title}</div>
                      </div>
                      <Badge variant="secondary">{formatCurrency(exec.total_donations)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        {dbCandidates && dbCandidates.length > 0 && (
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Flag className="w-4 h-4" /> PAC Recipients ({dbCandidates.length} politicians)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Party</TableHead><TableHead>State</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
                <TableBody>
                  {dbCandidates.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}{c.flagged && <Badge variant="destructive" className="ml-2 text-xs">Flagged</Badge>}</TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-xs", c.party === "Republican" && "border-destructive/50 text-destructive", c.party === "Democrat" && "border-primary/50 text-primary")}>{c.party}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{c.state}</TableCell>
                      <TableCell>{formatCurrency(c.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.donation_type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    ) : null,
    "public-stances": dbPublicStances && dbPublicStances.length > 0 ? (
      <div key="public-stances" className="mb-10">
        <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2"><MessageSquareWarning className="w-5 h-5 text-primary" /> Say vs. Do</h2>
        <p className="text-sm text-muted-foreground mb-4">Public positions compared to spending reality.</p>
        <div className="space-y-4">
          {dbPublicStances.map((stance) => (
            <Card key={stance.id}><CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">{stance.topic}</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><p className="text-xs font-medium text-muted-foreground mb-1">🗣️ Public Position</p><p className="text-sm text-foreground">{stance.public_position}</p></div>
                    <div><p className="text-xs font-medium text-muted-foreground mb-1">💰 Spending Reality</p><p className="text-sm text-foreground">{stance.spending_reality}</p></div>
                  </div>
                </div>
                <Badge variant={stance.gap === "direct-conflict" ? "destructive" : stance.gap === "aligned" ? "secondary" : "outline"} className="shrink-0">
                  {stance.gap === "direct-conflict" ? "Conflict" : stance.gap === "aligned" ? "Aligned" : "Mixed"}
                </Badge>
              </div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    ) : null,
    "influence-network": ((dbDarkMoney?.length || 0) > 0 || (dbRevolvingDoor?.length || 0) > 0) ? (
      <div key="influence-network" className="mb-10">
        <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2"><Network className="w-5 h-5 text-primary" /> Influence Network</h2>
        <p className="text-sm text-muted-foreground mb-4">Dark money channels, revolving door, and indirect influence.</p>
        <div className="grid lg:grid-cols-2 gap-6">
          {dbDarkMoney && dbDarkMoney.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><EyeOff className="w-4 h-4" /> Dark Money</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {dbDarkMoney.map((d) => (
                  <div key={d.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm text-foreground">{d.name}</span><Badge variant="outline" className="text-xs">{d.org_type}</Badge></div>
                    {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
                    {d.estimated_amount && <p className="text-xs text-muted-foreground mt-1">Est. {formatCurrency(d.estimated_amount)}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {dbRevolvingDoor && dbRevolvingDoor.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Revolving Door</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {dbRevolvingDoor.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="font-medium text-sm text-foreground">{r.person}</div>
                    <div className="text-xs text-muted-foreground mt-1"><span className="text-foreground/70">{r.prior_role}</span> → <span className="text-foreground/70">{r.new_role}</span></div>
                    {r.relevance && <p className="text-xs text-muted-foreground mt-1">{r.relevance}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    ) : null,
    "government-roi": (dbCompany.government_contracts || dbCompany.subsidies_received || dbCompany.effective_tax_rate) ? (
      <Card key="government-roi" className="mb-6">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Landmark className="w-5 h-5" /> Government ROI</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {dbCompany.government_contracts && <div className="text-center p-3 bg-muted/50 rounded-lg"><div className="text-xl font-bold text-foreground">{formatCurrency(dbCompany.government_contracts)}</div><div className="text-xs text-muted-foreground">Government Contracts</div></div>}
            {dbCompany.subsidies_received && <div className="text-center p-3 bg-muted/50 rounded-lg"><div className="text-xl font-bold text-foreground">{formatCurrency(dbCompany.subsidies_received)}</div><div className="text-xs text-muted-foreground">Subsidies & Tax Breaks</div></div>}
            {dbCompany.effective_tax_rate && <div className="text-center p-3 bg-muted/50 rounded-lg"><div className="text-xl font-bold text-foreground">{dbCompany.effective_tax_rate}</div><div className="text-xs text-muted-foreground">Effective Tax Rate</div></div>}
          </div>
        </CardContent>
      </Card>
    ) : null,
    "roi-pipeline": <div key="roi-pipeline" className="mb-6"><ROIPipelineCard data={livePipeline || { moneyIn: [], network: [], benefitsOut: [], linkages: [], totalSpending: 0, totalBenefits: 0 }} isSearching={!livePipeline && !!dbCompany.id} /></div>,
    "influence-chain": <div key="influence-chain" className="mb-6"><InfluenceChainCard companyId={dbCompany.id} companyName={dbCompany.name} /></div>,
    "social-monitor": <div key="social-monitor" className="mb-6"><SocialMonitorCard companyId={dbCompany.slug} companyName={dbCompany.name} executiveNames={dbExecutives?.map(e => e.name) || []} dbCompanyId={dbCompany.id} /></div>,
    "agency-contracts": <div key="agency-contracts" className="mb-6"><AgencyContractsCard companyName={dbCompany.name} dbCompanyId={dbCompany.id} /></div>,
    "ideology-flags": <div key="ideology-flags" className="mb-6"><IdeologyFlagsCard companyName={dbCompany.name} dbCompanyId={dbCompany.id} /></div>,
    "worker-sentiment": <div key="worker-sentiment" className="mb-6"><WorkerSentimentCard companyName={dbCompany.name} dbCompanyId={dbCompany.id} /></div>,
    "ai-hiring": <div key="ai-hiring" className="mb-6"><AIHiringCard companyName={dbCompany.name} dbCompanyId={dbCompany.id} /></div>,
    "hiring-transparency": <div key="hiring-transparency" className="mb-6"><HiringTransparencyCard companyName={dbCompany.name} dbCompanyId={dbCompany.id} /></div>,
    "worker-benefits": <div key="worker-benefits" className="mb-6"><WorkerBenefitsCard companyName={dbCompany.name} dbCompanyId={dbCompany.id} /></div>,
    "ai-accountability": <div key="ai-accountability" className="mb-6"><AIAccountabilityCard companyName={dbCompany.name} dbCompanyId={dbCompany.id} /></div>,
    "compensation": <div key="compensation" className="mb-6"><CompensationTransparencyCard companyName={dbCompany.name} dbCompanyId={dbCompany.id} /></div>,
  };

  return (
    <div className="space-y-0">
      {lens.modulePriority.map((key) => modules[key]).filter(Boolean)}
    </div>
  );
}

export default function CompanyProfile() {
  const { id } = useParams();
  const company = companies.find((c) => c.id === id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEnriching, setIsEnriching] = useState(false);
  const [activeLens, setActiveLens] = useState<LensId>("influence");

  // Always try to load from DB by slug to get real UUID for chain tracing etc.
  const { data: dbCompany, isLoading: dbLoading } = useQuery({
    queryKey: ["company-profile", id],
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
    // Auto-poll every 10s while company is still being researched
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.record_status;
      if (status && ['discovered', 'identity_matched', 'research_in_progress'].includes(status)) {
        return 10000;
      }
      return false;
    },
  });

  // For DB-only companies (no sample data), use DB data for related queries
  // For sample data companies, still use the DB UUID for features that need it
  const dbCompanyId = dbCompany?.id;

  // Auto-poll child queries while research is in progress
  const isResearching = dbCompany && ['discovered', 'identity_matched', 'research_in_progress'].includes((dbCompany as any)?.record_status || '');
  const pollInterval = isResearching ? 10000 : false;

  const { data: dbCandidates } = useQuery({
    queryKey: ["company-candidates", dbCompanyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_candidates").select("*").eq("company_id", dbCompanyId!).order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!dbCompanyId,
    refetchInterval: pollInterval,
  });

  const { data: dbExecutives } = useQuery({
    queryKey: ["company-executives", dbCompanyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_executives").select("*").eq("company_id", dbCompanyId!).order("total_donations", { ascending: false });
      return data || [];
    },
    enabled: !!dbCompanyId,
    refetchInterval: pollInterval,
  });

  const { data: dbPartyBreakdown } = useQuery({
    queryKey: ["company-party-breakdown", dbCompanyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_party_breakdown").select("*").eq("company_id", dbCompanyId!);
      return data || [];
    },
    enabled: !!dbCompanyId,
    refetchInterval: pollInterval,
  });

  const { data: dbPublicStances } = useQuery({
    queryKey: ["company-public-stances", dbCompanyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_public_stances").select("*").eq("company_id", dbCompanyId!);
      return data || [];
    },
    enabled: !!dbCompanyId,
    refetchInterval: pollInterval,
  });

  const { data: dbDarkMoney } = useQuery({
    queryKey: ["company-dark-money", dbCompanyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_dark_money").select("*").eq("company_id", dbCompanyId!);
      return data || [];
    },
    enabled: !!dbCompanyId,
    refetchInterval: pollInterval,
  });

  const { data: dbRevolvingDoor } = useQuery({
    queryKey: ["company-revolving-door", dbCompanyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_revolving_door").select("*").eq("company_id", dbCompanyId!);
      return data || [];
    },
    enabled: !!dbCompanyId,
    refetchInterval: pollInterval,
  });

  const hasDetailedData = (dbCandidates?.length || 0) > 0 || (dbExecutives?.length || 0) > 0;

  // Transparency Index: check signal presence across categories
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
      const { data, error } = await supabase.functions.invoke("company-research", {
        body: { companyName: dbCompany.name, enrichExisting: true },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Data enriched!", description: `AI populated ${Object.values(data.tablesPopulated || {}).reduce((a: number, b: any) => a + (b as number), 0)} records for ${dbCompany.name}.` });
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: ["company-profile", id] });
        queryClient.invalidateQueries({ queryKey: ["company-candidates", dbCompanyId] });
        queryClient.invalidateQueries({ queryKey: ["company-executives", dbCompanyId] });
        queryClient.invalidateQueries({ queryKey: ["company-party-breakdown", dbCompanyId] });
        queryClient.invalidateQueries({ queryKey: ["company-public-stances", dbCompanyId] });
        queryClient.invalidateQueries({ queryKey: ["company-dark-money", dbCompanyId] });
        queryClient.invalidateQueries({ queryKey: ["company-revolving-door", dbCompanyId] });
      } else {
        throw new Error(data?.error || "Enrichment failed");
      }
    } catch (e: any) {
      toast({ title: "Enrichment failed", description: e.message, variant: "destructive" });
    } finally {
      setIsEnriching(false);
    }
  };
  
  // Map sample company slugs to seeded DB company IDs for live pipeline data
  const dbCompanyIdMap: Record<string, string> = {
    "google": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "home-depot": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "koch-industries": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  };
  const pipelineCompanyId = company ? dbCompanyIdMap[company.id] : dbCompany?.id;
  const { data: livePipeline, isLoading: pipelineLoading } = useROIPipeline(pipelineCompanyId);

  // Loading state for DB-only companies
  if (!company && dbLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // DB-only company profile (no sample data)
  if (!company && dbCompany) {
    const isDiscovering = isResearching;
    const statusLabels: Record<string, { label: string; color: string }> = {
      discovered: { label: 'Discovered', color: 'bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30' },
      identity_matched: { label: 'Identity Verified', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
      research_in_progress: { label: 'Research In Progress', color: 'bg-primary/10 text-primary border-primary/30' },
      partially_verified: { label: 'Partially Verified', color: 'bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30' },
      verified: { label: 'Verified', color: 'bg-civic-green/10 text-civic-green border-civic-green/30' },
      failed_to_verify: { label: 'Unverified', color: 'bg-destructive/10 text-destructive border-destructive/30' },
    };
    const recordStatus = (dbCompany as any).record_status || 'verified';
    const statusInfo = statusLabels[recordStatus] || statusLabels.verified;

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to directory
          </Link>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Company Overview */}
            <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground">{dbCompany.name}</h1>
                      {recordStatus !== 'verified' && (
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>
                          {isDiscovering && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                          {statusInfo.label}
                        </span>
                      )}
                    </div>
                    {dbCompany.parent_company && (
                      <p className="text-sm text-muted-foreground mb-1">Parent: {dbCompany.parent_company}</p>
                    )}
                    <p className="text-muted-foreground mb-3">{dbCompany.description}</p>
                    {(dbCompany as any).verification_notes && (
                      <p className="text-xs text-civic-yellow mb-2">⚠ {(dbCompany as any).verification_notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <ShareableScorecard data={{
                      name: dbCompany.name,
                      industry: dbCompany.industry,
                      state: dbCompany.state,
                      civicFootprintScore: dbCompany.civic_footprint_score,
                      totalPacSpending: dbCompany.total_pac_spending,
                      lobbyingSpend: dbCompany.lobbying_spend ?? undefined,
                      confidenceRating: dbCompany.confidence_rating,
                      governmentContracts: dbCompany.government_contracts ?? undefined,
                      partyBreakdown: dbPartyBreakdown?.map(p => ({ party: p.party, amount: p.amount, color: p.color })),
                    }} />
                    <EmbedBadge slug={dbCompany.slug} companyName={dbCompany.name} />
                    <Button
                      onClick={handleEnrich}
                      disabled={isEnriching}
                      variant={hasDetailedData ? "outline" : "default"}
                      className="shrink-0 gap-2"
                    >
                      {isEnriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isEnriching ? "Researching..." : hasDetailedData ? "Refresh Data" : "AI Research"}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">{dbCompany.industry}</Badge>
                  <Badge variant="secondary">{dbCompany.state}</Badge>
                  {dbCompany.revenue && <Badge variant="secondary">Revenue: {dbCompany.revenue}</Badge>}
                  {dbCompany.employee_count && <Badge variant="secondary">{dbCompany.employee_count} employees</Badge>}
                  <CivicFootprintBadge score={dbCompany.civic_footprint_score} />
                </div>
              </div>
            </div>

            {/* Discovery banner for new companies */}
            {isDiscovering && (() => {
              const scanCompletion = (dbCompany as any).scan_completion as Record<string, boolean> | null;
              const scanItems = [
                { key: 'political_spending', label: 'Political spending' },
                { key: 'lobbying', label: 'Lobbying activity' },
                { key: 'trade_associations', label: 'Trade associations' },
                { key: 'executives', label: 'Executive donations' },
                { key: 'ai_hiring', label: 'AI hiring tools' },
                { key: 'worker_sentiment', label: 'Worker sentiment' },
                { key: 'benefits', label: 'Benefits scan' },
                { key: 'government_contracts', label: 'Government contracts' },
              ];
              const completedCount = scanCompletion ? scanItems.filter(s => scanCompletion[s.key]).length : 0;

              return (
                <Card className="mb-8 border-dashed border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">Building Transparency Profile</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Researching public sources… {completedCount}/{scanItems.length} scans complete.
                        </p>
                        <div className="w-full bg-muted rounded-full h-1.5 mb-4">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(completedCount / scanItems.length) * 100}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {scanItems.map((scan) => {
                            const done = scanCompletion?.[scan.key];
                            return (
                              <div key={scan.key} className={cn("flex items-center gap-1.5 text-xs", done ? "text-foreground" : "text-muted-foreground")}>
                                {done
                                  ? <CheckCircle2 className="w-3 h-3 text-civic-green" />
                                  : <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                }
                                {scan.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Enrich prompt when no detailed data and not discovering */}
            {!hasDetailedData && !isEnriching && !isDiscovering && (
              <Card className="mb-8 border-dashed border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">Detailed data not yet available</h3>
                  <p className="text-sm text-muted-foreground mb-4">Click "AI Research" above to populate PAC recipients, executives, public stances, dark money connections, and more.</p>
                </CardContent>
              </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Scale className="w-3.5 h-3.5" />
                    Civic Footprint
                  </div>
                  <div className="text-2xl font-bold text-foreground">{dbCompany.civic_footprint_score}<span className="text-sm text-muted-foreground">/100</span></div>
                  <CivicFootprintBadge score={dbCompany.civic_footprint_score} size="sm" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    PAC Spending
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {dbCompany.total_pac_spending > 0 ? formatCurrency(dbCompany.total_pac_spending) : "None"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Megaphone className="w-3.5 h-3.5" />
                    Lobbying
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {dbCompany.lobbying_spend ? formatCurrency(dbCompany.lobbying_spend) : "None"}
                  </div>
                </CardContent>
              </Card>
              {(dbCompany.government_contracts || dbCompany.subsidies_received) && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Landmark className="w-3.5 h-3.5" />
                      Gov Contracts
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {dbCompany.government_contracts ? formatCurrency(dbCompany.government_contracts) : "—"}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Offer Check CTA */}
            <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-sm">Run the Offer Check</h3>
                  <p className="text-xs text-muted-foreground">Public signals to review before you say yes.</p>
                </div>
                <Button size="sm" onClick={() => window.location.href = `/offer-check/${dbCompany.id}`}>
                  Run Offer Check
                </Button>
              </CardContent>
            </Card>

            {/* Lens Selector */}
            <LensSelector activeLens={activeLens} onLensChange={setActiveLens} />

            {/* Platform Philosophy */}
            <PlatformPhilosophy />

            {/* Company Intelligence Scan */}
            <div className="mb-6">
              <CompanyIntelligenceScanCard companyId={dbCompany.id} companyName={dbCompany.name} />
            </div>

            {/* Transparency Index */}
            <div className="mb-6">
              <TransparencyIndex categories={transparencyCategories} />
            </div>

            {/* Debug Panel */}
            <div className="mb-6">
              <ScanDebugPanel companyId={dbCompany.id} />
            </div>

            {/* Lens-ordered modules */}
            <DbLensModules
              activeLens={activeLens}
              dbCompany={dbCompany}
              dbPartyBreakdown={dbPartyBreakdown}
              dbCandidates={dbCandidates}
              dbExecutives={dbExecutives}
              dbPublicStances={dbPublicStances}
              dbDarkMoney={dbDarkMoney}
              dbRevolvingDoor={dbRevolvingDoor}
              livePipeline={livePipeline}
            />
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!company) {
    // No sample data and no DB match — this slug doesn't exist anywhere
    // Don't show dead-end; the search flow should have auto-created it
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Company Not Found</h1>
            <p className="text-sm text-muted-foreground mb-4">
              This company isn't in our database yet. Search for it to automatically start building its transparency profile.
            </p>
            <Link to="/search">
              <Button className="gap-2">
                <Search className="w-4 h-4" />
                Search & Discover
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const flaggedCandidates = company.candidates.filter((c) => c.flagged);
  const totalIndirectInfluence = company.superPacs.reduce((s, p) => s + p.amount, 0) +
    company.darkMoneyOrgs.reduce((s, d) => s + (d.estimatedAmount || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to directory
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* ── Company Overview ────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{company.name}</h1>
              {company.parentCompany && (
                <p className="text-sm text-muted-foreground mb-1">Parent: {company.parentCompany}</p>
              )}
              <p className="text-muted-foreground mb-3">{company.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">{company.industry}</Badge>
                <Badge variant="secondary">{company.state}</Badge>
                <Badge variant="secondary">Revenue: {company.revenue}</Badge>
                {company.employeeCount && <Badge variant="secondary">{company.employeeCount} employees</Badge>}
                <CivicFootprintBadge score={company.civicFootprintScore} />
                <ShareableScorecard data={{
                  name: company.name,
                  industry: company.industry,
                  state: company.state,
                  civicFootprintScore: company.civicFootprintScore,
                  totalPacSpending: company.totalPacSpending,
                  lobbyingSpend: company.lobbyingSpend,
                  confidenceRating: company.confidenceRating,
                  governmentContracts: company.governmentContracts,
                  partyBreakdown: company.partyBreakdown,
                }} />
                <EmbedBadge slug={company.id} companyName={company.name} />
              </div>
            </div>
          </div>

          {/* ── Summary Cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Scale className="w-3.5 h-3.5" />
                  Civic Footprint
                </div>
                <div className="text-2xl font-bold text-foreground">{company.civicFootprintScore}<span className="text-sm text-muted-foreground">/100</span></div>
                <CivicFootprintBadge score={company.civicFootprintScore} size="sm" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  PAC Spending
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {company.totalPacSpending > 0 ? formatCurrency(company.totalPacSpending) : "None"}
                </div>
                <p className="text-xs text-muted-foreground">Current cycle</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Megaphone className="w-3.5 h-3.5" />
                  Lobbying
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {company.lobbyingSpend ? formatCurrency(company.lobbyingSpend) : "None"}
                </div>
                <p className="text-xs text-muted-foreground">Annual</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <EyeOff className="w-3.5 h-3.5" />
                  Indirect Influence
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {totalIndirectInfluence > 0 ? formatCurrency(totalIndirectInfluence) : "None"}
                </div>
                <p className="text-xs text-muted-foreground">Super PACs &amp; dark money</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Flag className="w-3.5 h-3.5" />
                  Risk Signals
                </div>
                <div className="text-2xl font-bold text-foreground">{company.flaggedOrgTies.length + flaggedCandidates.length + company.darkMoneyOrgs.length}</div>
                <p className="text-xs text-muted-foreground">Flagged ties</p>
              </CardContent>
            </Card>
          </div>

          {/* Lens Selector */}
          <LensSelector activeLens={activeLens} onLensChange={setActiveLens} />

          {/* ── SCORING & INTELLIGENCE ─────────────────────────────── */}
          {(company.influenceROI || company.hypocrisyIndex || company.politicalRisk || company.benchmark) && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Intelligence Scores
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Predictive risk scores, ROI metrics, and peer benchmarking.</p>
              <div className="grid lg:grid-cols-2 gap-6">
                {company.influenceROI && <InfluenceROICard data={company.influenceROI} />}
                {company.hypocrisyIndex && <HypocrisyIndexCard data={company.hypocrisyIndex} />}
                {company.politicalRisk && <PoliticalRiskCard data={company.politicalRisk} />}
                {company.benchmark && (
                  <BenchmarkCard data={{
                    ...company.benchmark,
                    companyCivicFootprint: company.civicFootprintScore,
                    companyLobbying: company.lobbyingSpend || 0,
                    companyPacSpending: company.totalPacSpending,
                  }} />
                )}
              </div>
            </div>
          )}

          {/* ── SECTION 1: Money Trail ─────────────────────────────────── */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Money Trail
            </h2>
            <p className="text-sm text-muted-foreground mb-4">PAC contributions, candidate support, lobbying, and executive personal giving.</p>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Party Breakdown */}
              {company.partyBreakdown.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">PAC Spending by Party</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={company.partyBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="amount" nameKey="party">
                            {company.partyBreakdown.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-2">
                      {company.partyBreakdown.map((entry) => (
                        <div key={entry.party} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-muted-foreground">{entry.party}: {formatCurrency(entry.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Candidates */}
              {company.candidates.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Candidates Supported</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {company.candidates.map((candidate) => (
                        <div
                          key={candidate.name}
                          className={cn(
                            "flex items-start justify-between p-3 rounded-lg border",
                            candidate.flagged ? "border-civic-red/20 bg-civic-red/5" : "border-border"
                          )}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm">{candidate.name}</span>
                              <Badge variant="outline" className={candidate.party === "R" ? "text-civic-red border-civic-red/30" : candidate.party === "D" ? "text-civic-blue border-civic-blue/30" : "text-muted-foreground"}>
                                {candidate.party}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-muted-foreground">{candidate.type === "corporate-pac" ? "PAC" : candidate.type === "super-pac" ? "Super PAC" : "Personal"}</Badge>
                              {candidate.flagged && <AlertTriangle className="w-3.5 h-3.5 text-civic-red" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {candidate.state}{candidate.district ? ` — ${candidate.district} District` : ""}
                            </p>
                            {candidate.flagReason && <p className="text-xs text-civic-red mt-1">{candidate.flagReason}</p>}
                          </div>
                          <span className="text-sm font-medium text-foreground shrink-0">{formatCurrency(candidate.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Government ROI */}
            {(company.governmentContracts || company.subsidiesReceived || company.effectiveTaxRate) && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Landmark className="w-5 h-5" />
                    Government ROI — Subsidies vs. Spending
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">The return on political investment: what they spend versus what they receive.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {company.governmentContracts && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold text-foreground">{formatCurrency(company.governmentContracts)}</div>
                        <div className="text-xs text-muted-foreground">Government Contracts</div>
                      </div>
                    )}
                    {company.subsidiesReceived && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold text-foreground">{formatCurrency(company.subsidiesReceived)}</div>
                        <div className="text-xs text-muted-foreground">Subsidies &amp; Tax Breaks</div>
                      </div>
                    )}
                    {company.effectiveTaxRate && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold text-foreground">{company.effectiveTaxRate}</div>
                        <div className="text-xs text-muted-foreground">Effective Tax Rate</div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Compare political spending ({formatCurrency(company.totalPacSpending + (company.lobbyingSpend || 0))}) against government benefits received.
                    Sources: USASpending.gov, Good Jobs First, public filings.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ROI Pipeline — always show with empty state */}
            <div className="mt-6">
              {pipelineLoading ? (
                <Card><CardContent className="p-6 text-center text-muted-foreground">Loading influence pipeline...</CardContent></Card>
              ) : (
                <ROIPipelineCard
                  data={livePipeline || company.roiPipeline || { moneyIn: [], network: [], benefitsOut: [], linkages: [], totalSpending: 0, totalBenefits: 0 }}
                  isSearching={pipelineLoading}
                />
              )}
            </div>

            {/* Influence Chain Trace */}
            <div className="mt-6">
              <InfluenceChainCard
                companyId={dbCompanyId || company.id}
                companyName={company.name}
              />
            </div>

            {/* Social & Media Monitor */}
            <div className="mt-6">
              <SocialMonitorCard
                companyId={company.id}
                companyName={company.name}
                executiveNames={company.executives.map(e => e.name)}
                dbCompanyId={dbCompanyId}
              />
            </div>

            {/* Agency Contracts & Global Footprint */}
            <div className="mt-6">
              <AgencyContractsCard
                companyName={company.name}
                dbCompanyId={dbCompanyId}
              />
            </div>

            {/* Ideological Alignment Tracker */}
            <div className="mt-6">
              <IdeologyFlagsCard
                companyName={company.name}
                dbCompanyId={dbCompanyId}
              />
            </div>

            {/* Worker Sentiment Scanner */}
            <div className="mt-6">
              <WorkerSentimentCard
                companyName={company.name}
                dbCompanyId={dbCompanyId}
              />
            </div>

            {/* AI Hiring Technology */}
            <div className="mt-6">
              <AIHiringCard
                companyName={company.name}
                dbCompanyId={dbCompanyId}
              />
            </div>

            {/* Worker Benefits & Protections */}
            <div className="mt-6">
              <WorkerBenefitsCard
                companyName={company.name}
                dbCompanyId={dbCompanyId}
              />
            </div>

            {/* AI Hiring Accountability */}
            <div className="mt-6">
              <AIAccountabilityCard
                companyName={company.name}
                dbCompanyId={dbCompanyId}
              />
            </div>

            {/* Compensation Transparency & Equity */}
            <div className="mt-6">
              <CompensationTransparencyCard
                companyName={company.name}
                dbCompanyId={dbCompanyId}
              />
            </div>
          </div>

          {/* Executive Donors */}
          {company.executives.length > 0 && (
            <Card className="mb-10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Executive &amp; Leadership Donors
                </CardTitle>
                <p className="text-xs text-muted-foreground">Personal donations by executives. These reflect individual giving, not necessarily corporate policy.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {company.executives.map((exec) => (
                    <div key={exec.name} className="border-b border-border pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-foreground">{exec.name}</div>
                          <div className="text-sm text-muted-foreground">{exec.title}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{formatCurrency(exec.totalDonations)}</div>
                          <div className="text-xs text-muted-foreground">Total personal donations</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {exec.topRecipients.map((r) => (
                          <div key={r.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn("text-xs", r.party === "R" ? "text-civic-red border-civic-red/30" : "text-civic-blue border-civic-blue/30")}>
                                {r.party}
                              </Badge>
                              <span className="text-muted-foreground">{r.name}</span>
                            </div>
                            <span className="font-medium text-foreground">{formatCurrency(r.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── SECTION: Indirect Influence (Dark Money & Super PACs) ──── */}
          {(company.superPacs.length > 0 || company.darkMoneyOrgs.length > 0) && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-primary" />
                Indirect Influence
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Super PACs, 527 committees, and dark money (501(c)(4)) organizations linked to this company's leadership.</p>

              <div className="grid md:grid-cols-2 gap-6">
                {company.superPacs.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Super PACs &amp; 527s</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {company.superPacs.map((pac) => (
                          <div key={pac.name} className="border-b border-border pb-3 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-medium text-foreground text-sm">{pac.name}</span>
                              <Badge variant="outline" className="text-xs capitalize">{pac.type}</Badge>
                            </div>
                            <div className="text-lg font-bold text-foreground">{formatCurrency(pac.amount)}</div>
                            <p className="text-xs text-muted-foreground mt-1">{pac.description}</p>
                            <Badge variant="outline" className={cn("text-xs mt-1", pac.confidence === "direct" ? "text-civic-green border-civic-green/30" : pac.confidence === "inferred" ? "text-civic-yellow border-civic-yellow/30" : "text-muted-foreground")}>
                              {pac.confidence}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {company.darkMoneyOrgs.length > 0 && (
                  <Card className="border-civic-red/20">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-civic-red" />
                        Dark Money Organizations
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">501(c)(4) and similar organizations that do not disclose donors.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {company.darkMoneyOrgs.map((org) => (
                          <div key={org.name} className="border-b border-border pb-3 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-medium text-foreground text-sm">{org.name}</span>
                              <Badge variant="outline" className="text-xs">{org.type}</Badge>
                            </div>
                            {org.estimatedAmount && (
                              <div className="text-lg font-bold text-foreground">{formatCurrency(org.estimatedAmount)}</div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{org.description}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className={cn("text-xs", org.confidence === "direct" ? "text-civic-green border-civic-green/30" : org.confidence === "inferred" ? "text-civic-yellow border-civic-yellow/30" : "text-civic-red border-civic-red/30")}>
                                {org.confidence}
                              </Badge>
                            </div>
                            {org.source && <p className="text-xs text-muted-foreground mt-1">Source: {org.source}</p>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ── Revolving Door ─────────────────────────────────────────── */}
          {company.revolvingDoor.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" />
                Revolving Door
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Connections between company leadership and government positions.</p>
              <div className="space-y-3">
                {company.revolvingDoor.map((entry, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground text-sm">{entry.person}</div>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                            <div>
                              <span className="text-muted-foreground uppercase tracking-wider font-medium">Former</span>
                              <p className="text-foreground mt-0.5">{entry.formerRole}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground uppercase tracking-wider font-medium">Current/Recent</span>
                              <p className="text-foreground mt-0.5">{entry.currentRole}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{entry.relevance}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-xs shrink-0", entry.confidence === "direct" ? "text-civic-green border-civic-green/30" : entry.confidence === "inferred" ? "text-civic-yellow border-civic-yellow/30" : "text-civic-red border-civic-red/30")}>
                          {entry.confidence}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── Spending History ────────────────────────────────────────── */}
          {company.spendingHistory.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Spending Trajectory
              </h2>
              <p className="text-sm text-muted-foreground mb-4">How political spending has changed over recent election cycles.</p>
              <Card>
                <CardContent className="p-5">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={company.spendingHistory}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="cycle" className="text-xs" />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="pacSpending" name="PAC Spending" fill="hsl(220, 65%, 48%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="lobbyingSpend" name="Lobbying" fill="hsl(215, 15%, 47%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="executiveGiving" name="Executive Giving" fill="hsl(0, 72%, 51%)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Company Intelligence Scan (for sample companies with DB records) */}
          {pipelineCompanyId && (
            <div className="mb-6">
              <CompanyIntelligenceScanCard companyId={pipelineCompanyId} companyName={company.name} />
            </div>
          )}

          {/* ── SECTION 2: Influence Network ───────────────────────────── */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Influence Network
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Trade groups, think tanks, advocacy orgs, and board memberships.</p>

            <div className="grid md:grid-cols-2 gap-6">
              {company.tradeAssociations.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Trade Associations</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {company.tradeAssociations.map((ta) => (
                        <Badge key={ta} variant="secondary">{ta}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {company.boardAffiliations.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Board &amp; Leadership Affiliations</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {company.boardAffiliations.map((ba) => (
                        <Badge key={ba} variant="secondary">{ba}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {company.flaggedOrgTies.length > 0 && (
              <Card className="mt-6 border-civic-red/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-civic-red">
                    <AlertTriangle className="w-4 h-4" />
                    Flagged Organization Ties
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Connections to organizations flagged by civil rights watchdogs or advocacy trackers.</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {company.flaggedOrgTies.map((tie) => (
                      <div key={tie.orgName} className="border-b border-border pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="font-medium text-foreground text-sm">{tie.orgName}</div>
                          <div className="flex gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs capitalize">{tie.relationship.replace(/-/g, " ")}</Badge>
                            <Badge variant="outline" className={cn("text-xs", tie.confidence === "direct" ? "text-civic-green border-civic-green/30" : tie.confidence === "inferred" ? "text-civic-yellow border-civic-yellow/30" : "text-muted-foreground")}>
                              {tie.confidence}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{tie.description}</p>
                        {tie.source && <p className="text-xs text-muted-foreground mt-1">Source: {tie.source}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── SECTION 3: Public Stance vs Spending ───────────────────── */}
          {company.publicStances.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-primary" />
                Public Stance vs. Spending
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Where marketing language and money trail align or diverge.</p>
              <div className="space-y-4">
                {company.publicStances.map((stance) => (
                  <Card key={stance.topic}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-semibold text-foreground text-sm">{stance.topic}</span>
                        <Badge variant="outline" className={cn("text-xs capitalize", stance.gap === "contradictory" ? "text-civic-red border-civic-red/30" : stance.gap === "mixed" ? "text-civic-yellow border-civic-yellow/30" : "text-civic-green border-civic-green/30")}>
                          {stance.gap}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">What they say</div>
                          <p className="text-sm text-foreground">{stance.publicPosition}</p>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Where the money goes</div>
                          <p className="text-sm text-foreground">{stance.spendingReality}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION 4: Why This Matters ────────────────────────────── */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Why This Matters
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Practical relevance for candidates, employees, and consumers.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">For Workers &amp; Candidates</div>
                  <p className="text-sm text-foreground">{company.workerRelevance}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">For Consumers</div>
                  <p className="text-sm text-foreground">{company.consumerRelevance}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── SECTION 5: Sources & Confidence ────────────────────────── */}
          <Card className="mb-4">
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    Last reviewed: {company.lastUpdated}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <Badge variant="outline" className={cn("text-xs capitalize", company.confidenceRating === "high" ? "text-civic-green border-civic-green/30" : company.confidenceRating === "medium" ? "text-civic-yellow border-civic-yellow/30" : "text-civic-red border-civic-red/30")}>
                      {company.confidenceRating}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {company.careersUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={company.careersUrl} target="_blank" rel="noopener noreferrer">
                        Careers Page <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/methodology">Our Methodology</Link>
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Data sourced from FEC.gov, OpenSecrets.org, lobbying disclosures, USASpending.gov, Good Jobs First, and public filings. 
                Executive donations reflect personal giving and do not necessarily represent corporate policy.
                Dark money estimates are based on available tax filings and may not represent total giving.
                CivicLens provides publicly available data for informational purposes only and does not make endorsements or moral judgments.
              </p>
            </CardContent>
          </Card>

          {/* Correction Request */}
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              See something wrong or missing?{" "}
              <a href="mailto:corrections@civiclens.org" className="text-primary hover:underline">
                Request a correction or provide updated source material
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
