import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Headphones, Users, TrendingDown, TrendingUp, Minus, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  companyId?: string;
  companyName: string;
}

export function RecruitingHealthCard({ companyId, companyName }: Props) {
  // Pull recruiter/TA-related jobs and turnover signals
  const { data: taJobs } = useQuery({
    queryKey: ["recruiting-health-jobs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_jobs")
        .select("title, department, posted_at, is_active, seniority_level")
        .eq("company_id", companyId!)
        .or("title.ilike.%recruiter%,title.ilike.%talent%,title.ilike.%sourcer%,department.ilike.%recruiting%,department.ilike.%people%,department.ilike.%human resources%");
      return data || [];
    },
  });

  const { data: allJobs } = useQuery({
    queryKey: ["recruiting-health-total", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { count } = await supabase
        .from("company_jobs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!)
        .eq("is_active", true);
      return count || 0;
    },
  });

  const { data: execs } = useQuery({
    queryKey: ["recruiting-health-execs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("title, departed_at, created_at")
        .eq("company_id", companyId!)
        .or("title.ilike.%talent%,title.ilike.%people%,title.ilike.%recruiting%,title.ilike.%human resources%,title.ilike.%HR%,title.ilike.%chief people%");
      return data || [];
    },
  });

  if (!companyId) return null;

  const recruitingJobs = taJobs || [];
  const totalActive = allJobs || 0;
  const taExecs = execs || [];

  // Signals
  const activeRecruiterOpenings = recruitingJobs.filter(j => j.is_active).length;
  const seniorTAOpenings = recruitingJobs.filter(j =>
    j.is_active && (j.seniority_level?.toLowerCase().includes("senior") || j.seniority_level?.toLowerCase().includes("director") || j.seniority_level?.toLowerCase().includes("head") || j.title.toLowerCase().includes("head of") || j.title.toLowerCase().includes("director"))
  ).length;

  // TA leadership stability
  const departedTA = taExecs.filter(e => e.departed_at);
  const taLeadershipTurnover = taExecs.length > 0 ? Math.round((departedTA.length / taExecs.length) * 100) : null;

  // Recruiter-to-hire ratio (approximate)
  const recruiterToReqRatio = activeRecruiterOpenings > 0 && totalActive > 0
    ? Math.round(totalActive / activeRecruiterOpenings)
    : null;

  // Overall health assessment
  const hasSignals = activeRecruiterOpenings > 0 || taExecs.length > 0;

  const healthSignals: { label: string; value: string; status: "strong" | "caution" | "weak" | "unknown"; detail: string }[] = [
    {
      label: "TA Team Openings",
      value: `${activeRecruiterOpenings}`,
      status: activeRecruiterOpenings === 0 ? "unknown" : activeRecruiterOpenings > 5 ? "caution" : "strong",
      detail: activeRecruiterOpenings === 0
        ? "No recruiting team openings detected"
        : activeRecruiterOpenings > 5
        ? "High number of TA openings may signal team instability or rapid scaling"
        : "Normal recruiting team staffing levels",
    },
    {
      label: "Senior TA Roles Open",
      value: seniorTAOpenings > 0 ? `${seniorTAOpenings} open` : "None detected",
      status: seniorTAOpenings > 1 ? "weak" : seniorTAOpenings === 1 ? "caution" : "strong",
      detail: seniorTAOpenings > 1
        ? "Multiple senior TA vacancies suggest leadership gap in hiring function"
        : seniorTAOpenings === 1
        ? "One senior TA vacancy — could be growth or replacement"
        : "No senior recruiting leadership gaps detected",
    },
    {
      label: "TA Leadership Stability",
      value: taLeadershipTurnover !== null ? `${taLeadershipTurnover}% turnover` : "No data",
      status: taLeadershipTurnover === null ? "unknown" : taLeadershipTurnover > 40 ? "weak" : taLeadershipTurnover > 20 ? "caution" : "strong",
      detail: taLeadershipTurnover === null
        ? "Insufficient data to assess talent leadership stability"
        : taLeadershipTurnover > 40
        ? "High TA leadership turnover — hiring process likely disrupted"
        : taLeadershipTurnover > 20
        ? "Moderate TA leadership changes — monitor for process consistency"
        : "Stable talent acquisition leadership",
    },
    {
      label: "Recruiter-to-Req Ratio",
      value: recruiterToReqRatio !== null ? `1:${recruiterToReqRatio}` : "N/A",
      status: recruiterToReqRatio === null ? "unknown" : recruiterToReqRatio > 30 ? "weak" : recruiterToReqRatio > 15 ? "caution" : "strong",
      detail: recruiterToReqRatio === null
        ? "Cannot estimate — no recruiter listings detected"
        : recruiterToReqRatio > 30
        ? "Very high req load per recruiter — expect slow hiring and candidate ghosting"
        : recruiterToReqRatio > 15
        ? "Moderate req load — hiring may be slower than ideal"
        : "Reasonable recruiter capacity for open positions",
    },
  ];

  const weakCount = healthSignals.filter(s => s.status === "weak").length;
  const cautionCount = healthSignals.filter(s => s.status === "caution").length;
  const overallHealth = weakCount >= 2 ? "Weak" : weakCount >= 1 || cautionCount >= 2 ? "Mixed" : "Stable";
  const overallColor = overallHealth === "Weak" ? "text-destructive" : overallHealth === "Mixed" ? "text-[hsl(var(--civic-yellow))]" : "text-[hsl(var(--civic-green))]";

  const STATUS_STYLES = {
    strong: "border-[hsl(var(--civic-green))]/15 bg-[hsl(var(--civic-green))]/5",
    caution: "border-[hsl(var(--civic-yellow))]/15 bg-[hsl(var(--civic-yellow))]/5",
    weak: "border-destructive/15 bg-destructive/5",
    unknown: "border-border/30 bg-muted/20",
  };
  const STATUS_COLOR = {
    strong: "text-[hsl(var(--civic-green))]",
    caution: "text-[hsl(var(--civic-yellow))]",
    weak: "text-destructive",
    unknown: "text-muted-foreground",
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Headphones className="w-4 h-4 text-primary" />
            Recruiting Infrastructure Health
          </CardTitle>
          <Badge variant="outline" className={cn("text-[10px]", overallColor)}>
            {overallHealth}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Talent acquisition team stability and capacity signals
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {healthSignals.map(signal => (
          <div
            key={signal.label}
            className={cn("flex items-start gap-3 p-3 rounded-xl border", STATUS_STYLES[signal.status])}
          >
            <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", {
              "bg-[hsl(var(--civic-green))]": signal.status === "strong",
              "bg-[hsl(var(--civic-yellow))]": signal.status === "caution",
              "bg-destructive": signal.status === "weak",
              "bg-muted-foreground/40": signal.status === "unknown",
            })} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{signal.label}</span>
                <span className={cn("text-xs font-bold", STATUS_COLOR[signal.status])}>{signal.value}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{signal.detail}</p>
            </div>
          </div>
        ))}

        <p className="text-[10px] text-muted-foreground border-t border-border pt-2 mt-3">
          Recruiting team instability correlates with longer hiring cycles, candidate ghosting, and poor onboarding.
          Sources: Job postings, leadership records, career pages.
        </p>
      </CardContent>
    </Card>
  );
}
