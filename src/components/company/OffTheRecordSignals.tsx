import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/ConfidenceBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageSquareWarning, ExternalLink, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Theme {
  label: string;
  summary: string;
  confidence: "low" | "medium";
  recency: string;
  mentionCount: number;
  sentimentDirection: "negative" | "neutral" | "mixed";
}

interface OffTheRecordResponse {
  success: boolean;
  themes: Theme[];
  insufficient: boolean;
  source: string;
}

interface Props {
  companyId: string;
  companyName: string;
}

const RECENCY_DOT: Record<string, string> = {
  "Last 30 days": "bg-[hsl(var(--civic-green))]",
  "Last 30–60 days": "bg-[hsl(var(--civic-yellow))]",
  "Last 60–90 days": "bg-[hsl(var(--civic-yellow))]",
  "Last 3–6 months": "bg-destructive/60",
};

const SENTIMENT_LABEL: Record<string, { text: string; className: string }> = {
  negative: { text: "Negative", className: "text-destructive" },
  neutral: { text: "Neutral", className: "text-muted-foreground" },
  mixed: { text: "Mixed", className: "text-[hsl(var(--civic-yellow))]" },
};

export function OffTheRecordSignals({ companyId, companyName }: Props) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const { data, isLoading } = useQuery<OffTheRecordResponse>({
    queryKey: ["off-the-record", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("off-the-record-scan", {
        body: { companyId, companyName },
      });
      if (error) throw error;
      return data as OffTheRecordResponse;
    },
    enabled: !!companyId && !!companyName,
    staleTime: 1000 * 60 * 30, // 30 min client cache
    retry: 1,
  });

  // Don't render if loading, insufficient, or no themes
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Scanning public discussions…</span>
      </div>
    );
  }

  if (!data?.themes?.length || data.insufficient) return null;

  const themes = data.themes;

  return (
    <section className="mb-10 scroll-mt-28">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <MessageSquareWarning className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground tracking-tight">
          Off-the-Record Signals
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Patterns from recent public discussion. Not a verified company disclosure.
      </p>

      {/* Theme cards */}
      <div className="grid gap-3">
        {themes.map((theme, i) => {
          const dotClass = RECENCY_DOT[theme.recency] || "bg-muted-foreground";
          const sentiment = SENTIMENT_LABEL[theme.sentimentDirection] || SENTIMENT_LABEL.mixed;

          return (
            <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <span className="font-medium text-foreground text-sm leading-tight">
                    {theme.label}
                  </span>
                  <ConfidenceBadge level={theme.confidence as ConfidenceLevel} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                  {theme.summary}
                </p>
                <div className="flex items-center gap-3 flex-wrap text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
                    <span className="text-muted-foreground">{theme.recency}</span>
                  </span>
                  <span className={cn("font-medium", sentiment.className)}>
                    {sentiment.text}
                  </span>
                  {theme.mentionCount > 0 && (
                    <span className="text-muted-foreground">
                      ~{theme.mentionCount} mentions
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Source threads (collapsed) */}
      {(data as any)?.themes && (
        <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen} className="mt-3">
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={cn("h-3 w-3 transition-transform", sourcesOpen && "rotate-180")} />
            View source context
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <p className="text-xs text-muted-foreground italic">
              Themes were derived from public forum discussions indexed by search engines.
              Raw posts are not displayed to protect individual privacy.
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Context note */}
      <p className="text-[11px] text-muted-foreground/70 mt-3 italic">
        These patterns are derived from public discussion forums. They reflect recurring themes, not verified facts.
      </p>
    </section>
  );
}
