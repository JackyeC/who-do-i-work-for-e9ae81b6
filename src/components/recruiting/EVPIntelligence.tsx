import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone, Building2, Search, Sparkles, FileText, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EVPResult {
  companyName: string;
  signals: { category: string; detail: string; sentiment: "positive" | "neutral" | "caution" }[];
  narrativeSuggestions: string[];
  evpPositioning: string[];
  attractionInsights: string[];
}

export function EVPIntelligence() {
  const [companyQuery, setCompanyQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EVPResult | null>(null);
  const { toast } = useToast();

  const analyze = async () => {
    if (!companyQuery.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      // Look up company
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, description, industry, state, civic_footprint_score, total_pac_spending, lobbying_spend, government_contracts, employee_count, revenue, effective_tax_rate, careers_url, website_url")
        .ilike("name", `%${companyQuery.trim()}%`)
        .limit(1);

      if (!companies || companies.length === 0) {
        toast({ title: "Company not found", description: "Try searching with a different name or add the company first.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const company = companies[0];

      // Fetch related signals
      const [stancesRes, signalScansRes, jobsRes, contractsRes] = await Promise.all([
        supabase.from("company_public_stances").select("topic, public_position, spending_reality, gap").eq("company_id", company.id),
        supabase.from("company_signal_scans").select("signal_category, signal_type, signal_value, confidence_level").eq("company_id", company.id).limit(20),
        supabase.from("company_jobs").select("title, department, work_mode, location").eq("company_id", company.id).eq("is_active", true).limit(10),
        supabase.from("company_agency_contracts").select("agency_name, contract_description, contract_value").eq("company_id", company.id).limit(5),
      ]);

      // Build EVP analysis from real data
      const signals: EVPResult["signals"] = [];

      // Mission signals
      if (company.description) {
        signals.push({ category: "Mission", detail: company.description, sentiment: "positive" });
      }

      // Government contract signals
      if (contractsRes.data && contractsRes.data.length > 0) {
        const totalValue = contractsRes.data.reduce((s, c) => s + (c.contract_value || 0), 0);
        signals.push({
          category: "Government Contracts",
          detail: `${contractsRes.data.length} active contracts worth $${(totalValue / 1e6).toFixed(1)}M across agencies like ${contractsRes.data[0].agency_name}`,
          sentiment: "positive",
        });
      }

      // Public stances
      if (stancesRes.data) {
        stancesRes.data.forEach((s) => {
          signals.push({
            category: "Public Stance",
            detail: `${s.topic}: ${s.public_position}${s.gap !== "none" ? ` (gap detected: ${s.spending_reality})` : ""}`,
            sentiment: s.gap === "none" ? "positive" : "caution",
          });
        });
      }

      // Benefits signals
      if (benefitsRes.data) {
        const positives = benefitsRes.data.filter((b) => b.sentiment === "positive");
        if (positives.length > 0) {
          signals.push({
            category: "Workforce Programs",
            detail: `${positives.length} positive benefit signals detected including ${positives.slice(0, 3).map((p) => p.benefit_category).join(", ")}`,
            sentiment: "positive",
          });
        }
      }

      // Governance signals
      if (company.civic_footprint_score) {
        signals.push({
          category: "Corporate Governance",
          detail: `Civic Footprint Score: ${company.civic_footprint_score}/100`,
          sentiment: company.civic_footprint_score >= 60 ? "positive" : company.civic_footprint_score >= 40 ? "neutral" : "caution",
        });
      }

      // Build narrative suggestions
      const narrativeSuggestions: string[] = [];
      if (contractsRes.data && contractsRes.data.length > 0) {
        narrativeSuggestions.push(`"Join a team trusted by ${contractsRes.data.map((c) => c.agency_name).slice(0, 2).join(" and ")} to deliver critical public services."`);
      }
      if (benefitsRes.data && benefitsRes.data.some((b) => b.sentiment === "positive")) {
        narrativeSuggestions.push(`"We invest in our people — with programs recognized for ${benefitsRes.data.filter((b) => b.sentiment === "positive").slice(0, 2).map((b) => b.benefit_category).join(" and ")}."`);
      }
      if (company.employee_count) {
        narrativeSuggestions.push(`"Be part of a ${company.employee_count}-strong team making an impact in ${company.industry}."`);
      }
      if (narrativeSuggestions.length === 0) {
        narrativeSuggestions.push(`"Build your career at ${company.name} — a company in ${company.industry} based in ${company.state}."`);
      }

      // EVP positioning
      const evpPositioning: string[] = [];
      if (company.government_contracts && company.government_contracts > 0) evpPositioning.push("Public sector impact & mission-driven work");
      if (benefitsRes.data && benefitsRes.data.length > 5) evpPositioning.push("Strong employee benefits & workplace programs");
      if (jobsRes.data && jobsRes.data.some((j) => j.work_mode === "remote")) evpPositioning.push("Flexible & remote work culture");
      if (company.civic_footprint_score && company.civic_footprint_score >= 60) evpPositioning.push("Transparent corporate governance");
      evpPositioning.push(`${company.industry} industry leadership`);

      // Attraction insights
      const attractionInsights: string[] = [];
      if (stancesRes.data && stancesRes.data.some((s) => s.gap !== "none")) {
        attractionInsights.push("⚠️ Say-Do gaps detected — candidates researching this company may find messaging inconsistencies. Address proactively in recruiting materials.");
      }
      if (company.total_pac_spending > 50000) {
        attractionInsights.push("💡 Company has significant political spending — values-driven candidates will evaluate this. Consider transparency as a recruiting differentiator.");
      }
      attractionInsights.push("✅ Lead with mission and impact in job descriptions to attract purpose-driven talent.");

      setResult({
        companyName: company.name,
        signals,
        narrativeSuggestions,
        evpPositioning,
        attractionInsights,
      });
    } catch (err) {
      console.error("EVP analysis error:", err);
      toast({ title: "Analysis failed", description: "Unable to generate EVP intelligence.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sentimentColor = (s: "positive" | "neutral" | "caution") =>
    s === "positive" ? "bg-green-500/10 text-green-700 border-green-500/20" :
    s === "caution" ? "bg-amber-500/10 text-amber-700 border-amber-500/20" :
    "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display text-foreground">EVP Intelligence</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze a company's public signals and convert them into employer value proposition messaging
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter company name (e.g. Microsoft, Amazon)"
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && analyze()}
              />
            </div>
            <Button onClick={analyze} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analyze EVP
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            EVP Analysis: {result.companyName}
          </h3>

          {/* Signals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Public Signals Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.signals.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Badge className={`shrink-0 text-xs ${sentimentColor(s.sentiment)}`}>{s.category}</Badge>
                  <p className="text-sm text-foreground">{s.detail}</p>
                </div>
              ))}
              {result.signals.length === 0 && (
                <p className="text-sm text-muted-foreground">No public signals found. Run a company intelligence scan first.</p>
              )}
            </CardContent>
          </Card>

          {/* Narrative Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" /> Recruiting Narrative Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.narrativeSuggestions.map((n, i) => (
                <div key={i} className="p-3 rounded-lg bg-primary/[0.04] border border-primary/10">
                  <p className="text-sm text-foreground italic">{n}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* EVP Positioning */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> EVP Positioning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.evpPositioning.map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-sm py-1.5 px-3">{p}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attraction Insights */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Candidate Attraction Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.attractionInsights.map((a, i) => (
                <p key={i} className="text-sm text-foreground p-3 rounded-lg bg-muted/30">{a}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
