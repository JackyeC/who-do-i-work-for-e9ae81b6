import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { companies as sampleCompanies, formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Building2, ArrowRight, Search, SlidersHorizontal, TrendingUp, SortAsc } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { InfluenceLeaderboard } from "@/components/InfluenceLeaderboard";
import { Badge } from "@/components/ui/badge";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.03 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } } },
};

export default function Browse() {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "score">("score");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: dbCompanies, isLoading } = useQuery({
    queryKey: ["browse-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state, civic_footprint_score, total_pac_spending, lobbying_spend, revenue, employee_count, description")
        .order("civic_footprint_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const allCompanies = useMemo(() => {
    const dbList = (dbCompanies || []).map((c) => ({
      id: c.slug, dbId: c.id, name: c.name, slug: c.slug, industry: c.industry, state: c.state,
      civicFootprintScore: c.civic_footprint_score, totalPacSpending: c.total_pac_spending,
      lobbyingSpend: c.lobbying_spend, revenue: c.revenue, employeeCount: c.employee_count,
      description: c.description, isDbOnly: true,
    }));
    const dbSlugs = new Set(dbList.map((c) => c.slug));
    const sampleExtras = sampleCompanies
      .filter((c) => !dbSlugs.has(c.id))
      .map((c) => ({
        id: c.id, dbId: undefined, name: c.name, slug: c.id, industry: c.industry, state: c.state,
        civicFootprintScore: c.civicFootprintScore, totalPacSpending: c.totalPacSpending,
        lobbyingSpend: c.lobbyingSpend, revenue: c.revenue, employeeCount: c.employeeCount,
        description: c.description, isDbOnly: false,
      }));
    return [...dbList, ...sampleExtras];
  }, [dbCompanies]);

  const allIndustries = useMemo(() => [...new Set(allCompanies.map((c) => c.industry))].sort(), [allCompanies]);

  const filtered = useMemo(() => {
    let list = allCompanies;
    if (selectedIndustry) list = list.filter((c) => c.industry === selectedIndustry);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => sortBy === "score" ? b.civicFootprintScore - a.civicFootprintScore : a.name.localeCompare(b.name));
  }, [allCompanies, selectedIndustry, sortBy, searchQuery]);

  return (
    <div className="flex-1">
      {/* Hero header */}
      <div className="border-b border-border/40 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
                  {allCompanies.length.toLocaleString()} companies
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Employer Directory
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                Browse transparency profiles, civic footprint scores, and political spending data.
              </p>
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-xl p-1 border border-border/40">
              <button
                onClick={() => setSortBy("score")}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  sortBy === "score"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                By Score
              </button>
              <button
                onClick={() => setSortBy("name")}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  sortBy === "name"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <SortAsc className="w-3 h-3" />
                A – Z
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, industry, or state…"
              className="pl-10 h-10 rounded-xl bg-muted/40 border-border/40"
            />
          </div>
        </div>

        {/* Industry pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          <button
            onClick={() => setSelectedIndustry(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedIndustry === null
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40"
            }`}
          >
            All
          </button>
          {allIndustries.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedIndustry === ind
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <InfluenceLeaderboard />

        {/* Results */}
        {isLoading ? (
          <LoadingState message="Loading companies…" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 mt-2">
              <p className="text-xs text-muted-foreground font-medium">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                {selectedIndustry && <> in <span className="text-foreground">{selectedIndustry}</span></>}
              </p>
            </div>

            <motion.div
              variants={stagger.container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {filtered.map((company) => (
                <motion.div key={company.slug} variants={stagger.item}>
                  <Link to={`/company/${company.slug}`}>
                    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer h-full border-border/50 bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                              <Building2 className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                                {company.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {company.industry} · {company.state}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-all group-hover:translate-x-0.5 shrink-0 mt-1" />
                        </div>

                        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between gap-2">
                          <CivicFootprintBadge score={company.civicFootprintScore} size="sm" />
                          <span className="text-[11px] text-muted-foreground font-data tabular-nums">
                            {company.totalPacSpending > 0 ? formatCurrency(company.totalPacSpending) : "No PAC"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}

        {!isLoading && filtered.length === 0 && (
          <EmptyState icon={Building2} title="No companies match" description="Try adjusting your search or industry filter." />
        )}
      </div>
    </div>
  );
}
