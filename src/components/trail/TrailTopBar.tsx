/**
 * WhoDoI Trail — Top bar with branding, score, rank, progress.
 */
import { Settings, User, Zap } from "lucide-react";
import { useTrail } from "./TrailContext";
import { getRank, RANK_THRESHOLDS } from "./types";
import { Progress } from "@/components/ui/progress";

export function TrailTopBar() {
  const { state } = useTrail();
  const rank = getRank(state.score);
  const nextRank = RANK_THRESHOLDS.find(t => t.score > state.score);
  const progress = nextRank
    ? ((state.score - rank.score) / (nextRank.score - rank.score)) * 100
    : 100;

  const revealedCount = state.revealedCards.size;
  const totalCards = state.caseFile.cards.length;

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b shrink-0"
      style={{ background: "#20232B", borderColor: "rgba(245,241,232,0.08)" }}>
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold tracking-tight" style={{ color: "#F2C14E" }}>WhoDoI</span>
          <span className="text-lg font-light tracking-tight" style={{ color: "#F5F1E8" }}>Trail</span>
        </div>
        {state.phase !== "intro" && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono"
            style={{ background: "#2A2E38", color: "#B9C0CC" }}>
            📁 {state.caseFile.companyName}
          </div>
        )}
      </div>

      {/* Center: Progress */}
      {state.phase !== "intro" && (
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-6">
          <span className="text-xs font-mono whitespace-nowrap" style={{ color: "#B9C0CC" }}>
            {revealedCount}/{totalCards} clues
          </span>
          <Progress value={(revealedCount / totalCards) * 100} className="h-2 flex-1"
            style={{ background: "#2A2E38" }} />
        </div>
      )}

      {/* Right: Score + Rank + Actions */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono"
          style={{ background: "#2A2E38", color: "#F2C14E" }}>
          <Zap className="w-3.5 h-3.5" />
          {state.score}
        </div>
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs"
          style={{ background: "#2A2E38", color: "#F5F1E8" }}>
          <span>{rank.badge}</span>
          <span className="font-medium">{rank.title}</span>
        </div>
        <div className="hidden sm:block">
          <Progress value={progress} className="h-1.5 w-16" style={{ background: "#2A2E38" }} />
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: "#2A2E38", color: "#B9C0CC" }}
          aria-label="Settings">
          <Settings className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: "#2A2E38", color: "#B9C0CC" }}
          aria-label="Profile">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
