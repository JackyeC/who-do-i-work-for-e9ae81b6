import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import {
  Newspaper, Shield, AlertTriangle, TrendingUp, Building2,
  Clock, ExternalLink, Filter, RefreshCw, Loader2,
  ChevronRight, Eye, Star, MapPin, Zap
} from "lucide-react";
import { Navigate } from "react-router-dom";

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

const ALL_CATEGORIES = ["all", ...Object.keys(CATEGORY_CONFIG)];

export default function BriefingPage() {
  const { user, loading: authLoading } = useAuth();
  const [briefingData, setBriefingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedNews, setExpandedNews] = useState<string | null>(null);

  const fetchBriefing = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await supabase.functions.invoke("generate-briefing", {
        body: { mode: "single", user_id: user.id },
      });
      if (response.data?.success) setBriefingData(response.data);
    } catch (err) {
      console.error("Briefing error:", err);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetchBriefing(); }, [fetchBriefing]);

  const filteredNews = useMemo(() => {
    if (!briefingData?.news) return [];
    if (activeCategory === "all") return briefingData.news;
    return briefingData.news.filter((n: any) => n.category === activeCategory);
  }, [briefingData?.news, activeCategory]);

  const categoryCounts = useMemo(() => {
    if (!briefingData?.news) return {};
    const counts: Record<string, number> = { all: briefingData.news.length };
    for (const n of briefingData.news) counts[n.category] = (counts[n.category] || 0) + 1;
    return counts;
  }, [briefingData?.news]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="flex gap-2 mt-6">
            {[1,2,3,4,5].map(i => <div key={i} className="h-8 w-24 bg-muted rounded-full" />)}
          </div>
          <div className="space-y-3 mt-6">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-card border border-border/50 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!briefingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground font-display">No briefing available</h2>
          <p className="text-sm text-muted-foreground mt-1">Complete your profile to get personalized news.</p>
        </div>
      </div>
    );
  }

  const { briefing, news, companies } = briefingData;

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Your Daily Briefing — Who Do I Work For?</title></Helmet>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" /> Your Daily Briefing
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-sm text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(briefing.generated_at).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{news.length} stories</span>
            </div>
          </div>
          <button onClick={() => fetchBriefing(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Values */}
        {briefing.top_values_matched?.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-xs text-muted-foreground">Ranked by your values:</span>
            {briefing.top_values_matched.map((v: string) => (
              <span key={v} className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">{v}</span>
            ))}
          </div>
        )}

        {/* Category filters */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
          {ALL_CATEGORIES.map(cat => {
            const count = categoryCounts[cat] || 0;
            if (cat !== "all" && count === 0) return null;
            const config = cat === "all" ? null : CATEGORY_CONFIG[cat];
            const isActive = activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border/50"
                }`}>
                {config && <config.icon className="w-3 h-3" />}
                {cat === "all" ? "All" : config?.label || cat}
                <span className={isActive ? "opacity-60" : "opacity-40"}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* News */}
          <div className="lg:col-span-2 space-y-3">
            {filteredNews.map((item: any, i: number) => {
              const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.industry;
              const Icon = config.icon;
              const isExpanded = expandedNews === item.id;
              return (
                <div key={item.id || i} className="bg-card border border-border/50 rounded-xl overflow-hidden hover:border-border transition-colors">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${config.color}15` }}>
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                            {config.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{item.source}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{timeAgo(item.published_at)}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground leading-snug mb-1.5">{item.title}</h3>
                        <p className={`text-sm text-muted-foreground leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>{item.summary}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {(item.value_tags || []).slice(0, 3).map((tag: string) => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                            ))}
                            {(item.company_slugs || []).slice(0, 2).map((slug: string) => (
                              <a key={slug} href={`/company/${slug}`} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20">{slug}</a>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setExpandedNews(isExpanded ? null : item.id)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                              {isExpanded ? "Less" : "More"}
                            </button>
                            {item.source_url && (
                              <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors">
                                <ExternalLink className="w-3 h-3" /> Source
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredNews.length === 0 && (
              <div className="text-center py-12">
                <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No stories in this category today.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground font-display">Companies to Watch</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Based on your values and interests</p>
              <div className="space-y-3">
                {companies.map((company: any, i: number) => (
                  <a key={company.id || i} href={`/company/${company.slug}`}
                    className="block p-3 bg-background border border-border/50 rounded-lg hover:border-primary/30 transition-colors group">
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{company.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{company.industry}</p>
                      </div>
                      {company.civic_footprint_score != null && (
                        <div className="text-right">
                          <span className={`text-lg font-bold font-mono ${
                            company.civic_footprint_score >= 70 ? "text-green-400" :
                            company.civic_footprint_score >= 40 ? "text-primary" : "text-red-400"
                          }`}>{Math.round(company.civic_footprint_score)}</span>
                          <p className="text-[8px] text-muted-foreground font-mono uppercase tracking-wider">CFS</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Eye className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-primary">View full intel</span>
                      <ChevronRight className="w-3 h-3 text-primary ml-auto" />
                    </div>
                  </a>
                ))}
              </div>
              {companies.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Watch more companies to get recommendations</p>}
            </div>

            {/* Stats */}
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today's Numbers</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Stories matched</span>
                  <span className="text-sm font-bold text-foreground font-mono">{news.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">WDIWF Intel</span>
                  <span className="text-sm font-bold text-primary font-mono">{news.filter((n: any) => n.category === "wdiwf_intel").length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Companies flagged</span>
                  <span className="text-sm font-bold text-foreground font-mono">{[...new Set(news.flatMap((n: any) => n.company_slugs || []))].length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Values activated</span>
                  <span className="text-sm font-bold text-foreground font-mono">{briefing.top_values_matched?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
