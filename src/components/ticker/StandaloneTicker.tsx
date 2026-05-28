import { Radio } from "lucide-react";

export interface StandaloneTickerItem {
  id: string;
  /** Main text shown in the ticker */
  text: string;
  /** Short uppercase tag, e.g. "REG", "AI", "LAYOFFS" */
  tag?: string;
  /** Source label, rendered as "via {source}" */
  source?: string;
  /** Renders red ⚠ tag instead of gold */
  warning?: boolean;
  /** Optional click handler */
  onClick?: () => void;
}

interface StandaloneTickerProps {
  items: StandaloneTickerItem[];
  /** Override label on the left. Defaults to "LIVE" */
  label?: string;
  /** Optional fallback item shown when items is empty */
  emptyText?: string;
  /** Max characters per item before truncation. Default 70 */
  maxChars?: number;
  className?: string;
}

/**
 * Drop-anywhere scrolling ticker.
 * Requires `.ticker-track` + `@keyframes ticker-scroll` in your CSS:
 *
 *   @keyframes ticker-scroll {
 *     0%   { transform: translateX(0); }
 *     100% { transform: translateX(-50%); }
 *   }
 *   .ticker-track {
 *     display: inline-flex;
 *     align-items: center;
 *     white-space: nowrap;
 *     animation: ticker-scroll var(--ticker-duration, 240s) linear infinite;
 *     will-change: transform;
 *   }
 *   .ticker-track:hover { animation-play-state: paused; }
 */
export function StandaloneTicker({
  items,
  label = "LIVE",
  emptyText = "Live updates loading",
  maxChars = 70,
  className,
}: StandaloneTickerProps) {
  const tickerItems: StandaloneTickerItem[] =
    items.length > 0
      ? items
      : [{ id: "fallback", text: emptyText }];

  const totalChars = tickerItems.reduce(
    (sum, i) => sum + (i.text?.length || 0) + (i.source?.length || 0) + 20,
    0
  );
  const duration = Math.max(160, Math.min(totalChars * 0.8, 400));

  const renderItem = (item: StandaloneTickerItem, key: string) => {
    const display =
      item.text.length > maxChars ? item.text.slice(0, maxChars) + "\u2026" : item.text;

    return (
      <button
        key={key}
        type="button"
        onClick={item.onClick}
        className="px-6 inline-flex items-center gap-2 bg-transparent border-none p-0 font-inherit text-left cursor-pointer hover:text-primary transition-colors"
      >
        {item.tag && (
          <span
            className="font-mono text-[10px] tracking-wider uppercase shrink-0"
            style={{
              color: item.warning ? "hsl(0 80% 65%)" : "hsl(43 85% 59% / 0.7)",
            }}
          >
            {item.warning ? "⚠ " : ""}
            {item.tag}
          </span>
        )}

        <span className="font-sans text-sm text-foreground/90">{display}</span>

        {item.source && (
          <span className="font-sans text-sm text-muted-foreground/50 shrink-0">
            via {item.source}
          </span>
        )}

        <span className="px-2" style={{ color: "hsl(43 85% 59% / 0.5)" }}>
          •
        </span>
      </button>
    );
  };

  return (
    <div
      className={`bg-background overflow-hidden whitespace-nowrap h-[36px] flex items-center relative ${className ?? ""}`}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, hsl(var(--background)), transparent)",
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, hsl(var(--background)), transparent)",
        }}
      />

      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{ borderRight: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Radio className="w-3 h-3 animate-pulse text-primary" />
        <span className="font-sans text-xs tracking-wider uppercase">{label}</span>
      </div>

      <div
        className="ticker-track"
        style={{ ["--ticker-duration" as string]: `${duration}s` }}
      >
        {tickerItems.map((t, i) => renderItem(t, `item-${i}`))}
        {tickerItems.map((t, i) => renderItem(t, `dup-${i}`))}
      </div>
    </div>
  );
}
