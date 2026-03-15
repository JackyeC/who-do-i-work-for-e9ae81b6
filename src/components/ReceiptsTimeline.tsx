/**
 * Receipts Timeline — Bloomberg-style chronological intelligence view
 * 
 * Aggregates OSINT signals into a structured, filterable evidence timeline.
 * Each entry shows date, event type, source, confidence, and impact tags.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock, Search, ArrowUpDown, Filter, ExternalLink,
  AlertTriangle, TrendingDown, Scale, Landmark, Users,
  Megaphone, DollarSign, UserMinus, Briefcase, FileText,
  Radio, Shield, Gavel, BarChart3, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// ─── Types ───

interface TimelineEvent {
  date: string;
  event_type: string;
  headline: string;
  summary: string;
  source_name: string;
  source_url: string | null;
  confidence: "high" | "medium" | "low";
  impact_tags: string[];
}

interface PatternFlag {
  pattern: string;
  label: string;
  description: string;
  event_count: number;
  confidence: "high" | "medium" | "low";
}

interface ReceiptsTimelineProps {
  companyId: string;
  companyName: string;
}

// ─── Config ───

const EVENT_TYPE_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  leadership_change:     { icon: UserMinus,   label: "Leadership Change",      color: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20" },
  layoff:                { icon: TrendingDown, label: "Layoff",                 color: "bg-destructive/10 text-destructive border-destructive/20" },
  hiring_surge:          { icon: Users,        label: "Hiring Surge",           color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20" },
  hiring_slowdown:       { icon: TrendingDown, label: "Hiring Slowdown",        color: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20" },
  funding_round:         { icon: DollarSign,   label: "Funding / Contract",     color: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/20" },
  lawsuit:               { icon: Gavel,        label: "Lawsuit",                color: "bg-destructive/10 text-destructive border-destructive/20" },
  regulatory_action:     { icon: Shield,       label: "Regulatory Action",      color: "bg-destructive/10 text-destructive border-destructive/20" },
  political_contribution:{ icon: Landmark,     label: "Political Contribution", color: "bg-primary/10 text-primary border-primary/20" },
  lobbying_disclosure:   { icon: Megaphone,    label: "Lobbying Disclosure",    color: "bg-primary/10 text-primary border-primary/20" },
  public_values_statement:{ icon: FileText,    label: "Values Statement",       color: "bg-muted text-muted-foreground border-border" },
  media_narrative_shift: { icon: Radio,        label: "Media Signal",           color: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/20" },
  compensation_disclosure:{ icon: BarChart3,   label: "Compensation / Trade",   color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20" },
  board_change:          { icon: Briefcase,    label: "Board Change",           color: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20" },
};

const IMPACT_TAG_COLORS: Record<string, string> = {
  Workforce:   "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20",
  Reputation:  "bg-primary/10 text-primary border-primary/20",
  Compliance:  "bg-destructive/10 text-destructive border-destructive/20",
  Political:   "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/20",
  Financial:   "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20",
  Leadership:  "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20",
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high:   "text-[hsl(var(--civic-green))]",
  medium: "text-[hsl(var(--civic-yellow))]",
  low:    "text-muted-foreground",
};

const PATTERN_ICONS: Record<string, typeof AlertTriangle> = {
  leadership_instability: UserMinus,
  elevated_legal_exposure: Scale,
  hiring_slowdown: TrendingDown,
  political_activity_spike: Landmark,
  reputation_pressure: AlertTriangle,
  messaging_vs_action_gap: AlertTriangle,
};

// ─── Helpers ───

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Date unavailable";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Date unavailable";
  }
}

function formatDateMonthYear(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

// ─── Component ───

export function ReceiptsTimeline({ companyId, companyName }: ReceiptsTimelineProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [activeEventFilter, setActiveEventFilter] = useState<string | null>(null);
  const [activeImpactFilter, setActiveImpactFilter] = useState<string | null>(null);
  const [showAllPatterns, setShowAllPatterns] = useState(false);
  const [visibleCount, setVisibleCount] = useState(25);

  const { data, isLoading } = useQuery({
    queryKey: ["receipts-timeline", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("receipts-timeline", {
        body: { companyId },
      });
      if (error) throw error;
      return data as {
        events: TimelineEvent[];
        patterns: PatternFlag[];
        event_type_counts: Record<string, number>;
        total_events: number;
      };
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const events = data?.events || [];
  const patterns = data?.patterns || [];
  const typeCounts = data?.event_type_counts || {};

  // ─── Filtering & Search ───
  const filteredEvents = useMemo(() => {
    let result = events;

    if (activeEventFilter) {
      result = result.filter((e) => e.event_type === activeEventFilter);
    }
    if (activeImpactFilter) {
      result = result.filter((e) => e.impact_tags.includes(activeImpactFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.headline.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.source_name.toLowerCase().includes(q)
      );
    }
    if (sortAsc) {
      result = [...result].reverse();
    }
    return result;
  }, [events, activeEventFilter, activeImpactFilter, searchQuery, sortAsc]);

  // Group by month for visual clustering
  const groupedByMonth = useMemo(() => {
    const groups: { month: string; events: TimelineEvent[] }[] = [];
    let currentMonth = "";
    for (const event of filteredEvents.slice(0, visibleCount)) {
      const month = formatDateMonthYear(event.date);
      if (month !== currentMonth) {
        currentMonth = month;
        groups.push({ month, events: [event] });
      } else {
        groups[groups.length - 1].events.push(event);
      }
    }
    return groups;
  }, [filteredEvents, visibleCount]);

  // Unique impact tags for filter
  const allImpactTags = useMemo(() => {
    const tags = new Set<string>();
    events.forEach((e) => e.impact_tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [events]);

  // Unique event types for filter
  const activeEventTypes = useMemo(() => {
    return Object.keys(typeCounts).filter((t) => typeCounts[t] > 0).sort();
  }, [typeCounts]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Receipts Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!events.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Receipts Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No timeline events available yet. Run a full company scan to populate the evidence timeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Pattern Flags ─── */}
      {patterns.length > 0 && (
        <Card className="border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />
              Pattern Detection — {patterns.length} signal{patterns.length !== 1 ? "s" : ""} identified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(showAllPatterns ? patterns : patterns.slice(0, 3)).map((p) => {
              const PIcon = PATTERN_ICONS[p.pattern] || AlertTriangle;
              return (
                <div key={p.pattern} className="flex items-start gap-3 p-2.5 rounded-lg bg-background/60 border border-border/30">
                  <PIcon className="w-4 h-4 text-[hsl(var(--civic-yellow))] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {p.event_count} event{p.event_count !== 1 ? "s" : ""}
                      </Badge>
                      <span className={cn("text-[10px] font-mono uppercase", CONFIDENCE_STYLES[p.confidence])}>
                        {p.confidence}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.description}</p>
                  </div>
                </div>
              );
            })}
            {patterns.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAllPatterns(!showAllPatterns)}>
                {showAllPatterns ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                {showAllPatterns ? "Show fewer" : `Show all ${patterns.length} patterns`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Main Timeline Card ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Receipts Timeline
              <Badge variant="outline" className="text-[10px] font-mono ml-1">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setSortAsc(!sortAsc)}
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortAsc ? "Oldest first" : "Newest first"}
            </Button>
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search events, sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Button
              variant={activeEventFilter === null ? "secondary" : "ghost"}
              size="sm"
              className="text-[10px] h-6 px-2"
              onClick={() => setActiveEventFilter(null)}
            >
              All types
            </Button>
            {activeEventTypes.map((type) => {
              const config = EVENT_TYPE_CONFIG[type];
              return (
                <Button
                  key={type}
                  variant={activeEventFilter === type ? "secondary" : "ghost"}
                  size="sm"
                  className="text-[10px] h-6 px-2 gap-1"
                  onClick={() => setActiveEventFilter(activeEventFilter === type ? null : type)}
                >
                  {config?.label || type}
                  <span className="text-muted-foreground">({typeCounts[type]})</span>
                </Button>
              );
            })}
          </div>

          {/* Impact filters */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Filter className="w-3 h-3 text-muted-foreground self-center" />
            {allImpactTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "text-[10px] cursor-pointer transition-all",
                  activeImpactFilter === tag ? IMPACT_TAG_COLORS[tag] || "" : "opacity-60 hover:opacity-100"
                )}
                onClick={() => setActiveImpactFilter(activeImpactFilter === tag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No events match the current filters.
            </p>
          ) : (
            <div className="space-y-0">
              {groupedByMonth.map(({ month, events: monthEvents }) => (
                <div key={month}>
                  {/* Month separator */}
                  <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm py-1.5 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {month || "Unknown date"}
                    </span>
                  </div>

                  {/* Events in this month */}
                  {monthEvents.map((event, idx) => {
                    const config = EVENT_TYPE_CONFIG[event.event_type] || {
                      icon: Clock,
                      label: event.event_type,
                      color: "bg-muted text-muted-foreground border-border",
                    };
                    const EventIcon = config.icon;

                    return (
                      <div
                        key={`${event.date}-${idx}`}
                        className="flex gap-3 py-2.5 border-l-2 border-border/40 pl-4 ml-1 hover:border-primary/40 transition-colors group"
                      >
                        {/* Icon */}
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border", config.color)}>
                          <EventIcon className="w-3.5 h-3.5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", config.color)}>
                              {config.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatDate(event.date)}
                            </span>
                            <span className={cn("text-[10px] font-mono uppercase", CONFIDENCE_STYLES[event.confidence])}>
                              ● {event.confidence}
                            </span>
                          </div>

                          <p className="text-sm font-medium text-foreground mt-1 leading-snug line-clamp-2">
                            {event.headline}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                            {event.summary}
                          </p>

                          {/* Bottom row: source + impact tags */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {event.source_url ? (
                              <a
                                href={event.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline font-medium"
                              >
                                {event.source_name}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {event.source_name}
                              </span>
                            )}
                            {event.impact_tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className={cn("text-[9px] px-1 py-0", IMPACT_TAG_COLORS[tag] || "")}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Load more */}
              {filteredEvents.length > visibleCount && (
                <div className="pt-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setVisibleCount((v) => v + 25)}
                  >
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show more ({filteredEvents.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              This timeline aggregates publicly available signals from FEC, Senate LDA, CourtListener, WARN, SEC, USASpending, GDELT, and other open data sources.
              Events are presented chronologically for informational purposes. Inclusion does not imply wrongdoing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
