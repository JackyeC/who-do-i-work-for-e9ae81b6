/**
 * WhoDoI Trail — Center investigation board with cards and connectors.
 */
import { useTrail } from "./TrailContext";
import { TrailEvidenceCard } from "./TrailEvidenceCard";
import type { CardCategory } from "./types";

const CATEGORY_ORDER: CardCategory[] = ["receipt", "person", "claim", "signal", "network", "reveal"];
const CATEGORY_LABELS: Record<CardCategory, { label: string; icon: string }> = {
  receipt: { label: "Receipts", icon: "💰" },
  person: { label: "People", icon: "👤" },
  claim: { label: "Claims", icon: "📢" },
  signal: { label: "Signals", icon: "📡" },
  network: { label: "Networks", icon: "🕸️" },
  reveal: { label: "Reveals", icon: "🔓" },
};

const CONNECTOR_STYLES: Record<string, { stroke: string; dash: string; label: string }> = {
  solid: { stroke: "#63D471", dash: "", label: "━ Verified link" },
  dashed: { stroke: "#FF9F43", dash: "8 4", label: "╌ Partial link" },
  dotted: { stroke: "#9B7BFF", dash: "3 3", label: "··· Indirect" },
  double: { stroke: "#F2C14E", dash: "", label: "══ Multiple receipts" },
  wavy: { stroke: "#FF6B6B", dash: "12 4 3 4", label: "∿ Contradiction" },
};

export function TrailBoard() {
  const { state, makeConnection } = useTrail();
  const { caseFile, revealedCards, revealedConnections, selectedCardId } = state;

  if (state.phase === "intro" || state.phase === "act1" || state.phase === "act2") {
    return (
      <div className="flex-1 flex items-center justify-center p-8"
        style={{ background: "#17181D" }}>
        <div className="text-center max-w-md space-y-4">
          <span className="text-5xl">🔍</span>
          <h2 className="text-xl font-bold" style={{ color: "#F5F1E8" }}>
            {state.phase === "intro" ? "Choose your investigation path" : "Build your theory"}
          </h2>
          <p className="text-sm" style={{ color: "#B9C0CC" }}>
            {state.phase === "intro"
              ? "Select a starting trail from the left panel to begin uncovering evidence about this company."
              : "Make your selection to unlock more evidence on the board."
            }
          </p>
          {state.phase !== "intro" && (
            <div className="pt-4">
              <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#F2C14E" }}>
                Evidence found so far
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {Array.from(revealedCards).map(id => {
                  const card = caseFile.cards.find(c => c.id === id);
                  if (!card) return null;
                  return (
                    <span key={id} className="text-xl" title={card.title}>{card.icon}</span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Board phase — show categorized cards + connections
  const groupedCards = CATEGORY_ORDER.map(cat => ({
    category: cat,
    ...CATEGORY_LABELS[cat],
    cards: caseFile.cards.filter(c => c.category === cat),
  })).filter(g => g.cards.length > 0);

  // Available connections — those where both endpoints are revealed
  const availableConnections = caseFile.connections.filter(conn =>
    revealedCards.has(conn.fromId) && revealedCards.has(conn.toId)
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" style={{ background: "#17181D" }}>
      {/* Connector legend */}
      <div className="flex items-center gap-4 flex-wrap px-1">
        {Object.entries(CONNECTOR_STYLES).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: val.stroke }}>{val.label}</span>
          </div>
        ))}
      </div>

      {/* Connections panel */}
      {availableConnections.length > 0 && (
        <div className="p-4 rounded-xl border" style={{ background: "#20232B", borderColor: "rgba(245,241,232,0.06)" }}>
          <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#F2C14E" }}>
            🔗 Connections to Investigate
          </h3>
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
                  className="text-left p-3 rounded-lg border transition-all"
                  style={{
                    background: isFound ? `${connStyle.stroke}08` : "#2A2E38",
                    borderColor: isFound ? `${connStyle.stroke}40` : "rgba(245,241,232,0.04)",
                    opacity: isFound ? 0.7 : 1,
                  }}
                  aria-label={`Connect ${from?.title} to ${to?.title}`}
                >
                  <div className="flex items-center gap-1.5 text-xs mb-1">
                    <span>{from?.icon}</span>
                    <span className="font-mono" style={{ color: connStyle.stroke }}>
                      {isFound ? "✓" : "→"}
                    </span>
                    <span>{to?.icon}</span>
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: isFound ? connStyle.stroke : "#F5F1E8" }}>
                    {isFound ? conn.label : `${from?.title?.slice(0, 20)}… → ${to?.title?.slice(0, 20)}…`}
                  </p>
                  {isFound && (
                    <p className="text-[10px] font-mono mt-1" style={{ color: "#B9C0CC" }}>
                      {connStyle.label}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidence grid by category */}
      {groupedCards.map(group => (
        <div key={group.category}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{group.icon}</span>
            <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#B9C0CC" }}>
              {group.label}
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#2A2E38", color: "#B9C0CC" }}>
              {group.cards.filter(c => revealedCards.has(c.id)).length}/{group.cards.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
      ))}
    </div>
  );
}
