import { useApplyQueue, useAutoApplySettings } from "@/hooks/use-auto-apply";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Play, Trash2, ExternalLink, Copy, Check,
  ListTodo, CheckCircle2, AlertCircle, Clock, RotateCcw, Zap, FileDown,
  Inbox, ArrowRight
} from "lucide-react";
import { generateCandidateAdvocacyPdf } from "@/lib/generateCandidateAdvocacyPdf";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  queued: { label: "Queued", icon: Clock, color: "text-muted-foreground bg-muted border-border" },
  processing: { label: "Processing", icon: Loader2, color: "text-civic-yellow bg-civic-yellow/5 border-civic-yellow/20/10 dark:border-civic-yellow/20" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-civic-green bg-civic-green/5 border-civic-green/20/10 dark:border-civic-green/20" },
  failed: { label: "Failed", icon: AlertCircle, color: "text-destructive bg-destructive/5 border-destructive/30" },
};

function QueueItemCard({
  item,
  onRemove,
  onRetry,
  removing,
}: {
  item: any;
  onRemove: (id: string) => void;
  onRetry: (item: any) => void;
  removing: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.queued;
  const Icon = config.icon;

  const handleCopy = async () => {
    const statement = item.generated_payload?.matchingStatement;
    if (!statement) return;
    await navigator.clipboard.writeText(statement);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      layout
    >
      <Card className="hover:shadow-sm transition-shadow border-border/60">
        <CardContent className="p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-medium text-foreground text-sm truncate">{item.job_title}</h4>
                <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border", config.color)}>
                  <Icon className={cn("w-2.5 h-2.5", item.status === "processing" && "animate-spin")} />
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Link
                  to={`/company/${item.company_name?.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-primary hover:underline font-medium"
                >
                  {item.company_name}
                </Link>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{item.alignment_score}% match</span>
                {item.processed_at && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{new Date(item.processed_at).toLocaleDateString()}</span>
                  </>
                )}
              </div>
              {item.error_message && (
                <p className="text-xs text-destructive mt-1.5 bg-destructive/5 rounded px-2 py-1">{item.error_message}</p>
              )}
              {item.generated_payload?.matchingStatement && (
                <div className="mt-2 bg-muted/40 border border-border/60 rounded p-2 text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                  {item.generated_payload.matchingStatement}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.generated_payload?.matchingStatement && (
                <Button size="icon" variant="ghost" onClick={handleCopy} className="h-7 w-7">
                  {copied ? <Check className="w-3 h-3 text-civic-green" /> : <Copy className="w-3 h-3" />}
                </Button>
              )}
              {item.generated_payload?.advocacyData && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    const pdf = generateCandidateAdvocacyPdf(item.generated_payload.advocacyData);
                    const slug = item.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                    pdf.save(`${slug}-advocacy-dossier.pdf`);
                  }}
                >
                  <FileDown className="w-3 h-3" />
                </Button>
              )}
              {item.application_url && (
                <Button size="icon" variant="ghost" asChild className="h-7 w-7">
                  <a href={item.application_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
              {item.status === "failed" && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRetry(item)}
                  className="h-7 w-7 text-primary hover:text-primary"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onRemove(item.id)}
                disabled={removing}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

type StatusFilter = "all" | "queued" | "completed" | "failed";

export function ApplyQueueDashboard() {
  const { queue, isLoading, processQueue, removeFromQueue, addToQueue, todayCount } = useApplyQueue();
  const { settings } = useAutoApplySettings();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const queuedCount = queue.filter((i) => i.status === "queued").length;
  const completedCount = queue.filter((i) => i.status === "completed").length;
  const failedCount = queue.filter((i) => i.status === "failed").length;

  const filteredQueue = statusFilter === "all"
    ? queue
    : queue.filter((i) => i.status === statusFilter);

  const handleRetry = (item: any) => {
    removeFromQueue.mutate(item.id, {
      onSuccess: () => {
        addToQueue.mutate({
          job_id: item.job_id || undefined,
          company_id: item.company_id,
          job_title: item.job_title,
          company_name: item.company_name,
          alignment_score: item.alignment_score,
          matched_signals: item.matched_signals || [],
          application_url: item.application_url || undefined,
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact stats + filter row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ListTodo className="w-3.5 h-3.5" />
            <strong className="text-foreground">{queuedCount}</strong> queued
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-civic-green" />
            <strong className="text-foreground">{completedCount}</strong> done
          </span>
          {failedCount > 0 && (
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              <strong className="text-foreground">{failedCount}</strong> failed
            </span>
          )}
          <span className="text-xs ml-1 px-1.5 py-0.5 rounded bg-muted border border-border">
            {todayCount}/{settings?.max_daily_applications || 5} today
          </span>
        </div>
        {queuedCount > 0 && (
          <Button
            onClick={() => processQueue.mutate()}
            disabled={processQueue.isPending || (settings?.is_paused ?? false)}
            size="sm"
            className="gap-1.5 h-7 text-xs"
          >
            {processQueue.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            Process {queuedCount}
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      {queue.length > 0 && (
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList className="h-7 p-0.5">
            <TabsTrigger value="all" className="text-xs px-2.5 h-6">All ({queue.length})</TabsTrigger>
            <TabsTrigger value="queued" className="text-xs px-2.5 h-6">Queued ({queuedCount})</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-2.5 h-6">Done ({completedCount})</TabsTrigger>
            {failedCount > 0 && (
              <TabsTrigger value="failed" className="text-xs px-2.5 h-6">Failed ({failedCount})</TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      )}

      {/* Queue list */}
      {queue.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Queue is empty</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed mb-4">
              Browse your matched jobs and click <strong>Quick Apply</strong> to add jobs here. AI will generate tailored cover letters for each.
            </p>
            <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
              <Link to="/dashboard?tab=matches">
                Browse Matches <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredQueue.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-xs text-muted-foreground">No items with this status.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredQueue.map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              onRemove={(id) => removeFromQueue.mutate(id)}
              onRetry={handleRetry}
              removing={removeFromQueue.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
