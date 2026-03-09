import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, TrendingDown, DollarSign, Shield, Building2,
  Users, Loader2, ExternalLink, Clock, BarChart3, Briefcase,
  Scale, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  warn_layoffs: { label: "WARN Act Layoff", icon: TrendingDown, color: "text-destructive border-destructive/30 bg-destructive/5" },
  sec_executive_compensation: { label: "Executive Compensation", icon: DollarSign, color: "text-amber-600 border-amber-500/30 bg-amber-500/5" },
  sec_insider_trading: { label: "Insider Trading Activity", icon: BarChart3, color: "text-orange-600 border-orange-500/30 bg-orange-500/5" },
  lobbying: { label: "Lobbying Activity", icon: Scale, color: "text-blue-600 border-blue-500/30 bg-blue-500/5" },
  pac_spending: { label: "PAC Spending", icon: DollarSign, color: "text-purple-600 border-purple-500/30 bg-purple-500/5" },
  federal_contracts: { label: "Federal Contract", icon: Briefcase, color: "text-emerald-600 border-emerald-500/30 bg-emerald-500/5" },
  workplace_enforcement: { label: "Workplace Enforcement", icon: Shield, color: "text-red-600 border-red-500/30 bg-red-500/5" },
  ai_hiring: { label: "AI Hiring Signal", icon: Eye, color: "text-indigo-600 border-indigo-500/30 bg-indigo-500/5" },
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

export function SignalsThisWeek() {
  // Get signals from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: signals, isLoading } = useQuery({
    queryKey: ["signals-this-week"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_signal_scans")
        .select("id, company_id, signal_category, signal_type, signal_value, confidence_level, scan_timestamp, source_url")
        .gte("scan_timestamp", thirtyDaysAgo.toISOString())
        .order("scan_timestamp", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Get company names for all signal company_ids
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

  // Get WARN notice stats
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

  // Group signals by category for summary
  const categoryCounts: Record<string, number> = {};
  (signals || []).forEach(s => {
    categoryCounts[s.signal_category] = (categoryCounts[s.signal_category] || 0) + 1;
  });

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground mt-3">Loading live signals...</p>
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No signals detected recently</h3>
        <p className="text-sm text-muted-foreground">Scan some companies to populate this feed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Live header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Live Signal Feed</span>
        <span className="text-xs text-muted-foreground">· {signals.length} signals detected in the last 30 days</span>
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
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Companies Flagged</div>
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
        {signals.map((signal: any) => {
          const company = companyMap.get(signal.company_id);
          const config = CATEGORY_CONFIG[signal.signal_category] || { label: signal.signal_category, icon: AlertTriangle, color: "text-muted-foreground" };
          const Icon = config.icon;

          return (
            <Card key={signal.id} className="hover:border-primary/30 transition-colors">
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
                        <span className="text-sm font-semibold text-foreground">Unknown Company</span>
                      )}
                      <Badge variant="outline" className={cn("text-[9px] capitalize", config.color)}>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/80 mb-1">{signal.signal_type}</p>
                    {signal.signal_value && (
                      <p className="text-xs text-muted-foreground">{signal.signal_value}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {getRelativeTime(signal.scan_timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        {signal.confidence_level}
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
          Signals auto-detected from public records: FEC, SEC EDGAR, USASpending, OSHA, state WARN filings, and verified web sources.
          This platform reports signals — interpretation is left to you.
        </p>
      </div>
    </div>
  );
}
