import { useState } from "react";
import { IntelligenceEmptyState } from "@/components/intelligence/IntelligenceEmptyState";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  calculatePVS, deriveSubScores, computeConfidence,
  type PVSInput,
} from "@/lib/promotionVelocityScore";
import {
  calculateVibeScore, deriveLeadershipEquity, deriveEmployeeExperience,
  deriveSocialCommitment, computeVibeConfidence,
} from "@/lib/vibeScore";
import { PromotionVelocityGauge } from "./PromotionVelocityGauge";
import { VibeScoreGauge } from "./VibeScoreGauge";
import { ScoreBreakdownTable } from "./ScoreBreakdownTable";
import { RepresentationSnapshot } from "./RepresentationSnapshot";
import { SignalSection } from "./SignalSection";
import { PromotionExitPattern } from "./PromotionExitPattern";
import { TransparencyScoreCard } from "./TransparencyScoreCard";
import { FlagsPanel } from "./FlagsPanel";
import {
  TrendingUp, RefreshCw, Loader2, Briefcase, Users, GraduationCap,
  School, Ear, Brain, Award, Heart, Shield, Compass, BarChart3,
  Building2, UserCheck, ArrowUpRight, Info, BookOpen,
} from "lucide-react";

const MOBILITY_ITEMS = [
  { key: "internal_mobility", label: "Internal Mobility Programs", icon: Compass, iconClass: "text-primary", keywords: ["internal mobility", "talent marketplace", "internal job"] },
  { key: "leadership_dev", label: "Leadership Development Programs", icon: Award, iconClass: "text-amber-500", keywords: ["leadership development", "leadership program", "executive development"] },
  { key: "rotational", label: "Rotational Programs", icon: RefreshCw, iconClass: "text-civic-blue", keywords: ["rotational", "rotation program"] },
  { key: "succession", label: "Succession Planning", icon: UserCheck, iconClass: "text-civic-green", keywords: ["succession", "leadership pipeline"] },
  { key: "mentorship", label: "Mentorship & Sponsorship", icon: Heart, iconClass: "text-pink-500", keywords: ["mentorship", "sponsorship", "mentor program"] },
  { key: "promote_within", label: "Promote-From-Within Language", icon: TrendingUp, iconClass: "text-primary", keywords: ["promote from within", "internal promotion", "career growth"] },
];

const CAREER_PATH_ITEMS = [
  { key: "time_to_promotion", label: "Median Time to First Promotion", icon: BarChart3, iconClass: "text-primary", keywords: ["promotion rate", "time to promotion", "advancement rate"] },
  { key: "title_changes", label: "Title Progression Frequency", icon: ArrowUpRight, iconClass: "text-civic-green", keywords: ["title change", "career progression", "title progression"] },
  { key: "internal_leaders", label: "% Leaders from Internal Promotion", icon: UserCheck, iconClass: "text-amber-500", keywords: ["internal leader", "promoted internally", "internal hire"] },
  { key: "tenure_execs", label: "Executive Long Tenure", icon: Building2, iconClass: "text-civic-blue", keywords: ["tenure", "long-term", "years at company"] },
];

const DIVERSITY_PIPELINE_ITEMS = [
  { key: "women_leadership", label: "Women in Leadership", icon: Users, iconClass: "text-pink-500", keywords: ["women in leadership", "female executive", "gender parity", "women_leadership"] },
  { key: "minority_advancement", label: "Minority Advancement", icon: Award, iconClass: "text-amber-500", keywords: ["minority", "underrepresented", "black leadership", "minority_advancement"] },
  { key: "hbcu_pipeline", label: "HBCU Partnerships", icon: School, iconClass: "text-civic-green", keywords: ["hbcu", "historically black", "hbcu_pipeline"] },
  { key: "hsi_pipeline", label: "Hispanic-Serving Institution Partnerships", icon: School, iconClass: "text-orange-500", keywords: ["hispanic-serving", "hsi", "latino partnership"] },
  { key: "disability_inclusion", label: "Disability Inclusion Initiatives", icon: Heart, iconClass: "text-civic-blue", keywords: ["disability", "ada", "accessible", "disability_inclusion"] },
  { key: "deaf_accessibility", label: "Deaf / Hard-of-Hearing Inclusion", icon: Ear, iconClass: "text-blue-500", keywords: ["deaf", "hard of hearing", "hearing impair", "deaf_accessibility"] },
  { key: "neurodiversity", label: "Neurodiversity Support", icon: Brain, iconClass: "text-purple-500", keywords: ["neurodiver", "learning disability", "autism", "learning_disability"] },
  { key: "veterans", label: "Veterans Pathways", icon: Shield, iconClass: "text-civic-navy", keywords: ["veteran", "military", "service member"] },
  { key: "no_degree", label: "No-Degree / Skills-First Pathways", icon: GraduationCap, iconClass: "text-orange-500", keywords: ["no degree", "skills-first", "skills-based", "degree optional", "no_degree"] },
];

