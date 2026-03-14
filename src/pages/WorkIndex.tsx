import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Users, DollarSign, Shield, BarChart3, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MarketStat {
  label: string;
  value: string;
  trend: "up" | "down" | "flat";
  detail: string;
}

export default function WorkIndex() {
  const { data: warnStats } = useQuery({
    queryKey: ["work-index-warn"],
    queryFn: async () => {
      const { count } = await supabase
        .from("company_warn_notices")
        .select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: companyCount } = useQuery({
    queryKey: ["work-index-companies"],
    queryFn: async () => {
      const { count } = await supabase
        .from("companies")
        .select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: aiHrCount } = useQuery({
    queryKey: ["work-index-ai-hr"],
    queryFn: async () => {
      const { count } = await supabase
        .from("ai_hr_signals")
        .select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: benefitCount } = useQuery({
    queryKey: ["work-index-benefits"],
    queryFn: async () => {
      const { count } = await supabase
        .from("worker_benefit_signals")
        .select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const stats: MarketStat[] = [
    { label: "Companies Tracked", value: companyCount?.toLocaleString() || "—", trend: "up", detail: "Total companies with intelligence profiles" },
    { label: "WARN Notices Filed", value: warnStats?.toLocaleString() || "—", trend: "down", detail: "Layoff notices tracked across all companies" },
    { label: "AI Hiring Tools Detected", value: aiHrCount?.toLocaleString() || "—", trend: "up", detail: "AI/ML hiring vendors identified in recruiting" },
    { label: "Worker Benefit Signals", value: benefitCount?.toLocaleString() || "—", trend: "flat", detail: "Benefits disclosures tracked" },
  ];

  const trendIcon = (trend: "up" | "down" | "flat") => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-[hsl(var(--civic-green))]" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">The Work Index</h1>
            <p className="text-sm text-muted-foreground">Market-wide workforce intelligence — updated weekly</p>
          </div>
        </div>

        <p className="text-base text-foreground/80 leading-relaxed max-w-2xl">
          Tracking layoffs, hiring, promotion mobility, and recruiting transparency across the entire market.
          The first real-time index of how companies treat workers — based on public data signals, not employer marketing.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Card className="hover:border-primary/20 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</span>
                  {trendIcon(stat.trend)}
                </div>
                <p className="text-3xl font-bold text-foreground tabular-nums font-display">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.detail}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Index Categories */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Layoff Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Companies with recent WARN Act filings and workforce reduction signals.</p>
            <Badge variant="outline" className="text-xs">Data sourced from federal & state WARN filings</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-[hsl(var(--civic-green))]" />
              Hiring Momentum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Companies actively expanding their workforce — sales, engineering, and leadership hiring trends.</p>
            <Badge variant="outline" className="text-xs">Based on job posting patterns and career page signals</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-[hsl(var(--civic-blue))]" />
              Promotion Mobility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Which companies promote from within vs. hire externally — career growth intelligence.</p>
            <Badge variant="outline" className="text-xs">Promotion Velocity Score™ across tracked companies</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-5 h-5 text-primary" />
              Recruiting Transparency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">How transparent companies are about their recruiting process — salary disclosure, AI tools, and candidate experience.</p>
            <Badge variant="outline" className="text-xs">Recruiter Reality Score™ market averages</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          The Work Index tracks observable signals from public data — not employer marketing claims.
          Data updated weekly from federal filings, job postings, and corporate disclosures.
        </p>
      </div>
    </div>
  );
}
