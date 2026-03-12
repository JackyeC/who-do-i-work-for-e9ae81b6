import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AIAnalysisNotice } from "@/components/strategic-offer/AIAnalysisNotice";
import {
  DollarSign, FileText, Shield, Heart, Scale, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, Info, Sparkles, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";
import type { OfferStrengthResult, ScoreCategory } from "@/lib/offerStrengthScoring";
import { getScoreLabel } from "@/lib/offerStrengthScoring";

const CATEGORY_ICONS: Record<string, typeof DollarSign> = {
  compensation: DollarSign,
  clarity: FileText,
  restrictive: Shield,
  benefits: Heart,
  mechanics: Scale,
  growth: TrendingUp,
  legal: AlertTriangle,
};

const CONFIDENCE_STYLES: Record<string, { label: string; className: string }> = {
  high: { label: "High Confidence", className: "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10" },
  medium: { label: "Medium Confidence", className: "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10" },
  low: { label: "Low Confidence", className: "text-muted-foreground bg-muted" },
};

const RECOMMENDATION_STYLES: Record<string, { className: string; icon: typeof CheckCircle2 }> = {
  "Ready to Sign": { className: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/5", icon: CheckCircle2 },
  "Worth Negotiating": { className: "text-primary border-primary/30 bg-primary/5", icon: Info },
  "Proceed Carefully": { className: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5", icon: AlertTriangle },
  "Get More Information": { className: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5", icon: Info },
  "High-Risk Offer": { className: "text-destructive border-destructive/30 bg-destructive/5", icon: XCircle },
};

interface Props {
  result: OfferStrengthResult;
  isAIPowered: boolean;
  loading?: boolean;
}

export function OfferStrengthScore({ result, isAIPowered, loading }: Props) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const { totalScore, finalLabel, finalRecommendation, confidence, whyThisScore, categories, missingDataWarnings, personalizationApplied } = result;
  const label = getScoreLabel(totalScore);
  const confStyle = CONFIDENCE_STYLES[confidence] || CONFIDENCE_STYLES.medium;
  const recStyle = RECOMMENDATION_STYLES[finalRecommendation] || RECOMMENDATION_STYLES["Proceed Carefully"];
  const RecIcon = recStyle.icon;

  const ringSize = 150;
  const radius = (ringSize - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (totalScore / 100) * circumference;
  const ringColor = totalScore >= 85 ? "hsl(var(--civic-green))" : totalScore >= 70 ? "hsl(var(--primary))" : totalScore >= 55 ? "hsl(var(--civic-yellow))" : "hsl(var(--destructive))";

  return (
    <div className="space-y-5" id="offer-strength-score">
      {/* AI Analysis Notice */}
      <AIAnalysisNotice />

      {/* Main Score Card */}
      <Card className="border-2 border-primary/20 rounded-2xl overflow-hidden">
        <CardContent className="p-7">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score ring */}
            <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="7" />
                <circle
                  cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none"
                  stroke={ringColor} strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={loading ? circumference : offset}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-display font-bold text-foreground">{loading ? "—" : totalScore}</span>
                <span className="text-[10px] text-muted-foreground font-medium">/ 100</span>
              </div>
            </div>

            {/* Label + summary */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-1 tracking-tight">
                  Offer Strength Score™
                </h2>
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <span className={cn("text-sm font-semibold", label.color)}>{finalLabel}</span>
                  <Badge variant="outline" className={cn("text-[10px]", confStyle.className)}>{confStyle.label}</Badge>
                  {isAIPowered && <Badge variant="outline" className="text-[10px] gap-1"><Sparkles className="w-2.5 h-2.5" /> AI-Powered</Badge>}
                  {personalizationApplied && <Badge variant="outline" className="text-[10px]">Personalized</Badge>}
                </div>
              </div>

              {/* Recommendation badge */}
              <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium", recStyle.className)}>
                <RecIcon className="w-4 h-4" />
                {finalRecommendation}
              </div>

              {/* Why this score */}
              {whyThisScore && (
                <p className="text-sm text-muted-foreground leading-relaxed">{whyThisScore}</p>
              )}
            </div>
          </div>

          {/* Missing data warnings */}
          {missingDataWarnings.length > 0 && (
            <div className="mt-5 p-3 bg-muted/40 rounded-xl space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Missing Information
              </p>
              {missingDataWarnings.map((w, i) => (
                <p key={i} className="text-[11px] text-muted-foreground pl-4">• {w}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map(cat => (
          <CategoryCard
            key={cat.key}
            category={cat}
            isExpanded={expandedCat === cat.key}
            onToggle={() => setExpandedCat(expandedCat === cat.key ? null : cat.key)}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ category, isExpanded, onToggle }: { category: ScoreCategory; isExpanded: boolean; onToggle: () => void }) {
  const Icon = CATEGORY_ICONS[category.key] || Info;
  const catColor = category.score >= 70 ? "text-[hsl(var(--civic-green))]" : category.score >= 50 ? "text-[hsl(var(--civic-yellow))]" : "text-destructive";
  const confStyle = CONFIDENCE_STYLES[category.confidence] || CONFIDENCE_STYLES.medium;

  return (
    <Card className="rounded-xl border-border/50 hover:border-border transition-colors">
      <CardContent className="p-4 space-y-2.5">
        <button onClick={onToggle} className="w-full text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{category.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={cn("text-xs font-bold", catColor)}>
                {category.score}
              </Badge>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          </div>
        </button>

        <Progress value={category.score} className="h-1.5" />

        {/* Findings always visible */}
        <ul className="space-y-1">
          {category.findings.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="pt-2 space-y-2 border-t border-border/30">
            {category.positiveSignals && category.positiveSignals.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[hsl(var(--civic-green))] mb-1">Positive Signals</p>
                {category.positiveSignals.map((s, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-[hsl(var(--civic-green))]" /> {s}
                  </p>
                ))}
              </div>
            )}
            {category.negativeSignals && category.negativeSignals.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-destructive mb-1">Risk Signals</p>
                {category.negativeSignals.map((s, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <XCircle className="w-3 h-3 text-destructive" /> {s}
                  </p>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("text-[9px]", confStyle.className)}>{confStyle.label}</Badge>
              <span className="text-[10px] text-muted-foreground">{category.weight}% weight</span>
            </div>
          </div>
        )}

        {!isExpanded && (
          <span className="text-[10px] text-muted-foreground">{category.weight}% weight</span>
        )}
      </CardContent>
    </Card>
  );
}
