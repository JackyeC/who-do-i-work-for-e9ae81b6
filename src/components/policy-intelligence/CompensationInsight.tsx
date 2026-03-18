import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import type { Situation } from "@/lib/policyScoreEngine";

interface Props {
  companyId: string;
  companyName: string;
  situations: Situation[];
}

export function CompensationInsight({ companyId, companyName, situations }: Props) {
  const { data: signals = [] } = useQuery({
    queryKey: ["comp-insight-signals", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_signal_scans")
        .select("signal_category, normalized_value, direction, summary")
        .eq("company_id", companyId)
        .in("signal_category", ["compensation_transparency", "hiring_activity"])
        .limit(6);
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const compTransp = signals.find((s: any) => s.signal_category === "compensation_transparency");
  const hiringSignal = signals.find((s: any) => s.signal_category === "hiring_activity");

  const isCompFocused = situations.includes("compensation");
  const isEarlyCareer = situations.includes("early-career");
  const isCaregiver = situations.includes("caregiver");

  if (signals.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-primary" />
        Compensation Context
      </h3>

      <div className="grid gap-2">
        {compTransp && (
          <Card className="border-border/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground">Pay Transparency</p>
                <Badge variant={Number(compTransp.normalized_value) >= 60 ? "success" : "warning"} className="text-xs">
                  {Number(compTransp.normalized_value) >= 60 ? "Transparent" : "Limited"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{compTransp.summary}</p>
            </CardContent>
          </Card>
        )}

        {hiringSignal && (
          <Card className="border-border/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground">Hiring Activity</p>
                <Badge variant="outline" className="text-xs">{hiringSignal.direction}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{hiringSignal.summary}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Situation-aware callout */}
      {isCompFocused && (
        <p className="text-xs text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/5 border border-[hsl(var(--civic-yellow))]/20 rounded-lg px-3 py-2">
          💰 As someone focused on compensation, pay close attention to transparency signals and below-market indicators.
        </p>
      )}
      {isEarlyCareer && (
        <p className="text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          🚀 Early in your career? Weigh growth potential and learning opportunities against initial pay.
        </p>
      )}
      {isCaregiver && (
        <p className="text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          👨‍👩‍👧 Benefits, healthcare, and flexibility often matter more than base salary for caregivers.
        </p>
      )}
    </div>
  );
}
