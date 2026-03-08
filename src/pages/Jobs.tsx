import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CivicScoreCard, CivicScoreBadge } from "@/components/CivicScoreCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Briefcase, Building2, ExternalLink, ArrowRight, Filter } from "lucide-react";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [industryFilter, setIndustryFilter] = useState("all");

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
      const matchesSearch = !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        (job.location || "").toLowerCase().includes(search.toLowerCase());
      const matchesScore = company.civic_footprint_score >= parseInt(minScore);
      const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
      return matchesSearch && matchesScore && matchesIndustry;
    });
  }, [jobs, search, minScore, industryFilter]);

  const companiesWithJobs = useMemo(() => {
    if (!filtered) return 0;
    return new Set(filtered.map((j: any) => j.company_id)).size;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
            Job Board
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Browse job openings from companies in the directory. Every listing includes the employer's
            civic transparency score.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search jobs, companies, or locations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Select value={minScore} onValueChange={setMinScore}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
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
              <SelectTrigger className="w-full sm:w-[180px]">
                <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-4 sm:mb-6 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{filtered?.length || 0}</strong> jobs</span>
          <span>from <strong className="text-foreground">{companiesWithJobs}</strong> companies</span>
        </div>

        {isLoading && <LoadingState message="Loading job listings..." />}

        {!isLoading && filtered?.length === 0 && (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={
              jobs?.length === 0
                ? "Job listings are being scraped from company career pages. Check back soon!"
                : "Try adjusting your filters or search terms."
            }
          />
        )}

        <div className="space-y-3">
          {filtered?.map((job: any) => {
            const company = job.companies;
            return (
              <Card key={job.id} className="border-border hover:border-primary/20 transition-colors">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">{job.title}</h3>
                        {job.employment_type && job.employment_type !== "full-time" && (
                          <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">{job.employment_type}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground mb-2">
                        <Link to={`/company/${company?.slug}`} className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {company?.name}
                        </Link>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                      )}
                      {job.salary_range && (
                        <span className="text-xs font-medium text-civic-green mt-1 inline-block">{job.salary_range}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <CivicScoreCard score={company?.civic_footprint_score || 0} size="sm" showLabel={false} />
                      <CivicScoreBadge score={company?.civic_footprint_score || 0} />
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          Apply <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
