import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useReceiptsFeed, ReceiptArticle } from "@/hooks/use-receipts-feed";
import { useDailyWrap } from "@/hooks/use-signal-stories";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import { FoundingMemberBadge } from "@/components/FoundingMemberBadge";
import { EnforcementReceiptsTicker } from "@/components/work-signal/EnforcementReceiptsTicker";
import { SourceBiasKey } from "@/components/work-signal/SourceBiasKey";
import { getSourceBiasKey } from "@/components/receipts/BiasBar";
import { CoverageBiasBar } from "@/components/receipts/CoverageBiasBar";
import { EDITORIAL_CATEGORIES, EDITORIAL_CAT_COLORS } from "@/components/receipts/heat-config";
import { PosterLightbox } from "@/components/receipts/PosterLightbox";
import { FloatingBubble } from "@/components/receipts/FloatingBubble";
import { SharePastiche } from "@/components/receipts/SharePastiche";
import { format } from "date-fns";
import workSignalLogo from "@/assets/work-signal-logo.png";
import {
  Mail, ArrowRight, Check, ExternalLink, Newspaper,
  Radio, TrendingUp, Award, Search, Crown,
} from "lucide-react";

/* ── Category badge ── */
function CategoryBadge({ category }: { category: string | null }) {
  const editorialCat = EDITORIAL_CATEGORIES[category ?? ""] || "THE DAILY GRIND";
  const color = EDITORIAL_CAT_COLORS[editorialCat] || "#94A3B8";
  return (
    <span
      className="text-[10px] font-black uppercase tracking-[0.15em] font-mono"
      style={{ color }}
    >
      {editorialCat}
    </span>
  );
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

/* ── Filter + Sort options ── */
const FILTER_OPTIONS = [
  { value: "all", label: "All Stories" },
  { value: "layoffs", label: "Layoffs" },
  { value: "worker_rights", label: "DEI & Rights" },
  { value: "ai_workplace", label: "AI & Work" },
  { value: "regulation", label: "Regulation" },
  { value: "pay_equity", label: "Pay Equity" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Latest" },
  { value: "hottest", label: "Most Covered" },
  { value: "drama", label: "Highest Heat" },
];

/* ── Poster pool: vintage 1950s ad posters per category ── */
// Poster images served from /public/posters/ in the build output
const CDN = "/posters";
const POSTER_POOL: Record<string, string[]> = {
  ai_workplace: [`${CDN}/poster-fewer-humans.jpg`, `${CDN}/poster-ai-handshake.jpg`, `${CDN}/poster-ai-screening.jpg`, `${CDN}/poster-tech-stack.jpg`, `${CDN}/poster-robot-helper.jpg`, `${CDN}/poster-surveillance.jpg`],
  tech_stack: [`${CDN}/poster-tech-stack.jpg`, `${CDN}/poster-robot-helper.jpg`, `${CDN}/poster-ai-screening.jpg`, `${CDN}/poster-surveillance.jpg`],
  future_of_work: [`${CDN}/poster-smile-more.jpg`, `${CDN}/poster-wfh-reality.jpg`, `${CDN}/poster-open-office.jpg`, `${CDN}/poster-rto-commute.jpg`, `${CDN}/poster-water-cooler.jpg`],
  worker_rights: [`${CDN}/poster-dei-rollback.jpg`, `${CDN}/poster-the-handbook.jpg`, `${CDN}/poster-pay-scale.jpg`, `${CDN}/poster-boardroom.jpg`],
  regulation: [`${CDN}/poster-regulation.jpg`, `${CDN}/poster-fine-print.jpg`, `${CDN}/poster-legislation.jpg`],
  pay_equity: [`${CDN}/poster-pay-ratio.jpg`, `${CDN}/poster-ceo-lunch-v2.jpg`, `${CDN}/poster-pay-scale.jpg`, `${CDN}/poster-golden-parachute.jpg`],
  layoffs: [`${CDN}/poster-ghost-postings.jpg`, `${CDN}/poster-the-box.jpg`, `${CDN}/poster-the-pivot.jpg`, `${CDN}/poster-golden-parachute.jpg`],
  legislation: [`${CDN}/poster-legislation.jpg`, `${CDN}/poster-fine-print.jpg`, `${CDN}/poster-regulation.jpg`],
  labor_organizing: [`${CDN}/poster-labor.jpg`, `${CDN}/poster-open-office.jpg`, `${CDN}/poster-supply-chain.jpg`],
  daily_grind: [`${CDN}/poster-water-cooler.jpg`, `${CDN}/poster-rto-commute.jpg`, `${CDN}/poster-exit-interview.jpg`, `${CDN}/poster-smile-more.jpg`, `${CDN}/poster-surveillance.jpg`],
  c_suite: [`${CDN}/poster-golden-parachute.jpg`, `${CDN}/poster-boardroom.jpg`, `${CDN}/poster-follow-money.jpg`],
  fine_print: [`${CDN}/poster-fine-print.jpg`, `${CDN}/poster-regulation.jpg`, `${CDN}/poster-legislation.jpg`, `${CDN}/poster-the-handbook.jpg`],
  paycheck: [`${CDN}/poster-pay-ratio.jpg`, `${CDN}/poster-ceo-lunch-v2.jpg`, `${CDN}/poster-pay-scale.jpg`],
  general: [`${CDN}/poster-jackye-throne.jpg`, `${CDN}/poster-jackye-receipts.jpg`, `${CDN}/poster-jackye-broadcast.jpg`, `${CDN}/poster-follow-money.jpg`, `${CDN}/poster-exit-interview.jpg`, `${CDN}/poster-ghost-jobs.jpg`, `${CDN}/poster-water-cooler.jpg`, `${CDN}/poster-supply-chain.jpg`],
};
const ALL_POSTERS = [...new Set(Object.values(POSTER_POOL).flat())];

function getPosterForArticle(article: ReceiptArticle): string {
  const pool = POSTER_POOL[article.category ?? ""] || ALL_POSTERS;
  let h = 0;
  const s = article.headline || article.id || "";
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return pool[Math.abs(h) % pool.length];
}

/* ── Blind Spot Alert — Ground.news signature, top of poster ── */
function BlindSpotAlert({ sourceName }: { sourceName: string | null }) {
  const bias = getSourceBiasKey(sourceName);
  let alert: { side: string; color: string; icon: string } | null = null;
  if (bias === "left" || bias === "lean-left") {
    alert = { side: "RIGHT", color: "#EF4444", icon: "🔴" };
  } else if (bias === "right" || bias === "lean-right") {
    alert = { side: "LEFT", color: "#3B82F6", icon: "🔵" };
  }
  if (!alert) return null;
  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-1.5" style={{ background: `${alert.color}DD` }}>
      <span className="text-sm">{alert.icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white font-mono">
        BLIND SPOT — THE {alert.side} ISN'T COVERING THIS
      </span>
    </div>
  );
}

/* ── Deep Investigations ── */
const DEEP_INVESTIGATIONS = [
  { slug: "meta", name: "Meta", sector: "Big Tech", headline: "DEI team dissolved + massive WARN filings", date: "March 2026", spice: 5 },
  { slug: "google", name: "Google", sector: "Big Tech", headline: "11-year diversity report killed", date: "March 2026", spice: 4 },
  { slug: "amazon", name: "Amazon", sector: "Big Tech", headline: "14K HR staff cut + 4,085 WARN notices", date: "March 2026", spice: 5 },
  { slug: "boeing", name: "Boeing", sector: "Defense", headline: "Representation goals scrapped + safety lawsuits", date: "March 2026", spice: 4 },
  { slug: "att", name: "AT&T", sector: "Telecom", headline: "Publicly declared DEI doesn't exist", date: "March 2026", spice: 5 },
];

/* ══════════════════════════════════════════
   GROUND NEWS-STYLE STORY CARD
   Compact: thumbnail + headline + bias bar
   ══════════════════════════════════════════ */
function StoryCard({ article, onPosterClick }: { article: ReceiptArticle; onPosterClick: (a: ReceiptArticle) => void }) {
  return (
    <article
      id={`story-${article.id}`}
      className="rounded-xl border border-border/40 bg-card hover:border-primary/30 transition-all group overflow-hidden scroll-mt-24 flex flex-col"
    >
      {/* ── TOPIC POSTER: vintage bg + headline + Jackye's one-liner ── */}
      <div
        className="relative w-full aspect-[4/5] overflow-hidden bg-muted/30 cursor-pointer"
        onClick={() => onPosterClick(article)}
        style={{
          backgroundImage: `url(${article.poster_url || getPosterForArticle(article)})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Dark gradient so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Blind Spot Alert — TOP */}
        <BlindSpotAlert sourceName={article.source_name} />

        {/* Category stamp — top right */}
        <div className="absolute top-2 right-2 z-10">
          <CategoryBadge category={article.category} />
        </div>

        {/* Content overlay — bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          {/* Headline */}
          <h3 className="text-white text-sm font-black leading-snug line-clamp-3" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            {article.source_url ? (
              <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-white no-underline hover:text-primary transition-colors">
                {article.headline}
              </a>
            ) : article.headline}
          </h3>

          {/* Jackye's Take — FIRST SENTENCE ONLY, punchy */}
          {article.jackye_take && (
            <p className="text-primary/90 text-xs font-bold mt-2 line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              👑 {article.jackye_take.split(/(?<=[.!?])\s/)[0]}
            </p>
          )}
        </div>

        {/* Brand strip — bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#0A0A0E]/90 flex items-center px-2 z-20">
          <span className="text-[9px] font-bold text-primary font-mono tracking-wider">W?</span>
          <span className="text-[8px] text-[#F0EBE0]/60 font-mono ml-1.5">WhoDoIWorkFor.com</span>
          <span className="text-[8px] text-[#F0EBE0]/40 font-mono ml-auto">by Jackye Clayton</span>
        </div>
      </div>

      {/* Content — bias bar + company link + source + share */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Coverage Bias Bar */}
        <div className="mb-2">
          <CoverageBiasBar sourceName={article.source_name} coverage={article.coverage} />
        </div>

        {/* Pull the receipts — link to company on WDIWF */}
        <a
          href={`/check?q=${encodeURIComponent(article.headline.split(/\s+/).slice(0, 3).join(" "))}`}
          className="text-[10px] font-bold text-primary hover:text-primary/80 font-mono uppercase tracking-wider mb-2 no-underline"
        >
          Pull the receipts →
        </a>

        {/* Source + time + share footer */}
        <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-border/20">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-foreground/60 font-mono uppercase tracking-widest truncate">
              {article.source_name || "Source"}
            </span>
            <span className="text-[9px] text-muted-foreground/40">·</span>
            <span className="text-[9px] text-muted-foreground/50 font-mono">{timeAgo(article.published_at)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SharePastiche headline={article.headline} articleId={article.id} />
            {article.source_url && (
              <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-[10px] font-mono text-primary hover:text-primary/80 transition-colors no-underline">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* SR-only for SEO */}
      <div className="sr-only" aria-hidden="true">
        <p>Headline: {article.headline}</p>
        {article.jackye_take && <p>Jackye's Take: {article.jackye_take}</p>}
        {article.receipt_connection && <p>Receipt: {article.receipt_connection}</p>}
        {article.why_it_matters?.map((p, i) => <p key={i}>Why It Matters: {p}</p>)}
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════
   LEAD STORY — hero card, wider
   ══════════════════════════════════════════ */
function LeadStoryCard({ article, onPosterClick }: { article: ReceiptArticle; onPosterClick: (a: ReceiptArticle) => void }) {
  return (
    <article
      id={`story-${article.id}`}
      className="rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 transition-all group scroll-mt-24 col-span-full"
    >
      <div className="grid md:grid-cols-[1.2fr_1fr] gap-0">
        {/* ── LEAD POSTER: vintage bg + headline + Jackye's voice ── */}
        <div
          className="relative w-full aspect-[16/10] md:aspect-auto overflow-hidden bg-muted/30 cursor-pointer"
          onClick={() => onPosterClick(article)}
          style={{
            backgroundImage: `url(${article.poster_url || getPosterForArticle(article)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

          {/* Blind Spot Alert */}
          <BlindSpotAlert sourceName={article.source_name} />

          {/* Category — top right */}
          <div className="absolute top-3 right-3 z-10">
            <CategoryBadge category={article.category} />
          </div>

          {/* Headline overlay — bigger for lead */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <h2 className="text-white text-xl md:text-2xl font-black leading-tight line-clamp-3" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
              {article.headline}
            </h2>
            {article.jackye_take && (
              <p className="text-white/80 text-sm italic mt-2 line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                👑 "{article.jackye_take}"
              </p>
            )}
          </div>

          <span className="absolute bottom-2 right-3 text-[9px] text-white/30 font-mono z-10">
            WhoDoIWorkFor.com
          </span>
        </div>

        {/* Right: content */}
        <div className="p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <CategoryBadge category={article.category} />
            <span className="text-[10px] text-muted-foreground/50 font-mono ml-auto">{timeAgo(article.published_at)}</span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-foreground leading-tight mb-4 group-hover:text-primary transition-colors">
            {article.source_url ? (
              <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                className="no-underline text-foreground group-hover:text-primary">
                {article.headline}
                <ExternalLink className="w-4 h-4 inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity align-middle" />
              </a>
            ) : article.headline}
          </h2>

          {article.jackye_take && (
            <div className="flex items-start gap-2 mb-4 py-3 px-3 rounded-lg" style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.12)" }}>
              <Crown className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-primary tracking-[0.12em] uppercase font-mono">Jackye's Take</span>
                <p className="text-sm text-foreground/85 leading-relaxed italic mt-1">
                  "{article.jackye_take}"
                </p>
              </div>
            </div>
          )}

          <div className="mt-auto">
            <CoverageBiasBar sourceName={article.source_name} coverage={article.coverage} />
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/20">
              <span className="text-[11px] font-medium text-foreground/60 font-mono">{article.source_name || "Source"}</span>
              <div className="flex items-center gap-2">
                <SharePastiche headline={article.headline} articleId={article.id} />
                {article.source_url && (
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary/80 transition-colors no-underline">
                    Full story <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE — THE WORK SIGNAL (Ground News vibe)
   ══════════════════════════════════════════ */
const PAGE_SIZE = 12;

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBadge, setShowBadge] = useState(false);
  const [lightboxArticle, setLightboxArticle] = useState<ReceiptArticle | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { user } = useAuth();
  const { containerRef, getToken, resetToken } = useTurnstile();
  const { data: articles = [], isLoading } = useReceiptsFeed();
  const { data: dailyWrap } = useDailyWrap();
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
    title: "The Work Signal by Jackye Clayton — Who Do I Work For?",
    description: "We pull stories from across the political spectrum so you see the full picture. Every source is tagged for lean. WDIWF always gives you the centrist, evidence-first view. By Jackye Clayton.",
    image: "https://wdiwf.jackyeclayton.com/posters/poster-jackye-throne.jpg",
    path: "/newsletter",
    jsonLd: {
      "@type": "WebPage",
      name: "The Work Signal — Live Intelligence Feed",
      description: "Real-time employer intelligence feed by Who Do I Work For? Sourced from public records and investigative research.",
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
      .insert({ email: trimmed, source: "work_signal_page" } as any);
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

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filter, sortBy, searchQuery]);

  const filtered = useMemo(() => {
    let list = [...articles];
    if (filter !== "all") list = list.filter((a) => a.category === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.headline.toLowerCase().includes(q) ||
          (a.source_name?.toLowerCase().includes(q) ?? false) ||
          (a.category?.toLowerCase().includes(q) ?? false) ||
          a.jackye_take.toLowerCase().includes(q) ||
          a.receipt_connection.toLowerCase().includes(q)
      );
    }
    if (sortBy === "hottest") {
      list.sort((a, b) => b.spice_level - a.spice_level);
    } else if (sortBy === "drama") {
      list.sort((a, b) => {
        const aDrama = b.spice_level * 20 + (b.is_controversy ? 10 : 0);
        const bDrama = a.spice_level * 20 + (a.is_controversy ? 10 : 0);
        return aDrama - bDrama;
      });
    } else {
      list.sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
    }
    return list;
  }, [articles, filter, sortBy, searchQuery]);

  const leadStory = filtered[0];
  const restStories = filtered.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Live Ticker ── */}
      <EnforcementReceiptsTicker />

      {/* ── Compact Masthead (Ground News style) ── */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={workSignalLogo} alt="The Work Signal" width={36} height={36} className="rounded-lg" />
              <div>
                <h1 className="text-xl font-black text-foreground tracking-tight leading-none">
                  The Work Signal
                </h1>
                <p className="text-[11px] text-muted-foreground font-mono tracking-wide mt-0.5">
                  by Jackye Clayton × WDIWF
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:ml-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20">
                <Radio className="w-3 h-3 text-destructive animate-pulse" />
                <span className="text-[10px] font-mono tracking-wider text-destructive uppercase">Live</span>
              </div>
              <span className="text-[10px] text-muted-foreground/60 font-mono">Updated every 2h</span>
            </div>

            {/* Subscribe inline */}
            <div className="sm:ml-auto flex items-center gap-2">
              {status === "success" ? (
                <span className="flex items-center gap-1.5 text-primary text-sm font-semibold">
                  <Check className="w-4 h-4" /> Subscribed
                </span>
              ) : (
                <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
                  <div ref={containerRef} />
                  <div className="flex items-center bg-background border border-border/60 rounded-lg overflow-hidden">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground ml-2.5 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                      placeholder="you@company.com"
                      className="bg-transparent px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none w-40"
                      disabled={status === "loading"}
                    />
                    <button type="submit" disabled={status === "loading"}
                      className="px-3 py-2 bg-primary text-primary-foreground font-bold text-xs hover:brightness-110 transition-all shrink-0">
                      {status === "loading" ? "..." : "Subscribe"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
          {status === "error" && (
            <p className="text-destructive text-xs mt-2 font-mono text-center sm:text-left">{errorMsg}</p>
          )}
        </div>
      </header>

      {/* Source Bias Key — "How We Read the News" */}
      <SourceBiasKey />

      {/* ── Filter/Sort Bar (sticky) ── */}
      <nav className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-20">
        <div className="max-w-6xl mx-auto px-4 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {FILTER_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono tracking-wider border transition-all whitespace-nowrap ${
                  filter === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border/40 hover:border-primary/40 hover:text-foreground"
                }`}>
                {opt.label}
              </button>
            ))}

            <span className="w-px h-4 bg-border/50 mx-1 shrink-0" />

            {SORT_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setSortBy(opt.value)}
                className={`text-xs font-mono uppercase tracking-wider px-2 py-1 rounded transition-colors whitespace-nowrap ${
                  sortBy === opt.value
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {opt.label}
              </button>
            ))}

            <span className="w-px h-4 bg-border/50 mx-1 shrink-0" />

            <div className="relative flex items-center shrink-0">
              <Search className="w-3 h-3 text-muted-foreground absolute left-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-card border border-border/40 rounded-lg pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 w-32 transition-all"
              />
            </div>

            <span className="ml-auto text-xs text-muted-foreground/50 font-mono whitespace-nowrap shrink-0">
              {filtered.length > 50 ? "50+" : filtered.length} stories
            </span>
          </div>
        </div>
      </nav>

      {/* ── Founding Member ── */}
      {user && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <button onClick={() => setShowBadge(true)}
            className="w-full rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 hover:border-primary/40 transition-all p-3 flex items-center gap-3 group cursor-pointer">
            <Award className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground">Founding Member 🎖️</span>
            <span className="text-xs text-muted-foreground ml-auto">Download badge →</span>
          </button>
        </div>
      )}
      {showBadge && (
        <FoundingMemberBadge memberName={user?.email?.split("@")[0]} joinedDate={user?.created_at} onClose={() => setShowBadge(false)} />
      )}

      {/* ── Daily Wrap (if available) ── */}
      {dailyWrap && filter === "all" && sortBy === "newest" && !searchQuery && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-5">
            <div className="flex items-baseline gap-3 mb-2">
              <h2 className="text-base font-bold text-foreground">{dailyWrap.title}</h2>
              <span className="text-[11px] text-muted-foreground font-mono">
                {format(new Date(dailyWrap.wrap_date), "MMM d, yyyy")}
              </span>
            </div>
            {dailyWrap.intro && (
              <p className="text-sm text-foreground/80 leading-relaxed">{dailyWrap.intro}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Main Feed Grid (Ground News style) ── */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-mono">Loading intelligence...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No stories match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Lead Story spans full width on first load */}
            {leadStory && filter === "all" && sortBy === "newest" && !searchQuery && (
              <LeadStoryCard article={leadStory} onPosterClick={setLightboxArticle} />
            )}

            {/* Rest of stories in compact grid */}
            {(filter === "all" && sortBy === "newest" && !searchQuery ? restStories : filtered)
              .slice(0, visibleCount)
              .map((article) => (
                <StoryCard key={article.id} article={article} onPosterClick={setLightboxArticle} />
              ))}
          </div>
        )}

        {/* Load More */}
        {visibleCount < filtered.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="px-8 py-3 border border-border rounded-xl text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-all font-mono tracking-wider"
            >
              Load More Stories
            </button>
          </div>
        )}
      </main>

      {/* ── Deep Investigations ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-t border-border">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm font-mono uppercase tracking-[0.2em] text-primary">Deep Investigations</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DEEP_INVESTIGATIONS.map((inv) => (
            <Link
              key={inv.slug}
              to={`/receipts/${inv.slug}`}
              className="block p-4 bg-card border border-border/40 rounded-xl hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground font-mono">{inv.sector}</span>
                <span className="text-xs text-muted-foreground font-mono">{inv.date}</span>
              </div>
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{inv.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{inv.headline}</p>
              <span className="flex items-center gap-1 mt-2 text-xs font-bold text-primary">
                Read report <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-4 text-center">
        <p className="text-sm text-foreground/60 tracking-[0.1em] font-mono">
          The Work Signal · <em>by Jackye Clayton 👑 × WDIWF</em>
        </p>
        <p className="text-xs text-foreground/40 mt-1.5 italic">
          "Every company runs a background check on you. WDIWF runs one on them."
        </p>
        <div className="flex justify-center gap-6 mt-3">
          <Link to="/" className="text-xs text-muted-foreground font-mono hover:text-primary transition-colors no-underline">
            Home
          </Link>
          <Link to="/submit-tip" className="text-xs text-muted-foreground font-mono hover:text-primary transition-colors no-underline">
            Submit a tip
          </Link>
        </div>
      </footer>

      <FloatingBubble />
      <PosterLightbox article={lightboxArticle} onClose={() => setLightboxArticle(null)} />
    </div>
  );
}
