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

export function useCareerAlignmentScore(companyId?: string) {
  const { user } = useAuth();

  const { data: valuesProfile } = useQuery({
    queryKey: ["user-alignment-values", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_alignment_values")
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

    // Fetch company data
    const { data: company } = await supabase
      .from("companies")
      .select("id, name, slug, civic_footprint_score, industry")
      .eq("id", targetCompanyId)
      .single();

    if (!company) return null;

    const matchedSignals: string[] = [];
    let skillsScore = 50; // default if no career profile
    let valuesScore = 50;
    let signalsScore = 0;
    let jobScore = 50;

    // Fetch company signals in parallel
    const [benefitsRes, aiHiringRes, payEquityRes, sentimentRes, valuesSignalsRes] = await Promise.all([
      supabase.from("ai_hr_signals").select("signal_category").eq("company_id", targetCompanyId),
      supabase.from("ai_hiring_signals").select("transparency_score, bias_audit_status").eq("company_id", targetCompanyId),
      supabase.from("pay_equity_signals").select("signal_category").eq("company_id", targetCompanyId),
      supabase.from("company_worker_sentiment").select("overall_rating").eq("company_id", targetCompanyId),
      supabase.from("company_values_signals").select("value_category, confidence").eq("company_id", targetCompanyId),
    ]);

    // Calculate signals score based on what's available
    let signalCount = 0;
    const totalSignalWeight = 5;

    if ((benefitsRes.data?.length || 0) > 0) { signalCount++; matchedSignals.push("Worker Benefits"); }
    if ((aiHiringRes.data?.length || 0) > 0) { signalCount++; matchedSignals.push("AI Transparency"); }
    if ((payEquityRes.data?.length || 0) > 0) { signalCount++; matchedSignals.push("Pay Transparency"); }
    if ((sentimentRes.data?.length || 0) > 0) { signalCount++; matchedSignals.push("Worker Sentiment"); }
    if ((valuesSignalsRes.data?.length || 0) > 0) { signalCount++; matchedSignals.push("Values Signals"); }

    signalsScore = Math.round((signalCount / totalSignalWeight) * 100);

    // Civic footprint as base quality
    signalsScore = Math.round(signalsScore * 0.5 + (company.civic_footprint_score || 0) * 0.5);

    // Values alignment calculation
    if (valuesProfile) {
      let valueMatches = 0;
      let valueTotal = 0;

      const valuesMap: Record<string, string[]> = {
        pay_equity_weight: ["pay_transparency", "salary_transparency"],
        worker_protections_weight: ["worker_benefits"],
        ai_transparency_weight: ["ai_transparency"],
        benefits_quality_weight: ["worker_benefits"],
        dei_commitment_weight: ["anti_discrimination", "lgbtq_inclusive"],
        environmental_commitment_weight: ["environmental"],
        veteran_support_weight: ["veteran_support"],
      };

      const companyValueCats = (valuesSignalsRes.data || []).map((v: any) => v.value_category);

      Object.entries(valuesMap).forEach(([weightKey, categories]) => {
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

    // Skills match from career profile
    if (careerProfile) {
      const userSkills = ((careerProfile as any).skills || []).map((s: string) => s.toLowerCase());
      if (userSkills.length > 0) {
        // Simplified: check against company jobs
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

          // Job title match
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

    // Weighted overall score: Skills 30%, Values 30%, Signals 25%, Job 15%
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