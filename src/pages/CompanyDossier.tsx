import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Lightbulb, Network, Landmark,
  Sparkles, Users, Heart, Loader2, ShoppingCart,
  BarChart3, TrendingUp, User, Megaphone, Target,
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
import { PatternsSynthesisLayer } from "@/components/dossier/PatternsSynthesisLayer";
import { TalentContextLayer } from "@/components/dossier/TalentContextLayer";
import { ValuesSignalsLayer } from "@/components/dossier/ValuesSignalsLayer";
import { FullEvidenceLayer } from "@/components/dossier/FullEvidenceLayer";
import { DecisionMakerLayer } from "@/components/dossier/DecisionMakerLayer";
import { WorkforceDemographicsLayer } from "@/components/dossier/WorkforceDemographicsLayer";
import { BuyingLogicLayer } from "@/components/dossier/BuyingLogicLayer";
import { StockPatentsLayer } from "@/components/dossier/StockPatentsLayer";

/* ─── Lens config ─── */
const LENS_META = {
  candidate: { label: "Candidate View", icon: User, color: "text-primary" },
  sales: { label: "Sales Intelligence", icon: TrendingUp, color: "text-amber-500" },
  hr: { label: "HR Strategy", icon: Users, color: "text-teal-500" },
} as const;

export default function CompanyDossier() {
  const { id } = useParams();
  const { isCompanyTracked } = useTrackedCompanies();
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

      <DossierLayer title="Influence & Policy Signals" subtitle="PAC giving, lobbying, government contracts" icon={Landmark} layerNumber={6}>
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

  const fullContent = lens === "candidate" ? candidateContent : lens === "sales" ? salesContent : hrContent;

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
