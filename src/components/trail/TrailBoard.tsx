/**
 * WhoDoI Trail — Center board reframed for job seekers.
 */
import { useTrail } from "./TrailContext";
import { TrailEvidenceCard } from "./TrailEvidenceCard";
import type { CardCategory } from "./types";
import { Fingerprint, Sparkles, ArrowRight, Zap } from "lucide-react";

const CATEGORY_ORDER: CardCategory[] = ["receipt", "person", "claim", "signal", "network", "reveal"];
const CATEGORY_LABELS: Record<CardCategory, { label: string; icon: string; accent: string; flavor: string }> = {
  receipt: { label: "Money Trail", icon: "💰", accent: "#F2C14E", flavor: "Where the company actually puts its dollars" },
  person: { label: "Key People", icon: "👤", accent: "#9B7BFF", flavor: "Who runs this place — and where did they come from?" },
  claim: { label: "Public Claims", icon: "📢", accent: "#39C0BA", flavor: "What they tell you vs. what the record shows" },
  signal: { label: "Worker Signals", icon: "📡", accent: "#FF6B6B", flavor: "What employees and former employees are actually saying" },
  network: { label: "Hidden Networks", icon: "🕸️", accent: "#FF9F43", flavor: "The influence web you won't find on the careers page" },
  reveal: { label: "Reveals", icon: "🔓", accent: "#63D471", flavor: "The pattern comes into focus" },
};

const CONNECTOR_STYLES: Record<string, { color: string; symbol: string; label: string }> = {
  solid:  { color: "#63D471", symbol: "━━", label: "Confirmed link" },
  dashed: { color: "#FF9F43", symbol: "╌ ╌", label: "Likely connected" },
  dotted: { color: "#9B7BFF", symbol: "· · ·", label: "Indirect influence" },
  double: { color: "#F2C14E", symbol: "══", label: "Multiple receipts" },
  wavy:   { color: "#FF6B6B", symbol: "∿∿", label: "Says one thing, does another" },
};

