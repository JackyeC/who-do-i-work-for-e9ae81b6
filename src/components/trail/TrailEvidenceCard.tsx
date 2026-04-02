/**
 * WhoDoI Trail — Evidence card with CongressWatch-style data viz.
 * Receipt cards show bar charts + dollar headlines.
 * Person cards show profile layout with compensation bars.
 * All cards show stats badges row.
 */
import { useTrail } from "./TrailContext";
import type { EvidenceCard as EvidenceCardType, CardCategory, ConfidenceState, BarDatum } from "./types";
import { Shield, ShieldCheck, ShieldAlert, ShieldQuestion, Link2 } from "lucide-react";

const CATEGORY_STYLES: Record<CardCategory, { accent: string; label: string; pattern: string }> = {
  receipt:  { accent: "#F2C14E", label: "RECEIPT", pattern: "◈" },
  person:   { accent: "#9B7BFF", label: "PERSON", pattern: "◉" },
  claim:    { accent: "#39C0BA", label: "CLAIM", pattern: "◆" },
  signal:   { accent: "#FF6B6B", label: "SIGNAL", pattern: "▲" },
  network:  { accent: "#FF9F43", label: "NETWORK", pattern: "⬡" },
  reveal:   { accent: "#63D471", label: "REVEAL", pattern: "★" },
};

const CONFIDENCE_ICONS: Record<ConfidenceState, { icon: typeof Shield; label: string; color: string }> = {
  verified:  { icon: ShieldCheck, label: "Verified", color: "#63D471" },
  partial:   { icon: Shield, label: "Partial", color: "#FF9F43" },
  emerging:  { icon: ShieldAlert, label: "Emerging", color: "#F2C14E" },
  unverified: { icon: ShieldQuestion, label: "Unverified", color: "#B9C0CC" },
};

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n < 10) return n.toFixed(1);         // e.g., Glassdoor ratings
  return n.toLocaleString();
}

