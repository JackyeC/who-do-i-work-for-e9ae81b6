import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartJobRow } from "@/components/jobs/SmartJobRow";
import { JobDetailPanel } from "@/components/jobs/JobDetailPanel";
import { AskJackyeWidget } from "@/components/jobs/AskJackyeWidget";
import { PersonalizationBanner } from "@/components/jobs/PersonalizationBanner";
import { ExternalJobFeed } from "@/components/jobs/ExternalJobFeed";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, Search, Shield, ShieldCheck, Briefcase, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageSEO } from "@/hooks/use-page-seo";
import { cn } from "@/lib/utils";

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

export default function JobIntegrityBoard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  usePageSEO({
    title: "Job Integrity Board | Who Do I Work For?",
    description: "Browse vetted job listings with transparency signals, employer insights, and connection chain data before you apply.",
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["job-integrity-board", filter],
    queryFn: async () => {
      let query = supabase
        .from("company_jobs")
        .select("id, title, location, work_mode, url, created_at, posted_at, company_id, is_featured, admin_approved, salary_range, seniority_level, department, description, employment_type, source_platform, companies(name, slug, logo_url, vetted_status, jackye_insight, description, civic_footprint_score)")
        .eq("is_active", true)
        .eq("admin_approved", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (filter === "certified") {
        query = query.eq("companies.vetted_status", "certified");
      } else if (filter === "verified") {
        query = query.in("companies.vetted_status", ["verified", "certified"]);
      } else if (filter === "pay_transparent") {
        query = query.not("salary_range", "is", null);
      }

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

  const filtered = useMemo(() => {
    if (!jobs) return [];
    let result = jobs;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((j: any) =>
        j.title?.toLowerCase().includes(q) ||
        (j.companies as any)?.name?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      );
    }

    const prefCategories = getUserPreferenceCategories();
    if (prefCategories.size > 0 && alignmentSignals) {
      result = [...result].sort((a: any, b: any) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        const aCats = alignmentSignals[a.company_id];
        const bCats = alignmentSignals[b.company_id];
        const aScore = aCats ? [...prefCategories].filter(c => aCats.has(c)).length : 0;
        const bScore = bCats ? [...prefCategories].filter(c => bCats.has(c)).length : 0;
        if (aScore !== bScore) return bScore - aScore;
        return 0;
      });
    }

    return result;
  }, [jobs, search, alignmentSignals]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId || !filtered.length) return null;
    return filtered.find((j: any) => j.id === selectedJobId) || null;
  }, [selectedJobId, filtered]);

  const getMatchData = useCallback((job: any) => {
    const prefCategories = getUserPreferenceCategories();
    const companyCats = alignmentSignals?.[job.company_id];
    const matchedCats = companyCats ? [...prefCategories].filter(c => companyCats.has(c)) : [];
    return { matchCount: matchedCats.length, matchedCategories: matchedCats };
  }, [alignmentSignals]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">
        {/* Page header */}
        <div className="border-b border-border/60 bg-background">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
              Job Integrity Board
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Every listing includes transparency signals, strategic context, and employer intelligence.
            </p>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search jobs, companies, locations..."
                  className="pl-9 h-9"
                />
                {search && (
                  <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearch("")}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="verified">
                    <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Verified+</span>
                  </SelectItem>
                  <SelectItem value="certified">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Certified Only</span>
                  </SelectItem>
                  <SelectItem value="pay_transparent">
                    <span className="flex items-center gap-1.5">💰 Pay Transparent</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content area: list + panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Job list */}
          <div className={cn(
            "flex-1 overflow-y-auto border-r border-border/40",
            selectedJob ? "hidden md:block md:max-w-[420px] lg:max-w-[480px]" : "w-full"
          )}>
            <div className="px-4 py-3">
              <PersonalizationBanner />
              <ExternalJobFeed />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4">
                <EmptyState
                  icon={Briefcase}
                  title="No jobs found"
                  description={search ? "Try adjusting your search" : "No approved listings yet."}
                />
              </div>
            ) : (
              <>
                <div className="px-4 pb-2">
                  <p className="text-xs text-muted-foreground">{filtered.length} listings</p>
                </div>
                {filtered.map((job: any) => {
                  const { matchCount } = getMatchData(job);
                  return (
                    <SmartJobRow
                      key={job.id}
                      job={job}
                      isSelected={job.id === selectedJobId}
                      matchScore={matchCount}
                      onClick={() => setSelectedJobId(job.id)}
                    />
                  );
                })}
              </>
            )}
          </div>

          {/* Detail panel */}
          {selectedJob && (
            <div className={cn(
              "bg-background",
              "w-full md:flex-1"
            )}>
              {(() => {
                const { matchCount, matchedCategories } = getMatchData(selectedJob);
                return (
                  <JobDetailPanel
                    job={selectedJob}
                    matchCount={matchCount}
                    matchedCategories={matchedCategories}
                    onClose={() => setSelectedJobId(null)}
                  />
                );
              })()}
            </div>
          )}
        </div>
      </main>
      <AskJackyeWidget />
      {!selectedJob && <Footer />}
    </div>
  );
}
