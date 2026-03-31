import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReportTeaserGate } from "@/components/ReportTeaserGate";
import { PerceptionGapScore, getScoreConfig } from "./PerceptionGapScore";
import { JackyesTake } from "./JackyesTake";
import { Scale, CheckCircle2, AlertTriangle, XCircle, Eye, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerceptionGapModuleProps {
  companyId: string;
  companyName: string;
  updatedAt?: string;
  onAskJackye?: () => void;
}

type GapLevel = "aligned" | "mixed" | "medium" | "large";

interface Stance {
  id: string;
  topic: string;
  public_position: string;
  spending_reality: string;
  gap: string;
}

function getRecency(updatedAt?: string): string {
  if (!updatedAt) return "Unknown";
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000);
  if (days <= 30) return "Last 30 days";
  if (days <= 60) return "Last 60 days";
  return "6+ months";
}

function gapConfig(gap: string) {
  switch (gap) {
    case "large":
      return {
        icon: XCircle,
        label: "High Risk",
        color: "text-destructive",
        bg: "bg-destructive/10 text-destructive border-destructive/30",
        border: "border-l-destructive/60",
        weight: 90,
      };
    case "medium":
      return {
        icon: AlertTriangle,
        label: "Medium Gap",
        color: "text-[hsl(var(--civic-yellow))]",
        bg: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
        border: "border-l-[hsl(var(--civic-yellow))]/60",
        weight: 55,
      };
    case "mixed":
      return {
        icon: AlertTriangle,
        label: "Mixed Signals",
        color: "text-[hsl(var(--civic-yellow))]",
        bg: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
        border: "border-l-[hsl(var(--civic-yellow))]/40",
        weight: 35,
      };
    default:
      return {
        icon: CheckCircle2,
        label: "Aligned",
        color: "text-[hsl(var(--civic-green))]",
        bg: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
        border: "border-l-[hsl(var(--civic-green))]/40",
        weight: 10,
      };
  }
}

function calculatePerceptionGapScore(stances: Stance[]): number {
  if (stances.length === 0) return 0;
  const total = stances.reduce((sum, s) => sum + gapConfig(s.gap).weight, 0);
  return Math.round(total / stances.length);
}

function generateJackyeTake(score: number, companyName: string, stances: Stance[]): string {
  const largeGaps = stances.filter((s) => s.gap === "large");
  const mediumGaps = stances.filter((s) => s.gap === "medium" || s.gap === "mixed");

  if (score >= 70) {
    return `${companyName} is saying the right things. The problem is what's showing up underneath. When the gap between brand and behavior is this wide, you're not evaluating a company — you're evaluating their marketing team.`;
  }
  if (score >= 40) {
    const topic = largeGaps[0]?.topic || mediumGaps[0]?.topic || "key areas";
    return `There's enough here to pause on. The signals around ${topic.toLowerCase()} don't fully match what ${companyName} is putting out there. That doesn't mean walk away — it means walk in with your eyes open.`;
  }
  if (score >= 20) {
    return `${companyName} is mostly tracking. A few things are worth watching, but nothing here screams misalignment. Keep your questions sharp during interviews and you'll be fine.`;
  }
  return `What ${companyName} says and what's showing up are largely in sync. That's increasingly rare. This doesn't mean perfect — it means the gap between promise and proof is small.`;
}

function GapRow({ stance }: { stance: Stance }) {
  const config = gapConfig(stance.gap);
  const Icon = config.icon;

  return (
    <div className={cn("px-5 py-4 border-l-2", config.border)}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-3.5 h-3.5 shrink-0", config.color)} />
          <span className="text-xs font-medium text-foreground uppercase tracking-wider">
            {stance.topic}
          </span>
        </div>
        <Badge className={cn("text-xs shrink-0", config.bg)}>{config.label}</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
            What you're being sold
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">{stance.public_position}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
            What's actually showing up
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">{stance.spending_reality}</p>
        </div>
      </div>
    </div>
  );
}