/** Horizontal bar chart — CongressWatch-inspired */
function MiniBarChart({ bars, compact }: { bars: BarDatum[]; compact?: boolean }) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      {bars.map((bar, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] font-mono w-20 shrink-0 truncate text-right" style={{ color: "#B9C0CC" }}>
            {bar.label}
          </span>
          <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: "#17181D" }}>
            <div
              className="h-full rounded-sm transition-all duration-500"
              style={{
                width: `${(bar.value / max) * 100}%`,
                background: bar.color || "#F2C14E",
                minWidth: "4px",
              }}
            />
          </div>
          <span className="text-[10px] font-mono w-14 shrink-0" style={{ color: bar.color || "#F5F1E8" }}>
            {bar.value >= 1000 ? formatCompact(bar.value) : bar.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Stats badge row — like CongressWatch "$36.2M  258  271" */
function StatsBadgeRow({ stats }: { stats: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-1 px-2 py-1 rounded"
          style={{ background: "#17181D" }}>
          <span className="text-xs font-bold tabular-nums" style={{ color: s.color || "#F5F1E8" }}>
            {s.value}
          </span>
          <span className="text-[9px] font-mono uppercase" style={{ color: "#B9C0CC" }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Person profile avatar */
function PersonAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
      style={{
        background: `linear-gradient(135deg, ${color}30, ${color}60)`,
        color,
        border: `2px solid ${color}50`,
      }}>
      {initials}
    </div>
  );
}

interface Props {
  card: EvidenceCardType;
  isSelected: boolean;
  isRevealed: boolean;
  hasConnections: boolean;
}

export function TrailEvidenceCard({ card, isSelected, isRevealed, hasConnections }: Props) {
  const { selectCard, revealCard } = useTrail();
  const style = CATEGORY_STYLES[card.category];
  const conf = CONFIDENCE_ICONS[card.confidence];
  const ConfIcon = conf.icon;

  // Hidden clue
  if (!isRevealed) {
    return (
      <button
        onClick={() => revealCard(card.id)}
        className="w-full p-5 rounded-xl border-2 border-dashed transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
        style={{ background: "#1A1D25", borderColor: "rgba(245,241,232,0.08)" }}
        aria-label="Reveal hidden clue"
      >
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl opacity-30 group-hover:opacity-70 transition-opacity"
            style={{ background: "#2A2E38" }}>
            ❓
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#B9C0CC" }}>
            Tap to Investigate
          </span>
        </div>
      </button>
    );
  }

  const isPerson = card.category === "person" && card.personMeta;
  const hasViz = card.dataViz;

  return (
    <button
      onClick={() => selectCard(isSelected ? null : card.id)}
      className="w-full text-left rounded-xl border transition-all hover:translate-y-[-1px] active:translate-y-[0px] cursor-pointer"
      style={{
        background: "#1E2129",
        borderColor: isSelected ? style.accent : "rgba(245,241,232,0.06)",
        boxShadow: isSelected
          ? `0 4px 24px ${style.accent}20, 0 0 0 1px ${style.accent}30`
          : "0 2px 8px rgba(0,0,0,0.3)",
      }}
      aria-label={`${card.title} — ${style.label}`}
      aria-pressed={isSelected}
    >
      {/* Category header strip */}
      <div className="flex items-center justify-between px-3 py-1.5"
        style={{ background: `${style.accent}0A`, borderBottom: `1px solid ${style.accent}15` }}>
        <span className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5"
          style={{ color: style.accent }}>
          <span>{style.pattern}</span> {style.label}
        </span>
        <div className="flex items-center gap-1" style={{ color: conf.color }}>
          <ConfIcon className="w-3 h-3" />
          <span className="text-[10px] font-mono">{conf.label}</span>
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        {/* ─── PERSON CARD LAYOUT ─── */}
        {isPerson && card.personMeta && (
          <>
            <div className="flex items-center gap-3">
              <PersonAvatar initials={card.personMeta.photoInitials} color={style.accent} />
              <div className="min-w-0">
                <h4 className="text-sm font-bold leading-tight truncate" style={{ color: "#F5F1E8" }}>
                  {card.title}
                </h4>
                <p className="text-[11px] font-mono" style={{ color: style.accent }}>
                  {card.personMeta.role}
                </p>
                {card.personMeta.priorRole && (
                  <p className="text-[10px] mt-0.5" style={{ color: "#B9C0CC" }}>
                    Previously: {card.personMeta.priorRole}
                  </p>
                )}
              </div>
            </div>

            {/* Stats badges */}
            <StatsBadgeRow stats={card.personMeta.stats} />

            {/* Compensation bar chart */}
            {card.personMeta.barData && (
              <MiniBarChart bars={card.personMeta.barData} compact />
            )}
          </>
        )}

        {/* ─── DATA VIZ CARD LAYOUT (receipts, signals, etc.) ─── */}
        {!isPerson && (
          <>
            {/* Headline number + icon */}
            <div className="flex items-start gap-2.5">
              <span className="text-2xl shrink-0 mt-0.5">{card.icon}</span>
              <div className="min-w-0">
                {hasViz && card.dataViz?.headline && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xl font-bold tabular-nums" style={{ color: style.accent }}>
                      {card.dataViz.headline}
                    </span>
                    {card.dataViz.headlineLabel && (
                      <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "#B9C0CC" }}>
                        {card.dataViz.headlineLabel}
                      </span>
                    )}
                  </div>
                )}
                <h4 className="text-sm font-semibold leading-tight" style={{ color: "#F5F1E8" }}>
                  {card.title}
                </h4>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "#B9C0CC" }}>
                  {card.takeaway}
                </p>
              </div>
            </div>

            {/* Stats badges */}
            {hasViz && card.dataViz?.stats && (
              <StatsBadgeRow stats={card.dataViz.stats} />
            )}

            {/* Bar chart */}
            {hasViz && card.dataViz?.bars && (
              <MiniBarChart bars={card.dataViz.bars} />
            )}

            {/* Breakdown list */}
            {hasViz && card.dataViz?.breakdown && (
              <div className="space-y-1 pt-0.5">
                {card.dataViz.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] px-1.5 py-1 rounded"
                    style={{
                      background: item.highlight ? `${style.accent}08` : "transparent",
                    }}>
                    <span style={{ color: "#B9C0CC" }}>{item.label}</span>
                    <span className="font-mono" style={{ color: item.highlight ? style.accent : "#F5F1E8" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Shared: takeaway for person cards */}
        {isPerson && (
          <p className="text-[11px] leading-relaxed" style={{ color: "#B9C0CC" }}>
            {card.takeaway}
          </p>
        )}

        {/* Connection indicator */}
        {hasConnections && (
          <div className="flex items-center gap-1 pt-0.5">
            <Link2 className="w-3 h-3" style={{ color: style.accent }} />
            <span className="text-[10px] font-mono" style={{ color: style.accent }}>
              Connected to other evidence
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
