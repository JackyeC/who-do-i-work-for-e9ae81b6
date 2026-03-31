import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useWorkNews, WorkNewsArticle } from "@/hooks/use-work-news";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import {
  getSourceProfile,
  getBiasColor,
} from "@/lib/source-bias-map";
import {
  Mail, ArrowRight, Check, ExternalLink, Newspaper,
  AlertTriangle, Flame, ChevronRight, Radio,
  Eye, MessageSquare, TrendingUp,
} from "lucide-react";

/* ── Category config ── */
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  regulation: { label: "REG", color: "bg-civic-blue/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30" },
  future_of_work: { label: "WORK", color: "bg-primary/10 text-primary border-primary/30" },
  worker_rights: { label: "RIGHTS", color: "bg-civic-green/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
  ai_workplace: { label: "AI", color: "bg-purple-500/10 text-purple-400 border-purple-400/30" },
  legislation: { label: "LAW", color: "bg-civic-blue/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30" },
  layoffs: { label: "LAYOFFS", color: "bg-destructive/10 text-destructive border-destructive/30" },
  pay_equity: { label: "PAY", color: "bg-civic-yellow/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  labor_organizing: { label: "LABOR", color: "bg-civic-green/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
  dei: { label: "DEI", color: "bg-primary/10 text-primary border-primary/30" },
  workplace: { label: "WORK", color: "bg-primary/10 text-primary border-primary/30" },
  policy: { label: "POLICY", color: "bg-civic-blue/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30" },
  general: { label: "NEWS", color: "bg-muted text-muted-foreground border-border/50" },
};

function getCategoryConfig(cat: string) {
  return CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.general;
}

/* ── Time helpers ── */
function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Spice meter based on controversy + sentiment ── */
function spiceLevel(article: WorkNewsArticle): number {
  let score = 1;
  if (article.is_controversy) score += 2;
  if (article.sentiment_score !== null && article.sentiment_score < -0.3) score += 1;
  if (article.controversy_type) score += 1;
  return Math.min(score, 5);
}

function SpiceMeter({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-0.5" title={`Spice level: ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < level ? "opacity-100" : "opacity-20"}>
          🌶️
        </span>
      ))}
    </span>
  );
}

