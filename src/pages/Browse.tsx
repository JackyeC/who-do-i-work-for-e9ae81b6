import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { motion } from "framer-motion";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { companies as sampleCompanies, formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Building2, ArrowRight, Search, TrendingUp, SortAsc, Sparkles, Loader2, Landmark } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NonProfitDirectory } from "@/components/browse/NonProfitDirectory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.025 } } },
  item: { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } },
};

const PAGE_SIZE = 50;

export default function Browse() {
  usePageSEO({
    title: "Browse Companies — Employer Intelligence Directory",
    description: "Browse 200+ employer profiles with civic footprint scores, PAC spending, lobbying data, and career intelligence. Filter by industry and category.",
    path: "/browse",
    jsonLd: {
      "@type": "CollectionPage",
      name: "Employer Intelligence Directory",
      description: "Browse 200+ employer profiles with civic footprint scores, PAC spending, lobbying data, and career intelligence.",
      isPartOf: { "@type": "WebApplication", name: "Who Do I Work For?" },
      provider: { "@type": "Person", name: "Jackye Clayton" },
    },
  });

  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "score" | "cis">("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: dbCompanies, isLoading } = useQuery({
    queryKey: ["browse-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state, civic_footprint_score, total_pac_spending, lobbying_spend, revenue, employee_count, description, is_startup, category_tags, career_intelligence_score")
        .order("civic_footprint_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const allCompanies = useMemo(() => {
    const dbList = (dbCompanies || []).map((c: any) => ({
      id: c.slug, dbId: c.id, name: c.name, slug: c.slug, industry: c.industry, state: c.state,
      civicFootprintScore: c.civic_footprint_score, totalPacSpending: c.total_pac_spending,
      lobbyingSpend: c.lobbying_spend, revenue: c.revenue, employeeCount: c.employee_count,
      description: c.description, isDbOnly: true,
      isStartup: c.is_startup, categoryTags: c.category_tags || [],
      careerIntelligenceScore: c.career_intelligence_score,
    }));
    const dbSlugs = new Set(dbList.map((c: any) => c.slug));
    const sampleExtras = sampleCompanies
      .filter((c) => !dbSlugs.has(c.id))
      .map((c) => ({
        id: c.id, dbId: undefined, name: c.name, slug: c.id, industry: c.industry, state: c.state,
        civicFootprintScore: c.civicFootprintScore, totalPacSpending: c.totalPacSpending,
        lobbyingSpend: c.lobbyingSpend, revenue: c.revenue, employeeCount: c.employeeCount,
        description: c.description, isDbOnly: false,
        isStartup: false, categoryTags: [] as string[],
        careerIntelligenceScore: null as number | null,
      }));
    return [...dbList, ...sampleExtras];
  }, [dbCompanies]);

  const allIndustries = useMemo(() => [...new Set(allCompanies.map((c) => c.industry))].sort(), [allCompanies]);

  const CATEGORY_FILTERS = ["HR Tech", "Big Tech", "Finance", "Defense", "Government Contractors", "Startups", "Healthcare", "Energy", "Retail"];

  const filtered = useMemo(() => {
    setVisibleCount(PAGE_SIZE);
    let list = allCompanies;
    if (selectedIndustry !== "all") list = list.filter((c) => c.industry === selectedIndustry);
    if (selectedCategory !== "all") {
      if (selectedCategory === "Startups") {
        list = list.filter((c) => c.isStartup);
      } else {
        list = list.filter((c) => c.categoryTags?.includes(selectedCategory));
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === "cis") return (b.careerIntelligenceScore ?? 0) - (a.careerIntelligenceScore ?? 0);
      if (sortBy === "score") return b.civicFootprintScore - a.civicFootprintScore;
      return a.name.localeCompare(b.name);
    });
  }, [allCompanies, selectedIndustry, selectedCategory, sortBy, searchQuery]);

  const visibleCompanies = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="flex-1">
      <Tabs defaultValue="companies" className="w-full">
      {/* Compact header */}
      <div className="border-b border-border/40 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Employer Directory
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allCompanies.length} companies tracked
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TabsList className="bg-muted/60 h-8">
              <TabsTrigger value="companies" className="text-xs gap-1.5 h-7 px-3">
                <Building2 className="w-3 h-3" />
                Companies
              </TabsTrigger>
              <TabsTrigger value="nonprofits" className="text-xs gap-1.5 h-7 px-3">
                <Landmark className="w-3 h-3" />
                Non-Profits
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/add-company")}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Add Company
            </Button>
          </div>
        </div>
      </div>

      <TabsContent value="companies" className="mt-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {/* Controls row — search, industry dropdown, sort */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies…"
              className="pl-9 h-9 rounded-lg bg-muted/40 border-border/40 text-sm"
            />
          </div>

          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-full sm:w-[200px] h-9 rounded-lg bg-muted/40 border-border/40 text-sm">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="all">All Industries</SelectItem>
              {allIndustries.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-0.5 bg-muted/40 rounded-lg p-0.5 border border-border/40 shrink-0">
            <button
              onClick={() => setSortBy("score")}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-all ${
                sortBy === "score" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              CFS
            </button>
            <button
              onClick={() => setSortBy("cis")}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-all ${
                sortBy === "cis" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              CIS
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-all ${
                sortBy === "name" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <SortAsc className="w-3 h-3" />
              A–Z
            </button>
          </div>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`text-xs font-mono tracking-wider uppercase px-2.5 py-1 transition-all ${
              selectedCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40"
            }`}
          >
            All
          </button>
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
              className={`text-xs font-mono tracking-wider uppercase px-2.5 py-1 transition-all ${
                selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-3">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {selectedIndustry !== "all" && <> in <span className="text-foreground font-medium">{selectedIndustry}</span></>}
        </p>

        {/* Grid */}
        {isLoading ? (
          <LoadingState message="Loading companies…" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <EmptyState icon={Building2} title="No companies match" description="Try adjusting your search or filter." />
            {searchQuery.trim().length >= 2 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Can't find <strong>"{searchQuery}"</strong>? We can discover and research it automatically.
                </p>
                <Button
                  onClick={async () => {
                    setIsDiscovering(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("company-discover", {
                        body: { searchQuery: searchQuery.trim(), companyName: searchQuery.trim() },
                      });
                      if (error) throw error;
                      if (data?.success) {
                        toast({
                          title: data.action === "existing" ? "Company found" : "Company discovered",
                          description: data.action === "created"
                            ? `Building intelligence profile for ${data.identity?.name || searchQuery}...`
                            : "Opening existing profile...",
                        });
                        navigate(`/company/${data.slug}`);
                      } else {
                        throw new Error(data?.error || "Discovery failed");
                      }
                    } catch (e: any) {
                      toast({ title: "Discovery failed", description: e.message, variant: "destructive" });
                    } finally {
                      setIsDiscovering(false);
                    }
                  }}
                  disabled={isDiscovering}
                  className="gap-2"
                >
                  {isDiscovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isDiscovering ? "Discovering..." : "Discover & Research"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
          >
            {visibleCompanies.map((company) => (
              <motion.div key={company.slug} variants={stagger.item}>
                <Link to={`/company/${company.slug}`}>
                  <Card className="group hover:shadow-md transition-all duration-150 hover:border-primary/20 cursor-pointer h-full border-border/40">
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {company.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {company.industry} · {company.state}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-0.5 shrink-0" />
                      </div>
                      <div className="mt-2.5 pt-2.5 border-t border-border/30 flex items-center justify-between">
                        <CivicFootprintBadge score={company.civicFootprintScore} size="sm" />
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {company.totalPacSpending > 0 ? formatCurrency(company.totalPacSpending) : "No PAC"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Show More */}
        {hasMore && !isLoading && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="gap-2"
            >
              Show More
              <span className="text-xs text-muted-foreground">
                ({visibleCount} of {filtered.length})
              </span>
            </Button>
          </div>
        )}
      </div>
      </TabsContent>

      <TabsContent value="nonprofits" className="mt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <NonProfitDirectory />
        </div>
      </TabsContent>
      </Tabs>
    </div>
  );
}
