import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { FollowTheMoneyTeaser } from "@/components/no-regrets-game/FollowTheMoneyTeaser";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { PlayerStats, ConsequenceLabel } from "@/types/no-regrets-game";

interface RecapData {
  choiceId: string;
  stats: PlayerStats;
  previousStats: PlayerStats;
  recapText: string;
  consequenceLabel: ConsequenceLabel;
}

const CONSEQUENCE_CTA: Record<ConsequenceLabel, { headline: string; body: string; primary: string; primaryLink: string; secondary: string; secondaryLink: string }> = {
  "moral-injury": {
    headline: "The silence has a price. Do you know what it is?",
    body: "Companies like NovaCorp don't just pay you to work — they pay you not to ask. Follow The Money shows you exactly where your employer's political dollars go and what policies they're funding while you're clocked in. If you're going to sell your silence, at least know the asking price.",
    primary: "Pull the receipts on your employer",
    primaryLink: "/follow-the-money",
    secondary: "Calculate your walk-away number",
    secondaryLink: "/offer-check",
  },
  "mission-collapse": {
    headline: "Belief doesn't pay rent. But information might save you.",
    body: "Before you ride another mission into the ground, check the signals: burn rate, leadership departures, funding gaps, and the structural cracks that tell you whether a company is building something real or just burning through someone else's money. Ask Jackye can help you think through what comes next.",
    primary: "Search the Employer Directory",
    primaryLink: "/receipts",
    secondary: "Ask Jackye what to do next",
    secondaryLink: "/ask-jackye",
  },
  "burnout-spiral": {
    headline: "Your résumé is not worth your nervous system.",
    body: "Prestige companies count on you valuing the brand more than yourself. The Employer Directory shows you what companies like Meridian actually look like behind the awards — tenure data, lobbying spend, and the patterns they hope you're too busy to notice. Your walk-away number tells you exactly how much runway you have to leave.",
    primary: "Check your walk-away number",
    primaryLink: "/offer-check",
    secondary: "Search the Employer Directory",
    secondaryLink: "/receipts",
  },
};

export default function NoRegretsEpisode3Recap() {
  const [data, setData] = useState<RecapData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("noRegrets_ep3");
    if (raw) setData(JSON.parse(raw));
  }, []);

  if (data === null) {
    const raw = sessionStorage.getItem("noRegrets_ep3");
    if (!raw) return <Navigate to="/no-regrets-game/episode-3" replace />;
  }

  if (!data) return null;

  const cta = CONSEQUENCE_CTA[data.consequenceLabel];

  return (
    <EpisodeShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Episode 3: The Cost — Recap</h2>
          <div className="h-0.5 w-16 bg-primary/40 mt-2 rounded-full" />
        </div>

        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{data.recapText}</p>

        <StatsBar stats={data.stats} previousStats={data.previousStats} />

        <FollowTheMoneyTeaser />

        {/* Consequence-specific conversion */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
          <h3 className="text-lg md:text-xl font-display font-bold text-foreground">{cta.headline}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{cta.body}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="premium" size="lg" className="flex-1">
              <Link to={cta.primaryLink} className="gap-2">
                {cta.primary} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link to={cta.secondaryLink}>{cta.secondary}</Link>
            </Button>
          </div>
        </div>

        {/* End-of-game summary */}
        <div className="rounded-xl border border-border/50 bg-card p-5 text-center space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">End of Season 1</p>
          <h3 className="text-base font-display font-bold text-foreground">This was a game. Your career isn't.</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every company in this story was fictional. The patterns behind them are not.
            WDIWF tracks real employer signals — political donations, lobbying spend, layoff history,
            and the gaps between what companies say and what they do.
          </p>
          <Button asChild variant="default" size="lg">
            <Link to="/receipts" className="gap-2">
              Look up a real employer <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </EpisodeShell>
  );
}
