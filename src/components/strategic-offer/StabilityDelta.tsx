import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getUiStatement } from "@/lib/signalPersonalization";
import { cn } from "@/lib/utils";

interface Props {
  companyId?: string;
  companyName: string;
  interviewStartDate?: Date;
}

interface SignalDelta {
  category: string;
  before: string;
  after: string;
  direction: string;
  summary: string;
  drifted: boolean;
}

const DIRECTION_ICON = {
  increase: TrendingUp,
  decrease: TrendingDown,
  stable: Minus,
};

const DIRECTION_COLOR = {
  increase: "text-[hsl(var(--civic-green))]",
  decrease: "text-destructive",
  stable: "text-muted-foreground",
};

export function StabilityDelta({ companyId, companyName, interviewStartDate }: Props) {
  const { data: deltas = [], isLoading } = useQuery({
    queryKey: ["stability-delta", companyId, interviewStartDate?.toISOString()],
    queryFn: async () => {
      if (!companyId || !interviewStartDate) return [];

      const isoDate = interviewStartDate.toISOString();

      // Get signals BEFORE interview start (most recent per category)
      const { data: beforeSignals } = await supabase
        .from("company_signal_scans" as any)
        .select("signal_category, normalized_value, direction, summary")
        .eq("company_id", companyId)
        .lt("scanned_at", isoDate)
        .order("scanned_at", { ascending: false })
        .limit(30);

      // Get signals AFTER interview start (most recent per category)
      const { data: afterSignals } = await supabase
        .from("company_signal_scans" as any)
        .select("signal_category, normalized_value, direction, summary")
        .eq("company_id", companyId)
        .gte("scanned_at", isoDate)
        .order("scanned_at", { ascending: false })
        .limit(30);

      // Deduplicate to latest per category
      const dedup = (arr: any[]) => {
        const map = new Map<string, any>();
        for (const s of arr || []) {
          if (!map.has(s.signal_category)) map.set(s.signal_category, s);
        }
        return map;
      };

      const beforeMap = dedup(beforeSignals || []);
      const afterMap = dedup(afterSignals || []);

      const results: SignalDelta[] = [];

      for (const [category, after] of afterMap) {
        const before = beforeMap.get(category);
        const beforeVal = before?.normalized_value || "not_disclosed";
        const afterVal = after.normalized_value;
        const drifted = beforeVal !== afterVal;

        results.push({
          category,
          before: getUiStatement(category, beforeVal),
          after: getUiStatement(category, afterVal),
          direction: after.direction || "stable",
          summary: after.summary || "",
          drifted,
        });
      }

      return results;
    },
    enabled: !!companyId && !!interviewStartDate,
  });

  if (!interviewStartDate || !companyId) return null;
  if (isLoading) return null;

  const driftedItems = deltas.filter(d => d.drifted);
  if (driftedItems.length === 0 && deltas.length === 0) return null;

  const hasDrift = driftedItems.length > 0;

  return (
    <div id="stability-delta">
      <Card className={cn(
        "rounded-2xl border",
        hasDrift ? "border-destructive/30 bg-destructive/[0.02]" : "border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/[0.02]"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              hasDrift ? "bg-destructive/10" : "bg-[hsl(var(--civic-green))]/10"
            )}>
              {hasDrift ? (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              ) : (
                <Clock className="w-4 h-4 text-[hsl(var(--civic-green))]" />
              )}
            </div>
            <div>
              <span className="text-foreground">
                {hasDrift ? "Signal Movement Detected" : "Signals Remain Consistent"}
              </span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                What has shifted at {companyName} since your process began
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {driftedItems.length > 0 ? (
            driftedItems.map((delta, i) => {
              const DirIcon = DIRECTION_ICON[delta.direction as keyof typeof DIRECTION_ICON] || Minus;
              const dirColor = DIRECTION_COLOR[delta.direction as keyof typeof DIRECTION_COLOR] || "text-muted-foreground";

              return (
                <div key={i} className="p-3 bg-background rounded-xl border border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs capitalize">
                      {delta.category.replace(/_/g, " ")}
                    </Badge>
                    <DirIcon className={cn("w-3.5 h-3.5", dirColor)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Before Interview</p>
                      <p className="text-foreground font-medium">{delta.before}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Current</p>
                      <p className={cn("font-medium", dirColor)}>{delta.after}</p>
                    </div>
                  </div>
                  {delta.summary && (
                    <p className="text-xs text-muted-foreground italic">{delta.summary}</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              All signals remain stable since your interview process began. No new risk factors detected.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
