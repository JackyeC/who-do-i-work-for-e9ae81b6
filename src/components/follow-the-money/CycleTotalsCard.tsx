import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ElectionCycle } from "@/types/follow-the-money";

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

interface Props {
  cycles: ElectionCycle[];
}

export function CycleTotalsCard({ cycles }: Props) {
  if (cycles.length === 0) return null;

  const maxAmount = Math.max(...cycles.map((c) => c.totalAmount), 1);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Spending by Election Cycle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cycles.map((cycle) => {
          const pct = Math.round((cycle.totalAmount / maxAmount) * 100);
          return (
            <div key={cycle.cycle} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-foreground font-mono">
                  {cycle.cycle}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">
                    {cycle.contributionCount} record{cycle.contributionCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-sm font-semibold text-primary font-mono">
                    {formatCurrency(cycle.totalAmount)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted/40 rounded overflow-hidden">
                <div
                  className="h-full rounded bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
