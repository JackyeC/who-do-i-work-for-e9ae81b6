import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { FollowTheMoneyTeaser } from "@/components/no-regrets-game/FollowTheMoneyTeaser";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { trackNoRegrets } from "@/lib/noRegretsAnalytics";
import type { PlayerStats, ConsequenceLabel } from "@/types/no-regrets-game";

const CONSEQUENCE_LABELS: Record<ConsequenceLabel, string> = {
  "moral-injury": "Moral Injury",
  "mission-collapse": "Mission Collapse",
  "burnout-spiral": "Burnout Spiral",
};

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
  const consequenceLabel = CONSEQUENCE_LABELS[data.consequenceLabel];

  return (
    <EpisodeShell>
      {/* Verdict header */}
      <div className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/60">Episode 3 — Final Verdict</p>
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">The Cost — Recap</h2>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[hsl(var(--destructive))]/20 bg-[hsl(var(--destructive))]/5">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--destructive))]" />
          <span className="text-xs font-mono text-[hsl(var(--destructive))] font-semibold">{consequenceLabel}</span>
        </div>
      </div>

      {/* Recap narrative */}
      <div className="rounded-xl border border-border/20 bg-card/30 p-5 md:p-6">
        <p className="text-sm md:text-[15px] text-muted-foreground leading-[1.8]">{data.recapText}</p>
      </div>

      <StatsBar stats={data.stats} previousStats={data.previousStats} />

      <FollowTheMoneyTeaser />

      {/* Consequence-specific conversion */}
      <div className="rounded-xl border border-primary/25 bg-card/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-primary/15 bg-primary/5">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">Next Action</p>
        </div>
        <div className="p-5 md:p-6 space-y-4">
          <h3 className="text-lg md:text-xl font-display font-bold text-foreground">{cta.headline}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{cta.body}</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
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
      </div>

      {/* End-of-season dossier close */}
      <div className="rounded-xl border border-border/30 bg-card/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/20">
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground/50">End of Season 1</p>
        </div>
        <div className="p-5 md:p-6 text-center space-y-4">
          <h3 className="text-base md:text-lg font-display font-bold text-foreground">
            This was a game. Your career isn't.
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
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
