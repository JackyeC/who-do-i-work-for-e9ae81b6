import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { SignupGate } from "@/components/SignupGate";
import { EPISODE_2 } from "@/data/no-regrets-episodes";
import type { Choice, PlayerStats } from "@/types/no-regrets-game";

function applyChanges(base: PlayerStats, changes: Partial<PlayerStats>): PlayerStats {
  return {
    money: Math.max(0, Math.min(100, base.money + (changes.money ?? 0))),
    safety: Math.max(0, Math.min(100, base.safety + (changes.safety ?? 0))),
    sanity: Math.max(0, Math.min(100, base.sanity + (changes.sanity ?? 0))),
    power: Math.max(0, Math.min(100, base.power + (changes.power ?? 0))),
  };
}

function ReceiptPanel({ choice }: { choice: Choice }) {
  if (!choice.receiptHints?.length) return null;
  return (
    <div className="mt-3 space-y-1.5 pl-4 border-l-2 border-primary/20">
      {choice.receiptHints.map((h, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-sm shrink-0">{h.emoji}</span>
          <p className="text-[11px] text-muted-foreground leading-snug">
            <span className="font-semibold text-foreground/80">{h.label}:</span> {h.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function NoRegretsEpisode2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const episode = EPISODE_2;
  const [choosing, setChoosing] = useState(false);
  const [baseStats, setBaseStats] = useState(episode.initialStats);

  // Carry over stats from Episode 1 if available
  useEffect(() => {
    const raw = sessionStorage.getItem("noRegrets_ep1");
    if (raw) {
      try {
        const ep1 = JSON.parse(raw);
        if (ep1.stats) setBaseStats(ep1.stats);
      } catch { /* use defaults */ }
    }
  }, []);

  const handleChoose = useCallback((choice: Choice) => {
    setChoosing(true);
    const newStats = applyChanges(baseStats, choice.statChanges);
    sessionStorage.setItem(
      "noRegrets_ep2",
      JSON.stringify({
        choiceId: choice.id,
        stats: newStats,
        previousStats: baseStats,
        recapText: choice.recapText,
        companyArchetype: choice.archetype,
      })
    );
    setTimeout(() => navigate("/no-regrets-game/episode-2-recap"), 400);
  }, [baseStats, navigate]);

  return (
    <EpisodeShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{episode.title}</h2>
          <p className="text-xs text-muted-foreground mt-1 italic">What kind of company lies to you best?</p>
          <div className="h-0.5 w-16 bg-primary/40 mt-2 rounded-full" />
        </div>

        <div className="space-y-4">
          {episode.narrative.map((p, i) => (
            <p key={i} className="text-sm md:text-base text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>

        <StatsBar stats={baseStats} />

        {user ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Choose your next employer</p>
            {episode.choices.map((choice) => (
              <div key={choice.id}>
                <button
                  onClick={() => handleChoose(choice)}
                  disabled={choosing}
                  className="w-full text-left p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-accent/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span className="text-sm font-medium text-foreground leading-relaxed">{choice.label}</span>
                </button>
                <ReceiptPanel choice={choice} />
              </div>
            ))}
          </div>
        ) : (
          <SignupGate feature="story choices">
            <div className="space-y-3">
              {episode.choices.map((choice) => (
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
