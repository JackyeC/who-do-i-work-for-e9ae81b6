import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Zap, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getViteSupabasePublishableKey, getViteSupabaseUrl } from "@/lib/supabase-vite-env";

const ENGINE_URL = `${getViteSupabaseUrl()}/functions/v1/clarity-engine`;

interface ClarityEngineProps {
  companyId?: string;
  companyName: string;
  autoRun?: boolean;
}

export function ClarityEngine({ companyId, companyName, autoRun = false }: ClarityEngineProps) {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async () => {
    setContent("");
    setError(null);
    setIsStreaming(true);
    setHasRun(true);

    let accumulated = "";

    try {
      const resp = await fetch(ENGINE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getViteSupabasePublishableKey()}`,
        },
        body: JSON.stringify({ companyId, companyName }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast.error("Rate limit hit. Try again in a moment.");
        } else if (resp.status === 402) {
          toast.error("AI credits exhausted. Add funds in Settings.");
        }
        throw new Error(errData.error || `Request failed (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setContent(accumulated);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setContent(accumulated);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      console.error("Clarity Engine error:", e);
      setError(e.message || "Analysis failed. Try again.");
    } finally {
      setIsStreaming(false);
    }
  }, [companyId, companyName]);

  useEffect(() => {
    if (autoRun && !hasRun) {
      run();
    }
  }, [autoRun, hasRun, run]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  // Idle state
  if (!hasRun && !isStreaming) {
    return (
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">WDIWF Clarity Engine</h3>
            <p className="text-xs text-muted-foreground mt-1">
              AI-powered "Facts Over Feelings" analysis of {companyName}. Get the verdict, strategy breakdown, workforce risk, and three hard interview questions.
            </p>
          </div>
          <Button onClick={run} className="gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Run Clarity Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Clarity Engine</span>
            <Badge variant="outline" className="text-xs py-0 bg-primary/5 text-primary border-primary/20">
              AI
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs h-7"
            onClick={run}
            disabled={isStreaming}
          >
            <RefreshCw className={cn("w-3 h-3", isStreaming && "animate-spin")} />
            {isStreaming ? "Analyzing..." : "Rerun"}
          </Button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="px-5 py-4 max-h-[600px] overflow-y-auto">
          {error ? (
            <div className="flex items-center gap-2 text-destructive text-sm py-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          ) : content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none
              [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-5 [&_h2]:mb-2
              [&_h2:first-child]:mt-0
              [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed
              [&_ol]:text-sm [&_ul]:text-sm
              [&_li]:text-muted-foreground
              [&_strong]:text-foreground
            ">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : isStreaming ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Pulling the receipts on {companyName}...</span>
            </div>
          ) : null}

          {isStreaming && content && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Still analyzing...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isStreaming && content && (
          <div className="px-5 py-2.5 border-t border-border/40 bg-muted/20">
            <p className="text-xs text-muted-foreground text-center">
              Analysis powered by WDIWF Intelligence Engine. Based on public data, not opinion.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
