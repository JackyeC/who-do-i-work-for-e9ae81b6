import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users, Target, DollarSign, Shield, Briefcase, Landmark, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Persona {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  signalWeights: Record<string, { weight: number; positive: boolean }>;
}

interface AlignmentResult {
  persona: Persona;
  score: number;
  level: "High" | "Medium" | "Low";
  matchedSignals: string[];
}

const PERSONAS: Persona[] = [
  {
    id: "mission-driven",
    name: "Mission-Driven Professional",
    icon: <Heart className="w-4 h-4" />,
    description: "Values social impact, transparency, and ethical governance.",
    signalWeights: {
      has_public_stances: { weight: 15, positive: true },
      high_transparency: { weight: 20, positive: true },
      low_political_spending: { weight: 10, positive: true },
      has_environmental_signals: { weight: 15, positive: true },
      has_dei_programs: { weight: 15, positive: true },
      recent_layoffs: { weight: -15, positive: false },
      dark_money: { weight: -20, positive: false },
    },
  },
  {
    id: "compensation-focused",
    name: "Compensation-Focused Operator",
    icon: <DollarSign className="w-4 h-4" />,
    description: "Prioritizes salary growth, equity, and financial upside.",
    signalWeights: {
      has_pay_signals: { weight: 25, positive: true },
      high_revenue: { weight: 15, positive: true },
      has_sec_filings: { weight: 10, positive: true },
      large_workforce: { weight: 10, positive: true },
      recent_layoffs: { weight: -20, positive: false },
    },
  },
  {
    id: "stability-focused",
    name: "Stability-Focused Professional",
    icon: <Shield className="w-4 h-4" />,
    description: "Prefers companies with strong financial stability and government contracts.",
    signalWeights: {
      has_gov_contracts: { weight: 25, positive: true },
      has_subsidies: { weight: 15, positive: true },
      large_workforce: { weight: 15, positive: true },
      high_revenue: { weight: 10, positive: true },
      recent_layoffs: { weight: -25, positive: false },
      has_warn_notices: { weight: -20, positive: false },
    },
  },
  {
    id: "early-career",
    name: "Early Career Builder",
    icon: <Briefcase className="w-4 h-4" />,
    description: "Values mentorship, career growth opportunities, and brand reputation.",
    signalWeights: {
      large_workforce: { weight: 15, positive: true },
      has_worker_benefits: { weight: 20, positive: true },
      has_dei_programs: { weight: 15, positive: true },
      high_transparency: { weight: 10, positive: true },
      recent_layoffs: { weight: -20, positive: false },
      has_warn_notices: { weight: -15, positive: false },
    },
  },
  {
    id: "policy-oriented",
    name: "Policy-Oriented Analyst",
    icon: <Landmark className="w-4 h-4" />,
    description: "Interested in companies influencing public policy or government programs.",
    signalWeights: {
      has_gov_contracts: { weight: 20, positive: true },
      has_lobbying: { weight: 20, positive: true },
      has_pac_spending: { weight: 15, positive: true },
      has_public_stances: { weight: 15, positive: true },
      has_revolving_door: { weight: 10, positive: true },
    },
  },
];

