import { useMemo } from "react";
import { MessageSquareWarning, TrendingDown, DollarSign, Shield, Users, AlertTriangle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddYourStoryCTA } from "@/components/AddYourStoryCTA";
import { cn } from "@/lib/utils";

interface JackyeNoteProps {
  companyName: string;
  industry: string;
  totalPacSpending: number;
  lobbyingSpend: number;
  governmentContracts: number;
  darkMoneyCount: number;
  revolvingDoorCount: number;
  executiveCount: number;
  boardMemberCount: number;
  hasLayoffSignals: boolean;
  hasSentimentData: boolean;
  hasPayEquity: boolean;
  hasBenefitsData: boolean;
  hasAiHrSignals: boolean;
  isPubliclyTraded: boolean;
  transparencyScore: number;
  civicFootprintScore: number;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toLocaleString()}`;
  return "$0";
}

export function JackyeNote(props: JackyeNoteProps) {
  const { companyName } = props;

  const receipts = useMemo(() => {
    const items: { text: string; icon: typeof DollarSign }[] = [];

    if (props.totalPacSpending > 0) {
      items.push({ text: `${formatMoney(props.totalPacSpending)} in PAC spending on record`, icon: DollarSign });
    }
    if (props.lobbyingSpend > 0) {
      items.push({ text: `${formatMoney(props.lobbyingSpend)} in lobbying expenditures documented`, icon: DollarSign });
    }
    if (props.governmentContracts > 0) {
      items.push({ text: `${props.governmentContracts} government contract(s) identified`, icon: Shield });
    }
    if (props.darkMoneyCount > 0) {
      items.push({ text: `${props.darkMoneyCount} dark money connection(s) detected`, icon: AlertTriangle });
    }
    if (props.revolvingDoorCount > 0) {
      items.push({ text: `${props.revolvingDoorCount} revolving door connection(s) flagged`, icon: Users });
    }
    if (props.hasAiHrSignals) {
      items.push({ text: "AI hiring tools detected — audit status pending", icon: Eye });
    }
    if (!props.hasPayEquity) {
      items.push({ text: "No public pay equity data found", icon: TrendingDown });
    }
    if (!props.hasBenefitsData) {
      items.push({ text: "No public benefits data found", icon: TrendingDown });
    }

    return items;
  }, [props]);

  const blurb = useMemo(() => {
    const parts: string[] = [];

    if (props.isPubliclyTraded) {
      parts.push(`${companyName} is a publicly traded company in the ${props.industry} sector.`);
    } else {
      parts.push(`${companyName} operates in the ${props.industry} sector.`);
    }

    if (props.totalPacSpending > 0 || props.lobbyingSpend > 0) {
      const moneyParts: string[] = [];
      if (props.totalPacSpending > 0) moneyParts.push(`${formatMoney(props.totalPacSpending)} in PAC contributions`);
      if (props.lobbyingSpend > 0) moneyParts.push(`${formatMoney(props.lobbyingSpend)} in lobbying`);
      parts.push(`Public records show ${moneyParts.join(" and ")}.`);
    }

    if (props.darkMoneyCount > 0 || props.revolvingDoorCount > 0) {
      const connParts: string[] = [];
      if (props.darkMoneyCount > 0) connParts.push(`${props.darkMoneyCount} dark money connection(s)`);
      if (props.revolvingDoorCount > 0) connParts.push(`${props.revolvingDoorCount} revolving door link(s)`);
      parts.push(`We've identified ${connParts.join(" and ")} in the public record.`);
    }

    const gaps: string[] = [];
    if (!props.hasPayEquity) gaps.push("pay equity reporting");
    if (!props.hasBenefitsData) gaps.push("public benefits data");
    if (!props.hasSentimentData) gaps.push("workforce sentiment data");
    if (gaps.length > 0) {
      parts.push(`Gaps exist in ${gaps.join(", ")}.`);
    }

    parts.push("The signals below are sourced from public filings, federal databases, and open records. No judgment, just receipts.");

    return parts.join(" ");
  }, [companyName, props]);

  if (receipts.length === 0 && props.transparencyScore > 70) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border-2 border-primary/20 bg-primary/[0.03] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-primary/10 bg-primary/[0.04]">
        <MessageSquareWarning className="w-4.5 h-4.5 text-primary shrink-0" />
        <span className="text-sm font-bold text-foreground tracking-tight">Insider's Brief</span>
        <Badge variant="outline" className="text-[9px] font-mono tracking-wider border-primary/20 text-primary ml-auto">
          SIGNAL SUMMARY
        </Badge>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-foreground/90 leading-relaxed">
          {blurb}
        </p>

        {receipts.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {receipts.map((r, i) => {
              const Icon = r.icon;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 border border-border/50 rounded-md px-2 py-1"
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  {r.text}
                </span>
              );
            })}
          </div>
        )}

        {/* Add Your Story CTA for employers */}
        <AddYourStoryCTA />

        <p className="text-[10px] text-muted-foreground/60 italic pt-1">
          This summary is auto-generated from public data signals — not editorial opinion. A signal is not a verdict.
        </p>
      </div>
    </div>
  );
}
