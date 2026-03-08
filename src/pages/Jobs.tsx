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
import { ValuesPreferenceSidebar, VALUE_CATEGORIES } from "@/components/ValuesPreferenceSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Briefcase, Building2, ExternalLink, Filter, FileCheck, SlidersHorizontal, X } from "lucide-react";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("70");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [valuesFilters, setValuesFilters] = useState<string[]>([]);
  const [showValues, setShowValues] = useState(false);

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

  // Fetch values signals for companies when filters are active
  const { data: valuesSignals } = useQuery({
    queryKey: ["company-values-signals", valuesFilters],
    queryFn: async () => {
      if (valuesFilters.length === 0) return {};
      const { data, error } = await supabase
        .from("company_values_signals")
        .select("company_id, value_category, signal_summary, confidence")
        .in("value_category", valuesFilters);
      if (error) throw error;
      // Group by company_id
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
      
      // Values filter: company must have at least one signal in each active category
      let matchesValues = true;
      if (valuesFilters.length > 0 && valuesSignals) {
        const companySignals = valuesSignals[company.id] || [];
        const companyCategories = new Set(companySignals.map((s: any) => s.value_category));
        matchesValues = valuesFilters.every((f) => companyCategories.has(f));
      }

      return matchesSearch && matchesScore && matchesIndustry && matchesValues;
    });
  }, [jobs, search, minScore, industryFilter, valuesFilters, valuesSignals]);

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
            civic transparency score and value signals.
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

        {/* Active values filter badges */}
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

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-4 sm:mb-6 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{filtered?.length || 0}</strong> jobs</span>
          <span>from <strong className="text-foreground">{companiesWithJobs}</strong> companies</span>
        </div>

        <div className="flex gap-6">
          {/* Values Sidebar */}
          {showValues && (
            <div className="hidden sm:block w-64 shrink-0">
              <div className="sticky top-20">
                <ValuesPreferenceSidebar activeFilters={valuesFilters} onFiltersChange={setValuesFilters} />
              </div>
            </div>
          )}

          {/* Job listings */}
          <div className="flex-1 min-w-0">
            {isLoading && <LoadingState message="Loading job listings..." />}

            {!isLoading && filtered?.length === 0 && (
              <EmptyState
                icon={Briefcase}
                title="No jobs found"
                description={
                  valuesFilters.length > 0
                    ? "No jobs match your values filters. Try removing some filters or running a values scan on more companies."
                    : jobs?.length === 0
                    ? "Job listings are being scraped from company career pages. Check back soon!"
                    : "Try adjusting your filters or search terms."
                }
              />
            )}

            <div className="space-y-3">
              {filtered?.map((job: any) => {
                const company = job.companies;
                const companyValueSignals = valuesSignals?.[company?.id] || [];
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
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {job.salary_range && (
                              <span className="text-xs font-medium text-civic-green">{job.salary_range}</span>
                            )}
                            {companyValueSignals.length > 0 && companyValueSignals.map((vs: any, idx: number) => {
                              const cat = VALUE_CATEGORIES.find((c) => c.key === vs.value_category);
                              if (!cat) return null;
                              const Icon = cat.icon;
                              return (
                                <Badge key={idx} variant="outline" className="text-[10px] gap-1" title={vs.signal_summary}>
                                  <Icon className={`w-3 h-3 ${cat.color}`} />
                                  {cat.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <CivicScoreCard score={company?.civic_footprint_score || 0} size="sm" showLabel={false} />
                          <CivicScoreBadge score={company?.civic_footprint_score || 0} />
                          <Link to={`/offer-check/${company?.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> Offer Check
                          </Link>
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
          </div>
        </div>

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
      </main>
      <Footer />
    </div>
  );
}
