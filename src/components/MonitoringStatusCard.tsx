import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Activity, Clock } from "lucide-react";

interface MonitoringStatusCardProps {
  companyId: string;
}

export function MonitoringStatusCard({ companyId }: MonitoringStatusCardProps) {
  const { data } = useQuery({
    queryKey: ["monitoring-status", companyId],
    queryFn: async () => {
      const [watchersRes, latestChangeRes, signalsRes] = await Promise.all([
        supabase
          .from("user_company_watchlist")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
        supabase
          .from("signal_change_events")
          .select("created_at, signal_category, change_type")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("signal_change_events")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
      ]);

      return {
        watcherCount: watchersRes.count || 0,
        latestChange: latestChangeRes.data,
        totalSignals: signalsRes.count || 0,
      };
    },
  });

  if (!data || (data.watcherCount === 0 && data.totalSignals === 0)) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Monitoring Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-medium text-foreground">{data.watcherCount}</span> watching
          </div>
          {data.latestChange && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Last signal: {new Date(data.latestChange.created_at).toLocaleDateString()}
              <Badge variant="outline" className="text-[10px] ml-1">{data.latestChange.signal_category}</Badge>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span className="font-medium text-foreground">{data.totalSignals}</span> signal events
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic">
          This reflects signals detected from publicly available sources. No conclusions are drawn.
        </p>
      </CardContent>
    </Card>
  );
}
