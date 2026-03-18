import { useMemo } from "react";
import { ContentProtector } from "@/components/ContentProtector";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePageSEO } from "@/hooks/use-page-seo";
import { getOGImageUrl } from "@/lib/social-share";
import {
  Building2, Lightbulb, Network, Landmark,
  Sparkles, Users, Heart, Loader2, ShoppingCart,
  BarChart3, TrendingUp, User, Megaphone, Target, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DossierLayer, TransparencyDisclaimer } from "@/components/dossier/DossierLayout";
import { DossierProtector } from "@/components/dossier/DossierProtector";
import { InfluenceGauge } from "@/components/dossier/InfluenceGauge";
import { useTrackedCompanies } from "@/hooks/use-tracked-companies";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Badge } from "@/components/ui/badge";
import { ExportDossierButton } from "@/components/dossier/ExportDossierButton";
import { useDossierLens } from "@/contexts/DossierLensContext";

// Layer components
import { ProductsPlatformsLayer } from "@/components/dossier/ProductsPlatformsLayer";
import { MarketsSegmentsLayer } from "@/components/dossier/MarketsSegmentsLayer";
import { InnovationPatentsLayer } from "@/components/dossier/InnovationPatentsLayer";
import { EcosystemSubcontractorsLayer } from "@/components/dossier/EcosystemSubcontractorsLayer";
import { InfluencePolicyLayer } from "@/components/dossier/InfluencePolicyLayer";
import { InstitutionalDNACard } from "@/components/dossier/InstitutionalDNACard";
import { PatternsSynthesisLayer } from "@/components/dossier/PatternsSynthesisLayer";
import { TalentContextLayer } from "@/components/dossier/TalentContextLayer";
import { ValuesSignalsLayer } from "@/components/dossier/ValuesSignalsLayer";
import { FullEvidenceLayer } from "@/components/dossier/FullEvidenceLayer";
import { DecisionMakerLayer } from "@/components/dossier/DecisionMakerLayer";
import { WorkforceDemographicsLayer } from "@/components/dossier/WorkforceDemographicsLayer";
import { BuyingLogicLayer } from "@/components/dossier/BuyingLogicLayer";
import { StockPatentsLayer } from "@/components/dossier/StockPatentsLayer";
import { EEOCCaseAlert } from "@/components/EEOCCaseAlert";
import { useEEOCByCompanyName } from "@/hooks/use-eeoc-cases";
import { PremiumGate } from "@/components/PremiumGate";
import { useViewMode } from "@/contexts/ViewModeContext";
import { HighRiskConnectionCard } from "@/components/company/HighRiskConnectionCard";
import { StateWomenStatusCard } from "@/components/StateWomenStatusCard";
import { PolicyScoreCard } from "@/components/policy-intelligence/PolicyScoreCard";

/* ─── Lens config ─── */
const LENS_META = {
  candidate: { label: "Candidate View", icon: User, color: "text-primary" },
  sales: { label: "Sales Intelligence", icon: TrendingUp, color: "text-amber-500" },
  hr: { label: "HR Strategy", icon: Users, color: "text-teal-500" },
} as const;

