import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { computeFallbackScore, type OfferStrengthResult } from "@/lib/offerStrengthScoring";
import type { LegalFlag } from "@/components/strategic-offer/CivicLegalAudit";
import type { OfferClarityReport } from "@/components/offer-clarity/OfferClarityDashboard";

interface OfferInput {
  companyName: string;
  companyId?: string;
  roleTitle: string;
  location: string;
  yearsExperience: string;
  baseSalary: string;
  bonus: string;
  equity: string;
  signOnBonus: string;
  nonCompete: string;
  repaymentClause: string;
  benefitWaitingPeriod: string;
  arbitrationClause: boolean;
  ipClause: boolean;
  hasInterview: boolean;
  additionalDetails: string;
}

interface UseOfferStrengthScoreOptions {
  offer: OfferInput;
  annualBaseline: number;
  legalFlags: LegalFlag[];
  clarityReport: OfferClarityReport | null;
}

export function useOfferStrengthScore({ offer, annualBaseline, legalFlags, clarityReport }: UseOfferStrengthScoreOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiResult, setAiResult] = useState<OfferStrengthResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Instant fallback score (always available)
  const fallbackResult = useMemo(() => computeFallbackScore({
    salary: Number(offer.baseSalary) || 0,
    baseline: annualBaseline,
    bonus: offer.bonus,
    equity: offer.equity,
    signOnBonus: offer.signOnBonus,
    nonCompete: offer.nonCompete,
    repaymentClause: offer.repaymentClause,
    benefitWaitingPeriod: offer.benefitWaitingPeriod,
    arbitrationClause: offer.arbitrationClause,
    ipClause: offer.ipClause,
    hasInterview: offer.hasInterview,
    additionalDetails: offer.additionalDetails,
    legalFlags,
    clarityReport,
  }), [offer, annualBaseline, legalFlags, clarityReport]);

  // AI-powered score (requires auth)
  const runAIScore = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("offer-strength-score", {
        body: {
          offerData: {
            roleTitle: offer.roleTitle,
            location: offer.location,
            yearsExperience: offer.yearsExperience,
            baseSalary: offer.baseSalary,
            bonus: offer.bonus,
            equity: offer.equity,
            signOnBonus: offer.signOnBonus,
            nonCompete: offer.nonCompete,
            repaymentClause: offer.repaymentClause,
            benefitWaitingPeriod: offer.benefitWaitingPeriod,
            arbitrationClause: offer.arbitrationClause,
            ipClause: offer.ipClause,
            hasInterview: offer.hasInterview,
            additionalDetails: offer.additionalDetails,
          },
          companyName: offer.companyName,
          companyId: offer.companyId,
          annualBaseline,
          clarityReport,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult(data.score);
    } catch (e: any) {
      console.error("AI score failed, using fallback:", e);
      toast({
        title: "AI scoring unavailable",
        description: "Using local analysis. " + (e.message || ""),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, offer, annualBaseline, clarityReport, toast]);

  // Use AI result when available, otherwise fallback
  const result: OfferStrengthResult = aiResult || fallbackResult;

  return { result, loading, runAIScore, isAIPowered: !!aiResult };
}
