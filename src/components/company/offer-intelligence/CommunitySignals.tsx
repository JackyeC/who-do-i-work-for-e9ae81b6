import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star, Shield, MessageSquare } from "lucide-react";
import { useCompanyReviews } from "@/hooks/use-company-reviews";
import { format } from "date-fns";

interface CommunitySignal {
  id: string;
  source: string;
  signal_type: string;
  label: string;
  value: string | null;
  numeric_value: number | null;
  detail: string | null;
  source_url: string | null;
  badge_label: string;
  fetched_at?: string;
}

const SOURCE_ICONS: Record<string, typeof Star> = {
  Indeed: Star,
  "Better Business Bureau": Shield,
  Glassdoor: Star,
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

function RatingBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= 60
      ? "bg-[hsl(var(--civic-green))]"
      : pct >= 40
        ? "bg-[hsl(var(--civic-yellow))]"
        : "bg-destructive";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold font-mono text-foreground tabular-nums">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

interface CommunitySignalsProps {
  companyId: string;
  companyName?: string;
  companyState?: string;
}

export function CommunitySignals({
  companyId,
  companyName,
  companyState,
}: CommunitySignalsProps) {
  // Trigger Apify fetch (with 24h cache) if companyName is provided
  const { data: reviewData } = useCompanyReviews(
    companyId,
    companyName || "",
    companyState
  );

  // Fetch all community signals from the DB (includes Apify-cached data)
  const { data: signals = [] } = useQuery({
    queryKey: ["community-signals", companyId, reviewData?.lastFetched],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_community_signals")
        .select("*")
        .eq("company_id", companyId)
        .order("source");
      if (error) throw error;
      return (data ?? []) as CommunitySignal[];
    },
  });

  if (signals.length === 0) {
    // No data at all — show honest fallback if we tried to fetch
    if (companyName && reviewData) {
      return (
        <Card className="border-border/40 bg-muted/10">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              No employee review data found in public directories. This company
              may be too new or too small to have a verified record — ask for
              references from current employees before accepting.
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  // Group by source
  const grouped = signals.reduce<Record<string, CommunitySignal[]>>(
    (acc, s) => {
      (acc[s.source] ??= []).push(s);
      return acc;
    },
    {}
  );

  // Get the latest fetched_at for display
  const lastFetched = signals
    .map((s) => s.fetched_at)
    .filter(Boolean)
    .sort()
    .pop();

  // Separate review snippets from rating signals
  const isSnippet = (s: CommunitySignal) =>
    s.signal_type.startsWith("review_snippet");
  const isRating = (s: CommunitySignal) =>
    s.signal_type === "overall_rating" ||
    s.signal_type.startsWith("sub_score_");

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([source, items]) => {
        const Icon = SOURCE_ICONS[source] ?? MessageSquare;
        const ratings = items.filter(isRating);
        const snippets = items.filter(isSnippet);
        const other = items.filter((s) => !isRating(s) && !isSnippet(s));

        return (
          <div key={source}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {source === "Indeed" ? "What Employees Say" : source === "Better Business Bureau" ? "Business Record" : source}
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono">
                {source === "Indeed" ? "Source: Indeed employee reviews" : source === "Better Business Bureau" ? "Source: Better Business Bureau" : "Community Data"}
              </Badge>
            </div>

            {/* Rating signals — use bar display for Indeed */}
            {ratings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {ratings.map((s) => {
                  const level = SCORE_LEVEL(s.numeric_value);
                  return (
                    <Card
                      key={s.signal_type}
                      className={`border ${LEVEL_STYLES[level]}`}
                    >
                      <CardContent className="p-4">
                        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                          {s.label}
                        </p>
                        {s.numeric_value != null ? (
                          <RatingBar value={s.numeric_value} />
                        ) : (
                          <p className="text-base font-bold text-foreground">
                            {s.value ?? "—"}
                          </p>
                        )}
                        {s.detail && (
                          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                            {s.detail}
                          </p>
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
                  <Card
                    key={s.signal_type}
                    className="border border-border/40 bg-muted/10"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            "{s.detail}"
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono"
                            >
                              {s.badge_label}
                            </Badge>
                            {s.numeric_value != null && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {s.numeric_value}/5
                              </span>
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
                    <Card
                      key={s.signal_type}
                      className={`border ${LEVEL_STYLES[level]}`}
                    >
                      <CardContent className="p-4">
                        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                          {s.label}
                        </p>
                        <p className="text-base font-bold text-foreground">
                          {s.value ?? "—"}
                        </p>
                        {s.detail && (
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            {s.detail}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono"
                          >
                            {s.badge_label}
                          </Badge>
                          {s.source_url && (
                            <a
                              href={s.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1 text-[10px]"
                            >
                              View source
                              <ExternalLink className="w-3 h-3" />
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

      {/* Last fetched timestamp */}
      {lastFetched && (
        <p className="text-[10px] text-muted-foreground font-mono">
          Last fetched: {format(new Date(lastFetched), "MMM d, yyyy 'at' h:mm a")}
        </p>
      )}
    </div>
  );
}