export function TrailBoard() {
  const { state, makeConnection } = useTrail();
  const { caseFile, revealedCards, revealedConnections, selectedCardId } = state;

  // Pre-board phases
  if (state.phase === "intro" || state.phase === "act1" || state.phase === "act2") {
    return (
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
        style={{ background: "#0F1118" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(242,193,78,0.04) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 70%, rgba(155,123,255,0.03) 0%, transparent 50%)" }} />

        <div className="text-center max-w-lg space-y-6 relative">
          <div className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-5xl relative"
            style={{ background: "rgba(242,193,78,0.06)", border: "1px solid rgba(242,193,78,0.1)" }}>
            {state.phase === "intro" ? "🔍" : state.phase === "act1" ? "🧠" : "💡"}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#F2C14E", boxShadow: "0 0 12px rgba(242,193,78,0.4)" }}>
              <Sparkles className="w-3 h-3" style={{ color: "#17181D" }} />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] mb-3" style={{ color: "#F2C14E" }}>
              {state.phase === "intro" ? "Step 1 of 3" : state.phase === "act1" ? "Step 2 of 3" : "Step 3 of 3"}
            </p>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#F5F1E8" }}>
              {state.phase === "intro" ? "See What They Don't Put on the Careers Page" :
               state.phase === "act1" ? "You Noticed Something — Let's Name It" :
               "What Do You Need Most from Your Next Job?"}
            </h2>
            <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "#B9C0CC" }}>
              {state.phase === "intro"
                ? "Every employer you're considering has a public record — PAC spending, lawsuits, layoff history, culture ratings. Most applicants never look. You're about to."
                : state.phase === "act1"
                ? "That gut feeling you had about this company? Let's put a name on it. Pick the pattern that matches what you're seeing — your theory shapes what evidence surfaces next."
                : "Stability? Ethics? Pay equity? Belonging? There's no wrong answer — but your answer changes the lens. This is about what YOU need, not what they're selling."
              }
            </p>
            <p className="text-[11px] italic mt-3 max-w-xs mx-auto" style={{ color: "#9A93A0" }}>
              {state.phase === "intro"
                ? "You deserve to know before you sign."
                : state.phase === "act1"
                ? "Trust your instincts. The data is here to back you up."
                : "You're not asking for too much. You're asking the right questions."
              }
            </p>
          </div>

          {state.phase !== "intro" && revealedCards.size > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] mb-3 flex items-center justify-center gap-2"
                style={{ color: "#F2C14E" }}>
                <Fingerprint className="w-3 h-3" />
                {revealedCards.size} piece{revealedCards.size !== 1 ? "s" : ""} of evidence in your file
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {Array.from(revealedCards).map(id => {
                  const card = caseFile.cards.find(c => c.id === id);
                  if (!card) return null;
                  return (
                    <div key={id} className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
                      style={{ background: "#1E222C", border: "1px solid rgba(245,241,232,0.06)" }} title={card.title}>
                      {card.icon}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Board phase
  const groupedCards = CATEGORY_ORDER.map(cat => ({
    category: cat,
    ...CATEGORY_LABELS[cat],
    cards: caseFile.cards.filter(c => c.category === cat),
  })).filter(g => g.cards.length > 0);

  const availableConnections = caseFile.connections.filter(conn =>
    revealedCards.has(conn.fromId) && revealedCards.has(conn.toId)
  );

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#0F1118" }}>
      {/* Connector legend */}
      <div className="sticky top-0 z-10 px-5 py-2.5 flex items-center gap-5 flex-wrap"
        style={{
          background: "rgba(15,17,24,0.92)",
          borderBottom: "1px solid rgba(242,193,78,0.06)",
          backdropFilter: "blur(12px)",
        }}>
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold" style={{ color: "#F2C14E" }}>
          Connection Types
        </span>
        {Object.entries(CONNECTOR_STYLES).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold" style={{ color: val.color }}>{val.symbol}</span>
            <span className="text-[9px] font-mono" style={{ color: "#B9C0CC" }}>{val.label}</span>
          </div>
        ))}
      </div>

      <div className="px-5 pb-8 pt-4 space-y-8">
        {/* Connections panel */}
        {availableConnections.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(242,193,78,0.1)" }}>
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ background: "linear-gradient(90deg, rgba(242,193,78,0.08) 0%, rgba(242,193,78,0.02) 100%)" }}>
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                style={{ color: "#F2C14E" }}>
                <Zap className="w-3.5 h-3.5" /> Connect the Dots
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold" style={{ color: "#F2C14E" }}>
                  {revealedConnections.size}
                </span>
                <span className="text-[10px] font-mono" style={{ color: "#B9C0CC" }}>
                  / {availableConnections.length} connections found
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3" style={{ background: "#13151E" }}>
              {availableConnections.map(conn => {
                const from = caseFile.cards.find(c => c.id === conn.fromId);
                const to = caseFile.cards.find(c => c.id === conn.toId);
                const isFound = revealedConnections.has(conn.id);
                const connStyle = CONNECTOR_STYLES[conn.type];

                return (
                  <button
                    key={conn.id}
                    onClick={() => !isFound && makeConnection(conn.id)}
                    disabled={isFound}
                    className="text-left p-3 rounded-xl transition-all group"
                    style={{
                      background: isFound ? `${connStyle.color}08` : "#1A1D28",
                      border: `1px solid ${isFound ? `${connStyle.color}30` : "rgba(245,241,232,0.04)"}`,
                      boxShadow: isFound ? `0 0 16px ${connStyle.color}10` : "none",
                    }}
                  >
                    <div className="flex items-center gap-2 text-xs mb-1.5">
                      <span className="text-base">{from?.icon}</span>
                      <span className="font-mono font-bold text-sm" style={{ color: connStyle.color }}>
                        {isFound ? "✓" : connStyle.symbol}
                      </span>
                      <span className="text-base">{to?.icon}</span>
                      {!isFound && (
                        <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: connStyle.color }} />
                      )}
                    </div>
                    <p className="text-[11px] font-medium leading-snug" style={{ color: isFound ? connStyle.color : "#F5F1E8" }}>
                      {isFound ? conn.label : `${from?.title?.slice(0, 28)}… → ${to?.title?.slice(0, 28)}…`}
                    </p>
                    {isFound && (
                      <p className="text-[9px] font-mono mt-1.5 flex items-center gap-1.5" style={{ color: "#B9C0CC" }}>
                        <span className="font-bold" style={{ color: connStyle.color }}>{connStyle.symbol}</span> {connStyle.label}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Evidence grid */}
        {groupedCards.map(group => {
          const revealed = group.cards.filter(c => revealedCards.has(c.id)).length;
          return (
            <div key={group.category}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: `${group.accent}10`, border: `1px solid ${group.accent}15` }}>
                  {group.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: group.accent }}>
                      {group.label}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{ background: `${group.accent}10`, color: group.accent, border: `1px solid ${group.accent}15` }}>
                      {revealed}/{group.cards.length}
                    </span>
                  </div>
                  <p className="text-[10px] italic mt-0.5" style={{ color: "#B9C0CC" }}>
                    {group.flavor}
                  </p>
                </div>
                <div className="h-px flex-1 max-w-[100px]" style={{ background: `${group.accent}15` }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.cards.map(card => {
                  const hasConn = caseFile.connections.some(
                    c => (c.fromId === card.id || c.toId === card.id) && revealedConnections.has(c.id)
                  );
                  return (
                    <TrailEvidenceCard
                      key={card.id}
                      card={card}
                      isSelected={selectedCardId === card.id}
                      isRevealed={revealedCards.has(card.id)}
                      hasConnections={hasConn}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
