import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Radar, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock,
  Search, RefreshCw, CircleSlash, SkipForward
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ScanCoveragePanel } from "@/components/ScanCoveragePanel";
import { ScanProgressOverlay } from "@/components/ScanProgressOverlay";

interface Props {
  companyId: string;
  companyName: string;
}

const MODULE_LABELS: Record<string, string> = {
  fec_campaign_finance: "FEC Campaign Finance",
  federal_contracts: "Federal Contracts (USASpending)",
  lobbying_disclosure: "Lobbying Disclosure (Senate LDA)",
  sec_edgar: "SEC EDGAR (Filings & Compensation)",
  congress_cross_ref: "Congress Cross-Reference",
  opencorporates: "Corporate Structure (OpenCorporates)",
  workplace_enforcement: "Workplace Enforcement (DOL)",
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
    case 'no_sources_found': return <CircleSlash className="w-3.5 h-3.5 text-[hsl(var(--civic-yellow))]" />;
    case 'failed': return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    case 'in_progress': return <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />;
    case 'skipped': return <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />;
    case 'queued': return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    default: return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'completed_with_signals': return 'Signals found';
    case 'completed_no_signals': return 'No signals detected';
    case 'no_sources_found': return 'No sources found';
    case 'failed': return 'Failed';
    case 'in_progress': return 'Scanning...';
    case 'skipped': return 'Skipped';
    case 'queued': return 'Queued';
    default: return 'Not run';
  }
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'completed_with_signals': return 'bg-primary/10 text-primary border-primary/30';
    case 'completed_no_signals': return 'bg-muted text-muted-foreground border-border';
    case 'no_sources_found': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    case 'failed': return 'bg-destructive/10 text-destructive border-destructive/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export function CompanyIntelligenceScanCard({ companyId, companyName }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
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

  useEffect(() => {
    if (isScanning && latestScan?.scan_status && !['queued', 'in_progress'].includes(latestScan.scan_status)) {
      setIsScanning(false);
      // Keep overlay open so user can see "Scan Complete" and click "View Results"
      const keys = ["ai-hr-signals", "worker-benefit-signals", "pay-equity-signals", "worker-sentiment", "ideology-flags", "social-media-scans", "agency-contracts", "ai-accountability"];
      keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
    }
  }, [isScanning, latestScan?.scan_status, queryClient]);

  const runScan = async (forceRescan = false) => {
    setIsScanning(true);
    setShowOverlay(true);
    try {
      const [orchestrated, unified] = await Promise.allSettled([
        supabase.functions.invoke("company-intelligence-scan", {
          body: { companyId, companyName, forceRescan },
        }),
        supabase.functions.invoke("civiclens-intelligence-scan", {
          body: { companyId, companyName, scanParts: ['benefits', 'ai_hiring', 'audit_hunt'] },
        }),
      ]);

      const orchResult = orchestrated.status === 'fulfilled' ? orchestrated.value : null;
      const uniResult = unified.status === 'fulfilled' ? unified.value : null;

      // Check if the 409 "already in progress" was returned — treat as non-error (just poll)
      const is409 = orchResult?.error && (
        orchResult.error.message?.includes('409') ||
        orchResult.error.message?.includes('already in progress') ||
        (orchResult.error as any)?.context?.status === 409 ||
        (orchResult.error as any)?.status === 409
      );

      if (is409) {
        // Scan is already running — just poll for results
        toast({ title: "Scan already in progress", description: "Monitoring the existing scan for results." });
        queryClient.invalidateQueries({ queryKey: ["latest-scan-run", companyId] });
        return;
      }

      if (orchResult?.error && uniResult?.error) {
        throw new Error(orchResult.error.message || "Scan failed");
      }

      const totalSignals = (orchResult?.data?.totalSignalsFound || 0) +
        (uniResult?.data?.results?.benefits || 0) + (uniResult?.data?.results?.aiHiring || 0);

      toast({
        title: "Intelligence scan complete",
        description: `Found ${totalSignals} signals across all modules.`
      });
      queryClient.invalidateQueries({ queryKey: ["latest-scan-run", companyId] });
    } catch (e: any) {
      if (e.message?.includes('already in progress')) {
        toast({ title: "Scan already running", description: "Please wait for the current scan to finish.", variant: "destructive" });
      } else {
        toast({ title: "Scan failed", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsScanning(false);
      const allKeys = ["latest-scan-run", "ai-hr-signals", "ai-hiring-signals", "worker-benefit-signals", "pay-equity-signals", "worker-sentiment", "ideology-flags", "social-media-scans", "agency-contracts", "ai-accountability", "roi-pipeline", "influence-chain"];
      allKeys.forEach(k => queryClient.invalidateQueries({ queryKey: k === "latest-scan-run" ? [k, companyId] : [k] }));
    }
  };

  const moduleStatuses = (latestScan?.module_statuses || {}) as Record<string, any>;
  const totalModules = Object.keys(MODULE_LABELS).length;

  // Truthful counts: only count truly completed modules
  const trulyCompletedCount = Object.values(moduleStatuses).filter(
    (m: any) => m.status === 'completed_with_signals' || m.status === 'completed_no_signals'
  ).length;
  const failedCount = Object.values(moduleStatuses).filter((m: any) => m.status === 'failed').length;
  const noSourcesCount = Object.values(moduleStatuses).filter((m: any) => m.status === 'no_sources_found').length;

  const progress = latestScan?.scan_status === 'in_progress'
    ? Math.round(((trulyCompletedCount + failedCount + noSourcesCount) / totalModules) * 100)
    : latestScan?.scan_status?.startsWith('completed') || latestScan?.scan_status === 'failed' ? 100 : 0;

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

  const errorLogEntries = (latestScan?.error_log || []) as any[];

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
            <Button onClick={() => runScan()} disabled={isScanning} size="sm" className="gap-2">
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
        {/* Stats row — truthful counts */}
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
              <div className="text-lg font-bold text-foreground">{trulyCompletedCount}/{totalModules}</div>
              <div className="text-xs text-muted-foreground">Modules Complete</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-destructive">{failedCount + noSourcesCount}</div>
              <div className="text-xs text-muted-foreground">Failed / No Sources</div>
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
            <p className="text-xs text-muted-foreground mt-1.5">
              Scanning federal databases, web sources, and AI analysis modules. This typically takes <strong>2–4 minutes</strong> depending on data availability.
            </p>
          </div>
        )}

        {/* Module status grid — per-module diagnostics */}
        {latestScan && (
          <div className="space-y-2 mb-4">
            {Object.entries(MODULE_LABELS).map(([key, label]) => {
              const modStatus = moduleStatuses[key];
              const status = modStatus?.status || 'not_run';
              const signals = modStatus?.signalsFound ?? 0;
              const sources = modStatus?.sourcesScanned ?? 0;
              const completedAt = modStatus?.completedAt;

              return (
                <div key={key} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {statusIcon(status)}
                      <span className="text-sm font-medium text-foreground">{label}</span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusBadgeClass(status)}`}>
                      {statusLabel(status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground ml-5.5">
                    <span>Sources: {sources}</span>
                    <span>Signals: {signals}</span>
                    {completedAt && (
                      <span>Run: {new Date(completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                  {/* Inline error detail for failed modules */}
                  {status === 'failed' && modStatus?.errorExplanation && (
                    <div className="mt-1.5 ml-5.5 text-[11px] text-destructive">
                      {modStatus.error && <span className="font-medium">{modStatus.error}: </span>}
                      {modStatus.errorExplanation}
                    </div>
                  )}
                  {status === 'no_sources_found' && (
                    <div className="mt-1.5 ml-5.5 text-[11px] text-[hsl(var(--civic-yellow))]">
                      No usable source material was discovered. This is not the same as "no signals."
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Scan warnings panel with actionable detail */}
        {errorLogEntries.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Scan Errors ({errorLogEntries.length})
            </div>
            {errorLogEntries.map((entry: any, i: number) => (
              <div key={i} className="mb-2 last:mb-0 p-2 rounded bg-destructive/5">
                <div className="text-xs font-medium text-foreground">{entry.label || entry.module}</div>
                {entry.status && <div className="text-[11px] text-destructive">HTTP {entry.status}</div>}
                <div className="text-[11px] text-muted-foreground">{entry.errorExplanation || entry.error}</div>
              </div>
            ))}
          </div>
        )}

        {/* General warnings */}
        {latestScan?.warnings?.length > 0 && errorLogEntries.length === 0 && (
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

        {/* Scan Coverage Panel — entity resolution + data source coverage */}
        {latestScan && (
          <div className="mt-4">
            <ScanCoveragePanel
              resolutionLog={latestScan.entity_resolution_log as any}
              moduleStatuses={moduleStatuses as any}
              totalSignals={latestScan.total_signals_found || 0}
              totalSources={latestScan.total_sources_scanned || 0}
              scanStatus={latestScan.scan_status}
            />
          </div>
        )}

        {/* Empty state */}
        {!latestScan && !isLoading && (
          <div className="text-center py-6">
            <Radar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No intelligence scan has been run yet.</p>
            <p className="text-xs text-muted-foreground">Click "Run Intelligence Scan" to analyze this company across all research modules. Scans typically take 2–4 minutes.</p>
          </div>
        )}
      </CardContent>

      <ScanProgressOverlay
        isOpen={showOverlay}
        companyName={companyName}
        moduleStatuses={moduleStatuses}
        scanStatus={latestScan?.scan_status || null}
        totalSignals={latestScan?.total_signals_found || 0}
        totalSources={latestScan?.total_sources_scanned || 0}
        onClose={() => setShowOverlay(false)}
        onForceRescan={() => {
          setShowOverlay(false);
          runScan(true);
        }}
      />
    </Card>
  );
}
