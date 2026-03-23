import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SignalsThisWeek } from "@/components/intelligence/SignalsThisWeek";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import {
  FileText, Search, Calendar, ArrowRight, Sparkles,
  Filter, Shield, Loader2, ExternalLink, DollarSign, Landmark, Building2,
  TrendingUp, AlertTriangle, Hash, Users
} from "lucide-react";

const ISSUE_OPTIONS = [
  "gun_policy", "reproductive_rights", "labor_rights", "climate",
  "civil_rights", "lgbtq_rights", "voting_rights", "immigration",
  "education", "healthcare", "consumer_protection",
];

const ISSUE_COLORS: Record<string, string> = {
  climate: "hsl(var(--chart-1))",
  labor_rights: "hsl(var(--chart-2))",
  immigration: "hsl(var(--chart-3))",
  gun_policy: "hsl(var(--chart-4))",
  civil_rights: "hsl(var(--chart-5))",
  reproductive_rights: "hsl(var(--chart-1))",
  lgbtq_rights: "hsl(var(--chart-2))",
  voting_rights: "hsl(var(--chart-3))",
  education: "hsl(var(--chart-4))",
  healthcare: "hsl(var(--chart-5))",
  consumer_protection: "hsl(var(--chart-1))",
};

const SOURCE_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  campaign_finance: { label: "FEC Filing", icon: DollarSign },
  fec_direct: { label: "FEC Filing", icon: DollarSign },
  congress_legislation: { label: "Congress.gov", icon: Landmark },
  lobbying_disclosure: { label: "Senate LDA", icon: FileText },
  government_contract: { label: "USASpending", icon: Building2 },
  ideology_scan: { label: "Ideology Scan", icon: Shield },
  known_corporate_actions: { label: "Public Record", icon: FileText },
  public_stance_analysis: { label: "Public Stance", icon: FileText },
  company_signal_scan: { label: "Signal Scan", icon: Shield },
  company_profile: { label: "Company Snapshot", icon: Building2 },
  entity_linkage: { label: "Entity Linkage", icon: FileText },
  issue_legislation_map: { label: "Legislation Link", icon: Landmark },
};

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function IntelligenceReports() {
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get("type");
  const isSignalsView = urlType === "weekly_brief";

  const [searchText, setSearchText] = useState("");
  const [issueFilter, setIssueFilter] = useState("all");

  // Fetch ALL issue signals (up to 1000) for analytics
  const { data: allSignals, isLoading } = useQuery({
    queryKey: ["evidence-receipts-all"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("issue_signals")
        .select("id, entity_id, entity_name_snapshot, issue_category, signal_type, signal_subtype, source_dataset, description, source_url, confidence_score, amount, transaction_date, created_at")
        .in("confidence_score", ["high", "medium"])
        .order("created_at", { ascending: false })
        .limit(1000);
      return (data || []) as any[];
    },
  });

  // Analytics computations
  const analytics = useMemo(() => {
    if (!allSignals?.length) return null;

    const totalSignals = allSignals.length;
    const totalAmount = allSignals.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
    const uniqueCompanies = new Set(allSignals.map((s: any) => s.entity_id)).size;
    const highConfidence = allSignals.filter((s: any) => s.confidence_score === "high").length;

    // Spending by issue
    const byIssue: Record<string, { count: number; amount: number }> = {};
    allSignals.forEach((s: any) => {
      const cat = s.issue_category || "uncategorized";
      if (!byIssue[cat]) byIssue[cat] = { count: 0, amount: 0 };
      byIssue[cat].count++;
      byIssue[cat].amount += Number(s.amount) || 0;
    });

    const issueChartData = Object.entries(byIssue)
      .map(([key, val]) => ({
        name: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        key,
        amount: val.amount,
        count: val.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Top spenders (companies)
    const byCompany: Record<string, { name: string; amount: number; count: number; entityId: string }> = {};
    allSignals.forEach((s: any) => {
      const name = s.entity_name_snapshot || "Unknown";
      if (!byCompany[name]) byCompany[name] = { name, amount: 0, count: 0, entityId: s.entity_id };
      byCompany[name].amount += Number(s.amount) || 0;
      byCompany[name].count++;
    });

    const topSpenders = Object.values(byCompany)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Source breakdown (pie)
    const bySource: Record<string, number> = {};
    allSignals.forEach((s: any) => {
      const src = s.source_dataset || "unknown";
      bySource[src] = (bySource[src] || 0) + 1;
    });

    const sourceData = Object.entries(bySource)
      .map(([key, count]) => ({
        name: SOURCE_LABELS[key]?.label || key.replace(/_/g, " "),
        value: count,
      }))
      .sort((a, b) => b.value - a.value);

    return { totalSignals, totalAmount, uniqueCompanies, highConfidence, issueChartData, topSpenders, sourceData };
  }, [allSignals]);

  // Filtered signals for the list
  const filteredSignals = useMemo(() => {
    if (!allSignals) return [];
    return allSignals.filter((s: any) => {
      if (issueFilter !== "all" && s.issue_category !== issueFilter) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        return s.description?.toLowerCase().includes(q) || s.entity_name_snapshot?.toLowerCase().includes(q);
      }
      return true;
    }).slice(0, 50);
  }, [allSignals, issueFilter, searchText]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/3" />
          <div className="container mx-auto px-4 py-16 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="w-3 h-3" /> {isSignalsView ? "Employer Reality Signals" : "Investigative Intelligence"}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4">
                {isSignalsView ? "Employer Signals This Week" : "Evidence Receipts"}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {isSignalsView
                  ? "Employer reality signals auto-detected from public filings, federal databases, and verified web sources."
                  : "Cross-company analytics on campaign finance, lobbying, and government contract signals — every receipt links to the original filing."}
              </p>
            </div>
          </div>
        </section>

        {isSignalsView ? (
          <section className="container mx-auto px-4 py-8">
            <SignalsThisWeek />
          </section>
        ) : (
          <section className="container mx-auto px-4 py-8 space-y-8">
            {isLoading ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              </div>
            ) : !analytics ? (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No evidence receipts yet</h3>
                <p className="text-sm text-muted-foreground">
                  Evidence receipts will appear here as companies are scanned.
                </p>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Hash className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-2xl font-bold text-foreground">{analytics.totalSignals.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Signals</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(analytics.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">Total $ Tracked</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-2xl font-bold text-foreground">{analytics.uniqueCompanies}</p>
                      <p className="text-xs text-muted-foreground">Companies</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-2xl font-bold text-foreground">{analytics.highConfidence}</p>
                      <p className="text-xs text-muted-foreground">Strong Evidence</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts row */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Spending by issue */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Spending by Issue Area
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={analytics.issueChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                          <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} />
                          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                          <RechartsTooltip
                            formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                          />
                          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                            {analytics.issueChartData.map((entry, i) => (
                              <Cell key={i} fill={ISSUE_COLORS[entry.key] || "hsl(var(--primary))"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top spenders */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        Top Companies by Signal Volume
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[280px] overflow-y-auto">
                        {analytics.topSpenders.map((company, i) => {
                          const slug = company.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
                          return (
                            <Link
                              key={i}
                              to={`/dossier/${slug}`}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                                <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                  {company.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <Badge variant="outline" className="text-xs">{company.count} signals</Badge>
                                {company.amount > 0 && (
                                  <span className="text-xs font-bold text-primary">{formatCurrency(company.amount)}</span>
                                )}
                                <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Source breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Signal Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {analytics.sourceData.map((src, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/30">
                          <span className="text-sm font-medium text-foreground">{src.name}</span>
                          <Badge variant="secondary" className="text-xs">{src.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Signal list */}
                <div>
                  <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-3xl">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search all signals..." className="pl-10" />
                    </div>
                    <Select value={issueFilter} onValueChange={setIssueFilter}>
                      <SelectTrigger className="w-[180px]"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Issue Area" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Issues</SelectItem>
                        {ISSUE_OPTIONS.map(i => <SelectItem key={i} value={i}>{i.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4" /> Recent Signals ({filteredSignals.length})
                  </h2>

                  {filteredSignals.length === 0 ? (
                    <div className="text-center py-10">
                      <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No signals match your filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-3xl">
                      {filteredSignals.map((s: any) => {
                        const sourceInfo = SOURCE_LABELS[s.source_dataset] || { label: s.source_dataset, icon: FileText };
                        const SourceIcon = sourceInfo.icon;
                        return (
                          <Card key={s.id} className="hover:border-primary/20 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <SourceIcon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Badge variant="outline" className="text-xs capitalize">{s.issue_category?.replace(/_/g, " ")}</Badge>
                                    <Badge variant="secondary" className="text-xs">{sourceInfo.label}</Badge>
                                    <Badge variant={s.confidence_score === "high" ? "default" : "outline"} className="text-xs">
                                      {s.confidence_score === "high" ? "Strong Evidence" : "Some Evidence"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm font-medium text-foreground">
                                    {s.entity_name_snapshot && s.entity_id ? (
                                      <Link to={`/dossier/${s.entity_name_snapshot.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`} className="text-primary hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>
                                        {s.entity_name_snapshot}
                                      </Link>
                                    ) : s.entity_name_snapshot ? (
                                      <span className="text-primary">{s.entity_name_snapshot}</span>
                                    ) : null}
                                    {s.entity_name_snapshot && ": "}
                                    {s.description}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    {s.amount && (
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        ${Number(s.amount).toLocaleString()}
                                      </span>
                                    )}
                                    {s.source_url && /^https?:\/\//.test(s.source_url) && (
                                      <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                        <ExternalLink className="w-3 h-3" />
                                        View Receipt
                                      </a>
                                    )}
                                    {s.created_at && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(s.created_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
