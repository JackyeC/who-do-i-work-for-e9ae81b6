import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobIntegrityCard } from "@/components/jobs/JobIntegrityCard";
import { AskJackyeWidget } from "@/components/jobs/AskJackyeWidget";
import { PersonalizationBanner } from "@/components/jobs/PersonalizationBanner";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, Search, Shield, ShieldCheck, Briefcase } from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";

/**
 * Reads the user's saved Work Profile preferences from localStorage
 * and returns a set of category keywords to boost in sorting.
 */
function getUserPreferenceCategories(): Set<string> {
  try {
    const raw = localStorage.getItem("userWorkProfile");
    if (!raw) return new Set();
    const profile = JSON.parse(raw);
    const cats = new Set<string>();

    // Map work profile priorities to institutional signal categories
    if (profile.priorities?.includes("values")) {
      cats.add("progress_policy");
      cats.add("traditional_policy");
    }
    if (profile.priorities?.includes("stability")) cats.add("labor_policy");
    if (profile.priorities?.includes("sustainability")) cats.add("climate_policy");
    if (profile.priorities?.includes("equity")) cats.add("equity_policy");

    // Map avoidances
    if (profile.avoidances?.includes("fossil_fuel")) cats.add("climate_policy");
    if (profile.avoidances?.includes("union_busting")) cats.add("labor_policy");

    return cats;
  } catch {
    return new Set();
  }
}

export default function JobIntegrityBoard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

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

  // Fetch alignment signals for preference-based sorting
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

    // Auto-sort by user's saved preferences (silent ranking boost)
    const prefCategories = getUserPreferenceCategories();
    if (prefCategories.size > 0 && alignmentSignals) {
      result = [...result].sort((a: any, b: any) => {
        // Featured jobs always stay on top
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;

        const aCats = alignmentSignals[a.company_id];
        const bCats = alignmentSignals[b.company_id];
        const aScore = aCats ? [...prefCategories].filter(c => aCats.has(c)).length : 0;
        const bScore = bCats ? [...prefCategories].filter(c => bCats.has(c)).length : 0;

        if (aScore !== bScore) return bScore - aScore;
        return 0; // preserve existing order (created_at desc)
      });
    }

    return result;
  }, [jobs, search, alignmentSignals]);

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
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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

        {/* Personalization Banner */}
        <PersonalizationBanner />

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={search ? "Try adjusting your search" : "No approved job listings yet. Check back soon!"}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((job: any) => {
              const prefCategories = getUserPreferenceCategories();
              const companyCats = alignmentSignals?.[job.company_id];
              const matchedCats = companyCats ? [...prefCategories].filter(c => companyCats.has(c)) : [];
              return (
                <JobIntegrityCard
                  key={job.id}
                  job={job}
                  matchCount={matchedCats.length}
                  matchedCategories={matchedCats}
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
