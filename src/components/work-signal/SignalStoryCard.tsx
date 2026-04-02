import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { SignalStory } from "@/lib/work-signal-schema";
import {
  CATEGORY_DISPLAY,
  CATEGORY_COLORS,
  SIGNAL_TYPE_DISPLAY,
  HEAT_DISPLAY,
} from "@/lib/work-signal-schema";
import { formatDistanceToNow } from "date-fns";

interface Props {
  story: SignalStory;
}

export function SignalStoryCard({ story }: Props) {
  const [expanded, setExpanded] = useState(false);

  const signalType = SIGNAL_TYPE_DISPLAY[story.signal_type];
  const heat = HEAT_DISPLAY[story.heat_level];
  const category = CATEGORY_DISPLAY[story.category];
  const categoryColor = CATEGORY_COLORS[story.category];
  const timeAgo = formatDistanceToNow(new Date(story.published_at), { addSuffix: true });

  const hasExpandable =
    story.why_it_matters_applicants ||
    story.why_it_matters_employees ||
    story.why_it_matters_execs ||
    story.before_you_say_yes;

  return (
    <article className="rounded-xl border border-border/40 bg-card overflow-hidden transition-shadow hover:shadow-lg">
      {/* Header bar */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Signal type + headline */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="font-mono text-[10px] tracking-wider font-bold uppercase shrink-0 px-1.5 py-0.5 rounded"
              style={{ color: signalType.color, background: `${signalType.color}15` }}
            >
              {signalType.label}
            </span>
            {story.company_name && (
              <span className="text-xs font-semibold text-foreground">{story.company_name}</span>
            )}
          </div>

          <h3 className="text-base font-semibold text-foreground leading-snug font-display">
            {story.headline}
          </h3>
        </div>

        {/* Heat badge */}
        <span
          className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
          style={{ color: heat.color, background: heat.bg }}
        >
          {heat.label}
        </span>
      </div>

      {/* Category + source + time */}
      <div className="px-5 pb-3 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
        <span
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: categoryColor }}
        >
          {category}
        </span>
        <span className="opacity-40">·</span>
        {story.source_name && (
          <>
            {story.source_url ? (
              <a
                href={story.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                {story.source_name}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span>{story.source_name}</span>
            )}
            <span className="opacity-40">·</span>
          </>
        )}
        <span className="opacity-60">{timeAgo}</span>
      </div>

      {/* Receipt (the facts) */}
      {story.receipt && (
        <div className="px-5 pb-3">
          <p className="text-sm text-foreground/90 leading-relaxed">{story.receipt}</p>
        </div>
      )}

      {/* JRC Take (analysis) */}
      {story.jrc_take && (
        <div className="px-5 pb-4 border-t border-border/20 pt-3">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            The Work Signal Take
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed italic">{story.jrc_take}</p>
        </div>
      )}

      {/* Expandable: Why it matters + Before you say yes */}
      {hasExpandable && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-2.5 border-t border-border/20 flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            {expanded ? "Less" : "Why it matters + Before you say yes"}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="px-5 pb-5 space-y-4 border-t border-border/10 pt-4">
              {story.why_it_matters_applicants && (
                <WhyBlock label="If you're applying" text={story.why_it_matters_applicants} />
              )}
              {story.why_it_matters_employees && (
                <WhyBlock label="If you work there" text={story.why_it_matters_employees} />
              )}
              {story.why_it_matters_execs && (
                <WhyBlock label="If you're in leadership" text={story.why_it_matters_execs} />
              )}
              {story.before_you_say_yes && (
                <div>
                  <h5 className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">
                    Before You Say Yes
                  </h5>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
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

function WhyBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <h5 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </h5>
      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}
