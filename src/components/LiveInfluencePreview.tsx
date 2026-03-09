import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DollarSign, Network, Landmark, ArrowRight, TrendingUp, Building2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/sampleData";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export function LiveInfluencePreview() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["platform-aggregate-stats"],
    queryFn: async () => {
      // Aggregate across ALL companies in parallel
      const [
        companiesRes,
        pacRes,
        lobbyRes,
        contractsRes,
        execRes,
        revDoorRes,
        tradeRes,
        linkagesRes,
      ] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("total_pac_spending"),
        supabase.from("companies").select("lobbying_spend"),
        supabase.from("companies").select("government_contracts"),
        supabase.from("company_executives").select("total_donations"),
        supabase.from("company_revolving_door").select("id", { count: "exact", head: true }),
        supabase.from("company_board_affiliations").select("id", { count: "exact", head: true }),
        supabase.from("entity_linkages").select("id", { count: "exact", head: true }),
      ]);

      const totalPac = (pacRes.data || []).reduce((s, c) => s + (c.total_pac_spending || 0), 0);
      const totalLobbying = (lobbyRes.data || []).reduce((s, c) => s + (c.lobbying_spend || 0), 0);
      const totalContracts = (contractsRes.data || []).reduce((s, c) => s + (c.government_contracts || 0), 0);
      const totalExecDonations = (execRes.data || []).reduce((s, e) => s + (e.total_donations || 0), 0);

      const moneyIn = totalPac + totalLobbying + totalExecDonations;
      const networkConnections = (revDoorRes.count || 0) + (tradeRes.count || 0) + (linkagesRes.count || 0);

      // Simple influence score: log-scale composite
      const raw = Math.log10(Math.max(moneyIn, 1)) * 8 + Math.log10(Math.max(networkConnections, 1)) * 6 + Math.log10(Math.max(totalContracts, 1)) * 5;
      const influenceScore = Math.min(100, Math.round(raw));

      return {
        companyCount: companiesRes.count || 0,
        moneyIn,
        networkConnections,
        benefitsOut: totalContracts,
        influenceScore,
        totalPac,
        totalLobbying,
        totalExecDonations,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
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

  if (!data) return null;

  const cards = [
    {
      icon: TrendingUp,
      label: "Influence Score",
      value: data.influenceScore.toString(),
      suffix: "/ 100",
      detail: "Composite measure of political weight across all tracked companies",
      color: "text-primary",
      bgColor: "bg-primary/[0.06] border-primary/[0.12]",
      iconBg: "bg-primary/10",
    },
    {
      icon: DollarSign,
      label: "Money In",
      value: formatCurrency(data.moneyIn),
      suffix: "",
      detail: `PAC: ${formatCurrency(data.totalPac)} · Lobbying: ${formatCurrency(data.totalLobbying)} · Executive: ${formatCurrency(data.totalExecDonations)}`,
      color: "text-civic-gold",
      bgColor: "bg-civic-gold/[0.06] border-civic-gold/[0.12]",
      iconBg: "bg-civic-gold/10",
    },
    {
      icon: Network,
      label: "Influence Network",
      value: data.networkConnections.toLocaleString(),
      suffix: "connections",
      detail: "Executives, PACs, trade groups, lobbyists, and entity linkages tracked",
      color: "text-primary",
      bgColor: "bg-primary/[0.06] border-primary/[0.12]",
      iconBg: "bg-primary/10",
    },
    {
      icon: Landmark,
      label: "Benefits Out",
      value: formatCurrency(data.benefitsOut),
      suffix: "",
      detail: "Government contracts, grants, and subsidies across tracked companies",
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
          <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
            <div className="gold-line w-16 mx-auto mb-8" />
            <h2 className="text-headline text-foreground mb-3 font-display">
              Platform Intelligence Dashboard
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-xl mx-auto">
              Real-time aggregated data across{" "}
              <span className="font-semibold text-foreground">
                {data.companyCount.toLocaleString()} companies
              </span>{" "}
              from public filings.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          </div>

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
                onClick={() => navigate("/browse")}
              >
                <Building2 className="w-3.5 h-3.5" />
                Browse Companies
              </Button>
              <Button
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => navigate("/check?tab=company")}
              >
                Search Any Company <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
