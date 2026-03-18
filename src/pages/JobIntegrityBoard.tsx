import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JobIntegrityCard } from "@/components/jobs/JobIntegrityCard";
import { AskJackyeWidget } from "@/components/jobs/AskJackyeWidget";
import { PersonalizationBanner } from "@/components/jobs/PersonalizationBanner";
import { ExternalJobFeed } from "@/components/jobs/ExternalJobFeed";
import { JobBoardFilters, type JobBoardFilterState } from "@/components/jobs/JobBoardFilters";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, Briefcase } from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { computeRankingScore, evaluateJobQuality, hasEvergreenSignals } from "@/lib/jobQuality";
import { differenceInDays } from "date-fns";
import { useJobPreferences } from "@/hooks/use-job-preferences";
import { evaluateJobFit } from "@/lib/jobFitEngine";
import { computeLeverage } from "@/components/jobs/LeverageScore";

function getUserPreferenceCategories(): Set<string> {
  try {
    const raw = localStorage.getItem("userWorkProfile");
    if (!raw) return new Set();
    const profile = JSON.parse(raw);
    const cats = new Set<string>();
    if (profile.priorities?.includes("values")) {
      cats.add("progress_policy");
      cats.add("traditional_policy");
    }
    if (profile.priorities?.includes("stability")) cats.add("labor_policy");
    if (profile.priorities?.includes("sustainability")) cats.add("climate_policy");
    if (profile.priorities?.includes("equity")) cats.add("equity_policy");
    return cats;
  } catch {
    return new Set();
  }
}

const DEFAULT_FILTERS: JobBoardFilterState = {
  search: "",
  workMode: "all",
  seniority: "all",
  department: "all",
  trustFilter: "all",
  payTransparent: false,
  highClarity: false,
  valuesAligned: false,
  freshOnly: false,
  salaryMin: 0,
  location: "",
};

function parseSalaryMin(salaryRange: string | null): number {
  if (!salaryRange) return 0;
  const match = salaryRange.match(/\$?([\d,]+)/);
  if (!match) return 0;
  const val = parseFloat(match[1].replace(/,/g, ""));
  return salaryRange.toLowerCase().includes("k") ? val : val / 1000;
}

