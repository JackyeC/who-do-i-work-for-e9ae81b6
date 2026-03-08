import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompanyCard } from "@/components/CompanyCard";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { companies as sampleCompanies, industries as sampleIndustries, formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Building2, ArrowRight, Search } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";

export default function Browse() {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "score">("score");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch DB companies
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

  // Merge: DB companies + sample companies (for the 3 with rich detail)
  const allCompanies = useMemo(() => {
    const dbList = (dbCompanies || []).map((c) => ({
      id: c.slug,
      dbId: c.id,
      name: c.name,
      slug: c.slug,
      industry: c.industry,
      state: c.state,
      civicFootprintScore: c.civic_footprint_score,
      totalPacSpending: c.total_pac_spending,
      lobbyingSpend: c.lobbying_spend,
      revenue: c.revenue,
      employeeCount: c.employee_count,
      description: c.description,
      isDbOnly: true,
    }));

    // Add sample companies that aren't already in DB (by slug match)
    const dbSlugs = new Set(dbList.map((c) => c.slug));
    const sampleExtras = sampleCompanies
      .filter((c) => !dbSlugs.has(c.id))
      .map((c) => ({
        id: c.id,
        dbId: undefined,
        name: c.name,
        slug: c.id,
        industry: c.industry,
        state: c.state,
        civicFootprintScore: c.civicFootprintScore,
        totalPacSpending: c.totalPacSpending,
        lobbyingSpend: c.lobbyingSpend,
        revenue: c.revenue,
        employeeCount: c.employeeCount,
        description: c.description,
        isDbOnly: false,
      }));

    return [...dbList, ...sampleExtras];
  }, [dbCompanies]);

  // All unique industries
  const allIndustries = useMemo(() => {
    const set = new Set(allCompanies.map((c) => c.industry));
    return [...set].sort();
  }, [allCompanies]);

  // Filter and sort
  const filtered = useMemo(() => {
    let list = allCompanies;
    if (selectedIndustry) {
      list = list.filter((c) => c.industry === selectedIndustry);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) =>
      sortBy === "score"
        ? b.civicFootprintScore - a.civicFootprintScore
        : a.name.localeCompare(b.name)
    );
  }, [allCompanies, selectedIndustry, sortBy, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Company Directory</h1>
          <p className="text-muted-foreground">
            Browse {allCompanies.length} companies and their civic footprint profiles.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, industry, or state..."
            className="pl-10"
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
          <div className="ml-auto flex gap-2">
            <Button
              variant={sortBy === "score" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("score")}
            >
              By Footprint
            </Button>
            <Button
              variant={sortBy === "name" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("name")}
            >
              A-Z
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading companies..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((company, i) => (
              <motion.div
                key={company.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.5) }}
              >
                <Link to={`/company/${company.slug}`}>
                  <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/20 cursor-pointer">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {company.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {company.industry} · {company.state}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                        <CivicFootprintBadge score={company.civicFootprintScore} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {company.totalPacSpending > 0
                            ? `PAC: ${formatCurrency(company.totalPacSpending)}`
                            : "No PAC spending"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={Building2}
            title="No companies match"
            description="Try adjusting your search or industry filter."
          />
        )}
      </div>
      <Footer />
    </div>
  );
}
