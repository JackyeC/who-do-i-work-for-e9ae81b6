import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { Link } from "react-router-dom";
import { Bell, BellOff, Briefcase, Building2, ExternalLink, MapPin, Wifi, Monitor, Home, Sparkles, Search, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WORK_ICONS: Record<string, any> = { remote: Wifi, hybrid: Monitor, 'on-site': Home };

export function DreamJobAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["job-alerts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_alerts")
        .select(`*, companies:company_id (name, slug, employer_clarity_score), company_jobs:job_id (title, location, url, work_mode)`)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["career-profile-check", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_career_profile")
        .select("skills, job_titles, preferred_titles")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const hasProfileData = profile &&
    ((profile.skills && (profile.skills as string[]).length > 0) ||
     (profile.job_titles && (profile.job_titles as string[]).length > 0) ||
     (profile.preferred_titles && (profile.preferred_titles as string[]).length > 0));

  const runScan = async () => {
    if (!user) return;
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("dream-job-detect", {
        body: { user_id: user.id },
      });
      if (error) throw error;
      const count = data?.alertsCreated || 0;
      toast({
        title: count > 0 ? `Found ${count} match${count !== 1 ? "es" : ""}!` : "No new matches",
        description: count > 0
          ? "Your aligned role alerts are ready below."
          : `Scanned ${data?.jobsScanned || 0} jobs — none met the match threshold yet.`,
      });
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
    } catch (err) {
      console.error("Scan failed:", err);
      toast({ title: "Scan failed", description: "Please try again later.", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const markRead = async (alertId: string) => {
    await supabase.from("job_alerts").update({ is_read: true }).eq("id", alertId);
    queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
  };

  if (isLoading) return <div className="text-center text-muted-foreground py-8">Loading alerts...</div>;

  if (!alerts?.length) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Bell}
          title={hasProfileData ? "Ready to scan for matches" : "No job alerts yet"}
          description={
            hasProfileData
              ? "Your career profile is set up. Run a scan to match your skills and preferences against open roles."
              : "Upload your resume and build a career profile first, then we'll match you with aligned roles from companies in the directory."
          }
        />
        {hasProfileData && (
          <div className="flex justify-center">
            <Button onClick={runScan} disabled={scanning} className="gap-2">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {scanning ? "Scanning..." : "Scan for Matches"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  const unread = alerts.filter((a: any) => !a.is_read).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        {unread > 0 && (
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">{unread}</strong> unread alert{unread !== 1 ? 's' : ''}
          </div>
        )}
        <Button variant="outline" size="sm" onClick={runScan} disabled={scanning} className="gap-1.5 ml-auto">
          {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          {scanning ? "Scanning..." : "Refresh Matches"}
        </Button>
      </div>

      {alerts.map((alert: any) => {
        const job = alert.company_jobs;
        const company = alert.companies;
        const details = alert.match_details as any;
        const reasons: string[] = details?.reasons || [];
        const WorkIcon = job?.work_mode ? WORK_ICONS[job.work_mode] : null;

        return (
          <Card key={alert.id} className={`transition-colors ${!alert.is_read ? 'border-primary/30 bg-primary/5' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={alert.is_read ? "outline" : "default"} className="text-xs">
                      {alert.alert_type === "dream_job_match" ? "🌟 Dream Match" : alert.alert_type}
                    </Badge>
                    {alert.match_score > 0 && (
                      <span className="text-xs font-semibold text-primary">{Math.round(alert.match_score)}% match</span>
                    )}
                  </div>
                  {(job || details) && (
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> {job?.title || details?.job_title}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    {company && (
                      <Link to={`/dossier/${company.slug}`} className="hover:text-primary flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {company.name}
                      </Link>
                    )}
                    {(job?.location || details?.location) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job?.location || details?.location}
                      </span>
                    )}
                    {(job?.work_mode || details?.work_mode) && WorkIcon && (
                      <span className="flex items-center gap-1 capitalize">
                        <WorkIcon className="w-3 h-3" /> {job?.work_mode || details?.work_mode}
                      </span>
                    )}
                  </div>

                  {reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {reasons.map((reason, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-primary/5 border-primary/20 gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> {reason}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-1.5">{new Date(alert.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col gap-1.5 items-end shrink-0">
                  {!alert.is_read && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markRead(alert.id)}>
                      <BellOff className="w-3 h-3 mr-1" /> Dismiss
                    </Button>
                  )}
                  {(job?.url) && (
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