export default function JobIntegrityBoard() {
  const [filters, setFilters] = useState<JobBoardFilterState>(DEFAULT_FILTERS);
  const { preferences } = useJobPreferences();

  usePageSEO({
    title: "Job Integrity Board | Who Do I Work For?",
    description: "Browse vetted job listings with transparency signals, employer insights, and connection chain data before you apply.",
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["job-integrity-board"],
    queryFn: async () => {
      let query = supabase
        .from("company_jobs")
        .select("id, title, location, work_mode, url, created_at, posted_at, company_id, is_featured, admin_approved, salary_range, seniority_level, department, description, employment_type, source_platform, companies(name, slug, logo_url, vetted_status, jackye_insight, description, civic_footprint_score)")
        .eq("is_active", true)
        .eq("admin_approved", true)
        .order("created_at", { ascending: false })
        .limit(200);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const companyIds = useMemo(() => jobs?.map((j: any) => j.company_id).filter(Boolean) || [], [jobs]);

  const { data: alignmentSignals } = useQuery({
    queryKey: ["alignment-signals", companyIds.slice(0, 10).join(",")],
    queryFn: async () => {
      if (!companyIds.length) return {};
      const { data } = await (supabase as any)
        .from("institutional_alignment_signals")
        .select("company_id, institution_category")
        .in("company_id", companyIds);
      const map: Record<string, Set<string>> = {};
      (data || []).forEach((r: any) => {
        if (!map[r.company_id]) map[r.company_id] = new Set();
        map[r.company_id].add(r.institution_category);
      });
      return map;
    },
    enabled: companyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Extract unique departments/seniority for filter options
  const availableDepartments = useMemo(() => {
    if (!jobs) return [];
    return [...new Set(jobs.map((j: any) => j.department).filter(Boolean))].sort();
  }, [jobs]);

  const availableSeniority = useMemo(() => {
    if (!jobs) return [];
    return [...new Set(jobs.map((j: any) => j.seniority_level).filter(Boolean))].sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    const prefCategories = getUserPreferenceCategories();
    let result = [...jobs];

    // Text search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter((j: any) =>
        j.title?.toLowerCase().includes(q) ||
        (j.companies as any)?.name?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q) ||
        j.department?.toLowerCase().includes(q)
      );
    }

    // Location filter
    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      result = result.filter((j: any) => j.location?.toLowerCase().includes(loc));
    }

    // Work mode
    if (filters.workMode !== "all") {
      result = result.filter((j: any) => j.work_mode === filters.workMode);
    }

    // Seniority
    if (filters.seniority !== "all") {
      result = result.filter((j: any) => j.seniority_level === filters.seniority);
    }

    // Department
    if (filters.department !== "all") {
      result = result.filter((j: any) => j.department === filters.department);
    }

    // Trust level
    if (filters.trustFilter === "certified") {
      result = result.filter((j: any) => (j.companies as any)?.vetted_status === "certified");
    } else if (filters.trustFilter === "verified") {
      result = result.filter((j: any) => ["verified", "certified"].includes((j.companies as any)?.vetted_status));
    }

    // Intelligence chips
    if (filters.payTransparent) {
      result = result.filter((j: any) => j.salary_range);
    }

    if (filters.highClarity) {
      result = result.filter((j: any) => ((j.companies as any)?.civic_footprint_score || 0) >= 70);
    }

    if (filters.valuesAligned && prefCategories.size > 0 && alignmentSignals) {
      result = result.filter((j: any) => {
        const cats = alignmentSignals[j.company_id];
        return cats && [...prefCategories].some((c) => cats.has(c));
      });
    }

    if (filters.freshOnly) {
      result = result.filter((j: any) => {
        const days = differenceInDays(new Date(), new Date(j.posted_at || j.created_at));
        return days <= 7;
      });
    }

    // Salary minimum
    if (filters.salaryMin > 0) {
      result = result.filter((j: any) => parseSalaryMin(j.salary_range) >= filters.salaryMin);
    }

    // Ranking sort
    result.sort((a: any, b: any) => {
      const aAlignment = alignmentSignals?.[a.company_id]
        ? [...prefCategories].filter((c) => alignmentSignals[a.company_id].has(c)).length
        : 0;
      const bAlignment = alignmentSignals?.[b.company_id]
        ? [...prefCategories].filter((c) => alignmentSignals[b.company_id].has(c)).length
        : 0;

      const aScore = computeRankingScore(a, aAlignment);
      const bScore = computeRankingScore(b, bAlignment);
      return bScore - aScore;
    });

    return result;
  }, [jobs, filters, alignmentSignals]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            Job Integrity Board
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every listing includes employer transparency signals, strategic context, and
            Connection Chain data — so you know who you're really working for.
          </p>
        </div>

        <JobBoardFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableDepartments={availableDepartments}
          availableSeniority={availableSeniority}
        />

        <PersonalizationBanner />
        <ExternalJobFeed />

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={filters.search ? "Try adjusting your search or filters" : "No approved job listings yet. Check back soon!"}
          />
        ) : (
          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            {filtered.map((job: any) => {
              const prefCategories = getUserPreferenceCategories();
              const companyCats = alignmentSignals?.[job.company_id];
              const matchedCats = companyCats ? [...prefCategories].filter((c) => companyCats.has(c)) : [];
              const fit = evaluateJobFit(job, preferences);
              const civicScore = (job.companies as any)?.civic_footprint_score || 0;
              const leverage = computeLeverage(job, civicScore, false);
              return (
                <JobIntegrityCard
                  key={job.id}
                  job={job}
                  matchCount={matchedCats.length}
                  matchedCategories={matchedCats}
                  fitBadges={fit.fitBadges}
                  fitScore={fit.fitScore}
                  leverageLevel={leverage.level}
                />
              );
            })}
          </div>
        )}
      </main>
      <AskJackyeWidget />
      <Footer />
    </div>
  );
}
