import { CheckCircle2, AlertCircle, Info, TrendingUp, Users, Shield, Briefcase, Heart, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InsightItem {
  key: string;
  label: string;
  found: boolean;
  detail?: string;
  icon: React.ReactNode;
}

interface ProfileInsightsSummaryProps {
  companyName: string;
  hasPoliticalSpending: boolean;
  insights: InsightItem[];
}

export function ProfileInsightsSummary({ companyName, hasPoliticalSpending, insights }: ProfileInsightsSummaryProps) {
  const foundInsights = insights.filter(i => i.found);
  const notFoundInsights = insights.filter(i => !i.found);

  // If the company has political spending, don't show this component — the standard cards handle it
  if (hasPoliticalSpending) return null;

  // If nothing was found at all, don't show (the "no detailed data" banner already covers this)
  if (foundInsights.length === 0 && notFoundInsights.length === 0) return null;

  return (
    <Card className="mb-8 border-border/60 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-6 py-5 bg-muted/30 border-b border-border/40">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">
                {foundInsights.length > 0
                  ? `What we found for ${companyName}`
                  : `No political spending detected for ${companyName}`
                }
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {foundInsights.length > 0
                  ? `No PAC, lobbying, or political donation records found — but we detected ${foundInsights.length} other signal${foundInsights.length > 1 ? 's' : ''} worth reviewing.`
                  : "This company has no detectable political footprint in public records. That's a finding in itself."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Found signals — highlighted */}
        {foundInsights.length > 0 && (
          <div className="px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Signals Detected</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {foundInsights.map((insight) => (
                <div
                  key={insight.key}
                  className="flex items-start gap-3 p-3 rounded-lg bg-primary/[0.04] border border-primary/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {insight.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{insight.label}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    </div>
                    {insight.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not found — muted, compact */}
        {notFoundInsights.length > 0 && (
          <div className={cn("px-6 py-4 border-t border-border/30", foundInsights.length === 0 && "border-t-0")}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Not Detected in Public Records</p>
            <div className="flex flex-wrap gap-2">
              {notFoundInsights.map((insight) => (
                <Badge key={insight.key} variant="outline" className="text-muted-foreground/70 font-normal gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  {insight.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="px-6 py-3 bg-muted/20 border-t border-border/30">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            This reflects what was found in publicly available federal and state databases. Private companies and those with indirect influence channels may not appear in these records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
