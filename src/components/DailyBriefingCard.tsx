import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Newspaper, ArrowRight, Clock, Shield, AlertTriangle,
  TrendingUp, Building2, RefreshCw, Loader2, MapPin, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BriefingData {
  briefing: { date: string; generated_at: string; top_values_matched: string[] };
  news: any[];
  companies: any[];
}

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  wdiwf_intel: { icon: Shield, color: "hsl(var(--primary))", label: "WDIWF Intel" },
  policy: { icon: AlertTriangle, color: "#E87040", label: "Policy" },
  dei: { icon: TrendingUp, color: "#9B6FE8", label: "DEI" },
  layoffs: { icon: AlertTriangle, color: "#E84040", label: "Layoffs" },
  workplace: { icon: Building2, color: "#40A0E8", label: "Workplace" },
  industry: { icon: TrendingUp, color: "#40C080", label: "Industry" },
  remote_work: { icon: MapPin, color: "#40C0E8", label: "Remote Work" },
  ai_hiring: { icon: Zap, color: "#E8A040", label: "AI & Hiring" },
};

export default function DailyBriefingCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBriefing = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    try {
      if (forceRefresh) setRefreshing(true);
      const response = await supabase.functions.invoke("generate-briefing", {
        body: { mode: "single", user_id: user.id },
      });
      if (response.data?.success) {
        setBriefing(response.data);
      }
    } catch (err) {
      console.error("Briefing fetch error:", err);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    fetchBriefing();
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 8 && now.getMinutes() < 2) {
        const today = now.toISOString().split("T")[0];
        if (briefing?.briefing?.date !== today) fetchBriefing(true);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchBriefing, briefing?.briefing?.date]);

  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: "#13121a", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="h-5 w-48 rounded mb-4" style={{ background: "#1c1a27" }} />
        <div className="space-y-3">
          <div className="h-16 rounded-lg" style={{ background: "#1c1a27" }} />
          <div className="h-16 rounded-lg" style={{ background: "#1c1a27" }} />
          <div className="h-16 rounded-lg" style={{ background: "#1c1a27" }} />
        </div>
      </div>
    );
  }

  if (!briefing || briefing.news.length === 0) {
    return (
      <div className="rounded-2xl p-5" style={{ background: "#13121a", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Newspaper className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground font-display">Your Daily Briefing</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No personalized news yet. Set up your briefing preferences to get started.
        </p>
        <button
          onClick={() => navigate("/news-setup")}
          className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary hover:underline"
        >
          Set up your briefing <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const topNews = briefing.news.slice(0, 4);
  const topCompanies = briefing.companies.slice(0, 3);
  const topValues = briefing.briefing.top_values_matched || [];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#13121a", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground font-display">Your Daily Briefing</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Clock className="w-3 h-3" />
              {new Date(briefing.briefing.generated_at).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </div>
          </div>
        </div>
        <button
          onClick={() => fetchBriefing(true)}
          disabled={refreshing}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Values */}
      {topValues.length > 0 && (
        <div className="px-5 pb-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">Prioritized for:</span>
          {topValues.map((v: string) => (
            <span key={v} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
              {v}
            </span>
          ))}
        </div>
      )}

      {/* News */}
      <div className="divide-y divide-border/30">
        {topNews.map((item: any, i: number) => {
          const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.industry;
          const Icon = config.icon;
          return (
            <a
              key={item.id || i}
              href={item.source_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-5 py-3 hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded flex items-center justify-center mt-0.5 shrink-0" style={{ backgroundColor: `${config.color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.source}</span>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Companies */}
      {topCompanies.length > 0 && (
        <div className="px-5 py-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-2">Companies to watch</p>
          <div className="flex gap-2 flex-wrap">
            {topCompanies.map((company: any) => (
              <button
                key={company.id}
                onClick={() => navigate(`/company/${company.slug}`)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-border/50 rounded-lg hover:border-primary/30 transition-colors group"
              >
                <Building2 className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                <span className="text-xs font-medium text-foreground">{company.name}</span>
                {company.civic_footprint_score && (
                  <span className="text-[10px] font-mono text-primary">{Math.round(company.civic_footprint_score)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View full */}
      <button
        onClick={() => navigate("/briefing")}
        className="w-full px-5 py-3 border-t border-border/30 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
      >
        View full briefing <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
