import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Target } from "lucide-react";
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
  if (grade === "A" || grade === "A+") return "text-civic-red border-civic-red/30 bg-civic-red/10";
  if (grade === "B" || grade === "B+") return "text-civic-yellow border-civic-yellow/30 bg-civic-yellow/10";
  if (grade === "C") return "text-civic-slate border-border";
  return "text-civic-green border-civic-green/30 bg-civic-green/10";
}

export function InfluenceROICard({ data }: { data: InfluenceROI }) {
  const netBenefit = data.totalGovernmentBenefits - data.totalPoliticalSpending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Influence ROI
          <Badge className={cn("ml-auto text-sm", gradeColor(data.grade))}>{data.grade}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Return on political investment: what they spend vs. what they receive from government.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <DollarSign className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold text-foreground">{formatCurrency(data.totalPoliticalSpending)}</div>
            <div className="text-xs text-muted-foreground">Political Spending</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <DollarSign className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold text-foreground">{formatCurrency(data.totalGovernmentBenefits)}</div>
            <div className="text-xs text-muted-foreground">Gov Benefits</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{data.roiRatio.toFixed(1)}x</div>
            <div className="text-xs text-muted-foreground">ROI Ratio</div>
          </div>
          {data.policyWinRate !== undefined && (
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold text-foreground">{data.policyWinRate}%</div>
              <div className="text-xs text-muted-foreground">Policy Win Rate</div>
            </div>
          )}
        </div>

        {/* ROI Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Spending</span>
            <span>Benefits</span>
          </div>
          <div className="relative h-6 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-civic-red/60 rounded-l-full"
              style={{ width: `${Math.min(data.totalPoliticalSpending / (data.totalGovernmentBenefits || 1) * 50, 50)}%` }}
            />
            <div
              className="absolute right-0 top-0 h-full bg-civic-green/60 rounded-r-full"
              style={{ width: `${Math.min(50, 50)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Net benefit: <span className="font-medium text-foreground">{formatCurrency(netBenefit)}</span>
            {" "}— For every $1 spent, {formatCurrency(data.roiRatio)} returned.
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">
          Formula: (Contracts + Subsidies + Tax Breaks − Political Spending) / Political Spending. 
          Sources: USASpending.gov, Good Jobs First, FEC.
        </p>
      </CardContent>
    </Card>
  );
}
