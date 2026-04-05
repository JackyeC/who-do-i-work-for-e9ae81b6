import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useReceiptsFeed, ReceiptArticle } from "@/hooks/use-receipts-feed";
import { useSignalStories, useDailyWrap } from "@/hooks/use-signal-stories";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import { FoundingMemberBadge } from "@/components/FoundingMemberBadge";
import { EnforcementReceiptsTicker } from "@/components/work-signal/EnforcementReceiptsTicker";
import { ReceiptPoster } from "@/components/receipts/ReceiptPoster";
import { SpicePeppers } from "@/components/receipts/SpicePeppers";
import { BiasBar, getSourceBiasKey } from "@/components/receipts/BiasBar";
import { EDITORIAL_CATEGORIES, EDITORIAL_CAT_COLORS } from "@/components/receipts/heat-config";
import { PosterLightbox } from "@/components/receipts/PosterLightbox";
import { FloatingBubble } from "@/components/receipts/FloatingBubble";
import { SignalStoryCard } from "@/components/work-signal/SignalStoryCard";
import { WireEditionHeader } from "@/components/receipts/WireEditionHeader";
import { EditorsNote } from "@/components/receipts/EditorsNote";
import { SharePastiche } from "@/components/receipts/SharePastiche";
import type { SignalStory, SignalCategory, HeatLevel } from "@/lib/work-signal-schema";
import { motion } from "framer-motion";
import { format } from "date-fns";
import workSignalLogo from "@/assets/work-signal-logo.png";
import {
  Mail, ArrowRight, Check, ExternalLink, Newspaper,
  Radio, Eye, TrendingUp, Award, Clock, Zap, Star, Search, Crown,
} from "lucide-react";

/* ── Adapt ReceiptArticle → SignalStory for poster cards ── */
function toSignalStory(a: ReceiptArticle): SignalStory {
  const catMap: Record<string, SignalCategory> = {
    layoffs: "c_suite",
    worker_rights: "fine_print",
    ai_workplace: "tech_stack",
    regulation: "fine_print",
    pay_equity: "paycheck",
    future_of_work: "daily_grind",
  };
  const heatMap = (s: number): HeatLevel =>
    s >= 4 ? "high" : s >= 2 ? "medium" : "low";

  return {
    id: a.id,
    company_name: null,
    category: catMap[a.category ?? ""] || "daily_grind",
    signal_type: "breaking",
    headline: a.headline,
    heat_level: heatMap(a.spice_level),
    source_name: a.source_name,
    source_url: a.source_url,
    receipt: a.receipt_connection || null,
    jrc_take: a.jackye_take || null,
    why_it_matters_applicants: a.why_it_matters?.[0] ?? null,
    why_it_matters_employees: a.why_it_matters?.[1] ?? null,
    why_it_matters_execs: null,
    before_you_say_yes: null,
    published_at: a.published_at ?? new Date().toISOString(),
    status: "live",
    created_at: a.created_at ?? new Date().toISOString(),
    updated_at: a.created_at ?? new Date().toISOString(),
  };
}

