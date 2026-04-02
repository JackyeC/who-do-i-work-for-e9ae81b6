/**
 * WhoDoI Trail — Premium evidence cards with strong category distinctions.
 * Each category has a unique visual treatment, not just color swaps.
 */
import { useTrail } from "./TrailContext";
import type { EvidenceCard as EvidenceCardType, CardCategory, ConfidenceState, BarDatum } from "./types";
import { Shield, ShieldCheck, ShieldAlert, ShieldQuestion, Link2, Sparkles } from "lucide-react";

const CATEGORY_STYLES: Record<CardCategory, {
  accent: string; label: string; pattern: string; bgGradient: string; flavorLabel: string;
}> = {
  receipt:  { accent: "#F2C14E", label: "RECEIPT", pattern: "◈", bgGradient: "linear-gradient(135deg, #272218 0%, #1E2129 60%)", flavorLabel: "Follow the money" },
  person:   { accent: "#9B7BFF", label: "PERSON", pattern: "◉", bgGradient: "linear-gradient(135deg, #211E2D 0%, #1E2129 60%)", flavorLabel: "Who's behind this?" },
  claim:    { accent: "#39C0BA", label: "CLAIM", pattern: "◆", bgGradient: "linear-gradient(135deg, #1A2524 0%, #1E2129 60%)", flavorLabel: "Says who?" },
  signal:   { accent: "#FF6B6B", label: "SIGNAL", pattern: "▲", bgGradient: "linear-gradient(135deg, #271E1E 0%, #1E2129 60%)", flavorLabel: "Worker intel" },
  network:  { accent: "#FF9F43", label: "NETWORK", pattern: "⬡", bgGradient: "linear-gradient(135deg, #272019 0%, #1E2129 60%)", flavorLabel: "Hidden thread" },
  reveal:   { accent: "#63D471", label: "REVEAL", pattern: "★", bgGradient: "linear-gradient(135deg, #1A2518 0%, #1E2129 60%)", flavorLabel: "Case break" },
};

const CONFIDENCE_ICONS: Record<ConfidenceState, { icon: typeof Shield; label: string; color: string; micro: string }> = {
  verified:  { icon: ShieldCheck, label: "Verified", color: "#63D471", micro: "On the record" },
  partial:   { icon: Shield, label: "Partial", color: "#FF9F43", micro: "Needs corroboration" },
  emerging:  { icon: ShieldAlert, label: "Emerging", color: "#F2C14E", micro: "Pattern forming" },
  unverified: { icon: ShieldQuestion, label: "Unverified", color: "#B9C0CC", micro: "Tip only" },
};

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n < 10) return n.toFixed(1);
  return n.toLocaleString();
}