export default function CompanyDossier() {
  const { id } = useParams();
  const { isCompanyTracked } = useTrackedCompanies();
  const { canAccessRecruiter } = useViewMode();
  const { lens } = useDossierLens();

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Company not found.</p>
        </div>
      </div>
    );
  }

  const influenceScore = company.civic_footprint_score || 0;
  const hasFullAccess = isTracked;
  const LensMeta = LENS_META[lens];
  const LensIcon = LensMeta.icon;

  usePageSEO({
    title: `Should I Work at ${company.name}? Career Risk Report`,
    description: `Should you work at ${company.name}? See the Career Risk Score: leadership stability, layoff history, pay vs. industry benchmarks, and political activity.`,
    path: `/company/${id}`,
    image: getOGImageUrl({ type: "company", companyA: company.name }),
  });

  /* ─── Shared overview (always visible) ─── */
  const overviewContent = (
    <>
      <div className="flex items-center gap-5 mb-4">
        <CompanyLogo companyName={company.name} logoUrl={company.logo_url} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-heading-2 font-bold text-foreground truncate">{company.name}</h1>
            {isTracked && (
              <Badge className="bg-primary/10 text-primary text-xs">Tracked</Badge>
            )}
          </div>
          <p className="text-body text-muted-foreground">
            {company.industry} · {company.state}
            {company.employee_count && ` · ${company.employee_count} employees`}
          </p>
        </div>
        <ExportDossierButton companyId={companyId!} companyName={company.name} company={company} />
      </div>

      {/* Active lens indicator */}
      <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl border border-border/40 bg-muted/30">
        <LensIcon className={`w-4 h-4 ${LensMeta.color}`} />
        <span className="text-sm font-medium text-foreground">{LensMeta.label}</span>
        <span className="text-xs text-muted-foreground ml-1">— viewing dossier through this lens. Switch via header toggle.</span>
      </div>

      {/* Score gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-6 rounded-2xl border border-border/40 bg-card">
        <InfluenceGauge value={influenceScore} label="Influence Score" />
        <InfluenceGauge value={0} label="Innovation Score" />
        <InfluenceGauge value={0} label="Stability Score" />
        <InfluenceGauge value={0} label="Attraction Score" />
      </div>

      {/* Layer 1: Basics — always shown */}
      <DossierLayer title="Basics" subtitle="Products, markets, segments, and company overview" icon={Building2} layerNumber={1} defaultOpen>
        <div className="space-y-6">
          {company.description && (
            <p className="text-body text-muted-foreground leading-relaxed">{company.description}</p>
          )}
          <ProductsPlatformsLayer products={[]} companyName={company.name} />
          <MarketsSegmentsLayer segments={[]} companyName={company.name} />
        </div>
      </DossierLayer>

      {/* Innovation — always visible */}
      <DossierLayer title="Innovation & Patents" subtitle="Stock timeline, patent clusters, R&D themes" icon={Lightbulb} layerNumber={2}>
        <div className="space-y-8">
          <StockPatentsLayer companyId={companyId!} companyName={company.name} unlocked={hasFullAccess} />
          <div className="border-t border-border/30 pt-6">
            <InnovationPatentsLayer totalPatents={0} clusters={[]} companyName={company.name} companyId={companyId} unlocked={hasFullAccess} />
          </div>
        </div>
      </DossierLayer>

      {/* EEOC Enforcement Alert */}
      {eeocCases && eeocCases.length > 0 && (
        <EEOCCaseAlert cases={eeocCases} />
      )}
    </>
  );

  /* ─── CANDIDATE LENS — values, workforce, career ─── */
  const candidateContent = (
    <>
      <DossierLayer title="Values Filter" subtitle="Evidence-based filtering across 14 issue lenses" icon={Heart} layerNumber={3} defaultOpen>
        <ValuesSignalsLayer signals={mappedValues} companyName={company.name} />
      </DossierLayer>

      <DossierLayer title="Workforce Signals" subtitle="WARN notices, hiring stability, workforce signals" icon={Users} layerNumber={4} defaultOpen>
        <TalentContextLayer signals={[]} companyName={company.name} />
      </DossierLayer>

      <DossierLayer title="Workforce Demographics" subtitle="Role distribution, pay equity, diversity, and promotion signals" icon={BarChart3} layerNumber={5}>
        <WorkforceDemographicsLayer companyId={companyId!} companyName={company.name} />
      </DossierLayer>

      {/* State-level women's status context */}
      {company.state && (
        <StateWomenStatusCard stateCode={company.state} companyName={company.name} />
      )}

      <DossierLayer title="Influence & Policy Signals" subtitle="PAC giving, lobbying, government contracts" icon={Landmark} layerNumber={6}>
        <InfluencePolicyLayer
          politicalGiving={politicalGiving}
          lobbyingActivity={[]}
          governmentContracts={governmentContractSignals}
          policyLinks={[]}
        />
        {companyId && (
          <div className="mt-6">
            <HighRiskConnectionCard companyId={companyId} companyName={company.name} />
          </div>
        )}
        {companyId && (
          <div className="mt-6">
            <InstitutionalDNACard companyId={companyId} companyName={company.name} />
          </div>
        )}
        {companyId && (
          <div className="mt-6">
            <PolicyScoreCard companyId={companyId} companyName={company.name} />
          </div>
        )}
      </DossierLayer>

      <DossierLayer title="Patterns & Synthesis" subtitle="Key observations and notable patterns" icon={Sparkles} layerNumber={7}>
        <PatternsSynthesisLayer patterns={[]} companyName={company.name} />
      </DossierLayer>
    </>
  );

  /* ─── SALES LENS — buying logic, ecosystem, regulatory ─── */
  const salesContent = (
    <>
      <DossierLayer title="Decision & Buying Logic" subtitle="Typical buying committees, approval layers, decision-maker mapping" icon={ShoppingCart} layerNumber={3} defaultOpen>
        <BuyingLogicLayer companyId={companyId!} companyName={company.name} industry={company.industry} />
      </DossierLayer>

      <DossierLayer title="Key Decision Makers" subtitle="Executives, leadership team, and political activity" icon={Target} layerNumber={4} defaultOpen>
        <DecisionMakerLayer decisionMakers={[]} companyName={company.name} />
      </DossierLayer>

      <DossierLayer title="Ecosystem & Subcontractors" subtitle="Supply chain, federal contracts, operational dependencies" icon={Network} layerNumber={5}>
        <EcosystemSubcontractorsLayer entities={[]} companyName={company.name} />
      </DossierLayer>

      <DossierLayer title="Government Contracts & Regulatory Exposure" subtitle="Federal contracts and policy dependencies" icon={Landmark} layerNumber={6}>
        <InfluencePolicyLayer
          politicalGiving={politicalGiving}
          lobbyingActivity={[]}
          governmentContracts={governmentContractSignals}
          policyLinks={[]}
        />
      </DossierLayer>

      <DossierLayer title="Patterns & Synthesis" subtitle="Key observations and notable patterns" icon={Sparkles} layerNumber={7}>
        <PatternsSynthesisLayer patterns={[]} companyName={company.name} />
      </DossierLayer>
    </>
  );

  /* ─── HR STRATEGY LENS — talent, EVP, demographics, messaging ─── */
  const hrContent = (
    <>
      <DossierLayer title="Workforce Demographics" subtitle="Role distribution, pay equity, diversity, and promotion signals" icon={BarChart3} layerNumber={3} defaultOpen>
        <WorkforceDemographicsLayer companyId={companyId!} companyName={company.name} />
      </DossierLayer>

      <DossierLayer title="Talent Supply & Demand" subtitle="WARN notices, hiring stability, market scarcity" icon={Users} layerNumber={4} defaultOpen>
        <TalentContextLayer signals={[]} companyName={company.name} />
      </DossierLayer>

      <DossierLayer title="EVP & Values Alignment" subtitle="Employer Value Proposition signals and Say-Do gap indicators" icon={Megaphone} layerNumber={5}>
        <ValuesSignalsLayer signals={mappedValues} companyName={company.name} />
      </DossierLayer>

      <DossierLayer title="Influence & Policy Signals" subtitle="PAC giving and lobbying that may impact employer brand" icon={Landmark} layerNumber={6}>
        <InfluencePolicyLayer
          politicalGiving={politicalGiving}
          lobbyingActivity={[]}
          governmentContracts={governmentContractSignals}
          policyLinks={[]}
        />
      </DossierLayer>

      <DossierLayer title="Patterns & Synthesis" subtitle="Key observations and notable patterns" icon={Sparkles} layerNumber={7}>
        <PatternsSynthesisLayer patterns={[]} companyName={company.name} />
      </DossierLayer>

      <div className="rounded-2xl border border-border/40 bg-card p-6">
        <FullEvidenceLayer
          campaignFinance={[]}
          lobbying={[]}
          contracts={[]}
          patents={[]}
          subcontractors={[]}
          websiteChanges={[]}
          publicStatements={[]}
          humanCapital={[]}
        />
      </div>
    </>
  );

  const gatedSalesContent = canAccessRecruiter ? salesContent : (
    <PremiumGate feature="Sales Intelligence View" description="Unlock decision-maker mapping, buying logic, ecosystem analysis, and government contract exposure for sales teams." requiredTier="candidate">
      {salesContent}
    </PremiumGate>
  );

  const gatedHrContent = canAccessRecruiter ? hrContent : (
    <PremiumGate feature="HR Strategy View" description="Unlock workforce demographics, talent supply signals, EVP analysis, and employer brand intelligence." requiredTier="candidate">
      {hrContent}
    </PremiumGate>
  );

  const fullContent = lens === "candidate" ? candidateContent : lens === "sales" ? gatedSalesContent : gatedHrContent;

  return (
    <ContentProtector className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          <DossierProtector
            companyId={companyId!}
            companyName={company.name}
            influenceScore={influenceScore}
            overviewContent={overviewContent}
            fullContent={fullContent}
          />
          <TransparencyDisclaimer />

          {/* Cross-links to other intelligence tools */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/reality-check"
              className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Got an offer from {company.name}?</p>
                <p className="text-[11px] text-muted-foreground">Check for red flags with the Reality Check →</p>
              </div>
            </Link>
            <Link
              to="/ask-jackye"
              className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Ask the Intelligence Advisor</p>
                <p className="text-[11px] text-muted-foreground">Get a deep analysis of {company.name} →</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </ContentProtector>
  );
}
