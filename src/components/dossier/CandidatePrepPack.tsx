import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Target, Loader2, RefreshCw, AlertTriangle, Briefcase, Code, Users, TrendingUp, Crown } from "lucide-react";
import { toast } from "sonner";
import { PrepPackExport } from "./PrepPackExport";
import { getViteSupabasePublishableKey, getViteSupabaseUrl } from "@/lib/supabase-vite-env";

const ENGINE_URL = `${getViteSupabaseUrl()}/functions/v1/candidate-prep-pack`;

const ROLES = [
  { id: "general", label: "General", icon: Target },
  { id: "engineering", label: "Engineering", icon: Code },
  { id: "people_hr", label: "People & HR", icon: Users },
  { id: "sales", label: "Sales", icon: TrendingUp },
  { id: "leadership", label: "Leadership", icon: Crown },
] as const;

type RoleId = typeof ROLES[number]["id"];

interface CandidatePrepPackProps {
  companyId?: string;
  companyName: string;
}

export function CandidatePrepPack({ companyId, companyName }: CandidatePrepPackProps) {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<RoleId>("general");
  const scrollRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async (selectedRole: RoleId) => {
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
        body: JSON.stringify({ companyId, companyName, role: selectedRole }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 429) toast.error("Rate limit hit. Try again in a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted. Add funds in Settings.");
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
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) { accumulated += delta; setContent(accumulated); }
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
            if (delta) { accumulated += delta; setContent(accumulated); }
          } catch {}
        }
      }
    } catch (e: any) {
      console.error("Candidate Prep Pack error:", e);
      setError(e.message || "Analysis failed. Try again.");
    } finally {
      setIsStreaming(false);
    }
  }, [companyId, companyName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  const handleRoleChange = (newRole: RoleId) => {
    setRole(newRole);
    if (hasRun) run(newRole);
  };

  // Idle state
  if (!hasRun && !isStreaming) {
    return (
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-6 space-y-5">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Interview Prep Pack</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                AI-powered prep using {companyName}'s real receipts. Get talk tracks, questions to ask, and red flags to watch for.
              </p>
            </div>
          </div>

          {/* Role picker */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground text-center">What role are you interviewing for?</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {ROLES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setRole(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    role === id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button onClick={() => run(role)} className="gap-1.5">
              <Target className="w-3.5 h-3.5" /> Generate Prep Pack
            </Button>
          </div>
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
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Interview Prep Pack</span>
            <Badge variant="outline" className="text-xs py-0 bg-primary/5 text-primary border-primary/20">
              AI
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {!isStreaming && content && (
              <PrepPackExport content={content} companyName={companyName} />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs h-7"
              onClick={() => run(role)}
              disabled={isStreaming}
            >
              <RefreshCw className={cn("w-3 h-3", isStreaming && "animate-spin")} />
              {isStreaming ? "Generating..." : "Rerun"}
            </Button>
          </div>
        </div>

        {/* Role picker bar */}
        <div className="flex items-center gap-1.5 px-5 py-2 border-b border-border/20 bg-muted/20 overflow-x-auto">
          <span className="text-xs text-muted-foreground shrink-0 mr-1">Role:</span>
          {ROLES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleRoleChange(id)}
              disabled={isStreaming}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0",
                role === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                isStreaming && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div ref={scrollRef} className="px-5 py-4 max-h-[700px] overflow-y-auto">
          {error ? (
            <div className="flex items-center gap-2 text-destructive text-sm py-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          ) : content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none
              [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-2
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
              <span className="text-sm">Building your prep pack for {companyName}...</span>
            </div>
          ) : null}

          {isStreaming && content && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Still generating...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isStreaming && content && (
          <div className="px-5 py-2.5 border-t border-border/40 bg-muted/20">
            <p className="text-xs text-muted-foreground text-center">
              Powered by WDIWF Intelligence Engine. Based on public records, not opinion.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
