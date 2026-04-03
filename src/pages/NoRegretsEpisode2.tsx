import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { SignupGate } from "@/components/SignupGate";
import { EPISODE_2 } from "@/data/no-regrets-episodes";
import { trackNoRegrets } from "@/lib/noRegretsAnalytics";
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
    <div className="mt-2 ml-11 rounded-lg border border-border/20 bg-card/30 p-3 space-y-2">
      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50">Signals detected</p>
      {choice.receiptHints.map((h, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <span className="text-xs shrink-0 mt-0.5">{h.emoji}</span>
          <p className="text-[11px] text-muted-foreground leading-snug">
            <span className="font-semibold text-foreground/70">{h.label}:</span> {h.detail}
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
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/60">Season 1</p>
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{episode.title}</h2>
        <p className="text-xs text-muted-foreground italic">What kind of company lies to you best?</p>
        <div className="h-px w-12 bg-primary/30 mt-1" />
      </div>

      <div className="rounded-xl border border-border/20 bg-card/30 p-5 md:p-6 space-y-4">
        {episode.narrative.map((p, i) => (
          <p key={i} className="text-sm md:text-[15px] text-muted-foreground leading-[1.8]">{p}</p>
        ))}
      </div>

      <StatsBar stats={baseStats} />

      {user ? (
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">
            Choose your next employer
          </p>
          {episode.choices.map((choice, idx) => (
            <div key={choice.id}>
              <button
                onClick={() => handleChoose(choice)}
                disabled={choosing}
                className="group w-full text-left rounded-xl border border-border/40 bg-card/60 hover:bg-card hover:border-primary/30 active:scale-[0.99] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex items-start gap-4 p-4 md:p-5">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-muted/40 border border-border/30 flex items-center justify-center text-xs font-mono font-bold text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm md:text-[15px] text-foreground/90 leading-relaxed group-hover:text-foreground transition-colors">
                    {choice.label}
                  </span>
                </div>
              </button>
              <ReceiptPanel choice={choice} />
            </div>
          ))}
        </div>
      ) : (
        <SignupGate feature="story choices">
          <div className="space-y-3">
            {episode.choices.map((choice) => (
              <div key={choice.id} className="p-4 rounded-xl border border-border/30 bg-card/40 opacity-50">
                <span className="text-sm text-foreground">{choice.label}</span>
              </div>
            ))}
          </div>
        </SignupGate>
      )}
    </EpisodeShell>
  );
}
