import { ExternalLink, Search, Newspaper } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { SignalStory, SignalCategory, HeatLevel } from "@/lib/work-signal-schema";
import { HEAT_DISPLAY } from "@/lib/work-signal-schema";
import { CoverageBiasBar } from "./CoverageBiasBar";

/* ── Category → poster theme ── */
const CATEGORY_POSTER: Record<SignalCategory, { emoji: string; stamp: string }> = {
  c_suite: { emoji: "👔", stamp: "THE C-SUITE" },
  tech_stack: { emoji: "🤖", stamp: "THE TECH STACK" },
  paycheck: { emoji: "💰", stamp: "THE PAYCHECK" },
  fine_print: { emoji: "📜", stamp: "THE FINE PRINT" },
  daily_grind: { emoji: "☕", stamp: "THE DAILY GRIND" },
};

const STAR_LABELS: Record<HeatLevel, { stars: number; label: string }> = {
  low: { stars: 1, label: "Worth a glance" },
  medium: { stars: 3, label: "Screenshot this" },
  high: { stars: 4, label: "Group chat material" },
};

const ACTION_LABELS: Record<SignalCategory, string> = {
  c_suite: "Career Audit →",
  tech_stack: "Career Audit →",
  paycheck: "Salary Check →",
  fine_print: "Script to Ask Your Boss →",
  daily_grind: "Career Audit →",
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
}

interface Props {
  story: SignalStory & {
    poster_url?: string | null;
    poster_pool_url?: string | null;
    source_count_left?: number;
    source_count_center?: number;
    source_count_right?: number;
    source_total?: number;
  };
}

