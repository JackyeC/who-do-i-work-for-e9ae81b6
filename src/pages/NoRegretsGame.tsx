import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { ChoiceButtons } from "@/components/no-regrets-game/ChoiceButtons";
import { SignupGate } from "@/components/SignupGate";
import { EPISODE_1 } from "@/data/no-regrets-episodes";
import { trackNoRegrets } from "@/lib/noRegretsAnalytics";
import type { Choice, PlayerStats } from "@/types/no-regrets-game";
import ep1Hero from "@/assets/no-regrets-ep1-hero.jpg";

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

  useEffect(() => { trackNoRegrets("episode_1_started"); }, []);

  const handleChoose = useCallback((choice: Choice) => {
    setChoosing(true);
    trackNoRegrets("episode_1_completed", { player_archetype: choice.archetype });
    const newStats = applyChanges(episode.initialStats, choice.statChanges);
    sessionStorage.setItem(
      "noRegrets_ep1",
      JSON.stringify({ choiceId: choice.id, stats: newStats, previousStats: episode.initialStats, recapText: choice.recapText, archetype: choice.archetype })
    );
    navigate("/no-regrets-game/episode-1-recap");
  }, [episode, navigate]);

  return (
    <EpisodeShell>
      {/* Atmospheric hero image */}
      <div className="relative -mx-5 -mt-10 mb-6 overflow-hidden rounded-b-2xl">
        <img
          src={ep1Hero}
          alt=""
          width={1280}
          height={512}
          className="w-full h-40 md:h-56 object-cover object-center"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
      </div>

      {/* Episode title block */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/60">Season 1</p>
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{episode.title}</h2>
        <p className="text-xs text-muted-foreground italic">Who are you under pressure?</p>
        <div className="h-px w-12 bg-primary/30 mt-1" />
      </div>

      {/* Narrative block */}
      <div className="rounded-xl border border-border/20 bg-card/30 p-5 md:p-6 space-y-4">
        {episode.narrative.map((p, i) => (
          <p key={i} className="text-sm md:text-[15px] text-muted-foreground leading-[1.8]">{p}</p>
        ))}
      </div>

      {/* Stats */}
      <StatsBar stats={episode.initialStats} />

      {/* Choices */}
      {user ? (
        <ChoiceButtons
          choices={episode.choices}
          onChoose={handleChoose}
          disabled={choosing}
          postChoiceOverlay="Most people in panic mode choose something like this. Let's see what it costs."
        />
      ) : (
        <SignupGate feature="story choices">
          <ChoiceButtons choices={episode.choices} onChoose={() => {}} disabled />
        </SignupGate>
      )}
    </EpisodeShell>
  );
}
