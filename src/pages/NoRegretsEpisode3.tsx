import { useState, useCallback, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { SignupGate } from "@/components/SignupGate";
import { EPISODE_3 } from "@/data/no-regrets-episodes";
import type { Choice, PlayerStats, CompanyArchetype, EpisodeBranch } from "@/types/no-regrets-game";

function applyChanges(base: PlayerStats, changes: Partial<PlayerStats>): PlayerStats {
  return {
    money: Math.max(0, Math.min(100, base.money + (changes.money ?? 0))),
    safety: Math.max(0, Math.min(100, base.safety + (changes.safety ?? 0))),
    sanity: Math.max(0, Math.min(100, base.sanity + (changes.sanity ?? 0))),
    power: Math.max(0, Math.min(100, base.power + (changes.power ?? 0))),
  };
}

function SignalCard({ emoji, title, detail, variant }: { emoji: string; title: string; detail: string; variant: "warning" | "justification" }) {
  const borderColor = variant === "warning" ? "border-[hsl(var(--destructive))]/30" : "border-primary/20";
  const bgColor = variant === "warning" ? "bg-[hsl(var(--destructive))]/5" : "bg-primary/5";
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 space-y-2`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <h4 className="text-xs font-mono uppercase tracking-widest text-foreground/80">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed italic">{detail}</p>
    </div>
  );
}

export default function NoRegretsEpisode3() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [choosing, setChoosing] = useState(false);
  const [baseStats, setBaseStats] = useState(EPISODE_3.initialStats);
  const [branch, setBranch] = useState<EpisodeBranch | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("noRegrets_ep2");
    if (raw) {
      try {
        const ep2 = JSON.parse(raw);
        if (ep2.stats) setBaseStats(ep2.stats);
        const archetype = ep2.companyArchetype as CompanyArchetype;
        const found = EPISODE_3.branches?.find(b => b.forArchetype === archetype);
        if (found) setBranch(found);
      } catch { /* fallback */ }
    }
  }, []);

  const handleChoose = useCallback((choice: Choice) => {
    setChoosing(true);
    const newStats = applyChanges(baseStats, choice.statChanges);
    sessionStorage.setItem(
      "noRegrets_ep3",
      JSON.stringify({
        choiceId: choice.id,
        stats: newStats,
        previousStats: baseStats,
        recapText: choice.recapText,
        consequenceLabel: choice.archetype,
      })
    );
    setTimeout(() => navigate("/no-regrets-game/episode-3-recap"), 400);
  }, [baseStats, navigate]);

  // Need Episode 2 data to branch
  if (!branch) {
    const raw = sessionStorage.getItem("noRegrets_ep2");
    if (!raw) return <Navigate to="/no-regrets-game/episode-2" replace />;
    return null;
  }

  return (
    <EpisodeShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{EPISODE_3.title}</h2>
          <p className="text-xs text-muted-foreground mt-1 italic">What did that choice cost you?</p>
          <div className="h-0.5 w-16 bg-primary/40 mt-2 rounded-full" />
        </div>

        {/* Shared intro */}
        {EPISODE_3.narrative.map((p, i) => (
          <p key={`intro-${i}`} className="text-sm md:text-base text-muted-foreground leading-relaxed">{p}</p>
        ))}

        {/* Branched narrative */}
        <div className="space-y-4">
          {branch.narrative.map((p, i) => (
            <p key={i} className="text-sm md:text-base text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>

        {/* Warning sign + Self-justification */}
        <div className="grid gap-4 md:grid-cols-2">
          <SignalCard {...branch.warningSign} variant="warning" />
          <SignalCard {...branch.selfJustification} variant="justification" />
        </div>

        <StatsBar stats={baseStats} />

        {user ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">What now?</p>
            {branch.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoose(choice)}
                disabled={choosing}
                className="w-full text-left p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-accent/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="text-sm font-medium text-foreground leading-relaxed">{choice.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <SignupGate feature="story choices">
            <div className="space-y-3">
              {branch.choices.map((choice) => (
                <div key={choice.id} className="p-4 rounded-xl border border-border/50 bg-card opacity-60">
                  <span className="text-sm text-foreground">{choice.label}</span>
                </div>
              ))}
            </div>
          </SignupGate>
        )}
      </div>
    </EpisodeShell>
  );
}
