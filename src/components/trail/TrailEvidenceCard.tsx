/**
 * WhoDoI Trail — Evidence card component with category styling.
 */
import { useTrail } from "./TrailContext";
import type { EvidenceCard as EvidenceCardType, CardCategory, ConfidenceState } from "./types";
import { Shield, ShieldCheck, ShieldAlert, ShieldQuestion, Link2 } from "lucide-react";

const CATEGORY_STYLES: Record<CardCategory, { bg: string; border: string; accent: string; label: string; pattern: string }> = {
  receipt:  { bg: "#2A2E38", border: "#F2C14E", accent: "#F2C14E", label: "RECEIPT", pattern: "◈" },
  person:   { bg: "#2A2E38", border: "#9B7BFF", accent: "#9B7BFF", label: "PERSON", pattern: "◉" },
  claim:    { bg: "#2A2E38", border: "#39C0BA", accent: "#39C0BA", label: "CLAIM", pattern: "◆" },
  signal:   { bg: "#2A2E38", border: "#FF6B6B", accent: "#FF6B6B", label: "SIGNAL", pattern: "▲" },
  network:  { bg: "#2A2E38", border: "#FF9F43", accent: "#FF9F43", label: "NETWORK", pattern: "⬡" },
  reveal:   { bg: "#2A2E38", border: "#63D471", accent: "#63D471", label: "REVEAL", pattern: "★" },
};

const CONFIDENCE_ICONS: Record<ConfidenceState, { icon: typeof Shield; label: string; color: string }> = {
  verified:  { icon: ShieldCheck, label: "Verified", color: "#63D471" },
  partial:   { icon: Shield, label: "Partial", color: "#FF9F43" },
  emerging:  { icon: ShieldAlert, label: "Emerging", color: "#F2C14E" },
  unverified: { icon: ShieldQuestion, label: "Unverified", color: "#B9C0CC" },
};

interface Props {
  card: EvidenceCardType;
  isSelected: boolean;
  isRevealed: boolean;
  hasConnections: boolean;
}

export function TrailEvidenceCard({ card, isSelected, isRevealed, hasConnections }: Props) {
  const { selectCard, revealCard, makeConnection, state } = useTrail();
  const style = CATEGORY_STYLES[card.category];
  const conf = CONFIDENCE_ICONS[card.confidence];
  const ConfIcon = conf.icon;

  if (!isRevealed) {
    return (
      <button
        onClick={() => revealCard(card.id)}
        className="w-full p-4 rounded-xl border-2 border-dashed transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
        style={{ background: "#20232B", borderColor: "rgba(245,241,232,0.1)" }}
        aria-label={`Reveal hidden clue`}
      >
        <div className="flex flex-col items-center gap-2 py-3">
          <span className="text-2xl opacity-40 group-hover:opacity-80 transition-opacity">❓</span>
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#B9C0CC" }}>
            Hidden Clue
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => selectCard(isSelected ? null : card.id)}
      className="w-full text-left rounded-xl border-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      style={{
        background: isSelected ? "#2A2E38" : style.bg,
        borderColor: isSelected ? style.accent : "rgba(245,241,232,0.06)",
        boxShadow: isSelected ? `0 0 24px ${style.accent}25, inset 0 0 0 1px ${style.accent}20` : "none",
      }}
      aria-label={`${card.title} — ${style.label}`}
      aria-pressed={isSelected}
    >
      {/* Category strip */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-t-[10px]"
        style={{ background: `${style.accent}12` }}>
        <span className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5"
          style={{ color: style.accent }}>
          <span>{style.pattern}</span> {style.label}
        </span>
        <div className="flex items-center gap-1" style={{ color: conf.color }}>
          <ConfIcon className="w-3 h-3" />
          <span className="text-[10px] font-mono">{conf.label}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-xl shrink-0 mt-0.5">{card.icon}</span>
          <div>
            <h4 className="text-sm font-semibold leading-tight" style={{ color: "#F5F1E8" }}>
              {card.title}
            </h4>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "#B9C0CC" }}>
              {card.takeaway}
            </p>
          </div>
        </div>

        {/* Connection indicator */}
        {hasConnections && (
          <div className="flex items-center gap-1 pt-1">
            <Link2 className="w-3 h-3" style={{ color: style.accent }} />
            <span className="text-[10px] font-mono" style={{ color: style.accent }}>
              Has connections
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
