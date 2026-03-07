import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bug, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, Loader2,
  Database, Globe, Brain, AlertTriangle
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
    if (status?.startsWith('completed')) return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
    if (status === 'failed') return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    if (status === 'in_progress') return <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />;
    return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
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

            {scanRuns?.map((run: any, idx: number) => (
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

                {/* Stats */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                  {[
                    { icon: Globe, label: 'Sources', val: run.total_sources_scanned },
                    { icon: Brain, label: 'Signals', val: run.total_signals_found },
                    { icon: CheckCircle2, label: 'Completed', val: run.modules_completed },
                    { icon: XCircle, label: 'Failed', val: run.modules_failed },
                    { icon: Database, label: 'With Signals', val: run.modules_with_signals },
                    { icon: Clock, label: 'No Signals', val: run.modules_with_no_signals },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="text-center p-1.5 bg-muted/30 rounded text-xs">
                      <div className="font-medium text-foreground">{val ?? 0}</div>
                      <div className="text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Module statuses */}
                <div className="space-y-1 mb-3">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Module Results:</div>
                  {Object.entries(run.module_statuses || {}).map(([key, mod]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between text-xs py-0.5 px-2 rounded bg-muted/20">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(mod.status)}
                        <span className="text-foreground">{mod.label || key}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {mod.signalsFound != null && <span>{mod.signalsFound} signals</span>}
                        {mod.sourcesScanned != null && <span>{mod.sourcesScanned} sources</span>}
                        {mod.error && <span className="text-destructive">{mod.error}</span>}
                        <span>{mod.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warnings */}
                {run.warnings?.length > 0 && (
                  <div className="p-2 rounded bg-yellow-500/5 border border-yellow-500/20 mb-2">
                    <div className="flex items-center gap-1 text-xs font-medium text-yellow-600 mb-1">
                      <AlertTriangle className="w-3 h-3" /> Warnings
                    </div>
                    {run.warnings.map((w: string, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground">{w}</p>
                    ))}
                  </div>
                )}

                {/* Error log */}
                {run.error_log?.length > 0 && (
                  <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                    <div className="text-xs font-medium text-destructive mb-1">Error Log:</div>
                    <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                      {JSON.stringify(run.error_log, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Duration */}
                {run.scan_completed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Duration: {Math.round((new Date(run.scan_completed_at).getTime() - new Date(run.scan_started_at).getTime()) / 1000)}s
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
