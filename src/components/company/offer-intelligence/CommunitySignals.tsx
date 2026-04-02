import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star, Shield, MessageSquare, AlertTriangle, Loader2, Bug } from "lucide-react";
import { useCompanyReviews, type ReviewSignal } from "@/hooks/use-company-reviews";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/* ── Constants ── */
const SOURCE_ICONS: Record<string, typeof Star> = {
  Indeed: Star,
  "Better Business Bureau": Shield,
  Glassdoor: Star,
};

const SOURCE_LABELS: Record<string, { section: string; badge: string }> = {
  Indeed: { section: "What Employees Say", badge: "Source: Indeed employee reviews" },
  "Better Business Bureau": { section: "Business Record", badge: "Source: Better Business Bureau" },
  Glassdoor: { section: "Glassdoor", badge: "Source: Glassdoor" },
};

const SCORE_LEVEL = (score: number | null, max = 5) => {
  if (score == null) return "neutral" as const;
  const pct = score / max;
  if (pct >= 0.6) return "positive" as const;
  if (pct >= 0.4) return "neutral" as const;
  return "caution" as const;
};

const LEVEL_STYLES = {
  positive: "border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/5",
  caution: "border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5",
  neutral: "border-border/40 bg-muted/10",
};

const MIN_CONFIDENCE = 0.5; // Below this, show "possible match" warning

/* ── Rating Bar ── */
function RatingBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= 60 ? "bg-[hsl(var(--civic-green))]" : pct >= 40 ? "bg-[hsl(var(--civic-yellow))]" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold font-mono text-foreground tabular-nums">{value.toFixed(1)}</span>
    </div>
  );
}

