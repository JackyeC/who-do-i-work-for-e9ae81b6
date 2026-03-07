import { useApplicationsTracker } from "@/hooks/use-job-matcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, Trash2, ExternalLink, Shield, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUSES = ["Draft", "Submitted", "Interviewing", "Offered", "Rejected", "Withdrawn"] as const;

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Submitted: "bg-blue-100 text-blue-700 border-blue-200",
  Interviewing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Offered: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Withdrawn: "bg-muted text-muted-foreground",
};

export function TrackingDashboard() {
  const { applications, isLoading, updateStatus, deleteApp } = useApplicationsTracker();

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  // Group by status for pipeline view
  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter((a: any) => a.status === s);
    return acc;
  }, {} as Record<string, any[]>);

  const activeStatuses = STATUSES.filter(s => grouped[s].length > 0);

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <LayoutDashboard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No applications tracked</h3>
          <p className="text-muted-foreground text-sm">
            Apply to jobs from the "Aligned Jobs" tab to start tracking your pipeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["Submitted", "Interviewing", "Offered", "Rejected"] as const).map(status => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{grouped[status]?.length || 0}</p>
              <p className="text-xs text-muted-foreground">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline */}
      <div className="space-y-4">
        {activeStatuses.map(status => (
          <div key={status}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <Badge className={cn("text-xs", statusColors[status])}>{status}</Badge>
              <span className="text-xs font-normal">({grouped[status].length})</span>
            </h3>
            <div className="space-y-2">
              {grouped[status].map((app: any) => (
                <Card key={app.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{app.job_title}</h4>
                        <p className="text-sm text-muted-foreground">{app.company_name}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          {app.alignment_score > 0 && (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {app.alignment_score}% aligned
                            </span>
                          )}
                          {app.applied_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(app.applied_at), "MMM d, yyyy")}
                            </span>
                          )}
                          {(app.matched_signals as string[] || []).slice(0, 3).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={app.status}
                          onValueChange={(val) => updateStatus.mutate({ id: app.id, status: val })}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {app.application_link && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                            <a href={app.application_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteApp.mutate(app.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
