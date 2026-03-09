import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Award } from "lucide-react";
import { formatCurrency } from "@/data/sampleData";
import { cn } from "@/lib/utils";
import { ExplainableMetric } from "@/components/ExplainableMetric";

export interface Benchmark {
  industry: string;
  transparencyGrade: string;
  cpaZicklinScore?: number;
  industryRank?: number;
  industryTotal?: number;
  peerAvgCivicFootprint: number;
  peerAvgLobbying: number;
  peerAvgPacSpending: number;
  companyCivicFootprint: number;
  companyLobbying: number;
  companyPacSpending: number;
  isIndustryLeader: boolean;
}

function letterGradeStyle(grade: string) {
  if (grade === "A" || grade === "A+") return "bg-civic-green/10 text-civic-green border-civic-green/30";
  if (grade === "B" || grade === "B+") return "bg-civic-green/10 text-civic-green border-civic-green/30";
  if (grade === "C") return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30";
  return "bg-civic-red/10 text-civic-red border-civic-red/30";
}

function ComparisonBar({ label, companyValue, peerValue, formatter }: {
  label: string;
  companyValue: number;
  peerValue: number;
  formatter: (v: number) => string;
}) {
  const max = Math.max(companyValue, peerValue, 1);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs w-16 text-foreground font-medium">Company</span>
          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(companyValue / max) * 100}%` }} />
          </div>
          <span className="text-xs w-16 text-right text-foreground">{formatter(companyValue)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-16 text-muted-foreground">Peer Avg</span>
          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${(peerValue / max) * 100}%` }} />
          </div>
          <span className="text-xs w-16 text-right text-muted-foreground">{formatter(peerValue)}</span>
        </div>
      </div>
    </div>
  );
}

export function BenchmarkCard({ data }: { data: Benchmark }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Industry Benchmark
          <Badge className={cn("ml-auto text-sm", letterGradeStyle(data.transparencyGrade))}>
            {data.transparencyGrade}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How this company stacks up against {data.industry} peers on transparency and political activity.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          {data.industryRank && data.industryTotal && (
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-foreground">#{data.industryRank}</div>
              <div className="text-xs text-muted-foreground">of {data.industryTotal} in {data.industry}</div>
            </div>
          )}
          {data.cpaZicklinScore !== undefined && (
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-foreground">{data.cpaZicklinScore}%</div>
              <div className="text-xs text-muted-foreground">CPA-Zicklin Score</div>
            </div>
          )}
          {data.isIndustryLeader && (
            <div className="flex items-center gap-2 p-3 bg-civic-green/10 rounded-lg border border-civic-green/20">
              <Award className="w-5 h-5 text-civic-green" />
              <div>
                <div className="text-sm font-bold text-civic-green">Industry Leader</div>
                <div className="text-xs text-muted-foreground">Top-tier transparency</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ComparisonBar
            label="Civic Footprint Score"
            companyValue={data.companyCivicFootprint}
            peerValue={data.peerAvgCivicFootprint}
            formatter={(v) => `${v}/100`}
          />
          <ComparisonBar
            label="Lobbying Spend"
            companyValue={data.companyLobbying}
            peerValue={data.peerAvgLobbying}
            formatter={formatCurrency}
          />
          <ComparisonBar
            label="PAC Spending"
            companyValue={data.companyPacSpending}
            peerValue={data.peerAvgPacSpending}
            formatter={formatCurrency}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-3">
          Peer comparison based on companies in the {data.industry} sector. 
          CPA-Zicklin Index scores from the Center for Political Accountability.
        </p>
      </CardContent>
    </Card>
  );
}
