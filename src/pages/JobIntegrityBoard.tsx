import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { JobIntegrityCard } from "@/components/jobs/JobIntegrityCard";
import { AskJackyeWidget } from "@/components/jobs/AskJackyeWidget";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, Search, Shield, ShieldCheck, Briefcase, Landmark, Scale } from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";

type AlignmentFilter = "all" | "traditional" | "progressive";

export default function JobIntegrityBoard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [alignment, setAlignment] = useState<AlignmentFilter>("all");

  usePageSEO({
    title: "Job Integrity Board | Who Do I Work For?",
    description: "Browse vetted job listings with transparency signals, employer insights, and connection chain data before you apply.",
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["job-integrity-board", filter],
    queryFn: async () => {
      let query = supabase
        .from("company_jobs")
        .select("id, title, location, work_mode, url, created_at, company_id, is_featured, admin_approved, companies(name, slug, logo_url, vetted_status, jackye_insight, description)")
        .eq("is_active", true)
        .eq("admin_approved", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (filter === "certified") {
        query = query.eq("companies.vetted_status", "certified");
      } else if (filter === "verified") {
        query = query.in("companies.vetted_status", ["verified", "certified"]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch alignment signals for company-level filtering
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

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((j: any) =>
        j.title?.toLowerCase().includes(q) ||
        (j.companies as any)?.name?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      );
    }

    // Values alignment filter
    if (alignment !== "all" && alignmentSignals) {
      result = result.filter((j: any) => {
        const categories = alignmentSignals[j.company_id];
        if (!categories) return false;
        if (alignment === "traditional") return categories.has("traditional_policy");
        if (alignment === "progressive") return categories.has("progress_policy");
        return true;
      });
    }

    return result;
  }, [jobs, search, alignment, alignmentSignals]);

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

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search jobs, companies, locations..."
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
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
              </SelectContent>
            </Select>
          </div>

          {/* Values Alignment Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Values:</span>
            <ToggleGroup
              type="single"
              value={alignment}
              onValueChange={(v) => v && setAlignment(v as AlignmentFilter)}
              className="bg-muted/30 rounded-full p-0.5 border border-border/50"
            >
              <ToggleGroupItem
                value="all"
                className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Scale className="w-3 h-3 mr-1" /> All
              </ToggleGroupItem>
              <ToggleGroupItem
                value="traditional"
                className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Landmark className="w-3 h-3 mr-1" /> Heritage
              </ToggleGroupItem>
              <ToggleGroupItem
                value="progressive"
                className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <ShieldCheck className="w-3 h-3 mr-1" /> Progressive
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={search || alignment !== "all" ? "Try adjusting your filters" : "No approved job listings yet. Check back soon!"}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((job: any) => (
              <JobIntegrityCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
      <AskJackyeWidget />
      <Footer />
    </div>
  );
}
