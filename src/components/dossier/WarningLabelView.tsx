import { useMemo } from "react";
import { 
  AlertTriangle, TrendingDown, DollarSign, Users, 
  Eye, MessageSquare, CheckCircle2, XCircle, 
  MinusCircle, ArrowRight, Shield, Zap,
  Building2, Scale, Megaphone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface WarningLabelProps {
  company: {
    name: string;
    industry: string;
    state: string;
    employee_count?: string | null;
    lobbying_spend?: number | null;
    total_pac_spending?: number;
    jackye_insight?: string | null;
    description?: string | null;
    civic_footprint_score?: number;
    employer_clarity_score?: number | null;
    career_intelligence_score?: number | null;
    is_publicly_traded?: boolean | null;
    effective_tax_rate?: string | null;
    government_contracts?: number | null;
    subsidies_received?: number | null;
  };
  executives?: Array<{
    name: string;
    title: string;
    total_donations: number;
    previous_company?: string | null;
    source?: string | null;
  }>;
  contracts?: Array<{
    agency_name: string;
    contract_value?: number | null;
    contract_description?: string | null;
    controversy_flag?: boolean;
  }>;
  issueSignals?: Array<{
    issue_category: string;
    signal_type: string;
    description: string;
    amount?: number | null;
    confidence_score?: number;
  }>;
  publicStances?: Array<{
    issue_category?: string;
    public_position?: string;
    evidence_type?: string;
    reality_check?: string;
    gap_severity?: string;
  }>;
  eeocCases?: Array<{
    case_name?: string;
    filing_date?: string;
    basis?: string;
    issue?: string;
  }>;
}

/* ─── Verdict logic ─── */
function computeVerdict(company: WarningLabelProps["company"], signalCount: number, eeocCount: number) {
  const lobbyingHigh = (company.lobbying_spend ?? 0) > 1_000_000;
  const pacHigh = (company.total_pac_spending ?? 0) > 500_000;
  const clarityLow = (company.employer_clarity_score ?? 50) < 30;
  const hasEeoc = eeocCount > 0;
  const redFlags = [lobbyingHigh, pacHigh, clarityLow, hasEeoc, signalCount > 5].filter(Boolean).length;

  if (redFlags >= 4) return { text: "ENTER WITH A PARACHUTE", emoji: "🪂", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" };
  if (redFlags >= 2) return { text: "PROCEED WITH CAUTION", emoji: "⚠️", color: "text-civic-yellow", bg: "bg-civic-yellow/10 border-civic-yellow/30" };
  if (redFlags >= 1) return { text: "MIXED SIGNALS — DIG DEEPER", emoji: "🔍", color: "text-civic-blue", bg: "bg-civic-blue/10 border-civic-blue/30" };
  return { text: "RELATIVELY CLEAN RECORD", emoji: "✅", color: "text-civic-green", bg: "bg-civic-green/10 border-civic-green/30" };
}

/* ─── Money formatter ─── */
function fmtMoney(n?: number | null): string {
  if (!n) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

/* ─── CEO Memo Decoder ─── */
const DECODER_MAP: Record<string, string> = {
  "strategic reallocation": "Budget redirected — someone's team is losing headcount",
  "modernization": "Automation replacing human roles",
  "restructuring": "Layoffs, reorgs, or both",
  "right-sizing": "Layoffs with better PR",
  "operational efficiency": "Doing more with fewer people",
  "people first": "Often said right before layoffs",
  "organizational simplification": "Middle management purge",
  "workforce optimization": "Headcount reduction",
  "transformation": "Everything changes, nobody knows to what",
  "synergies": "Post-merger job cuts",
  "realignment": "Your team might not exist next quarter",
};

/* ─── Component ─── */
export function WarningLabelView({ company, executives = [], contracts = [], issueSignals = [], publicStances = [], eeocCases = [] }: WarningLabelProps) {
  const verdict = useMemo(() => computeVerdict(company, issueSignals.length, eeocCases.length), [company, issueSignals.length, eeocCases.length]);

  const totalContractValue = useMemo(() => contracts.reduce((s, c) => s + (c.contract_value ?? 0), 0), [contracts]);
  const controversialContracts = useMemo(() => contracts.filter(c => c.controversy_flag), [contracts]);
  const topDonors = useMemo(() => executives.filter(e => e.total_donations > 0).sort((a, b) => b.total_donations - a.total_donations).slice(0, 5), [executives]);
  const crossoverExecs = useMemo(() => executives.filter(e => e.previous_company).slice(0, 5), [executives]);

  // Gap analysis from public stances
  const gapStances = useMemo(() => publicStances.filter(s => s.gap_severity === "Large" || s.gap_severity === "Medium").slice(0, 5), [publicStances]);

  // Group issue signals by category
  const signalsByCategory = useMemo(() => {
    const map: Record<string, typeof issueSignals> = {};
    for (const s of issueSignals) {
      const cat = s.issue_category || "Other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    }
    return map;
  }, [issueSignals]);

  const pulseItems = useMemo(() => {
    const items: Array<{ icon: React.ElementType; text: string; severity: "red" | "yellow" | "green" }> = [];

    if ((company.lobbying_spend ?? 0) > 0) {
      items.push({
        icon: DollarSign,
        text: `${fmtMoney(company.lobbying_spend)} in lobbying spend on record.`,
        severity: (company.lobbying_spend ?? 0) > 1_000_000 ? "red" : "yellow",
      });
    }
    if ((company.total_pac_spending ?? 0) > 0) {
      items.push({
        icon: Megaphone,
        text: `${fmtMoney(company.total_pac_spending)} in PAC political spending.`,
        severity: (company.total_pac_spending ?? 0) > 500_000 ? "red" : "yellow",
      });
    }
    if (eeocCases.length > 0) {
      items.push({
        icon: Scale,
        text: `${eeocCases.length} EEOC enforcement action${eeocCases.length > 1 ? "s" : ""} on record.`,
        severity: "red",
      });
    }
    if (totalContractValue > 0) {
      items.push({
        icon: Building2,
        text: `${fmtMoney(totalContractValue)} in government contracts across ${contracts.length} agencies.`,
        severity: "yellow",
      });
    }
    if ((company.subsidies_received ?? 0) > 0) {
      items.push({
        icon: DollarSign,
        text: `${fmtMoney(company.subsidies_received)} in public subsidies received.`,
        severity: "yellow",
      });
    }
    if (issueSignals.length > 0) {
      items.push({
        icon: AlertTriangle,
        text: `${issueSignals.length} active signals across ${Object.keys(signalsByCategory).length} categories.`,
        severity: issueSignals.length > 10 ? "red" : "yellow",
      });
    }
    if (items.length === 0) {
      items.push({
        icon: CheckCircle2,
        text: "No major red flags detected in current public records.",
        severity: "green",
      });
    }
    return items;
  }, [company, eeocCases, contracts, issueSignals, totalContractValue, signalsByCategory]);

  const severityColors = {
    red: "text-destructive",
    yellow: "text-civic-yellow",
    green: "text-civic-green",
  };

  return (
    <div className="space-y-6">
      {/* ─── VERDICT ─── */}
      <Card className={cn("border-2 rounded-none", verdict.bg)}>
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{verdict.emoji}</span>
            <div className="flex-1">
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-muted-foreground mb-1">WDIWF VERDICT</p>
              <h2 className={cn("text-xl md:text-2xl font-black tracking-tight", verdict.color)}>
                {verdict.text}
              </h2>
              {company.jackye_insight && (
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed italic">
                  "{company.jackye_insight}"
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── THE STRATEGY ─── */}
      <Card className="rounded-none border border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-black tracking-tight text-foreground uppercase">THE STRATEGY</h3>
              <p className="text-xs text-muted-foreground">Where the money is going and what the public record shows</p>
            </div>
          </div>
          <div className="space-y-3">
            {pulseItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-none bg-muted/20 border border-border/30">
                <item.icon className={cn("w-4 h-4 mt-0.5 shrink-0", severityColors[item.severity])} />
                <p className="text-sm text-foreground leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── WORKFORCE HEALTH ─── */}
      <Card className="rounded-none border border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-black tracking-tight text-foreground uppercase">WORKFORCE HEALTH</h3>
              <p className="text-xs text-muted-foreground">Follow the spending, spot the risk</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left py-2 pr-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">Metric</th>
                  <th className="text-left py-2 pr-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left py-2 font-mono text-xs text-muted-foreground uppercase tracking-wider">So What?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">Lobbying</td>
                  <td className="py-3 pr-4 font-mono font-bold text-foreground">{fmtMoney(company.lobbying_spend)}</td>
                  <td className="py-3 text-muted-foreground text-xs leading-snug">
                    {(company.lobbying_spend ?? 0) > 1_000_000
                      ? "Heavy political spend — this company invests seriously in shaping policy."
                      : (company.lobbying_spend ?? 0) > 0
                      ? "Moderate lobbying presence."
                      : "No lobbying spend detected."}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">PAC Spending</td>
                  <td className="py-3 pr-4 font-mono font-bold text-foreground">{fmtMoney(company.total_pac_spending)}</td>
                  <td className="py-3 text-muted-foreground text-xs leading-snug">
                    {(company.total_pac_spending ?? 0) > 500_000
                      ? "Significant PAC activity — check which candidates they're funding."
                      : (company.total_pac_spending ?? 0) > 0
                      ? "Some political giving on record."
                      : "No PAC spending detected."}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">Gov Contracts</td>
                  <td className="py-3 pr-4 font-mono font-bold text-foreground">{fmtMoney(totalContractValue)}</td>
                  <td className="py-3 text-muted-foreground text-xs leading-snug">
                    {totalContractValue > 0
                      ? `${contracts.length} contract${contracts.length > 1 ? "s" : ""} on record${controversialContracts.length > 0 ? ` — ${controversialContracts.length} flagged.` : "."}`
                      : "No federal contracts found."}
                  </td>
                </tr>
                {(company.subsidies_received ?? 0) > 0 && (
                  <tr>
                    <td className="py-3 pr-4 font-medium text-foreground">Subsidies</td>
                    <td className="py-3 pr-4 font-mono font-bold text-foreground">{fmtMoney(company.subsidies_received)}</td>
                    <td className="py-3 text-muted-foreground text-xs leading-snug">Public money received — worth checking against layoff history.</td>
                  </tr>
                )}
                {company.effective_tax_rate && (
                  <tr>
                    <td className="py-3 pr-4 font-medium text-foreground">Eff. Tax Rate</td>
                    <td className="py-3 pr-4 font-mono font-bold text-foreground">{company.effective_tax_rate}</td>
                    <td className="py-3 text-muted-foreground text-xs leading-snug">Compare against statutory rate to assess tax strategy aggressiveness.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── INFLUENCE MAP (RED FLAG CHECKLIST) ─── */}
      <Card className="rounded-none border border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-black tracking-tight text-foreground uppercase">INFLUENCE MAP</h3>
              <p className="text-xs text-muted-foreground">Who's making decisions — and where they came from</p>
            </div>
          </div>

          {topDonors.length > 0 && (
            <div className="mb-5">
              <p className="font-mono text-xs text-primary tracking-wider uppercase mb-2">Top Political Donors in Leadership</p>
              <div className="space-y-2">
                {topDonors.map((exec, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/20 border border-border/30 rounded-none">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{exec.name}</p>
                      <p className="text-xs text-muted-foreground">{exec.title}</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {fmtMoney(exec.total_donations)} donated
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {crossoverExecs.length > 0 && (
            <div className="mb-5">
              <p className="font-mono text-xs text-primary tracking-wider uppercase mb-2">Executive Pipeline — Where They Came From</p>
              <div className="space-y-2">
                {crossoverExecs.map((exec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 border border-border/30 rounded-none">
                    <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{exec.name}</span> ({exec.title})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Previously at <span className="font-medium text-foreground">{exec.previous_company}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topDonors.length === 0 && crossoverExecs.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No executive influence signals detected yet.</p>
          )}
        </CardContent>
      </Card>

      {/* ─── REALITY GAP (Say vs Do) ─── */}
      {gapStances.length > 0 && (
        <Card className="rounded-none border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-black tracking-tight text-foreground uppercase">SAY vs DO</h3>
                <p className="text-xs text-muted-foreground">Where corporate claims and public records diverge</p>
              </div>
            </div>
            <div className="space-y-3">
              {gapStances.map((s, i) => (
                <div key={i} className="p-3 bg-muted/20 border border-border/30 rounded-none">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-mono",
                        s.gap_severity === "Large" ? "border-destructive/50 text-destructive" : "border-civic-yellow/50 text-civic-yellow"
                      )}
                    >
                      {s.gap_severity} Gap
                    </Badge>
                    <span className="text-xs text-muted-foreground">{s.issue_category}</span>
                  </div>
                  {s.public_position && (
                    <p className="text-sm text-foreground mb-1">
                      <span className="font-medium">They say:</span> "{s.public_position}"
                    </p>
                  )}
                  {s.reality_check && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Records show:</span> {s.reality_check}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── CEO MEMO DECODER ─── */}
      <Card className="rounded-none border border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-black tracking-tight text-foreground uppercase">CEO MEMO DECODER</h3>
              <p className="text-xs text-muted-foreground">What corporate language actually means</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(DECODER_MAP).map(([phrase, meaning]) => (
              <div key={phrase} className="flex items-start gap-2 p-2.5 bg-muted/15 border border-border/20 rounded-none">
                <MinusCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground capitalize">"{phrase}"</p>
                  <p className="text-xs text-muted-foreground leading-snug">{meaning}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── ACTION ITEMS ─── */}
      <Card className="rounded-none border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-black tracking-tight text-foreground uppercase">YOUR ACTION ITEMS</h3>
              <p className="text-xs text-muted-foreground">What to watch, check, and ask before you commit</p>
            </div>
          </div>
          <div className="space-y-3">
            <ActionItem
              type="watch"
              text={`Watch for leadership changes at ${company.name} — executive turnover patterns signal strategic instability.`}
            />
            {(company.lobbying_spend ?? 0) > 0 && (
              <ActionItem
                type="check"
                text={`Check which policies ${company.name} is lobbying on — ${fmtMoney(company.lobbying_spend)} in spend means they're actively shaping the rules.`}
              />
            )}
            <ActionItem
              type="ask"
              text={`Ask in the interview: "How does leadership communicate major organizational changes before they hit the press?"`}
            />
            {eeocCases.length > 0 && (
              <ActionItem
                type="ask"
                text={`Ask: "I noticed ${eeocCases.length > 1 ? "multiple enforcement actions" : "an enforcement action"} in your company's record. What changed internally as a result?"`}
              />
            )}
            <ActionItem
              type="ask"
              text={`Ask: "What does stability look like for this team over the next 18–24 months?"`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActionItem({ type, text }: { type: "watch" | "check" | "ask"; text: string }) {
  const config = {
    watch: { icon: Eye, label: "WATCH", color: "text-civic-yellow" },
    check: { icon: CheckCircle2, label: "CHECK", color: "text-civic-blue" },
    ask: { icon: MessageSquare, label: "ASK", color: "text-civic-green" },
  };
  const { icon: Icon, label, color } = config[type];

  return (
    <div className="flex items-start gap-3 p-3 bg-background/60 border border-border/30 rounded-none">
      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
        <Icon className={cn("w-4 h-4", color)} />
        <span className={cn("font-mono text-xs font-bold tracking-wider", color)}>{label}</span>
      </div>
      <p className="text-sm text-foreground leading-snug">{text}</p>
    </div>
  );
}
