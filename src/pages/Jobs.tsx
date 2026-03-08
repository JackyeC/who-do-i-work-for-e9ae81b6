import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { VALUE_CATEGORIES, ValuesPreferenceSidebar } from "@/components/ValuesPreferenceSidebar";
import { JobSidebar } from "@/components/jobs/JobSidebar";
import { JobListRow } from "@/components/jobs/JobListRow";
import { JobDetailDrawer } from "@/components/jobs/JobDetailDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search, Briefcase, Building2, Filter, SlidersHorizontal, X, Monitor,
} from "lucide-react";

export default function Jobs() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("70");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [valuesFilters, setValuesFilters] = useState<string[]>([]);
  const [showValues, setShowValues] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs-with-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_jobs")
        .select(`*, companies:company_id (id, name, slug, industry, civic_footprint_score, state)`)
        .eq("is_active", true)
        .order("scraped_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: valuesSignals } = useQuery({
    queryKey: ["company-values-signals", valuesFilters],
    queryFn: async () => {
      if (valuesFilters.length === 0) return {};
      const { data, error } = await supabase
        .from("company_values_signals")
        .select("company_id, value_category, signal_summary, confidence")
        .in("value_category", valuesFilters);
      if (error) throw error;
      const map: Record<string, any[]> = {};
      (data || []).forEach((s: any) => {
        if (!map[s.company_id]) map[s.company_id] = [];
        map[s.company_id].push(s);
      });
      return map;
    },
    enabled: valuesFilters.length > 0,
  });

  const industries = useMemo(() => {
    if (!jobs) return [];
    const set = new Set(jobs.map((j: any) => j.companies?.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job: any) => {
      const company = job.companies;
      if (!company) return false;
      const loc = (job.location || "").toLowerCase();
      const isNonUS = /\b(india|germany|china|japan|south korea|mexico|brazil|canada|uk|france|spain|italy|australia|singapore|ireland|netherlands|israel|sweden|switzerland)\b/i.test(loc) ||
        /,\s*(in|de|cn|jp|kr|mx|br|ca|gb|fr|es|it|au|sg|ie|nl|il|se|ch)\s*$/i.test(loc);
      if (isNonUS) return false;
      const matchesSearch = !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        loc.includes(search.toLowerCase());
      const matchesScore = company.civic_footprint_score >= parseInt(minScore);
      const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
      const matchesWorkMode = workModeFilter === "all" || job.work_mode === workModeFilter;
      let matchesValues = true;
      if (valuesFilters.length > 0 && valuesSignals) {
        const companySignals = valuesSignals[company.id] || [];
        const companyCategories = new Set(companySignals.map((s: any) => s.value_category));
        matchesValues = valuesFilters.every((f) => companyCategories.has(f));
      }
      return matchesSearch && matchesScore && matchesIndustry && matchesValues && matchesWorkMode;
    });
  }, [jobs, search, minScore, industryFilter, workModeFilter, valuesFilters, valuesSignals]);

  const companiesWithJobs = useMemo(() => {
    if (!filtered) return 0;
    return new Set(filtered.map((j: any) => j.company_id)).size;
  }, [filtered]);

  const handleClickToApply = async (job: any) => {
    if (!user) {
      if (job.url) window.open(job.url, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      await supabase.from("applications_tracker").insert({
        user_id: user.id,
        company_id: job.company_id,
        job_id: job.id,
        job_title: job.title,
        company_name: job.companies?.name || "Unknown",
        application_link: job.url,
        status: "Draft",
      });
      toast.success("Application tracked!");
    } catch (e) {
      console.error("Failed to track application:", e);
    }
    if (job.url) window.open(job.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar nav */}
        <JobSidebar />

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-5">
          {/* Header area */}
          <div className="mb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Source Serif 4', serif" }}>
              Job Board
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {filtered?.length || 0} jobs from {companiesWithJobs} companies · Score 70+
            </p>
          </div>

          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs, companies, or locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={minScore} onValueChange={setMinScore}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter className="w-4 h-4 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Min score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Scores</SelectItem>
                  <SelectItem value="30">Score 30+</SelectItem>
                  <SelectItem value="50">Score 50+</SelectItem>
                  <SelectItem value="70">Score 70+</SelectItem>
                </SelectContent>
              </Select>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Building2 className="w-4 h-4 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={workModeFilter} onValueChange={setWorkModeFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <Monitor className="w-4 h-4 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Work mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showValues ? "default" : "outline"}
                size="icon"
                onClick={() => setShowValues(!showValues)}
                title="Values Filter"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Active values chips */}
          {valuesFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <span className="text-xs text-muted-foreground">Values:</span>
              {valuesFilters.map((f) => {
                const cat = VALUE_CATEGORIES.find((c) => c.key === f);
                return cat ? (
                  <Badge key={f} variant="secondary" className="text-xs flex items-center gap-1">
                    {cat.label}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setValuesFilters((prev) => prev.filter((p) => p !== f))} />
                  </Badge>
                ) : null;
              })}
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setValuesFilters([])}>
                Clear all
              </Button>
            </div>
          )}

          {/* Content area: optional values sidebar + job list */}
          <div className="flex gap-5">
            {showValues && (
              <div className="hidden sm:block w-56 shrink-0">
                <div className="sticky top-20">
                  <ValuesPreferenceSidebar activeFilters={valuesFilters} onFiltersChange={setValuesFilters} />
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0">
              {isLoading && <LoadingState message="Loading job listings..." />}
              {!isLoading && filtered?.length === 0 && (
                <EmptyState
                  icon={Briefcase}
                  title="No jobs found"
                  description={
                    valuesFilters.length > 0
                      ? "No jobs match your values filters. Try removing some filters."
                      : jobs?.length === 0
                      ? "Job listings are being scraped. Check back soon!"
                      : "Try adjusting your filters or search terms."
                  }
                />
              )}

              <div className="space-y-2">
                {filtered?.map((job: any) => {
                  const company = job.companies;
                  const companyValueSignals = valuesSignals?.[company?.id] || [];
                  return (
                    <JobListRow
                      key={job.id}
                      job={job}
                      companyValueSignals={companyValueSignals}
                      isSelected={selectedJob?.id === job.id}
                      onClick={() => setSelectedJob(job)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Job detail drawer */}
      <JobDetailDrawer
        job={selectedJob}
        companyValueSignals={selectedJob ? (valuesSignals?.[selectedJob.companies?.id] || []) : []}
        open={!!selectedJob}
        onOpenChange={(open) => { if (!open) setSelectedJob(null); }}
        onApply={handleClickToApply}
      />

      {/* Mobile values panel */}
      {showValues && (
        <div className="sm:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowValues(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-background border-l border-border p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">Values Filter</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowValues(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ValuesPreferenceSidebar activeFilters={valuesFilters} onFiltersChange={setValuesFilters} />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
