/**
 * WhoDoI Trail — Top bar reframed for job seekers.
 */
import { Settings, User, Zap, Fingerprint } from "lucide-react";
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
    <header className="h-14 flex items-center justify-between px-5 shrink-0"
      style={{
        background: "linear-gradient(180deg, #131620 0%, #111419 100%)",
        borderBottom: "1px solid rgba(242,193,78,0.08)",
      }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Fingerprint className="w-4.5 h-4.5" style={{ color: "#F2C14E" }} />
          <span className="text-base font-black tracking-tight" style={{ color: "#F2C14E" }}>WhoDoI</span>
          <span className="text-base font-light tracking-tight" style={{ color: "#F5F1E8" }}>Trail</span>
        </div>
        {state.phase !== "intro" && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px]"
            style={{ background: "rgba(242,193,78,0.06)", border: "1px solid rgba(242,193,78,0.1)" }}>
            <span>📁</span>
            <span className="font-semibold" style={{ color: "#F5F1E8" }}>{state.caseFile.companyName}</span>
          </div>
        )}
      </div>

      {state.phase !== "intro" && (
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-6">
          <span className="text-[9px] font-mono uppercase tracking-wider whitespace-nowrap" style={{ color: "#B9C0CC" }}>
            Evidence
          </span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#1E222C" }}>
            <div className="h-full rounded-full"
              style={{
                width: `${(revealedCount / totalCards) * 100}%`,
                background: "linear-gradient(90deg, #F2C14E, #FF9F43)",
                transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
                boxShadow: "0 0 8px rgba(242,193,78,0.3)",
              }} />
          </div>
          <span className="text-[10px] font-mono tabular-nums font-bold whitespace-nowrap" style={{ color: "#F2C14E" }}>
            {revealedCount}/{totalCards}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(242,193,78,0.08)", border: "1px solid rgba(242,193,78,0.15)" }}>
          <Zap className="w-3.5 h-3.5" style={{ color: "#F2C14E" }} />
          <span className="text-xs font-black tabular-nums" style={{ color: "#F2C14E" }}>{state.score}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: "#1E222C" }}>
          <span className="text-sm">{rank.badge}</span>
          <span className="text-[11px] font-semibold" style={{ color: "#F5F1E8" }}>{rank.title}</span>
          <div className="w-14 h-2 rounded-full overflow-hidden" style={{ background: "#151820" }}>
            <div className="h-full rounded-full" style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #9B7BFF, #9B7BFF80)",
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        <button className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-[#1E222C]"
          style={{ color: "#B9C0CC" }} aria-label="Settings">
          <Settings className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-[#1E222C]"
          style={{ color: "#B9C0CC" }} aria-label="Profile">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
