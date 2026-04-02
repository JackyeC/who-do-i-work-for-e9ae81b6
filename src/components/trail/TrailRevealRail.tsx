/**
 * WhoDoI Trail — Bottom reveal rail with collectible shelf feel.
 */
import { useTrail } from "./TrailContext";
import { Sparkles } from "lucide-react";

export function TrailRevealRail() {
  const { state } = useTrail();
  const { caseFile, collectedFragments } = state;

  if (state.phase === "intro") return null;

  const archetypeGroups = caseFile.archetypes.map(arch => ({
    archetype: arch,
    fragments: caseFile.fragments.filter(f => f.archetypeId === arch.id),
  }));

  return (
    <div className="h-[80px] shrink-0 flex items-center px-5 gap-6 overflow-x-auto"
      style={{
        background: "linear-gradient(180deg, #131620 0%, #0F1118 100%)",
        borderTop: "1px solid rgba(242,193,78,0.06)",
      }}>

      {/* Fragments */}
      <div className="shrink-0">
        <p className="text-[8px] font-mono uppercase tracking-[0.2em] mb-2 flex items-center gap-1" style={{ color: "#B9C0CC" }}>
          <Sparkles className="w-2.5 h-2.5" style={{ color: "#F2C14E" }} /> Fragments
        </p>
        <div className="flex items-center gap-1">
          {caseFile.fragments.map(frag => {
            const collected = collectedFragments.has(frag.id);
            const archColor = caseFile.archetypes.find(a => a.id === frag.archetypeId)?.colorAccent || "#F2C14E";
            return (
              <div key={frag.id}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all"
                style={{
                  background: collected ? `${archColor}20` : "#151820",
                  color: collected ? archColor : "rgba(185,192,204,0.3)",
                  border: `1px solid ${collected ? `${archColor}40` : "rgba(245,241,232,0.04)"}`,
                  boxShadow: collected ? `0 0 10px ${archColor}25` : "none",
                }}
                title={collected ? frag.label : "???"}
              >
                {collected ? "★" : "·"}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-px h-12 shrink-0" style={{ background: "rgba(245,241,232,0.04)" }} />

      {/* Artifact shelf */}
      <div className="shrink-0">
        <p className="text-[8px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: "#B9C0CC" }}>
          🏆 Prize Shelf
        </p>
        <div className="flex items-center gap-2">
          {caseFile.artifacts.map(art => {
            const isEarned = state.profile.artifactCollection.includes(art.id);
            return (
              <div key={art.id}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all relative"
                style={{
                  background: isEarned ? "rgba(242,193,78,0.06)" : "#0F1118",
                  border: `1px ${isEarned ? "solid" : "dashed"} ${isEarned ? "rgba(242,193,78,0.3)" : "rgba(245,241,232,0.04)"}`,
                  boxShadow: isEarned ? "0 0 16px rgba(242,193,78,0.12)" : "none",
                }}
                title={isEarned ? art.name : "Locked — complete a case to earn"}
              >
                {isEarned ? art.emoji : "🔒"}
                {isEarned && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
                    style={{ background: "#F2C14E", boxShadow: "0 0 6px rgba(242,193,78,0.5)" }}>
                    <span className="text-[7px]">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-px h-12 shrink-0" style={{ background: "rgba(245,241,232,0.04)" }} />

      {/* Archetype progress */}
      <div className="shrink-0 flex-1 min-w-0">
        <p className="text-[8px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: "#B9C0CC" }}>
          🔮 What Kind of Employer Is This?
        </p>
        <div className="flex items-center gap-4">
          {archetypeGroups.map(g => {
            const found = g.fragments.filter(f => collectedFragments.has(f.id)).length;
            const pct = g.fragments.length > 0 ? (found / g.fragments.length) * 100 : 0;
            return (
              <div key={g.archetype.id} className="flex items-center gap-2" title={g.archetype.title}>
                <span className="text-lg">{g.archetype.emoji}</span>
                <div className="w-16 h-2.5 rounded-full overflow-hidden" style={{ background: "#151820" }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${g.archetype.colorAccent}, ${g.archetype.colorAccent}80)`,
                      transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
                      boxShadow: pct > 0 ? `0 0 8px ${g.archetype.colorAccent}30` : "none",
                    }} />
                </div>
                <span className="text-[9px] font-mono tabular-nums" style={{ color: g.archetype.colorAccent }}>
                  {found}/{g.fragments.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
