import { ExternalLink, Search, Newspaper, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { SignalStory, SignalCategory, HeatLevel } from "@/lib/work-signal-schema";
import { HEAT_DISPLAY } from "@/lib/work-signal-schema";

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
  story: SignalStory;
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
    ? new URL(story.source_url).hostname.replace("www.", "")
    : story.source_name || "";

  const whyItMatters = [
    story.why_it_matters_applicants,
    story.why_it_matters_employees,
  ].filter(Boolean);

  // Tagline from receipt or headline
  const tagline = story.receipt
    ? story.receipt.slice(0, 80) + (story.receipt.length > 80 ? "…" : "")
    : "";

  return (
    <article className="group rounded-2xl border border-border/60 bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-[0_4px_32px_-8px_hsl(var(--primary)/0.15)]">

      {/* ── POSTER HEADER ── */}
      <div className="bg-muted/30 px-5 pt-5 pb-4 text-center border-b border-border/30">
        <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
          Jackye Clayton × WDIWF Presents
        </p>

        {/* Big emoji + theme title + tagline */}
        <div className="flex flex-col items-center gap-1 mb-3">
          <span className="text-4xl leading-none">{poster.emoji}</span>
          {companySlug ? (
            <Link
              to={`/dossier/${companySlug}`}
              className="text-heading-3 font-display font-bold text-foreground leading-tight mt-1 hover:text-primary transition-colors no-underline"
            >
              {themeTitle}
            </Link>
          ) : (
            <h3 className="text-heading-3 font-display font-bold text-foreground leading-tight mt-1">
              {themeTitle}
            </h3>
          )}
        </div>

        {/* Tagline */}
        {tagline && (
          <p className="text-caption text-foreground/60 max-w-sm mx-auto leading-relaxed line-clamp-2 italic">
            {tagline}
          </p>
        )}

        {/* Stamp + brand lockup */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary font-bold">
            {poster.stamp}
          </span>
        </div>
        <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/50 mt-2">
          WDIWF.JACKYECLAYTON.COM
        </p>
        <p className="text-[11px] text-muted-foreground/40 mt-1 italic">
          Every company runs a check on you. WDIWF runs one on them.
        </p>
      </div>

      {/* ── HEADLINE + SOURCE (movie poster center) ── */}
      <div className="px-5 py-4 text-center border-b border-border/20">
        {sourceDomain && (
          <p className="text-xs text-muted-foreground font-mono mb-1.5">{sourceDomain}</p>
        )}
        <h2 className="text-heading-3 font-display font-semibold text-foreground leading-snug">
          {story.headline}
        </h2>
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

      {/* ── FOOTER STRIP: Stars + Drama + Actions ── */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-border/20 bg-muted/10">
        {/* Stars + drama label */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-sm" style={{ opacity: i < starInfo.stars ? 1 : 0.2 }}>⭐</span>
          ))}
          <span className="ml-2 text-[13px] text-muted-foreground italic">{starInfo.label}</span>
          {story.heat_level === "high" && (
            <span className="ml-2 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ color: heat.color, background: heat.bg }}>
              HOT
            </span>
          )}
        </div>
      </div>

      {/* ── ACTION ROW ── */}
      <div className="px-5 py-4 space-y-3">
        {/* Use This + Source */}
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

        {/* Share row */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
          <button className="hover:text-foreground transition-colors">Save Poster</button>
          <span className="text-border">|</span>
          <button className="hover:text-foreground transition-colors">LinkedIn</button>
          <button className="hover:text-foreground transition-colors">X</button>
          <button className="hover:text-foreground transition-colors">Facebook</button>
        </div>

        {/* Rabbit hole links */}
        <div className="flex flex-col gap-2 text-xs">
          {companySlug && (
            <Link
              to={`/dossier/${companySlug}`}
              className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 no-underline"
            >
              <Search className="w-3.5 h-3.5" />
              Is your company doing this? Look up employer →
            </Link>
          )}
          {!companySlug && (
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
