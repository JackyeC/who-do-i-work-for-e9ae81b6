import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Crosshair, Heart, Hammer, Leaf, Scale, Rainbow, Vote,
  Globe, BookOpen, Stethoscope, ShoppingCart, ArrowRight, Building2,
  Sparkles, TrendingUp, AlertTriangle, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ISSUE_AREAS = [
  { key: "gun_policy", label: "Gun Policy", icon: Crosshair, description: "PAC donations, lobbying, and advocacy related to firearms legislation" },
  { key: "reproductive_rights", label: "Reproductive Rights", icon: Heart, description: "Political spending and advocacy on reproductive healthcare policy" },
  { key: "labor_rights", label: "Labor Rights", icon: Hammer, description: "Union activity, worker protections, wage policy spending" },
  { key: "climate", label: "Climate", icon: Leaf, description: "Environmental lobbying, fossil fuel ties, green policy advocacy" },
  { key: "civil_rights", label: "Civil Rights", icon: Scale, description: "DEI spending, civil liberties lobbying, discrimination-related signals" },
  { key: "lgbtq_rights", label: "LGBTQ+ Rights", icon: Rainbow, description: "Equality advocacy, anti-discrimination policy, related donations" },
  { key: "voting_rights", label: "Voting Rights", icon: Vote, description: "Election access, voter suppression, gerrymandering-related signals" },
  { key: "immigration", label: "Immigration", icon: Globe, description: "Immigration policy lobbying, enforcement contracts, advocacy" },
  { key: "education", label: "Education", icon: BookOpen, description: "Education policy spending, school choice, public funding signals" },
  { key: "healthcare", label: "Healthcare", icon: Stethoscope, description: "Healthcare lobbying, insurance policy, pharmaceutical spending" },
  { key: "consumer_protection", label: "Consumer Protection", icon: ShoppingCart, description: "Regulatory lobbying, product safety, consumer rights spending" },
] as const;

type IssueKey = typeof ISSUE_AREAS[number]["key"];

