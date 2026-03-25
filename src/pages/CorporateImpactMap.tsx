import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Building2, Shield, Factory, Scale, Leaf, Crosshair,
  Users, AlertTriangle, TrendingUp, ExternalLink, ChevronRight,
  BarChart3, Globe, FileText, ArrowRight, Loader2, Heart, ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SignalSourceLink } from "@/components/SignalSourceLink";

// ─── Types ───

interface SignalSummary {
  category: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  count: number;
  topSignals: { type: string; description: string; source: string; confidence: string }[];
  sources: string[];
}

interface CompanyImpact {
  id: string;
  name: string;
  slug: string;
  industry: string;
  signals: SignalSummary[];
  totalSignals: number;
}

// ─── Constants ───

const IMPACT_CATEGORIES = [
  { key: "labor_rights", label: "Labor Rights", icon: Factory, color: "text-civic-yellow", bgColor: "bg-civic-yellow/10", borderColor: "border-civic-yellow/20", table: "issue_signals", filter: "labor" },
  { key: "immigration", label: "Immigration", icon: Globe, color: "text-civic-blue", bgColor: "bg-civic-blue/10", borderColor: "border-civic-blue/20", table: "issue_signals", filter: "immigration" },
  { key: "climate", label: "Climate", icon: Leaf, color: "text-civic-green", bgColor: "bg-civic-green/10", borderColor: "border-civic-green/20", table: "climate_signals", filter: null },
  { key: "gun_policy", label: "Gun Policy", icon: Crosshair, color: "text-civic-red", bgColor: "bg-civic-red/10", borderColor: "border-civic-red/20", table: "gun_policy_signals", filter: null },
  { key: "civil_rights", label: "Civil Rights", icon: Scale, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20", table: "civil_rights_signals", filter: null },
  { key: "healthcare", label: "Healthcare", icon: Heart, color: "text-pink-400", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/20", table: "healthcare_signals", filter: null },
  { key: "consumer_protection", label: "Consumer Protection", icon: ShieldAlert, color: "text-civic-yellow", bgColor: "bg-civic-yellow/10", borderColor: "border-civic-yellow/20", table: "consumer_protection_signals", filter: null },
];

const FEATURED_COMPANIES = [
  "Amazon", "Tesla", "Starbucks", "ExxonMobil", "Walmart",
  "Google", "Microsoft", "Goldman Sachs", "Tyson Foods",
  "Smith & Wesson Brands", "Dick's Sporting Goods", "Nike",
  "UnitedHealth Group", "CVS Health", "Pfizer", "Apple",
  "Wells Fargo", "Meta Platforms", "Equifax", "JPMorgan Chase",
];

// ─── Main Component ───

export default function CorporateImpactMap() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyImpact[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [globalStats, setGlobalStats] = useState({ totalSignals: 0, totalCompanies: 0, categories: {} as Record<string, number> });

  // Load featured companies with signal counts
  useEffect(() => {
    loadFeaturedCompanies();
  }, []);

  async function loadFeaturedCompanies() {
    setLoading(true);
    try {
      // Get featured companies
      const { data: companiesData } = await supabase
        .from("companies")
        .select("id, name, slug, industry")
        .in("name", FEATURED_COMPANIES)
        .limit(20);

      if (!companiesData?.length) {
        setLoading(false);
        return;
      }

      const companyIds = companiesData.map(c => c.id);
      const impactData: CompanyImpact[] = [];
      const catCounts: Record<string, number> = {};

      for (const company of companiesData) {
        const signals: SignalSummary[] = [];

        // Fetch issue_signals (labor + immigration)
        const { data: issueSignals } = await supabase
          .from("issue_signals")
          .select("issue_category, signal_type, description, source_dataset, confidence_score")
          .eq("entity_id", company.id)
          .limit(50) as { data: any[] | null };

        // Fetch climate_signals
        const { data: climateSignals } = await supabase
          .from("climate_signals")
          .select("signal_type, description, source_name, confidence")
          .eq("company_id", company.id)
          .limit(20) as { data: any[] | null };

        // Fetch gun_policy_signals
        const { data: gunSignals } = await supabase
          .from("gun_policy_signals")
          .select("signal_type, description, source_name, confidence")
          .eq("company_id", company.id)
          .limit(20) as { data: any[] | null };

        // Fetch civil_rights_signals
        const { data: civilRightsSignals } = await supabase
          .from("civil_rights_signals")
          .select("signal_type, description, source_name, confidence")
          .eq("company_id", company.id)
          .limit(20) as { data: any[] | null };

        // Fetch healthcare_signals
        const { data: healthcareSignals } = await supabase
          .from("healthcare_signals")
          .select("signal_type, description, source_name, confidence")
          .eq("company_id", company.id)
          .limit(20) as { data: any[] | null };

        // Fetch consumer_protection_signals
        const { data: consumerSignals } = await supabase
          .from("consumer_protection_signals")
          .select("signal_type, description, source_name, confidence")
          .eq("company_id", company.id)
          .limit(20) as { data: any[] | null };

        // Build summaries per category
        for (const cat of IMPACT_CATEGORIES) {
          let count = 0;
          let topSignals: any[] = [];
          let sources = new Set<string>();

          if (cat.key === "labor_rights") {
            const labor = (issueSignals || []).filter((s: any) => s.issue_category === "labor");
            count = labor.length;
            topSignals = labor.slice(0, 3).map((s: any) => ({ type: s.signal_type, description: s.description, source: s.source_dataset, confidence: s.confidence_score }));
            labor.forEach((s: any) => sources.add(s.source_dataset || ""));
          } else if (cat.key === "immigration") {
            const imm = (issueSignals || []).filter((s: any) => s.issue_category === "immigration");
            count = imm.length;
            topSignals = imm.slice(0, 3).map((s: any) => ({ type: s.signal_type, description: s.description, source: s.source_dataset, confidence: s.confidence_score }));
            imm.forEach((s: any) => sources.add(s.source_dataset || ""));
          } else if (cat.key === "climate") {
            count = (climateSignals || []).length;
            topSignals = (climateSignals || []).slice(0, 3).map(s => ({ type: s.signal_type, description: s.description, source: s.source_name, confidence: s.confidence }));
            (climateSignals || []).forEach(s => sources.add(s.source_name || ""));
          } else if (cat.key === "gun_policy") {
            count = (gunSignals || []).length;
            topSignals = (gunSignals || []).slice(0, 3).map(s => ({ type: s.signal_type, description: s.description, source: s.source_name, confidence: s.confidence }));
            (gunSignals || []).forEach(s => sources.add(s.source_name || ""));
          } else if (cat.key === "civil_rights") {
            count = (civilRightsSignals || []).length;
            topSignals = (civilRightsSignals || []).slice(0, 3).map(s => ({ type: s.signal_type, description: s.description, source: s.source_name, confidence: s.confidence }));
            (civilRightsSignals || []).forEach(s => sources.add(s.source_name || ""));
          } else if (cat.key === "healthcare") {
            count = (healthcareSignals || []).length;
            topSignals = (healthcareSignals || []).slice(0, 3).map(s => ({ type: s.signal_type, description: s.description, source: s.source_name, confidence: s.confidence }));
            (healthcareSignals || []).forEach(s => sources.add(s.source_name || ""));
          } else if (cat.key === "consumer_protection") {
            count = (consumerSignals || []).length;
            topSignals = (consumerSignals || []).slice(0, 3).map(s => ({ type: s.signal_type, description: s.description, source: s.source_name, confidence: s.confidence }));
            (consumerSignals || []).forEach(s => sources.add(s.source_name || ""));
          }

          if (count > 0) {
            catCounts[cat.key] = (catCounts[cat.key] || 0) + count;
            signals.push({
              category: cat.key,
              label: cat.label,
              icon: cat.icon,
              color: cat.color,
              bgColor: cat.bgColor,
              borderColor: cat.borderColor,
              count,
              topSignals,
              sources: [...sources].filter(Boolean),
            });
          }
        }

        const totalSignals = signals.reduce((s, c) => s + c.count, 0);
        if (totalSignals > 0) {
          impactData.push({
            id: company.id,
            name: company.name,
            slug: company.slug,
            industry: company.industry,
            signals,
            totalSignals,
          });
        }
      }

      impactData.sort((a, b) => b.totalSignals - a.totalSignals);
      setCompanies(impactData);
      setGlobalStats({
        totalSignals: Object.values(catCounts).reduce((s, v) => s + v, 0),
        totalCompanies: impactData.length,
        categories: catCounts,
      });
    } catch (e) {
      console.error("[CorporateImpactMap] Error:", e);
    } finally {
      setLoading(false);
    }
  }

  // Search
  useEffect(() => {
    if (query.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug")
        .ilike("name", `%${query}%`)
        .limit(8);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredCompanies = activeCategory
    ? companies.filter(c => c.signals.some(s => s.category === activeCategory))
    : companies;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Corporate Impact Map
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl mt-1">
            Unified view of documented corporate activity across labor rights, immigration, climate, gun policy, and civil rights. Every signal is sourced from public records — no opinions, just receipts.
          </p>

          {/* Search */}
          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search any company..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-xl">
                {searchResults.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { navigate(`/company/${r.slug}`); setQuery(""); setSearchResults([]); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                  >
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {r.name}
                    <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Global Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          <Card
            className={cn(
              "cursor-pointer transition-all border",
              !activeCategory ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
            )}
            onClick={() => setActiveCategory(null)}
          >
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-foreground">{globalStats.totalSignals}</div>
              <div className="text-xs text-muted-foreground">All Signals</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-foreground">{globalStats.totalCompanies}</div>
              <div className="text-xs text-muted-foreground">Companies</div>
            </CardContent>
          </Card>
          {IMPACT_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = globalStats.categories[cat.key] || 0;
            return (
              <Card
                key={cat.key}
                className={cn(
                  "cursor-pointer transition-all border",
                  activeCategory === cat.key ? `${cat.borderColor} ${cat.bgColor}` : "border-border/50 hover:border-border"
                )}
                onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
              >
                <CardContent className="p-3 text-center">
                  <Icon className={cn("w-4 h-4 mx-auto mb-1", cat.color)} />
                  <div className="text-lg font-bold text-foreground">{count}</div>
                  <div className="text-xs text-muted-foreground">{cat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/30 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            All signals are documented from public government databases, court records, and regulatory filings. This is signal analysis, not legal advice. Users should interpret patterns independently.
            <a href="/methodology" className="text-primary hover:underline ml-1">View methodology →</a>
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Loading corporate impact data...</span>
          </div>
        )}

        {/* Company Cards */}
        {!loading && filteredCompanies.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No companies with {activeCategory ? IMPACT_CATEGORIES.find(c => c.key === activeCategory)?.label : ""} signals found.</p>
            <p className="text-xs mt-1">Run the seed functions to populate data.</p>
          </div>
        )}

        <div className="grid gap-4">
          {filteredCompanies.map(company => (
            <Card key={company.id} className="border-border/50 hover:border-border/80 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{company.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{company.industry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {company.totalSignals} signals
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/company/${company.slug}`)}
                      className="text-xs"
                    >
                      Full Profile <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {company.signals
                    .filter(s => !activeCategory || s.category === activeCategory)
                    .map(signal => {
                      const Icon = signal.icon;
                      return (
                        <div
                          key={signal.category}
                          className={cn(
                            "p-3 rounded-lg border",
                            signal.bgColor,
                            signal.borderColor
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={cn("w-4 h-4", signal.color)} />
                            <span className="text-xs font-medium text-foreground">{signal.label}</span>
                            <Badge variant="secondary" className="text-xs ml-auto px-1.5 py-0">
                              {signal.count}
                            </Badge>
                          </div>
                          {signal.topSignals.slice(0, 2).map((ts, i) => (
                            <div key={i} className="text-xs text-muted-foreground mb-1 line-clamp-2">
                              • {ts.description?.slice(0, 120) || ts.type}
                            </div>
                          ))}
                          {signal.sources.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {signal.sources.slice(0, 2).map((src, i) => (
                                <SignalSourceLink key={i} source={src} className="block" />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation to detailed views */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card
            className="border-border/50 hover:border-primary/30 cursor-pointer transition-all"
            onClick={() => navigate("/follow-the-money")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Influence Network Map</p>
                <p className="text-xs text-muted-foreground">Follow the money — PACs, lobbying, dark money</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="border-border/50 hover:border-primary/30 cursor-pointer transition-all"
            onClick={() => navigate("/eeoc-tracker")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-civic-yellow/10">
                <Scale className="w-5 h-5 text-civic-yellow" />
              </div>
              <div>
                <p className="font-medium text-sm">EEOC Tracker</p>
                <p className="text-xs text-muted-foreground">Discrimination enforcement actions</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="border-border/50 hover:border-primary/30 cursor-pointer transition-all"
            onClick={() => navigate("/economy")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-civic-green/10">
                <BarChart3 className="w-5 h-5 text-civic-green" />
              </div>
              <div>
                <p className="font-medium text-sm">Economy Dashboard</p>
                <p className="text-xs text-muted-foreground">BLS wage & benefits benchmarks</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
