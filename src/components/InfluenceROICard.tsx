import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Target, HelpCircle } from "lucide-react";
import { formatCurrency } from "@/data/sampleData";
import { cn } from "@/lib/utils";

export interface InfluenceROI {
  totalPoliticalSpending: number;
  totalGovernmentBenefits: number;
  roiRatio: number;
  policyWinRate?: number;
  grade: string;
}

function gradeColor(grade: string) {
  if (grade === "A" || grade === "A+") return "text-[hsl(var(--civic-red))] border-[hsl(var(--civic-red))]/30 bg-[hsl(var(--civic-red))]/10";
  if (grade === "B" || grade === "B+") return "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/10";
  if (grade === "C") return "text-muted-foreground border-border";
  return "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/10";
}

function gradeExplainer(grade: string) {
  if (grade === "A" || grade === "A+") return "This company gets a lot back from the government compared to what it spends on politics.";
  if (grade === "B" || grade === "B+") return "This company gets a solid return on its political spending.";
  if (grade === "C") return "This company's political spending and government benefits are roughly balanced.";
  return "This company doesn't get much back from the government relative to its political spending.";
}

export function InfluenceROICard({ data }: { data: InfluenceROI }) {
  const netBenefit = data.totalGovernmentBenefits - data.totalPoliticalSpending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          What Do They Get Back?
          <Badge className={cn("ml-auto text-sm", gradeColor(data.grade))}>{data.grade}</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Companies spend money on politics. Sometimes they get government contracts, subsidies, or
          favorable rules in return. This card compares what they spent vs. what they received.
        </p>
      </CardHeader>
      <CardContent>
        {/* Plain explainer */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border/40 mb-4">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {gradeExplainer(data.grade)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <DollarSign className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold text-foreground">{formatCurrency(data.totalPoliticalSpending)}</div>
            <div className="text-xs text-muted-foreground">Spent on politics</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <DollarSign className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold text-foreground">{formatCurrency(data.totalGovernmentBenefits)}</div>
            <div className="text-xs text-muted-foreground">Got back from gov't</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{data.roiRatio.toFixed(1)}x</div>
            <div className="text-xs text-muted-foreground">Return for every $1 spent</div>
          </div>
          {data.policyWinRate !== undefined && (
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold text-foreground">{data.policyWinRate}%</div>
              <div className="text-xs text-muted-foreground">Lobbying success rate</div>
            </div>
          )}
        </div>

        {/* ROI Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>What they spent</span>
            <span>What they got back</span>
          </div>
          <div className="relative h-6 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-[hsl(var(--civic-red))]/60 rounded-l-full"
              style={{ width: `${Math.min(data.totalPoliticalSpending / (data.totalGovernmentBenefits || 1) * 50, 50)}%` }}
            />
            <div
              className="absolute right-0 top-0 h-full bg-[hsl(var(--civic-green))]/60 rounded-r-full"
              style={{ width: `${Math.min(50, 50)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Net difference: <span className="font-medium text-foreground">{formatCurrency(netBenefit)}</span>
            {" "}— For every <strong>$1</strong> spent on politics, they got <strong>{formatCurrency(data.roiRatio)}</strong> back.
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">
          We add up government contracts, subsidies, and tax breaks, then compare that to what the company spent
          on campaign donations and lobbying. Sources: USASpending.gov, Good Jobs First, FEC.
        </p>
      </CardContent>
    </Card>
  );
}
