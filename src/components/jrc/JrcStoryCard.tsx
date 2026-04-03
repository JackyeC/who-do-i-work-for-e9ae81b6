import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ChevronDown, ChevronUp, FileText, Building2, User } from "lucide-react";
import type { JrcStory } from "@/lib/jrc-story-schema";
import {
  CATEGORY_DISPLAY,
  CATEGORY_COLORS,
  HEAT_DISPLAY,
  BIAS_SOURCE_DISPLAY,
  BIAS_CONFIDENCE_COLOR,
} from "@/lib/jrc-story-schema";
import { BiasLegend } from "./BiasLegend";
import { ReceiptsDrawer } from "./ReceiptsDrawer";
import { format } from "date-fns";

interface JrcStoryCardProps {
  story: JrcStory;
}

export function JrcStoryCard({ story }: JrcStoryCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const heat = HEAT_DISPLAY[story.heat_level];
  const catColor = CATEGORY_COLORS[story.category];
  const biasConf = BIAS_CONFIDENCE_COLOR[story.bias_confidence];

  return (
    <>
      <article className="bg-card border border-border hover:border-primary/20 transition-colors group">
        {/* ── Category + Heat chip row ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.15em] font-semibold"
              style={{ color: catColor }}
            >
              {CATEGORY_DISPLAY[story.category]}
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
              style={{ color: heat.color, borderColor: `${heat.color}40` }}
            >
              {heat.short}
            </span>
          </div>
          <time className="font-mono text-[10px] text-muted-foreground/60">
            {format(new Date(story.published_at), "MMM d, yyyy")}
          </time>
        </div>

        {/* ── Poster line (tappable) ── */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-5 py-5 cursor-pointer bg-transparent border-none"
        >
          <h2 className="font-serif text-xl md:text-2xl text-foreground leading-tight group-hover:text-primary transition-colors">
            {story.headline_poster}
          </h2>
          {story.headline_deck && (
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {story.headline_deck}
            </p>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-primary/60 mt-3 font-mono">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Collapse" : "Read full summary"}
          </span>
        </button>

        {/* ── Summary (expandable) ── */}
        {expanded && (
          <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line border-t border-border pt-4">
              {story.summary_rich}
            </div>
          </div>
        )}

        {/* ── Bias row ── */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Bias
            </span>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: biasConf.dot }}
              title={biasConf.label}
            />
            <span className="text-xs text-foreground/70">
              {BIAS_SOURCE_DISPLAY[story.bias_source]}
            </span>
          </div>
          <BiasLegend />
        </div>

        {/* ── Entity chips ── */}
        {(story.companies.length > 0 || story.people.length > 0) && (
          <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-border">
            {story.companies.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/jrc/company/${c.slug}`)}
                className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Building2 className="w-3 h-3" />
                {c.name}
              </button>
            ))}
            {story.people.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/jrc/person/${p.slug}`)}
                className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
              >
                <User className="w-3 h-3" />
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Action row ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-border">
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            View receipts
            {story.receipt_items.length > 0 && (
              <span className="text-muted-foreground">({story.receipt_items.length})</span>
            )}
          </button>

          {story.companies.length > 0 && (
            <button
              onClick={() => navigate(`/jrc/company/${story.companies[0].slug}`)}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              Company file
            </button>
          )}

          <div className="flex-1" />

          <a
            href={story.primary_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Source
          </a>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-2 border-t border-border">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/30">
            Powered by JRC EDIT
          </span>
        </div>
      </article>

      <ReceiptsDrawer story={story} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}