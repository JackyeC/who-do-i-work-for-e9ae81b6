import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone, Building2, Search, Sparkles, Target, TrendingUp, AlertTriangle, CheckCircle2, ExternalLink, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EVPSignalsPanel } from "./evp/EVPSignalsPanel";
import { EVPNarrativePanel } from "./evp/EVPNarrativePanel";
import { EVPSayDoPanel } from "./evp/EVPSayDoPanel";

export interface EVPSignal {
  category: string;
  detail: string;
  sentiment: "positive" | "neutral" | "caution";
}

export interface SayDoItem {
  whatTheySay: string;
  whatRecordsShow: string;
  gap: "aligned" | "minor" | "major";
  source?: string;
}

export interface EVPResult {
  companyName: string;
  companyId: string;
  signals: EVPSignal[];
  narrativeSuggestions: string[];
  evpPositioning: string[];
  attractionInsights: string[];
  careerSiteMessages: string[];
  sayDoAnalysis: SayDoItem[];
}

export function EVPIntelligence() {
  const [companyQuery, setCompanyQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState<EVPResult | null>(null);
  const { toast } = useToast();

  const sanitize = (s: string) => s.replace(/[<>"'`]/g, "").trim().slice(0, 200);

  const analyze = async () => {
    const q = sanitize(companyQuery);
    if (!q) return;
    setLoading(true);
    setResult(null);

    try {
      // Step 1: Find or discover company
      setLoadingStep("Looking up company...");
      let { data: companies } = await supabase
        .from("companies")
        .select("id, name, description, industry, state, civic_footprint_score, total_pac_spending, lobbying_spend, government_contracts, employee_count, revenue, effective_tax_rate, careers_url, website_url")
        .ilike("name", `%${q}%`)
        .limit(1);

      let company = companies?.[0];

      if (!company) {
        setLoadingStep("Company not in database — discovering...");
        const { data: discoverResult, error: discoverErr } = await supabase.functions.invoke("company-discover", {
          body: { companyName: q, searchQuery: q },
        });

        if (discoverErr || !discoverResult?.success) {
          toast({ title: "Discovery failed", description: "Could not find or create this company. Try a different name.", variant: "destructive" });
          setLoading(false);
          return;
        }

        // Re-fetch after discovery
        const { data: refetched } = await supabase
          .from("companies")
          .select("id, name, description, industry, state, civic_footprint_score, total_pac_spending, lobbying_spend, government_contracts, employee_count, revenue, effective_tax_rate, careers_url, website_url")
          .eq("id", discoverResult.companyId)
          .single();

        company = refetched;
        if (!company) {
          toast({ title: "Company not found", description: "Discovery completed but could not load company data.", variant: "destructive" });
          setLoading(false);
          return;
        }

        toast({ title: "Company discovered", description: `${company.name} has been added. Running EVP analysis...` });
      }

      // Step 2: Scrape career site for messaging
      setLoadingStep("Scanning career site messaging...");
      let careerSiteMessages: string[] = [];
      const careerUrl = company.careers_url || (company.website_url ? `${company.website_url}/careers` : null);

      if (careerUrl) {
        try {
          const { data: scrapeData } = await supabase.functions.invoke("firecrawl-scrape", {
            body: { url: careerUrl, options: { formats: ["markdown"], onlyMainContent: true } },
          });
          if (scrapeData?.success && (scrapeData?.data?.markdown || scrapeData?.markdown)) {
            const markdown = scrapeData.data?.markdown || scrapeData.markdown;
            careerSiteMessages = extractCareerMessages(markdown);
          }
        } catch {
          // Career scrape is best-effort
        }
      }

      // Step 3: Fetch reality signals
      setLoadingStep("Analyzing reality signals...");
      const [stancesRes, signalScansRes, jobsRes, contractsRes, partyRes, candidatesRes] = await Promise.all([
        supabase.from("company_public_stances").select("topic, public_position, spending_reality, gap").eq("company_id", company.id),
        supabase.from("company_signal_scans").select("signal_category, signal_type, signal_value, confidence_level").eq("company_id", company.id).limit(20),
        supabase.from("company_jobs").select("title, department, work_mode, location").eq("company_id", company.id).eq("is_active", true).limit(10),
        supabase.from("company_agency_contracts").select("agency_name, contract_description, contract_value").eq("company_id", company.id).limit(5),
        supabase.from("company_party_breakdown").select("party, amount").eq("company_id", company.id),
        supabase.from("company_candidates").select("name, party, amount, flagged, flag_reason").eq("company_id", company.id).order("amount", { ascending: false }).limit(10),
      ]);

      // Build signals
      const signals: EVPSignal[] = [];

      if (company.description) {
        signals.push({ category: "Mission", detail: company.description, sentiment: "positive" });
      }

      if (contractsRes.data && contractsRes.data.length > 0) {
        const totalValue = contractsRes.data.reduce((s, c) => s + (c.contract_value || 0), 0);
        signals.push({
          category: "Government Contracts",
          detail: `${contractsRes.data.length} active contracts worth $${(totalValue / 1e6).toFixed(1)}M`,
          sentiment: "positive",
        });
      }

      if (partyRes.data && partyRes.data.length > 0) {
        const breakdown = partyRes.data.map(p => `${p.party}: $${((p.amount || 0) / 1000).toFixed(0)}K`).join(", ");
        signals.push({ category: "Political Spending", detail: `PAC donations — ${breakdown}`, sentiment: "neutral" });
      }

      if (company.lobbying_spend && company.lobbying_spend > 0) {
        signals.push({
          category: "Lobbying",
          detail: `$${(company.lobbying_spend / 1e6).toFixed(1)}M in registered lobbying expenditures`,
          sentiment: "neutral",
        });
      }

      if (candidatesRes.data) {
        const flagged = candidatesRes.data.filter(c => c.flagged);
        if (flagged.length > 0) {
          signals.push({
            category: "Flagged Recipients",
            detail: `${flagged.length} donation recipients flagged: ${flagged.map(f => `${f.name} (${f.flag_reason})`).slice(0, 3).join("; ")}`,
            sentiment: "caution",
          });
        }
      }

      if (stancesRes.data) {
        stancesRes.data.forEach((s) => {
          signals.push({
            category: "Public Stance",
            detail: `${s.topic}: ${s.public_position}${s.gap !== "none" ? ` (gap: ${s.spending_reality})` : ""}`,
            sentiment: s.gap === "none" ? "positive" : "caution",
          });
        });
      }

      if (signalScansRes.data && signalScansRes.data.length > 0) {
        const categories = [...new Set(signalScansRes.data.map((s: any) => s.signal_category))];
        signals.push({
          category: "Workforce Programs",
          detail: `${signalScansRes.data.length} signals across ${categories.slice(0, 3).join(", ")}`,
          sentiment: "positive",
        });
      }

      if (company.civic_footprint_score) {
        signals.push({
          category: "Civic Footprint",
          detail: `Score: ${company.civic_footprint_score}/100`,
          sentiment: company.civic_footprint_score >= 60 ? "positive" : company.civic_footprint_score >= 40 ? "neutral" : "caution",
        });
      }

      // Build Say-Do analysis
      const sayDoAnalysis: SayDoItem[] = [];

      // Compare career site messaging vs reality
      if (careerSiteMessages.length > 0) {
        for (const msg of careerSiteMessages) {
          const lowerMsg = msg.toLowerCase();
          if (lowerMsg.includes("diverse") || lowerMsg.includes("inclusion") || lowerMsg.includes("equity")) {
            const hasGap = stancesRes.data?.some(s => s.topic.toLowerCase().includes("diversity") && s.gap !== "none");
            sayDoAnalysis.push({
              whatTheySay: msg,
              whatRecordsShow: hasGap
                ? "Spending records show donations to legislators opposing DEI initiatives"
                : "No conflicting spending records found on this topic",
              gap: hasGap ? "major" : "aligned",
              source: "Career site + FEC/LDA records",
            });
          }
          if (lowerMsg.includes("sustain") || lowerMsg.includes("climate") || lowerMsg.includes("green") || lowerMsg.includes("environment")) {
            const hasGap = stancesRes.data?.some(s => s.topic.toLowerCase().includes("climate") && s.gap !== "none");
            sayDoAnalysis.push({
              whatTheySay: msg,
              whatRecordsShow: hasGap
                ? "Lobbying records show opposition to environmental regulations"
                : "No conflicting lobbying records found on environmental policy",
              gap: hasGap ? "major" : "aligned",
              source: "Career site + Senate LDA filings",
            });
          }
          if (lowerMsg.includes("people") || lowerMsg.includes("employee") || lowerMsg.includes("team") || lowerMsg.includes("culture")) {
            const hasLayoffs = signalScansRes.data?.some((s: any) => s.signal_category === "layoffs" || s.signal_type?.includes("warn"));
            sayDoAnalysis.push({
              whatTheySay: msg,
              whatRecordsShow: hasLayoffs
                ? "Recent WARN Act layoff notices detected for this employer"
                : "No recent layoff notices found in public WARN data",
              gap: hasLayoffs ? "major" : "aligned",
              source: "Career site + WARN Act filings",
            });
          }
        }
      }

      // Add stance-based say-do items
      if (stancesRes.data) {
        stancesRes.data.filter(s => s.gap !== "none").forEach(s => {
          sayDoAnalysis.push({
            whatTheySay: s.public_position,
            whatRecordsShow: s.spending_reality,
            gap: "major",
            source: "Company public stance vs. spending records",
          });
        });
      }

      // Narrative suggestions
      const narrativeSuggestions: string[] = [];
      if (contractsRes.data && contractsRes.data.length > 0) {
        narrativeSuggestions.push(`"Join a team trusted by ${contractsRes.data.map(c => c.agency_name).slice(0, 2).join(" and ")} to deliver critical public services."`);
      }
      if (signalScansRes.data && signalScansRes.data.length > 0) {
        const topCategories = [...new Set((signalScansRes.data as any[]).map(s => s.signal_category))].slice(0, 2);
        narrativeSuggestions.push(`"We invest in our people — with demonstrated commitment to ${topCategories.join(" and ")}."`);
      }
      if (company.employee_count) {
        narrativeSuggestions.push(`"Be part of a ${company.employee_count}-strong team making an impact in ${company.industry}."`);
      }
      if (sayDoAnalysis.some(s => s.gap === "major")) {
        narrativeSuggestions.push(`⚠️ Before using any of the above messaging, address the ${sayDoAnalysis.filter(s => s.gap === "major").length} say-do gap(s) identified below. Candidates will find these.`);
      }
      if (narrativeSuggestions.length === 0) {
        narrativeSuggestions.push(`"Build your career at ${company.name} — a company in ${company.industry} based in ${company.state}."`);
      }

      // EVP positioning
      const evpPositioning: string[] = [];
      if (company.government_contracts && company.government_contracts > 0) evpPositioning.push("Public sector impact");
      if (signalScansRes.data && signalScansRes.data.length > 5) evpPositioning.push("Strong employee programs");
      if (jobsRes.data?.some(j => j.work_mode === "remote")) evpPositioning.push("Remote work culture");
      if (company.civic_footprint_score && company.civic_footprint_score >= 60) evpPositioning.push("Transparent governance");
      if (sayDoAnalysis.every(s => s.gap === "aligned") && sayDoAnalysis.length > 0) evpPositioning.push("Values-aligned messaging");
      evpPositioning.push(`${company.industry} sector`);

      // Attraction insights
      const attractionInsights: string[] = [];
      if (sayDoAnalysis.some(s => s.gap === "major")) {
        attractionInsights.push("⚠️ Say-Do gaps detected — candidates researching this company will find messaging inconsistencies. Address proactively.");
      }
      if (company.total_pac_spending > 50000) {
        attractionInsights.push("💡 Significant political spending detected — values-driven candidates will evaluate this. Consider transparency as a differentiator.");
      }
      if (careerSiteMessages.length === 0) {
        attractionInsights.push("🔍 No career site content could be analyzed. Ensure your careers page clearly communicates your EVP.");
      }
      attractionInsights.push("✅ Lead with mission and impact in job descriptions to attract purpose-driven talent.");

      setResult({
        companyName: company.name,
        companyId: company.id,
        signals,
        narrativeSuggestions,
        evpPositioning,
        attractionInsights,
        careerSiteMessages,
        sayDoAnalysis,
      });
    } catch (err) {
      console.error("EVP analysis error:", err);
      toast({ title: "Analysis failed", description: "Unable to generate EVP intelligence.", variant: "destructive" });
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display text-foreground">EVP Intelligence</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Compare what a company says on their career site vs. what public records reveal about their spending, lobbying, and political activity
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter any company name (we'll add it if it's new)"
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
          {loading && loadingStep && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> {loadingStep}
            </p>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            EVP Analysis: {result.companyName}
          </h3>

          {/* Say vs Do — most important */}
          {result.sayDoAnalysis.length > 0 && <EVPSayDoPanel items={result.sayDoAnalysis} />}

          {/* Career site messages */}
          {result.careerSiteMessages.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" /> What Their Career Site Says
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.careerSiteMessages.map((m, i) => (
                  <div key={i} className="p-3 rounded-lg bg-primary/[0.04] border border-primary/10">
                    <p className="text-sm text-foreground italic">"{m}"</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Signals */}
          <EVPSignalsPanel signals={result.signals} />

          {/* Narratives */}
          <EVPNarrativePanel
            narrativeSuggestions={result.narrativeSuggestions}
            evpPositioning={result.evpPositioning}
            attractionInsights={result.attractionInsights}
          />
        </div>
      )}
    </div>
  );
}

/** Extract key recruiting messages from career page markdown */
function extractCareerMessages(markdown: string): string[] {
  const messages: string[] = [];
  const lines = markdown.split("\n").filter(l => l.trim().length > 20 && l.trim().length < 300);

  const keywords = [
    "diverse", "inclusion", "equity", "belong", "culture", "impact",
    "sustain", "climate", "green", "environment", "innovation",
    "people", "employee", "team", "community", "mission", "purpose",
    "growth", "career", "develop", "learn", "benefits", "wellbeing",
    "flexible", "remote", "hybrid", "balance",
  ];

  for (const line of lines) {
    const clean = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/\[.*?\]\(.*?\)/g, "").trim();
    if (!clean || clean.startsWith("!") || clean.startsWith("<") || clean.startsWith("|")) continue;
    const lower = clean.toLowerCase();
    if (keywords.some(kw => lower.includes(kw))) {
      messages.push(clean);
      if (messages.length >= 8) break;
    }
  }

  return messages;
}