export function PerceptionGapModule({
  companyId,
  companyName,
  updatedAt,
  onAskJackye,
}: PerceptionGapModuleProps) {
  const { data: stances } = useQuery({
    queryKey: ["perception-gap", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_public_stances")
        .select("*")
        .eq("company_id", companyId);
      return (data || []) as Stance[];
    },
    enabled: !!companyId,
  });

  if (!stances || stances.length === 0) return null;

  const recency = getRecency(updatedAt);
  const gapOrder: Record<string, number> = { large: 0, medium: 1, mixed: 2, aligned: 3 };
  const sorted = [...stances].sort((a, b) => (gapOrder[a.gap] ?? 4) - (gapOrder[b.gap] ?? 4));

  const perceptionScore = calculatePerceptionGapScore(sorted);
  const scoreConfig = getScoreConfig(perceptionScore);
  const gapCount = sorted.filter((s) => s.gap !== "aligned").length;
  const hasGaps = gapCount > 0;

  const freeStances = sorted.slice(0, 3);
  const gatedStances = sorted.slice(3);

  const jackyeTake = generateJackyeTake(perceptionScore, companyName, sorted);

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              Perception Gap™
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasGaps && (
              <Badge
                variant="outline"
                className={cn("text-xs font-mono tracking-wider", scoreConfig.color)}
              >
                {gapCount} gap{gapCount !== 1 ? "s" : ""} detected
              </Badge>
            )}
            <Badge variant="outline" className="text-xs font-mono tracking-wider">
              Data: {recency}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          What they said vs what's actually showing up.
        </p>
      </div>

      {/* Score + Summary */}
      <div className="px-5 py-4 flex items-start gap-5 border-b border-border/30">
        <PerceptionGapScore score={perceptionScore} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Perception Gap Score
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">{scoreConfig.description}</p>
        </div>
      </div>

      {/* Why This Feels Right (But Might Not Be) — only for high gaps */}
      {perceptionScore >= 50 && (
        <div className="px-5 py-3 bg-destructive/[0.03] border-b border-border/30">
          <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">
            Why This Feels Right (But Might Not Be)
          </p>
          <p className="text-xs text-foreground/75 leading-relaxed">
            This company presents a strong identity that feels authentic. But authenticity ≠ accuracy.
            Here's where perception may be shaping your decision.
          </p>
        </div>
      )}

      {/* Gap Rows */}
      <div className="divide-y divide-border/30">
        {freeStances.map((stance) => (
          <GapRow key={stance.id} stance={stance} />
        ))}
      </div>

      {/* Gated rows */}
      {gatedStances.length > 0 && (
        <ReportTeaserGate
          companyName={companyName}
          teaser={
            <p className="text-xs text-muted-foreground px-5 pb-3">
              +{gatedStances.length} more comparison{gatedStances.length > 1 ? "s" : ""} available
            </p>
          }
          hiddenSignalCount={gatedStances.length}
        >
          <div className="divide-y divide-border/30">
            {gatedStances.map((stance) => (
              <GapRow key={stance.id} stance={stance} />
            ))}
          </div>
        </ReportTeaserGate>
      )}

      {/* Jackye's Take */}
      <JackyesTake
        text={jackyeTake}
        gapScore={perceptionScore}
        isDecisionPoint={false}
      />

      {/* CTA: Still deciding? */}
      {onAskJackye && (
        <div className="px-5 py-4 bg-primary/[0.03] border-t border-border/30">
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground mb-1">
              Still deciding? Run it by me.
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              If something feels off but you can't explain why — that's exactly where I come in.
            </p>
            <button
              onClick={onAskJackye}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 font-mono text-xs tracking-wider uppercase font-semibold hover:brightness-110 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Ask Jackye
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-5 py-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground text-center italic">
          Signals do not imply wrongdoing. Data reflects public records and may be incomplete.
        </p>
      </div>
    </div>
  );
}
