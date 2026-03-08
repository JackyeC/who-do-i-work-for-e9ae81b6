import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bug, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, Loader2,
  Database, Globe, Brain, AlertTriangle, CircleSlash, SkipForward
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  companyId: string;
}

export function ScanDebugPanel({ companyId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: scanRuns, isLoading } = useQuery({
    queryKey: ["scan-debug", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scan_runs" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as any[];
    },
    enabled: isOpen,
  });

  const statusIcon = (status: string) => {
    if (status === 'completed_with_signals') return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
    if (status === 'completed_no_signals') return <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />;
    if (status === 'no_sources_found') return <CircleSlash className="w-3.5 h-3.5 text-yellow-600" />;
    if (status === 'failed') return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    if (status === 'skipped') return <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />;
    if (status === 'in_progress') return <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />;
    return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'completed_with_signals': return 'Completed (signals found)';
      case 'completed_no_signals': return 'Completed (no signals)';
      case 'no_sources_found': return 'No sources found';
      case 'failed': return 'Failed';
      case 'skipped': return 'Skipped';
      case 'in_progress': return 'In progress';
      case 'queued': return 'Queued';
      default: return status || 'Unknown';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-muted-foreground/30">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <Bug className="w-4 h-4" />
                Scan Debug Panel
              </CardTitle>
              {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Loading scan history...</div>}
            
            {!isLoading && (!scanRuns || scanRuns.length === 0) && (
              <p className="text-sm text-muted-foreground">No scan runs found for this company.</p>
            )}

            {scanRuns?.map((run: any, idx: number) => {
              const moduleEntries = Object.entries(run.module_statuses || {});
              const trulyCompleted = moduleEntries.filter(([, m]: [string, any]) => 
                m.status === 'completed_with_signals' || m.status === 'completed_no_signals'
              ).length;
              const failedMods = moduleEntries.filter(([, m]: [string, any]) => m.status === 'failed').length;
              const noSourcesMods = moduleEntries.filter(([, m]: [string, any]) => m.status === 'no_sources_found').length;

              return (
                <div key={run.id} className={`${idx > 0 ? 'mt-4 pt-4 border-t border-border' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(run.scan_status)}
                      <span className="text-sm font-medium text-foreground">{run.scan_status}</span>
                      <Badge variant="outline" className="text-xs">{run.triggered_by}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(run.scan_started_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Truthful stats */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                    {[
                      { icon: Globe, label: 'Sources', val: run.total_sources_scanned },
                      { icon: Brain, label: 'Signals', val: run.total_signals_found },
                      { icon: CheckCircle2, label: 'Completed', val: trulyCompleted },
                      { icon: XCircle, label: 'Failed', val: failedMods },
                      { icon: CircleSlash, label: 'No Sources', val: noSourcesMods },
                      { icon: Database, label: 'With Signals', val: run.modules_with_signals },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="text-center p-1.5 bg-muted/30 rounded text-xs">
                        <div className="font-medium text-foreground">{val ?? 0}</div>
                        <div className="text-muted-foreground">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Per-module diagnostics */}
                  <div className="space-y-1 mb-3">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Module Diagnostics:</div>
                    {moduleEntries.map(([key, mod]: [string, any]) => (
                      <div key={key} className="text-xs py-1.5 px-2 rounded bg-muted/20 border border-border/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {statusIcon(mod.status)}
                            <span className="font-medium text-foreground">{mod.label || key}</span>
                          </div>
                          <span className="text-muted-foreground">{statusLabel(mod.status)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 ml-5 text-muted-foreground">
                          <span>Sources: {mod.sourcesScanned ?? '—'}</span>
                          <span>Signals: {mod.signalsFound ?? '—'}</span>
                          {mod.startedAt && <span>Started: {new Date(mod.startedAt).toLocaleTimeString()}</span>}
                          {mod.completedAt && <span>Ended: {new Date(mod.completedAt).toLocaleTimeString()}</span>}
                        </div>
                        {mod.error && (
                          <div className="mt-1 ml-5 text-destructive">
                            {mod.errorType && <span className="font-medium">[{mod.errorType}] </span>}
                            {mod.error}
                            {mod.errorExplanation && <span className="text-muted-foreground"> — {mod.errorExplanation}</span>}
                          </div>
                        )}
                        {mod.status === 'no_sources_found' && (
                          <div className="mt-1 ml-5 text-yellow-600">
                            No usable sources discovered. Not the same as "no signals detected."
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Error log */}
                  {run.error_log?.length > 0 && (
                    <div className="p-2 rounded bg-destructive/5 border border-destructive/20 mb-2">
                      <div className="text-xs font-medium text-destructive mb-1">Error Log ({run.error_log.length}):</div>
                      {run.error_log.map((entry: any, i: number) => (
                        <div key={i} className="mb-1.5 last:mb-0 text-xs">
                          <span className="font-medium text-foreground">{entry.label || entry.module}</span>
                          {entry.status && <span className="text-destructive ml-1">HTTP {entry.status}</span>}
                          {entry.errorType && <span className="text-muted-foreground ml-1">[{entry.errorType}]</span>}
                          <div className="text-muted-foreground ml-2">{entry.errorExplanation || entry.error}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {run.warnings?.length > 0 && (
                    <div className="p-2 rounded bg-yellow-500/5 border border-yellow-500/20 mb-2">
                      <div className="flex items-center gap-1 text-xs font-medium text-yellow-600 mb-1">
                        <AlertTriangle className="w-3 h-3" /> Warnings ({run.warnings.length})
                      </div>
                      {run.warnings.map((w: string, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground">{w}</p>
                      ))}
                    </div>
                  )}

                  {/* Duration */}
                  {run.scan_completed_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Duration: {Math.round((new Date(run.scan_completed_at).getTime() - new Date(run.scan_started_at).getTime()) / 1000)}s
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
