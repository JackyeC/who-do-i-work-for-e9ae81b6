import { Shield, AlertTriangle, Search, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type RecommendationLevel = "apply" | "dig_deeper" | "watch" | "walk_away";

interface RecommendationCardProps {
  redFlagCount: number;
  gapCount: number;
  eeocCount: number;
  signalCount: number;
  hasValuesConflicts: boolean;
  companyName: string;
}

const RECS: Record<RecommendationLevel, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = {
  walk_away: {
    label: "WALK AWAY",
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/40",
  },
  watch: {
    label: "WATCH THIS ONE",
    icon: AlertTriangle,
    color: "text-civic-yellow",
    bg: "bg-civic-yellow/10",
    border: "border-civic-yellow/40",
  },
  dig_deeper: {
    label: "DIG DEEPER",
    icon: Search,
    color: "text-civic-blue",
    bg: "bg-civic-blue/10",
    border: "border-civic-blue/40",
  },
  apply: {
    label: "PROCEED WITH CONFIDENCE",
    icon: CheckCircle2,
    color: "text-civic-green",
    bg: "bg-civic-green/10",
    border: "border-civic-green/40",
  },
};

export function computeRecommendation(
  redFlagCount: number,
  gapCount: number,
  eeocCount: number,
  signalCount: number,
  hasValuesConflicts: boolean,
): RecommendationLevel {
  const severity = redFlagCount + (gapCount >= 3 ? 2 : gapCount >= 1 ? 1 : 0) + (eeocCount >= 2 ? 2 : eeocCount >= 1 ? 1 : 0) + (hasValuesConflicts ? 1 : 0);
  if (severity >= 5) return "walk_away";
  if (severity >= 3) return "watch";
  if (severity >= 1 || signalCount > 5) return "dig_deeper";
  return "apply";
}

function buildReasoning(
  level: RecommendationLevel,
  { redFlagCount, gapCount, eeocCount, signalCount, hasValuesConflicts, companyName }: RecommendationCardProps,
): string {
  const parts: string[] = [];
  if (level === "apply") {
    return `Based on the public record we've reviewed, ${companyName} shows a relatively clean track. No major enforcement actions, no large integrity gaps, and no obvious conflicts with the signals we track. That doesn't mean perfect — it means the receipts we have are clean.`;
  }
  if (redFlagCount > 0) parts.push(`${redFlagCount} red flag${redFlagCount > 1 ? "s" : ""} in spending or enforcement records`);
  if (gapCount > 0) parts.push(`${gapCount} integrity gap${gapCount > 1 ? "s" : ""} between public claims and the record`);
  if (eeocCount > 0) parts.push(`${eeocCount} EEOC enforcement action${eeocCount > 1 ? "s" : ""}`);
  if (hasValuesConflicts) parts.push("conflicts with your stated values");
  if (signalCount > 5) parts.push(`${signalCount} active signals across categories`);

  const joined = parts.join(", ");
  if (level === "walk_away") return `The record on ${companyName} shows serious concerns: ${joined}. This is the kind of employer where the risk outweighs the opportunity unless you have very specific reasons to proceed.`;
  if (level === "watch") return `${companyName} has enough on the record to warrant caution: ${joined}. Not a dealbreaker, but go in with your eyes open and ask the hard questions.`;
  return `${companyName} has mixed signals: ${joined}. Worth investigating further before making a decision. Use the interview prep below to dig into the specifics.`;
}

export function RecommendationCard(props: RecommendationCardProps) {
  const level = computeRecommendation(props.redFlagCount, props.gapCount, props.eeocCount, props.signalCount, props.hasValuesConflicts);
  const rec = RECS[level];
  const Icon = rec.icon;
  const reasoning = buildReasoning(level, props);

  return (
    <Card className={cn("rounded-none border-2", rec.bg, rec.border)}>
      <CardContent className="p-6 md:p-8">
        <div className="flex items-start gap-4">
          <Icon className={cn("w-8 h-8 shrink-0 mt-1", rec.color)} />
          <div className="flex-1">
            <p className="font-mono text-xs tracking-[0.3em] uppercase text-muted-foreground mb-1">THE CALL</p>
            <h2 className={cn("text-xl md:text-2xl font-black tracking-tight mb-3", rec.color)}>
              {rec.label}
            </h2>
            <p className="text-sm text-foreground/85 leading-relaxed">{reasoning}</p>
            <p className="mt-4 text-xs text-muted-foreground italic">
              This is a signal-based interpretation, not legal or career advice. Review the evidence above and make the call that's right for you.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
