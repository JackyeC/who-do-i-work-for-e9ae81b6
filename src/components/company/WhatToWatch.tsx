import { AlertTriangle, TrendingDown, DollarSign, Users, Brain, MessageSquare, Briefcase, Building2 } from "lucide-react";

interface WhatToWatchProps {
  companyName: string;
  hasLayoffSignals: boolean;
  hasWarnNotices: boolean;
  hasPayEquity: boolean;
  hasBenefitsData: boolean;
  hasAiHrSignals: boolean;
  hasSentimentData: boolean;
  hasJobPostings: boolean;
  executiveCount: number;
  revolvingDoorCount: number;
  totalPacSpending: number;
  lobbyingSpend: number;
  darkMoneyCount: number;
}

interface WatchItem {
  icon: React.ReactNode;
  label: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export function WhatToWatch({
  companyName,
  hasLayoffSignals,
  hasWarnNotices,
  hasPayEquity,
  hasBenefitsData,
  hasAiHrSignals,
  hasSentimentData,
  hasJobPostings,
  executiveCount,
  revolvingDoorCount,
  totalPacSpending,
  lobbyingSpend,
  darkMoneyCount,
}: WhatToWatchProps) {
  const items: WatchItem[] = [];

  if (hasLayoffSignals || hasWarnNotices) {
    items.push({
      icon: <TrendingDown className="w-4 h-4" />,
      label: "Workforce instability signals",
      detail: `${companyName} has recent layoff or WARN Act activity. Monitor headcount trends before committing.`,
      severity: "high",
    });
  }

  if (totalPacSpending > 500000 || lobbyingSpend > 1000000) {
    items.push({
      icon: <DollarSign className="w-4 h-4" />,
      label: "Heavy political spending",
      detail: `Significant PAC contributions or lobbying spend detected. Review where money is going and who benefits.`,
      severity: "high",
    });
  }

  if (darkMoneyCount > 0) {
    items.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      label: "Dark money connections",
      detail: `${darkMoneyCount} undisclosed or opaque funding link${darkMoneyCount > 1 ? "s" : ""} detected. Transparency is limited.`,
      severity: "high",
    });
  }

  if (revolvingDoorCount > 2) {
    items.push({
      icon: <Building2 className="w-4 h-4" />,
      label: "Revolving door concentration",
      detail: `${revolvingDoorCount} leaders with government-to-corporate transitions. Consider regulatory capture risk.`,
      severity: "medium",
    });
  }

  if (hasAiHrSignals) {
    items.push({
      icon: <Brain className="w-4 h-4" />,
      label: "AI in hiring or HR",
      detail: `Automated decision-making signals detected. Ask about bias audits and human oversight.`,
      severity: "medium",
    });
  }

  if (!hasPayEquity) {
    items.push({
      icon: <Users className="w-4 h-4" />,
      label: "No pay equity data available",
      detail: `No public pay equity disclosures found. This doesn't mean a gap exists — but transparency is absent.`,
      severity: "low",
    });
  }

  if (!hasSentimentData) {
    items.push({
      icon: <MessageSquare className="w-4 h-4" />,
      label: "Limited worker sentiment data",
      detail: `Insufficient employee reviews to establish sentiment patterns. Proceed with direct questions.`,
      severity: "low",
    });
  }

  if (!hasJobPostings) {
    items.push({
      icon: <Briefcase className="w-4 h-4" />,
      label: "No active job postings detected",
      detail: `No current openings found in our scan. The role may be unlisted or filled through other channels.`,
      severity: "low",
    });
  }

  if (items.length === 0) {
    return null;
  }

  const severityColor = {
    high: "text-destructive border-destructive/30 bg-destructive/5",
    medium: "text-amber-500 border-amber-500/30 bg-amber-500/5",
    low: "text-muted-foreground border-border bg-muted/30",
  };

  return (
    <section className="space-y-4">
      <div>
        <p className="font-mono text-xs text-primary tracking-wider uppercase mb-1">
          What to Watch
        </p>
        <h2 className="font-sans text-xl font-bold text-foreground">
          Signals worth monitoring at {companyName}
        </h2>
      </div>

      <div className="grid gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-md border ${severityColor[item.severity]}`}
          >
            <div className="mt-0.5 shrink-0">{item.icon}</div>
            <div>
              <p className="font-sans text-sm font-semibold">{item.label}</p>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
