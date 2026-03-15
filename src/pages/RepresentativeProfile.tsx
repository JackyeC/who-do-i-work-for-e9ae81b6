import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { formatCurrency } from "@/data/sampleData";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User, ArrowLeft, DollarSign, Building2, Flag,
  ExternalLink, TrendingUp, PieChart, Loader2, AlertTriangle
} from "lucide-react";

const partyMeta: Record<string, { label: string; color: string }> = {
  D: { label: "Democrat", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  R: { label: "Republican", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
  I: { label: "Independent", color: "bg-muted text-muted-foreground border-border" },
};

export default function RepresentativeProfile() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name || "");

  usePageSEO({
    title: `${decodedName} — Corporate Funding Profile`,
    description: `See which corporations fund ${decodedName}. PAC donations, flagged contributions, and industry breakdown — all from public records.`,
    path: `/representative/${name}`,
  });

  // Fetch all candidate records matching this name
  const { data: records, isLoading } = useQuery({
    queryKey: ["rep-profile", decodedName],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_candidates")
        .select("*, companies!inner(id, name, slug, industry, civic_footprint_score)")
        .ilike("name", decodedName)
        .order("amount", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!decodedName,
  });

  const profile = useMemo(() => {
    if (!records?.length) return null;

    const first = records[0];
    const totalFunding = records.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    const flaggedCount = records.filter((r: any) => r.flagged).length;
    const uniqueCompanies = new Map<string, any>();

    for (const r of records) {
      const company = r.companies;
      if (!company) continue;
      const existing = uniqueCompanies.get(company.id);
      if (existing) {
        existing.totalAmount += r.amount || 0;
        existing.donations.push(r);
      } else {
        uniqueCompanies.set(company.id, {
          id: company.id,
          name: company.name,
          slug: company.slug,
          industry: company.industry,
          score: company.civic_footprint_score,
          totalAmount: r.amount || 0,
          donations: [r],
        });
      }
    }

    const companiesByAmount = [...uniqueCompanies.values()].sort((a, b) => b.totalAmount - a.totalAmount);

    // Industry breakdown
    const industryMap = new Map<string, number>();
    for (const c of companiesByAmount) {
      const ind = c.industry || "Unknown";
      industryMap.set(ind, (industryMap.get(ind) || 0) + c.totalAmount);
    }
    const industries = [...industryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([industry, amount]) => ({ industry, amount, pct: Math.round((amount / totalFunding) * 100) }));

    return {
      name: first.name,
      party: first.party,
      state: first.state,
      district: first.district,
      totalFunding,
      flaggedCount,
      companies: companiesByAmount,
      industries,
      donationCount: records.length,
    };
  }, [records]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Representative Not Found</h1>
        <p className="text-muted-foreground mb-6">No corporate funding data found for "{decodedName}" in our database.</p>
        <Link to="/voter-lookup" className="text-primary hover:underline text-sm font-medium">
          ← Back to Voter Lookup
        </Link>
      </div>
    );
  }

  const pm = partyMeta[profile.party] || partyMeta.I;

  return (
    <div className="flex flex-col bg-background min-h-0 flex-1">
      <div className="container mx-auto px-4 py-8 flex-1">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          {/* Back */}
          <Link to="/voter-lookup" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Voter Lookup
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  {profile.name}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {profile.state}{profile.district ? ` — District ${profile.district}` : ""}
                </p>
              </div>
              <Badge variant="outline" className={`text-sm px-3 py-1 ${pm.color}`}>
                {pm.label}
              </Badge>
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Total Corporate Funding", value: formatCurrency(profile.totalFunding), icon: DollarSign },
              { label: "Corporate Donors", value: profile.companies.length.toString(), icon: Building2 },
              { label: "Total Donations", value: profile.donationCount.toString(), icon: TrendingUp },
              { label: "Flagged Donations", value: profile.flaggedCount.toString(), icon: AlertTriangle },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-4 h-4 text-primary" />
                    <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{stat.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Industry breakdown */}
          {profile.industries.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  Funding by Industry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile.industries.map((ind) => (
                    <div key={ind.industry} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{ind.industry}</span>
                          <span className="text-sm text-muted-foreground">{formatCurrency(ind.amount)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${ind.pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground w-10 text-right">{ind.pct}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Corporate funders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Corporate Funders ({profile.companies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.companies.map((company) => (
                  <Link
                    key={company.id}
                    to={`/company/${company.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">{company.name}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{company.industry}</span>
                          <span>•</span>
                          <span>Score: {company.score}/100</span>
                          <span>•</span>
                          <span>{company.donations.length} donation{company.donations.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-foreground">{formatCurrency(company.totalAmount)}</span>
                      {company.donations.some((d: any) => d.flagged) && (
                        <div className="flex items-center gap-1 text-xs text-destructive mt-0.5 justify-end">
                          <Flag className="w-3 h-3" />
                          Flagged
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data source note */}
          <p className="text-center text-[10px] text-muted-foreground/60 font-mono mt-8">
            Data sourced from FEC filings and public records · Corporate Character Scores powered by verified intelligence
          </p>
        </motion.div>
      </div>
    </div>
  );
}
