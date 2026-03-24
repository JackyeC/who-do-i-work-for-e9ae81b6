import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Newspaper, ArrowRight, Clock, Shield, AlertTriangle,
  TrendingUp, Building2, RefreshCw, Loader2, MapPin, Zap, Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface BriefingItem {
  id: string;
  company: string;
  signal_type: string;
  headline: string;
  detail: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string;
}

const SIGNAL_CONFIG: Record<string, { label: string; emoji: string; bg: string; text: string; dot: string }> = {
  red_flag: { label: "RED FLAG", emoji: "🔴", bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  amber_flag: { label: "SIGNAL", emoji: "🟡", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500" },
  green_badge: { label: "CLEAR", emoji: "🟢", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500" },
  info: { label: "INTEL", emoji: "🔵", bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500" },
};

export default function DailyBriefingCard() {
  const navigate = useNavigate();
  const [items, setItems] = useState<BriefingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("briefing_items")
        .select("*")
        .eq("is_active", true)
        .order("published_at", { ascending: false })
        .limit(10);
      if (!error && data) setItems(data as unknown as BriefingItem[]);
    } catch (err) {
      console.error("Briefing fetch error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse bg-card border border-border/30">
        <div className="h-5 w-48 rounded mb-4 bg-muted" />
        <div className="space-y-3">
          <div className="h-16 rounded-lg bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border/30">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Newspaper className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground font-display">Your Daily Briefing</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Clock className="w-3 h-3" />
            {new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {items.map((item) => {
          const signal = SIGNAL_CONFIG[item.signal_type] || SIGNAL_CONFIG.info;
          const timeAgo = formatDistanceToNow(new Date(item.published_at), { addSuffix: true });

          return (
            <div key={item.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${signal.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${signal.bg} ${signal.text}`}>
                      {signal.emoji} {signal.label}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{item.company}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">{item.headline}</p>
                  {item.detail && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.detail}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    {item.source_url ? (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-mono">
                        {item.source_name}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">{item.source_name}</span>
                    )}
                    <span className="text-xs text-muted-foreground/60">·</span>
                    <span className="text-xs text-muted-foreground/60">{timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/briefing")}
        className="w-full px-5 py-3 border-t border-border/30 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
      >
        View full briefing <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
