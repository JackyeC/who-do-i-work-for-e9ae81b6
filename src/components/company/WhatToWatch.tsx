import { useMemo } from "react";
import { Eye, TrendingDown, TrendingUp, AlertTriangle, Users, DollarSign, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
  icon: typeof Eye;
  signal: string;
  severity: "info" | "caution" | "risk";
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
  const watchItems = useMemo<WatchItem[]>(() => {
    const items: WatchItem[] = [];

    // Workforce signals
    if (hasLayoffSignals || hasWarnNotices) {
      items.push({
        icon: TrendingDown,
        signal: "Active workforce reduction signals detected — monitor for stability.",
        severity: "risk",
      });
    }

    if (hasAiHrSignals) {
      items.push({
        icon: Shield,
        signal: "AI-driven hiring tools in use — check for bias audit disclosures.",
        severity: "caution",
      });
    }

    if (!hasPayEquity) {
      items.push({
        icon: DollarSign,
        signal: "No public pay equity disclosures found — compensation transparency is limited.",
        severity: "caution",
      });
    }

    // Leadership signals
    if (executiveCount > 0 && revolvingDoorCount > 0) {
      items.push({
        icon: Users,
        signal: `${revolvingDoorCount} revolving-door connection${revolvingDoorCount > 1 ? "s" : ""} between government and corporate leadership.`,
        severity: "caution",
      });
    }

    // Influence signals
    if (totalPacSpending > 500000) {
      items.push({
        icon: DollarSign,
        signal: `Significant PAC spending ($${(totalPacSpending / 1000).toFixed(0)}K+) — review recipient alignment with your values.`,
        severity: "info",
      });
    }

    if (lobbyingSpend > 1000000) {
      items.push({
        icon: TrendingUp,
        signal: `Active lobbying presence ($${(lobbyingSpend / 1000000).toFixed(1)}M+) — review policy areas being influenced.`,
        severity: "info",
      });
    }

    if (darkMoneyCount > 0) {
      items.push({
        icon: AlertTriangle,
        signal: `${darkMoneyCount} undisclosed or indirect funding channel${darkMoneyCount > 1 ? "s" : ""} detected.`,
        severity: "risk",
      });
    }

    if (!hasSentimentData) {
      items.push({
        icon: Eye,
        signal: "Limited employee sentiment data available — consider reaching out to current employees.",
        severity: "info",
      });
    }

    if (!hasJobPostings) {
      items.push({
        icon: Eye,
        signal: "No active job postings detected — may indicate hiring freeze or unlisted roles.",
        severity: "info",
      });
    }

    // Always include at least one
    if (items.length === 0) {
      items.push({
        icon: Eye,
        signal: "No major risk signals detected. Continue monitoring for changes.",
        severity: "info",
      });
    }

    return items.slice(0, 6);
  }, [
    hasLayoffSignals, hasWarnNotices, hasPayEquity, hasBenefitsData,
    hasAiHrSignals, hasSentimentData, hasJobPostings, executiveCount,
    revolvingDoorCount, totalPacSpending, lobbyingSpend, darkMoneyCount,
  ]);

  const severityColors = {
    info: "text-[hsl(var(--civic-blue))]",
    caution: "text-[hsl(var(--civic-yellow))]",
    risk: "text-destructive",
  };

  const severityBg = {
    info: "bg-[hsl(var(--civic-blue))]/5",
    caution: "bg-[hsl(var(--civic-yellow))]/5",
    risk: "bg-destructive/5",
  };

  return (
    <section className="mb-6">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground bg-muted px-2 py-0.5">
              07
            </div>
            <Eye className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <h3 className="font-mono text-sm tracking-wider uppercase text-foreground font-semibold">
              What to Watch
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Key patterns and signals worth monitoring for {companyName}.
          </p>
          <div className="space-y-2">
            {watchItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 ${severityBg[item.severity]} rounded-none border border-transparent`}
              >
                <item.icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${severityColors[item.severity]}`}
                  strokeWidth={1.5}
                />
                <p className="text-sm text-foreground leading-relaxed">
                  {item.signal}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
