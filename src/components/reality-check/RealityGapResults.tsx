import type { RealityGapResult } from "@/lib/realityGapScore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Terminal, RotateCcw, TrendingUp, TrendingDown, Minus,
  ShieldCheck, ShieldAlert, Shield, AlertTriangle,
  BarChart3, Sparkles,
} from "lucide-react";

// ─── Band Styles ────────────────────────────────────────────────────────────

const bandStyles: Record<RealityGapResult["gapBand"], { bg: string; text: string; ring: string; bar: string }> = {
  aligned:                  { bg: "bg-civic-green/10",  text: "text-civic-green",  ring: "ring-civic-green/30",  bar: "bg-civic-green" },
  minor_gap:                { bg: "bg-civic-blue/10",   text: "text-civic-blue",   ring: "ring-civic-blue/30",   bar: "bg-civic-blue" },
  notable_gap:              { bg: "bg-civic-yellow/10", text: "text-civic-yellow", ring: "ring-civic-yellow/30", bar: "bg-civic-yellow" },
  significant_disconnect:   { bg: "bg-civic-yellow/10",   text: "text-civic-yellow",   ring: "ring-orange-500/30",   bar: "bg-civic-yellow" },
  reality_check:            { bg: "bg-destructive/10",  text: "text-destructive",  ring: "ring-destructive/30",  bar: "bg-destructive" },
};

const signalIcons = {
  aligned: ShieldCheck,
  caution: Shield,
  disconnect: ShieldAlert,
};

const signalColors = {
  aligned: "text-civic-green",
  caution: "text-civic-yellow",
  disconnect: "text-destructive",
};

const signalEmojis = {
  aligned: "🟢",
  caution: "🟡",
  disconnect: "🔴",
};

// ─── Vibe Variance Bar ─────────────────────────────────────────────────────

