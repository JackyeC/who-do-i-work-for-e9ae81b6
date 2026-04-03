import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { ChoiceButtons } from "@/components/no-regrets-game/ChoiceButtons";
import { SignupGate } from "@/components/SignupGate";
import { EPISODE_1 } from "@/data/no-regrets-episodes";
import type { Choice, PlayerStats } from "@/types/no-regrets-game";

function applyChanges(base: PlayerStats, changes: Partial<PlayerStats>): PlayerStats {
  return {
    money: Math.max(0, Math.min(100, base.money + (changes.money ?? 0))),
    safety: Math.max(0, Math.min(100, base.safety + (changes.safety ?? 0))),
    sanity: Math.max(0, Math.min(100, base.sanity + (changes.sanity ?? 0))),
    power: Math.max(0, Math.min(100, base.power + (changes.power ?? 0))),
  };
}

export default function NoRegretsGame() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const episode = EPISODE_1;
  const [choosing, setChoosing] = useState(false);

  const handleChoose = useCallback((choice: Choice) => {
    setChoosing(true);
    const newStats = applyChanges(episode.initialStats, choice.statChanges);

    // Persist choice to sessionStorage for recap screen (v1 simple approach)
    sessionStorage.setItem(
      "noRegrets_ep1",
      JSON.stringify({ choiceId: choice.id, stats: newStats, previousStats: episode.initialStats, recapText: choice.recapText, archetype: choice.archetype })
    );

    setTimeout(() => navigate("/no-regrets-game/episode-1-recap"), 400);
  }, [episode, navigate]);

  return (
    <EpisodeShell>
      <div className="space-y-6">
        {/* Episode title */}
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{episode.title}</h2>
          <div className="h-0.5 w-16 bg-primary/40 mt-2 rounded-full" />
        </div>

        {/* Narrative */}
        <div className="space-y-4">
          {episode.narrative.map((p, i) => (
            <p key={i} className="text-sm md:text-base text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>

        {/* Stats */}
        <StatsBar stats={episode.initialStats} />

        {/* Choices — gated for logged-out users */}
        {user ? (
          <ChoiceButtons choices={episode.choices} onChoose={handleChoose} disabled={choosing} />
        ) : (
          <SignupGate feature="story choices">
            <ChoiceButtons choices={episode.choices} onChoose={() => {}} disabled />
          </SignupGate>
        )}
      </div>
    </EpisodeShell>
  );
}
