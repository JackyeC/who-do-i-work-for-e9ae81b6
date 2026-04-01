import { Shield, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PolicySignal {
  id: string;
  issue_category: string;
  signal_type: string;
  description: string;
  confidence_score: string;
  amount: number | null;
}

function confidenceLabel(score: number): { label: string; variant: "destructive" | "default" | "secondary" } {
  if (score >= 0.75) return { label: "Strong Evidence", variant: "destructive" };
  if (score >= 0.5) return { label: "Likely Connection", variant: "default" };
  return { label: "Possible Connection", variant: "secondary" };
}

function isWorkRelated(category: string): boolean {
  const workCategories = [
    "labor", "hiring", "compensation", "workplace_safety", "workforce_stability",
    "organizing", "discrimination", "benefits", "ai_bias", "worker_protection",
    "wage_theft", "retaliation", "non_compete", "immigration_workforce",
  ];
  return workCategories.some(c => category.toLowerCase().includes(c));
}

interface SignalExamplesProps {
  companyId?: string;
}

export function SignalExamples({ companyId }: SignalExamplesProps) {
  const { data: signals, isLoading } = useQuery({
    queryKey: ["policy-signals", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("issue_signals")
        .select("id, issue_category, signal_type, description, confidence_score, amount")
        .eq("entity_id", companyId)
        .gte("confidence_score", 0.4)
        .order("confidence_score", { ascending: false })
        .limit(20);
      // Filter to work-related signals only
      return (data || []).filter((s: PolicySignal) => isWorkRelated(s.issue_category)).slice(0, 5);
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <p className="text-caption text-muted-foreground">Checking for verified policy signals…</p>
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="py-6 text-center space-y-2">
        <Shield className="w-7 h-7 text-muted-foreground/40 mx-auto" />
        <p className="text-caption text-muted-foreground font-medium">
          No verified work-related policy signals for this employer.
        </p>
        <p className="text-micro text-muted-foreground/70 max-w-md mx-auto">
          WDIWF only surfaces policy signals with a real event, a documented work impact, and a verified connection to this employer. When one is detected, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />
        <h4 className="text-sm font-semibold text-foreground">Work-Related Policy Signals</h4>
      </div>
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/20 mb-1">
        <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-micro text-muted-foreground leading-relaxed">
          Each signal below is tied to a verified policy event that affects how people are hired, paid, treated, or protected at this employer.
        </p>
      </div>
      {signals.map((signal: PolicySignal) => {
        const conf = confidenceLabel(signal.confidence_score);
        return (
          <div
            key={signal.id}
            className="rounded-xl border border-border/40 bg-card p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-micro font-mono text-muted-foreground uppercase">
                    {signal.issue_category.replace(/_/g, " ")}
                  </span>
                  <Badge variant={conf.variant} className="text-xs">
                    {conf.label}
                  </Badge>
                </div>
                <h5 className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                  {signal.signal_type.replace(/_/g, " ")}
                </h5>
              </div>
            </div>
            <p className="text-caption text-muted-foreground leading-relaxed">{signal.description}</p>
          </div>
        );
      })}
    </div>
  );
}
