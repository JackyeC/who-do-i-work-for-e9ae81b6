import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ghost, Clock, RefreshCw, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  companyId?: string;
  companyName: string;
}

interface JobRow {
  id: string;
  title: string;
  posted_at: string | null;
  scraped_at: string;
  is_active: boolean;
  source_url: string | null;
  department: string | null;
  salary_range: string | null;
  last_verified_at: string | null;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function GhostJobDetector({ companyId, companyName }: Props) {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["ghost-jobs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_jobs")
        .select("id, title, posted_at, scraped_at, is_active, source_url, department, salary_range, last_verified_at")
        .eq("company_id", companyId!)
        .eq("is_active", true);
      return (data || []) as JobRow[];
    },
  });

  if (isLoading) {
    return <Card><CardContent className="p-5"><Skeleton className="h-36 w-full" /></CardContent></Card>;
  }

  if (!companyId) return null;

  const activeJobs = jobs || [];
  const totalActive = activeJobs.length;

  if (totalActive === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ghost className="w-4 h-4 text-primary" />
            Hiring Transparency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Ghost className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">No active job listings detected for {companyName}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics
  const postingAges = activeJobs.map(j => daysSince(j.posted_at || j.scraped_at));
  const medianAge = postingAges.sort((a, b) => a - b)[Math.floor(postingAges.length / 2)] || 0;
  const staleJobs = activeJobs.filter(j => daysSince(j.posted_at || j.scraped_at) > 60);
  const stalePct = Math.round((staleJobs.length / totalActive) * 100);

  // Detect duplicate/reposted titles
  const titleCounts: Record<string, number> = {};
  for (const j of activeJobs) {
    const normalized = j.title.toLowerCase().trim();
    titleCounts[normalized] = (titleCounts[normalized] || 0) + 1;
  }
  const repostedTitles = Object.entries(titleCounts).filter(([, c]) => c > 1);
  const repostPct = totalActive > 0 ? Math.round((repostedTitles.reduce((s, [, c]) => s + c, 0) / totalActive) * 100) : 0;

  // Jobs without salary
  const noSalary = activeJobs.filter(j => !j.salary_range);
  const noSalaryPct = Math.round((noSalary.length / totalActive) * 100);

  // Transparency score
  const transparencyScore = Math.max(0, Math.min(100,
    100 - (stalePct * 0.4) - (repostPct * 0.3) - (noSalaryPct * 0.3)
  ));
  const riskLevel = transparencyScore >= 70 ? "low" : transparencyScore >= 45 ? "moderate" : "elevated";
  const riskLabel = riskLevel === "low" ? "Healthy" : riskLevel === "moderate" ? "Moderate Risk" : "Elevated Risk";
  const riskColor = riskLevel === "low" ? "text-[hsl(var(--civic-green))]" : riskLevel === "moderate" ? "text-[hsl(var(--civic-yellow))]" : "text-destructive";

  const metrics = [
    {
      label: "Median Posting Age",
      value: `${medianAge} days`,
      icon: Clock,
      status: medianAge > 60 ? "warn" : medianAge > 30 ? "caution" : "ok",
      detail: medianAge > 60 ? "Stale listings suggest ghost jobs or hiring freeze" : medianAge > 30 ? "Some listings aging — monitor for staleness" : "Listings are fresh",
    },
    {
      label: "Stale Listings (60+ days)",
      value: `${stalePct}%`,
      icon: Ghost,
      status: stalePct > 30 ? "warn" : stalePct > 15 ? "caution" : "ok",
      detail: `${staleJobs.length} of ${totalActive} active listings are over 60 days old`,
    },
    {
      label: "Reposted Roles",
      value: `${repostPct}%`,
      icon: RefreshCw,
      status: repostPct > 25 ? "warn" : repostPct > 10 ? "caution" : "ok",
      detail: repostedTitles.length > 0
        ? `${repostedTitles.length} role title${repostedTitles.length > 1 ? "s" : ""} posted multiple times`
        : "No duplicate listings detected",
    },
    {
      label: "No Salary Disclosed",
      value: `${noSalaryPct}%`,
      icon: AlertTriangle,
      status: noSalaryPct > 60 ? "warn" : noSalaryPct > 30 ? "caution" : "ok",
      detail: `${noSalary.length} of ${totalActive} listings omit salary range`,
    },
  ];

  const STATUS_STYLES = {
    warn: "border-destructive/15 bg-destructive/5",
    caution: "border-[hsl(var(--civic-yellow))]/15 bg-[hsl(var(--civic-yellow))]/5",
    ok: "border-[hsl(var(--civic-green))]/15 bg-[hsl(var(--civic-green))]/5",
  };
  const ICON_COLOR = {
    warn: "text-destructive",
    caution: "text-[hsl(var(--civic-yellow))]",
    ok: "text-[hsl(var(--civic-green))]",
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ghost className="w-4 h-4 text-primary" />
            Hiring Transparency
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{totalActive} active listings</Badge>
            <Badge variant="outline" className={cn("text-[10px]", riskColor)}>{riskLabel}</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ghost job detection — posting freshness, reposts, and salary disclosure patterns
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={cn("flex items-start gap-3 p-3 rounded-xl border", STATUS_STYLES[m.status as keyof typeof STATUS_STYLES])}
            >
              <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", ICON_COLOR[m.status as keyof typeof ICON_COLOR])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{m.label}</span>
                  <span className="text-sm font-bold text-foreground">{m.value}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{m.detail}</p>
              </div>
            </div>
          );
        })}

        {/* Top stale roles */}
        {staleJobs.length > 0 && (
          <div className="mt-3">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Potentially Ghost Listings</h4>
            <div className="space-y-1">
              {staleJobs.slice(0, 5).map(j => (
                <div key={j.id} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-muted/30">
                  <span className="text-foreground truncate flex-1">{j.title}</span>
                  <span className="text-muted-foreground shrink-0 ml-2 font-mono">
                    {daysSince(j.posted_at || j.scraped_at)}d old
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground border-t border-border pt-2 mt-3">
          Listings older than 60 days with no salary and repeated reposts may indicate ghost jobs, hiring freezes, or internal dysfunction.
          Sources: Greenhouse, Lever, Workday, company career pages.
        </p>
      </CardContent>
    </Card>
  );
}
