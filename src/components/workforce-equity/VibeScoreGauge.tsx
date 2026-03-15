import { cn } from "@/lib/utils";
import type { VibeScoreResult, VibeBand } from "@/lib/vibeScore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles, TrendingUp, TrendingDown, Minus,
  ShieldCheck, Shield, ShieldAlert, Heart, Users, Megaphone,
} from "lucide-react";

const bandStyles: Record<VibeBand, { bg: string; text: string; ring: string; bar: string }> = {
  thriving_culture:   { bg: "bg-civic-green/10",  text: "text-civic-green",      ring: "ring-civic-green/30",  bar: "bg-civic-green" },
  strong_signals:     { bg: "bg-primary/10",       text: "text-primary",          ring: "ring-primary/30",      bar: "bg-primary" },
  mixed_signals:      { bg: "bg-civic-yellow/10",  text: "text-civic-yellow",     ring: "ring-civic-yellow/30", bar: "bg-civic-yellow" },
  surface_level:      { bg: "bg-orange-500/10",    text: "text-orange-600",       ring: "ring-orange-500/30",   bar: "bg-orange-500" },
  vibe_check_failed:  { bg: "bg-destructive/10",   text: "text-destructive",      ring: "ring-destructive/30",  bar: "bg-destructive" },
};

const confidenceConfig = {
  High:   { icon: ShieldCheck, class: "text-civic-green" },
  Medium: { icon: Shield,      class: "text-civic-yellow" },
  Low:    { icon: ShieldAlert,  class: "text-muted-foreground" },
};

const pillarIcons: Record<string, typeof Users> = {
  "Leadership Equity": Users,
  "Employee Experience": Heart,
  "Social Commitment": Megaphone,
};

export function VibeScoreGauge({ result }: { result: VibeScoreResult }) {
  const style = bandStyles[result.band];
  const ConfIcon = confidenceConfig[result.confidence].icon;
  const TrendIcon = result.score >= 65 ? TrendingUp : result.score >= 40 ? Minus : TrendingDown;

  return (
    <Card className={cn("ring-1 overflow-hidden", style.bg, style.ring)}>
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className={cn("w-4 h-4", style.text)} />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Inclusive Vibe Score™
              </p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className={cn("text-5xl font-black tabular-nums tracking-tight", style.text)}>
                {result.score}
              </span>
              <span className="text-sm text-muted-foreground font-medium">/ 100</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={cn("gap-1.5 text-xs font-semibold", style.text)}>
              <TrendIcon className="w-3.5 h-3.5" />
              {result.label}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs">
              <ConfIcon className={cn("w-3.5 h-3.5", confidenceConfig[result.confidence].class)} />
              <span className="text-muted-foreground">{result.confidence} Confidence</span>
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div>
          <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", style.bar)}
              style={{ width: `${result.score}%` }}
            />
            {[30, 48, 65, 82].map((mark) => (
              <div
                key={mark}
                className="absolute top-0 h-full w-px bg-foreground/10"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground font-medium">
            <span>Failed</span>
            <span>Surface</span>
            <span>Mixed</span>
            <span>Strong</span>
            <span>Thriving</span>
          </div>
        </div>

        {/* Pillar breakdown */}
        <div className="grid grid-cols-3 gap-3">
          {result.breakdown.map((b) => {
            const Icon = pillarIcons[b.pillar] || Users;
            return (
              <div key={b.pillar} className="rounded-lg bg-background/60 border border-border/40 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-[10px] font-semibold text-muted-foreground truncate">{b.pillar}</p>
                </div>
                <p className={cn("text-xl font-bold tabular-nums", style.text)}>{b.raw}</p>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", style.bar)} style={{ width: `${b.raw}%` }} />
                </div>
                <p className="text-[9px] text-muted-foreground">{Math.round(b.weight * 100)}% weight → {b.weighted}</p>
              </div>
            );
          })}
        </div>

        {/* Methodology note */}
        <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
          The Inclusive Vibe Score™ measures whether inclusive leadership translates to equitable employee experience.
          It combines leadership demographics (40%), retention &amp; promotion patterns (35%), and public social commitments (25%).
        </p>
      </CardContent>
    </Card>
  );
}
