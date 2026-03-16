import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DollarSign, Shield, Scale, Users, MessageSquare,
  ArrowLeft, Download, Share2, TrendingUp, TrendingDown, Minus,
  CheckCircle2, AlertTriangle, XCircle
} from "lucide-react";
import { BLSWageBenchmarkCard } from "@/components/bls/BLSWageBenchmarkCard";
import { BLSECITrendCard } from "@/components/bls/BLSECITrendCard";

import { BLSBenefitsCard } from "@/components/bls/BLSBenefitsCard";
import { useOfferCheck } from "@/hooks/use-offer-check";
import { OfferCheckReport } from "@/components/OfferCheckReport";
import {
  OfferCheckSnapshot,
  buildDefaultSections,
  deriveSnapshotVerdict,
  generateSnapshotJackyeTake,
} from "@/components/OfferCheckSnapshot";

export interface OfferClarityReport {
  compensation: {
    score: number;
    marketRangeLow: number;
    marketRangeHigh: number;
    percentile: number;
    interpretation: string;
    findings: string[];
  };
  transparency: {
    score: number;
    level: string;
    findings: string[];
  };
  legalRisk: {
    score: number;
    riskLevel: string;
    caseCount: number;
    findings: string[];
  };
  leadershipRepresentation: {
    score: number;
    level: string;
    findings: string[];
  };
  employeeExperience: {
    score: number;
    pattern: string;
    findings: string[];
  };
  overallScore: number;
  overallInterpretation: string;
  summary: string;
}

interface Props {
  report: OfferClarityReport;
  offerData: { companyName: string; roleTitle: string; baseSalary: string; location: string };
  onStartOver: () => void;
}

const INTERPRETATION_STYLES: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  strong_offer: { label: "Strong Offer", color: "text-civic-green", icon: CheckCircle2 },
  generally_solid: { label: "Generally Solid", color: "text-primary", icon: CheckCircle2 },
  proceed_carefully: { label: "Proceed Carefully", color: "text-civic-yellow", icon: AlertTriangle },
  high_risk: { label: "High Risk Environment", color: "text-destructive", icon: XCircle },
};

const CATEGORY_CONFIG = [
  { key: "compensation" as const, label: "Compensation", icon: DollarSign, color: "bg-civic-green" },
  { key: "transparency" as const, label: "Transparency", icon: Scale, color: "bg-primary" },
  { key: "legalRisk" as const, label: "Legal Risk", icon: Shield, color: "bg-civic-yellow" },
  { key: "leadershipRepresentation" as const, label: "Leadership", icon: Users, color: "bg-accent" },
  { key: "employeeExperience" as const, label: "Employee Experience", icon: MessageSquare, color: "bg-secondary" },
];

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "hsl(var(--civic-green))" : score >= 60 ? "hsl(var(--primary))" : score >= 40 ? "hsl(var(--civic-yellow))" : "hsl(var(--destructive))";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-bold text-foreground">{score}</span>
        <span className="text-[10px] text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  );
}

