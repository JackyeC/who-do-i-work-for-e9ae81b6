import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopRecipient } from "@/types/follow-the-money";

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

interface Props {
  recipients: TopRecipient[];
}

export function TopRecipientsList({ recipients }: Props) {
  if (recipients.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Top Recipients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2" aria-label="Top political contribution recipients">
          {recipients.map((r, i) => (
            <li
              key={`${r.name}-${i}`}
              className="flex items-center justify-between gap-2 py-1.5 border-b border-border/20 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
                  {i + 1}.
                </span>
                <span className="text-sm text-foreground truncate">{r.name}</span>
                {r.party && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      r.party === "DEM"
                        ? "bg-blue-500/15 text-blue-400"
                        : r.party === "REP"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {r.party}
                  </span>
                )}
              </div>
              <span className="text-sm font-mono font-medium text-primary shrink-0">
                {formatCurrency(r.amount)}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
