/**
 * WhoDoI Trail — Bottom reveal rail with polished styling.
 */
import { useTrail } from "./TrailContext";

export function TrailRevealRail() {
  const { state } = useTrail();
  const { caseFile, collectedFragments, score } = state;

  if (state.phase === "intro") return null;

  const archetypeGroups = caseFile.archetypes.map(arch => ({
    archetype: arch,
    fragments: caseFile.fragments.filter(f => f.archetypeId === arch.id),
  }));

  return (
    <div className="h-[72px] shrink-0 flex items-center px-5 gap-6 overflow-x-auto"
      style={{
        background: "linear-gradient(180deg, #1A1D28 0%, #171A24 100%)",
        borderTop: "1px solid rgba(242,193,78,0.08)",
      }}>

      {/* Fragments */}
      <div className="shrink-0">
        <p className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "#B9C0CC" }}>
          Fragments
        </p>
        <div className="flex items-center gap-0.5">
          {caseFile.fragments.map(frag => {
            const collected = collectedFragments.has(frag.id);
            const archColor = caseFile.archetypes.find(a => a.id === frag.archetypeId)?.colorAccent || "#F2C14E";
            return (
              <div key={frag.id}
                className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold transition-all"
                style={{
                  background: collected ? archColor : "#1E222C",
                  color: collected ? "#17181D" : "#B9C0CC",
                  border: `1px solid ${collected ? "transparent" : "rgba(245,241,232,0.06)"}`,
                  boxShadow: collected ? `0 0 8px ${archColor}40` : "none",
                }}
                title={collected ? frag.label : "???"}
              >
                {collected ? "★" : "·"}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-px h-10 shrink-0" style={{ background: "rgba(245,241,232,0.06)" }} />

      {/* Artifacts */}
      <div className="shrink-0">
        <p className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "#B9C0CC" }}>
          Artifacts
        </p>
        <div className="flex items-center gap-1.5">
          {caseFile.artifacts.map(art => {
            const isEarned = state.profile.artifactCollection.includes(art.id);
            return (
              <div key={art.id}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all"
                style={{
                  background: isEarned ? "#1E222C" : "#14161E",
                  border: `1px ${isEarned ? "solid" : "dashed"} ${isEarned ? "rgba(242,193,78,0.25)" : "rgba(245,241,232,0.06)"}`,
                  boxShadow: isEarned ? "0 0 12px rgba(242,193,78,0.15)" : "none",
                }}
                title={isEarned ? art.name : "Locked"}
              >
                {isEarned ? art.emoji : "🔒"}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-px h-10 shrink-0" style={{ background: "rgba(245,241,232,0.06)" }} />

      {/* Archetype progress */}
      <div className="shrink-0 flex-1 min-w-0">
        <p className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "#B9C0CC" }}>
          Emerging Identity
        </p>
        <div className="flex items-center gap-3">
          {archetypeGroups.map(g => {
            const found = g.fragments.filter(f => collectedFragments.has(f.id)).length;
            const pct = g.fragments.length > 0 ? (found / g.fragments.length) * 100 : 0;
            return (
              <div key={g.archetype.id} className="flex items-center gap-1.5">
                <span className="text-base">{g.archetype.emoji}</span>
                <div className="w-14 h-2 rounded-full overflow-hidden" style={{ background: "#1E222C" }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: g.archetype.colorAccent }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
