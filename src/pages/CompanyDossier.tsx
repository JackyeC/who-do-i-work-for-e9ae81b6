import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Package, Globe, Lightbulb, Network, Landmark,
  Sparkles, Users, Heart, Target, FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DossierLayer, TransparencyDisclaimer } from "@/components/dossier/DossierLayout";
import { ExecutiveSummaryLayer } from "@/components/dossier/ExecutiveSummaryLayer";
import { ProductsPlatformsLayer } from "@/components/dossier/ProductsPlatformsLayer";
import { MarketsSegmentsLayer } from "@/components/dossier/MarketsSegmentsLayer";
import { InnovationPatentsLayer } from "@/components/dossier/InnovationPatentsLayer";
import { EcosystemSubcontractorsLayer } from "@/components/dossier/EcosystemSubcontractorsLayer";
import { InfluencePolicyLayer } from "@/components/dossier/InfluencePolicyLayer";
import { PatternsSynthesisLayer } from "@/components/dossier/PatternsSynthesisLayer";
import { TalentContextLayer } from "@/components/dossier/TalentContextLayer";
import { ValuesSignalsLayer } from "@/components/dossier/ValuesSignalsLayer";
import { DecisionMakerLayer } from "@/components/dossier/DecisionMakerLayer";
import { FullEvidenceLayer } from "@/components/dossier/FullEvidenceLayer";
import { Loader2 } from "lucide-react";

export default function CompanyDossier() {
  const { id } = useParams();

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

  // Load related data
  const companyId = company?.id;

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
      const { data } = await supabase.from("company_candidates").select("*").eq("company_id", companyId!);
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

  // Build influence signals from existing data
  const politicalGiving = useMemo(() => {
    if (!candidates || !executives) return [];
    const signals: any[] = [];
    executives.forEach(e => {
      if (e.total_donations > 0) {
        signals.push({
          label: `${e.name} — ${e.title}`,
          summary: `Personal political donations totaling $${e.total_donations.toLocaleString()}`,
          sourceType: "FEC",
          confidence: "strong",
          amount: e.total_donations,
        });
      }
    });
    return signals;
  }, [candidates, executives]);

  const governmentContractSignals = useMemo(() => {
    if (!contracts) return [];
    return contracts.slice(0, 10).map(c => ({
      label: c.agency_name,
      summary: c.contract_description || `Federal contract with ${c.agency_name}`,
      sourceType: c.source || "USAspending",
      sourceUrl: undefined,
      confidence: c.confidence === "high" ? "strong" as const : c.confidence === "medium" ? "likely" as const : "possible" as const,
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
      confidence: s.confidence_score >= 0.8 ? "strong" as const : s.confidence_score >= 0.5 ? "likely" as const : "possible" as const,
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          {/* Layer 1: Executive Summary — always open, free */}
          <DossierLayer title="Executive Summary" subtitle="Company identity, key metrics, and overview" icon={Building2} layerNumber={1} defaultOpen>
            <ExecutiveSummaryLayer
              company={company}
              influenceScore={company.civic_footprint_score || 0}
              innovationScore={0}
              stabilityScore={0}
              attractionScore={0}
            />
          </DossierLayer>

          {/* Layer 2: Products & Platforms — premium */}
          <DossierLayer title="Products & Platforms" subtitle="Major product lines, platforms, and what they solve" icon={Package} layerNumber={2} requiresPro>
            <ProductsPlatformsLayer products={[]} companyName={company.name} />
          </DossierLayer>

          {/* Layer 3: Markets & Segments — premium */}
          <DossierLayer title="Markets & Segments" subtitle="Industries served, customer segments, and geographic exposure" icon={Globe} layerNumber={3} requiresPro>
            <MarketsSegmentsLayer segments={[]} companyName={company.name} />
          </DossierLayer>

          {/* Layer 4: Innovation & Patents — premium */}
          <DossierLayer title="Innovation & Patents" subtitle="Patent clusters, R&D themes, and technology bets" icon={Lightbulb} layerNumber={4} requiresPro>
            <InnovationPatentsLayer totalPatents={0} clusters={[]} companyName={company.name} />
          </DossierLayer>

          {/* Layer 5: Ecosystem & Subcontractors — premium */}
          <DossierLayer title="Ecosystem & Subcontractors" subtitle="Supply chain, outsourcing partners, and operational dependencies" icon={Network} layerNumber={5} requiresPro>
            <EcosystemSubcontractorsLayer entities={[]} companyName={company.name} />
          </DossierLayer>

          {/* Layer 6: Influence & Policy Signals — free preview, premium full */}
          <DossierLayer title="Influence & Policy Signals" subtitle="Political giving, lobbying, government contracts, and policy links" icon={Landmark} layerNumber={6} defaultOpen>
            <InfluencePolicyLayer
              politicalGiving={politicalGiving}
              lobbyingActivity={[]}
              governmentContracts={governmentContractSignals}
              policyLinks={[]}
            />
          </DossierLayer>

          {/* Layer 7: Patterns & Synthesis — premium */}
          <DossierLayer title="Patterns & Synthesis" subtitle="Key observations and notable patterns" icon={Sparkles} layerNumber={7} requiresPro>
            <PatternsSynthesisLayer patterns={[]} companyName={company.name} />
          </DossierLayer>

          {/* Layer 8: Talent Context */}
          <DossierLayer title="Talent Context" subtitle="Workforce signals, job families, and stability indicators" icon={Users} layerNumber={8}>
            <TalentContextLayer signals={[]} companyName={company.name} />
          </DossierLayer>

          {/* Layer 9: Values Signals */}
          <DossierLayer title="Values Signals" subtitle="Evidence-based values alignment across 14 lenses" icon={Heart} layerNumber={9}>
            <ValuesSignalsLayer signals={mappedValues} companyName={company.name} />
          </DossierLayer>

          {/* Layer 10: Decision-Maker Mapping — Recruiter/Pro only */}
          <DossierLayer title="Decision-Maker Mapping" subtitle="Power centers, champions, blockers, and buying structure" icon={Target} layerNumber={10} requiresPro recruiterOnly>
            <DecisionMakerLayer decisionMakers={[]} companyName={company.name} />
          </DossierLayer>

          {/* Layer 11: Full Evidence */}
          <DossierLayer title="Full Evidence & Receipts" subtitle="All underlying records grouped by type" icon={FileText} layerNumber={11}>
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
          </DossierLayer>

          {/* Transparency disclaimer */}
          <TransparencyDisclaimer />
        </div>
      </main>
      <Footer />
    </div>
  );
}