export function SignalStoryCard({ story }: Props) {
  const navigate = useNavigate();
  const poster = CATEGORY_POSTER[story.category];
  const starInfo = STAR_LABELS[story.heat_level];
  const heat = HEAT_DISPLAY[story.heat_level];
  const actionLabel = ACTION_LABELS[story.category];

  const themeTitle = story.company_name || story.headline.split(/[—:,.]/).at(0)?.trim().slice(0, 40) || "";
  const companySlug = story.company_name ? toSlug(story.company_name) : null;

  const sourceDomain = story.source_url
    ? (() => { try { return new URL(story.source_url).hostname.replace("www.", ""); } catch { return story.source_name || ""; } })()
    : story.source_name || "";

  const whyItMatters = [
    story.why_it_matters_applicants,
    story.why_it_matters_employees,
  ].filter(Boolean);

  const tagline = story.receipt
    ? story.receipt.slice(0, 80) + (story.receipt.length > 80 ? "…" : "")
    : "";

  // Poster image: custom > pool > fallback
  const posterImageUrl = story.poster_url || story.poster_pool_url || null;

  return (
    <article
      id={`story-${story.id}`}
      className="group rounded-2xl border border-border/60 bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-[0_4px_32px_-8px_hsl(var(--primary)/0.15)]"
    >
      {/* ── POSTER HEADER ── */}
      {posterImageUrl ? (
        <div
          className="relative w-full aspect-[4/3] bg-cover bg-center flex flex-col items-center justify-end p-5"
          style={{ backgroundImage: `url(${posterImageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 text-center">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/60 mb-2">
              {poster.stamp}
            </p>
            <h3
              className="text-xl md:text-2xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
            >
              {story.headline}
            </h3>
          </div>
        </div>
      ) : (
        /* Fallback: tobacco brown poster */
        <div
          className="relative w-full aspect-[4/3] flex flex-col items-center justify-center p-6"
          style={{ background: "#2c1a00" }}
        >
          <span className="text-4xl mb-3 opacity-60">👑</span>
          <h3
            className="text-xl md:text-2xl font-bold text-center leading-tight max-w-[90%]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
              color: "#F0C040",
            }}
          >
            {story.headline}
          </h3>
          <p
            className="text-sm mt-2 italic text-center max-w-[80%]"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "#F0C040", opacity: 0.7 }}
          >
            {tagline || poster.stamp}
          </p>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase mt-4" style={{ color: "#F0C04060" }}>
            WDIWF.JACKYECLAYTON.COM
          </p>
        </div>
      )}

      {/* ── BIAS BAR ── */}
      <div className="px-5 pt-3 pb-2 border-b border-border/20">
        <CoverageBiasBar
          left={story.source_count_left ?? 0}
          center={story.source_count_center ?? 0}
          right={story.source_count_right ?? 0}
          total={story.source_total ?? 0}
        />
      </div>

      {/* ── HEADLINE + SOURCE ── */}
      <div className="px-5 py-4 text-center border-b border-border/20">
        {sourceDomain && (
          <p className="text-xs text-muted-foreground font-mono mb-1.5">{sourceDomain}</p>
        )}
        {posterImageUrl && (
          <h2 className="text-heading-3 font-display font-semibold text-foreground leading-snug">
            {story.headline}
          </h2>
        )}
      </div>

      {/* ── THE RECEIPT ── */}
      {story.receipt && (
        <div className="px-5 py-4 border-b border-border/20">
          <h4 className="text-xs font-mono uppercase tracking-[0.15em] text-primary/80 mb-2 flex items-center gap-1.5">
            🧾 The Receipt
          </h4>
          <p className="text-body text-foreground/85 leading-relaxed">{story.receipt}</p>
        </div>
      )}

      {/* ── JACKYE'S TAKE ── */}
      {story.jrc_take && (
        <div className="px-5 py-4 border-b border-border/20 bg-secondary/30">
          <h4 className="text-xs font-mono uppercase tracking-[0.15em] text-primary/80 mb-2 flex items-center gap-1.5">
            💬 Jackye's Take
          </h4>
          <p className="text-body text-foreground/80 leading-relaxed italic">
            "{story.jrc_take}"
          </p>
        </div>
      )}

      {/* ── WHY IT MATTERS ── */}
      {whyItMatters.length > 0 && (
        <div className="px-5 py-4 border-b border-border/20">
          <h4 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Why It Matters
          </h4>
          <ul className="space-y-2">
            {whyItMatters.map((text, i) => (
              <li key={i} className="text-body text-foreground/80 leading-relaxed flex gap-2">
                <span className="text-primary/60 shrink-0 mt-0.5">•</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── BEFORE YOU SAY YES ── */}
      {story.before_you_say_yes && (
        <div className="px-5 py-3 border-b border-border/20 bg-muted/20">
          <h4 className="text-xs font-mono uppercase tracking-[0.15em] text-primary mb-1.5">
            ✋ Use This
          </h4>
          <p className="text-caption text-foreground/75 leading-relaxed whitespace-pre-line">
            {story.before_you_say_yes}
          </p>
        </div>
      )}

      {/* ── FOOTER STRIP ── */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-border/20 bg-muted/10">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-sm" style={{ opacity: i < starInfo.stars ? 1 : 0.2 }}>⭐</span>
          ))}
          <span className="ml-2 text-[13px] text-muted-foreground italic">{starInfo.label}</span>
          {story.heat_level === "high" && (
            <span
              className="ml-2 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ color: heat.color, background: heat.bg }}
            >
              HOT
            </span>
          )}
        </div>
      </div>

      {/* ── ACTION ROW ── */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => navigate(story.category === "fine_print" ? "/offer-check" : "/search")}
            className="text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            🔧 {actionLabel}
          </button>
          {story.source_url && (
            <a href={story.source_url} target="_blank" rel="noopener noreferrer"
              className="text-[13px] text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
              See the receipts → {sourceDomain}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
          <button className="hover:text-foreground transition-colors">Save Poster</button>
          <span className="text-border">|</span>
          <button className="hover:text-foreground transition-colors">LinkedIn</button>
          <button className="hover:text-foreground transition-colors">X</button>
          <button className="hover:text-foreground transition-colors">Facebook</button>
        </div>

        <div className="flex flex-col gap-2 text-xs">
          {companySlug ? (
            <Link
              to={`/dossier/${companySlug}`}
              className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 no-underline"
            >
              <Search className="w-3.5 h-3.5" />
              Is your company doing this? Look up employer →
            </Link>
          ) : (
            <button
              onClick={() => navigate("/search")}
              className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 text-left"
            >
              <Search className="w-3.5 h-3.5" />
              Is your company doing this? Look up employer →
            </button>
          )}
          {companySlug && (
            <Link
              to={`/dossier/${companySlug}#follow-the-money`}
              className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 no-underline"
            >
              💸 Follow the money → How deep does it go?
            </Link>
          )}
          <Link
            to="/receipts"
            className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 no-underline"
          >
            <Newspaper className="w-3.5 h-3.5" />
            Want the full gallery? The Receipts →
          </Link>
        </div>
      </div>
    </article>
  );
}
