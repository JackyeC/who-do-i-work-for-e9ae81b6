import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AlignmentBreakdown {
  skillsMatch: number;
  valuesAlignment: number;
  companySignals: number;
  jobMatch: number;
}

interface CompanyAlignment {
  companyId: string;
  companyName: string;
  companySlug: string;
  overallScore: number;
  breakdown: AlignmentBreakdown;
  matchedSignals: string[];
}

// Map lens keys to company_values_signals value_category values
const LENS_TO_SIGNAL_CATEGORIES: Record<string, string[]> = {
  // Social & Civil Rights
  dei_equity_importance: ["anti_discrimination", "lgbtq_inclusive", "dei_equity"],
  anti_discrimination_importance: ["anti_discrimination", "eeoc_case"],
  lgbtq_rights_importance: ["lgbtq_rights", "lgbtq_inclusive"],
  reproductive_rights_importance: ["reproductive_rights"],
  voting_rights_importance: ["voting_rights"],
  immigration_importance: ["immigration"],
  disability_inclusion_importance: ["disability_inclusion", "ada_compliance"],
  gender_equality_importance: ["gender_equality", "pay_gap", "gender_pay"],

  // Worker Treatment
  labor_rights_importance: ["worker_benefits", "labor_rights"],
  pay_equity_importance: ["pay_equity", "pay_transparency", "salary_transparency", "pay_gap"],
  workplace_safety_importance: ["workplace_safety", "osha_violation"],
  union_rights_importance: ["union_rights", "nlrb_case", "collective_bargaining"],
  gig_worker_treatment_importance: ["gig_worker", "contractor_treatment", "misclassification"],

  // Environmental Impact
  environment_climate_importance: ["environmental", "environment_climate", "climate"],
  pollution_waste_importance: ["pollution", "toxic_release", "waste_violation", "epa_violation"],
  sustainable_supply_chains_importance: ["supply_chain", "ethical_sourcing", "fair_trade"],
  energy_fossil_fuel_importance: ["energy_policy", "fossil_fuel", "renewable_energy"],

  // Ethical Business
  consumer_protection_importance: ["consumer_protection", "ftc_action", "cfpb_complaint"],
  data_privacy_importance: ["data_privacy", "data_breach", "privacy_violation"],
  ai_ethics_importance: ["ai_transparency", "ai_ethics", "bias_audit"],
  anti_corruption_importance: ["anti_corruption", "fcpa", "bribery"],
  political_transparency_importance: ["political_transparency", "dark_money", "spending_disclosure"],

  // Political Activity
  political_donations_importance: ["pac_donation", "executive_donation", "political_donation"],
  lobbying_activity_importance: ["lobbying", "lobbying_filing"],
  israel_middle_east_importance: ["israel_middle_east"],
  international_trade_importance: ["international_trade", "sanctions", "trade_policy"],

  // Lifestyle & Personal
  faith_christian_importance: ["faith_christian"],
  animal_welfare_importance: ["animal_welfare"],
  healthcare_importance: ["healthcare"],
  education_access_importance: ["education", "tuition_assistance"],
  community_investment_importance: ["community_investment", "philanthropy", "foundation_grant"],

  // Workplace preferences (mapped to signal categories)
  pay_transparency_importance: ["pay_transparency", "salary_transparency"],
  worker_protections_importance: ["worker_benefits", "worker_protections"],
  ai_transparency_importance: ["ai_transparency"],
  benefits_importance: ["worker_benefits"],
};

