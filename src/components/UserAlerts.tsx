import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DemoAlerts } from "@/components/DemoAlerts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, Clock, ExternalLink, Filter, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function useUnreadAlertCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread-alerts-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("user_alerts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false)
        .is("dismissed_at", null);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

type AlertFilter = "all" | "unread" | "snoozed" | "dismissed";

export function UserAlertsList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AlertFilter>("all");

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["user-alerts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_alerts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["user-alerts"] });
    queryClient.invalidateQueries({ queryKey: ["unread-alerts-count"] });
  };

  const markRead = async (alertId: string) => {
    await supabase.from("user_alerts").update({ is_read: true }).eq("id", alertId);
    invalidateAll();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("user_alerts").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    invalidateAll();
  };

  const dismissAlert = async (alertId: string) => {
    await supabase.from("user_alerts").update({ dismissed_at: new Date().toISOString(), is_read: true } as any).eq("id", alertId);
    invalidateAll();
  };

  const snoozeAlert = async (alertId: string, hours: number) => {
    const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    await supabase.from("user_alerts").update({ snoozed_until: snoozedUntil } as any).eq("id", alertId);
    invalidateAll();
  };

  if (!user) return null;

  const now = new Date();
  const filteredAlerts = (alerts || []).filter((a: any) => {
    // Un-snooze expired snoozes
    const isSnoozed = a.snoozed_until && new Date(a.snoozed_until) > now;
    const isDismissed = !!a.dismissed_at;

    switch (filter) {
      case "unread": return !a.is_read && !isDismissed && !isSnoozed;
      case "snoozed": return isSnoozed;
      case "dismissed": return isDismissed;
      default: return !isDismissed; // "all" hides dismissed
    }
  });

  const unreadCount = (alerts || []).filter((a: any) => !a.is_read && !a.dismissed_at).length;

  // Group by date for timeline
  const grouped = filteredAlerts.reduce<Record<string, any[]>>((acc, alert) => {
    const date = new Date(alert.date_detected || alert.created_at).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(alert);
    return acc;
  }, {});

  const filterLabels: Record<AlertFilter, string> = {
    all: "Active",
    unread: "Unread",
    snoozed: "Snoozed",
    dismissed: "Dismissed",
  };

  return (
    <Card>
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Alert Timeline
            {unreadCount > 0 && <Badge className="text-[10px]">{unreadCount} new</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-7">
                  <Filter className="w-3 h-3" />
                  {filterLabels[filter]}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("all")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("unread")}>Unread only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("snoozed")}>Snoozed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("dismissed")}>Dismissed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                <Check className="w-3 h-3 mr-1" /> Mark all read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading alerts…</p>
        ) : filteredAlerts.length === 0 && (alerts || []).length === 0 ? (
          /* Demo placeholder alerts when user has no real alerts */
          <DemoAlerts />
        ) : filteredAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            {filter === "all"
              ? "No alerts yet. Watch companies to receive notifications when signals change."
              : `No ${filterLabels[filter].toLowerCase()} alerts.`}
          </p>
        ) : (
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
            {Object.entries(grouped).map(([date, dateAlerts]) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">{date}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Timeline items */}
                <div className="space-y-2 relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border hidden sm:block" />

                  {dateAlerts.map((alert: any) => {
                    const isSnoozed = alert.snoozed_until && new Date(alert.snoozed_until) > now;

                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors group",
                          !alert.is_read && !alert.dismissed_at
                            ? "bg-primary/5 border-primary/20"
                            : alert.dismissed_at
                            ? "bg-muted/20 border-border/40 opacity-60"
                            : isSnoozed
                            ? "bg-civic-yellow/5 border-civic-yellow/20"
                            : "bg-card border-border"
                        )}
                      >
                        {/* Timeline dot */}
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 hidden sm:block",
                          !alert.is_read && !alert.dismissed_at ? "bg-primary" : "bg-border"
                        )} />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Link
                              to={`/company/${alert.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`}
                              className="text-sm font-medium text-foreground hover:underline"
                            >
                              {alert.company_name}
                            </Link>
                            <Badge variant="outline" className="text-[10px]">{alert.signal_category}</Badge>
                            <Badge variant="outline" className={cn(
                              "text-[10px]",
                              alert.change_type === "new_signal" && "border-civic-green/30 text-civic-green",
                              alert.change_type === "removed" && "border-destructive/30 text-destructive",
                              alert.change_type === "changed" && "border-civic-yellow/30 text-civic-yellow",
                            )}>{alert.change_type}</Badge>
                            {isSnoozed && (
                              <Badge variant="outline" className="text-[10px] border-civic-yellow/30 text-civic-yellow">
                                <Clock className="w-2.5 h-2.5 mr-0.5" />
                                Snoozed
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{alert.change_description}</p>
                          <span className="text-[10px] text-muted-foreground mt-1 block">
                            {new Date(alert.date_detected || alert.created_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!alert.is_read && !alert.dismissed_at && (
                            <Button variant="ghost" size="icon" className="w-7 h-7" title="Mark as read" onClick={() => markRead(alert.id)}>
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {!alert.dismissed_at && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-7 h-7" title="Snooze">
                                  <Clock className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => snoozeAlert(alert.id, 1)}>1 hour</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => snoozeAlert(alert.id, 24)}>1 day</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => snoozeAlert(alert.id, 168)}>1 week</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {!alert.dismissed_at && (
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" title="Dismiss" onClick={() => dismissAlert(alert.id)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