function CategoryCard({ config, score, findings, sublabel }: {
  config: typeof CATEGORY_CONFIG[0];
  score: number;
  findings: string[];
  sublabel: string;
}) {
  const Icon = config.icon;
  return (
    <Card className="card-official rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", config.color + "/10")}>
              <Icon className="w-3.5 h-3.5 text-foreground" />
            </div>
            {config.label}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={score >= 60 ? "secondary" : "outline"} className="text-xs font-bold">
              {score}
            </Badge>
          </div>
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">{sublabel}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <Progress value={score} className="h-1.5 mb-3" />
        <ul className="space-y-1.5">
          {findings.map((f, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="mt-1 w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function OfferClarityDashboard({ report, offerData, onStartOver }: Props) {
  const interp = INTERPRETATION_STYLES[report.overallInterpretation] || INTERPRETATION_STYLES.proceed_carefully;
  const InterpIcon = interp.icon;
  const baseSalary = Number(offerData.baseSalary);

  const snapshotSections = buildDefaultSections({
    offerStrength: report.compensation.percentile >= 70 ? "strong" : report.compensation.percentile >= 30 ? "average" : "weak",
  });
  const snapshotVerdict = deriveSnapshotVerdict(snapshotSections);
  const snapshotJackyeTake = generateSnapshotJackyeTake(snapshotVerdict, snapshotSections);

  return (
    <div className="space-y-6">
      {/* Offer Check Snapshot — fast read before the full report */}
      <OfferCheckSnapshot
        companyName={offerData.companyName}
        roleTitle={offerData.roleTitle}
        location={offerData.location}
        verdict={snapshotVerdict}
        sections={snapshotSections}
        jackyeTake={snapshotJackyeTake}
      />

      {/* Hero Score */}
      <Card className="card-official rounded-2xl overflow-hidden">
        <CardContent className="p-7">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={report.overallScore} />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-display font-bold text-foreground mb-1">Offer Check Score</h2>
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-3">
                <InterpIcon className={cn("w-4 h-4", interp.color)} />
                <span className={cn("text-sm font-semibold", interp.color)}>{interp.label}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">{offerData.companyName}</Badge>
                <Badge variant="outline" className="text-[10px]">{offerData.roleTitle}</Badge>
                {offerData.location && <Badge variant="outline" className="text-[10px]">{offerData.location}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Comparison */}
      <Card className="card-official rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Market Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Market Range</p>
              <p className="text-sm font-semibold text-foreground">
                ${(report.compensation.marketRangeLow / 1000).toFixed(0)}k – ${(report.compensation.marketRangeHigh / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your Offer</p>
              <p className="text-sm font-semibold text-foreground">
                ${(baseSalary / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Percentile</p>
              <div className="flex items-center justify-center gap-1">
                {report.compensation.percentile >= 70 ? <TrendingUp className="w-3.5 h-3.5 text-civic-green" /> :
                 report.compensation.percentile >= 30 ? <Minus className="w-3.5 h-3.5 text-civic-yellow" /> :
                 <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                <p className="text-sm font-semibold text-foreground">{report.compensation.percentile}th</p>
              </div>
            </div>
          </div>
          {/* Percentile bar */}
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-destructive via-civic-yellow to-civic-green rounded-full"
              style={{ width: "100%" }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full border-2 border-background shadow-lg"
              style={{ left: `${Math.min(Math.max(report.compensation.percentile, 2), 98)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>Under Market</span>
            <span>Market Aligned</span>
            <span>Strong Offer</span>
          </div>
        </CardContent>
      </Card>

      {/* National Labor Market Intelligence */}
      <div className="space-y-1">
        <h3 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          National Labor Market Intelligence
        </h3>
        <p className="text-xs text-muted-foreground">
          How your offer compares to federal compensation data from the Bureau of Labor Statistics
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BLSWageBenchmarkCard occupationTitle={offerData.roleTitle} offeredSalary={baseSalary} />
        <BLSBenefitsCard />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BLSECITrendCard />
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORY_CONFIG.map(config => {
          const data = report[config.key];
          const sublabelMap: Record<string, string> = {
            compensation: report.compensation.interpretation.replace(/_/g, " "),
            transparency: `${report.transparency.level} transparency`,
            legalRisk: `${report.legalRisk.riskLevel} risk · ${report.legalRisk.caseCount} case(s)`,
            leadershipRepresentation: `${report.leadershipRepresentation.level} representation`,
            employeeExperience: `${report.employeeExperience.pattern} pattern`,
          };
          return (
            <CategoryCard
              key={config.key}
              config={config}
              score={data.score}
              findings={data.findings}
              sublabel={sublabelMap[config.key]}
            />
          );
        })}
      </div>

      {/* Company Signals from Database (if company was matched) */}
      {(offerData as any).companyId && (
        <CompanySignalsSection companyId={(offerData as any).companyId} />
      )}

      {/* Interpretation guide */}
      <Card className="card-official rounded-2xl">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Score Interpretation</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { range: "80–100", label: "Strong offer", color: "text-civic-green" },
              { range: "60–79", label: "Generally solid", color: "text-primary" },
              { range: "40–59", label: "Proceed carefully", color: "text-civic-yellow" },
              { range: "Below 40", label: "High risk", color: "text-destructive" },
            ].map(item => (
              <div key={item.range} className="text-center p-2 bg-muted/30 rounded-lg">
                <p className={cn("text-sm font-bold", item.color)}>{item.range}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="outline" onClick={onStartOver} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Start Over
        </Button>
      </div>
    </div>
  );
}

/** Inline company signals section pulled from useOfferCheck */
function CompanySignalsSection({ companyId }: { companyId: string }) {
  const { sections, isLoading } = useOfferCheck(companyId);

  if (isLoading) return null;

  const signalSections = sections.filter((s: any) => s.hasData);
  if (signalSections.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Employer Signals from Public Records
        </h3>
        <p className="text-xs text-muted-foreground">
          Evidence-based signals detected from government filings, corporate disclosures, and verified sources
        </p>
      </div>
      <OfferCheckReport sections={sections} />
    </div>
  );
}
