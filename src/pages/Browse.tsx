import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { companies as sampleCompanies, formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Building2, ArrowRight, Search } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.03 } } },
  item: { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-10">
          <h1 className="text-headline text-foreground mb-2">Company Directory</h1>
          <p className="text-body text-muted-foreground">
            Browse {allCompanies.length.toLocaleString()} companies and their civic footprint profiles.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, industry, or state..."
            className="pl-11 h-11 rounded-xl"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Button
            variant={selectedIndustry === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedIndustry(null)}
          >
            All
          </Button>
          {allIndustries.map((ind) => (
            <Button
              key={ind}
              variant={selectedIndustry === ind ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedIndustry(ind)}
            >
              {ind}
            </Button>
          ))}
          <div className="ml-auto flex gap-1.5">
            <Button variant={sortBy === "score" ? "secondary" : "ghost"} size="sm" onClick={() => setSortBy("score")}>By Footprint</Button>
            <Button variant={sortBy === "name" ? "secondary" : "ghost"} size="sm" onClick={() => setSortBy("name")}>A-Z</Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading companies..." />
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((company) => (
              <motion.div key={company.slug} variants={stagger.item}>
                <Link to={`/company/${company.slug}`}>
                  <Card className="group hover:shadow-elevated transition-all duration-200 hover:border-primary/15 cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-muted-foreground/70" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {company.name}
                            </h3>
                            <p className="text-caption text-muted-foreground">
                              {company.industry} · {company.state}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-all group-hover:translate-x-0.5 shrink-0 mt-1" />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                        <CivicFootprintBadge score={company.civicFootprintScore} size="sm" />
                        <span className="text-micro text-muted-foreground">
                          {company.totalPacSpending > 0 ? `PAC: ${formatCurrency(company.totalPacSpending)}` : "No PAC spending"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!isLoading && filtered.length === 0 && (
          <EmptyState icon={Building2} title="No companies match" description="Try adjusting your search or industry filter." />
        )}
      </div>
      <Footer />
    </div>
  );
}
