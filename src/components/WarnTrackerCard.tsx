import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, MapPin, Calendar, Loader2, ExternalLink, TrendingDown, BarChart3, Newspaper, RefreshCw } from "lucide-react";
import { useState } from "react";

interface WarnNotice {
  id: string;
  notice_date: string;
  effective_date: string | null;
  employees_affected: number;
  layoff_type: string;
  location_city: string | null;
  location_state: string | null;
  reason: string | null;
  source_url: string | null;
  source_state: string | null;
  confidence: string;
}

export function WarnTrackerCard({ companyName, dbCompanyId }: { companyName: string; dbCompanyId: string }) {
  const [isScanning, setIsScanning] = useState(false);
  const [showAll, setShowAll] = useState(false);

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

  const currentYear = new Date().getFullYear();
  const recentNotices = notices?.filter(n => n.notice_date >= `${currentYear - 1}-01-01`) || [];
  const olderNotices = notices?.filter(n => n.notice_date < `${currentYear - 1}-01-01`) || [];
  const totalAffected = notices?.reduce((sum, n) => sum + (n.employees_affected || 0), 0) || 0;
  const recentAffected = recentNotices.reduce((sum, n) => sum + (n.employees_affected || 0), 0);
  const totalNotices = notices?.length || 0;
  const displayedRecent = showAll ? recentNotices : recentNotices.slice(0, 5);
  const displayedOlder = showAll ? olderNotices : olderNotices.slice(0, 3);

  const handleScan = async (national = false) => {
    setIsScanning(true);
    try {
      await supabase.functions.invoke("warn-scan", {
        body: { company_id: dbCompanyId, company_name: companyName, national },
      });
      setTimeout(() => refetch(), 3000);
    } catch (e) {
      console.error("WARN scan error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const layoffTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      layoff: "Layoff",
      closure: "Plant Closure",
      relocation: "Relocation",
      mass_layoff: "Mass Layoff",
      temporary: "Temporary Layoff",
    };
    return map[t] || t;
  };

  const isRecent = (d: string) => d >= `${currentYear}-01-01`;

  const NoticeRow = ({ notice }: { notice: WarnNotice }) => (
    <div className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground">
            {formatDate(notice.notice_date)}
          </span>
          {isRecent(notice.notice_date) && (
            <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-destructive/90 hover:bg-destructive">
              {currentYear}
            </Badge>
          )}
        </div>
        <Badge
          variant={notice.layoff_type === "closure" ? "destructive" : "outline"}
          className="text-[10px] shrink-0"
        >
          {layoffTypeLabel(notice.layoff_type)}
        </Badge>
      </div>

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
      </div>

      {notice.reason && (
        <p className="text-xs text-muted-foreground mt-1.5 italic">"{notice.reason}"</p>
      )}

      {notice.source_url && (
        <a
          href={notice.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
        >
          <ExternalLink className="w-2.5 h-2.5" /> Source
        </a>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-destructive" />
            Workforce Stability
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScan(false)}
              disabled={isScanning}
              className="gap-1.5"
            >
              {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {isScanning ? "Scanning..." : "Scan Latest"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScan(true)}
              disabled={isScanning}
              className="gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <MapPin className="w-3.5 h-3.5" />
              National Scan
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {currentYear} layoff filings, WARN notices, and workforce reduction intelligence for {companyName}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Market Intelligence */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{currentYear} Layoff Tracker</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
              LIVE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Tracking {currentYear} layoffs across all major companies from news, WARN filings, and public records.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="https://www.warntracker.com/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="w-3 h-3" />
                WARN Tracker
              </Button>
            </a>
            <a href="https://layoffstats.com/#events" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <BarChart3 className="w-3 h-3" />
                LayoffStats
              </Button>
            </a>
            <a href={`https://layoffs.fyi/`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                <Newspaper className="w-3 h-3" />
                {currentYear} Master List
              </Button>
            </a>
          </div>
        </div>

        {/* Notices */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : totalNotices === 0 ? (
          <div className="text-center py-4">
            <AlertTriangle className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No layoff data detected yet for {companyName}.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Scan Latest" to search {currentYear} filings and news sources.
            </p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="text-2xl font-bold text-destructive">{recentAffected.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">Recent ({currentYear - 1}–{currentYear})</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{totalAffected.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">All-Time Affected</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{totalNotices}</div>
                <div className="text-[10px] text-muted-foreground">Total Filings</div>
              </div>
            </div>

            {/* Recent notices first */}
            {recentNotices.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-sm font-semibold text-foreground">Recent ({currentYear - 1}–{currentYear})</span>
                  <Badge variant="destructive" className="text-[9px]">{recentNotices.length}</Badge>
                </div>
                <div className="space-y-2">
                  {displayedRecent.map((notice) => (
                    <NoticeRow key={notice.id} notice={notice} />
                  ))}
                </div>
              </div>
            )}

            {/* Older notices */}
            {olderNotices.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">Historical Filings</span>
                  <Badge variant="outline" className="text-[9px]">{olderNotices.length}</Badge>
                </div>
                <div className="space-y-2">
                  {displayedOlder.map((notice) => (
                    <NoticeRow key={notice.id} notice={notice} />
                  ))}
                </div>
              </div>
            )}

            {(recentNotices.length > 5 || olderNotices.length > 3) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-xs"
              >
                {showAll ? "Show less" : `Show all ${totalNotices} notices`}
              </Button>
            )}
          </>
        )}

        {/* Attribution */}
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Data from WARN filings, news reports & public records · Live tracking via{" "}
            <a href="https://www.warntracker.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              WARN Tracker
            </a>{" "}·{" "}
            <a href="https://layoffstats.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              LayoffStats
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}