/* ── Category badge ── */
function CategoryBadge({ category }: { category: string | null }) {
  const editorialCat = EDITORIAL_CATEGORIES[category ?? ""] || "THE DAILY GRIND";
  const color = EDITORIAL_CAT_COLORS[editorialCat] || "#94A3B8";
  return (
    <span
      className="text-[10px] font-black uppercase tracking-[0.18em] font-mono"
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
  { value: "all", label: "All" },
  { value: "layoffs", label: "Layoffs" },
  { value: "worker_rights", label: "DEI" },
  { value: "ai_workplace", label: "AI" },
  { value: "regulation", label: "Regulation" },
  { value: "pay_equity", label: "Pay" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "hottest", label: "⭐ Hottest" },
  { value: "drama", label: "Drama" },
];

/* ── Deep Investigations ── */
const DEEP_INVESTIGATIONS = [
  { slug: "meta", name: "Meta", sector: "Big Tech", headline: "DEI team dissolved + massive WARN filings", date: "March 2026", spice: 5 },
  { slug: "google", name: "Google", sector: "Big Tech", headline: "11-year diversity report killed", date: "March 2026", spice: 4 },
  { slug: "amazon", name: "Amazon", sector: "Big Tech", headline: "14K HR staff cut + 4,085 WARN notices", date: "March 2026", spice: 5 },
  { slug: "boeing", name: "Boeing", sector: "Defense", headline: "Representation goals scrapped + safety lawsuits", date: "March 2026", spice: 4 },
  { slug: "att", name: "AT&T", sector: "Telecom", headline: "Publicly declared DEI doesn't exist", date: "March 2026", spice: 5 },
];

/* ══════════════════════════════════════════
   LEAD STORY CARD — full editorial treatment
   ══════════════════════════════════════════ */
function LeadStoryCard({ article, onPosterClick }: { article: ReceiptArticle; onPosterClick: (a: ReceiptArticle) => void }) {
  const biasKey = getSourceBiasKey(article.source_name);

  return (
    <article id={`story-${article.id}`} className="rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 transition-all group scroll-mt-24">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

      <div className="p-8 lg:p-10">
        {/* Meta row */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <CategoryBadge category={article.category} />
          <span className="w-px h-4 bg-border" />
          <SpicePeppers level={article.spice_level} big />
          {article.spice_level >= 4 && (
            <span className="text-xs font-black uppercase px-2.5 py-1 rounded" style={{ background: "#EF4444", color: "#fff" }}>HOT</span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono">{timeAgo(article.published_at)}</span>
        </div>

        {/* Poster — prominent, clickable */}
        <button type="button" onClick={() => onPosterClick(article)} className="mb-6 flex justify-center w-full bg-transparent border-none cursor-pointer p-0">
          <ReceiptPoster
            poster={article.poster_data}
            posterUrl={article.poster_url}
            category={article.category}
            big
            headline={article.headline}
            id={`poster-lead-${article.id}`}
          />
        </button>

        {/* Headline */}
        <h2
          className="text-foreground leading-[1.08] mb-6 font-black uppercase tracking-[-0.03em]"
          style={{ fontSize: "clamp(26px, 3vw, 42px)" }}
        >
          {article.source_url ? (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer"
              className="hover:text-primary transition-colors no-underline text-foreground group-hover:text-primary">
              {article.headline}
              <ExternalLink className="w-4 h-4 inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity align-middle" />
            </a>
          ) : article.headline}
        </h2>

        {/* Jackye's Take */}
        {article.jackye_take && (
          <div className="rounded-xl border p-6 mb-5" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.15)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary tracking-[0.15em] uppercase font-mono">Jackye's Take</span>
            </div>
            <p className="text-lg text-foreground leading-[1.8] italic font-light" style={{ fontFamily: "'DM Sans', cursive, sans-serif" }}>
              "{article.jackye_take}"
            </p>
          </div>
        )}

        {/* The Receipt */}
        {article.receipt_connection && (
          <div className="p-5 rounded-xl border mb-5" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.2)" }}>
            <p className="text-sm font-mono font-bold uppercase tracking-[0.12em] text-primary mb-3">🧾 The Receipt</p>
            <p className="text-base text-foreground/90 leading-relaxed">{article.receipt_connection}</p>
          </div>
        )}

        {/* Why It Matters */}
        <div className="rounded-lg bg-muted/30 border border-border/30 p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary tracking-[0.15em] uppercase font-mono">Why This Matters</span>
          </div>
          {article.why_it_matters && article.why_it_matters.length > 0 ? (
            <ul className="space-y-2">
              {article.why_it_matters.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-base text-foreground/80 leading-relaxed">
                  <span className="text-primary mt-1 shrink-0">·</span>
                  {point}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-foreground/80 leading-relaxed">
              {article.receipt_connection || article.jackye_take || "This story impacts how employers treat workers and how workers navigate their careers."}
            </p>
          )}
        </div>

        {/* Source + Bias + Share footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/20">
          <div className="flex items-center gap-3">
            {article.source_name && (
              <span className="text-sm font-medium text-foreground/70 font-mono">{article.source_name}</span>
            )}
            <BiasBar bias={biasKey} />
          </div>
          <div className="flex items-center gap-3">
            <SharePastiche headline={article.headline} articleId={article.id} />
            {article.source_url && (
              <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80 transition-colors no-underline">
                See the receipts <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* SR-only Direct Answer block for AI citation */}
      <div className="sr-only" aria-hidden="true">
        <p>Headline: {article.headline}</p>
        {article.jackye_take && <p>Jackye's Take: {article.jackye_take}</p>}
        {article.receipt_connection && <p>Receipt: {article.receipt_connection}</p>}
        {article.why_it_matters?.map((p, i) => <p key={i}>Why It Matters: {p}</p>)}
        {article.source_name && <p>Source: {article.source_name}</p>}
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════
   STORY CARD — standard editorial card
   ══════════════════════════════════════════ */
function StoryCard({ article, onPosterClick }: { article: ReceiptArticle; onPosterClick: (a: ReceiptArticle) => void }) {
  const biasKey = getSourceBiasKey(article.source_name);

  return (
    <article id={`story-${article.id}`} className="rounded-xl border border-border/40 bg-card hover:border-primary/30 transition-all group overflow-hidden scroll-mt-24">
      {/* Poster — compact, clickable */}
      <button type="button" onClick={() => onPosterClick(article)} className="flex justify-center pt-4 px-4 w-full bg-transparent border-none cursor-pointer p-0">
        <ReceiptPoster
          poster={article.poster_data}
          posterUrl={article.poster_url}
          category={article.category}
          headline={article.headline}
          id={`poster-card-${article.id}`}
        />
      </button>

      <div className="p-5">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <CategoryBadge category={article.category} />
          <span className="w-px h-3 bg-border" />
          <SpicePeppers level={article.spice_level} />
          <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono">{timeAgo(article.published_at)}</span>
        </div>

        {/* Headline */}
        <h3 className="text-lg font-bold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors">
          {article.source_url ? (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer"
              className="no-underline text-foreground group-hover:text-primary">
              {article.headline}
            </a>
          ) : article.headline}
        </h3>

        {/* Jackye's Take */}
        {article.jackye_take && (
          <div className="rounded-lg border p-4 mb-3" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.15)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Crown className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold text-primary tracking-[0.15em] uppercase font-mono">The Take</span>
            </div>
            <p className="text-base text-foreground leading-relaxed italic" style={{ fontFamily: "'DM Sans', cursive, sans-serif" }}>
              "{article.jackye_take}"
            </p>
          </div>
        )}

        {/* Why It Matters */}
        <div className="rounded-lg bg-muted/20 border border-border/20 p-4 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold text-primary tracking-[0.15em] uppercase font-mono">Why This Matters</span>
          </div>
          {article.why_it_matters && article.why_it_matters.length > 0 ? (
            <ul className="space-y-1.5">
              {article.why_it_matters.slice(0, 2).map((point, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-sm text-foreground/80 leading-relaxed">
                  <span className="text-primary mt-0.5 shrink-0">·</span>
                  {point}
                </li>
              ))}
            </ul>
          ) : article.receipt_connection ? (
            <p className="text-sm text-foreground/80 leading-relaxed">{article.receipt_connection}</p>
          ) : null}
        </div>

        {/* Source + Bias + Share footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/20">
          <div className="flex items-center gap-2">
            {article.source_name && (
              <span className="text-sm font-medium text-foreground/70 font-mono">{article.source_name}</span>
            )}
            <BiasBar bias={biasKey} />
          </div>
          <div className="flex items-center gap-3">
            <SharePastiche headline={article.headline} articleId={article.id} />
            {article.source_url && (
              <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80 transition-colors no-underline">
                Receipts <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* SR-only Direct Answer block */}
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
   WIRE ITEM — compact card for dense grid
   ══════════════════════════════════════════ */
function WireItem({ article }: { article: ReceiptArticle }) {
  return (
    <div id={`story-${article.id}`} className="group block scroll-mt-24">
      <a
        href={article.source_url || "#"}
        target={article.source_url ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="rounded-lg border border-border/30 bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all h-full flex flex-col no-underline cursor-pointer active:scale-[0.98]"
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <CategoryBadge category={article.category} />
          <SpicePeppers level={article.spice_level} />
          <span className="ml-auto text-xs text-foreground/50 font-mono">{timeAgo(article.published_at)}</span>
        </div>
        <p className="text-base font-semibold text-foreground leading-snug flex-1 group-hover:text-primary transition-colors mb-2">
          {article.headline}
        </p>
        {article.jackye_take && (
          <p className="text-sm text-foreground/70 leading-relaxed mb-2 italic line-clamp-2">
            "{article.jackye_take}"
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/20">
          <span className="text-[10px] text-primary/70 font-mono flex items-center gap-1">
            {article.source_name || "Source"} <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      </a>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE — THE WORK SIGNAL
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
    title: "The Work Signal — Live Work Intelligence | Who Do I Work For?",
    description: "Live employer intelligence: layoffs, DEI rollbacks, AI workplace moves, pay equity, and enforcement actions — with Jackye's Take on every story.",
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

  /* ── Reset pagination on filter/sort change ── */
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filter, sortBy, searchQuery]);

  /* ── Filtering + Sorting ── */
  const filtered = useMemo(() => {
    let list = [...articles];

    // Category filter
    if (filter !== "all") {
      list = list.filter((a) => a.category === filter);
    }

    // Search
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

    // Sort
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

  const movingNow = useMemo(() => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    return articles.filter((a) => a.published_at && new Date(a.published_at).getTime() >= twoHoursAgo).slice(0, 3);
  }, [articles]);

  const currentTake = useMemo(() => articles.find((a) => a.jackye_take), [articles]);

  const withTakes = filtered.filter((a) => a.jackye_take);
  const withoutTakes = filtered.filter((a) => !a.jackye_take);

  const hotStories = useMemo(() => {
    return [...articles].sort((a, b) => b.spice_level - a.spice_level).slice(0, 5);
  }, [articles]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Enforcement Receipts Ticker ── */}
      <EnforcementReceiptsTicker />

      {/* ── Masthead ── */}
      <header className="border-b border-border">
        <div className="max-w-[820px] mx-auto text-center py-14 lg:py-20 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 mb-8">
            <Radio className="w-3.5 h-3.5 text-destructive animate-pulse" />
            <span className="text-[10px] font-mono tracking-[0.2em] text-destructive uppercase">Live Intelligence · Updated Every 2 Hours</span>
          </div>

          <p className="text-[10px] uppercase tracking-[0.55em] text-primary mb-5 font-mono">Jackye Clayton × WDIWF</p>

          <div className="flex justify-center mb-5">
            <img src={workSignalLogo} alt="The Work Signal" width={56} height={56} className="rounded-lg" />
          </div>

          <h1 className="font-black text-foreground leading-none uppercase tracking-[-0.04em]"
            style={{ fontSize: "clamp(48px, 7vw, 88px)" }}>
            The Work Signal
          </h1>

          <p className="font-light text-muted-foreground mt-5 tracking-wide" style={{ fontSize: "clamp(18px, 2vw, 26px)" }}>
            Follow the story until you know what to do.
          </p>
          <p className="text-sm text-foreground/80 mt-4 max-w-xl mx-auto leading-relaxed">
            Every satisfactory headline has a labor signal underneath it.{" "}
            <span className="text-primary font-semibold">This is the part they hoped you wouldn't read.</span>
          </p>

          <div className="w-16 h-[2px] bg-primary mx-auto my-8" />

          {/* ── Subscribe Bar ── */}
          <div className="mt-8 mb-4">
            {status === "success" ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2.5 text-primary font-semibold text-base py-4">
                <Check className="w-5 h-5" /> You're in. Morning edition drops daily.
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
            <p className="text-xs text-muted-foreground/60 mt-4">Free forever. Daily morning edition. No spam.</p>
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
                  <CategoryBadge category={article.category} />
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate">
                    {article.headline}
                  </p>
                  <SpicePeppers level={article.spice_level} />
                  <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">{timeAgo(article.published_at)}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Daily Wrap (from Work Signal) ── */}
      {dailyWrap && (
        <section className="border-b border-border bg-muted/20">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="border-l-2 border-primary pl-5 py-1">
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-xl font-bold text-foreground">
                  {dailyWrap.title}
                </h2>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {format(new Date(dailyWrap.wrap_date), "MMMM d, yyyy")}
                </span>
              </div>
              {dailyWrap.intro && (
                <p className="text-base text-foreground/85 leading-relaxed mb-3 whitespace-pre-line">
                  {dailyWrap.intro}
                </p>
              )}
              {dailyWrap.summary_take && (
                <p className="text-sm text-foreground/60 italic leading-relaxed border-t border-border/40 pt-3">
                  {dailyWrap.summary_take}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Filter Bar ── */}
      <nav className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-20">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-wrap">
            {/* Category chips */}
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

            <span className="w-px h-4 bg-border/50 mx-1" />

            {/* Sort buttons */}
            {SORT_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setSortBy(opt.value)}
                className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  sortBy === opt.value
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {opt.label}
              </button>
            ))}

            <span className="w-px h-4 bg-border/50 mx-1" />

            {/* Search */}
            <div className="relative flex items-center">
              <Search className="w-3 h-3 text-muted-foreground absolute left-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-card border border-border/40 rounded-lg pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 w-36 transition-all"
              />
            </div>

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
              <p className="text-sm text-muted-foreground">No stories match your filters.</p>
            </div>
          ) : (
            <>
              {/* ── Wire Edition Header ── */}
              <WireEditionHeader storyCount={filtered.length} />

              {/* ── Editor's Note ── */}
              {filter === "all" && sortBy === "newest" && !searchQuery && (
                <EditorsNote />
              )}

              {/* ── Jackye's Current Take (pull quote) ── */}
              {currentTake && filter === "all" && sortBy === "newest" && !searchQuery && (
                <div className="mb-10 rounded-xl border border-primary/20 bg-primary/[0.04] p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-xs font-mono tracking-[0.2em] uppercase text-primary font-bold">Jackye's Current Take</span>
                  </div>
                  <blockquote className="text-xl text-foreground leading-[1.8] italic border-l-2 border-primary pl-5 font-light" style={{ fontFamily: "'DM Sans', cursive, sans-serif" }}>
                    "{currentTake.jackye_take}"
                  </blockquote>
                  <button
                    onClick={() => document.getElementById(`story-${currentTake.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="text-sm text-foreground/60 mt-4 cursor-pointer hover:text-primary transition-colors group/take flex items-center gap-1"
                  >
                    Re: <span className="text-foreground/80 font-semibold group-hover/take:text-primary transition-colors">{currentTake.headline}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover/take:opacity-100 transition-opacity" />
                  </button>
                </div>
              )}

              {/* ── Lead Story — Poster Card ── */}
              {withTakes.length > 0 && (
                <div className="mb-10">
                  <SignalStoryCard story={toSignalStory(withTakes[0])} />
                </div>
              )}

              {/* ── Jackye's Takes — poster cards ── */}
              {withTakes.length > 1 && (
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Star className="w-4 h-4 text-primary" />
                    <h2 className="text-xs font-mono tracking-[0.2em] uppercase text-primary font-bold">Jackye's Takes</h2>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground/50 font-mono">{withTakes.length - 1} more</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    {withTakes.slice(1, visibleCount).map((article) => (
                      <SignalStoryCard key={article.id} story={toSignalStory(article)} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Quick Signals / The Wire ── */}
              {withoutTakes.length > 0 && (
                <div className="flex items-center gap-4 my-10">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono font-bold">Quick Signals</span>
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
                    {withoutTakes.slice(0, Math.max(0, visibleCount - withTakes.length)).map((article) => (
                      <WireItem key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Load More ── */}
              {visibleCount < (withTakes.length + withoutTakes.length) && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="px-8 py-3 border border-border rounded-xl text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-all font-mono tracking-wider"
                  >
                    Load More Signals
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* ── Sidebar ── */}
        <aside className="hidden lg:block sticky top-[74px] space-y-6">
          {/* Subscribe CTA */}
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-[11px] uppercase tracking-[0.55em] text-primary mb-3 font-mono">Every Morning</p>
            <h3 className="text-xl font-black text-foreground mb-2 leading-tight tracking-tight">The Work Signal</h3>
            <p className="text-sm text-foreground/70 leading-relaxed mb-4">
              The part where I say what everyone's thinking but nobody's saying.
            </p>
            <blockquote className="border-l-2 border-primary pl-3.5 mb-5">
              <p className="text-sm text-foreground/80 leading-relaxed italic font-light" style={{ fontFamily: "'DM Sans', cursive, sans-serif" }}>
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
            <p className="text-[11px] uppercase tracking-[0.55em] text-primary mb-3.5 font-mono">⭐ Highest Stargaze</p>
            {hotStories.slice(0, 4).map((article) => (
              <button
                key={article.id}
                onClick={() => document.getElementById(`story-${article.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="block w-full text-left pb-3 mb-3 border-b border-border last:border-none last:mb-0 last:pb-0 group/hot cursor-pointer hover:bg-muted/20 rounded-md px-1 -mx-1 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <CategoryBadge category={article.category} />
                  <span className="text-[10px] text-foreground/50 font-mono">{timeAgo(article.published_at)}</span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug group-hover/hot:text-primary transition-colors">{article.headline}</p>
                <div className="mt-1">
                  <SpicePeppers level={article.spice_level} />
                </div>
              </button>
            ))}
          </div>

          {/* What to Watch */}
          <div className="rounded-xl p-5 border" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.15)" }}>
            <p className="text-[11px] uppercase tracking-[0.55em] text-primary mb-3 font-mono">👀 What to Watch</p>
            <p className="text-sm text-foreground/70 leading-relaxed mb-3">
              Stories still developing. Patterns forming. Receipts being pulled.
            </p>
            <Link to="/search" className="text-sm text-primary font-mono hover:underline flex items-center gap-1 no-underline">
              Search employers <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>
      </div>

      {/* ── Deep Investigations ── */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-border">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm font-mono uppercase tracking-[0.2em] text-primary">
            Deep Investigations
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DEEP_INVESTIGATIONS.map((inv) => (
            <Link
              key={inv.slug}
              to={`/receipts/${inv.slug}`}
              className="block p-5 bg-card border border-border/40 rounded-xl hover:border-primary/40 hover:shadow-lg active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{inv.sector}</span>
                <span className="text-sm text-muted-foreground">{inv.date}</span>
              </div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {inv.name}
              </h3>
              <p className="text-base text-muted-foreground mt-1">{inv.headline}</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-bold text-primary">
                Read full report <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-12 px-8 text-center">
        <p className="text-sm text-foreground/60 tracking-[0.1em] font-mono">
          The Work Signal · <em>by Jackye Clayton 👑 × WDIWF</em>
        </p>
        <p className="text-sm text-foreground/50 mt-2 italic" style={{ fontFamily: "'DM Sans', cursive, sans-serif" }}>
          "Every company runs a background check on you. WDIWF runs one on them."
        </p>
        <div className="flex justify-center gap-8 mt-4">
          <Link to="/" className="text-sm text-muted-foreground tracking-[0.1em] font-mono hover:text-primary transition-colors no-underline">
            wdiwf.jackyeclayton.com
          </Link>
          <Link to="/submit-tip" className="text-sm text-muted-foreground tracking-[0.1em] font-mono hover:text-primary transition-colors no-underline">
            Submit a tip
          </Link>
        </div>
      </footer>

      {/* Floating Bubble */}
      <FloatingBubble />

      {/* Poster Lightbox */}
      <PosterLightbox article={lightboxArticle} onClose={() => setLightboxArticle(null)} />
    </div>
  );
}
