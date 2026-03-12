import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";

const TRANSPARENCY_ITEMS = [
  { key: "representation", label: "Representation Data" },
  { key: "yoy_changes", label: "Year-over-Year Workforce Changes" },
  { key: "promotion_data", label: "Promotion / Advancement Data" },
  { key: "retention_data", label: "Retention Data" },
  { key: "pay_equity", label: "Pay Equity Statements w/ Methodology" },
];

export function TransparencyScoreCard({
  signals,
  companyName,
}: {
  signals: any[];
  companyName: string;
}) {
  const detected = TRANSPARENCY_ITEMS.map((item) => {
    const found = signals.some(
      (s) =>
        s.value_category === item.key ||
        s.signal_type?.toLowerCase().includes(item.key.replace(/_/g, " ")) ||
        s.signal_summary?.toLowerCase().includes(item.label.toLowerCase().split(" ")[0].toLowerCase())
    );
    return { ...item, found };
  });

  const coveredCount = detected.filter((d) => d.found).length;
  const pct = Math.round((coveredCount / TRANSPARENCY_ITEMS.length) * 100);

  const level =
    pct >= 80 ? { label: "High Transparency", color: "text-civic-green" } :
    pct >= 50 ? { label: "Moderate Transparency", color: "text-primary" } :
    pct >= 20 ? { label: "Limited Public Disclosure", color: "text-civic-yellow" } :
    { label: "Transparency Gap", color: "text-destructive" };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Transparency Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-3">
          <span className={cn("text-3xl font-black tabular-nums", level.color)}>{pct}%</span>
          <Badge variant="outline" className={cn("text-xs", level.color)}>{level.label}</Badge>
        </div>

        <div className="space-y-1.5">
          {detected.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-xs">
              {item.found ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-civic-green shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span className={cn("font-medium", item.found ? "text-foreground" : "text-muted-foreground")}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border">
          Companies that publicly report advancement data score higher.
          Absence of disclosure is itself a meaningful accountability signal.
        </p>
      </CardContent>
    </Card>
  );
}