function VibeVarianceBar({ label, experience, publicData }: { label: string; experience: number; publicData: number }) {
  const gap = publicData - experience;
  const aboveExperience = gap > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground font-medium">{label}</span>
        <span className={cn("font-mono font-bold text-xs",
          Math.abs(gap) <= 15 ? "text-civic-green" : Math.abs(gap) <= 35 ? "text-civic-yellow" : "text-destructive"
        )}>
          {gap > 0 ? "+" : ""}{gap} gap
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Experience bar */}
        <div className="absolute top-0 left-0 w-full h-2.5 bg-muted/50 rounded-full overflow-hidden">
          <div className="h-full bg-civic-blue/60 rounded-full transition-all" style={{ width: `${experience}%` }} />
        </div>
        {/* Public data marker */}
        <div
          className="absolute top-0 h-2.5 w-0.5 bg-civic-green rounded-full"
          style={{ left: `${publicData}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground font-mono">
        <span>Your Experience: {experience}</span>
        <span>Public Data: {publicData}</span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface Props {
  result: RealityGapResult;
  onReset: () => void;
}

export function RealityGapResults({ result, onReset }: Props) {
  const style = bandStyles[result.gapBand];
  const GapIcon = result.integrityGapScore <= 25 ? TrendingUp : result.integrityGapScore >= 50 ? TrendingDown : Minus;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header scores */}
      <div className="grid grid-cols-2 gap-4">
        {/* Overall Vibe Score */}
        <Card className="border-civic-green/20 bg-civic-green/[0.03]">
          <CardContent className="p-5 text-center">
            <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-2">Your Interview Experience</p>
            <p className="text-4xl font-black tabular-nums text-civic-green">{result.overallVibeScore}</p>
            <p className="text-xs text-muted-foreground mt-1">/ 100</p>
          </CardContent>
        </Card>

        {/* Integrity Gap Score */}
        <Card className={cn("ring-1", style.bg, style.ring)}>
          <CardContent className="p-5 text-center">
            <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-2">Stance-Record Gap</p>
            <p className={cn("text-4xl font-black tabular-nums", style.text)}>{result.integrityGapScore}</p>
            <Badge variant="outline" className={cn("mt-2 gap-1 text-xs", style.text)}>
              <GapIcon className="w-3 h-3" />
              {result.gapLabel}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Integrity Gap bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-civic-green" />
            <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-civic-green">Stance-Record Scale</h3>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-700", style.bar)} style={{ width: `${result.integrityGapScore}%` }} />
            {[10, 25, 40, 60].map((mark) => (
              <div key={mark} className="absolute top-0 h-full w-px bg-foreground/10" style={{ left: `${mark}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground font-mono">
            <span>Aligned</span>
            <span>Minor</span>
            <span>Notable</span>
            <span>Disconnect</span>
            <span>Reality Check</span>
          </div>
        </CardContent>
      </Card>

      {/* Vibe Variance Chart */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-civic-green" />
            <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-civic-green">Experience vs. Record</h3>
            <span className="text-xs text-muted-foreground ml-auto font-mono">Public Data vs. Your Experience</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-civic-blue/60 rounded-sm" /> Your Experience</span>
            <span className="flex items-center gap-1.5"><span className="w-0.5 h-3 bg-civic-green rounded-sm" /> Public Data</span>
          </div>
          <div className="space-y-5">
            {result.dimensions.map((d) => (
              <VibeVarianceBar
                key={d.dimension}
                label={d.dimension}
                experience={d.experienceScore}
                publicData={d.publicDataScore}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dimension Analysis */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-4 h-4 text-civic-green" />
            <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-civic-green">Pattern Analysis</h3>
          </div>
          <div className="space-y-3">
            {result.dimensions.map((d) => {
              const SignalIcon = signalIcons[d.signal];
              return (
                <div key={d.dimension} className="border border-border/40 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{signalEmojis[d.signal]}</span>
                    <span className="text-xs font-semibold text-foreground">{d.dimension}</span>
                    <Badge variant="outline" className={cn("ml-auto text-xs gap-1", signalColors[d.signal])}>
                      <SignalIcon className="w-3 h-3" />
                      {d.signal === "aligned" ? "Aligned" : d.signal === "caution" ? "Caution" : "Disconnect"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">{d.insight}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Jackye's Take */}
      <Card className="border-civic-green/30 bg-civic-green/[0.03]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-civic-green" />
            <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-civic-green">What the Pattern Tends to Mean</h3>
          </div>
          <blockquote className="border-l-2 border-civic-green pl-4 py-2 text-sm text-foreground leading-relaxed">
            {result.integrityGapScore <= 15
              ? "What is visible: Your experience and the public record are telling the same story. That level of consistency is uncommon and worth noting. It does not guarantee everything is perfect, but it means the signals are aligned across layers. What to pay attention to: Consistency in process does not always mean consistency in practice. If you move forward, negotiation is still separate from culture fit."
              : result.integrityGapScore <= 35
              ? "What is visible: There is a small gap between the public record and what you experienced. Some variance is normal. No organization presents identically at every level. What it tends to mean: The gap is narrow enough that it may reflect individual variation rather than a systemic pattern. What to pay attention to: The specific dimensions where the gap appeared. Those are the areas worth revisiting in a follow-up conversation."
              : result.integrityGapScore <= 55
              ? "What is visible: There is a noticeable distance between how this company presents publicly and what came through in your interview. What it tends to mean: When the gap sits in this range, it often reflects a disconnect between policy-level commitments and manager-level execution. The organization may have invested in positioning without fully operationalizing it. What to pay attention to: Whether the role expects you to close that gap yourself. That is a different job than the one on the posting."
              : "What is visible: Your interview experience and the public record are telling meaningfully different stories. What it tends to mean: A gap this wide tends to reflect a structural pattern, not an off day. The public-facing narrative and the internal operating culture appear to have diverged. This pattern, when repeated, tends to create environments where expectations are unclear and accountability is inconsistent. What to pay attention to: Whether you have the information you need to make a decision you can stand behind."
            }
          </blockquote>
          <p className="text-xs text-muted-foreground mt-3 font-mono italic">
            Pattern observed. Decision is yours.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onReset} className="gap-2 font-mono text-xs tracking-wider uppercase">
          <RotateCcw className="w-3.5 h-3.5" />
          New Reality Check
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/ask-jackye"}
          className="gap-2 font-mono text-xs tracking-wider uppercase"
        >
          <Terminal className="w-3.5 h-3.5" />
          Ask the Advisor
        </Button>
      </div>
    </div>
  );
}