function getLevelFromScore(score: number): "High" | "Medium" | "Low" {
  if (score >= 65) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function getLevelColor(level: "High" | "Medium" | "Low") {
  switch (level) {
    case "High": return "bg-primary/10 text-primary border-primary/30";
    case "Medium": return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30";
    case "Low": return "bg-muted text-muted-foreground border-border";
  }
}

interface Props {
  companyId: string;
  companyName: string;
}

export function CandidateAttractionScore({ companyId, companyName }: Props) {
  const [results, setResults] = useState<AlignmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyze = async () => {
      setLoading(true);

      const [
        companyRes,
        stancesRes,
        contractsRes,
        warnRes,
        darkMoneyRes,
        revolvingDoorRes,
        signalScansRes,
        sentimentRes,
        benefitsRes,
      ] = await Promise.all([
        supabase.from("companies").select("civic_footprint_score, total_pac_spending, lobbying_spend, government_contracts, subsidies_received, employee_count, revenue, effective_tax_rate").eq("id", companyId).maybeSingle(),
        supabase.from("company_public_stances").select("topic, gap").eq("company_id", companyId),
        supabase.from("company_agency_contracts").select("id").eq("company_id", companyId).limit(1),
        supabase.from("company_warn_notices").select("id").eq("company_id", companyId).limit(1),
        supabase.from("company_dark_money").select("id").eq("company_id", companyId).limit(1),
        supabase.from("company_revolving_door").select("id").eq("company_id", companyId).limit(1),
        supabase.from("company_signal_scans").select("signal_category").eq("company_id", companyId),
        supabase.from("company_worker_sentiment").select("id").eq("company_id", companyId).limit(1),
        supabase.from("company_values_signals").select("value_category").eq("company_id", companyId),
      ]);

      const company = companyRes.data;
      if (!company) { setLoading(false); return; }

      // Build detected signals map
      const detectedSignals: Record<string, boolean> = {};
      const signalExplanations: Record<string, string> = {};

      // Transparency
      if (company.civic_footprint_score && company.civic_footprint_score >= 55) {
        detectedSignals.high_transparency = true;
        signalExplanations.high_transparency = `Civic transparency score: ${company.civic_footprint_score}/100`;
      }

      // Public stances
      if (stancesRes.data && stancesRes.data.length > 0) {
        detectedSignals.has_public_stances = true;
        signalExplanations.has_public_stances = `${stancesRes.data.length} public position${stancesRes.data.length > 1 ? "s" : ""} on record`;
      }

      // Political spending
      if (company.total_pac_spending < 10000) {
        detectedSignals.low_political_spending = true;
        signalExplanations.low_political_spending = "Minimal political spending activity detected";
      }
      if (company.total_pac_spending > 0) {
        detectedSignals.has_pac_spending = true;
        signalExplanations.has_pac_spending = `$${(company.total_pac_spending / 1000).toFixed(0)}K in PAC spending`;
      }

      // Lobbying
      if (company.lobbying_spend && company.lobbying_spend > 0) {
        detectedSignals.has_lobbying = true;
        signalExplanations.has_lobbying = `$${(company.lobbying_spend / 1000).toFixed(0)}K in lobbying expenditures`;
      }

      // Gov contracts
      if (contractsRes.data && contractsRes.data.length > 0) {
        detectedSignals.has_gov_contracts = true;
        signalExplanations.has_gov_contracts = "Active government contracts detected";
      }
      if (company.subsidies_received && company.subsidies_received > 0) {
        detectedSignals.has_subsidies = true;
        signalExplanations.has_subsidies = "Government subsidies received";
      }

      // Workforce size
      const empCount = parseInt(company.employee_count || "0");
      if (empCount > 5000) {
        detectedSignals.large_workforce = true;
        signalExplanations.large_workforce = `${company.employee_count} employees`;
      }

      // Revenue
      if (company.revenue) {
        detectedSignals.high_revenue = true;
        signalExplanations.high_revenue = `Revenue: ${company.revenue}`;
      }

      // SEC filings
      const signalCategories = (signalScansRes.data || []).map((s: any) => s.signal_category);
      if (signalCategories.includes("sec_filing") || signalCategories.includes("compensation")) {
        detectedSignals.has_sec_filings = true;
        signalExplanations.has_sec_filings = "SEC filings and compensation data available";
      }
      if (signalCategories.includes("pay_equity") || signalCategories.includes("compensation")) {
        detectedSignals.has_pay_signals = true;
        signalExplanations.has_pay_signals = "Pay equity or compensation signals detected";
      }

      // WARN / layoffs
      if (warnRes.data && warnRes.data.length > 0) {
        detectedSignals.has_warn_notices = true;
        detectedSignals.recent_layoffs = true;
        signalExplanations.has_warn_notices = "WARN Act layoff notices on file";
        signalExplanations.recent_layoffs = "Recent workforce restructuring detected";
      }

      // Dark money
      if (darkMoneyRes.data && darkMoneyRes.data.length > 0) {
        detectedSignals.dark_money = true;
        signalExplanations.dark_money = "Dark money organization connections detected";
      }

      // Revolving door
      if (revolvingDoorRes.data && revolvingDoorRes.data.length > 0) {
        detectedSignals.has_revolving_door = true;
        signalExplanations.has_revolving_door = "Government-to-private sector connections identified";
      }

      // Worker benefits
      if (sentimentRes.data && sentimentRes.data.length > 0) {
        detectedSignals.has_worker_benefits = true;
        signalExplanations.has_worker_benefits = "Worker sentiment data available";
      }

      // Values signals (DEI, environmental)
      const valCategories = (benefitsRes.data || []).map((v: any) => v.value_category);
      if (valCategories.some((c: string) => c.toLowerCase().includes("dei") || c.toLowerCase().includes("diversity"))) {
        detectedSignals.has_dei_programs = true;
        signalExplanations.has_dei_programs = "DEI-related signals detected";
      }
      if (valCategories.some((c: string) => c.toLowerCase().includes("environment") || c.toLowerCase().includes("climate"))) {
        detectedSignals.has_environmental_signals = true;
        signalExplanations.has_environmental_signals = "Environmental commitments detected";
      }

      // Score each persona
      const alignments: AlignmentResult[] = PERSONAS.map((persona) => {
        let rawScore = 50; // baseline
        const matchedSignals: string[] = [];

        Object.entries(persona.signalWeights).forEach(([signalKey, config]) => {
          if (detectedSignals[signalKey]) {
            rawScore += config.weight;
            matchedSignals.push(signalExplanations[signalKey] || signalKey);
          }
        });

        const score = Math.max(0, Math.min(100, rawScore));
        return { persona, score, level: getLevelFromScore(score), matchedSignals };
      });

      // Sort by score descending
      alignments.sort((a, b) => b.score - a.score);
      setResults(alignments);
      setLoading(false);
    };

    analyze();
  }, [companyId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) return null;

  return (
    <Card className="border-primary/15">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Talent Attraction Insights
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How well does {companyName} align with different candidate motivations? Scores are based on detected public signals — not subjective judgments.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((r) => (
          <div
            key={r.persona.id}
            className="p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {r.persona.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.persona.name}</p>
                  <p className="text-xs text-muted-foreground">{r.persona.description}</p>
                </div>
              </div>
              <Badge className={cn("shrink-0 text-xs", getLevelColor(r.level))}>
                {r.level} Alignment
              </Badge>
            </div>

            {r.matchedSignals.length > 0 && (
              <div className="mt-2 pl-10">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  Signals detected
                </p>
                <div className="space-y-0.5">
                  {r.matchedSignals.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score bar */}
            <div className="mt-3 pl-10">
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    r.level === "High" ? "bg-primary" : r.level === "Medium" ? "bg-civic-yellow" : "bg-muted-foreground/30"
                  )}
                  style={{ width: `${r.score}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        <p className="text-xs text-muted-foreground text-center pt-2 italic">
          All scores are calculated from publicly available data. No conclusions are drawn — interpretation is left to the user.
        </p>
      </CardContent>
    </Card>
  );
}
