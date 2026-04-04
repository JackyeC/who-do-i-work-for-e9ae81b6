import { useEvaluation } from "@/contexts/EvaluationContext";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  company: {
    name: string;
    logo_url?: string | null;
    industry: string;
    state: string;
    employee_count?: string | null;
    vetted_status?: string | null;
  };
}

/**
 * Decisive verdict header for the top of a company dossier.
 * Shows company identity + alignment/risk scores + values-driven verdict with explanation.
 */
export function DossierVerdictHeader({ company }: Props) {
  const { alignmentScore, riskScore, verdictText, verdictReasons } = useEvaluation();

  const riskLevel = riskScore < 40 ? "low" : riskScore < 65 ? "medium" : "high";
  const Icon = riskLevel === "low" ? ShieldCheck : riskLevel === "medium" ? AlertTriangle : XCircle;

  const verdictStyle = {
    low: {
      bg: "bg-[hsl(var(--civic-green))]/5",
      border: "border-[hsl(var(--civic-green))]/30",
      text: "text-[hsl(var(--civic-green))]",
      badge: "border-[hsl(var(--civic-green))]/40 text-[hsl(var(--civic-green))]",
    },
    medium: {
      bg: "bg-[hsl(var(--civic-yellow))]/5",
      border: "border-[hsl(var(--civic-yellow))]/30",
      text: "text-[hsl(var(--civic-yellow))]",
      badge: "border-[hsl(var(--civic-yellow))]/40 text-[hsl(var(--civic-yellow))]",
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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              {company.industry} · {company.state}
              {company.employee_count && ` · ${company.employee_count} employees`}
            </p>
            {company.vetted_status === "fully_audited" && (
              <Badge
                variant="outline"
                className="text-[9px] gap-1 px-1.5 py-0 border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/[0.06]"
              >
                <ShieldCheck className="w-2.5 h-2.5" />
                Audit Complete
              </Badge>
            )}
          </div>
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

        {/* Values-driven explanation */}
        {verdictReasons.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary">
                Why this verdict — based on your profile
              </span>
            </div>
            <ul className="space-y-1">
              {verdictReasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-2">
                  <span className="text-primary mt-0.5">·</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
          Not an opinion. A reading of what's on file, scored against what you said matters.
        </p>
      </div>
    </div>
  );
}
