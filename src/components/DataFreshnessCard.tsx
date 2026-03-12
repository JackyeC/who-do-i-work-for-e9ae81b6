import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataFreshnessCardProps {
  lastReviewed?: string | null;
  updatedAt?: string | null;
  recordStatus?: string;
  scanCompletion?: Record<string, boolean> | null;
}

function freshnessLabel(dateStr: string): { label: string; stale: boolean } {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return { label: "Updated this week", stale: false };
  if (days <= 30) return { label: `Updated ${days} days ago`, stale: false };
  if (days <= 90) return { label: `Updated ${days} days ago`, stale: false };
  return { label: `Last updated ${days} days ago`, stale: true };
}

const CONFIDENCE_TIERS = [
  {
    level: "High",
    icon: ShieldCheck,
    className: "text-[hsl(var(--civic-green))]",
    sources: "WARN filings · SEC filings · FEC data · Federal contracts · Government labor databases",
    note: "Directly influences Employer Clarity Score",
  },
  {
    level: "Moderate",
    icon: Info,
    className: "text-[hsl(var(--civic-yellow))]",
    sources: "Company disclosures · Earnings calls · Verified financial reporting",
    note: "Influences Employer Clarity Score",
  },
  {
    level: "Low",
    icon: AlertTriangle,
    className: "text-muted-foreground",
    sources: "News reports · User submissions · Unverified sources",
    note: "Shown in reports but does not affect scoring",
  },
];

export function DataFreshnessCard({ lastReviewed, updatedAt, recordStatus, scanCompletion }: DataFreshnessCardProps) {
  const dateStr = updatedAt || lastReviewed;
  const freshness = dateStr ? freshnessLabel(dateStr) : null;

  const scanKeys = scanCompletion ? Object.values(scanCompletion) : [];
  const completedScans = scanKeys.filter(Boolean).length;
  const totalScans = scanKeys.length || 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Data Freshness */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Data Freshness</span>
          </div>
          {freshness ? (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                freshness.stale
                  ? "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30"
                  : "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30"
              )}
            >
              {freshness.label}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">No timestamp</Badge>
          )}
        </div>

        {dateStr && (
          <p className="text-[10px] text-muted-foreground">
            Last verified: {new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}

        {totalScans > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Scan coverage</span>
              <span className="font-medium text-foreground">{completedScans}/{totalScans} modules</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(completedScans / totalScans) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Confidence Tiers Legend */}
        <div className="pt-2 border-t border-border space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Signal Confidence Tiers</p>
          {CONFIDENCE_TIERS.map((tier) => (
            <div key={tier.level} className="flex items-start gap-2">
              <tier.icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", tier.className)} />
              <div>
                <span className={cn("text-xs font-medium", tier.className)}>{tier.level} Confidence</span>
                <p className="text-[10px] text-muted-foreground">{tier.sources}</p>
                <p className="text-[10px] text-muted-foreground/70 italic">{tier.note}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
