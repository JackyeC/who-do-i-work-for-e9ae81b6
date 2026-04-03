import { useEvaluation } from "@/contexts/EvaluationContext";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  company: {
    name: string;
    logo_url?: string | null;
    industry: string;
    state: string;
    employee_count?: string | null;
  };
}

/**
 * Decisive verdict header for the top of a company dossier.
 * Shows company identity + alignment/risk scores + one-line human verdict.
 */
export function DossierVerdictHeader({ company }: Props) {
  const { alignmentScore, riskScore, verdictText } = useEvaluation();

  const riskLevel = riskScore < 40 ? "low" : riskScore < 65 ? "medium" : "high";
  const Icon = riskLevel === "low" ? ShieldCheck : riskLevel === "medium" ? AlertTriangle : XCircle;

  const verdictStyle = {
    low: {
      bg: "bg-civic-green/5",
      border: "border-civic-green/30",
      text: "text-civic-green",
      badge: "border-civic-green/40 text-civic-green",
    },
    medium: {
      bg: "bg-civic-yellow/5",
      border: "border-civic-yellow/30",
      text: "text-civic-yellow",
      badge: "border-civic-yellow/40 text-civic-yellow",
    },
    high: {
      bg: "bg-destructive/5",
      border: "border-destructive/30",
      text: "text-destructive",
      badge: "border-destructive/40 text-destructive",
    },
  }[riskLevel];

  return (
    <div className="mb-8">
      {/* Company identity */}
      <div className="flex items-start gap-4 mb-5">
        <CompanyLogo companyName={company.name} logoUrl={company.logo_url} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-primary mb-1">
            Employer Intelligence Report
          </p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight">
            {company.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {company.industry} · {company.state}
            {company.employee_count && ` · ${company.employee_count} employees`}
          </p>
        </div>
      </div>

      {/* Verdict card */}
      <div className={cn("rounded-xl border p-5", verdictStyle.bg, verdictStyle.border)}>
        <div className="flex items-center gap-3 mb-3">
          <Icon className={cn("w-6 h-6", verdictStyle.text)} />
          <span className={cn("text-lg font-bold", verdictStyle.text)}>
            {verdictText || "Evaluating…"}
          </span>
        </div>

        {/* Score pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Alignment</span>
            <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5">
              {alignmentScore}
            </Badge>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Risk</span>
            <Badge variant="outline" className={cn("text-xs font-bold px-2.5 py-0.5", verdictStyle.badge)}>
              {riskScore}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          Based on political spending, labor record, enforcement history, and public disclosures.
          Not an opinion. A reading of what's on file.
        </p>
      </div>
    </div>
  );
}
