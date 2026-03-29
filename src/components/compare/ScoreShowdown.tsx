import { cn } from "@/lib/utils";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  employer_clarity_score: number;
}

function scoreBand(score: number) {
  if (score >= 80) return { label: "High Clarity", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", bar: "bg-[hsl(var(--civic-green))]" };
  if (score >= 60) return { label: "Moderate", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", bar: "bg-[hsl(var(--civic-yellow))]" };
  if (score >= 40) return { label: "Low Clarity", color: "text-[hsl(var(--civic-red))]", bg: "bg-[hsl(var(--civic-red))]/10", bar: "bg-[hsl(var(--civic-red))]" };
  return { label: "Opaque", color: "text-destructive", bg: "bg-destructive/10", bar: "bg-destructive" };
}

export function ScoreShowdown({ companyA, companyB }: { companyA: CompanyData; companyB: CompanyData }) {
  const aWins = companyA.employer_clarity_score > companyB.employer_clarity_score;
  const bWins = companyB.employer_clarity_score > companyA.employer_clarity_score;
  const tie = companyA.employer_clarity_score === companyB.employer_clarity_score;
  const bandA = scoreBand(companyA.employer_clarity_score);
  const bandB = scoreBand(companyB.employer_clarity_score);

  return (
    <div className="border border-border bg-card overflow-hidden mb-8">
      {/* Section header */}
      <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-primary font-semibold">
          Employer Clarity Showdown
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border">
        {[
          { company: companyA, band: bandA, isWinner: aWins },
          { company: companyB, band: bandB, isWinner: bWins },
        ].map(({ company, band, isWinner }, idx) => (
          <div key={company.id} className={cn("p-6 text-center relative", isWinner && "bg-primary/[0.03]")}>
            {isWinner && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 font-mono text-xs tracking-wider uppercase text-primary bg-primary/10 px-2 py-1 border border-primary/20">
                  <Trophy className="w-2.5 h-2.5" /> Winner
                </span>
              </div>
            )}
            <div className="font-bold text-sm text-foreground mb-4">{company.name}</div>
            
            {/* Big score */}
            <div className="relative inline-block mb-3">
              <span className="font-mono text-6xl font-black text-foreground leading-none">
                {company.employer_clarity_score}
              </span>
              <span className="font-mono text-sm text-muted-foreground ml-1">/100</span>
            </div>

            {/* Score bar */}
            <div className="w-full max-w-[200px] mx-auto h-2 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className={cn("h-full rounded-full transition-all duration-1000", band.bar)}
                style={{ width: `${company.employer_clarity_score}%` }}
              />
            </div>

            {/* Badge */}
            <span className={cn("inline-flex items-center gap-1 font-mono text-xs tracking-wider uppercase px-2.5 py-1 border", band.color, band.bg, `border-current/20`)}>
              {isWinner ? <TrendingUp className="w-3 h-3" /> : tie ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {band.label}
            </span>
          </div>
        ))}
      </div>

      {/* Verdict strip */}
      <div className="px-5 py-3 border-t border-border bg-muted/10 text-center">
        <span className="font-mono text-xs tracking-wider text-muted-foreground">
          {tie
            ? "Dead heat — both employers score equally on transparency."
            : `${aWins ? companyA.name : companyB.name} leads by ${Math.abs(companyA.employer_clarity_score - companyB.employer_clarity_score)} points in employer clarity.`
          }
        </span>
      </div>
    </div>
  );
}
