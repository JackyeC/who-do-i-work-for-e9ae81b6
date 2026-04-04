import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Info, ChevronDown, ShieldCheck, Sparkles, Target, MapPin, BarChart3, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchReason {
  dimension: string;
  label: string;
  detail: string;
  impact: number;
}

interface ScoreBreakdown {
  skill: number;
  role: number;
  values: number;
  signals: number;
  location: number;
}

interface MatchExplainerProps {
  alignmentScore: number;
  matchedSignals: string[];
  matchReasons?: MatchReason[];
  scoreBreakdown?: ScoreBreakdown;
  jobTitle?: string;
  department?: string | null;
  industry?: string;
  employerClarityScore?: number;
}

const DIMENSION_ICONS: Record<string, typeof Target> = {
  skill: Sparkles,
  role: Target,
  values: Heart,
  signals: BarChart3,
  location: MapPin,
  work_mode: MapPin,
  industry: BarChart3,
  seniority: Target,
};

const DIMENSION_COLORS: Record<string, string> = {
  skill: "text-primary",
  role: "text-primary",
  values: "text-[hsl(var(--civic-green))]",
  signals: "text-[hsl(var(--civic-yellow))]",
  location: "text-muted-foreground",
  work_mode: "text-muted-foreground",
  industry: "text-primary",
  seniority: "text-muted-foreground",
};

export function MatchExplainer({
  alignmentScore,
  matchedSignals,
  matchReasons,
  scoreBreakdown,
  jobTitle,
  department,
  industry,
  employerClarityScore,
}: MatchExplainerProps) {
  const [open, setOpen] = useState(false);

  const hasStructuredReasons = matchReasons && matchReasons.length > 0;

  const riskNote =
    typeof employerClarityScore === "number" && employerClarityScore < 45
      ? "Employer clarity is below our comfort band for blind trust — read the dossier before you invest time."
      : typeof employerClarityScore === "number" && employerClarityScore < 60
        ? "Mixed transparency — worth a second pass on leadership and labor signals."
        : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7 px-2">
          <Info className="w-3 h-3" />
          Why this matches you
          <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/40 animate-in slide-in-from-top-1">
        <div className="space-y-3">
          {/* Overall score */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium text-foreground">
              Career alignment: <span className="font-mono">{alignmentScore}%</span>
            </span>
          </div>

          {/* Per-dimension breakdown bars */}
          {scoreBreakdown && (
            <div className="space-y-1.5">
              {[
                { key: 'skill', label: 'Skills', weight: '25%' },
                { key: 'values', label: 'Values', weight: '25%' },
                { key: 'role', label: 'Role fit', weight: '20%' },
                { key: 'signals', label: 'Employer signals', weight: '20%' },
                { key: 'location', label: 'Location & logistics', weight: '10%' },
              ].map(({ key, label, weight }) => {
                const value = (scoreBreakdown as any)[key] || 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-24 shrink-0 text-right">
                      {label} <span className="opacity-60">({weight})</span>
                    </span>
                    <Progress value={value} className="h-1 flex-1" />
                    <span className="text-[10px] font-mono text-foreground/70 w-8 text-right">{value}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Structured match reasons */}
          {hasStructuredReasons && (
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Top reasons this matches you
              </p>
              {matchReasons!.map((reason, i) => {
                const Icon = DIMENSION_ICONS[reason.dimension] || Sparkles;
                const color = DIMENSION_COLORS[reason.dimension] || "text-muted-foreground";
                return (
                  <div key={i} className="flex gap-2">
                    <Icon className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", color)} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{reason.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug">{reason.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback: flat signal badges (backward compat) */}
          {!hasStructuredReasons && matchedSignals.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Signals overlapping your Dream Job Profile:</p>
              <div className="flex flex-wrap gap-1">
                {matchedSignals.map((sig) => (
                  <Badge key={sig} variant="outline" className="text-xs bg-primary/5 border-primary/20">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    {sig}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Role family context */}
          {(jobTitle || department || industry) && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                <span className="text-foreground/90 font-medium">Role family: </span>
                {jobTitle || "—"}
                {department ? ` · ${department}` : ""}
              </p>
              {industry && (
                <p>
                  <span className="text-foreground/90 font-medium">Sector: </span>
                  {industry}
                </p>
              )}
            </div>
          )}

          {/* Employer clarity */}
          {typeof employerClarityScore === "number" && (
            <p className="text-xs">
              <span className="text-foreground/90 font-medium">Employer clarity: </span>
              <span className="font-mono">{employerClarityScore}</span>
              {riskNote && (
                <span className="block mt-1.5 text-amber-200/90 leading-relaxed">{riskNote}</span>
              )}
            </p>
          )}

          <div className="pt-1.5 border-t border-border/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <ShieldCheck className="w-3 h-3 inline mr-1 text-civic-green" />
              No race, age, or gender data is used in scoring — only public employer signals and your stated preferences.
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
