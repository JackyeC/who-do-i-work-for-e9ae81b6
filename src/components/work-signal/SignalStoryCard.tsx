import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { SignalStory } from "@/lib/work-signal-schema";
import {
  CATEGORY_DISPLAY,
  CATEGORY_COLORS,
  SIGNAL_TYPE_DISPLAY,
  HEAT_DISPLAY,
} from "@/lib/work-signal-schema";
import type { SignalCategory } from "@/lib/work-signal-schema";
import { formatDistanceToNow } from "date-fns";

import categoryCsuite from "@/assets/category-c-suite.png";
import categoryTechStack from "@/assets/category-tech-stack.png";
import categoryPaycheck from "@/assets/category-paycheck.png";
import categoryFinePrint from "@/assets/category-fine-print.png";
import categoryDailyGrind from "@/assets/category-daily-grind.png";

const CATEGORY_ICONS: Record<SignalCategory, string> = {
  c_suite: categoryCsuite,
  tech_stack: categoryTechStack,
  paycheck: categoryPaycheck,
  fine_print: categoryFinePrint,
  daily_grind: categoryDailyGrind,
};

interface Props {
  story: SignalStory;
}

export function SignalStoryCard({ story }: Props) {
  const [expanded, setExpanded] = useState(false);

  const signalType = SIGNAL_TYPE_DISPLAY[story.signal_type];
  const heat = HEAT_DISPLAY[story.heat_level];
  const category = CATEGORY_DISPLAY[story.category];
  const categoryColor = CATEGORY_COLORS[story.category];
  const categoryIcon = CATEGORY_ICONS[story.category];
  const timeAgo = formatDistanceToNow(new Date(story.published_at), { addSuffix: true });

  const hasExpandable =
    story.why_it_matters_applicants ||
    story.why_it_matters_employees ||
    story.why_it_matters_execs ||
    story.before_you_say_yes;

  return (
    <article className="group relative rounded-xl border border-border/60 bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-[0_4px_24px_-6px_hsl(var(--primary)/0.1)]">
      {/* Signal-type top bar */}
      <div
        className="px-5 py-1.5 flex items-center justify-between"
        style={{ background: `${signalType.color}08` }}
      >
        <span
          className="font-mono text-[10px] tracking-[0.2em] font-bold uppercase"
          style={{ color: signalType.color }}
        >
          {signalType.label}
        </span>
        <span className="text-caption text-muted-foreground font-mono">{timeAgo}</span>
      </div>

      {/* Main content */}
      <div className="px-5 pt-4 pb-3">
        {/* Company + Category icon + Heat */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <img
            src={categoryIcon}
            alt={category}
            width={20}
            height={20}
            loading="lazy"
            className="shrink-0"
          />
          {story.company_name && (
            <span className="text-label font-semibold text-foreground">{story.company_name}</span>
          )}
          <span className="text-foreground/20">·</span>
          <span
            className="font-mono text-[10px] uppercase tracking-wider"
            style={{ color: categoryColor }}
          >
            {category}
          </span>
          <span className="ml-auto">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ color: heat.color, background: heat.bg }}
            >
              {heat.label}
            </span>
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-heading-3 font-display font-semibold text-foreground leading-snug mb-3">
          {story.headline}
        </h3>

        {/* Receipt — the facts */}
        {story.receipt && (
          <p className="text-body text-foreground/85 leading-relaxed mb-3">{story.receipt}</p>
        )}

        {/* Source */}
        {story.source_name && (
          <div className="flex items-center gap-1.5 mb-3">
            {story.source_url ? (
              <a
                href={story.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-caption font-mono text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                {story.source_name}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-caption font-mono text-muted-foreground">{story.source_name}</span>
            )}
          </div>
        )}
      </div>

      {/* JRC Take — the editorial voice */}
      {story.jrc_take && (
        <div className="mx-5 mb-4 px-4 py-3 rounded-lg bg-secondary/60 border-l-2 border-primary/40">
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary/70 mb-1.5">
            The Work Signal Take
          </p>
          <p className="text-body text-foreground/80 leading-relaxed italic">
            {story.jrc_take}
          </p>
        </div>
      )}

      {/* Expandable sections */}
      {hasExpandable && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-2.5 border-t border-border/40 flex items-center justify-center gap-1.5 text-caption font-medium text-primary/80 hover:text-primary hover:bg-primary/5 transition-colors"
          >
            {expanded ? "Less" : "Why it matters · Before you say yes"}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="px-5 pb-5 space-y-4 border-t border-border/20 pt-4">
              {story.why_it_matters_applicants && (
                <WhyBlock emoji="📋" label="If you're applying" text={story.why_it_matters_applicants} />
              )}
              {story.why_it_matters_employees && (
                <WhyBlock emoji="🏢" label="If you work there" text={story.why_it_matters_employees} />
              )}
              {story.why_it_matters_execs && (
                <WhyBlock emoji="📊" label="If you're in leadership" text={story.why_it_matters_execs} />
              )}
              {story.before_you_say_yes && (
                <div>
                  <h5 className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary mb-1.5 flex items-center gap-1.5">
                    <span>✋</span> Before You Say Yes
                  </h5>
                  <p className="text-body text-foreground/80 leading-relaxed whitespace-pre-line">
                    {story.before_you_say_yes}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

function WhyBlock({ emoji, label, text }: { emoji: string; label: string; text: string }) {
  return (
    <div>
      <h5 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1 flex items-center gap-1.5">
        <span>{emoji}</span> {label}
      </h5>
      <p className="text-body text-foreground/80 leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}
