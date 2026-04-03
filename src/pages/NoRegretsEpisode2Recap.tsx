import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { FollowTheMoneyTeaser } from "@/components/no-regrets-game/FollowTheMoneyTeaser";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { PlayerStats, CompanyArchetype } from "@/types/no-regrets-game";

interface RecapData {
  choiceId: string;
  stats: PlayerStats;
  previousStats: PlayerStats;
  recapText: string;
  companyArchetype: CompanyArchetype;
}

const ARCHETYPE_CTA: Record<CompanyArchetype, { headline: string; body: string; cta: string; link: string; secondary: string; secondaryLink: string }> = {
  "safe-pay-shaky-ethics": {
    headline: "Stable paychecks fund unstable politics.",
    body: "NovaCorp pays well. But where does that money go after hours? Follow The Money shows you the federal contribution footprint behind employers like this — PAC donations, lobbying patterns, and the political bets they're making with the stability you're counting on.",
    cta: "Pull NovaCorp's receipts",
    link: "/follow-the-money",
    secondary: "Search the Employer Directory",
    secondaryLink: "/receipts",
  },
  "mission-driven-unstable": {
    headline: "Good intentions don't make payroll.",
    body: "Clearpath's mission is real. But so is their burn rate. Before you bet your career on a company that \"would rather shut down than compromise,\" check the financial and structural signals that tell you whether they'll still be here in a year.",
    cta: "Check Clearpath's financial signals",
    link: "/receipts",
    secondary: "Calculate your walk-away number",
    secondaryLink: "/offer-check",
  },
  "prestige-burnout": {
    headline: "Brand names don't protect you. Receipts do.",
    body: "Meridian looks great on a résumé. But their $2.1M in lobbying spend, 14-month average tenure, and pay-to-play awards tell a different story. Follow The Money shows you what a prestige employer is actually investing in — and it's not your career.",
    cta: "See Meridian's lobbying trail",
    link: "/follow-the-money",
    secondary: "Search the Employer Directory",
    secondaryLink: "/receipts",
  },
};

export default function NoRegretsEpisode2Recap() {
  const [data, setData] = useState<RecapData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("noRegrets_ep2");
    if (raw) setData(JSON.parse(raw));
  }, []);

  if (data === null) {
    const raw = sessionStorage.getItem("noRegrets_ep2");
    if (!raw) return <Navigate to="/no-regrets-game/episode-2" replace />;
  }

  if (!data) return null;

  const cta = ARCHETYPE_CTA[data.companyArchetype];

  return (
    <EpisodeShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Episode 2: The Offer — Recap</h2>
          <div className="h-0.5 w-16 bg-primary/40 mt-2 rounded-full" />
        </div>

        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{data.recapText}</p>

        <StatsBar stats={data.stats} previousStats={data.previousStats} />

        <FollowTheMoneyTeaser />

        {/* Archetype-specific conversion */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
          <h3 className="text-lg md:text-xl font-display font-bold text-foreground">{cta.headline}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{cta.body}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="premium" size="lg" className="flex-1">
              <Link to={cta.link} className="gap-2">
                {cta.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link to={cta.secondaryLink}>{cta.secondary}</Link>
            </Button>
          </div>
        </div>

        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/no-regrets-game">Episode 3 (coming soon)</Link>
        </Button>
      </div>
    </EpisodeShell>
  );
}
