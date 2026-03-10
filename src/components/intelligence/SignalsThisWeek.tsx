import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, TrendingDown, DollarSign, Shield, Building2,
  Users, Loader2, ExternalLink, Clock, BarChart3, Briefcase,
  Scale, Eye, Sparkles, CheckCircle2, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  warn_layoffs: { label: "Workforce Signal", icon: TrendingDown, color: "text-destructive border-destructive/30 bg-destructive/5" },
  sec_executive_compensation: { label: "Governance Signal", icon: DollarSign, color: "text-amber-600 border-amber-500/30 bg-amber-500/5" },
  sec_insider_trading: { label: "Economic Signal", icon: BarChart3, color: "text-orange-600 border-orange-500/30 bg-orange-500/5" },
  lobbying: { label: "Policy Influence Signal", icon: Scale, color: "text-blue-600 border-blue-500/30 bg-blue-500/5" },
  pac_spending: { label: "Policy Influence Signal", icon: DollarSign, color: "text-purple-600 border-purple-500/30 bg-purple-500/5" },
  federal_contracts: { label: "Economic Signal", icon: Briefcase, color: "text-emerald-600 border-emerald-500/30 bg-emerald-500/5" },
  workplace_enforcement: { label: "Workforce Signal", icon: Shield, color: "text-red-600 border-red-500/30 bg-red-500/5" },
  ai_hiring: { label: "Workforce Signal", icon: Eye, color: "text-indigo-600 border-indigo-500/30 bg-indigo-500/5" },
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
        .select("id, name, slug")
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

  const categoryCounts: Record<string, number> = {};
  (signals || []).forEach(s => {
    categoryCounts[s.signal_category] = (categoryCounts[s.signal_category] || 0) + 1;
  });

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
        <p className="text-sm text-muted-foreground mt-3">Loading employer reality signals...</p>
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No employer signals detected recently</h3>
        <p className="text-sm text-muted-foreground">Scan some employers to populate this feed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Live header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Employer Reality Signal Feed</span>
          <span className="text-xs text-muted-foreground">· {signals.length} signals detected</span>
        </div>
        <div className="flex items-center gap-2">
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
              <><Sparkles className="w-3.5 h-3.5" /> Explain in Plain English</>
            )}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{signals.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Signals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{companyIds.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Employers Flagged</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{totalWarnNotices}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">WARN Notices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{totalWarnAffected.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Workers Affected</div>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(categoryCounts).map(([cat, count]) => {
          const config = CATEGORY_CONFIG[cat] || { label: cat.replace(/_/g, " "), icon: AlertTriangle, color: "text-muted-foreground" };
          const Icon = config.icon;
          return (
            <Badge key={cat} variant="outline" className={cn("gap-1.5 capitalize text-xs", config.color)}>
              <Icon className="w-3 h-3" />
              {config.label}: {count}
            </Badge>
          );
        })}
      </div>

      {/* Signal timeline */}
      <div className="space-y-3">
        {signals.map((signal: any, idx: number) => {
          const company = companyMap.get(signal.company_id);
          const config = CATEGORY_CONFIG[signal.signal_category] || { label: signal.signal_category, icon: AlertTriangle, color: "text-muted-foreground" };
          const Icon = config.icon;
          const translation = translations[idx];
          const confidenceLabel = signal.confidence_level === "high" ? "Strong evidence" : signal.confidence_level === "medium" ? "Some evidence" : "Weak evidence";

          return (
            <Card key={signal.id} className={cn(
              "hover:border-primary/30 transition-colors",
              translation && !translation.is_fresh && "border-amber-500/30"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {company ? (
                        <Link to={`/company/${company.slug}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                          {company.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">Unknown Employer</span>
                      )}
                      <Badge variant="outline" className={cn("text-[9px] capitalize", config.color)}>
                        {config.label}
                      </Badge>
                      {translation && !translation.is_fresh && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-600 bg-amber-500/5 gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> Not this week
                        </Badge>
                      )}
                      {translation && translation.is_fresh && (
                        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/5 gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Fresh
                        </Badge>
                      )}
                    </div>

                    {/* AI plain-English summary */}
                    {translation ? (
                      <div className="mb-1.5">
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {translation.plain_summary}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 italic">
                          {translation.freshness_note}
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-foreground/80 mb-1">{signal.signal_type}</p>
                        {signal.signal_value && !signal.signal_value.startsWith('{') && !signal.signal_value.startsWith('[') && (
                          <p className="text-xs text-muted-foreground">Public signals suggest: {signal.signal_value}</p>
                        )}
                        {signal.signal_value && (signal.signal_value.startsWith('{') || signal.signal_value.startsWith('[')) && (
                          <p className="text-xs text-muted-foreground">Structured data detected — view company profile for details.</p>
                        )}
                      </>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {getRelativeTime(signal.scan_timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        {confidenceLabel}
                      </span>
                      {signal.source_url && (
                        <a href={signal.source_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="w-2.5 h-2.5" /> Source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Attribution */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Employer reality signals auto-detected from public records: FEC, SEC EDGAR, USASpending, OSHA, state WARN filings, and verified web sources.
          This platform surfaces evidence — interpretation is left to you.
        </p>
      </div>
    </div>
  );
}
