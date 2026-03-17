import { useApplyQueue, useAutoApplySettings } from "@/hooks/use-auto-apply";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Play, Trash2, ExternalLink, Copy, Check,
  ListTodo, CheckCircle2, AlertCircle, Clock, RotateCcw, Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  queued: { label: "Queued", icon: Clock, color: "text-muted-foreground bg-muted border-border" },
  processing: { label: "Processing", icon: Loader2, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-200" },
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
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-medium text-foreground text-sm truncate">{item.job_title}</h4>
              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", config.color)}>
                <Icon className={cn("w-3 h-3", item.status === "processing" && "animate-spin")} />
                {config.label}
              </span>
            </div>
            <Link
              to={`/company/${item.company_name?.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-xs text-primary hover:underline"
            >
              {item.company_name}
            </Link>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              <span>{item.alignment_score}% aligned</span>
              {item.processed_at && (
                <span>· Processed {new Date(item.processed_at).toLocaleDateString()}</span>
              )}
            </div>
            {item.error_message && (
              <p className="text-xs text-destructive mt-1 bg-destructive/5 rounded px-2 py-1">{item.error_message}</p>
            )}
            {item.generated_payload?.matchingStatement && (
              <div className="mt-2 bg-muted/50 border border-border rounded-md p-2 text-xs text-foreground/80 line-clamp-3">
                {item.generated_payload.matchingStatement}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            {item.generated_payload?.matchingStatement && (
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1 text-xs h-7">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
            {item.application_url && (
              <Button size="sm" variant="ghost" asChild className="gap-1 text-xs h-7">
                <a href={item.application_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" /> Apply
                </a>
              </Button>
            )}
            {item.status === "failed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRetry(item)}
                className="gap-1 text-xs h-7 text-primary hover:text-primary"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(item.id)}
              disabled={removing}
              className="gap-1 text-xs h-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
    // Remove the failed item and re-add it as queued
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm">
          <ListTodo className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{queuedCount}</span>
          <span className="text-muted-foreground">queued</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="font-medium">{completedCount}</span>
          <span className="text-muted-foreground">completed</span>
        </div>
        {failedCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="font-medium">{failedCount}</span>
            <span className="text-muted-foreground">failed</span>
          </div>
        )}
        <div className="ml-auto text-xs text-muted-foreground">
          {todayCount}/{settings?.max_daily_applications || 5} today
        </div>
      </div>

      {/* Filter + Process */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {queue.length > 0 && (
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs px-3 h-7">All ({queue.length})</TabsTrigger>
              <TabsTrigger value="queued" className="text-xs px-3 h-7">Queued ({queuedCount})</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-3 h-7">Done ({completedCount})</TabsTrigger>
              {failedCount > 0 && (
                <TabsTrigger value="failed" className="text-xs px-3 h-7">Failed ({failedCount})</TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        )}
        {queuedCount > 0 && (
          <Button
            onClick={() => processQueue.mutate()}
            disabled={processQueue.isPending || (settings?.is_paused ?? false)}
            className="gap-1.5"
            size="sm"
          >
            {processQueue.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Process {queuedCount} Job{queuedCount !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Queue list */}
      {queue.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">No jobs in your queue yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Browse <strong>Matched Jobs</strong> and click <strong>"Auto-Apply"</strong> on any job card to add it here. We'll generate a personalized cover letter based on your values profile.
            </p>
          </CardContent>
        </Card>
      ) : filteredQueue.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No items with this status.</p>
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
