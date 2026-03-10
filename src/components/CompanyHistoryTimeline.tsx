import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cleanEntityName } from "@/lib/entityUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, Users, AlertTriangle, Shield, TrendingDown, BarChart3,
  Briefcase, Scale, Eye, Megaphone, Clock, ExternalLink, ChevronDown,
  ChevronUp, Calendar, Activity, Building2, FileText, Loader2, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart,
  CartesianGrid
} from "recharts";

type TimeRange = "30d" | "6mo" | "1yr" | "2yr";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "30d", label: "30 days" },
  { value: "6mo", label: "6 months" },
  { value: "1yr", label: "1 year" },
  { value: "2yr", label: "2 years" },
];

type EventCategory = "all" | "influence" | "signals" | "workforce" | "governance";

const CATEGORY_FILTERS: { value: EventCategory; label: string; icon: any }[] = [
  { value: "all", label: "All", icon: Activity },
  { value: "influence", label: "Influence", icon: DollarSign },
  { value: "signals", label: "Signals", icon: BarChart3 },
  { value: "workforce", label: "Workforce", icon: Users },
  { value: "governance", label: "Governance", icon: Shield },
];

interface TimelineEvent {
  id: string;
  date: string;
  category: EventCategory;
  type: string;
  title: string;
  description: string;
  amount?: number;
  confidence?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  details?: Record<string, string | number | null>;
}

function getCutoffDate(range: TimeRange): Date {
  const d = new Date();
  switch (range) {
    case "30d": d.setDate(d.getDate() - 30); break;
    case "6mo": d.setMonth(d.getMonth() - 6); break;
    case "1yr": d.setFullYear(d.getFullYear() - 1); break;
    case "2yr": d.setFullYear(d.getFullYear() - 2); break;
  }
  return d;
}

function categorizeSignal(cat: string): EventCategory {
  if (["sec_executive_compensation", "sec_insider_trading"].includes(cat)) return "governance";
  if (["warn_layoffs", "workplace_enforcement"].includes(cat)) return "workforce";
  if (["lobbying", "pac_spending", "federal_contracts"].includes(cat)) return "influence";
  return "signals";
}