export function useCareerAlignmentScore(companyId?: string) {
  const { user } = useAuth();

  const { data: valuesProfile } = useQuery({
    queryKey: ["user-values-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("user_values_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: careerProfile } = useQuery({
    queryKey: ["career-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_career_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  const calculateAlignment = async (targetCompanyId: string): Promise<CompanyAlignment | null> => {
    if (!valuesProfile && !careerProfile) return null;

    const { data: company } = await supabase
      .from("companies")
      .select("id, name, slug, civic_footprint_score, industry")
      .eq("id", targetCompanyId)
      .single();

    if (!company) return null;

    const matchedSignals: string[] = [];
    let skillsScore = 50;
    let valuesScore = 50;
    let signalsScore = 0;
    let jobScore = 50;

    const [benefitsRes, aiHiringRes, payEquityRes, sentimentRes, valuesSignalsRes] = await Promise.all([
      supabase.from("ai_hr_signals").select("signal_category").eq("company_id", targetCompanyId),
      supabase.from("ai_hiring_signals").select("transparency_score, bias_audit_status").eq("company_id", targetCompanyId),
      supabase.from("pay_equity_signals").select("signal_category").eq("company_id", targetCompanyId),
      supabase.from("company_worker_sentiment").select("overall_rating").eq("company_id", targetCompanyId),
      supabase.from("company_values_signals").select("value_category, confidence").eq("company_id", targetCompanyId),
    ]);

    // Signals score
    let signalCount = 0;
    const totalSignalWeight = 5;
    if ((benefitsRes.data?.length || 0) > 0) { signalCount++; matchedSignals.push("Worker Benefits"); }
    if ((aiHiringRes.data?.length || 0) > 0) { signalCount++; matchedSignals.push("AI Transparency"); }
    if ((payEquityRes.data?.length || 0) > 0) { signalCount++; matchedSignals.push("Pay Transparency"); }
    if ((sentimentRes.data?.length || 0) > 0) { signalCount++; matchedSignals.push("Worker Sentiment"); }
    if ((valuesSignalsRes.data?.length || 0) > 0) { signalCount++; matchedSignals.push("Values Signals"); }

    signalsScore = Math.round((signalCount / totalSignalWeight) * 100);
    signalsScore = Math.round(signalsScore * 0.5 + (company.civic_footprint_score || 0) * 0.5);

    // Values alignment from unified profile
    if (valuesProfile) {
      let valueMatches = 0;
      let valueTotal = 0;
      const companyValueCats = (valuesSignalsRes.data || []).map((v: any) => v.value_category);

      Object.entries(LENS_TO_SIGNAL_CATEGORIES).forEach(([weightKey, categories]) => {
        const weight = (valuesProfile as any)[weightKey] || 50;
        if (weight > 20) {
          valueTotal += weight;
          const hasMatch = categories.some(c => companyValueCats.includes(c));
          if (hasMatch) {
            valueMatches += weight;
            matchedSignals.push(`${categories[0]} detected`);
          }
        }
      });

      valuesScore = valueTotal > 0 ? Math.round((valueMatches / valueTotal) * 100) : 50;
    }

    // Skills match
    if (careerProfile) {
      const userSkills = ((careerProfile as any).skills || []).map((s: string) => s.toLowerCase());
      if (userSkills.length > 0) {
        const { data: jobs } = await supabase
          .from("company_jobs")
          .select("extracted_skills, title")
          .eq("company_id", targetCompanyId)
          .eq("is_active", true)
          .limit(20);

        if (jobs && jobs.length > 0) {
          const jobSkills = new Set<string>();
          jobs.forEach((j: any) => {
            ((j.extracted_skills || []) as string[]).forEach((s: string) => jobSkills.add(s.toLowerCase()));
          });

          let matched = 0;
          userSkills.forEach((skill: string) => {
            if ([...jobSkills].some(js => js.includes(skill) || skill.includes(js))) matched++;
          });

          skillsScore = Math.round(Math.min((matched / userSkills.length) * 100, 100));
          if (matched >= 2) matchedSignals.push(`${matched} Skills Match`);

          const userTitles = ((careerProfile as any).preferred_titles || []).map((t: string) => t.toLowerCase());
          const titleMatch = jobs.some((j: any) =>
            userTitles.some((ut: string) => (j.title || "").toLowerCase().includes(ut))
          );
          if (titleMatch) {
            jobScore = 80;
            matchedSignals.push("Title Match");
          }
        }
      }
    }

    const overallScore = Math.round(
      skillsScore * 0.30 +
      valuesScore * 0.30 +
      signalsScore * 0.25 +
      jobScore * 0.15
    );

    return {
      companyId: company.id,
      companyName: company.name,
      companySlug: company.slug,
      overallScore: Math.min(overallScore, 100),
      breakdown: {
        skillsMatch: skillsScore,
        valuesAlignment: valuesScore,
        companySignals: signalsScore,
        jobMatch: jobScore,
      },
      matchedSignals: [...new Set(matchedSignals)],
    };
  };

  const alignmentQuery = useQuery({
    queryKey: ["career-alignment", user?.id, companyId],
    queryFn: () => calculateAlignment(companyId!),
    enabled: !!user && !!companyId && (!!valuesProfile || !!careerProfile),
  });

  return {
    alignment: alignmentQuery.data,
    isLoading: alignmentQuery.isLoading,
    hasProfile: !!valuesProfile || !!careerProfile,
    calculateAlignment,
  };
}
