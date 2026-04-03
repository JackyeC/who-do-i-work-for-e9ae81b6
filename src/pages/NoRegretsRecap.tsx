import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { FollowTheMoneyTeaser } from "@/components/no-regrets-game/FollowTheMoneyTeaser";
import { ConversionModule } from "@/components/no-regrets-game/ConversionModule";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { PlayerStats, PlayerArchetype } from "@/types/no-regrets-game";

const ARCHETYPE_LABELS: Record<string, string> = {
  "stability-first": "The Safety Player",
  "pause-and-reassess": "The Investigator",
  "overstay-and-hope": "The Holdout",
};

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

  const archetypeLabel = ARCHETYPE_LABELS[data.archetype] || data.archetype;

  return (
    <EpisodeShell>
      {/* Verdict header */}
      <div className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/60">Episode 1 — Verdict</p>
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">The Shock — Recap</h2>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xs font-mono text-primary font-semibold">{archetypeLabel}</span>
        </div>
      </div>

      {/* Recap narrative */}
      <div className="rounded-xl border border-border/20 bg-card/30 p-5 md:p-6">
        <p className="text-sm md:text-[15px] text-muted-foreground leading-[1.8]">{data.recapText}</p>
      </div>

      <StatsBar stats={data.stats} previousStats={data.previousStats} />

      <FollowTheMoneyTeaser />

      <ConversionModule />

      <Button asChild variant="outline" size="lg" className="w-full">
        <Link to="/no-regrets-game/episode-2" className="gap-2">
          Continue to Episode 2 <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </EpisodeShell>
  );
}
