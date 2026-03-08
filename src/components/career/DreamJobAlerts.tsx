import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { Link } from "react-router-dom";
import { Bell, BellOff, Briefcase, Building2, ExternalLink } from "lucide-react";

export function DreamJobAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["job-alerts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_alerts")
        .select(`*, companies:company_id (name, slug, civic_footprint_score), company_jobs:job_id (title, location, url)`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const markRead = async (alertId: string) => {
    await supabase.from("job_alerts").update({ is_read: true }).eq("id", alertId);
    queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
  };

  if (isLoading) return <div className="text-center text-muted-foreground py-8">Loading alerts...</div>;

  if (!alerts?.length) {
    return (
      <EmptyState
        icon={Bell}
        title="No job alerts yet"
        description="Upload your resume to build a career profile, then we'll match you with dream jobs from companies in the directory."
      />
    );
  }

  const unread = alerts.filter((a: any) => !a.is_read).length;

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="text-sm text-muted-foreground">
          <strong className="text-foreground">{unread}</strong> unread alert{unread !== 1 ? 's' : ''}
        </div>
      )}

      {alerts.map((alert: any) => {
        const job = alert.company_jobs;
        const company = alert.companies;

        return (
          <Card key={alert.id} className={`transition-colors ${!alert.is_read ? 'border-primary/30 bg-primary/5' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={alert.is_read ? "outline" : "default"} className="text-xs">
                      {alert.alert_type === "dream_job_match" ? "Dream Match" : alert.alert_type}
                    </Badge>
                    {alert.match_score > 0 && (
                      <span className="text-xs font-medium text-civic-green">{Math.round(alert.match_score)}% match</span>
                    )}
                  </div>
                  {job && (
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> {job.title}
                    </p>
                  )}
                  {company && (
                    <Link to={`/company/${company.slug}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" /> {company.name}
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(alert.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  {!alert.is_read && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => markRead(alert.id)}>
                      <BellOff className="w-3 h-3 mr-1" /> Dismiss
                    </Button>
                  )}
                  {job?.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      Apply <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
