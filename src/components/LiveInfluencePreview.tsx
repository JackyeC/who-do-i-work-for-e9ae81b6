import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Network, Landmark, ArrowRight, TrendingUp, Building2, Activity, Search, Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/sampleData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { InfluenceScore, calculateInfluenceScore } from "@/components/InfluenceScore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

async function fetchCompanyIntelligence(companyId: string) {
  const [execRes, rdRes, taRes] = await Promise.all([
    supabase.from("company_executives").select("total_donations").eq("company_id", companyId),
    supabase.from("company_revolving_door").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("company_board_affiliations").select("id", { count: "exact", head: true }).eq("company_id", companyId),
  ]);

  const executiveDonations = (execRes.data || []).reduce((sum, e) => sum + (e.total_donations || 0), 0);
  const revolvingDoorCount = rdRes.count || 0;
  const tradeAssociationCount = taRes.count || 0;

  return { executiveDonations, revolvingDoorCount, tradeAssociationCount };
}

export function LiveInfluencePreview() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Featured company: Koch Industries (highest PAC spending)
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["featured-company-intelligence"],
    queryFn: async () => {
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, slug, total_pac_spending, lobbying_spend, government_contracts, industry")
        .order("total_pac_spending", { ascending: false })
        .limit(1);

      if (!companies?.length) return null;
      const company = companies[0];
      const extra = await fetchCompanyIntelligence(company.id);

      const influenceScore = calculateInfluenceScore({
        totalPacSpending: company.total_pac_spending,
        lobbyingSpend: company.lobbying_spend || 0,
        governmentContracts: company.government_contracts || 0,
        ...extra,
      });

      return { ...company, ...extra, influenceScore };
    },
    staleTime: 10 * 60 * 1000,
  });

  // Searched company data
  const { data: searchedData, isLoading: searchLoading } = useQuery({
    queryKey: ["searched-company-intelligence", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, slug, total_pac_spending, lobbying_spend, government_contracts, industry")
        .eq("id", selectedCompanyId)
        .single();

      if (!companies) return null;
      const extra = await fetchCompanyIntelligence(companies.id);

      const influenceScore = calculateInfluenceScore({
        totalPacSpending: companies.total_pac_spending,
        lobbyingSpend: companies.lobbying_spend || 0,
        governmentContracts: companies.government_contracts || 0,
        ...extra,
      });

      return { ...companies, ...extra, influenceScore };
    },
    enabled: !!selectedCompanyId,
    staleTime: 5 * 60 * 1000,
  });

  // Search results dropdown
  const { data: searchResults } = useQuery({
    queryKey: ["dashboard-search", searchQuery],
    queryFn: async () => {
      if (searchQuery.trim().length < 2) return [];
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry")
        .ilike("name", `%${searchQuery.trim()}%`)
        .limit(5);
      return data || [];
    },
    enabled: searchQuery.trim().length >= 2,
    staleTime: 30 * 1000,
  });

  const isExample = !selectedCompanyId;
  const activeData = selectedCompanyId ? searchedData : featuredData;
  const isLoading = selectedCompanyId ? searchLoading : featuredLoading;

  if (isLoading && !activeData) {
    return (
      <section className="section-padding">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!activeData) return null;

  const moneyIn = (activeData.total_pac_spending || 0) + (activeData.lobbying_spend || 0) + (activeData.executiveDonations || 0);
  const networkConnections = activeData.revolvingDoorCount + activeData.tradeAssociationCount;

  const cards = [
    {
      icon: TrendingUp,
      label: "Influence Score",
      value: activeData.influenceScore.toString(),
      suffix: "/ 100",
      detail: "Composite score based on PAC spending, lobbying, contracts, and network connections",
      color: "text-primary",
      bgColor: "bg-primary/[0.06] border-primary/[0.12]",
      iconBg: "bg-primary/10",
    },
    {
      icon: DollarSign,
      label: "Money In",
      value: formatCurrency(moneyIn),
      suffix: "",
      detail: `PAC: ${formatCurrency(activeData.total_pac_spending || 0)} · Lobbying: ${formatCurrency(activeData.lobbying_spend || 0)} · Executive: ${formatCurrency(activeData.executiveDonations || 0)}`,
      color: "text-civic-gold",
      bgColor: "bg-civic-gold/[0.06] border-civic-gold/[0.12]",
      iconBg: "bg-civic-gold/10",
    },
    {
      icon: Network,
      label: "Influence Network",
      value: networkConnections.toLocaleString(),
      suffix: "connections",
      detail: "Revolving door personnel, trade associations, and executive affiliations",
      color: "text-primary",
      bgColor: "bg-primary/[0.06] border-primary/[0.12]",
      iconBg: "bg-primary/10",
    },
    {
      icon: Landmark,
      label: "Benefits Out",
      value: activeData.government_contracts ? formatCurrency(activeData.government_contracts) : "$0",
      suffix: "",
      detail: "Government contracts, grants, and subsidies awarded",
      color: "text-[hsl(var(--civic-green))]",
      bgColor: "bg-[hsl(var(--civic-green))]/[0.06] border-[hsl(var(--civic-green))]/[0.12]",
      iconBg: "bg-[hsl(var(--civic-green))]/10",
    },
  ];

  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
            <div className="gold-line w-16 mx-auto mb-8" />
            <h2 className="text-headline text-foreground mb-3 font-display">
              {isExample ? "Example Company Intelligence" : "Company Intelligence"}
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              {isExample ? (
                <>
                  Live data from <span className="font-semibold text-foreground">{activeData.name}</span> — search any company below to see its intelligence profile.
                </>
              ) : (
                <>
                  Intelligence profile for <span className="font-semibold text-foreground">{activeData.name}</span>
                </>
              )}
            </p>
          </motion.div>

          {/* Inline search */}
          <motion.div variants={fadeUp} custom={0.5} className="max-w-lg mx-auto mb-8 relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a company to see its intelligence..."
                className="pl-10 pr-10 h-11 rounded-xl bg-card border-border/60"
              />
              {selectedCompanyId && (
                <button
                  onClick={() => {
                    setSelectedCompanyId(null);
                    setSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            <AnimatePresence>
              {searchResults && searchResults.length > 0 && searchQuery.trim().length >= 2 && !selectedCompanyId && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-popover border border-border/60 rounded-xl shadow-lg overflow-hidden"
                >
                  {searchResults.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => {
                        setSelectedCompanyId(company.id);
                        setSearchQuery(company.name);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors text-sm"
                    >
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground">{company.name}</span>
                        {company.industry && (
                          <span className="text-xs text-muted-foreground ml-2">{company.industry}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Example badge */}
          {isExample && (
            <motion.div variants={fadeUp} custom={0.8} className="flex justify-center mb-5">
              <Badge variant="outline" className="gap-1.5 text-xs px-3 py-1 border-civic-gold/30 text-civic-gold">
                <Eye className="w-3 h-3" />
                Example — showing {activeData.name} ({activeData.industry})
              </Badge>
            </motion.div>
          )}

          {/* Cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeData.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {cards.map((card, i) => (
                <Tooltip key={card.label}>
                  <TooltipTrigger asChild>
                    <motion.div
                      variants={fadeUp}
                      custom={i + 1}
                      className={`rounded-2xl border p-6 ${card.bgColor} hover:shadow-elegant transition-all duration-300 cursor-default`}
                    >
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center border border-border/20`}>
                          <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {card.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl lg:text-3xl font-bold text-foreground font-display">
                          {card.value}
                        </p>
                        {card.suffix && (
                          <span className="text-xs text-muted-foreground font-medium">
                            {card.suffix}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    {card.detail}
                  </TooltipContent>
                </Tooltip>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <motion.div
            variants={fadeUp}
            custom={5}
            className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-card rounded-2xl border border-border/40 px-6 py-4"
          >
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Sourced from FEC filings, lobbying disclosures, USASpending.gov, and SEC EDGAR.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => navigate(`/dossier/${activeData.slug}`)}
              >
                <Building2 className="w-3.5 h-3.5" />
                {isExample ? "View Full Profile" : `View ${activeData.name}`}
              </Button>
              <Button
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => navigate("/check?tab=company")}
              >
                Deep Analysis <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
