import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HardHat, Loader2, RefreshCw, Star, ThumbsUp, ThumbsDown,
  AlertTriangle, ExternalLink, TrendingDown, TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface WorkerSentimentCardProps {
  companyName: string;
  dbCompanyId?: string;
}

interface SentimentResult {
  overallRating: number | null;
  ceoApproval: number | null;
  recommendToFriend: number | null;
  workLifeBalance: number | null;
  compensationRating: number | null;
  cultureRating: number | null;
  careerOpportunities: number | null;
  topComplaints: Array<{ theme: string; frequency: string; severity: string; example: string }>;
  topPraises: Array<{ theme: string; frequency: string; example: string }>;
  hypocrisyFlags: Array<{ topic: string; companyClaimsSummary: string; workerReality: string; severity: string; evidence: string }>;
  summary: string;
  sentiment: string;
  sources: Array<{ title: string; url: string }>;
  resultCount: number;
}

const sentimentColors: Record<string, string> = {
  positive: "bg-green-500/10 text-green-700 dark:text-green-400",
  negative: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
  mixed: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const severityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
};

function RatingBar({ label, value, max = 5 }: { label: string; value: number | null; max?: number }) {
  if (value == null) return null;
  const pct = (value / max) * 100;
  const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value.toFixed(1)}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function WorkerSentimentCard({ companyName, dbCompanyId }: WorkerSentimentCardProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [liveResult, setLiveResult] = useState<SentimentResult | null>(null);

  const { data: cachedScan, refetch } = useQuery({
    queryKey: ["worker-sentiment", dbCompanyId],
    queryFn: async () => {
      if (!dbCompanyId) return null;
      const { data, error } = await supabase
        .from("company_worker_sentiment" as any)
        .select("*")
        .eq("company_id", dbCompanyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!dbCompanyId,
  });

  const runScan = async () => {
    if (!dbCompanyId) {
      toast({ title: "No database ID", description: "This company isn't linked to live data yet.", variant: "destructive" });
      return;
    }
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("worker-sentiment-scan", {
        body: { companyId: dbCompanyId, companyName },
      });
      if (error) throw error;
      if (data?.success) {
        setLiveResult(data.data);
        refetch();
        toast({ title: "Scan complete", description: `Analyzed ${data.data.resultCount} sources for worker sentiment.` });
      } else {
        throw new Error(data?.error || "Scan failed");
      }
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message || "Could not complete worker sentiment scan.", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  const result: SentimentResult | null = liveResult || (cachedScan ? {
    overallRating: cachedScan.overall_rating,
    ceoApproval: cachedScan.ceo_approval,
    recommendToFriend: cachedScan.recommend_to_friend,
    workLifeBalance: cachedScan.work_life_balance,
    compensationRating: cachedScan.compensation_rating,
    cultureRating: cachedScan.culture_rating,
    careerOpportunities: cachedScan.career_opportunities,
    topComplaints: (cachedScan.top_complaints as any[]) || [],
    topPraises: (cachedScan.top_praises as any[]) || [],
    hypocrisyFlags: (cachedScan.hypocrisy_flags as any[]) || [],
    summary: cachedScan.ai_summary || "",
    sentiment: cachedScan.sentiment || "unknown",
    sources: (cachedScan.sources as any[]) || [],
    resultCount: ((cachedScan.raw_results as any[]) || []).length,
  } : null);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <HardHat className="w-5 h-5 text-primary" />
          Worker Sentiment Scanner
        </CardTitle>
        <Button onClick={runScan} disabled={isScanning || !dbCompanyId} size="sm" variant="outline" className="gap-1.5">
          {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {isScanning ? "Scanning..." : "Run Scan"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <div className="text-center py-8 text-muted-foreground">
            <HardHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No worker sentiment data yet. Click "Run Scan" to analyze Glassdoor reviews, employee satisfaction data, and labor practices for {companyName}.</p>
          </div>
        ) : (
          <>
            {/* Sentiment & Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Worker Sentiment</span>
                <Badge className={sentimentColors[result.sentiment] || sentimentColors.neutral} variant="outline">
                  {result.sentiment}
                </Badge>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
            </div>

            {/* Ratings Grid */}
            {(result.overallRating || result.ceoApproval != null) && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {result.overallRating && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Star className="w-5 h-5 text-amber-500" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">{result.overallRating.toFixed(1)}<span className="text-sm text-muted-foreground">/5</span></div>
                        <div className="text-xs text-muted-foreground">Overall Rating</div>
                      </div>
                    </div>
                  )}
                  <RatingBar label="Work-Life Balance" value={result.workLifeBalance} />
                  <RatingBar label="Compensation" value={result.compensationRating} />
                </div>
                <div className="space-y-3">
                  {result.ceoApproval != null && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <ThumbsUp className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">{result.ceoApproval}%</div>
                        <div className="text-xs text-muted-foreground">CEO Approval</div>
                      </div>
                    </div>
                  )}
                  <RatingBar label="Culture & Values" value={result.cultureRating} />
                  <RatingBar label="Career Opportunities" value={result.careerOpportunities} />
                </div>
              </div>
            )}

            {/* Hypocrisy Flags — Say vs Do */}
            {result.hypocrisyFlags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  Labor Hypocrisy Flags ({result.hypocrisyFlags.length})
                </h4>
                <div className="space-y-2">
                  {result.hypocrisyFlags.map((f, i) => (
                    <div key={i} className="rounded-md border border-border bg-card p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{f.topic}</span>
                        <Badge className={severityColors[f.severity] || severityColors.low} variant="outline">{f.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground"><strong>Company says:</strong> {f.companyClaimsSummary}</p>
                      <p className="text-xs text-muted-foreground"><strong>Workers report:</strong> {f.workerReality}</p>
                      {f.evidence && <p className="text-xs text-muted-foreground/60 italic">"{f.evidence}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Complaints */}
            {result.topComplaints.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <TrendingDown className="w-4 h-4" />
                  Top Worker Complaints ({result.topComplaints.length})
                </h4>
                <div className="space-y-1.5">
                  {result.topComplaints.map((c, i) => (
                    <div key={i} className="flex items-start justify-between rounded-md border border-border bg-card p-2.5">
                      <div>
                        <span className="text-sm font-medium">{c.theme}</span>
                        <p className="text-xs text-muted-foreground">"{c.example}"</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-xs">{c.frequency}</Badge>
                        <Badge className={severityColors[c.severity] || severityColors.low} variant="outline">{c.severity}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Praises */}
            {result.topPraises.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  What Workers Like ({result.topPraises.length})
                </h4>
                <div className="space-y-1">
                  {result.topPraises.map((p, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      • <strong>{p.theme}</strong> — "{p.example}" <span className="text-muted-foreground/60">({p.frequency})</span>
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
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[200px]">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {s.title || (() => { try { return new URL(s.url).hostname; } catch { return s.url; } })()}
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