const EVENT_ICONS: Record<EventCategory, { icon: any; color: string }> = {
  all: { icon: Activity, color: "text-primary bg-primary/10 border-primary/20" },
  influence: { icon: DollarSign, color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
  signals: { icon: BarChart3, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  workforce: { icon: Users, color: "text-orange-600 bg-orange-500/10 border-orange-500/20" },
  governance: { icon: Shield, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface CompanyHistoryTimelineProps {
  companyId: string;
  companyName: string;
}

export function CompanyHistoryTimeline({ companyId, companyName }: CompanyHistoryTimelineProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("2yr");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory>("all");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const cutoffDate = useMemo(() => getCutoffDate(timeRange), [timeRange]);
  const cutoffISO = cutoffDate.toISOString();

  // Fetch all historical data sources in parallel
  const { data: signalScans, isLoading: loadingScans } = useQuery({
    queryKey: ["history-scans", companyId, cutoffISO],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_signal_scans")
        .select("*")
        .eq("company_id", companyId)
        .gte("scan_timestamp", cutoffISO)
        .order("scan_timestamp", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: warnNotices, isLoading: loadingWarn } = useQuery({
    queryKey: ["history-warn", companyId, cutoffISO],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_warn_notices")
        .select("*")
        .eq("company_id", companyId)
        .gte("notice_date", cutoffISO.split("T")[0])
        .order("notice_date", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["history-contracts", companyId, cutoffISO],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_agency_contracts")
        .select("*")
        .eq("company_id", companyId)
        .gte("created_at", cutoffISO)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: donations, isLoading: loadingDonations } = useQuery({
    queryKey: ["history-donations", companyId, cutoffISO],
    queryFn: async () => {
      const { data } = await supabase
        .from("entity_linkages")
        .select("*")
        .eq("company_id", companyId)
        .in("link_type", ["donation_to_member", "trade_association_lobbying", "dark_money_channel"])
        .gte("created_at", cutoffISO)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: sentiment } = useQuery({
    queryKey: ["history-sentiment", companyId, cutoffISO],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_worker_sentiment")
        .select("*")
        .eq("company_id", companyId)
        .gte("created_at", cutoffISO)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: spendingHistory } = useQuery({
    queryKey: ["history-spending", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_spending_history")
        .select("*")
        .eq("company_id", companyId)
        .order("cycle", { ascending: true });
      return data || [];
    },
    enabled: !!companyId,
  });

  const isLoading = loadingScans || loadingWarn || loadingContracts || loadingDonations;

  // Normalize all data into unified timeline events
  const events: TimelineEvent[] = useMemo(() => {
    const items: TimelineEvent[] = [];

    // Signal scans
    (signalScans || []).forEach(s => {
      const cat = categorizeSignal(s.signal_category);
      items.push({
        id: s.id,
        date: s.scan_timestamp,
        category: cat,
        type: s.signal_type,
        title: s.signal_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        description: s.signal_value && !s.signal_value.startsWith("{") && !s.signal_value.startsWith("[")
          ? s.signal_value
          : `${s.signal_category.replace(/_/g, " ")} signal detected`,
        confidence: s.confidence_level,
        sourceUrl: s.source_url || undefined,
        sourceLabel: "Public Filing",
      });
    });

    // WARN notices
    (warnNotices || []).forEach(w => {
      items.push({
        id: w.id,
        date: w.notice_date,
        category: "workforce",
        type: "warn_notice",
        title: `WARN Notice: ${w.employees_affected} workers affected`,
        description: w.reason || `${w.layoff_type} layoff in ${w.location_city || ""}, ${w.location_state || ""}`,
        amount: w.employees_affected,
        confidence: w.confidence,
        sourceUrl: w.source_url || undefined,
        sourceLabel: "State WARN Filing",
        details: {
          "Layoff Type": w.layoff_type,
          "City": w.location_city,
          "State": w.location_state,
          "Effective Date": w.effective_date,
        },
      });
    });

    // Contracts
    (contracts || []).forEach(c => {
      items.push({
        id: c.id,
        date: c.created_at,
        category: "influence",
        type: "government_contract",
        title: `Contract: ${c.agency_name}`,
        description: c.contract_description || `Government contract with ${c.agency_name}`,
        amount: c.contract_value || undefined,
        confidence: c.confidence,
        sourceUrl: c.source || undefined,
        sourceLabel: "USASpending.gov",
        details: {
          "Agency": c.agency_name,
          "Value": c.contract_value ? `$${c.contract_value.toLocaleString()}` : "Undisclosed",
          "Fiscal Year": c.fiscal_year,
          "Controversy": c.controversy_flag ? c.controversy_description || "Yes" : "None",
        },
      });
    });

    // Donations / influence linkages
    (donations || []).forEach(d => {
      items.push({
        id: d.id,
        date: d.created_at,
        category: "influence",
        type: d.link_type,
        title: `${cleanEntityName(d.source_entity_name)} → ${cleanEntityName(d.target_entity_name)}`,
        description: d.description || `${d.link_type.replace(/_/g, " ")} connection`,
        amount: d.amount || undefined,
        confidence: d.confidence_score > 0.7 ? "high" : d.confidence_score > 0.4 ? "medium" : "low",
        details: {
          "Source": cleanEntityName(d.source_entity_name),
          "Target": cleanEntityName(d.target_entity_name),
          "Type": d.link_type.replace(/_/g, " "),
        },
      });
    });

    // Sentiment snapshots
    (sentiment || []).forEach(s => {
      items.push({
        id: s.id,
        date: s.created_at,
        category: "workforce",
        type: "sentiment_snapshot",
        title: `Worker Sentiment: ${s.overall_rating}/5 — ${s.sentiment || "mixed"}`,
        description: s.ai_summary ? s.ai_summary.substring(0, 200) + "…" : "Employee sentiment data collected",
        details: {
          "Overall": s.overall_rating ? `${s.overall_rating}/5` : null,
          "Work-Life": s.work_life_balance ? `${s.work_life_balance}/5` : null,
          "Compensation": s.compensation_rating ? `${s.compensation_rating}/5` : null,
          "Recommend": s.recommend_to_friend ? `${s.recommend_to_friend}%` : null,
        },
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [signalScans, warnNotices, contracts, donations, sentiment]);

  const filteredEvents = useMemo(() => {
    if (categoryFilter === "all") return events;
    return events.filter(e => e.category === categoryFilter);
  }, [events, categoryFilter]);

  // Trend data for sparkline
  const trendData = useMemo(() => {
    const monthMap: Record<string, { month: string; influence: number; workforce: number; governance: number; signals: number; total: number }> = {};
    events.forEach(e => {
      const mk = getMonthKey(e.date);
      if (!monthMap[mk]) monthMap[mk] = { month: mk, influence: 0, workforce: 0, governance: 0, signals: 0, total: 0 };
      monthMap[mk][e.category === "all" ? "signals" : e.category]++;
      monthMap[mk].total++;
    });
    return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  }, [events]);

  // Spending trend data
  const spendingTrend = useMemo(() => {
    return (spendingHistory || []).map(s => ({
      cycle: s.cycle,
      PAC: s.pac_spending,
      Lobbying: s.lobbying_spend,
      Executive: s.executive_giving,
    }));
  }, [spendingHistory]);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            History & Timeline
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredEvents.length} events found for {companyName}
          </p>
        </div>
        <div className="flex gap-2">
          {TIME_RANGES.map(tr => (
            <Button
              key={tr.value}
              variant={timeRange === tr.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(tr.value)}
              className="text-xs"
            >
              {tr.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map(cf => {
          const Icon = cf.icon;
          const count = cf.value === "all" ? events.length : events.filter(e => e.category === cf.value).length;
          return (
            <Button
              key={cf.value}
              variant={categoryFilter === cf.value ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cf.value)}
              className="gap-1.5 text-xs"
            >
              <Icon className="w-3 h-3" />
              {cf.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Trend charts */}
      {trendData.length > 1 && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Signal Activity Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#totalGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {spendingTrend.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Political Spending by Cycle
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={spendingTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="cycle" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                    />
                    <Area type="monotone" dataKey="PAC" stackId="1" stroke="hsl(262, 80%, 50%)" fill="hsl(262, 80%, 50%, 0.2)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="Lobbying" stackId="1" stroke="hsl(210, 80%, 50%)" fill="hsl(210, 80%, 50%, 0.2)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="Executive" stackId="1" stroke="hsl(30, 80%, 50%)" fill="hsl(30, 80%, 50%, 0.2)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Loading historical data…</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No events found</h3>
            <p className="text-sm text-muted-foreground">
              No historical data found for this time range. Try expanding to 2 years or running an AI scan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

          <div className="space-y-1">
            {filteredEvents.map((event, idx) => {
              const config = EVENT_ICONS[event.category];
              const Icon = config.icon;
              const isExpanded = expandedEvent === event.id;
              const prevDate = idx > 0 ? filteredEvents[idx - 1].date : null;
              const showDateHeader = !prevDate || getMonthKey(event.date) !== getMonthKey(prevDate);

              return (
                <div key={event.id}>
                  {showDateHeader && (
                    <div className="flex items-center gap-3 py-3 pl-1">
                      <div className="w-[38px] flex justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                      </div>
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        {new Date(event.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex gap-3 py-2 pl-1 cursor-pointer group",
                      isExpanded && "bg-muted/30 rounded-lg"
                    )}
                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  >
                    <div className={cn("w-[38px] h-[38px] rounded-lg flex items-center justify-center shrink-0 border", config.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {event.amount !== undefined && (
                            <span className="text-xs font-semibold text-foreground">
                              {event.type === "warn_notice" ? `${event.amount.toLocaleString()} workers` : `$${event.amount.toLocaleString()}`}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{formatDate(event.date)}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border space-y-2">
                          <p className="text-sm text-foreground/90 leading-relaxed">{event.description}</p>

                          {event.details && (
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              {Object.entries(event.details).map(([key, val]) => val ? (
                                <div key={key}>
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{key}</span>
                                  <p className="text-xs font-medium text-foreground">{String(val)}</p>
                                </div>
                              ) : null)}
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-2 text-[10px] text-muted-foreground border-t border-border">
                            {event.confidence && (
                              <Badge variant="outline" className={cn("text-[9px]",
                                event.confidence === "high" || event.confidence === "direct" ? "border-primary/30 text-primary" :
                                event.confidence === "medium" ? "border-amber-500/30 text-amber-600" :
                                "border-muted-foreground/30"
                              )}>
                                {event.confidence} confidence
                              </Badge>
                            )}
                            {event.sourceUrl && (
                              <a
                                href={event.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                                onClick={e => e.stopPropagation()}
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                {event.sourceLabel || "Source"}
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Historical data sourced from FEC, SEC EDGAR, USASpending, state WARN filings, and verified web sources.
          Dates reflect when records were filed or detected — not necessarily when events occurred.
        </p>
      </div>
    </div>
  );
}
