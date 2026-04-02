/**
 * WhoDoI Trail — Center board with polished navy surfaces.
 */
import { useTrail } from "./TrailContext";
import { TrailEvidenceCard } from "./TrailEvidenceCard";
import type { CardCategory } from "./types";

const CATEGORY_ORDER: CardCategory[] = ["receipt", "person", "claim", "signal", "network", "reveal"];
const CATEGORY_LABELS: Record<CardCategory, { label: string; icon: string; accent: string }> = {
  receipt: { label: "Money Trail", icon: "💰", accent: "#F2C14E" },
  person: { label: "Key People", icon: "👤", accent: "#9B7BFF" },
  claim: { label: "Public Claims", icon: "📢", accent: "#39C0BA" },
  signal: { label: "Worker Signals", icon: "📡", accent: "#FF6B6B" },
  network: { label: "Hidden Networks", icon: "🕸️", accent: "#FF9F43" },
  reveal: { label: "Reveals", icon: "🔓", accent: "#63D471" },
};

const CONNECTOR_STYLES: Record<string, { color: string; symbol: string; label: string }> = {
  solid:  { color: "#63D471", symbol: "━", label: "Verified link" },
  dashed: { color: "#FF9F43", symbol: "╌", label: "Partial link" },
  dotted: { color: "#9B7BFF", symbol: "···", label: "Indirect" },
  double: { color: "#F2C14E", symbol: "══", label: "Multiple receipts" },
  wavy:   { color: "#FF6B6B", symbol: "∿",  label: "Contradiction" },
};

export function TrailBoard() {
  const { state, makeConnection } = useTrail();
  const { caseFile, revealedCards, revealedConnections, selectedCardId } = state;

  // Pre-board phases
  if (state.phase === "intro" || state.phase === "act1" || state.phase === "act2") {
    return (
      <div className="flex-1 flex items-center justify-center p-8"
        style={{ background: "#14161E" }}>
        <div className="text-center max-w-md space-y-5">
          <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl"
            style={{ background: "rgba(242,193,78,0.08)", border: "1px solid rgba(242,193,78,0.12)" }}>
            🔍
          </div>
          <h2 className="text-xl font-bold" style={{ color: "#F5F1E8" }}>
            {state.phase === "intro" ? "Begin Your Investigation" :
             state.phase === "act1" ? "Evidence Unlocked — Form Your Theory" :
             "Theory Locked — Set Your Priority"}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#B9C0CC" }}>
            {state.phase === "intro"
              ? "Every company has a public record. Choose a trail to start uncovering what NovaCorp's record really says."
              : state.phase === "act1"
              ? "You've uncovered initial evidence. Now form a theory about what pattern you think is emerging."
              : "Almost there. What matters most to you as a worker? This shapes your final analysis."
            }
          </p>

          {/* Show collected evidence */}
          {state.phase !== "intro" && revealedCards.size > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "#F2C14E" }}>
                {revealedCards.size} clue{revealedCards.size !== 1 ? "s" : ""} uncovered
              </p>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {Array.from(revealedCards).map(id => {
                  const card = caseFile.cards.find(c => c.id === id);
                  if (!card) return null;
                  return (
                    <div key={id} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: "#1E222C" }} title={card.title}>
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
    <div className="flex-1 overflow-y-auto space-y-6" style={{ background: "#14161E" }}>
      {/* Connector legend bar */}
      <div className="sticky top-0 z-10 px-5 py-2 flex items-center gap-4 flex-wrap"
        style={{ background: "rgba(20,22,30,0.95)", borderBottom: "1px solid rgba(245,241,232,0.04)", backdropFilter: "blur(8px)" }}>
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#B9C0CC" }}>
          Connector Legend:
        </span>
        {Object.entries(CONNECTOR_STYLES).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1">
            <span className="text-xs font-mono" style={{ color: val.color }}>{val.symbol}</span>
            <span className="text-[10px]" style={{ color: "#B9C0CC" }}>{val.label}</span>
          </div>
        ))}
      </div>

      <div className="px-5 pb-6 space-y-6">
        {/* Connections panel */}
        {availableConnections.length > 0 && (
          <div className="p-4 rounded-xl" style={{ background: "#1A1D28", border: "1px solid rgba(242,193,78,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                style={{ color: "#F2C14E" }}>
                🔗 Investigate Connections
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: "rgba(242,193,78,0.1)", color: "#F2C14E" }}>
                {revealedConnections.size}/{availableConnections.length} found
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    className="text-left p-3 rounded-lg transition-all"
                    style={{
                      background: isFound ? `${connStyle.color}08` : "#1E222C",
                      border: `1px solid ${isFound ? `${connStyle.color}25` : "rgba(245,241,232,0.04)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span>{from?.icon}</span>
                      <span className="font-mono font-bold" style={{ color: connStyle.color }}>
                        {isFound ? "✓" : connStyle.symbol}
                      </span>
                      <span>{to?.icon}</span>
                    </div>
                    <p className="text-[11px] font-medium" style={{ color: isFound ? connStyle.color : "#F5F1E8" }}>
                      {isFound ? conn.label : `${from?.title?.slice(0, 25)}… → ${to?.title?.slice(0, 25)}…`}
                    </p>
                    {isFound && (
                      <p className="text-[9px] font-mono mt-1 flex items-center gap-1" style={{ color: "#B9C0CC" }}>
                        <span style={{ color: connStyle.color }}>{connStyle.symbol}</span> {connStyle.label}
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
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-lg">{group.icon}</span>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: group.accent }}>
                  {group.label}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{ background: `${group.accent}10`, color: group.accent }}>
                  {revealed}/{group.cards.length}
                </span>
                <div className="flex-1 h-px" style={{ background: `${group.accent}15` }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
