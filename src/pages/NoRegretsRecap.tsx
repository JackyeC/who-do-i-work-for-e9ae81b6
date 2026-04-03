import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { FollowTheMoneyTeaser } from "@/components/no-regrets-game/FollowTheMoneyTeaser";
import { ConversionModule } from "@/components/no-regrets-game/ConversionModule";
import { Button } from "@/components/ui/button";
import type { PlayerStats, PlayerArchetype } from "@/types/no-regrets-game";

interface RecapData {
  choiceId: string;
  stats: PlayerStats;
  previousStats: PlayerStats;
  recapText: string;
  archetype: PlayerArchetype;
}

export default function NoRegretsRecap() {
  const [data, setData] = useState<RecapData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("noRegrets_ep1");
    if (raw) setData(JSON.parse(raw));
  }, []);

  if (data === null) {
    const raw = sessionStorage.getItem("noRegrets_ep1");
    if (!raw) return <Navigate to="/no-regrets-game" replace />;
  }

  if (!data) return null;

  return (
    <EpisodeShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Episode 1: The Shock — Recap</h2>
          <div className="h-0.5 w-16 bg-primary/40 mt-2 rounded-full" />
        </div>

        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{data.recapText}</p>

        <StatsBar stats={data.stats} previousStats={data.previousStats} />

        <FollowTheMoneyTeaser />

        <ConversionModule />

        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/no-regrets-game">Continue to Episode 2 (coming soon)</Link>
        </Button>
      </div>
    </EpisodeShell>
  );
}
