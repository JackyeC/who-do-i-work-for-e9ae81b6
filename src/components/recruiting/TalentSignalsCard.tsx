import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Users, Shield, Briefcase, Building2 } from "lucide-react";

interface TalentSignal {
  type: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  source?: string;
}

interface TalentSignalsCardProps {
  companyName: string;
  warnNotices?: any[];
  hiringSignals?: any[];
  benefitsSignals?: any[];
  publicStances?: any[];
  executiveCount?: number;
}

export function TalentSignalsCard({
  companyName,
  warnNotices = [],
  hiringSignals = [],
  benefitsSignals = [],
  publicStances = [],
  executiveCount = 0,
}: TalentSignalsCardProps) {
  const signals: TalentSignal[] = [];

  // Layoff signals from WARN notices
  if (warnNotices.length > 0) {
    const totalAffected = warnNotices.reduce((s: number, w: any) => s + (w.number_affected || 0), 0);
    signals.push({
      type: "Layoffs",
      title: "Recent Layoff Activity",
      detail: `${warnNotices.length} WARN notice(s) filed affecting ${totalAffected.toLocaleString()} workers`,
      severity: warnNotices.length >= 3 ? "high" : "medium",
      source: "WARN Act filings",
    });
  }

  // AI hiring concerns
  const biasSignals = hiringSignals.filter((h: any) => h.signal_type === "ai_screening" || h.category === "bias_risk");
  if (biasSignals.length > 0) {
    signals.push({
      type: "AI Hiring",
      title: "AI Hiring Tool Detected",
      detail: `${biasSignals.length} AI screening signal(s) — candidates may face automated filtering`,
      severity: "medium",
      source: "AI hiring audit",
    });
  }

  // DEI program signals
  const deiStances = publicStances.filter((s: any) =>
    s.topic?.toLowerCase().includes("diversity") || s.topic?.toLowerCase().includes("dei") || s.topic?.toLowerCase().includes("equity")
  );
  const deiGaps = deiStances.filter((s: any) => s.gap !== "none");
  if (deiGaps.length > 0) {
    signals.push({
      type: "DEI",
      title: "DEI Commitment Gaps",
      detail: `${deiGaps.length} gap(s) between public DEI statements and actual spending`,
      severity: "medium",
      source: "Public stance analysis",
    });
  }

  // Benefits & retention signals
  const negativeBenefits = benefitsSignals.filter((b: any) => b.sentiment === "negative");
  if (negativeBenefits.length > 0) {
    signals.push({
      type: "Retention",
      title: "Negative Benefit Signals",
      detail: `${negativeBenefits.length} negative workforce signal(s) detected in ${negativeBenefits.map((b: any) => b.benefit_category).slice(0, 3).join(", ")}`,
      severity: negativeBenefits.length >= 3 ? "high" : "low",
      source: "Worker benefits scan",
    });
  }

  // Leadership stability
  if (executiveCount === 0) {
    signals.push({
      type: "Leadership",
      title: "No Public Leadership Data",
      detail: "No executive records found — may indicate limited transparency or recent restructuring",
      severity: "low",
      source: "Public records",
    });
  }

  if (signals.length === 0) {
    signals.push({
      type: "Status",
      title: "No Major Talent Signals",
      detail: "No significant recruiting risk signals detected from public data",
      severity: "low",
    });
  }

  const severityIcon = (s: string) => {
    if (s === "high") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (s === "medium") return <Shield className="w-4 h-4 text-civic-yellow" />;
    return <Briefcase className="w-4 h-4 text-muted-foreground" />;
  };

  const severityBadge = (s: string) =>
    s === "high" ? "bg-destructive/10 text-destructive border-destructive/20" :
    s === "medium" ? "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20" :
    "bg-muted text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Talent Signals — {companyName}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Signals that may affect recruiting, retention, and talent attraction
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {signals.map((s, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            {severityIcon(s.severity)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-foreground">{s.title}</span>
                <Badge className={`text-xs ${severityBadge(s.severity)}`}>{s.type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{s.detail}</p>
              {s.source && <p className="text-xs text-muted-foreground/60 mt-1">Source: {s.source}</p>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
