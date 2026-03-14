import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { usePageSeo } from "@/hooks/use-page-seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, TrendingUp, Shield, AlertTriangle, DollarSign,
  Building2, FileText, Users, ExternalLink, Clock, Filter,
  Zap, Eye, ChevronRight
} from "lucide-react";

type Signal = {
  id: string;
  issue_area: string;
  signal_type: string;
  description: string;
  source_url: string | null;
  confidence_level: number;
  date_published: string | null;
  created_at: string;
  company_name: string;
  company_slug: string;
};

const CATEGORY_CONFIG: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  "PAC Donation": { icon: DollarSign, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  "Lobbying": { icon: Building2, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  "Federal Contract": { icon: FileText, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  "Workforce Action": { icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  "Corporate Policy": { icon: Shield, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  "Hiring Practice": { icon: Eye, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
};

const FILTER_OPTIONS = ["All", "PAC Donation", "Lobbying", "Federal Contract", "Workforce Action", "Corporate Policy", "Hiring Practice"];

function getConfig(type: string) {
  return CATEGORY_CONFIG[type] || { icon: Activity, color: "text-muted-foreground", bg: "bg-muted/50 border-border/50" };
}

function confidenceLabel(level: number) {
  if (level >= 5) return { text: "VERIFIED", cls: "text-emerald-400 border-emerald-500/30" };
  if (level >= 4) return { text: "STRONG", cls: "text-amber-400 border-amber-500/30" };
  if (level >= 3) return { text: "MODERATE", cls: "text-orange-400 border-orange-500/30" };
  return { text: "WEAK", cls: "text-red-400 border-red-500/30" };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function SignalCard({ signal, index }: { signal: Signal; index: number }) {
  const config = getConfig(signal.signal_type);
  const Icon = config.icon;
  const conf = confidenceLabel(signal.confidence_level);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group relative border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300 overflow-hidden"
    >
      {/* Confidence stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        signal.confidence_level >= 5 ? "bg-emerald-500" :
        signal.confidence_level >= 4 ? "bg-amber-500" :
        signal.confidence_level >= 3 ? "bg-orange-500" : "bg-red-500"
      }`} />

      <div className="p-5 pl-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-1.5 rounded-lg border ${config.bg}`}>
              <Icon className={`w-3.5 h-3.5 ${config.color}`} />
            </div>
            <div className="min-w-0">
              <Link
                to={`/company/${signal.company_slug}`}
                className="font-display font-bold text-foreground hover:text-primary transition-colors text-sm block truncate"
              >
                {signal.company_name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  {signal.signal_type}
                </span>
                <span className="text-border">·</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {signal.issue_area}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`font-mono text-[9px] px-1.5 py-0 ${conf.cls}`}>
              {conf.text}
            </Badge>
            <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {signal.date_published ? timeAgo(signal.date_published) : timeAgo(signal.created_at)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/80 leading-relaxed mb-3">
          {signal.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {signal.source_url && (
              <a
                href={signal.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                VIEW SOURCE
              </a>
            )}
          </div>
          <Link
            to={`/company/${signal.company_slug}`}
            className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            FULL REPORT <ChevronRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function TickerBar({ signals }: { signals: Signal[] }) {
  const items = signals.slice(0, 8);
  if (!items.length) return null;

  return (
    <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-1 px-4 py-2">
        <Zap className="w-3 h-3 text-primary shrink-0" />
        <div className="overflow-hidden relative flex-1">
          <motion.div
            className="flex gap-6 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...items, ...items].map((s, i) => (
              <span key={i} className="inline-flex items-center gap-2 font-mono text-[11px]">
                <span className="text-primary font-semibold">{s.company_name}</span>
                <span className="text-muted-foreground">{s.signal_type}: {s.issue_area}</span>
                <span className="text-border">|</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatsBar({ signals }: { signals: Signal[] }) {
  const companies = new Set(signals.map(s => s.company_name)).size;
  const highConf = signals.filter(s => s.confidence_level >= 4).length;

  return (
    <div className="flex items-center gap-6 font-mono text-xs">
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span className="text-muted-foreground">SIGNALS</span>
        <span className="text-foreground font-bold">{signals.length}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5 text-primary" />
        <span className="text-muted-foreground">COMPANIES</span>
        <span className="text-foreground font-bold">{companies}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-muted-foreground">HIGH CONFIDENCE</span>
        <span className="text-foreground font-bold">{highConf}</span>
      </div>
    </div>
  );
}

export default function SignalFeed() {
  usePageSeo({
    title: "Signal Feed — Live Employer Intelligence | Who Do I Work For?",
    description: "Real-time employer signals: PAC donations, lobbying activity, federal contracts, workforce actions. See what companies are doing before you work there.",
  });

  const [filter, setFilter] = useState("All");

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["signal-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals")
        .select(`
          id, issue_area, signal_type, description, source_url,
          confidence_level, date_published, created_at,
          companies!inner(name, slug)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map((s: any) => ({
        id: s.id,
        issue_area: s.issue_area,
        signal_type: s.signal_type,
        description: s.description,
        source_url: s.source_url,
        confidence_level: s.confidence_level,
        date_published: s.date_published,
        created_at: s.created_at,
        company_name: s.companies.name,
        company_slug: s.companies.slug,
      }));
    },
    staleTime: 60_000,
  });

  const filtered = filter === "All" ? signals : signals.filter(s => s.signal_type === filter);

  return (
    <div className="min-h-screen">
      {/* Ticker */}
      <TickerBar signals={signals} />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-[11px] text-red-400 uppercase tracking-widest">Live Intelligence</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight">
            Signal Feed
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Every signal detected from public records — PAC donations, lobbying disclosures, federal contracts, workforce actions. 
            Updated as companies are scanned. No opinions. Just receipts.
          </p>
        </div>

        {/* Stats + Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <StatsBar signals={signals} />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-medium transition-all whitespace-nowrap border ${
                filter === opt
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {opt === "All" ? `ALL (${signals.length})` : opt.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Signal List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground font-mono text-sm">No signals found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((signal, i) => (
                <SignalCard key={signal.id} signal={signal} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border border-primary/20 rounded-2xl bg-primary/5 p-6 text-center space-y-3"
        >
          <h3 className="font-display font-bold text-foreground">Want alerts when signals drop?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Track companies and get notified when new PAC donations, lobbying activity, or workforce signals are detected.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/login?beta=true">
                <Zap className="w-3.5 h-3.5" /> Sign Up Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/browse">
                <TrendingUp className="w-3.5 h-3.5" /> Browse Companies
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
