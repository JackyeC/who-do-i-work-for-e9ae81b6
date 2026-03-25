import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Sparkles, CheckCircle2, TrendingUp } from "lucide-react";

interface AlignmentBreakdown {
  skillsMatch: number;
  valuesAlignment: number;
  companySignals: number;
  jobMatch: number;
}

interface CareerAlignmentScoreProps {
  overallScore: number;
  breakdown: AlignmentBreakdown;
  matchedSignals?: string[];
  className?: string;
}

export function CareerAlignmentScore({ 
  overallScore, 
  breakdown, 
  matchedSignals = [],
  className = "" 
}: CareerAlignmentScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-civic-green";
    if (score >= 60) return "text-civic-yellow";
    return "text-civic-red";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Strong";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Weak";
  };

  return (
    <Card className={`border-border ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Career Alignment Score</CardTitle>
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </div>
        </div>
        <CardDescription>
          How well this opportunity aligns with your career goals, values, and skills
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Grade */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-civic-gold" />
            <span className="text-sm font-medium">Overall Fit</span>
          </div>
          <Badge variant={overallScore >= 70 ? "default" : "secondary"} className="text-sm">
            {getScoreGrade(overallScore)}
          </Badge>
        </div>

        {/* Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Score Breakdown</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Skills Match (30%)</span>
                <span className={`text-sm font-semibold ${getScoreColor(breakdown.skillsMatch)}`}>
                  {breakdown.skillsMatch}
                </span>
              </div>
              <Progress value={breakdown.skillsMatch} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Values Alignment (30%)</span>
                <span className={`text-sm font-semibold ${getScoreColor(breakdown.valuesAlignment)}`}>
                  {breakdown.valuesAlignment}
                </span>
              </div>
              <Progress value={breakdown.valuesAlignment} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Company Signals (25%)</span>
                <span className={`text-sm font-semibold ${getScoreColor(breakdown.companySignals)}`}>
                  {breakdown.companySignals}
                </span>
              </div>
              <Progress value={breakdown.companySignals} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Job Match (15%)</span>
                <span className={`text-sm font-semibold ${getScoreColor(breakdown.jobMatch)}`}>
                  {breakdown.jobMatch}
                </span>
              </div>
              <Progress value={breakdown.jobMatch} className="h-2" />
            </div>
          </div>
        </div>

        {/* Matched Signals */}
        {matchedSignals.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-civic-gold" />
              Matched Signals ({matchedSignals.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {matchedSignals.slice(0, 6).map((signal, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {signal}
                </Badge>
              ))}
              {matchedSignals.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{matchedSignals.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Interpretation */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {overallScore >= 80 
                ? "Strong alignment across career factors. This opportunity closely matches your profile."
                : overallScore >= 60
                ? "Good overall fit with some areas to consider. Review the breakdown for specifics."
                : "Lower alignment detected. Consider whether this matches your career priorities."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}