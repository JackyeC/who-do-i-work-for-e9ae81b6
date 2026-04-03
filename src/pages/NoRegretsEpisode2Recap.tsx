import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { FollowTheMoneyTeaser } from "@/components/no-regrets-game/FollowTheMoneyTeaser";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { trackNoRegrets } from "@/lib/noRegretsAnalytics";
import type { PlayerStats, CompanyArchetype } from "@/types/no-regrets-game";

const ARCHETYPE_LABELS: Record<CompanyArchetype, string> = {
  "safe-pay-shaky-ethics": "The Golden Cage",
  "mission-driven-unstable": "The True Believer",
  "prestige-burnout": "The Brand Sacrifice",
};

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
  const archetypeLabel = ARCHETYPE_LABELS[data.companyArchetype];

  return (
    <EpisodeShell>
      <div className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/60">Episode 2 — Verdict</p>
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">The Offer — Recap</h2>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xs font-mono text-primary font-semibold">{archetypeLabel}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border/20 bg-card/30 p-5 md:p-6">
        <p className="text-sm md:text-[15px] text-muted-foreground leading-[1.8]">{data.recapText}</p>
      </div>

      <StatsBar stats={data.stats} previousStats={data.previousStats} />

      <FollowTheMoneyTeaser />

      {/* Archetype-specific conversion */}
      <div className="rounded-xl border border-primary/25 bg-card/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-primary/15 bg-primary/5">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">Next Action</p>
        </div>
        <div className="p-5 md:p-6 space-y-4">
          <h3 className="text-lg md:text-xl font-display font-bold text-foreground">{cta.headline}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{cta.body}</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button asChild variant="premium" size="lg" className="flex-1" onClick={() => trackNoRegrets("recap_cta_clicked", { episode: 2, company_archetype: data.companyArchetype, cta_destination: cta.link })}>
              <Link to={cta.link} className="gap-2">
                {cta.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1" onClick={() => trackNoRegrets("recap_cta_clicked", { episode: 2, company_archetype: data.companyArchetype, cta_destination: cta.secondaryLink })}>
              <Link to={cta.secondaryLink}>{cta.secondary}</Link>
            </Button>
          </div>
        </div>
      </div>

      <Button asChild variant="outline" size="lg" className="w-full">
        <Link to="/no-regrets-game/episode-3" className="gap-2">
          Continue to Episode 3 <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </EpisodeShell>
  );
}
