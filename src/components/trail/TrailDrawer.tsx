/**
 * WhoDoI Trail — Right drawer: deep-dive evidence detail.
 * Editorial pull-quote style, not dashboard.
 */
import { useTrail } from "./TrailContext";
import { X, ExternalLink, Link2, ShieldCheck, Shield, ShieldAlert, ShieldQuestion, ArrowRight, Sparkles } from "lucide-react";
import type { ConfidenceState, CardCategory, BarDatum } from "./types";

const CONFIDENCE_META: Record<ConfidenceState, { icon: typeof Shield; label: string; color: string; desc: string; micro: string }> = {
  verified: { icon: ShieldCheck, label: "Verified", color: "#63D471", desc: "Confirmed via official records or filings.", micro: "This is on the record." },
  partial: { icon: Shield, label: "Partially Verified", color: "#FF9F43", desc: "Cross-referenced but not fully confirmed.", micro: "Strong signal, not locked in." },
  emerging: { icon: ShieldAlert, label: "Emerging Signal", color: "#F2C14E", desc: "Detected pattern — not yet independently verified.", micro: "We're watching this one." },
  unverified: { icon: ShieldQuestion, label: "Unverified", color: "#B9C0CC", desc: "Reported but not confirmed.", micro: "Tip received. Investigating." },
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
    <div className="space-y-2.5">
      {bars.map((bar, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px]" style={{ color: "#B9C0CC" }}>{bar.label}</span>
            <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: bar.color || "#F5F1E8" }}>
              {bar.value >= 1000 ? formatCompact(bar.value) : bar.value}
            </span>
          </div>
          <div className="h-3 rounded-sm overflow-hidden" style={{ background: "rgba(15,17,24,0.8)" }}>
            <div className="h-full rounded-sm"
              style={{
                width: `${(bar.value / max) * 100}%`,
                background: `linear-gradient(90deg, ${bar.color || "#F2C14E"}, ${bar.color || "#F2C14E"}AA)`,
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }} />
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
      <aside className="w-[320px] shrink-0 hidden lg:flex flex-col items-center justify-center"
        style={{ background: "#131620", borderLeft: "1px solid rgba(242,193,78,0.06)" }}>
        <div className="text-center px-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
            style={{ background: "rgba(242,193,78,0.05)", border: "1px solid rgba(242,193,78,0.08)" }}>
            🔎
          </div>
          <div>
            <p className="text-[12px] font-semibold mb-1" style={{ color: "#F5F1E8" }}>
              Select evidence to investigate
            </p>
            <p className="text-[10px] italic" style={{ color: "#B9C0CC" }}>
              Click any card on the board to see the full breakdown, data, connections, and sources.
            </p>
          </div>
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
    <aside className="w-[340px] shrink-0 overflow-y-auto flex flex-col"
      style={{ background: "#131620", borderLeft: "1px solid rgba(242,193,78,0.06)" }}>

      {/* Header */}
      <div className="flex items-center justify-between p-4"
        style={{ borderBottom: `1px solid ${accent}15` }}>
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold" style={{ color: accent }}>
          Deep Dive
        </span>
        <button onClick={() => selectCard(null)} className="p-1.5 rounded-lg hover:bg-[#1E222C] transition-colors"
          style={{ color: "#B9C0CC" }} aria-label="Close panel">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Title section */}
        <div>
          {isPerson && card.personMeta ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${accent}25, ${accent}50)`, color: accent, border: `2px solid ${accent}50`, boxShadow: `0 0 20px ${accent}15` }}>
                {card.personMeta.photoInitials}
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "#F5F1E8" }}>{card.title}</h3>
                <p className="text-[11px] font-mono font-semibold" style={{ color: accent }}>{card.personMeta.role}</p>
                {card.personMeta.priorRole && (
                  <p className="text-[10px] italic" style={{ color: "#B9C0CC" }}>← {card.personMeta.priorRole}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${accent}10`, border: `1px solid ${accent}15` }}>
                {card.icon}
              </div>
              <div>
                {viz?.headline && (
                  <p className="text-2xl font-black tabular-nums tracking-tight mb-0.5" style={{ color: accent }}>
                    {viz.headline}
                    {viz.headlineLabel && (
                      <span className="text-[8px] font-mono uppercase ml-2 tracking-wider" style={{ color: "#B9C0CC" }}>
                        {viz.headlineLabel}
                      </span>
                    )}
                  </p>
                )}
                <h3 className="text-sm font-bold" style={{ color: "#F5F1E8" }}>{card.title}</h3>
              </div>
            </div>
          )}
          <p className="text-[11px] leading-relaxed italic pl-1"
            style={{ color: "#D4CFC5", borderLeft: `2px solid ${accent}30`, paddingLeft: "10px" }}>
            {card.takeaway}
          </p>
        </div>

        {/* Stats row */}
        {(isPerson ? card.personMeta?.stats : viz?.stats) && (
          <div className="flex flex-wrap gap-1.5">
            {(isPerson ? card.personMeta!.stats : viz!.stats!).map((s, i) => (
              <div key={i} className="px-2.5 py-1.5 rounded-lg" style={{ background: "#0F1118", border: `1px solid ${s.color || "#F5F1E8"}10` }}>
                <p className="text-xs font-bold tabular-nums" style={{ color: s.color || "#F5F1E8" }}>{s.value}</p>
                <p className="text-[8px] font-mono uppercase tracking-wider" style={{ color: "#B9C0CC" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Bar chart */}
        {(isPerson ? card.personMeta?.barData : viz?.bars) && (
          <div className="p-3.5 rounded-xl" style={{ background: "#171B25", border: "1px solid rgba(245,241,232,0.03)" }}>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] mb-3" style={{ color: "#B9C0CC" }}>
              📊 Breakdown
            </p>
            <DetailBarChart bars={(isPerson ? card.personMeta!.barData! : viz!.bars!)} />
          </div>
        )}

        {/* Breakdown list */}
        {viz?.breakdown && (
          <div className="p-3.5 rounded-xl" style={{ background: "#171B25", border: "1px solid rgba(245,241,232,0.03)" }}>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] mb-2.5" style={{ color: "#B9C0CC" }}>
              📋 Itemized
            </p>
            <div className="space-y-1.5">
              {viz.breakdown.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-[11px] px-2.5 py-2 rounded-lg"
                  style={{ background: item.highlight ? `${accent}08` : "transparent" }}>
                  <span style={{ color: "#B9C0CC" }}>{item.label}</span>
                  <span className="font-mono font-semibold text-right shrink-0" style={{ color: item.highlight ? accent : "#F5F1E8" }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why it matters — pull quote */}
        <div className="p-4 rounded-xl relative overflow-hidden" style={{ background: "#171B25" }}>
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: "#F2C14E" }} />
          <h4 className="text-[9px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: "#F2C14E" }}>
            💡 Why It Matters
          </h4>
          <p className="text-[12px] leading-relaxed" style={{ color: "#D4CFC5" }}>{card.whyItMatters}</p>
        </div>

        {/* Confidence */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl" style={{ background: "#171B25" }}>
          <ConfIcon className="w-4.5 h-4.5 mt-0.5 shrink-0" style={{ color: conf.color }} />
          <div>
            <p className="text-[11px] font-bold mb-0.5" style={{ color: conf.color }}>{conf.label}</p>
            <p className="text-[10px] italic" style={{ color: "#B9C0CC" }}>{conf.micro}</p>
          </div>
        </div>

        {/* Connections */}
        {relatedConns.length > 0 && (
          <div>
            <h4 className="text-[9px] font-mono uppercase tracking-[0.2em] mb-2.5 flex items-center gap-1.5"
              style={{ color: accent }}>
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
                    className="w-full text-left p-3 rounded-xl transition-all text-xs group"
                    style={{
                      background: isFound ? `${accent}06` : "#171B25",
                      border: `1px solid ${isFound ? `${accent}20` : "rgba(245,241,232,0.03)"}`,
                      boxShadow: isFound ? `0 0 12px ${accent}08` : "none",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{other?.icon}</span>
                      <span className="font-medium" style={{ color: isFound ? accent : "#F5F1E8" }}>
                        {isFound ? "✓ " : ""}{other?.title}
                      </span>
                      {!isFound && <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }} />}
                    </div>
                    {isFound && <p className="text-[10px] font-mono mt-1.5 pl-7" style={{ color: "#B9C0CC" }}>{conn.label}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Source */}
        <div className="p-4 rounded-xl relative overflow-hidden" style={{ background: "#171B25" }}>
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: accent }} />
          <h4 className="text-[9px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: accent }}>
            🧾 The Receipt
          </h4>
          <p className="text-[10px] italic mb-2.5" style={{ color: "#B9C0CC" }}>
            Source data from FEC filings, SEC disclosures, NLRB records, and verified public reports.
          </p>
          <button className="flex items-center gap-1.5 text-[11px] font-mono font-semibold hover:underline transition-all"
            style={{ color: "#F2C14E" }}>
            <ExternalLink className="w-3 h-3" /> See the receipts →
          </button>
        </div>
      </div>
    </aside>
  );
}
