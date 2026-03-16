import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Scale, Users, ShoppingCart, Landmark, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateEthicsRisk, type EthicsRiskInput, type EthicsRiskCategory } from "@/lib/ethicsRiskScore";
import { useMemo } from "react";

interface Props {
  companyId?: string;
  companyName: string;
  hasRevolvingDoor?: boolean;
  hasDarkMoney?: boolean;
}

const RISK_STYLES = {
  low: { bg: "bg-[hsl(var(--civic-green))]/8", border: "border-[hsl(var(--civic-green))]/20", text: "text-[hsl(var(--civic-green))]", label: "Low Risk" },
  moderate: { bg: "bg-[hsl(var(--civic-yellow))]/8", border: "border-[hsl(var(--civic-yellow))]/20", text: "text-[hsl(var(--civic-yellow))]", label: "Moderate" },
  elevated: { bg: "bg-destructive/8", border: "border-destructive/20", text: "text-destructive", label: "Elevated" },
  high: { bg: "bg-destructive/12", border: "border-destructive/30", text: "text-destructive", label: "High Risk" },
};

const CAT_ICONS: Record<string, typeof Scale> = {
  regulatory: ShieldAlert,
  labor: Users,
  consumer: ShoppingCart,
  governance: Landmark,
  environmental: Leaf,
};

export function EthicsRiskCard({ companyId, companyName, hasRevolvingDoor, hasDarkMoney }: Props) {
  // Court cases
  const { data: courtCases } = useQuery({
    queryKey: ["er-court", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("company_court_cases").select("nature_of_suit, cause, damages_amount").eq("company_id", companyId!);
      return data || [];
    },
  });

  // Civil rights signals
  const { data: civilRights } = useQuery({
    queryKey: ["er-civil", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("civil_rights_signals").select("signal_type, settlement_amount").eq("company_id", companyId!);
      return data || [];
    },
  });

  // Climate signals
  const { data: climateSignals } = useQuery({
    queryKey: ["er-climate", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("climate_signals").select("signal_type, emissions_amount").eq("company_id", companyId!);
      return data || [];
    },
  });

  const result = useMemo(() => {
    const cases = courtCases || [];
    const laborRe = /labor|wage|flsa|nlrb|employment|wrongful/i;
    const discrimRe = /discrimination|eeoc|title.vii|ada|adea/i;
    const consumerRe = /consumer|product|warranty|recall|ftc/i;
    const antitrustRe = /antitrust|sherman|monopol/i;

    const wageCases = cases.filter((c: any) => laborRe.test(c.nature_of_suit || "") || laborRe.test(c.cause || ""));
    const discrimCases = cases.filter((c: any) => discrimRe.test(c.nature_of_suit || "") || discrimRe.test(c.cause || ""));
    const consumerCases = cases.filter((c: any) => consumerRe.test(c.nature_of_suit || "") || consumerRe.test(c.cause || ""));
    const antitrustCases = cases.filter((c: any) => antitrustRe.test(c.nature_of_suit || "") || antitrustRe.test(c.cause || ""));

    const epaViolations = (climateSignals || []).filter((s: any) => /violation|penalty|fine/i.test(s.signal_type || ""));

    const input: EthicsRiskInput = {
      oshaViolationCount: 0, // would come from OSHA data if available
      ftcActionCount: 0,
      antitrustInvestigations: antitrustCases.length,
      regulatoryFineTotal: cases.reduce((sum: number, c: any) => sum + (Number(c.damages_amount) || 0), 0),
      nlrbChargeCount: 0,
      wageLawsuitCount: wageCases.length,
      laborArbitrationCount: 0,
      unionDisputeActive: false,
      discriminationSuitCount: discrimCases.length + (civilRights || []).length,
      cfpbComplaintCount: 0,
      consumerLawsuitCount: consumerCases.length,
      productRecallCount: 0,
      insiderTradingFlags: 0,
      accountingRestatements: 0,
      executiveMisconductFlags: 0,
      secInvestigationActive: false,
      hasRevolvingDoor: !!hasRevolvingDoor,
      hasDarkMoney: !!hasDarkMoney,
      epaViolationCount: epaViolations.length,
      environmentalFineTotal: 0,
      climateCommitmentBroken: false,
    };

    return calculateEthicsRisk(input);
  }, [courtCases, civilRights, climateSignals, hasRevolvingDoor, hasDarkMoney]);

  const style = RISK_STYLES[result.riskLevel];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Corporate Ethics Risk
          <Badge variant="outline" className={cn("ml-auto text-[10px]", style.text, style.bg, style.border)}>
            {result.score}/100 · {style.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category bars */}
        <div className="space-y-2">
          {result.categories.map((cat) => {
            const Icon = CAT_ICONS[cat.key] || Scale;
            const catStyle = RISK_STYLES[cat.level];
            return (
              <div key={cat.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {cat.name}
                  </span>
                  <span className={cn("text-xs font-semibold", catStyle.text)}>{cat.score}/100</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all",
                      cat.level === "high" || cat.level === "elevated" ? "bg-destructive" :
                      cat.level === "moderate" ? "bg-[hsl(var(--civic-yellow))]" : "bg-[hsl(var(--civic-green))]"
                    )}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
                <div className="mt-1 space-y-0.5">
                  {cat.signals.map((s, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground pl-5">• {s}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {result.topConcerns.length > 0 && (
          <div className={cn("p-2.5 rounded-lg border", style.bg, style.border)}>
            <p className="text-xs font-semibold text-foreground mb-1">Areas of Concern</p>
            <p className="text-xs text-muted-foreground">
              {result.topConcerns.join(" · ")}
            </p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          Sources: Court records · EPA · OSHA · FTC · NLRB · SEC · Civil rights watchdog organizations · This is a pattern analysis, not a legal assessment.
        </p>
      </CardContent>
    </Card>
  );
}
