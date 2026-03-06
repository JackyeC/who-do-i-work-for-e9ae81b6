import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, RotateCcw, EyeOff, Users, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PoliticalRisk {
  riskScore: number; // 0-100
  grade: string;
  revolvingDoorCount: number;
  darkMoneyPercentage: number;
  stakeholderDisconnect: number; // 0-100
  flaggedOrgCount: number;
}

function riskColor(score: number) {
  if (score >= 70) return "text-civic-red";
  if (score >= 40) return "text-civic-yellow";
  return "text-civic-green";
}

function gradeStyle(grade: string) {
  if (["A", "A+"].includes(grade)) return "bg-civic-green/10 text-civic-green border-civic-green/30";
  if (["B", "B+"].includes(grade)) return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30";
  return "bg-civic-red/10 text-civic-red border-civic-red/30";
}

function RiskFactor({ icon: Icon, label, value, description, severity }: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  severity: "low" | "medium" | "high";
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", severity === "high" ? "text-civic-red" : severity === "medium" ? "text-civic-yellow" : "text-civic-green")} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className={cn("text-sm font-bold", severity === "high" ? "text-civic-red" : severity === "medium" ? "text-civic-yellow" : "text-civic-green")}>{value}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export function PoliticalRiskCard({ data }: { data: PoliticalRisk }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          Political Risk Score
          <Badge className={cn("ml-auto text-sm", gradeStyle(data.grade))}>{data.grade}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Composite risk assessment: likelihood of conflict × severity of impact on reputation and legal standing.
        </p>
      </CardHeader>
      <CardContent>
        {/* Main score */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-center">
            <div className={cn("text-4xl font-bold", riskColor(data.riskScore))}>{data.riskScore}</div>
            <div className="text-xs text-muted-foreground">/100</div>
          </div>
          <div className="flex-1">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", data.riskScore >= 70 ? "bg-civic-red" : data.riskScore >= 40 ? "bg-civic-yellow" : "bg-civic-green")}
                style={{ width: `${data.riskScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>
        </div>

        {/* Risk factors */}
        <div className="space-y-3">
          <RiskFactor
            icon={RotateCcw}
            label="Revolving Door"
            value={`${data.revolvingDoorCount} connections`}
            description="Former government officials on board or in C-suite"
            severity={data.revolvingDoorCount >= 3 ? "high" : data.revolvingDoorCount >= 1 ? "medium" : "low"}
          />
          <RiskFactor
            icon={EyeOff}
            label="Dark Money Exposure"
            value={`${data.darkMoneyPercentage.toFixed(0)}%`}
            description="Spending channeled through non-disclosed 501(c)(4)s"
            severity={data.darkMoneyPercentage >= 50 ? "high" : data.darkMoneyPercentage >= 20 ? "medium" : "low"}
          />
          <RiskFactor
            icon={Users}
            label="Stakeholder Disconnect"
            value={`${data.stakeholderDisconnect.toFixed(0)}/100`}
            description="Risk of boycotts or employee turnover from political spending"
            severity={data.stakeholderDisconnect >= 60 ? "high" : data.stakeholderDisconnect >= 30 ? "medium" : "low"}
          />
          <RiskFactor
            icon={Flag}
            label="Flagged Organizations"
            value={`${data.flaggedOrgCount} ties`}
            description="Connections to orgs flagged by civil rights watchdogs"
            severity={data.flaggedOrgCount >= 3 ? "high" : data.flaggedOrgCount >= 1 ? "medium" : "low"}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-3">
          Risk = Likelihood of Conflict × Severity of Impact. Factors weighted by category.
        </p>
      </CardContent>
    </Card>
  );
}
