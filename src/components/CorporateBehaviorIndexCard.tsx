import { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, TrendingUp, DollarSign, Landmark, Brain, ChevronRight, AlertTriangle, CheckCircle2, MinusCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CBIResult, CBICategoryScore } from "@/lib/corporateBehaviorIndex";

const CATEGORY_ICONS: Record<string, any> = {
  workforce_stability: Shield,
  career_mobility: TrendingUp,
  pay_transparency: DollarSign,
  governance: Landmark,
  hr_tech_ethics: Brain,
};

const BAND_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  exemplary: { bg: "bg-[hsl(var(--civic-green))]/10", text: "text-[hsl(var(--civic-green))]", border: "border-[hsl(var(--civic-green))]/30", glow: "shadow-[0_0_20px_hsl(var(--civic-green)/0.15)]" },
  responsible: { bg: "bg-[hsl(var(--civic-blue))]/10", text: "text-[hsl(var(--civic-blue))]", border: "border-[hsl(var(--civic-blue))]/30", glow: "shadow-[0_0_20px_hsl(var(--civic-blue)/0.15)]" },
  mixed: { bg: "bg-[hsl(var(--civic-yellow))]/10", text: "text-[hsl(var(--civic-yellow))]", border: "border-[hsl(var(--civic-yellow))]/30", glow: "shadow-[0_0_20px_hsl(var(--civic-yellow)/0.15)]" },
  concerning: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30", glow: "shadow-[0_0_20px_hsl(var(--destructive)/0.15)]" },
  opaque: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", glow: "" },
};

function ScoreRing({ score, size = 120, band }: { score: number; size?: number; band: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const style = BAND_STYLES[band] || BAND_STYLES.opaque;

  const strokeColor = band === "exemplary" ? "hsl(var(--civic-green))"
    : band === "responsible" ? "hsl(var(--civic-blue))"
    : band === "mixed" ? "hsl(var(--civic-yellow))"
    : band === "concerning" ? "hsl(var(--destructive))"
    : "hsl(var(--muted-foreground))";

  return (
    <div className={cn("relative inline-flex items-center justify-center", style.glow)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn("text-3xl font-bold tabular-nums font-display", style.text)}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">/ 100</span>
      </div>
    </div>
  );
}

function CategoryBar({ category }: { category: CBICategoryScore }) {
  const Icon = CATEGORY_ICONS[category.key] || Shield;
  const barColor = category.score >= 70 ? "bg-[hsl(var(--civic-green))]"
    : category.score >= 50 ? "bg-[hsl(var(--civic-blue))]"
    : category.score >= 35 ? "bg-[hsl(var(--civic-yellow))]"
    : "bg-destructive";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{category.name}</span>
        </div>
        <span className="text-sm font-bold tabular-nums text-foreground">{category.score}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${category.score}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        />
      </div>
    </div>
  );
}

function SignalList({ category }: { category: CBICategoryScore }) {
  return (
    <div className="space-y-1">
      {category.signals.map((signal, i) => {
        const Icon = signal.impact === "positive" ? CheckCircle2 : signal.impact === "negative" ? AlertTriangle : MinusCircle;
        const color = signal.impact === "positive" ? "text-[hsl(var(--civic-green))]" : signal.impact === "negative" ? "text-destructive" : "text-muted-foreground";
        return (
          <div key={i} className="flex items-start gap-2 py-1">
            <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", color)} />
            <span className="text-xs text-muted-foreground leading-relaxed">{signal.label}</span>
          </div>
        );
      })}
    </div>
  );
}

interface CorporateBehaviorIndexCardProps {
  result: CBIResult;
  companyName: string;
}

export function CorporateBehaviorIndexCard({ result, companyName }: CorporateBehaviorIndexCardProps) {
  const style = BAND_STYLES[result.band] || BAND_STYLES.opaque;

  return (
    <Card className={cn("overflow-hidden border-2", style.border)}>
      {/* Header gradient */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-[hsl(var(--civic-blue))] to-[hsl(var(--civic-green))]" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-1">Corporate Behavior Index™</p>
            <CardTitle className="text-xl">{companyName}</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Info className="w-3 h-3" />
                  {result.confidence} Confidence
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Based on {result.signalCount} behavior signals detected from public data. Higher confidence = more data points.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pb-6">
        {/* Score + Label */}
        <div className="flex items-center gap-6 mb-6">
          <ScoreRing score={result.score} band={result.band} />
          <div className="flex-1">
            <Badge className={cn("mb-2 text-xs", style.bg, style.text, "border", style.border)}>
              {result.label}
            </Badge>
            <p className="text-sm text-muted-foreground leading-relaxed">
              How {companyName} scores on workforce behavior signals — based on {result.signalCount} public data points across 5 categories.
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4 mb-6">
          {result.categories.map((cat) => (
            <CategoryBar key={cat.key} category={cat} />
          ))}
        </div>

        {/* Signal Details (Expandable) */}
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            View all {result.signalCount} signals
          </summary>
          <div className="mt-4 space-y-5 pl-6 border-l-2 border-primary/10">
            {result.categories.map((cat) => (
              <div key={cat.key}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">{cat.name}</h4>
                <SignalList category={cat} />
              </div>
            ))}
          </div>
        </details>

        {/* Disclaimer */}
        <div className="mt-5 pt-4 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            The Corporate Behavior Index™ measures observable signals from public data — not employer marketing claims.
            Scores reflect data availability and detected patterns, not moral judgments.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
