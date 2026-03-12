import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, TrendingDown, DollarSign, Shield, Building2,
  Users, Loader2, ExternalLink, Clock, BarChart3, Briefcase,
  Scale, Eye, Sparkles, CheckCircle2, AlertCircle, Flame, Zap,
  FileText, Globe, Radio
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; accent: string; headline: string }> = {
  warn_layoffs: { label: "WORKFORCE", icon: TrendingDown, color: "text-destructive", accent: "bg-destructive", headline: "Layoff signal detected" },
  sec_executive_compensation: { label: "GOVERNANCE", icon: DollarSign, color: "text-amber-600", accent: "bg-amber-500", headline: "Executive pay filing" },
  sec_insider_trading: { label: "MARKETS", icon: BarChart3, color: "text-orange-600", accent: "bg-orange-500", headline: "Insider trading activity" },
  lobbying: { label: "INFLUENCE", icon: Scale, color: "text-blue-600", accent: "bg-blue-500", headline: "Lobbying disclosure" },
  pac_spending: { label: "POLITICAL SPENDING", icon: DollarSign, color: "text-purple-600", accent: "bg-purple-500", headline: "PAC spending detected" },
  federal_contracts: { label: "CONTRACTS", icon: Briefcase, color: "text-emerald-600", accent: "bg-emerald-500", headline: "Federal contract awarded" },
  workplace_enforcement: { label: "ENFORCEMENT", icon: Shield, color: "text-red-600", accent: "bg-red-500", headline: "Workplace enforcement action" },
  ai_hiring: { label: "AI & HIRING", icon: Eye, color: "text-indigo-600", accent: "bg-indigo-500", headline: "AI hiring practice detected" },
};

function getRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildHeadline(signal: any, companyName: string, config: typeof CATEGORY_CONFIG[string]): string {
  const val = signal.signal_value || "";
  // Don't show raw JSON
  if (val.startsWith("{") || val.startsWith("[") || val === "N/A" || !val.trim()) {
    return `${companyName}: ${config.headline}`;
  }
  // Truncate long values into headline
  const clean = val.length > 120 ? val.slice(0, 117) + "…" : val;
  return `${companyName} — ${clean}`;
}

interface Translation {
  index: number;
  plain_summary: string;
  is_fresh: boolean;
  freshness_note: string;
}

type TimeRange = "30d" | "6mo" | "1yr" | "2yr";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "30d", label: "30 days" },
  { value: "6mo", label: "6 months" },
  { value: "1yr", label: "1 year" },
  { value: "2yr", label: "2 years" },
];

function getCutoffDate(range: TimeRange): Date {
  const d = new Date();
  switch (range) {
    case "30d": d.setDate(d.getDate() - 30); break;
    case "6mo": d.setMonth(d.getMonth() - 6); break;
    case "1yr": d.setFullYear(d.getFullYear() - 1); break;
    case "2yr": d.setFullYear(d.getFullYear() - 2); break;
  }
  return d;
}