function MiniBarChart({ bars, compact }: { bars: BarDatum[]; compact?: boolean }) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      {bars.map((bar, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] font-mono w-20 shrink-0 truncate text-right" style={{ color: "#B9C0CC" }}>
            {bar.label}
          </span>
          <div className="flex-1 h-3.5 rounded-sm overflow-hidden relative" style={{ background: "rgba(23,24,29,0.8)" }}>
            <div
              className="h-full rounded-sm"
              style={{
                width: `${(bar.value / max) * 100}%`,
                background: `linear-gradient(90deg, ${bar.color || "#F2C14E"}, ${bar.color || "#F2C14E"}AA)`,
                minWidth: "4px",
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
          <span className="text-[10px] font-mono w-14 shrink-0 tabular-nums" style={{ color: bar.color || "#F5F1E8" }}>
            {bar.value >= 1000 ? formatCompact(bar.value) : bar.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatsBadgeRow({ stats }: { stats: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-md"
          style={{ background: "rgba(23,24,29,0.7)", border: `1px solid ${s.color || "#F5F1E8"}12` }}>
          <span className="text-xs font-bold tabular-nums" style={{ color: s.color || "#F5F1E8" }}>
            {s.value}
          </span>
          <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: "#B9C0CC" }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function PersonAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 relative"
      style={{
        background: `linear-gradient(135deg, ${color}25, ${color}50)`,
        color,
        border: `2px solid ${color}60`,
        boxShadow: `0 0 20px ${color}15`,
      }}>
      {initials}
      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px]"
        style={{ background: "#1E2129", border: `1.5px solid ${color}60` }}>
        👤
      </div>
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

  // Hidden clue — mystery card
  if (!isRevealed) {
    return (
      <button
        onClick={() => revealCard(card.id)}
        className="w-full rounded-2xl border-2 border-dashed transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group overflow-hidden relative"
        style={{ background: "#151720", borderColor: "rgba(245,241,232,0.06)" }}
        aria-label="Reveal hidden clue"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at 50% 50%, ${style.accent}08 0%, transparent 70%)` }} />
        <div className="flex flex-col items-center gap-3 py-8 relative">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl opacity-20 group-hover:opacity-60 transition-all duration-300 group-hover:scale-110"
            style={{ background: `${style.accent}10`, border: `1px dashed ${style.accent}20` }}>
            {card.icon}
          </div>
          <div className="text-center">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] block" style={{ color: style.accent, opacity: 0.6 }}>
              {style.flavorLabel}
            </span>
            <span className="text-[11px] font-medium mt-1 block group-hover:translate-y-0 transition-transform"
              style={{ color: "#B9C0CC" }}>
              Tap to investigate →
            </span>
          </div>
        </div>
      </button>
    );
  }

  const isPerson = card.category === "person" && card.personMeta;
  const hasViz = card.dataViz;

  return (
    <button
      onClick={() => selectCard(isSelected ? null : card.id)}
      className="w-full text-left rounded-2xl border transition-all hover:translate-y-[-2px] active:translate-y-[0px] cursor-pointer overflow-hidden relative group"
      style={{
        background: style.bgGradient,
        borderColor: isSelected ? `${style.accent}80` : "rgba(245,241,232,0.05)",
        boxShadow: isSelected
          ? `0 8px 32px ${style.accent}20, 0 0 0 1px ${style.accent}40, inset 0 1px 0 ${style.accent}10`
          : "0 2px 12px rgba(0,0,0,0.4)",
      }}
      aria-label={`${card.title} — ${style.label}`}
      aria-pressed={isSelected}
    >
      {/* Glow on selection */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top, ${style.accent}08 0%, transparent 60%)` }} />
      )}

      {/* Category strip — bolder with pattern */}
      <div className="flex items-center justify-between px-3.5 py-2 relative"
        style={{ borderBottom: `1px solid ${style.accent}18` }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: style.accent, boxShadow: `0 0 6px ${style.accent}60` }} />
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] font-bold"
            style={{ color: style.accent }}>
            {style.pattern} {style.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: conf.color }}>
          <ConfIcon className="w-3 h-3" />
          <span className="text-[9px] font-mono">{conf.micro}</span>
        </div>
      </div>

      <div className="p-3.5 space-y-3 relative">
        {/* ─── PERSON CARD ─── */}
        {isPerson && card.personMeta && (
          <>
            <div className="flex items-center gap-3">
              <PersonAvatar initials={card.personMeta.photoInitials} color={style.accent} />
              <div className="min-w-0">
                <h4 className="text-sm font-bold leading-tight truncate" style={{ color: "#F5F1E8" }}>
                  {card.title}
                </h4>
                <p className="text-[11px] font-mono font-semibold" style={{ color: style.accent }}>
                  {card.personMeta.role}
                </p>
                {card.personMeta.compensation && (
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "#F2C14E" }}>
                    💰 {card.personMeta.compensation}
                  </p>
                )}
                {card.personMeta.priorRole && (
                  <p className="text-[10px] mt-0.5 italic" style={{ color: "#B9C0CC" }}>
                    ← {card.personMeta.priorRole}
                  </p>
                )}
              </div>
            </div>
            <StatsBadgeRow stats={card.personMeta.stats} />
            {card.personMeta.barData && <MiniBarChart bars={card.personMeta.barData} compact />}
          </>
        )}

        {/* ─── DATA VIZ CARD (receipts, signals, etc.) ─── */}
        {!isPerson && (
          <>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${style.accent}10`, border: `1px solid ${style.accent}15` }}>
                {card.icon}
              </div>
              <div className="min-w-0 flex-1">
                {hasViz && card.dataViz?.headline && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xl font-black tabular-nums tracking-tight" style={{ color: style.accent }}>
                      {card.dataViz.headline}
                    </span>
                    {card.dataViz.headlineLabel && (
                      <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: "#B9C0CC" }}>
                        {card.dataViz.headlineLabel}
                      </span>
                    )}
                  </div>
                )}
                <h4 className="text-[13px] font-bold leading-tight" style={{ color: "#F5F1E8" }}>
                  {card.title}
                </h4>
              </div>
            </div>

            {/* Takeaway as a pull-quote */}
            <p className="text-[11px] leading-relaxed pl-1"
              style={{ color: "#D4CFC5", borderLeft: `2px solid ${style.accent}30`, paddingLeft: "10px" }}>
              {card.takeaway}
            </p>

            {hasViz && card.dataViz?.stats && <StatsBadgeRow stats={card.dataViz.stats} />}
            {hasViz && card.dataViz?.bars && <MiniBarChart bars={card.dataViz.bars} />}

            {hasViz && card.dataViz?.breakdown && (
              <div className="space-y-0.5 pt-1">
                {card.dataViz.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] px-2 py-1.5 rounded-md"
                    style={{ background: item.highlight ? `${style.accent}0A` : "transparent" }}>
                    <span style={{ color: "#B9C0CC" }}>{item.label}</span>
                    <span className="font-mono font-semibold" style={{ color: item.highlight ? style.accent : "#F5F1E8" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {isPerson && (
          <p className="text-[11px] leading-relaxed"
            style={{ color: "#D4CFC5", borderLeft: `2px solid ${style.accent}30`, paddingLeft: "10px" }}>
            {card.takeaway}
          </p>
        )}

        {/* Connection badge */}
        {hasConnections && (
          <div className="flex items-center gap-1.5 pt-1">
            <Link2 className="w-3 h-3" style={{ color: style.accent }} />
            <span className="text-[10px] font-mono font-semibold" style={{ color: style.accent }}>
              Linked to other evidence
            </span>
            <Sparkles className="w-2.5 h-2.5 ml-auto" style={{ color: style.accent, opacity: 0.5 }} />
          </div>
        )}
      </div>
    </button>
  );
}