/* ── Single story card ── */
function StoryCard({ article }: { article: WorkNewsArticle }) {
  const cat = getCategoryConfig(article.category);
  const spice = spiceLevel(article);
  const sourceProfile = article.source_name
    ? getSourceProfile(article.source_name)
    : null;
  const biasColor = sourceProfile ? getBiasColor(sourceProfile.bias) : "";

  return (
    <Card className="bg-card border border-border/40 hover:border-primary/30 transition-all group">
      <CardContent className="p-0">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] font-mono tracking-wider border ${cat.color}`}
            >
              {cat.label}
            </Badge>
            {article.is_controversy && (
              <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-pulse" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            {timeAgo(article.published_at)}
          </span>
        </div>

        {/* Headline */}
        <div className="px-5 pb-3">
          <h3 className="text-[15px] font-semibold text-foreground leading-snug">
            {article.headline}
          </h3>
        </div>

        {/* The Take — ALWAYS OPEN */}
        {article.jackye_take && (
          <div className="mx-4 mb-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary tracking-wide uppercase">
                Jackye's Take
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {article.jackye_take}
            </p>
          </div>
        )}

        {/* Summary teaser line */}
        {article.themes && article.themes.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-1.5">
            {article.themes.map((theme) => (
              <span
                key={theme}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted/50 text-[10px] text-muted-foreground font-mono"
              >
                {theme}
              </span>
            ))}
          </div>
        )}

        {/* Footer: source + spice + link */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/20 bg-muted/20">
          <div className="flex items-center gap-3">
            {article.source_name && (
              <span className={`text-xs font-medium ${biasColor || "text-muted-foreground"}`}>
                {article.source_name}
              </span>
            )}
            <SpiceMeter level={spice} />
          </div>
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
            >
              Read Source <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Filter bar ── */
const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "layoffs", label: "Layoffs" },
  { value: "dei", label: "DEI" },
  { value: "ai_workplace", label: "AI" },
  { value: "regulation", label: "Regulation" },
  { value: "pay_equity", label: "Pay" },
  { value: "controversy", label: "Controversy" },
];

/* ── Main page ── */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const { containerRef, getToken, resetToken } = useTurnstile();
  const { data: articles = [], isLoading } = useWorkNews(60);

  usePageSEO({
    title: "The Receipts — Live Work Intelligence Feed | Who Do I Work For?",
    description:
      "Live employer intelligence: layoffs, DEI rollbacks, AI workplace moves, pay equity, and WARN filings — with Jackye's Take on every story.",
    path: "/newsletter",
    jsonLd: {
      "@type": "WebPage",
      name: "The Receipts — Live Intelligence Feed",
      description:
        "Real-time employer intelligence feed by Who Do I Work For? Sourced from public records, GDELT, and investigative research.",
      url: "https://wdiwf.jackyeclayton.com/newsletter",
      author: { "@type": "Person", name: "Jackye Clayton" },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email.");
      setStatus("error");
      return;
    }
    setStatus("loading");

    const token = await getToken();
    if (!token) {
      setErrorMsg("Bot verification failed. Please try again.");
      setStatus("error");
      resetToken();
      return;
    }

    const verified = await verifyTurnstileToken(token);
    if (!verified) {
      setErrorMsg("Verification failed. Please try again.");
      setStatus("error");
      resetToken();
      return;
    }

    const { error } = await supabase
      .from("email_signups")
      .insert({ email: trimmed, source: "newsletter_page" } as any);
    if (error) {
      if (error.code === "23505") setStatus("success");
      else {
        setErrorMsg("Something went wrong. Try again.");
        setStatus("error");
      }
    } else {
      setStatus("success");
    }
    resetToken();
  };

  /* ── Filter logic ── */
  const filtered =
    filter === "all"
      ? articles
      : filter === "controversy"
        ? articles.filter((a) => a.is_controversy)
        : articles.filter((a) => a.category === filter);

  /* ── Separate: stories with takes, stories without ── */
  const withTakes = filtered.filter((a) => a.jackye_take);
  const withoutTakes = filtered.filter((a) => !a.jackye_take);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="text-center py-12 lg:py-16 px-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 mb-5">
          <Radio className="w-3.5 h-3.5 text-destructive animate-pulse" />
          <span className="text-xs font-mono tracking-wider text-destructive uppercase">
            Live Intelligence Feed
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          The Daily Grind
        </h1>
        <p className="text-base text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
          Every story about work that matters — with Jackye's Take on what it
          actually means for you. No algorithm. No filter. Just receipts.
        </p>

        {/* ── Subscribe bar ── */}
        {status === "success" ? (
          <div className="flex items-center justify-center gap-2.5 text-primary font-semibold text-base py-3">
            <Check className="w-5 h-5" /> You're in. First drop lands Monday.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div ref={containerRef} />
            <div className="flex items-center bg-card border-2 border-primary/20 focus-within:border-primary/50 transition-colors rounded-xl overflow-hidden">
              <Mail className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setStatus("idle");
                }}
                placeholder="you@company.com"
                className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                disabled={status === "loading"}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="mr-2 px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {status === "loading" ? (
                  "..."
                ) : (
                  <>
                    Subscribe <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
            {status === "error" && (
              <p className="text-destructive text-xs mt-2 font-mono">{errorMsg}</p>
            )}
          </form>
        )}
        <p className="text-xs text-muted-foreground/60 mt-3">
          Free forever. One email per week. No spam.
        </p>
      </section>

      {/* ── Filter bar ── */}
      <section className="max-w-5xl mx-auto px-4 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono tracking-wider border transition-all whitespace-nowrap ${
                filter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border/40 hover:border-primary/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="ml-auto text-xs text-muted-foreground/50 font-mono whitespace-nowrap">
            {filtered.length} stories
          </div>
        </div>
      </section>

      {/* ── Feed ── */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-mono">Loading intelligence...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No stories in this category yet.</p>
          </div>
        ) : (
          <>
            {/* Stories with Jackye's Take — shown first as featured */}
            {withTakes.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-mono tracking-[0.15em] uppercase text-primary">
                    Jackye's Takes
                  </h2>
                  <span className="text-[10px] text-muted-foreground/60 font-mono ml-1">
                    {withTakes.length} stories with takes
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {withTakes.map((article) => (
                    <StoryCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}

            {/* All other stories — summary teasers */}
            {withoutTakes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-mono tracking-[0.15em] uppercase text-muted-foreground">
                    The Wire
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {withoutTakes.map((article) => {
                    const cat = getCategoryConfig(article.category);
                    return (
                      <a
                        key={article.id}
                        href={article.source_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block"
                      >
                        <div className="rounded-xl border border-border/30 bg-card p-4 hover:border-primary/30 transition-all h-full flex flex-col">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono tracking-wider border ${cat.color}`}
                            >
                              {cat.label}
                            </Badge>
                            {article.is_controversy && (
                              <AlertTriangle className="w-3 h-3 text-destructive" />
                            )}
                            <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">
                              {timeAgo(article.published_at)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground leading-snug flex-1 group-hover:text-primary transition-colors">
                            {article.headline}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
                            <span className="text-[10px] text-muted-foreground">
                              {article.source_name || "Source"}
                            </span>
                            <SpiceMeter level={spiceLevel(article)} />
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Bottom CTA ── */}
      <section className="text-center py-10 px-4 border-t border-border/30">
        <p className="text-muted-foreground text-sm mb-3">
          The tea, served daily. No algorithms. No ads. Just receipts.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            variant="outline"
            size="sm"
          >
            <Mail className="w-4 h-4 mr-2" /> Subscribe
          </Button>
          <Link to="/receipts">
            <Button variant="ghost" size="sm">
              All Receipts <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
