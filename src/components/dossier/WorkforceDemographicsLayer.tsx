import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, BarChart3, Scale, Briefcase, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface WorkforceDemographicsProps {
  companyId: string;
  companyName: string;
}

function SignalCard({ signal }: { signal: any }) {
  const confidence = signal.confidence === "direct" ? "Strong Evidence"
    : signal.confidence === "strong_inference" ? "Likely Connection"
    : "Possible Connection";
  const confidenceColor = signal.confidence === "direct" ? "bg-civic-green/10 text-civic-green border-civic-green/20"
    : signal.confidence === "strong_inference" ? "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20"
    : "bg-muted text-muted-foreground border-border/40";

  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="font-medium text-foreground text-caption">{signal.signal_type}</span>
        <Badge variant="outline" className={`text-micro shrink-0 ${confidenceColor}`}>{confidence}</Badge>
      </div>
      {signal.evidence_text && (
        <p className="text-caption text-muted-foreground leading-relaxed line-clamp-3">{signal.evidence_text}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className="text-micro">{signal.source_type || "Public Record"}</Badge>
        {signal.source_url && (
          <a href={signal.source_url} target="_blank" rel="noopener noreferrer" className="text-micro text-primary hover:underline">
            View Source
          </a>
        )}
      </div>
    </div>
  );
}

export function WorkforceDemographicsLayer({ companyId, companyName }: WorkforceDemographicsProps) {
  const { data: payEquity } = useQuery({
    queryKey: ["demographics-pay-equity", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("pay_equity_signals" as any)
        .select("*")
        .eq("company_id", companyId);
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const { data: promotionSignals } = useQuery({
    queryKey: ["demographics-promotion", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("promotion_equity_signals" as any)
        .select("*")
        .eq("company_id", companyId);
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const { data: jobs } = useQuery({
    queryKey: ["demographics-jobs", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_jobs")
        .select("department, seniority_level, work_mode")
        .eq("company_id", companyId)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Compute role distribution from jobs
  const roleDist = (jobs || []).reduce((acc: Record<string, number>, job) => {
    const dept = job.department || "Other";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const totalJobs = Object.values(roleDist).reduce((a: number, b: number) => a + b, 0);
  const sortedRoles = Object.entries(roleDist).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const hasData = (payEquity && payEquity.length > 0) || (promotionSignals && promotionSignals.length > 0) || totalJobs > 0;

  if (!hasData) {
    return (
      <div className="text-center py-8">
        <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground">
          No workforce demographics data available yet for {companyName}. This section updates automatically when new signals are detected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Role Distribution */}
      {totalJobs > 0 && (
        <Card className="border-border/30">
          <CardContent className="p-5">
            <h4 className="font-semibold text-foreground text-body flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-primary" /> Role Distribution
              <Badge variant="secondary" className="text-micro">{totalJobs} active roles</Badge>
            </h4>
            <div className="space-y-3">
              {sortedRoles.map(([dept, count]) => (
                <div key={dept}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption text-foreground">{dept}</span>
                    <span className="text-micro text-muted-foreground font-mono">{count} ({Math.round(((count as number) / totalJobs) * 100)}%)</span>
                  </div>
                  <Progress value={((count as number) / totalJobs) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pay Equity Signals */}
      {payEquity && payEquity.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground text-body flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-primary" /> Pay Equity & Compensation Signals
            <Badge variant="secondary" className="text-micro">{payEquity.length} signals</Badge>
          </h4>
          <div className="space-y-2">
            {payEquity.map((s: any) => <SignalCard key={s.id} signal={s} />)}
          </div>
        </div>
      )}

      {/* Promotion Equity Signals */}
      {promotionSignals && promotionSignals.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground text-body flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" /> Promotion Equity Signals
            <Badge variant="secondary" className="text-micro">{promotionSignals.length} signals</Badge>
          </h4>
          <div className="space-y-2">
            {promotionSignals.map((s: any) => <SignalCard key={s.id} signal={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}
