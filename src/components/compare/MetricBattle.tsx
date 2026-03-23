import { cn } from "@/lib/utils";
import { Shield, Landmark, DollarSign, TrendingUp, Zap } from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  civic_footprint_score: number;
  total_pac_spending: number;
  lobbying_spend: number | null;
  government_contracts: number | null;
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const METRICS = [
  { key: "civic_footprint_score", label: "Employer Clarity Score", icon: Shield, format: (v: number) => `${v}/100`, compare: "higher" as const, description: "Overall transparency & accountability" },
  { key: "total_pac_spending", label: "PAC Spending", icon: Landmark, format: formatCurrency, compare: "lower" as const, description: "Direct political action committee spend" },
  { key: "lobbying_spend", label: "Lobbying Spend", icon: DollarSign, format: (v: number) => v ? formatCurrency(v) : "None reported", compare: "lower" as const, description: "Registered federal lobbying expenditure" },
  { key: "government_contracts", label: "Gov. Contracts", icon: TrendingUp, format: (v: number) => v ? formatCurrency(v) : "None", compare: "neutral" as const, description: "Federal contract awards" },
];

function getWinner(valA: number, valB: number, compare: string) {
  if (compare === "higher") return valA > valB ? "a" : valB > valA ? "b" : null;
  if (compare === "lower") return valA < valB ? "a" : valB < valA ? "b" : null;
  return null;
}

export function MetricBattle({ companyA, companyB }: { companyA: CompanyData; companyB: CompanyData }) {
  return (
    <div className="border border-border bg-card overflow-hidden mb-8">
      <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-primary font-semibold">
          Head-to-Head Metrics
        </span>
      </div>

      {METRICS.map(({ key, label, icon: Icon, format, compare, description }) => {
        const valA = (companyA as any)[key] || 0;
        const valB = (companyB as any)[key] || 0;
        const winner = getWinner(valA, valB, compare);
        const maxVal = Math.max(valA, valB) || 1;

        return (
          <div key={key} className="border-b border-border last:border-0">
            {/* Metric label */}
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
              <span className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">{label}</span>
              <span className="text-xs text-muted-foreground/60 ml-auto hidden sm:inline">{description}</span>
            </div>

            {/* Battle bars */}
            <div className="px-5 pb-4 space-y-2">
              {[
                { company: companyA, val: valA, isWinner: winner === "a", side: "a" },
                { company: companyB, val: valB, isWinner: winner === "b", side: "b" },
              ].map(({ company, val, isWinner }) => (
                <div key={company.id} className="flex items-center gap-3">
                  <span className={cn("font-mono text-xs w-24 truncate", isWinner ? "text-primary font-bold" : "text-muted-foreground")}>
                    {company.name}
                  </span>
                  <div className="flex-1 h-6 bg-muted/40 relative overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000 ease-out flex items-center justify-end pr-2",
                        isWinner
                          ? "bg-primary/20 border-r-2 border-primary"
                          : "bg-muted/60"
                      )}
                      style={{ width: `${Math.max((val / maxVal) * 100, 8)}%` }}
                    >
                      <span className={cn(
                        "font-mono text-xs font-bold whitespace-nowrap",
                        isWinner ? "text-primary" : "text-muted-foreground"
                      )}>
                        {format(val)}
                      </span>
                    </div>
                  </div>
                  {isWinner && (
                    <span className="font-mono text-[7px] tracking-widest uppercase text-primary bg-primary/10 px-1.5 py-0.5 border border-primary/20">
                      {compare === "lower" ? "Lower" : "Leads"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
