import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Radar, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock,
  BarChart3, Search, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Props {
  companyId: string;
  companyName: string;
}

const MODULE_LABELS: Record<string, string> = {
  ai_hr_scan: "Hiring Technology & AI Use",
  worker_benefits: "Worker Benefits & Protections",
  pay_equity: "Pay Equity & Compensation",
  worker_sentiment: "Worker Sentiment",
  ideology: "Ideology & Controversy",
  social: "Social & Media Monitoring",
  agency_contracts: "Government Contracts",
  ai_accountability: "AI Accountability",
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'completed_with_signals': return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
    case 'completed_no_signals': return <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />;
    case 'failed': return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    case 'in_progress': return <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />;
    case 'queued': return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    default: return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'completed_with_signals': return 'Signals found';
    case 'completed_no_signals': return 'No signals';
    case 'failed': return 'Failed';
    case 'in_progress': return 'Scanning...';
    case 'queued': return 'Queued';
    default: return 'Not run';
  }
};

export function CompanyIntelligenceScanCard({ companyId, companyName }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: latestScan, isLoading } = useQuery({
    queryKey: ["latest-scan-run", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scan_runs" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    refetchInterval: isScanning ? 3000 : false,
  });

  // If scan completed while polling, stop
  if (isScanning && latestScan?.scan_status && !['queued', 'in_progress'].includes(latestScan.scan_status)) {
    setIsScanning(false);
    // Invalidate all module queries
    queryClient.invalidateQueries({ queryKey: ["ai-hr-signals"] });
    queryClient.invalidateQueries({ queryKey: ["worker-benefit-signals"] });
    queryClient.invalidateQueries({ queryKey: ["pay-equity-signals"] });
    queryClient.invalidateQueries({ queryKey: ["worker-sentiment"] });
    queryClient.invalidateQueries({ queryKey: ["ideology-flags"] });
    queryClient.invalidateQueries({ queryKey: ["social-media-scans"] });
    queryClient.invalidateQueries({ queryKey: ["agency-contracts"] });
    queryClient.invalidateQueries({ queryKey: ["ai-accountability"] });
  }

  const runScan = async () => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("company-intelligence-scan", {
        body: { companyId, companyName },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Scan failed");
      
      toast({ title: "Intelligence scan complete", description: `Found ${data.totalSignalsFound} signals across ${data.modulesCompleted} modules.` });
      queryClient.invalidateQueries({ queryKey: ["latest-scan-run", companyId] });
    } catch (e: any) {
      if (e.message?.includes('already in progress')) {
        toast({ title: "Scan already running", description: "Please wait for the current scan to finish.", variant: "destructive" });
      } else {
        toast({ title: "Scan failed", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsScanning(false);
      queryClient.invalidateQueries({ queryKey: ["latest-scan-run", companyId] });
      // Invalidate all module queries
      queryClient.invalidateQueries({ queryKey: ["ai-hr-signals"] });
      queryClient.invalidateQueries({ queryKey: ["worker-benefit-signals"] });
      queryClient.invalidateQueries({ queryKey: ["pay-equity-signals"] });
      queryClient.invalidateQueries({ queryKey: ["worker-sentiment"] });
      queryClient.invalidateQueries({ queryKey: ["ideology-flags"] });
      queryClient.invalidateQueries({ queryKey: ["social-media-scans"] });
      queryClient.invalidateQueries({ queryKey: ["agency-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["ai-accountability"] });
    }
  };

  const moduleStatuses = (latestScan?.module_statuses || {}) as Record<string, any>;
  const totalModules = Object.keys(MODULE_LABELS).length;
  const completedCount = latestScan?.modules_completed || 0;
  const progress = latestScan?.scan_status === 'in_progress'
    ? Math.round((completedCount / totalModules) * 100)
    : latestScan?.scan_status?.startsWith('completed') ? 100 : 0;

  const overallStatusBadge = () => {
    if (!latestScan) return null;
    switch (latestScan.scan_status) {
      case 'completed': return <Badge className="bg-primary/10 text-primary border-primary/30">Complete</Badge>;
      case 'completed_with_warnings': return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Completed with warnings</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">In Progress</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Radar className="w-5 h-5 text-primary" />
            Company Intelligence Scan
          </CardTitle>
          <div className="flex items-center gap-2">
            {overallStatusBadge()}
            <Button
              onClick={runScan}
              disabled={isScanning}
              size="sm"
              className="gap-2"
            >
              {isScanning ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Scanning...</>
              ) : latestScan ? (
                <><RefreshCw className="w-4 h-4" />Run Fresh Scan</>
              ) : (
                <><Search className="w-4 h-4" />Run Intelligence Scan</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats row */}
        {latestScan && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-foreground">{latestScan.total_sources_scanned || 0}</div>
              <div className="text-xs text-muted-foreground">Sources Scanned</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-foreground">{latestScan.total_signals_found || 0}</div>
              <div className="text-xs text-muted-foreground">Signals Found</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-foreground">{latestScan.modules_completed || 0}/{totalModules}</div>
              <div className="text-xs text-muted-foreground">Modules Complete</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-foreground">{latestScan.modules_with_signals || 0}</div>
              <div className="text-xs text-muted-foreground">With Signals</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-primary text-xs">
                {latestScan.scan_completed_at
                  ? new Date(latestScan.scan_completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </div>
              <div className="text-xs text-muted-foreground">Last Scan</div>
            </div>
          </div>
        )}

        {/* Progress bar during scan */}
        {isScanning && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{completedCount}/{totalModules} modules scanned</p>
          </div>
        )}

        {/* Module status grid */}
        {latestScan && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(MODULE_LABELS).map(([key, label]) => {
              const modStatus = moduleStatuses[key];
              const status = modStatus?.status || 'not_run';
              const signals = modStatus?.signalsFound;
              return (
                <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    {statusIcon(status)}
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {signals != null && signals > 0 && (
                      <Badge variant="secondary" className="text-xs">{signals} signals</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{statusLabel(status)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Warnings */}
        {latestScan?.warnings?.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-600 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Warnings
            </div>
            {(latestScan.warnings as string[]).map((w: string, i: number) => (
              <p key={i} className="text-xs text-muted-foreground">{w}</p>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!latestScan && !isLoading && (
          <div className="text-center py-6">
            <Radar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No intelligence scan has been run yet.</p>
            <p className="text-xs text-muted-foreground">Click "Run Intelligence Scan" to analyze this company across all research modules.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
