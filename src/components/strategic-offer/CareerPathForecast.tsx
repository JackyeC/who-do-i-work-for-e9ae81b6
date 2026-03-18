import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, Clock, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

interface CareerPathForecastProps {
  companyName: string;
  roleTitle: string;
  signals: any[];
}

function inferCareerForecast(companyName: string, roleTitle: string, signals: any[]) {
  // Extract career progression signals
  const careerSignals = signals.filter(
    (s) =>
      s.value_category === "career_trajectory" ||
      s.value_category === "career_path_progression" ||
      s.value_category === "internal_promotion"
  );

  const exitSignals = signals.filter(
    (s) =>
      s.value_category === "promotion_vs_exit" ||
      s.value_category === "exit_destinations"
  );

  const mobilitySignals = signals.filter(
    (s) =>
      s.value_category === "internal_mobility_score" ||
      s.value_category === "learning_infrastructure"
  );

  // Determine promotion timeline
  let promoTimeline = "2-3 years (industry average)";
  let promoConfidence: "High" | "Medium" | "Low" = "Low";
  let nextRole = "Senior " + roleTitle;
  let leadershipPath = "Unknown";
  let isPitstop = false;

  for (const s of careerSignals) {
    const summary = (s.signal_summary || "").toLowerCase();
    // Extract time estimates
    const timeMatch = summary.match(/(\d+\.?\d*)\s*year/);
    if (timeMatch) {
      promoTimeline = `${timeMatch[1]} years`;
      promoConfidence = s.confidence === "direct" ? "High" : "Medium";
    }
    // Extract role progression
    const arrowMatch = (s.signal_summary || "").match(/([A-Za-z\s/&]+)\s*→\s*([A-Za-z\s/&]+)/);
    if (arrowMatch) {
      nextRole = arrowMatch[2].trim();
    }
    // Check internal rate
    if (summary.includes("internal") && summary.includes("%")) {
      const pctMatch = summary.match(/(\d+)%/);
      if (pctMatch && parseInt(pctMatch[1]) > 50) {
        leadershipPath = "Strong internal pipeline";
      } else if (pctMatch) {
        leadershipPath = "Narrow internal pipeline";
        isPitstop = true;
      }
    }
  }

  // Check exit patterns
  for (const s of exitSignals) {
    const summary = (s.signal_summary || "").toLowerCase();
    if (
      summary.includes("leave to advance") ||
      summary.includes("leave before promotion") ||
      summary.includes("external replacement")
    ) {
      isPitstop = true;
    }
  }

  // Check mobility infrastructure
  const hasInfrastructure = mobilitySignals.length > 0;
  if (!hasInfrastructure && careerSignals.length < 2) {
    promoConfidence = "Low";
  }

  return {
    promoTimeline,
    promoConfidence,
    nextRole,
    leadershipPath,
    isPitstop,
    hasInfrastructure,
    signalCount: careerSignals.length + exitSignals.length + mobilitySignals.length,
  };
}

export function CareerPathForecast({ companyName, roleTitle, signals }: CareerPathForecastProps) {
  const forecast = inferCareerForecast(companyName, roleTitle, signals);

  if (forecast.signalCount === 0) return null;

  const verdictColor = forecast.isPitstop
    ? "text-[hsl(var(--civic-yellow))]"
    : "text-[hsl(var(--civic-green))]";
  const verdictBg = forecast.isPitstop
    ? "bg-[hsl(var(--civic-yellow))]/10"
    : "bg-[hsl(var(--civic-green))]/10";

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Jackye's Career Path Forecast
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Future-value analysis for {roleTitle} at {companyName}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Jackye's Take */}
        <div className={cn("rounded-md p-3 text-xs", verdictBg)}>
          <p className="font-semibold text-foreground mb-1">Jackye's Take:</p>
          <p className="text-muted-foreground leading-relaxed">
            This offer is for a <strong className="text-foreground">{roleTitle}</strong> role.{" "}
            {forecast.promoConfidence !== "Low" ? (
              <>
                Based on available signals, the typical path to{" "}
                <strong className="text-foreground">{forecast.nextRole}</strong> is approximately{" "}
                <strong className="text-foreground">{forecast.promoTimeline}</strong>.{" "}
              </>
            ) : (
              <>Limited public data on career progression timelines at this company. </>
            )}
            {forecast.isPitstop ? (
              <>
                However, the <strong className={verdictColor}>leadership path appears narrow</strong>. If your goal is management,
                this might be a 2-year pitstop, not a 5-year home.
              </>
            ) : forecast.leadershipPath === "Strong internal pipeline" ? (
              <>
                The company shows <strong className="text-[hsl(var(--civic-green))]">strong internal promotion signals</strong>,
                suggesting this could be a long-term growth opportunity.
              </>
            ) : (
              <>Consider asking about internal promotion rates during your interview process.</>
            )}
          </p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded border border-border p-2.5">
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <Clock className="w-3 h-3" />
              Time to Next Level
            </div>
            <div className="text-xs font-semibold text-foreground">{forecast.promoTimeline}</div>
            <Badge variant="outline" className="text-xs mt-1">
              {forecast.promoConfidence} confidence
            </Badge>
          </div>
          <div className="rounded border border-border p-2.5">
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <ArrowRight className="w-3 h-3" />
              Likely Next Role
            </div>
            <div className="text-xs font-semibold text-foreground">{forecast.nextRole}</div>
          </div>
          <div className="rounded border border-border p-2.5">
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              {forecast.isPitstop ? (
                <AlertTriangle className="w-3 h-3 text-[hsl(var(--civic-yellow))]" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-[hsl(var(--civic-green))]" />
              )}
              Leadership Pipeline
            </div>
            <div className={cn("text-xs font-semibold", forecast.isPitstop ? verdictColor : "text-foreground")}>
              {forecast.leadershipPath}
            </div>
          </div>
          <div className="rounded border border-border p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <TrendingUp className="w-3 h-3" />
              Growth Infrastructure
            </div>
            <div className="text-xs font-semibold text-foreground">
              {forecast.hasInfrastructure ? "Programs detected" : "Limited signals"}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground border-t border-border pt-2">
          Based on {forecast.signalCount} public workforce signals. This is an educational estimate, not a guarantee of advancement.
        </p>
      </CardContent>
    </Card>
  );
}
