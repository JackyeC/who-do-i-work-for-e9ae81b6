import { Shield, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type PolicyScoreResult, type Situation, SITUATION_LABELS } from "@/lib/policyScoreEngine";
import { Progress } from "@/components/ui/progress";

interface Props {
  result: PolicyScoreResult;
  companyName: string;
  situations: Situation[];
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-[hsl(var(--civic-green))]";
  if (score >= 45) return "text-[hsl(var(--civic-yellow))]";
  return "text-destructive";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-[hsl(var(--civic-green))]/10";
  if (score >= 45) return "bg-[hsl(var(--civic-yellow))]/10";
  return "bg-destructive/10";
}

function generateSummary(result: PolicyScoreResult, companyName: string, situations: Situation[]): string {
  const { total, grade } = result;
  const situationContext = situations.length > 0
    ? ` Based on your priorities (${situations.map(s => SITUATION_LABELS[s].toLowerCase()).join(", ")}), `
    : " ";

  if (total >= 70) {
    return `${companyName} shows relatively strong policy transparency and governance practices.${situationContext}this company's disclosures and spending patterns are largely consistent with its public positions.`;
  }
  if (total >= 45) {
    return `${companyName} has a mixed policy profile.${situationContext}some areas show good transparency while others have gaps worth understanding before making career decisions.`;
  }
  return `${companyName} has notable gaps in policy transparency and consistency.${situationContext}several areas may benefit from closer examination, especially if governance and values alignment matter to you.`;
}

export function PolicyIntelligenceSummary({ result, companyName, situations }: Props) {
  const summary = generateSummary(result, companyName, situations);
  const scoreColor = getScoreColor(result.total);
  const scoreBg = getScoreBg(result.total);

  return (
    <div className="space-y-6">
      {/* Score Hero */}
      <Card className={`${scoreBg} border-border/30`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold font-mono ${scoreColor}`}>{result.total}</div>
              <div className="text-xs text-muted-foreground mt-1">Policy Score</div>
              <Badge variant="outline" className={`mt-1 text-xs ${scoreColor}`}>{result.grade}</Badge>
            </div>
            <div className="flex-1 space-y-3">
              {result.pillars.map((p) => (
                <div key={p.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{p.label}</span>
                    <span className="text-xs text-muted-foreground font-mono">{p.score}/100 · {Math.round(p.weight * 100)}% weight</span>
                  </div>
                  <Progress value={p.score} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
          {result.confidence < 0.5 && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              Limited data available — confidence: {Math.round(result.confidence * 100)}%
            </div>
          )}
        </CardContent>
      </Card>

      {/* What This Means For You */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            What this means for you
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                Top Risks
              </h4>
              {result.topRisks.map((r, i) => (
                <p key={i} className="text-xs text-muted-foreground pl-5">• {r}</p>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--civic-green))]" />
                Top Strengths
              </h4>
              {result.topStrengths.map((s, i) => (
                <p key={i} className="text-xs text-muted-foreground pl-5">• {s}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
