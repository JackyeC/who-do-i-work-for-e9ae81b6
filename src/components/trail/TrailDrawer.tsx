/**
 * WhoDoI Trail — Right drawer with enriched data display.
 */
import { useTrail } from "./TrailContext";
import { X, ExternalLink, Link2, ShieldCheck, Shield, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { ConfidenceState, CardCategory, BarDatum } from "./types";

const CONFIDENCE_META: Record<ConfidenceState, { icon: typeof Shield; label: string; color: string; desc: string }> = {
  verified: { icon: ShieldCheck, label: "Verified", color: "#63D471", desc: "Confirmed via official records or filings." },
  partial: { icon: Shield, label: "Partially Verified", color: "#FF9F43", desc: "Cross-referenced but not fully confirmed." },
  emerging: { icon: ShieldAlert, label: "Emerging Signal", color: "#F2C14E", desc: "Detected pattern — not yet independently verified." },
  unverified: { icon: ShieldQuestion, label: "Unverified", color: "#B9C0CC", desc: "Reported but not confirmed." },
};

const CAT_COLORS: Record<CardCategory, string> = {
  receipt: "#F2C14E", person: "#9B7BFF", claim: "#39C0BA",
  signal: "#FF6B6B", network: "#FF9F43", reveal: "#63D471",
};

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function DetailBarChart({ bars }: { bars: BarDatum[] }) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="space-y-2">
      {bars.map((bar, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px]" style={{ color: "#B9C0CC" }}>{bar.label}</span>
            <span className="text-[10px] font-mono font-bold" style={{ color: bar.color || "#F5F1E8" }}>
              {bar.value >= 1000 ? formatCompact(bar.value) : bar.value}
            </span>
          </div>
          <div className="h-2.5 rounded overflow-hidden" style={{ background: "#17181D" }}>
            <div className="h-full rounded transition-all duration-700"
              style={{ width: `${(bar.value / max) * 100}%`, background: bar.color || "#F2C14E" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrailDrawer() {
  const { state, selectCard, makeConnection } = useTrail();
  const { selectedCardId, caseFile, revealedCards, revealedConnections } = state;

  const card = caseFile.cards.find(c => c.id === selectedCardId);

  if (!card) {
    return (
      <aside className="w-[300px] shrink-0 hidden lg:flex flex-col items-center justify-center"
        style={{ background: "#1A1D28", borderLeft: "1px solid rgba(242,193,78,0.08)" }}>
        <div className="text-center px-6 space-y-3">
          <div className="w-14 h-14 rounded-xl mx-auto flex items-center justify-center text-2xl"
            style={{ background: "#1E222C" }}>🔎</div>
          <p className="text-[11px] leading-relaxed" style={{ color: "#B9C0CC" }}>
            Select any card on the board to see full details, data breakdowns, connections, and source links.
          </p>
        </div>
      </aside>
    );
  }

  const conf = CONFIDENCE_META[card.confidence];
  const ConfIcon = conf.icon;
  const accent = CAT_COLORS[card.category];
  const relatedConns = caseFile.connections.filter(c => c.fromId === card.id || c.toId === card.id);
  const isPerson = card.category === "person" && card.personMeta;
  const viz = card.dataViz;

  return (
    <aside className="w-[320px] shrink-0 overflow-y-auto flex flex-col"
      style={{ background: "#1A1D28", borderLeft: "1px solid rgba(242,193,78,0.08)" }}>

      {/* Header */}
      <div className="flex items-center justify-between p-4"
        style={{ borderBottom: `1px solid ${accent}15` }}>
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>
          Evidence Details
        </span>
        <button onClick={() => selectCard(null)} className="p-1.5 rounded-lg hover:bg-[#2A2E38] transition-colors"
          style={{ color: "#B9C0CC" }} aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Title section */}
        <div>
          {isPerson && card.personMeta ? (
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}60)`, color: accent, border: `2px solid ${accent}50` }}>
                {card.personMeta.photoInitials}
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "#F5F1E8" }}>{card.title}</h3>
                <p className="text-[11px] font-mono" style={{ color: accent }}>{card.personMeta.role}</p>
                {card.personMeta.priorRole && (
                  <p className="text-[10px]" style={{ color: "#B9C0CC" }}>Previously: {card.personMeta.priorRole}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 mb-2">
              <span className="text-3xl">{card.icon}</span>
              <div>
                {viz?.headline && (
                  <p className="text-2xl font-bold tabular-nums mb-0.5" style={{ color: accent }}>
                    {viz.headline}
                    {viz.headlineLabel && (
                      <span className="text-[9px] font-mono uppercase ml-2" style={{ color: "#B9C0CC" }}>
                        {viz.headlineLabel}
                      </span>
                    )}
                  </p>
                )}
                <h3 className="text-sm font-bold" style={{ color: "#F5F1E8" }}>{card.title}</h3>
              </div>
            </div>
          )}
          <p className="text-xs leading-relaxed" style={{ color: "#B9C0CC" }}>{card.takeaway}</p>
        </div>

        {/* Stats row */}
        {(isPerson ? card.personMeta?.stats : viz?.stats) && (
          <div className="flex flex-wrap gap-1.5">
            {(isPerson ? card.personMeta!.stats : viz!.stats!).map((s, i) => (
              <div key={i} className="px-2.5 py-1.5 rounded-lg" style={{ background: "#17181D" }}>
                <p className="text-xs font-bold tabular-nums" style={{ color: s.color || "#F5F1E8" }}>{s.value}</p>
                <p className="text-[9px] font-mono uppercase" style={{ color: "#B9C0CC" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Bar chart */}
        {(isPerson ? card.personMeta?.barData : viz?.bars) && (
          <div className="p-3 rounded-xl" style={{ background: "#1E222C" }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2.5" style={{ color: "#B9C0CC" }}>
              📊 Breakdown
            </p>
            <DetailBarChart bars={(isPerson ? card.personMeta!.barData! : viz!.bars!)} />
          </div>
        )}

        {/* Breakdown list */}
        {viz?.breakdown && (
          <div className="p-3 rounded-xl" style={{ background: "#1E222C" }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#B9C0CC" }}>
              📋 Details
            </p>
            <div className="space-y-1.5">
              {viz.breakdown.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-[11px] px-2 py-1.5 rounded-lg"
                  style={{ background: item.highlight ? `${accent}08` : "transparent" }}>
                  <span style={{ color: "#B9C0CC" }}>{item.label}</span>
                  <span className="font-mono text-right shrink-0" style={{ color: item.highlight ? accent : "#F5F1E8" }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why it matters */}
        <div className="p-3 rounded-xl" style={{ background: "#1E222C" }}>
          <h4 className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#F2C14E" }}>
            💡 Why It Matters
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: "#F5F1E8" }}>{card.whyItMatters}</p>
        </div>

        {/* Confidence */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: "#1E222C" }}>
          <ConfIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: conf.color }} />
          <div>
            <p className="text-xs font-bold" style={{ color: conf.color }}>{conf.label}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#B9C0CC" }}>{conf.desc}</p>
          </div>
        </div>

        {/* Connections */}
        {relatedConns.length > 0 && (
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5"
              style={{ color: "#B9C0CC" }}>
              <Link2 className="w-3 h-3" /> Connect This Evidence
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
                    className="w-full text-left p-2.5 rounded-lg transition-all text-xs"
                    style={{
                      background: isFound ? "rgba(99,212,113,0.05)" : "#1E222C",
                      border: `1px solid ${isFound ? "rgba(99,212,113,0.15)" : "rgba(245,241,232,0.04)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{other?.icon}</span>
                      <span style={{ color: isFound ? "#63D471" : "#F5F1E8" }}>
                        {isFound ? "✓ " : ""}{other?.title}
                      </span>
                    </div>
                    {isFound && <p className="text-[10px] font-mono mt-1" style={{ color: "#B9C0CC" }}>{conn.label}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Source */}
        <div className="p-3 rounded-xl" style={{ background: "#1E222C" }}>
          <h4 className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "#B9C0CC" }}>
            🧾 The Receipt
          </h4>
          <p className="text-[10px]" style={{ color: "#B9C0CC" }}>
            Source data from FEC filings, SEC disclosures, NLRB records, and verified public reports.
          </p>
          <button className="flex items-center gap-1 mt-2 text-[11px] font-mono hover:underline"
            style={{ color: "#F2C14E" }}>
            <ExternalLink className="w-3 h-3" /> See the receipts →
          </button>
        </div>
      </div>
    </aside>
  );
}