export function SignalsThisWeek() {
  const { toast } = useToast();
  const [translations, setTranslations] = useState<Record<number, Translation>>({});
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const cutoffDate = getCutoffDate(timeRange);

  const { data: signals, isLoading } = useQuery({
    queryKey: ["signals-this-week", timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_signal_scans")
        .select("id, company_id, signal_category, signal_type, signal_value, confidence_level, scan_timestamp, source_url")
        .gte("scan_timestamp", cutoffDate.toISOString())
        .order("scan_timestamp", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const companyIds = [...new Set((signals || []).map(s => s.company_id))];
  const { data: companies } = useQuery({
    queryKey: ["signal-companies", companyIds.join(",")],
    queryFn: async () => {
      if (companyIds.length === 0) return [];
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, logo_url")
        .in("id", companyIds);
      return data || [];
    },
    enabled: companyIds.length > 0,
  });

  const companyMap = new Map((companies || []).map(c => [c.id, c]));

  const { data: warnStats } = useQuery({
    queryKey: ["warn-stats-week"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_warn_notices" as any)
        .select("employees_affected, notice_date, company_id")
        .gte("notice_date", "2024-01-01")
        .order("notice_date", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const totalWarnAffected = (warnStats || []).reduce((s: number, n: any) => s + (n.employees_affected || 0), 0);
  const totalWarnNotices = (warnStats || []).length;

  const handleTranslate = async () => {
    if (!signals || signals.length === 0) return;
    setTranslating(true);
    try {
      const batch = signals.slice(0, 20).map((s, i) => ({
        ...s,
        companyName: companyMap.get(s.company_id)?.name || "Unknown",
      }));

      const { data, error } = await supabase.functions.invoke("translate-signals", {
        body: { signals: batch },
      });

      if (error) throw error;

      if (data?.translations) {
        const map: Record<number, Translation> = {};
        (data.translations as Translation[]).forEach(t => { map[t.index] = t; });
        setTranslations(map);
        setTranslated(true);
        toast({ title: "Signals verified ✓", description: "AI checked dates and translated all signals into plain English." });
      }
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Unknown error";
      if (msg.includes("Rate limit") || msg.includes("429")) {
        toast({ title: "Too many requests", description: "Please wait a moment and try again.", variant: "destructive" });
      } else if (msg.includes("402") || msg.includes("credits")) {
        toast({ title: "Credits needed", description: "AI credits have run out. Add more in workspace settings.", variant: "destructive" });
      } else {
        toast({ title: "Translation failed", description: msg, variant: "destructive" });
      }
    } finally {
      setTranslating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground mt-3">Loading signal feed...</p>
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="text-center py-16">
        <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No signals detected yet</h3>
        <p className="text-sm text-muted-foreground">Scan some employers to populate the live feed.</p>
      </div>
    );
  }

  // Split: first 3 are "top stories", rest are timeline
  const topStories = signals.slice(0, 3);
  const restSignals = signals.slice(3);

  // Category counts for the ticker
  const categoryCounts: Record<string, number> = {};
  (signals || []).forEach(s => {
    categoryCounts[s.signal_category] = (categoryCounts[s.signal_category] || 0) + 1;
  });

  return (
    <div className="max-w-5xl space-y-0">
      {/* ═══ BREAKING NEWS BANNER ═══ */}
      <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center gap-3 rounded-t-xl">
        <Flame className="w-4 h-4 animate-pulse shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest">Live Signal Feed</span>
        <span className="text-xs opacity-80 ml-auto">{signals.length} signals · {companyIds.length} employers</span>
      </div>

      {/* ═══ TICKER BAR ═══ */}
      <div className="bg-card border-x border-border/50 px-4 py-2 flex items-center gap-4 overflow-x-auto">
        <div className="flex items-center gap-4 text-[11px] font-medium whitespace-nowrap">
          {totalWarnNotices > 0 && (
            <span className="flex items-center gap-1.5 text-destructive">
              <TrendingDown className="w-3 h-3" />
              {totalWarnNotices} WARN Notices · {totalWarnAffected.toLocaleString()} workers
            </span>
          )}
          {Object.entries(categoryCounts).slice(0, 5).map(([cat, count]) => {
            const config = CATEGORY_CONFIG[cat];
            if (!config) return null;
            return (
              <span key={cat} className={cn("flex items-center gap-1", config.color)}>
                <config.icon className="w-3 h-3" />
                {config.label}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* ═══ CONTROLS BAR ═══ */}
      <div className="bg-card border-x border-border/50 px-4 py-3 flex items-center justify-between gap-3 border-b border-border/30">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
          {TIME_RANGE_OPTIONS.map(tr => (
            <Button
              key={tr.value}
              variant={timeRange === tr.value ? "default" : "ghost"}
              size="sm"
              onClick={() => { setTimeRange(tr.value); setTranslated(false); setTranslations({}); }}
              className="text-[10px] h-7 px-2.5"
            >
              {tr.label}
            </Button>
          ))}
        </div>
        <Button
          variant={translated ? "outline" : "default"}
          size="sm"
          onClick={handleTranslate}
          disabled={translating}
          className="gap-1.5 shrink-0"
        >
          {translating ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...</>
          ) : translated ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> Verified ✓</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Plain English</>
          )}
        </Button>
      </div>

      {/* ═══ TOP STORIES — hero cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-x border-border/50 bg-card">
        {topStories.map((signal, idx) => {
          const company = companyMap.get(signal.company_id);
          const config = CATEGORY_CONFIG[signal.signal_category] || { label: "SIGNAL", icon: AlertTriangle, color: "text-muted-foreground", accent: "bg-muted", headline: "Signal detected" };
          const Icon = config.icon;
          const translation = translations[idx];
          const headline = translation
            ? translation.plain_summary
            : buildHeadline(signal, company?.name || "Unknown Employer", config);

          return (
            <div
              key={signal.id}
              className={cn(
                "relative p-5 flex flex-col justify-between min-h-[180px] group cursor-pointer transition-colors hover:bg-accent/30",
                idx < 2 && "md:border-r border-border/30",
                idx < topStories.length - 1 && "border-b md:border-b-0 border-border/30"
              )}
            >
              {/* Category tag */}
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("w-2 h-2 rounded-full", config.accent)} />
                <span className={cn("text-[10px] font-extrabold uppercase tracking-[0.15em]", config.color)}>
                  {config.label}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {getRelativeTime(signal.scan_timestamp)}
                </span>
              </div>

              {/* Headline */}
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-3">
                  {headline}
                </h3>
                {translation && !translation.is_fresh && (
                  <span className="text-[10px] text-amber-600 italic">{translation.freshness_note}</span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
                {company ? (
                  <Link to={`/company/${company.slug}`} className="text-[11px] font-semibold text-foreground hover:text-primary flex items-center gap-1.5">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="" className="w-4 h-4 rounded object-contain" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    {company.name}
                  </Link>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Unknown employer</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5" />
                    {signal.confidence_level === "high" ? "Strong" : signal.confidence_level === "medium" ? "Moderate" : "Emerging"}
                  </span>
                  {signal.source_url && (
                    <a href={signal.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ DIVIDER ═══ */}
      <div className="border-x border-border/50 bg-muted/30 px-4 py-2 flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">All Signals</span>
        <div className="flex-1 border-t border-border/30" />
      </div>

      {/* ═══ SIGNAL TIMELINE — news wire style ═══ */}
      <div className="border-x border-b border-border/50 bg-card rounded-b-xl divide-y divide-border/20">
        {restSignals.map((signal, rawIdx) => {
          const idx = rawIdx + 3; // offset for translations
          const company = companyMap.get(signal.company_id);
          const config = CATEGORY_CONFIG[signal.signal_category] || { label: "SIGNAL", icon: AlertTriangle, color: "text-muted-foreground", accent: "bg-muted", headline: "Signal detected" };
          const Icon = config.icon;
          const translation = translations[idx];
          const headline = translation
            ? translation.plain_summary
            : buildHeadline(signal, company?.name || "Unknown Employer", config);

          return (
            <div key={signal.id} className="px-4 py-3 flex items-start gap-3 hover:bg-accent/20 transition-colors group">
              {/* Time column */}
              <div className="w-14 shrink-0 pt-0.5">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {getRelativeTime(signal.scan_timestamp)}
                </span>
              </div>

              {/* Category pip */}
              <div className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", config.accent)} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn("text-[9px] font-extrabold uppercase tracking-[0.12em]", config.color)}>
                    {config.label}
                  </span>
                  {translation && !translation.is_fresh && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 border-amber-500/30 text-amber-600">
                      Historical
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {headline}
                </p>
                {translation && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 italic">{translation.freshness_note}</p>
                )}
              </div>

              {/* Company + source */}
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                {company && (
                  <Link to={`/company/${company.slug}`} className="text-[10px] font-medium text-muted-foreground hover:text-primary whitespace-nowrap">
                    {company.name}
                  </Link>
                )}
                {signal.source_url && (
                  <a href={signal.source_url} target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ ATTRIBUTION ═══ */}
      <div className="text-center pt-4 pb-2">
        <p className="text-[10px] text-muted-foreground">
          Signals auto-detected from public records: FEC, SEC EDGAR, USASpending, OSHA, state WARN filings, and verified web sources.
          This platform surfaces evidence — interpretation is left to you.
        </p>
      </div>
    </div>
  );
}