export default function ValuesSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedIssue = searchParams.get("issue") as IssueKey | null;
  const [textFilter, setTextFilter] = useState("");

  const { data: issueResults, isLoading } = useQuery({
    queryKey: ["values-search", selectedIssue],
    enabled: !!selectedIssue,
    queryFn: async () => {
      if (!selectedIssue) return [];

      const { data, error } = await supabase
        .from("values_check_signals" as any)
        .select("company_id, signal_title, signal_category, signal_description, amount, confidence_label, source_name, year")
        .eq("issue_area", selectedIssue)
        .order("confidence_score", { ascending: false })
        .limit(500);

      if (error) { console.error("Values search error:", error); return []; }
      return data || [];
    },
  });

  // Group signals by company, then fetch company details
  const companyIds = useMemo(() => {
    if (!issueResults) return [];
    const ids = new Set<string>();
    for (const r of issueResults as any[]) ids.add(r.company_id);
    return Array.from(ids);
  }, [issueResults]);

  const { data: companies } = useQuery({
    queryKey: ["values-search-companies", companyIds],
    enabled: companyIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state, total_pac_spending")
        .in("id", companyIds);
      return data || [];
    },
  });

  // Build company → signals map
  const companySignals = useMemo(() => {
    if (!issueResults || !companies) return [];
    const map = new Map<string, { company: any; signals: any[] }>();

    for (const company of companies as any[]) {
      map.set(company.id, { company, signals: [] });
    }
    for (const signal of issueResults as any[]) {
      const entry = map.get(signal.company_id);
      if (entry) entry.signals.push(signal);
    }

    let results = Array.from(map.values())
      .filter(e => e.signals.length > 0)
      .sort((a, b) => b.signals.length - a.signals.length);

    if (textFilter.trim()) {
      const q = textFilter.toLowerCase();
      results = results.filter(e =>
        e.company.name?.toLowerCase().includes(q) ||
        e.company.industry?.toLowerCase().includes(q)
      );
    }

    return results;
  }, [issueResults, companies, textFilter]);

  const issueInfo = ISSUE_AREAS.find(i => i.key === selectedIssue);

  // Count signals per issue for the overview
  const { data: issueCounts } = useQuery({
    queryKey: ["values-issue-counts"],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const issue of ISSUE_AREAS) {
        const { count } = await supabase
          .from("values_check_signals" as any)
          .select("id", { count: "exact", head: true })
          .eq("issue_area", issue.key);
        counts[issue.key] = count || 0;
      }
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
          <div className="container mx-auto px-4 py-16 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="w-3 h-3" />
                Values-Based Company Search
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4">
                Search by What Matters to You
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Find companies with political spending, lobbying, or advocacy signals
                related to the issues you care about — before you apply, invest, or support.
              </p>
            </div>
          </div>
        </section>

        {/* Issue Grid */}
        <section className="container mx-auto px-4 py-12">
          {!selectedIssue ? (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-2">Choose an issue area</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Select a policy topic to see which companies have related political signals in our database.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ISSUE_AREAS.map((issue) => {
                  const Icon = issue.icon;
                  const count = issueCounts?.[issue.key] || 0;
                  return (
                    <motion.button
                      key={issue.key}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSearchParams({ issue: issue.key })}
                      className="text-left p-5 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm mb-1">{issue.label}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{issue.description}</p>
                          {count > 0 && (
                            <p className="text-xs text-primary font-medium mt-2">
                              {count} signal{count !== 1 ? "s" : ""} across companies
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Selected issue results */}
              <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
                  ← All Issues
                </Button>
                <Separator orientation="vertical" className="h-5" />
                {issueInfo && (
                  <div className="flex items-center gap-2">
                    <issueInfo.icon className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">{issueInfo.label}</h2>
                  </div>
                )}
              </div>

              {issueInfo && (
                <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                  {issueInfo.description}. Companies listed below have public records — campaign donations,
                  lobbying filings, or advocacy signals — connected to this issue area.
                </p>
              )}

              {/* Filter within results */}
              <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={textFilter}
                  onChange={(e) => setTextFilter(e.target.value)}
                  placeholder="Filter companies by name or industry..."
                  className="pl-10"
                />
              </div>

              {isLoading ? (
                <div className="text-center py-16">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Searching signals...</p>
                </div>
              ) : companySignals.length === 0 ? (
                <div className="text-center py-16">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No signals found for {issueInfo?.label}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                    We haven't detected public signals related to this issue yet.
                    As more companies are scanned, results will appear here.
                  </p>
                  <Button variant="outline" onClick={() => setSearchParams({})}>
                    Browse other issues
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {companySignals.length} compan{companySignals.length !== 1 ? "ies" : "y"} with {issueInfo?.label} signals
                  </p>

                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {companySignals.map(({ company, signals }) => (
                        <motion.div
                          key={company.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          layout
                        >
                          <Card className="overflow-hidden hover:border-primary/30 transition-colors">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                  <Link
                                    to={`/company/${company.slug}`}
                                    className="text-base font-semibold text-foreground hover:text-primary transition-colors"
                                  >
                                    {company.name}
                                  </Link>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {company.industry} · {company.state}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant="secondary" className="text-xs">
                                    {signals.length} signal{signals.length !== 1 ? "s" : ""}
                                  </Badge>
                                  <Link to={`/company/${company.slug}`}>
                                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                      View Profile <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {signals.slice(0, 3).map((signal: any, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-foreground font-medium">{signal.signal_title}</span>
                                      {signal.amount && (
                                        <span className="text-primary font-semibold ml-1.5">
                                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(signal.amount)}
                                        </span>
                                      )}
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground">{signal.source_name}</span>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                          {signal.confidence_label}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {signals.length > 3 && (
                                  <Link
                                    to={`/company/${company.slug}`}
                                    className="text-xs text-primary hover:underline ml-5"
                                  >
                                    +{signals.length - 3} more signals →
                                  </Link>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-border/30 bg-muted/20">
          <div className="container mx-auto px-4 py-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Don't see the company you're looking for?
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Search any company by name and we'll automatically scan public records for political signals.
            </p>
            <Link to="/search-your-employer">
              <Button className="gap-2">
                <Search className="w-4 h-4" />
                Search by Company Name
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
