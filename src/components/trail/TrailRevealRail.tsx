/**
 * WhoDoI Trail — Bottom reveal rail: fragments, artifacts, progress.
 */
import { useTrail } from "./TrailContext";

export function TrailRevealRail() {
  const { state } = useTrail();
  const { caseFile, collectedFragments, revealedCards, score } = state;

  if (state.phase === "intro") return null;

  // Group fragments by archetype
  const archetypeGroups = caseFile.archetypes.map(arch => ({
    archetype: arch,
    fragments: caseFile.fragments.filter(f => f.archetypeId === arch.id),
  }));

  const totalFrags = caseFile.fragments.length;
  const collected = collectedFragments.size;

  return (
    <div className="h-24 shrink-0 border-t flex items-center px-4 gap-6 overflow-x-auto"
      style={{ background: "#20232B", borderColor: "rgba(245,241,232,0.08)" }}>

      {/* Fragment progress */}
      <div className="shrink-0">
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "#B9C0CC" }}>
          Archetype Fragments
        </p>
        <div className="flex items-center gap-1">
          {caseFile.fragments.map(frag => (
            <div
              key={frag.id}
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all"
              style={{
                background: collectedFragments.has(frag.id)
                  ? caseFile.archetypes.find(a => a.id === frag.archetypeId)?.colorAccent || "#F2C14E"
                  : "#2A2E38",
                color: collectedFragments.has(frag.id) ? "#17181D" : "#B9C0CC",
                border: `1px solid ${collectedFragments.has(frag.id)
                  ? "transparent"
                  : "rgba(245,241,232,0.08)"}`,
              }}
              title={collectedFragments.has(frag.id) ? frag.label : "???"}
              aria-label={collectedFragments.has(frag.id) ? `Collected: ${frag.label}` : "Locked fragment"}
            >
              {collectedFragments.has(frag.id) ? "★" : "?"}
            </div>
          ))}
        </div>
        <p className="text-[10px] font-mono mt-1" style={{ color: "#B9C0CC" }}>
          {collected}/{totalFrags} collected
        </p>
      </div>

      {/* Divider */}
      <div className="w-px h-12 shrink-0" style={{ background: "rgba(245,241,232,0.08)" }} />

      {/* Artifact prize slots */}
      <div className="shrink-0">
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "#B9C0CC" }}>
          Prize Artifacts
        </p>
        <div className="flex items-center gap-2">
          {caseFile.artifacts.map(art => {
            const isEarned = state.profile.artifactCollection.includes(art.id);
            return (
              <div
                key={art.id}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all"
                style={{
                  background: isEarned ? "#2A2E38" : "#20232B",
                  border: `1px ${isEarned ? "solid" : "dashed"} ${isEarned ? "#F2C14E40" : "rgba(245,241,232,0.06)"}`,
                }}
                title={isEarned ? art.name : "Locked"}
                aria-label={isEarned ? art.name : "Locked artifact slot"}
              >
                {isEarned ? art.emoji : "🔒"}
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-12 shrink-0" style={{ background: "rgba(245,241,232,0.08)" }} />

      {/* End-state preview */}
      <div className="shrink-0 flex-1 min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "#B9C0CC" }}>
          Emerging Identity
        </p>
        <div className="flex items-center gap-2">
          {archetypeGroups.map(g => {
            const frags = g.fragments;
            const found = frags.filter(f => collectedFragments.has(f.id)).length;
            const pct = frags.length > 0 ? (found / frags.length) * 100 : 0;
            return (
              <div key={g.archetype.id} className="flex items-center gap-1.5">
                <span className="text-lg">{g.archetype.emoji}</span>
                <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: "#2A2E38" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: g.archetype.colorAccent }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