/* ── Debug Panel ── */
function DebugPanel({ debug, signals }: { debug: any; signals: ReviewSignal[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <Bug className="w-3 h-3" />
        {open ? "Hide" : "Show"} debug info
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-lg bg-muted/20 border border-border/30 text-[10px] font-mono text-muted-foreground space-y-2 overflow-x-auto">
          {debug && (
            <>
              <p><strong>Cache hit:</strong> {debug.cacheHit ? "Yes" : "No"}</p>
              <p><strong>Normalized name:</strong> {debug.normalizedName}</p>
              <p><strong>State:</strong> {debug.state || "none"}</p>
              <p><strong>Indeed:</strong> {debug.indeedCount ?? "?"} signals | <strong>BBB:</strong> {debug.bbbCount ?? "?"} | <strong>Glassdoor:</strong> {debug.glassdoorCount ?? "?"}</p>
              <p><strong>Fetched at:</strong> {debug.fetchedAt}</p>
              {debug.confidences?.length > 0 && (
                <div>
                  <p className="font-bold mt-1">Match confidence:</p>
                  <table className="w-full mt-1">
                    <thead>
                      <tr className="border-b border-border/20">
                        <th className="text-left pr-2">Source</th>
                        <th className="text-left pr-2">Type</th>
                        <th className="text-left pr-2">Confidence</th>
                        <th className="text-left pr-2">Method</th>
                        <th className="text-left">Raw Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debug.confidences.map((c: any, i: number) => (
                        <tr key={i} className="border-b border-border/10">
                          <td className="pr-2 py-0.5">{c.source}</td>
                          <td className="pr-2">{c.type}</td>
                          <td className={cn("pr-2", c.confidence < MIN_CONFIDENCE ? "text-destructive" : "text-[hsl(var(--civic-green))]")}>{c.confidence.toFixed(2)}</td>
                          <td className="pr-2">{c.method}</td>
                          <td>{c.rawName || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          {signals.length > 0 && (
            <div>
              <p className="font-bold mt-1">Stored signals ({signals.length}):</p>
              {signals.map((s, i) => (
                <p key={i}>
                  [{s.source}] {s.label}: {s.value ?? s.detail?.slice(0, 50)} | conf={s.confidence_score ?? "?"} | method={s.company_match_method ?? "?"} | url={s.source_url || "none"} | fetched={s.fetched_at || "?"}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Signal type helpers ── */
const isSnippet = (s: ReviewSignal) => s.signal_type.startsWith("review_snippet");
const isRating = (s: ReviewSignal) => s.signal_type === "overall_rating" || s.signal_type.startsWith("sub_score_") || s.signal_type === "ceo_approval";

/* ── Main Component ── */
interface CommunitySignalsProps {
  companyId: string;
  companyName?: string;
  companyState?: string;
}

export function CommunitySignals({ companyId, companyName, companyState }: CommunitySignalsProps) {
  // Trigger Apify fetch (with 24h cache)
  const { data: reviewData, isLoading: reviewsLoading, isFetching } = useCompanyReviews(
    companyId,
    companyName || "",
    companyState
  );

  // Fetch all community signals from DB (includes Apify-cached + any manually inserted)
  const { data: signals = [] } = useQuery({
    queryKey: ["community-signals", companyId, reviewData?.lastFetched],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_community_signals")
        .select("*")
        .eq("company_id", companyId)
        .order("source");
      if (error) throw error;
      return (data ?? []) as ReviewSignal[];
    },
  });

  // Loading state while background fetch runs
  if (reviewsLoading || isFetching) {
    return (
      <Card className="border-border/40 bg-muted/10">
        <CardContent className="p-5 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <div>
            <p className="text-sm font-medium text-foreground">Searching public directories…</p>
            <p className="text-xs text-muted-foreground">Checking Indeed, BBB, and Glassdoor for verified signals.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data found after fetch
  if (signals.length === 0) {
    if (companyName && reviewData) {
      return (
        <Card className="border-border/40 bg-muted/10">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              No verified community signals found yet. This company may be too new or too small to have
              a public record on Indeed, BBB, or Glassdoor — ask for references from current employees before accepting.
            </p>
            <DebugPanel debug={reviewData.debug} signals={[]} />
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  // Group by source, filter by confidence
  const highConfidence = signals.filter((s) => (s.confidence_score ?? 1) >= MIN_CONFIDENCE);
  const lowConfidence = signals.filter((s) => (s.confidence_score ?? 1) < MIN_CONFIDENCE);

  const grouped = highConfidence.reduce<Record<string, ReviewSignal[]>>((acc, s) => {
    (acc[s.source] ??= []).push(s);
    return acc;
  }, {});

  const lastFetched = signals.map((s) => s.fetched_at).filter(Boolean).sort().pop();

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([source, items]) => {
        const Icon = SOURCE_ICONS[source] ?? MessageSquare;
        const labels = SOURCE_LABELS[source] ?? { section: source, badge: "Community Data" };
        const ratings = items.filter(isRating);
        const snippets = items.filter(isSnippet);
        const other = items.filter((s) => !isRating(s) && !isSnippet(s));

        return (
          <div key={source}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{labels.section}</h3>
              <Badge variant="outline" className="text-[10px] font-mono">{labels.badge}</Badge>
            </div>

            {/* Rating signals with bar display */}
            {ratings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {ratings.map((s) => {
                  const level = SCORE_LEVEL(s.numeric_value);
                  return (
                    <Card key={s.signal_type} className={`border ${LEVEL_STYLES[level]}`}>
                      <CardContent className="p-4">
                        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">{s.label}</p>
                        {s.numeric_value != null ? (
                          <RatingBar value={s.numeric_value} />
                        ) : (
                          <p className="text-base font-bold text-foreground">{s.value ?? "—"}</p>
                        )}
                        {s.detail && <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{s.detail}</p>}
                        {s.source_url && (
                          <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1.5">
                            View source <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Review snippets */}
            {snippets.length > 0 && (
              <div className="space-y-2 mb-3">
                {snippets.map((s) => (
                  <Card key={s.signal_type} className="border border-border/40 bg-muted/10">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground leading-relaxed">"{s.detail}"</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[10px] font-mono">{s.badge_label}</Badge>
                            {s.numeric_value != null && <span className="text-[10px] font-mono text-muted-foreground">{s.numeric_value}/5</span>}
                            {s.source_url && (
                              <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
                                Source <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Other signals (BBB accreditation, complaints, etc.) */}
            {other.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {other.map((s) => {
                  const level = SCORE_LEVEL(s.numeric_value);
                  return (
                    <Card key={s.signal_type} className={`border ${LEVEL_STYLES[level]}`}>
                      <CardContent className="p-4">
                        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                        <p className="text-base font-bold text-foreground">{s.value ?? "—"}</p>
                        {s.detail && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{s.detail}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] font-mono">{s.badge_label}</Badge>
                          {s.source_url && (
                            <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-[10px]">
                              View source <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Low confidence signals — show with warning */}
      {lowConfidence.length > 0 && (
        <Card className="border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))] shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-foreground">Possible match found — review manually</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              We found data that may belong to this company, but the name match confidence is low. Verify before relying on these signals.
            </p>
            <div className="space-y-1.5">
              {lowConfidence.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>[{s.source}] {s.label}: {s.value ?? "—"}</span>
                  <span className="font-mono text-[10px]">
                    conf: {((s.confidence_score ?? 0) * 100).toFixed(0)}% · matched: "{s.raw_company_name}"
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamp */}
      {lastFetched && (
        <p className="text-[10px] text-muted-foreground font-mono">
          Last fetched: {format(new Date(lastFetched), "MMM d, yyyy 'at' h:mm a")}
        </p>
      )}

      {/* Debug panel (hidden by default) */}
      <DebugPanel debug={reviewData?.debug} signals={signals} />
    </div>
  );
}
