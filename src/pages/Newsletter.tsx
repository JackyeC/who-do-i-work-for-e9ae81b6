import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useWorkNews, WorkNewsArticle } from "@/hooks/use-work-news";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import { FoundingMemberBadge } from "@/components/FoundingMemberBadge";
import { WorkNewsTicker } from "@/components/news/WorkNewsTicker";
import { getSourceProfile, getBiasColor } from "@/lib/source-bias-map";
import { motion } from "framer-motion";
import {
  Mail, ArrowRight, Check, ExternalLink, Newspaper,
  AlertTriangle, Flame, Radio, Eye, TrendingUp,
  Award, Clock, Zap,
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

const WHY_IT_MATTERS: Record<string, string[]> = {
  regulation: [
    "Regulatory shifts can change hiring practices, benefits, and workplace rights overnight.",
    "If enforcement is increasing, employers may adjust policies — watch for changes in offer letters and handbooks.",
  ],
  future_of_work: [
    "Remote, hybrid, and RTO policies directly impact your daily life, commute costs, and work-life balance.",
    "Companies signaling flexibility changes may also be restructuring teams — worth monitoring.",
  ],
  ai_workplace: [
    "AI tools in hiring and management can introduce bias, reduce transparency, and change job requirements.",
    "Knowing which employers use automated decision-making helps you ask the right questions in interviews.",
  ],
  layoffs: [
    "Mass layoffs signal financial instability and may affect remaining employees' workloads and morale.",
    "WARN Act filings are public — you can verify claims before accepting an offer.",
  ],
  pay_equity: [
    "Pay transparency laws are expanding — knowing where your offer sits relative to the range is leverage.",
    "Companies under pay equity scrutiny may be adjusting bands. Ask about methodology.",
  ],
  labor_organizing: [
    "Union activity and collective bargaining outcomes set precedents that affect non-union workers too.",
    "Employer responses to organizing efforts reveal how leadership views worker voice.",
  ],
  worker_rights: [
    "Changes to worker protections directly affect your rights on the job — from breaks to benefits.",
    "Court rulings and policy changes can shift the balance of power between employers and workers.",
  ],
  legislation: [
    "New legislation can redefine employment classifications, benefits requirements, and workplace safety standards.",
    "Tracking bills in motion helps you anticipate changes before they hit your workplace.",
  ],
  general: [
    "Workplace trends shape the environment you're applying into — context matters.",
    "Understanding the landscape helps you ask better questions and make informed career decisions.",
  ],
};

function getWhyItMatters(category: string, isControversy: boolean): string[] {
  const base = WHY_IT_MATTERS[category] || WHY_IT_MATTERS.general;
  if (isControversy) {
    return [...base, "Controversy signals are worth verifying — check the source links below before forming conclusions."];
  }
  return base;
}

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
        <span key={i} className={i < level ? "opacity-100" : "opacity-20"}>🌶️</span>
      ))}
    </span>
  );
}

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "layoffs", label: "Layoffs" },
  { value: "dei", label: "DEI" },
  { value: "ai_workplace", label: "AI" },
  { value: "regulation", label: "Regulation" },
  { value: "pay_equity", label: "Pay" },
  { value: "controversy", label: "🔥 Controversy" },
];

