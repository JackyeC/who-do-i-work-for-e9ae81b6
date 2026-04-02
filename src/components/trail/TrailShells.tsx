/**
 * WhoDoI Trail — Player profile, leaderboard, and settings shell modals.
 */
import { useTrail } from "./TrailContext";
import { getRank, RANK_THRESHOLDS } from "./types";
import type { CelebrationLevel } from "./types";

export function ProfileShell() {
  const { state } = useTrail();
  const { profile, caseFile } = state;
  const rank = getRank(profile.score);

  return (
    <div className="p-5 rounded-xl border space-y-4"
      style={{ background: "#20232B", borderColor: "rgba(245,241,232,0.08)" }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ background: "#2A2E38" }}>
          🕵️
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: "#F5F1E8" }}>{profile.name}</h3>
          <p className="text-xs" style={{ color: "#B9C0CC" }}>{rank.badge} {rank.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Score", value: profile.score, color: "#F2C14E" },
          { label: "Cases", value: profile.casesSolved, color: "#63D471" },
          { label: "Streak", value: profile.streak, color: "#FF9F43" },
        ].map(s => (
          <div key={s.label} className="p-2 rounded-lg" style={{ background: "#2A2E38" }}>
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-mono uppercase" style={{ color: "#B9C0CC" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Artifact shelf */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#B9C0CC" }}>
          Artifact Collection
        </p>
        <div className="flex gap-2">
          {caseFile.artifacts.map(a => (
            <div key={a.id} className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{
                background: profile.artifactCollection.includes(a.id) ? "#2A2E38" : "#17181D",
                border: `1px ${profile.artifactCollection.includes(a.id) ? "solid" : "dashed"} rgba(245,241,232,0.08)`,
              }}>
              {profile.artifactCollection.includes(a.id) ? a.emoji : "🔒"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LeaderboardShell() {
  const mockLeaders = [
    { rank: 1, name: "ReceiptHunter", score: 2840, badge: "🕵️" },
    { rank: 2, name: "TrailBlazer99", score: 2210, badge: "🤿" },
    { rank: 3, name: "CivicNerd", score: 1890, badge: "🧩" },
    { rank: 4, name: "WhoDoIKnow", score: 1540, badge: "🔍" },
    { rank: 5, name: "PaycheckSleuth", score: 1200, badge: "🧾" },
  ];

  return (
    <div className="p-5 rounded-xl border space-y-3"
      style={{ background: "#20232B", borderColor: "rgba(245,241,232,0.08)" }}>
      <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#F2C14E" }}>
        🏆 Seasonal Leaderboard
      </h3>
      {mockLeaders.map(l => (
        <div key={l.rank} className="flex items-center gap-3 p-2.5 rounded-lg"
          style={{ background: l.rank <= 3 ? "#2A2E38" : "transparent" }}>
          <span className="text-sm font-bold w-6 text-center"
            style={{ color: l.rank === 1 ? "#F2C14E" : l.rank === 2 ? "#B9C0CC" : l.rank === 3 ? "#FF9F43" : "#B9C0CC" }}>
            {l.rank}
          </span>
          <span className="text-lg">{l.badge}</span>
          <span className="text-xs font-medium flex-1" style={{ color: "#F5F1E8" }}>{l.name}</span>
          <span className="text-xs font-mono" style={{ color: "#F2C14E" }}>{l.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function SettingsShell() {
  const { state, dispatch } = useTrail();

  const celebOptions: { level: CelebrationLevel; label: string; desc: string }[] = [
    { level: "quiet", label: "Quiet", desc: "Minimal visual feedback" },
    { level: "standard", label: "Standard", desc: "Balanced animations" },
    { level: "extra", label: "Extra", desc: "Full celebration effects" },
  ];

  return (
    <div className="p-5 rounded-xl border space-y-4"
      style={{ background: "#20232B", borderColor: "rgba(245,241,232,0.08)" }}>
      <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#B9C0CC" }}>
        ⚙️ Game Settings
      </h3>

      {/* Celebration */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: "#F5F1E8" }}>Celebration Level</p>
        <div className="flex gap-2">
          {celebOptions.map(opt => (
            <button
              key={opt.level}
              onClick={() => dispatch({ type: "SET_CELEBRATION", level: opt.level })}
              className="flex-1 p-2 rounded-lg text-xs text-center transition-all"
              style={{
                background: state.celebration === opt.level ? "#2A2E38" : "#17181D",
                color: state.celebration === opt.level ? "#F2C14E" : "#B9C0CC",
                border: `1px solid ${state.celebration === opt.level ? "#F2C14E30" : "rgba(245,241,232,0.04)"}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reduced motion */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium" style={{ color: "#F5F1E8" }}>Reduced Motion</p>
          <p className="text-[10px]" style={{ color: "#B9C0CC" }}>Disable animations</p>
        </div>
        <button
          onClick={() => dispatch({ type: "SET_REDUCED_MOTION", enabled: !state.reducedMotion })}
          className="w-10 h-6 rounded-full relative transition-all"
          style={{ background: state.reducedMotion ? "#63D471" : "#2A2E38" }}
          role="switch"
          aria-checked={state.reducedMotion}
        >
          <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
            style={{
              background: "#F5F1E8",
              left: state.reducedMotion ? "calc(100% - 22px)" : "2px",
            }} />
        </button>
      </div>
    </div>
  );
}
