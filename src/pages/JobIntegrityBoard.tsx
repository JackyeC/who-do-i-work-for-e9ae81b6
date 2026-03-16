import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobIntegrityCard } from "@/components/jobs/JobIntegrityCard";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, Search, Shield, ShieldCheck, Briefcase } from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";

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
        .limit(50);

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

  const filtered = useMemo(() => {
    if (!jobs) return [];
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter((j: any) =>
      j.title?.toLowerCase().includes(q) ||
      (j.companies as any)?.name?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q)
    );
  }, [jobs, search]);

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

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={search ? "Try adjusting your search terms" : "No approved job listings yet. Check back soon!"}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((job: any) => (
              <JobIntegrityCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
