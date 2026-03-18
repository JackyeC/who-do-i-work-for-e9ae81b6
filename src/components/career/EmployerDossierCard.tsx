import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge, scoreToConfidence } from "@/components/ConfidenceBadge";
import type { CompanyResult } from "./EmployerDossierSearch";

function getRiskLevel(company: CompanyResult) {
  if (company.dossier) {
    const l = company.dossier.risk_level;
    if (l === "Low") return { label: "Low Risk", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/30" };
    if (l === "Moderate") return { label: "Moderate Risk", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/30" };
    return { label: "High Risk", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" };
  }
  const score = company.career_intelligence_score ?? company.civic_footprint_score / 10;
  if (score >= 7) return { label: "Low Risk", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/30" };
  if (score >= 4) return { label: "Moderate Risk", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/30" };
  return { label: "High Risk", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" };
}

function getScore(company: CompanyResult): number {
  if (company.dossier) return company.dossier.score;
  return company.career_intelligence_score ?? Math.min(10, company.civic_footprint_score / 10);
}

interface EmployerDossierCardProps {
  company: CompanyResult;
}

export function EmployerDossierCard({ company }: EmployerDossierCardProps) {
  const score = getScore(company);
  const risk = getRiskLevel(company);
  const confidenceVal = company.dossier
    ? (company.dossier.confidence === "High" ? 0.9 : company.dossier.confidence === "Medium" ? 0.6 : 0.3)
    : (company.confidence_rating === "high" ? 0.9 : company.confidence_rating === "medium" ? 0.6 : 0.3);
  const confidence = scoreToConfidence(confidenceVal);

  return (
    <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-elevated max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">{company.name}</h2>
        <div className="flex gap-2">
          <Badge variant="outline" className={risk.bg}>{risk.label}</Badge>
          <ConfidenceBadge level={confidence} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-5">{company.industry} · {company.state} {company.employee_count ? `· ${company.employee_count} employees` : ""}</p>

      <div className="text-center py-4">
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Employer Clarity Score</div>
        <div className="flex items-end justify-center gap-2">
          <span className={`font-data text-6xl sm:text-7xl font-black tabular-nums ${risk.color}`}>
            {score.toFixed(1)}
          </span>
          <span className="text-lg text-muted-foreground mb-2">/10</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden max-w-xs mx-auto mt-3">
          <div
            className={`h-full rounded-full transition-all ${score >= 7 ? "bg-[hsl(var(--civic-green))]" : score >= 4 ? "bg-[hsl(var(--civic-yellow))]" : "bg-destructive"}`}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-foreground/80 text-center mt-3 font-medium">
        {company.dossier?.bottom_line
          ? company.dossier.bottom_line
          : score >= 7
            ? "Strong signals across transparency and governance — a solid foundation."
            : score >= 4
              ? "Mixed signals — worth a deeper look before committing."
              : "Limited transparency — proceed with caution and ask hard questions."}
      </p>

      <p className="text-[11px] text-muted-foreground text-center mt-4 italic">
        Sources analyzed: {company.dossier?.sources_note || "public filings, workforce data, compensation benchmarks, and employee sentiment signals"}
      </p>
    </div>
  );
}
