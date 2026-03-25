import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquareWarning, TrendingUp, UserMinus, AlertTriangle, 
  ExternalLink, Loader2, Radio, RefreshCw, CloudOff 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SignalDensity } from "@/components/SignalMeta";
import { useScanWithFallback } from "@/hooks/use-scan-with-fallback";
import { SavedIntelligenceBadge } from "@/components/scan/ScanUnavailableBanner";

interface SocialMonitorCardProps {
  companyId: string;
  companyName: string;
  executiveNames: string[];
  dbCompanyId?: string;
}

interface ScanResult {
  summary: string;
  sentiment: string;
  contradictions: Array<{ topic: string; publicStatement: string; reality: string; severity: string }>;
  personnelChanges: Array<{ person: string; change: string; significance: string }>;
  stanceShifts: Array<{ topic: string; previousStance: string; currentStance: string; timeframe: string }>;
  keyMessages: Array<{ message: string; frequency: string; source: string }>;
  sources: Array<{ title: string; url: string }>;
  resultCount: number;
}

const sentimentColors: Record<string, string> = {
  positive: "bg-civic-green/10 text-civic-green",
  negative: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
  mixed: "bg-civic-yellow/10 text-civic-yellow",
};

const severityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-civic-yellow/10 text-civic-yellow",
  low: "bg-muted text-muted-foreground",
};

export function SocialMonitorCard({ companyId, companyName, executiveNames, dbCompanyId }: SocialMonitorCardProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [liveResult, setLiveResult] = useState<ScanResult | null>(null);

  // Fetch latest cached scan from DB
  const { data: cachedScan, refetch } = useQuery({
    queryKey: ["social-scan", dbCompanyId],
    queryFn: async () => {
      if (!dbCompanyId) return null;
      const { data, error } = await supabase
        .from("social_media_scans")
        .select("*")
        .eq("company_id", dbCompanyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!dbCompanyId,
  });

  const [firecrawlDown, setFirecrawlDown] = useState(false);

  const { runScan, isFirecrawlDown, cooldownMinutes } = useScanWithFallback({
    functionName: "social-scan",
    companyId: dbCompanyId,
    companyName,
    extraBody: { executiveNames },
    setLoading: setIsScanning,
    onSuccess: (data) => {
      setLiveResult(data.data);
      refetch();
    },
    onError: (reason) => {
      if (reason === 'firecrawl_error') setFirecrawlDown(true);
    },
  });

  const result = liveResult || (cachedScan ? {
    summary: cachedScan.ai_summary || "",
    sentiment: cachedScan.sentiment || "unknown",
    contradictions: (cachedScan.contradictions as any[]) || [],
    personnelChanges: (cachedScan.personnel_changes as any[]) || [],
    stanceShifts: (cachedScan.stance_shifts as any[]) || [],
    keyMessages: [],
    sources: (cachedScan.sources as any[]) || [],
    resultCount: ((cachedScan.results as any[]) || []).length,
  } : null);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary" />
          Social & Media Monitor
        </CardTitle>
        <div className="flex items-center gap-2">
          {(isFirecrawlDown || firecrawlDown) && cachedScan && (
            <SavedIntelligenceBadge lastUpdated={cachedScan?.created_at} />
          )}
          <Button
            onClick={runScan}
            disabled={isScanning || !dbCompanyId || isFirecrawlDown}
            size="sm"
            variant="outline"
            className="gap-1.5"
          >
            {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isFirecrawlDown ? <CloudOff className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {isScanning ? "Scanning..." : isFirecrawlDown ? `Paused (~${cooldownMinutes}m)` : "Run Scan"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No public signals detected yet. Click "Run Scan" to search public sources for media and messaging signals for {companyName}.</p>
          </div>
        ) : (
          <>
            {/* Signal Density */}
            <SignalDensity
              sourcesScanned={result.resultCount}
              signalsDetected={result.contradictions.length + result.stanceShifts.length + result.personnelChanges.length}
              categories={[
                ...result.contradictions.map(c => c.topic),
                ...result.stanceShifts.map(s => s.topic),
              ].slice(0, 6)}
            />
            {/* Sentiment & Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overall Sentiment</span>
                <Badge className={sentimentColors[result.sentiment] || sentimentColors.neutral} variant="outline">
                  {result.sentiment}
                </Badge>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
            </div>

            {/* Contradictions */}
            {result.contradictions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-destructive">
                   <MessageSquareWarning className="w-4 h-4" />
                   Public Statement vs. Observed Signals ({result.contradictions.length})
                </h4>
                <div className="space-y-2">
                  {result.contradictions.map((c, i) => (
                    <div key={i} className="rounded-md border border-border bg-card p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{c.topic}</span>
                        <Badge className={severityColors[c.severity] || severityColors.low} variant="outline">
                          {c.severity}
                        </Badge>
                      </div>
                       <p className="text-xs text-muted-foreground"><strong>Public statement:</strong> {c.publicStatement}</p>
                       <p className="text-xs text-muted-foreground"><strong>Observed signal:</strong> {c.reality}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stance Shifts */}
            {result.stanceShifts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-civic-yellow">
                  <TrendingUp className="w-4 h-4" />
                  Stance Shifts ({result.stanceShifts.length})
                </h4>
                <div className="space-y-2">
                  {result.stanceShifts.map((s, i) => (
                    <div key={i} className="rounded-md border border-border bg-card p-3 space-y-1">
                      <span className="text-sm font-medium">{s.topic}</span>
                      <p className="text-xs text-muted-foreground"><strong>Before:</strong> {s.previousStance}</p>
                      <p className="text-xs text-muted-foreground"><strong>Now:</strong> {s.currentStance}</p>
                      <p className="text-xs text-muted-foreground/60">{s.timeframe}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personnel Changes */}
            {result.personnelChanges.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <UserMinus className="w-4 h-4" />
                  Personnel Changes ({result.personnelChanges.length})
                </h4>
                <div className="space-y-1.5">
                  {result.personnelChanges.map((p, i) => (
                    <div key={i} className="flex items-start justify-between rounded-md border border-border bg-card p-2.5">
                      <div>
                        <span className="text-sm font-medium">{p.person}</span>
                        <p className="text-xs text-muted-foreground">{p.change}</p>
                      </div>
                      <Badge className={severityColors[p.significance] || severityColors.low} variant="outline">
                        {p.significance}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Messages */}
            {result.keyMessages && result.keyMessages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Key Messaging Themes
                </h4>
                <div className="space-y-1">
                  {result.keyMessages.map((m, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      • <strong>{m.message}</strong> — {m.frequency} ({m.source})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {result.sources.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sources ({result.sources.length})</h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.sources.slice(0, 8).map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[200px]"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {s.title || new URL(s.url).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {cachedScan && (
              <p className="text-xs text-muted-foreground/50">
                Last scanned: {new Date(cachedScan.created_at).toLocaleDateString()}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
