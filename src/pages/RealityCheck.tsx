import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import {
  vibeMatchSchema, calculateRealityGap,
  type VibeMatchInput, type PublicDataSignals, type RealityGapResult,
} from "@/lib/realityGapScore";
import { VibeMatchQuestionnaire } from "@/components/reality-check/VibeMatchQuestionnaire";
import { RealityGapResults } from "@/components/reality-check/RealityGapResults";
import { FlinchTest } from "@/components/reality-check/FlinchTest";
import {
  Terminal, ClipboardCheck, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RealityCheckPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [result, setResult] = useState<RealityGapResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastInput, setLastInput] = useState<{ companyId: string; companyName: string } | null>(null);

  usePageSEO({
    title: "Employer Red Flags Before Accepting a Job Offer — Reality Check",
    description: "Caught something off in your interview? Compare your experience against SEC data, board diversity scores, and retention signals. Free post-interview audit.",
    path: "/reality-check",
    jsonLd: {
      "@type": "HowTo",
      name: "How to Check for Employer Red Flags Before Accepting a Job Offer",
      description: "Use the Reality Check questionnaire to compare your interview experience against public intelligence data and detect Say-Do disconnects.",
      step: [
        { "@type": "HowToStep", name: "Search for the company", text: "Search for the company you interviewed with using the company search." },
        { "@type": "HowToStep", name: "Rate your interview experience", text: "Rate your interview experience across 6 dimensions: leadership transparency, message consistency, panel diversity, boundary culture, professional respect, and process quality." },
        { "@type": "HowToStep", name: "Compare against public data", text: "The system cross-references your ratings against public SEC, FEC, and BLS data to identify gaps." },
        { "@type": "HowToStep", name: "Review your Integrity Gap Score", text: "Review your Integrity Gap Score, Vibe Variance chart, and Jackye's AI Twin analysis to make an informed decision." },
      ],
    },
  });

  const handleSubmit = async (input: VibeMatchInput) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const validation = vibeMatchSchema.safeParse(input);
    if (!validation.success) {
      toast({ title: "Validation error", description: validation.error.errors[0]?.message, variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      // Fetch public signals for comparison
      const publicSignals: PublicDataSignals = {};

      const [signalsRes, demographicsRes] = await Promise.all([
        supabase
          .from("company_values_signals" as any)
          .select("value_category, signal_summary, confidence")
          .eq("company_id", input.companyId)
          .limit(50),
        supabase
          .from("company_leadership_demographics" as any)
          .select("*")
          .eq("company_id", input.companyId)
          .order("report_year", { ascending: false })
          .limit(5),
      ]);

      // Derive public signal scores from available data
      const signals = (signalsRes.data || []) as any[];
      const demographics = (demographicsRes.data || []) as any[];

      if (demographics.length > 0) {
        const exec = demographics.find((d: any) => d.leadership_level === "executive_team");
        if (exec) {
          const total = exec.total_count || 1;
          const diverseCount = exec.female_count + exec.black_count + exec.hispanic_count + exec.asian_count + exec.other_race_count;
          publicSignals.boardDiversityScore = Math.min(Math.round((diverseCount / total / 2) * 100), 100);
          publicSignals.execTenureScore = 60; // baseline
        }
      }

      if (signals.length > 0) {
        const retentionSignals = signals.filter((s: any) =>
          ["retention", "turnover"].some(k => s.signal_summary?.toLowerCase().includes(k))
        );
        publicSignals.retentionScore = retentionSignals.length > 0 ? 65 : 40;

        const promoSignals = signals.filter((s: any) =>
          ["promotion", "internal mobility"].some(k => s.signal_summary?.toLowerCase().includes(k))
        );
        publicSignals.promotionVelocityScore = promoSignals.length > 0 ? 70 : 45;

        const paySignals = signals.filter((s: any) =>
          ["pay equity", "salary", "compensation"].some(k => s.signal_summary?.toLowerCase().includes(k))
        );
        publicSignals.payTransparencyScore = paySignals.length > 0 ? 65 : 35;
      }

      const gapResult = calculateRealityGap(input, publicSignals);
      setResult(gapResult);
      setLastInput({ companyId: input.companyId, companyName: input.companyName });

      // Save to database
      const { error } = await supabase.from("vibe_match_responses" as any).insert({
        user_id: user.id,
        company_id: input.companyId,
        company_name: input.companyName,
        job_title: input.jobTitle || null,
        interview_date: input.interviewDate || null,
        success_clarity: input.successClarity,
        challenge_consistency: input.challengeConsistency,
        panel_diversity: input.panelDiversity,
        boundary_reaction: input.boundaryReaction,
        predecessor_respect: input.predecessorRespect,
        process_organization: input.processOrganization,
        overall_vibe_score: gapResult.overallVibeScore,
        reality_gap_score: gapResult.integrityGapScore,
        additional_notes: input.additionalNotes || null,
      } as any);

      if (error) console.error("Save error:", error);

      toast({ title: "Reality Check complete", description: `Integrity Gap Score: ${gapResult.integrityGapScore}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-78px)] bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5 text-civic-green" />
            <div>
              <h1 className="font-mono text-sm font-bold tracking-wider uppercase text-civic-green flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Spot Employer Red Flags Before You Accept
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Before you accept that offer, run the data. This questionnaire cross-references your interview experience against public SEC, FEC, and BLS intelligence to detect "Diversity Wash" signals and Say-Do disconnects.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {result ? (
          <div className="space-y-6">
            <RealityGapResults result={result} onReset={() => { setResult(null); setLastInput(null); }} />
            {lastInput && (
              <FlinchTest companyId={lastInput.companyId} companyName={lastInput.companyName} />
            )}
          </div>
        ) : (
          <VibeMatchQuestionnaire onSubmit={handleSubmit} isSubmitting={submitting} />
        )}
      </div>
    </div>
  );
}