const RETENTION_ITEMS = [
  { key: "retention_positive", label: "Promote & Retain Pattern", icon: TrendingUp, iconClass: "text-civic-green", keywords: ["retention", "low turnover", "employee satisfaction", "promote and retain"] },
  { key: "hire_burn", label: "Hire & Burn Pattern", icon: RefreshCw, iconClass: "text-destructive", keywords: ["high turnover", "burn", "churn", "attrition"] },
  { key: "external_replace", label: "External Replacement Pattern", icon: Building2, iconClass: "text-civic-yellow", keywords: ["external hire", "outside hire", "external replacement"] },
];

export function WorkforceEquityModule({
  companyName,
  companyId,
}: {
  companyName: string;
  companyId: string;
}) {
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["workforce-equity-signals", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_values_signals" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  // Fetch leadership demographics for Vibe Score
  const { data: demographics = [] } = useQuery({
    queryKey: ["leadership-demographics", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_leadership_demographics" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("report_year", { ascending: false });
      return (data || []) as any[];
    },
  });

  // Fetch diversity disclosures for Social Commitment pillar
  const { data: disclosures = [] } = useQuery({
    queryKey: ["diversity-disclosures", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_diversity_disclosures")
        .select("*")
        .eq("company_id", companyId);
      return (data || []) as any[];
    },
  });

  const hasScanned = signals.length > 0;

  // Categorize signals for scoring
  const promotionSignals = signals.filter((s) =>
    ["internal_promotion", "time_to_promotion", "title_changes", "internal_leaders", "tenure_execs", "promote_within"].some(
      (k) => s.value_category === k || s.signal_type?.toLowerCase().includes(k.replace(/_/g, " "))
    )
  );
  const mobilitySignals = signals.filter((s) =>
    ["internal_mobility", "leadership_dev", "rotational", "succession", "mentorship"].some(
      (k) => s.value_category === k || s.signal_type?.toLowerCase().includes(k.replace(/_/g, " "))
    )
  );
  const diversitySignals = signals.filter((s) =>
    DIVERSITY_PIPELINE_ITEMS.some((item) =>
      item.keywords.some((kw) => s.value_category === item.key || s.signal_summary?.toLowerCase().includes(kw))
    )
  );
  const retentionSignals = signals.filter((s) =>
    ["retention", "turnover", "attrition", "layoff", "warn"].some(
      (kw) => s.signal_type?.toLowerCase().includes(kw) || s.signal_summary?.toLowerCase().includes(kw)
    )
  );
  const learningSignals = signals.filter((s) =>
    ["training", "upskilling", "learning", "development program", "tuition"].some(
      (kw) => s.signal_summary?.toLowerCase().includes(kw) || s.signal_type?.toLowerCase().includes(kw)
    )
  );

  const allCategories = [...MOBILITY_ITEMS, ...CAREER_PATH_ITEMS, ...DIVERSITY_PIPELINE_ITEMS, ...RETENTION_ITEMS];
  const coveredCategories = allCategories.filter((item) =>
    signals.some((s) => item.keywords.some((kw) => s.value_category === item.key || s.signal_summary?.toLowerCase().includes(kw)))
  ).length;

  const subScores = deriveSubScores({
    promotionSignals,
    mobilitySignals,
    diversitySignals,
    retentionSignals,
    learningSignals,
    transparencyCategories: coveredCategories,
    totalCategories: allCategories.length,
  });

  const oldestSignal = signals.length
    ? Math.max(...signals.map((s) => {
        const d = new Date(s.created_at).getTime();
        return Date.now() - d;
      }))
    : Infinity;
  const recencyDays = Math.round(oldestSignal / (1000 * 60 * 60 * 24));
  const hasDirectEvidence = signals.some((s) => s.confidence === "direct" || s.confidence === "high");

  const confidence = computeConfidence(signals.length, hasDirectEvidence, recencyDays);
  const pvsResult = calculatePVS(subScores, confidence);

  // ── Vibe Score computation ──
  const execRow = demographics.find((d: any) => d.leadership_level === "executive_team");
  const boardRow = demographics.find((d: any) => d.leadership_level === "board");

  const leadershipEquity = deriveLeadershipEquity({
    execFemalePct: execRow ? Math.round((execRow.female_count / (execRow.total_count || 1)) * 100) : undefined,
    execPocPct: execRow ? Math.round(((execRow.black_count + execRow.hispanic_count + execRow.asian_count + execRow.other_race_count) / (execRow.total_count || 1)) * 100) : undefined,
    boardFemalePct: boardRow ? Math.round((boardRow.female_count / (boardRow.total_count || 1)) * 100) : undefined,
    boardPocPct: boardRow ? Math.round(((boardRow.black_count + boardRow.hispanic_count + boardRow.asian_count + boardRow.other_race_count) / (boardRow.total_count || 1)) * 100) : undefined,
  });

  const employeeExperience = deriveEmployeeExperience({
    promotionVelocityScore: pvsResult.score,
  });

  const hasPayAudit = signals.some((s) =>
    ["pay equity", "pay audit", "compensation audit", "equal pay"].some(
      (kw) => s.signal_summary?.toLowerCase().includes(kw) || s.value_category === "pay_equity"
    )
  );
  const hasEEO1 = disclosures.some((d: any) => d.disclosure_type === "eeo1" && d.is_published);
  const hasCEOPledge = signals.some((s) =>
    ["ceo pledge", "ceo action", "ceo commitment"].some(
      (kw) => s.signal_summary?.toLowerCase().includes(kw)
    )
  );
  const hasDiversityReport = disclosures.some((d: any) =>
    ["diversity_report", "dei_report", "impact_report"].includes(d.disclosure_type)
  );

  const socialCommitment = deriveSocialCommitment({
    hasPayEquityAudit: hasPayAudit,
    hasEEO1Published: hasEEO1,
    hasCEOPledge,
    hasDiversityReport,
    diversityDisclosureCount: disclosures.length,
  });

  const vibeConfidence = computeVibeConfidence(
    !!execRow || !!boardRow,
    retentionSignals.length > 0,
    false, // sentiment data — future integration
    signals.length,
  );

  const vibeResult = calculateVibeScore(
    { leadershipEquity, employeeExperience, socialCommitment },
    vibeConfidence,
  );

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("values-scan", {
        body: { companyId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Scan failed");
      toast({
        title: "Workforce equity scan complete",
        description: `Found ${data.signalsFound || 0} signals.`,
      });
      queryClient.invalidateQueries({ queryKey: ["workforce-equity-signals", companyId] });
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Workforce Equity & Advancement
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg">
            Does {companyName} appear to support internal growth, equitable advancement, and workforce transparency?
            This module combines public disclosures, leadership data, and career progression signals.
          </p>
        </div>
        <Button onClick={handleScan} disabled={scanning} variant="outline" size="sm" className="gap-1.5">
          {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {scanning ? "Scanning…" : "Run Scan"}
        </Button>
      </div>

      {!hasScanned ? (
        <IntelligenceEmptyState category="workforce" state="before">
          <Button onClick={handleScan} disabled={scanning} size="sm" className="gap-1.5">
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Run Scan
          </Button>
        </IntelligenceEmptyState>
      ) : (
        <>
          {/* Inclusive Vibe Score */}
          <VibeScoreGauge result={vibeResult} />

          {/* Promotion Velocity Score */}
          <PromotionVelocityGauge result={pvsResult} />

          {/* Score Breakdown */}
          <ScoreBreakdownTable breakdown={pvsResult.breakdown} />

          {/* Green / Risk Flags */}
          <FlagsPanel signals={signals} />

          {/* Representation Snapshot */}
          <RepresentationSnapshot signals={signals} companyName={companyName} />

          {/* Internal Mobility Signals */}
          <SignalSection
            title="Internal Mobility Signals"
            icon={Compass}
            items={MOBILITY_ITEMS}
            signals={signals}
            companyName={companyName}
          />

          {/* Career Path Progression */}
          <SignalSection
            title="Career Path Progression"
            icon={BarChart3}
            items={CAREER_PATH_ITEMS}
            signals={signals}
            companyName={companyName}
          />

          {/* Leadership Pipeline Diversity */}
          <SignalSection
            title="Leadership Pipeline Diversity Signals"
            icon={Users}
            items={DIVERSITY_PIPELINE_ITEMS}
            signals={signals}
            companyName={companyName}
          />

          {/* Retention & Workforce Stability */}
          <SignalSection
            title="Retention & Workforce Stability"
            icon={Building2}
            items={RETENTION_ITEMS}
            signals={signals}
            companyName={companyName}
          />

          {/* Promotion vs Exit Pattern */}
          <PromotionExitPattern signals={signals} companyName={companyName} />

          {/* Transparency Score */}
          <TransparencyScoreCard signals={signals} companyName={companyName} />

          {/* Sources & Disclaimer */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-foreground mb-1">Sources & Methodology</p>
                  <p className="text-[10px] text-muted-foreground">
                    Signals sourced from ESG / impact reports, diversity reports, SEC filings, company career pages,
                    press releases, public partnership announcements, and workforce data platforms. Confidence levels
                    are based on source count, quality, recency, and whether data was directly reported or inferred.
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">
                    <strong>Educational insights only.</strong> This module does not provide legal advice, employment advice,
                    or definitive judgments. It distinguishes between direct evidence, inferred patterns, and missing public
                    disclosure. Protected traits are never inferred from photos or names — only self-disclosed or
                    company-disclosed information is used.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
