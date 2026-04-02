/**
 * WhoDoI Trail — Right drawer showing selected card details.
 */
import { useTrail } from "./TrailContext";
import { X, ExternalLink, Link2, ShieldCheck, Shield, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { ConfidenceState, CardCategory } from "./types";

const CONFIDENCE_META: Record<ConfidenceState, { icon: typeof Shield; label: string; color: string; desc: string }> = {
  verified: { icon: ShieldCheck, label: "Verified", color: "#63D471", desc: "Confirmed via official records or filings." },
  partial: { icon: Shield, label: "Partially Verified", color: "#FF9F43", desc: "Cross-referenced but not fully confirmed." },
  emerging: { icon: ShieldAlert, label: "Emerging Signal", color: "#F2C14E", desc: "Detected pattern — not yet independently verified." },
  unverified: { icon: ShieldQuestion, label: "Unverified", color: "#B9C0CC", desc: "Reported but not confirmed." },
};

const CAT_COLORS: Record<CardCategory, string> = {
  receipt: "#F2C14E",
  person: "#9B7BFF",
  claim: "#39C0BA",
  signal: "#FF6B6B",
  network: "#FF9F43",
  reveal: "#63D471",
};

export function TrailDrawer() {
  const { state, selectCard, makeConnection } = useTrail();
  const { selectedCardId, caseFile, revealedCards, revealedConnections } = state;

  const card = caseFile.cards.find(c => c.id === selectedCardId);

  if (!card) {
    return (
      <aside className="w-72 shrink-0 border-l hidden lg:flex flex-col items-center justify-center"
        style={{ background: "#20232B", borderColor: "rgba(245,241,232,0.08)" }}>
        <div className="text-center px-6 space-y-3">
          <span className="text-3xl">🔎</span>
          <p className="text-xs" style={{ color: "#B9C0CC" }}>
            Select a card on the board to see details, connections, and actions.
          </p>
        </div>
      </aside>
    );
  }

  const conf = CONFIDENCE_META[card.confidence];
  const ConfIcon = conf.icon;
  const accent = CAT_COLORS[card.category];

  // Find connections involving this card
  const relatedConns = caseFile.connections.filter(
    c => c.fromId === card.id || c.toId === card.id
  );

  return (
    <aside className="w-80 shrink-0 border-l overflow-y-auto flex flex-col"
      style={{ background: "#20232B", borderColor: "rgba(245,241,232,0.08)" }}>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: "rgba(245,241,232,0.06)" }}>
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: accent }}>
          Clue Details
        </span>
        <button onClick={() => selectCard(null)} className="p-1.5 rounded-md hover:opacity-80"
          style={{ color: "#B9C0CC" }} aria-label="Close details">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{card.icon}</span>
            <h3 className="text-base font-bold leading-tight" style={{ color: "#F5F1E8" }}>
              {card.title}
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#B9C0CC" }}>
            {card.takeaway}
          </p>
        </div>

        {/* Why it matters */}
        <div className="p-3 rounded-lg" style={{ background: "#2A2E38" }}>
          <h4 className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#F2C14E" }}>
            💡 Why It Matters
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: "#F5F1E8" }}>
            {card.whyItMatters}
          </p>
        </div>

        {/* Confidence */}
        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "#2A2E38" }}>
          <ConfIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: conf.color }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: conf.color }}>{conf.label}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#B9C0CC" }}>{conf.desc}</p>
          </div>
        </div>

        {/* Connections */}
        {relatedConns.length > 0 && (
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5"
              style={{ color: "#B9C0CC" }}>
              <Link2 className="w-3 h-3" /> Connect This Clue
            </h4>
            <div className="space-y-1.5">
              {relatedConns.map(conn => {
                const otherId = conn.fromId === card.id ? conn.toId : conn.fromId;
                const other = caseFile.cards.find(c => c.id === otherId);
                const isFound = revealedConnections.has(conn.id);
                const otherRevealed = revealedCards.has(otherId);

                if (!otherRevealed) return null;

                return (
                  <button
                    key={conn.id}
                    onClick={() => !isFound && makeConnection(conn.id)}
                    disabled={isFound}
                    className="w-full text-left p-2.5 rounded-lg border transition-all text-xs"
                    style={{
                      background: isFound ? "rgba(99,212,113,0.06)" : "#2A2E38",
                      borderColor: isFound ? "rgba(99,212,113,0.2)" : "rgba(245,241,232,0.04)",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{other?.icon}</span>
                      <span style={{ color: isFound ? "#63D471" : "#F5F1E8" }}>
                        {isFound ? "✓ " : ""}{other?.title}
                      </span>
                    </div>
                    {isFound && (
                      <p className="text-[10px] mt-1 font-mono" style={{ color: "#B9C0CC" }}>
                        {conn.label}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Source */}
        <div className="p-3 rounded-lg" style={{ background: "#2A2E38" }}>
          <h4 className="text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "#B9C0CC" }}>
            🧾 The Receipt
          </h4>
          <p className="text-[11px]" style={{ color: "#B9C0CC" }}>
            Source data would link to public records, filings, and verified reports.
          </p>
          <button className="flex items-center gap-1 mt-2 text-xs font-mono hover:underline"
            style={{ color: "#F2C14E" }}>
            <ExternalLink className="w-3 h-3" /> See the receipts →
          </button>
        </div>
      </div>
    </aside>
  );
}
