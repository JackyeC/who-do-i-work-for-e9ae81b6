import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle2, XCircle, Clock, AlertTriangle, ExternalLink, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_TYPE_LABELS: Record<string, string> = {
  careers: "Careers",
  jobs: "Job Listings",
  benefits: "Benefits",
  leadership: "Leadership",
  esg: "ESG / Impact",
  diversity: "Diversity & Workforce",
  newsroom: "Newsroom / Press",
  policy: "Political Disclosure",
  privacy: "Privacy / AI Disclosure",
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  active: { icon: CheckCircle2, color: "text-green-600", label: "Active" },
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  error: { icon: XCircle, color: "text-destructive", label: "Error" },
  paused: { icon: AlertTriangle, color: "text-yellow-600", label: "Paused" },
};

interface MonitoredPagesPanelProps {
  companyId: string;
}

export function MonitoredPagesPanel({ companyId }: MonitoredPagesPanelProps) {
  const { data: monitors, isLoading } = useQuery({
    queryKey: ["browse-ai-monitors", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("browse_ai_monitors" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const { data: recentEvents } = useQuery({
    queryKey: ["browse-ai-events", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("browse_ai_change_events" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  if (isLoading) return null;
  if (!monitors || monitors.length === 0) return null;

  const activeCount = monitors.filter((m: any) => m.status === "active").length;
  const latestChange = monitors
    .filter((m: any) => m.last_change_detected_at)
    .sort((a: any, b: any) => new Date(b.last_change_detected_at).getTime() - new Date(a.last_change_detected_at).getTime())[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" />
          Monitored Pages
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {activeCount}/{monitors.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          {monitors.map((monitor: any) => {
            const config = STATUS_CONFIG[monitor.status] || STATUS_CONFIG.pending;
            const Icon = config.icon;
            const label = PAGE_TYPE_LABELS[monitor.page_type] || monitor.page_type;

            return (
              <div
                key={monitor.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border text-sm"
              >
                <Icon className={cn("w-3.5 h-3.5 shrink-0", config.color)} />
                <span className="text-foreground font-medium truncate flex-1">{label}</span>
                {monitor.page_url && (
                  <a
                    href={monitor.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {latestChange && (
          <p className="text-xs text-muted-foreground">
            Last change detected: {new Date(latestChange.last_change_detected_at).toLocaleDateString()} on{" "}
            {PAGE_TYPE_LABELS[latestChange.page_type] || latestChange.page_type} page
          </p>
        )}

        {recentEvents && recentEvents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent Changes</p>
            <div className="space-y-1.5">
              {recentEvents.slice(0, 3).map((event: any) => (
                <div key={event.id} className="text-xs p-2 rounded bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[10px]">
                      {PAGE_TYPE_LABELS[event.page_type] || event.page_type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        event.processing_status === "completed"
                          ? "border-green-200 text-green-600"
                          : event.processing_status === "failed"
                          ? "border-destructive/30 text-destructive"
                          : "border-yellow-200 text-yellow-600"
                      )}
                    >
                      {event.processing_status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{event.change_summary}</p>
                  <span className="text-muted-foreground/70">
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