/* ── Lead Story Card ── */
function LeadStory({ article }: { article: WorkNewsArticle }) {
  const cat = getCategoryConfig(article.category);
  const spice = spiceLevel(article);
  const sourceProfile = article.source_name ? getSourceProfile(article.source_name) : null;
  const biasColor = sourceProfile ? getBiasColor(sourceProfile.bias) : "";
  const whyMatters = getWhyItMatters(article.category, article.is_controversy);

  return (
    <article id={`story-${article.id}`} className="rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 transition-all group scroll-mt-24">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
      <div className="p-8 lg:p-10">
        <div className="flex items-center gap-3 mb-5">
          <Badge variant="outline" className={`text-[10px] font-mono tracking-wider border ${cat.color}`}>
            {cat.label}
          </Badge>
          {article.is_controversy && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-destructive">
              <AlertTriangle className="w-3 h-3 animate-pulse" /> CONTROVERSY
            </span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono">{timeAgo(article.published_at)}</span>
        </div>

        <h2 className="text-foreground leading-[1.08] mb-6 group-hover:text-primary transition-colors font-black uppercase tracking-[-0.03em]"
          style={{ fontSize: "clamp(26px, 3vw, 42px)" }}>
          {article.headline}
        </h2>

        {/* Jackye's Take */}
        {article.jackye_take && (
          <div className="rounded-xl bg-primary/5 border border-primary/15 p-6 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary tracking-[0.15em] uppercase font-mono">Jackye's Take</span>
            </div>
            <p className="text-lg text-foreground leading-[1.8] italic font-light">
              "{article.jackye_take}"
            </p>
          </div>
        )}

        {/* Why This Matters */}
        <div className="rounded-lg bg-muted/30 border border-border/30 p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary tracking-[0.15em] uppercase font-mono">Why This Matters for You</span>
          </div>
          <ul className="space-y-2.5">
            {whyMatters.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-base text-foreground/80 leading-relaxed">
                <span className="text-primary mt-1 shrink-0">·</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/20">
          <div className="flex items-center gap-3">
            {article.source_name && (
              <span className={`text-sm font-medium ${biasColor || "text-foreground/70"}`}>{article.source_name}</span>
            )}
            <SpiceMeter level={spice} />
          </div>
          {article.source_url && (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80 transition-colors">
              Read Source <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ── Standard Story Card ── */
function StoryCard({ article }: { article: WorkNewsArticle }) {
  const cat = getCategoryConfig(article.category);
  const spice = spiceLevel(article);
  const sourceProfile = article.source_name ? getSourceProfile(article.source_name) : null;
  const biasColor = sourceProfile ? getBiasColor(sourceProfile.bias) : "";
  const whyMatters = getWhyItMatters(article.category, article.is_controversy);

  return (
    <article id={`story-${article.id}`} className="rounded-xl border border-border/40 bg-card hover:border-primary/30 transition-all group overflow-hidden scroll-mt-24">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className={`text-[10px] font-mono tracking-wider border ${cat.color}`}>
            {cat.label}
          </Badge>
          {article.is_controversy && <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />}
          <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono">{timeAgo(article.published_at)}</span>
        </div>

        <h3 className="text-lg font-bold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors">
          {article.headline}
        </h3>

        {article.jackye_take && (
          <div className="rounded-lg bg-primary/5 border border-primary/15 p-4 mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold text-primary tracking-[0.15em] uppercase font-mono">The Take</span>
            </div>
            <p className="text-base text-foreground leading-relaxed">{article.jackye_take}</p>
          </div>
        )}

        <div className="rounded-lg bg-muted/20 border border-border/20 p-4 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold text-primary tracking-[0.15em] uppercase font-mono">Why This Matters</span>
          </div>
          <ul className="space-y-1.5">
            {whyMatters.slice(0, 2).map((point, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-sm text-foreground/80 leading-relaxed">
                <span className="text-primary mt-0.5 shrink-0">·</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {article.themes && article.themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.themes.map((theme) => (
              <span key={theme} className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted/50 text-xs text-foreground/60 font-mono">
                {theme}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border/20">
          <div className="flex items-center gap-3">
            {article.source_name && (
              <span className={`text-sm font-medium ${biasColor || "text-foreground/70"}`}>{article.source_name}</span>
            )}
            <SpiceMeter level={spice} />
          </div>
          {article.source_url && (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80 transition-colors">
              Source <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ── Wire Item (compact) ── */
function WireItem({ article }: { article: WorkNewsArticle }) {
  const cat = getCategoryConfig(article.category);
  const whyMatters = getWhyItMatters(article.category, article.is_controversy);
  return (
    <div id={`story-${article.id}`} className="group block scroll-mt-24">
      <div className="rounded-lg border border-border/30 bg-card p-4 hover:border-primary/30 transition-all h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={`text-[10px] font-mono tracking-wider border ${cat.color}`}>
            {cat.label}
          </Badge>
          {article.is_controversy && <AlertTriangle className="w-3 h-3 text-destructive" />}
          <span className="ml-auto text-xs text-foreground/50 font-mono">{timeAgo(article.published_at)}</span>
        </div>
        <p className="text-base font-semibold text-foreground leading-snug flex-1 group-hover:text-primary transition-colors mb-2">
          {article.headline}
        </p>
        <p className="text-sm text-foreground/70 leading-relaxed mb-2">
          {whyMatters[0]}
        </p>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/20">
          {article.source_url ? (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-primary/70 hover:text-primary font-mono flex items-center gap-1">
              {article.source_name || "Source"} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ) : (
            <span className="text-[10px] text-muted-foreground">{article.source_name || "Source"}</span>
          )}
          <SpiceMeter level={spiceLevel(article)} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════ */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [showBadge, setShowBadge] = useState(false);
  const { user } = useAuth();
  const { containerRef, getToken, resetToken } = useTurnstile();
  const { data: articles = [], isLoading } = useWorkNews(60);
  const location = useLocation();

  useEffect(() => {
    if (location.hash && !isLoading) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [location.hash, isLoading]);

  usePageSEO({
    title: "The Receipts — Live Work Intelligence Feed | Who Do I Work For?",
    description: "Live employer intelligence: layoffs, DEI rollbacks, AI workplace moves, pay equity, and WARN filings — with Jackye's Take on every story.",
    path: "/newsletter",
    jsonLd: {
      "@type": "WebPage",
      name: "The Receipts — Live Intelligence Feed",
      description: "Real-time employer intelligence feed by Who Do I Work For? Sourced from public records, GDELT, and investigative research.",
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

  const filtered = filter === "all"
    ? articles
    : filter === "controversy"
      ? articles.filter((a) => a.is_controversy)
      : articles.filter((a) => a.category === filter);

  const movingNow = useMemo(() => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    return articles.filter((a) => a.published_at && new Date(a.published_at).getTime() >= twoHoursAgo).slice(0, 3);
  }, [articles]);

  const currentTake = useMemo(() => {
    return articles.find((a) => a.jackye_take);
  }, [articles]);

  const withTakes = filtered.filter((a) => a.jackye_take);
  const withoutTakes = filtered.filter((a) => !a.jackye_take);

  const hotStories = useMemo(() => {
    return [...articles]
      .sort((a, b) => spiceLevel(b) - spiceLevel(a))
      .slice(0, 5);
  }, [articles]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Live Ticker ── */}
      <WorkNewsTicker />

      {/* ── Masthead ── */}
      <header className="border-b border-border">
        <div className="max-w-[820px] mx-auto text-center py-14 lg:py-20 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 mb-8">
            <Radio className="w-3.5 h-3.5 text-destructive animate-pulse" />
            <span className="text-[10px] font-mono tracking-[0.2em] text-destructive uppercase">Live Intelligence · Updated Every 2 Hours</span>
          </div>

          <p className="text-[10px] uppercase tracking-[0.55em] text-primary mb-5 font-mono">JRC EDIT × WDIWF</p>
          
          <h1 className="font-black text-foreground leading-none uppercase tracking-[-0.04em]"
            style={{ fontSize: "clamp(48px, 7vw, 88px)" }}>
            The Receipts
          </h1>
          
          <p className="font-light text-muted-foreground mt-5 tracking-wide" style={{ fontSize: "clamp(18px, 2vw, 26px)" }}>
            The world of work. Documented.
          </p>
          <p className="text-sm text-foreground/80 mt-4 max-w-md mx-auto leading-relaxed">
            Every satisfactory headline has a labor signal underneath it.{" "}
            <span className="text-primary font-semibold">This is the part they hoped you wouldn't read.</span>
          </p>

          <div className="w-16 h-[2px] bg-primary mx-auto my-8" />

          {/* ── Subscribe Bar ── */}
          <div className="mt-8 mb-4">
            {status === "success" ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2.5 text-primary font-semibold text-base py-4">
                <Check className="w-5 h-5" /> You're in. First drop lands Monday.
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="relative group max-w-[480px] mx-auto">
                <div ref={containerRef} />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-md rounded-xl" />
                <div className="relative flex items-center bg-card/80 backdrop-blur-sm border border-primary/20 focus-within:border-primary/50 transition-all duration-300 rounded-xl">
                  <Mail className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                    placeholder="you@company.com"
                    className="flex-1 bg-transparent px-3 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                    disabled={status === "loading"}
                  />
                  <button type="submit" disabled={status === "loading"}
                    className="mr-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0">
                    {status === "loading" ? "..." : <>Subscribe <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
                {status === "error" && (
                  <p className="text-destructive text-xs mt-3 font-mono">{errorMsg}</p>
                )}
              </form>
            )}
            <p className="text-xs text-muted-foreground/60 mt-4">Free forever. One email per week. No spam.</p>
          </div>

          <p className="text-sm text-muted-foreground tracking-[0.12em] font-mono">
            Jackye Clayton 👑 × WDIWF
            <span className="mx-2.5 text-border">·</span>
            <span className="italic">"Stop applying. Start aligning."</span>
          </p>
        </div>
      </header>

      {/* ── Founding Member CTA ── */}
      {user && (
        <section className="max-w-5xl mx-auto px-4 py-4">
          <button onClick={() => setShowBadge(true)}
            className="w-full rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 hover:border-primary/40 transition-all p-4 flex items-center gap-4 group cursor-pointer">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">You're a Founding Member 🎖️</p>
              <p className="text-xs text-muted-foreground">Download your badge and share it on LinkedIn.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>
        </section>
      )}
      {showBadge && (
        <FoundingMemberBadge memberName={user?.email?.split("@")[0]} joinedDate={user?.created_at} onClose={() => setShowBadge(false)} />
      )}

      {/* ── Moving Now ── */}
      {movingNow.length > 0 && (
        <section className="border-b border-border bg-destructive/[0.03]">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-destructive" />
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-destructive font-bold">Moving Now</span>
              <Clock className="w-3 h-3 text-muted-foreground/50 ml-1" />
              <span className="text-[10px] text-muted-foreground/50 font-mono">Last 2 hours</span>
            </div>
            <div className="space-y-2">
              {movingNow.map((article) => (
                <button key={article.id}
                  onClick={() => document.getElementById(`story-${article.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-card/50 transition-colors group w-full text-left">
                  <Badge variant="outline" className={`text-[9px] font-mono tracking-wider border shrink-0 ${getCategoryConfig(article.category).color}`}>
                    {getCategoryConfig(article.category).label}
                  </Badge>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate">
                    {article.headline}
                  </p>
                  <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">{timeAgo(article.published_at)}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Filter Bar ── */}
      <nav className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-20">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {FILTER_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setFilter(opt.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider border transition-all whitespace-nowrap ${
                  filter === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border/40 hover:border-primary/40 hover:text-foreground"
                }`}>
                {opt.label}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono whitespace-nowrap">
              {filtered.length} stories
            </span>
          </div>
        </div>
      </nav>

      {/* ── Main Content: Feed + Sidebar ── */}
      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 items-start">
        <main className="space-y-0">
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
              {/* ── Jackye's Current Take (pull quote) ── */}
              {currentTake && filter === "all" && (
                <div className="mb-10 rounded-xl border border-primary/20 bg-primary/[0.04] p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-xs font-mono tracking-[0.2em] uppercase text-primary font-bold">Jackye's Current Take</span>
                  </div>
                  <blockquote className="text-xl text-foreground leading-[1.8] italic border-l-2 border-primary pl-5 font-light">
                    "{currentTake.jackye_take}"
                  </blockquote>
                  <p className="text-sm text-foreground/60 mt-4">
                    Re: <span className="text-foreground/80 font-semibold">{currentTake.headline}</span>
                  </p>
                </div>
              )}

              {/* ── Lead Story ── */}
              {withTakes.length > 0 && (
                <div className="mb-10">
                  <LeadStory article={withTakes[0]} />
                </div>
              )}

              {/* ── Section Label: Jackye's Takes ── */}
              {withTakes.length > 1 && (
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Flame className="w-4 h-4 text-primary" />
                    <h2 className="text-xs font-mono tracking-[0.2em] uppercase text-primary font-bold">Jackye's Takes</h2>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground/50 font-mono">{withTakes.length - 1} more</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    {withTakes.slice(1).map((article) => (
                      <StoryCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Section Label: Quick Receipts / The Wire ── */}
              {withoutTakes.length > 0 && (
                <div className="flex items-center gap-4 my-10">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono font-bold">Quick Receipts</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {withoutTakes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground font-bold">All Signals</h2>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {withoutTakes.map((article) => (
                      <WireItem key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* ── Sidebar ── */}
        <aside className="hidden lg:block sticky top-[74px] space-y-6">
          {/* Newsletter CTA */}
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-[11px] uppercase tracking-[0.55em] text-primary mb-3 font-mono">Every Friday</p>
            <h3 className="text-xl font-black text-foreground mb-2 leading-tight tracking-tight">My Uncertainty Era</h3>
            <p className="text-sm text-foreground/70 leading-relaxed mb-4">
              The part where I say what everyone's thinking but nobody's saying.
            </p>
            <blockquote className="border-l-2 border-primary pl-3.5 mb-5">
              <p className="text-sm text-foreground/80 leading-relaxed italic font-light">
                "Every company has a 'people are our greatest asset' poster. Most hang next to a layoff plan."
              </p>
            </blockquote>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="block w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg text-center text-sm tracking-[0.08em] hover:brightness-110 transition-all">
              Subscribe → Free Forever
            </button>
          </div>

          {/* Hottest Takes */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-[11px] uppercase tracking-[0.55em] text-primary mb-3.5 font-mono">🔥 Hottest Right Now</p>
            {hotStories.slice(0, 4).map((article) => (
              <div key={article.id} className="pb-3 mb-3 border-b border-border last:border-none last:mb-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="outline" className={`text-[10px] font-mono tracking-wider border ${getCategoryConfig(article.category).color}`}>
                    {getCategoryConfig(article.category).label}
                  </Badge>
                  <span className="text-[10px] text-foreground/50 font-mono">{timeAgo(article.published_at)}</span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug">{article.headline}</p>
              </div>
            ))}
          </div>

          {/* What to Watch */}
          <div className="rounded-xl p-5 border" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.15)" }}>
            <p className="text-[11px] uppercase tracking-[0.55em] text-primary mb-3 font-mono">👀 What to Watch</p>
            <p className="text-sm text-foreground/70 leading-relaxed mb-3">
              Stories still developing. Patterns forming. Receipts being pulled.
            </p>
            <Link to="/receipts" className="text-sm text-primary font-mono hover:underline flex items-center gap-1">
              See all investigations <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>
      </div>

      {/* ── Bottom CTA ── */}
      <footer className="border-t border-border py-12 px-8 text-center">
        <p className="text-sm text-muted-foreground tracking-[0.1em] font-mono">
          The Receipts · <em>by Jackye Clayton 👑 × WDIWF</em>
        </p>
        <p className="text-sm text-muted-foreground mt-2 italic">
          "Every company runs a background check on you. WDIWF runs one on them."
        </p>
        <div className="flex justify-center gap-8 mt-4">
          <Link to="/" className="text-sm text-muted-foreground tracking-[0.1em] font-mono hover:text-primary transition-colors">
            wdiwf.jackyeclayton.com
          </Link>
          <Link to="/submit-tip" className="text-sm text-muted-foreground tracking-[0.1em] font-mono hover:text-primary transition-colors">
            Submit a tip
          </Link>
        </div>
      </footer>
    </div>
  );
}
