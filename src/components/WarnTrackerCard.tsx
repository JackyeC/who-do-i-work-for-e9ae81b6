import { useState, useMemo } from "react";
import { IntelligenceEmptyState } from "@/components/intelligence/IntelligenceEmptyState";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle, Users, MapPin, Calendar, Loader2, ExternalLink,
  TrendingDown, BarChart3, RefreshCw, ShieldCheck, Building2,
  Clock, FileText, HelpCircle, Target, Briefcase
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface WarnNotice {
  id: string;
  notice_date: string;
  effective_date: string | null;
  public_announcement_date?: string | null;
  employees_affected: number;
  layoff_type: string;
  location_city: string | null;
  location_state: string | null;
  reason: string | null;
  reason_type: string;
  source_url: string | null;
  source_state: string | null;
  source_type: string;
  confidence: string;
  support_services_mentioned?: boolean;
  support_services_coordinator?: string | null;
  workforce_board_referenced?: boolean;
  employer_name_raw?: string | null;
  last_synced_at?: string | null;
}

type TimeFilter = "week" | "month" | "year" | "12months";

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "12months", label: "Last 12 Months" },
];

function getTimeFilterDate(filter: TimeFilter): Date {
  const now = new Date();
  switch (filter) {
    case "week": { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    case "month": { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
    case "year": return new Date(now.getFullYear(), 0, 1);
    case "12months": { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
  }
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  official_state_warn: { label: "Official WARN", color: "bg-green-500/10 text-green-700 border-green-500/20" },
  structured_open_data: { label: "Open Data", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  big_local_news: { label: "Big Local News", color: "bg-violet-500/10 text-violet-700 border-violet-500/20" },
  news_report: { label: "News Report", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  sec_8k: { label: "SEC 8-K", color: "bg-red-500/10 text-red-700 border-red-500/20" },
  firecrawl_search: { label: "Web Search", color: "bg-muted text-muted-foreground" },
  unknown: { label: "Unknown", color: "bg-muted text-muted-foreground" },
};

const REASON_LABELS: Record<string, string> = {
  official_warn_reason: "Official WARN notice reason",
  reported_reason: "Reported reason from public coverage",
  not_stated: "Reason not stated in WARN notice",
};

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function layoffTypeLabel(t: string): string {
  const map: Record<string, string> = {
    layoff: "Layoff", closure: "Plant Closure", relocation: "Relocation",
    mass_layoff: "Mass Layoff", temporary: "Temporary", rif: "RIF",
  };
  return map[t] || t;
}

function generateInsight(notice: WarnNotice): string {
  const effectiveDate = notice.effective_date ? new Date(notice.effective_date) : null;
  const now = new Date();
  const daysUntilEffective = effectiveDate ? Math.ceil((effectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  if (daysUntilEffective !== null && daysUntilEffective > 0 && daysUntilEffective <= 60) {
    return `Talent pool opportunity: ${notice.employees_affected.toLocaleString()} workers become available in ~${daysUntilEffective} days. Outreach window is now.`;
  }
  if (daysUntilEffective !== null && daysUntilEffective <= 0 && daysUntilEffective > -90) {
    return `Fresh talent pool: ${notice.employees_affected.toLocaleString()} workers recently displaced. Peak outreach period.`;
  }
  if (notice.support_services_mentioned) {
    return `Worker transition support is active. Coordinate with workforce board for structured outreach.`;
  }
  if (notice.layoff_type === "closure") {
    return `Full closure signals entire team displacement. High-volume talent pool across all functions.`;
  }
  return `${notice.employees_affected.toLocaleString()} workers affected. Monitor for outreach timing.`;
}

export function WarnTrackerCard({ companyName, dbCompanyId }: { companyName: string; dbCompanyId: string }) {
  const [isScanning, setIsScanning] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("year");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: notices, isLoading, refetch } = useQuery({
    queryKey: ["warn-notices", dbCompanyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_warn_notices" as any)
        .select("*")
        .eq("company_id", dbCompanyId)
        .order("notice_date", { ascending: false });
      return (data || []) as unknown as WarnNotice[];
    },
    enabled: !!dbCompanyId,
  });

  const { data: syncLog } = useQuery({
    queryKey: ["warn-sync-log"],
    queryFn: async () => {
      const { data } = await supabase
        .from("warn_sync_log" as any)
        .select("*")
        .order("last_synced_at", { ascending: false })
        .limit(1);
      return (data as any)?.[0] || null;
    },
  });

  const currentYear = new Date().getFullYear();
  const filterDate = getTimeFilterDate(timeFilter);

  const filteredNotices = useMemo(() => {
    if (!notices) return [];
    return notices.filter(n => {
      const noticeDate = new Date(n.notice_date);
      if (noticeDate < filterDate) return false;
      if (stateFilter !== "all" && n.location_state !== stateFilter) return false;
      return true;
    });
  }, [notices, filterDate, stateFilter]);

  const allStates = useMemo(() => {
    if (!notices) return [];
    const states = new Set(notices.map(n => n.location_state).filter(Boolean));
    return Array.from(states).sort() as string[];
  }, [notices]);

  // Summary stats
  const totalFiltered = filteredNotices.length;
  const totalAffected = filteredNotices.reduce((s, n) => s + (n.employees_affected || 0), 0);
  const uniqueStates = new Set(filteredNotices.map(n => n.location_state).filter(Boolean)).size;
  const currentYearNotices = (notices || []).filter(n => n.notice_date >= `${currentYear}-01-01`);
  const hasCurrentYearData = currentYearNotices.length > 0;

  const handleScan = async (national = false) => {
    setIsScanning(true);
    try {
      if (national) {
        await supabase.functions.invoke("warn-national-sync", {
          body: { company_id: dbCompanyId, company_name: companyName, days_back: 365 },
        });
      } else {
        await supabase.functions.invoke("warn-scan", {
          body: { company_id: dbCompanyId, company_name: companyName, national },
        });
      }
      setTimeout(() => refetch(), 3000);
    } catch (e) {
      console.error("WARN scan error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Layoff & Talent Pool Intelligence
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Official WARN notices and verified layoff signals, organized for recruiting and market intelligence.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleScan(false)} disabled={isScanning} className="gap-1.5">
              {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Scan Latest
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleScan(true)} disabled={isScanning}
              className="gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10">
              <MapPin className="w-3.5 h-3.5" />
              National Scan
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* No current year data warning */}
        {!isLoading && !hasCurrentYearData && (notices || []).length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">No {currentYear} WARN notices found in supported official sources.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Older filings shown below are clearly labeled as historical. Click "Scan Latest" to check for new filings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1">
            {TIME_FILTERS.map(f => (
              <Button key={f.value} variant={timeFilter === f.value ? "default" : "outline"}
                size="sm" className="text-xs h-7 px-2.5" onClick={() => setTimeFilter(f.value)}>
                {f.label}
              </Button>
            ))}
          </div>
          {allStates.length > 1 && (
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-[120px] h-7 text-xs">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {allStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard icon={FileText} label="WARN Notices" value={totalFiltered} color="text-destructive" />
          <SummaryCard icon={Users} label="Workers Affected" value={totalAffected.toLocaleString()} color="text-destructive" />
          <SummaryCard icon={MapPin} label="States" value={uniqueStates} color="text-primary" />
          <SummaryCard icon={Building2} label="Active Notices" value={currentYearNotices.length} color="text-primary" />
        </div>

        {/* Notices table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : totalFiltered === 0 ? (
          (notices || []).length === 0 ? (
            <IntelligenceEmptyState category="layoffs" state="after" />
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No notices match the selected filters.</p>
            </div>
          )
        ) : (
          <div className="space-y-2">
            {filteredNotices.map((notice) => {
              const isHistorical = notice.notice_date < `${currentYear}-01-01`;
              const isExpanded = expandedId === notice.id;
              return (
                <div key={notice.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors cursor-pointer hover:bg-muted/50",
                    isHistorical ? "border-border bg-muted/20 opacity-80" : "border-border bg-background"
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                >
                  {/* Row header */}
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.employer_name_raw && notice.employer_name_raw.toLowerCase() !== companyName.toLowerCase() && (
                        <span className="text-xs font-medium text-foreground">{notice.employer_name_raw}</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium text-foreground">{formatDate(notice.notice_date)}</span>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">WARN notice filed date</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {notice.effective_date && notice.effective_date !== notice.notice_date && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground">→ {formatDate(notice.effective_date)}</span>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Effective layoff date</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {isHistorical && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">Historical</Badge>
                      )}
                      {!isHistorical && (
                        <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-destructive/90">{currentYear}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <SourceBadge sourceType={notice.source_type} />
                      <Badge variant={notice.layoff_type === "closure" ? "destructive" : "outline"} className="text-[10px]">
                        {layoffTypeLabel(notice.layoff_type)}
                      </Badge>
                    </div>
                  </div>

                  {/* Key stats row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <strong className="text-foreground">{notice.employees_affected.toLocaleString()}</strong> affected
                    </span>
                    {(notice.location_city || notice.location_state) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[notice.location_city, notice.location_state].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {notice.reason && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 italic">
                              <HelpCircle className="w-3 h-3" />
                              {notice.reason}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{REASON_LABELS[notice.reason_type] || notice.reason_type}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {!notice.reason && (
                      <span className="text-muted-foreground/60 italic text-[10px]">Reason not stated</span>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      {/* Recruiter insight */}
                      <div className="rounded-md bg-primary/5 border border-primary/20 p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Target className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-semibold text-primary">Recruiter Insight</span>
                        </div>
                        <p className="text-xs text-foreground">{generateInsight(notice)}</p>
                      </div>

                      {/* Worker Transition Support */}
                      {notice.support_services_mentioned && (
                        <div className="rounded-md bg-green-500/5 border border-green-500/20 p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">Worker Transition Support</span>
                          </div>
                          <div className="text-xs text-foreground space-y-1">
                            <p>Support services: <strong>mentioned in filing</strong></p>
                            {notice.support_services_coordinator && (
                              <p>Coordinator: {notice.support_services_coordinator}</p>
                            )}
                            {notice.workforce_board_referenced && (
                              <p>Workforce board support: <strong>referenced</strong></p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Date details */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Notice Date</span>
                          <p className="font-medium">{formatDate(notice.notice_date)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Effective Date</span>
                          <p className="font-medium">{formatDate(notice.effective_date)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Public Announcement</span>
                          <p className="font-medium">{formatDate(notice.public_announcement_date)}</p>
                        </div>
                      </div>

                      {/* Reason with type label */}
                      {notice.reason && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">{REASON_LABELS[notice.reason_type] || "Reason"}:</span>
                          <p className="font-medium mt-0.5">{notice.reason}</p>
                        </div>
                      )}

                      {/* Source link */}
                      {notice.source_url && (
                        <a href={notice.source_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                          <ExternalLink className="w-2.5 h-2.5" /> View Source
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Last updated & Attribution */}
        <div className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last updated: {syncLog?.last_synced_at ? formatDate(syncLog.last_synced_at) : "Never synced"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Sources:{" "}
            <a href="https://github.com/biglocalnews/warn-transformer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Big Local News
            </a>{" · "}
            <a href="https://edd.ca.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CA EDD</a>{" · "}
            <a href="https://www.twc.texas.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TX TWC</a>{" · "}
            <a href="https://dol.ny.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">NY DOL</a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="text-center p-3 bg-muted/40 border border-border rounded-lg">
      <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
      <div className={cn("text-xl font-bold", color)}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function SourceBadge({ sourceType }: { sourceType: string }) {
  const info = SOURCE_LABELS[sourceType] || SOURCE_LABELS.unknown;
  return (
    <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", info.color)}>
      {info.label}
    </Badge>
  );
}
