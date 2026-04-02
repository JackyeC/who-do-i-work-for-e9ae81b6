/**
 * WhoDoI Trail — Top bar with premium navy/gold treatment.
 */
import { Settings, User, Zap, Search } from "lucide-react";
import { useTrail } from "./TrailContext";
import { getRank, RANK_THRESHOLDS } from "./types";

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
    <header className="h-14 flex items-center justify-between px-4 shrink-0"
      style={{
        background: "linear-gradient(180deg, #1A1D28 0%, #171A24 100%)",
        borderBottom: "1px solid rgba(242,193,78,0.1)",
      }}>
      {/* Left: Branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Search className="w-4 h-4" style={{ color: "#F2C14E" }} />
          <span className="text-base font-bold tracking-tight" style={{ color: "#F2C14E" }}>WhoDoI</span>
          <span className="text-base font-light tracking-tight" style={{ color: "#F5F1E8" }}>Trail</span>
        </div>
        {state.phase !== "intro" && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
            style={{ background: "rgba(242,193,78,0.08)", border: "1px solid rgba(242,193,78,0.15)" }}>
            <span style={{ color: "#F2C14E" }}>📁</span>
            <span className="font-medium" style={{ color: "#F5F1E8" }}>{state.caseFile.companyName}</span>
          </div>
        )}
      </div>

      {/* Center: Progress bar */}
      {state.phase !== "intro" && (
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-sm mx-6">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#2A2E38" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(revealedCount / totalCards) * 100}%`,
                background: "linear-gradient(90deg, #F2C14E, #FF9F43)",
              }} />
          </div>
          <span className="text-[11px] font-mono tabular-nums whitespace-nowrap" style={{ color: "#B9C0CC" }}>
            {revealedCount}/{totalCards}
          </span>
        </div>
      )}

      {/* Right: Score + Rank */}
      <div className="flex items-center gap-2">
        {/* Score */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(242,193,78,0.1)", border: "1px solid rgba(242,193,78,0.15)" }}>
          <Zap className="w-3.5 h-3.5" style={{ color: "#F2C14E" }} />
          <span className="text-xs font-bold tabular-nums" style={{ color: "#F2C14E" }}>{state.score}</span>
        </div>

        {/* Rank */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "#1E222C" }}>
          <span className="text-sm">{rank.badge}</span>
          <span className="text-xs font-medium" style={{ color: "#F5F1E8" }}>{rank.title}</span>
        </div>

        {/* Rank progress mini */}
        <div className="hidden sm:flex items-center">
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#2A2E38" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "#9B7BFF" }} />
          </div>
        </div>

        {/* Buttons */}
        <button className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-[#2A2E38]"
          style={{ color: "#B9C0CC" }} aria-label="Settings">
          <Settings className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-[#2A2E38]"
          style={{ color: "#B9C0CC" }} aria-label="Profile">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
