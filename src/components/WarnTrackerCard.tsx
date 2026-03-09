import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, MapPin, Calendar, Loader2, ExternalLink } from "lucide-react";
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
  const [isImporting, setIsImporting] = useState(false);

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

  const totalAffected = notices?.reduce((sum, n) => sum + (n.employees_affected || 0), 0) || 0;
  const totalNotices = notices?.length || 0;

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await supabase.functions.invoke("warn-scan", {
        body: { company_id: dbCompanyId, company_name: companyName },
      });
      setTimeout(() => refetch(), 3000);
    } catch (e) {
      console.error("WARN scan error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleBulkImport = async () => {
    setIsImporting(true);
    try {
      const { data } = await supabase.functions.invoke("bulk-import-warn", {
        body: { company_id: dbCompanyId },
      });
      console.log("Bulk import result:", data);
      setTimeout(() => refetch(), 2000);
    } catch (e) {
      console.error("Bulk import error:", e);
    } finally {
      setIsImporting(false);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            WARN Act Layoff Tracker
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkImport}
              disabled={isImporting || totalNotices > 0}
              className="gap-1.5"
            >
              {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {isImporting ? "Importing..." : "Import Dataset"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScan}
              disabled={isScanning}
              className="gap-1.5"
            >
              {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {isScanning ? "Scanning..." : "Scan Web"}
            </Button>
          </div>
        <p className="text-xs text-muted-foreground">
          Public WARN Act filings — employers must give 60-day notice before mass layoffs or plant closings.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : totalNotices === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No WARN notices detected for {companyName}.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Scan for WARN Notices" to search public filings.
            </p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="text-center p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="text-2xl font-bold text-destructive">{totalAffected.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">Total Employees Affected</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{totalNotices}</div>
                <div className="text-[10px] text-muted-foreground">WARN Notices Filed</div>
              </div>
            </div>

            {/* Timeline of notices */}
            <div className="space-y-3">
              {notices?.map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(notice.notice_date)}
                      </span>
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
                      <strong className="text-foreground">{notice.employees_affected.toLocaleString()}</strong> employees affected
                    </span>
                    {(notice.location_city || notice.location_state) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[notice.location_city, notice.location_state].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>

                  {notice.reason && (
                    <p className="text-xs text-muted-foreground mt-2 italic">"{notice.reason}"</p>
                  )}

                  {notice.effective_date && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Effective: {formatDate(notice.effective_date)}
                    </p>
                  )}

                  {notice.source_url && (
                    <a
                      href={notice.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5" /> View source
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
