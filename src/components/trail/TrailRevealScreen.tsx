/**
 * WhoDoI Trail — Final reveal screen after case completion.
 */
import { useTrail } from "./TrailContext";
import { getRank } from "./types";
import { RotateCcw, Share2, BookmarkPlus, Trophy } from "lucide-react";

export function TrailRevealScreen() {
  const { state, resetGame } = useTrail();
  const { finalArchetype, finalArtifact, score, profile, caseFile } = state;

  if (!finalArchetype || !finalArtifact) return null;

  const rank = getRank(score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(23,24,29,0.92)" }}>
      <div className="w-full max-w-lg mx-4 rounded-2xl border overflow-hidden animate-scale-in"
        style={{ background: "#20232B", borderColor: `${finalArchetype.colorAccent}30` }}>

        {/* Header glow */}
        <div className="relative p-8 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(ellipse at center, ${finalArchetype.colorAccent}40 0%, transparent 70%)` }} />
          <div className="relative">
            <p className="text-xs font-mono uppercase tracking-[0.2em] mb-3" style={{ color: "#B9C0CC" }}>
              Case Closed — Identity Revealed
            </p>
            <span className="text-6xl block mb-3">{finalArchetype.emoji}</span>
            <h2 className="text-2xl font-bold mb-2" style={{ color: finalArchetype.colorAccent }}>
              {finalArchetype.title}
            </h2>
            <p className="text-sm italic" style={{ color: "#F5F1E8" }}>
              "{finalArchetype.verdict}"
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {/* Traits */}
          <div className="p-3 rounded-lg" style={{ background: "#2A2E38" }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#B9C0CC" }}>
              Company World Traits
            </p>
            <div className="flex flex-wrap gap-1.5">
              {finalArchetype.traits.map(t => (
                <span key={t} className="px-2 py-0.5 rounded text-xs font-mono"
                  style={{ background: `${finalArchetype.colorAccent}15`, color: finalArchetype.colorAccent, border: `1px solid ${finalArchetype.colorAccent}25` }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Worker impact */}
          <div className="p-3 rounded-lg" style={{ background: "#2A2E38" }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#F2C14E" }}>
              💡 What This Means for a Worker
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#F5F1E8" }}>
              {finalArchetype.workerImpact}
            </p>
          </div>

          {/* Artifact prize */}
          <div className="flex items-center gap-3 p-3 rounded-lg border"
            style={{ background: "#17181D", borderColor: "#F2C14E25" }}>
            <span className="text-3xl">{finalArtifact.emoji}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold" style={{ color: "#F5F1E8" }}>{finalArtifact.name}</p>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                  style={{
                    background: finalArtifact.rarity === "legendary" ? "#F2C14E20" : "#2A2E38",
                    color: finalArtifact.rarity === "legendary" ? "#F2C14E" : "#B9C0CC",
                  }}>
                  {finalArtifact.rarity}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#B9C0CC" }}>
                {finalArtifact.description}
              </p>
            </div>
          </div>

          {/* Score summary */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#2A2E38" }}>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "#F2C14E" }}>{score}</p>
              <p className="text-[10px] font-mono" style={{ color: "#B9C0CC" }}>SCORE</p>
            </div>
            <div className="text-center">
              <p className="text-lg">{rank.badge}</p>
              <p className="text-[10px] font-mono" style={{ color: "#B9C0CC" }}>{rank.title.toUpperCase()}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "#63D471" }}>{state.revealedCards.size}</p>
              <p className="text-[10px] font-mono" style={{ color: "#B9C0CC" }}>CLUES</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "#9B7BFF" }}>{state.revealedConnections.size}</p>
              <p className="text-[10px] font-mono" style={{ color: "#B9C0CC" }}>LINKS</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={resetGame}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "#2A2E38", color: "#F5F1E8" }}>
              <RotateCcw className="w-4 h-4" /> Try Another Path
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "#F2C14E", color: "#17181D" }}>
              <Share2 className="w-4 h-4" /> Share Result
            </button>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs transition-all hover:opacity-80"
              style={{ background: "#2A2E38", color: "#B9C0CC" }}>
              <BookmarkPlus className="w-3.5 h-3.5" /> Save Result
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs transition-all hover:opacity-80"
              style={{ background: "#2A2E38", color: "#B9C0CC" }}>
              <Trophy className="w-3.5 h-3.5" /> Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
