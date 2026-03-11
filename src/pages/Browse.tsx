import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { companies as sampleCompanies, formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Building2, ArrowRight, Search, TrendingUp, SortAsc, ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
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

export default function Browse() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
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
    if (selectedIndustry !== "all") list = list.filter((c) => c.industry === selectedIndustry);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => sortBy === "score" ? b.civicFootprintScore - a.civicFootprintScore : a.name.localeCompare(b.name));
  }, [allCompanies, selectedIndustry, sortBy, searchQuery]);

  return (
    <div className="flex-1">
      {/* Compact header */}
      <div className="border-b border-border/40 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Employer Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allCompanies.length} companies tracked
          </p>
        </div>
      </div>

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
              Score
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

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-3">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {selectedIndustry !== "all" && <> in <span className="text-foreground font-medium">{selectedIndustry}</span></>}
        </p>

        {/* Grid */}
        {isLoading ? (
          <LoadingState message="Loading companies…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Building2} title="No companies match" description="Try adjusting your search or filter." />
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
          >
            {filtered.map((company) => (
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
      </div>
    </div>
  );
}
