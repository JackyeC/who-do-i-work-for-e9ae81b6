import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { FollowTheMoneyTeaser } from "@/components/no-regrets-game/FollowTheMoneyTeaser";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Check } from "lucide-react";
import { trackNoRegrets } from "@/lib/noRegretsAnalytics";
import { cn } from "@/lib/utils";
import type { PlayerStats, ConsequenceLabel, PlayerArchetype, CompanyArchetype } from "@/types/no-regrets-game";

/* ── Label maps ── */

const CONSEQUENCE_LABELS: Record<ConsequenceLabel, string> = {
  "moral-injury": "Moral Injury",
  "mission-collapse": "Mission Collapse",
  "burnout-spiral": "Burnout Spiral",
};

const PLAYER_LABELS: Record<string, string> = {
  "stability-first": "The Safety Player",
  "pause-and-reassess": "The Investigator",
  "overstay-and-hope": "The Holdout",
};

const COMPANY_LABELS: Record<string, string> = {
  "safe-pay-shaky-ethics": "a Golden Cage",
  "mission-driven-unstable": "a Burning Ship",
  "prestige-burnout": "a Prestige Mill",
};

const RESULT_COST: Record<ConsequenceLabel, string> = {
  "moral-injury": "In real life, this pattern costs people their integrity — slowly, comfortably, and then all at once.",
  "mission-collapse": "In real life, this pattern costs people their savings, their confidence, and the ability to trust their own judgment about what's worth fighting for.",
  "burnout-spiral": "In real life, this pattern costs people their health, their relationships, and the version of themselves they actually liked.",
};

const RESULT_HOPE: Record<ConsequenceLabel, string> = {
  "moral-injury": "Next time: check the receipts before you sign. The silence always has a price — and it's usually in the public record.",
  "mission-collapse": "Next time: believe in the mission, but verify the math. Conviction without runway is just a more inspiring way to go broke.",
  "burnout-spiral": "Next time: the brand on your résumé is not worth the person behind it. Check tenure data before you sign. Your nervous system is not a renewable resource.",
};

/* ── Healthy choice detection ── */

const HEALTHY_CHOICES = new Set([
  "moral-injury-exit",
  "mission-collapse-leave",
  "burnout-spiral-reclaim",
]);

const PATTERN_BREAK_MESSAGES: Record<string, { title: string; detail: string }> = {
  "moral-injury-exit": {
    title: "You chose your integrity over comfort.",
    detail: "Most people in a golden cage wait until the damage is done. You started planning while you still recognized yourself. That's not reckless — that's rare.",
  },
  "mission-collapse-leave": {
    title: "You chose clarity over loyalty.",
    detail: "Walking away from something you believe in takes more courage than staying and hoping. You looked at the burn rate and your bank account in the same breath — and chose reality.",
  },
  "burnout-spiral-reclaim": {
    title: "You chose yourself over the brand.",
    detail: "Setting a boundary at a prestige company is career heresy. You did it anyway. Your ranking dropped. Your nervous system started healing. That's not quitting — that's strategy.",
  },
};

/* ── CTA data ── */

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

/* ── Recap data shape ── */

interface RecapData {
  choiceId: string;
  stats: PlayerStats;
  previousStats: PlayerStats;
  recapText: string;
  consequenceLabel: ConsequenceLabel;
}

/* ── Result Card Component ── */

function ResultCard({
  playerArchetype,
  companyArchetype,
  consequenceLabel,
  choiceId,
}: {
  playerArchetype: string;
  companyArchetype: string;
  consequenceLabel: ConsequenceLabel;
  choiceId: string;
}) {
  const [copied, setCopied] = useState(false);

  const playerLabel = PLAYER_LABELS[playerArchetype] || "The Player";
  const companyLabel = COMPANY_LABELS[companyArchetype] || "a Broken System";
  const headline = `${playerLabel} in ${companyLabel}`;
  const costLine = RESULT_COST[consequenceLabel];
  const hopeLine = RESULT_HOPE[consequenceLabel];

  const shareText = `My No-Regrets Career Story result:\n\n"${headline}"\nOutcome: ${CONSEQUENCE_LABELS[consequenceLabel]}\n\n${costLine}\n\n${hopeLine}\n\nPlay it yourself → wdiwf.com/no-regrets`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* fallback: select-all not critical */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-xl border-2 border-primary/25 bg-card/60 overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-primary/15 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-primary/80">
            Your Result · Season 1
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={cn(
            "h-7 gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors",
            copied ? "text-[hsl(var(--civic-green))]" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy result"}
        </Button>
      </div>
      <div className="p-5 md:p-7 space-y-4">
        <h3 className="text-lg md:text-xl font-display font-bold text-foreground tracking-tight leading-snug">
          "{headline}"
        </h3>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[hsl(var(--destructive))]/20 bg-[hsl(var(--destructive))]/5">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--destructive))]" />
          <span className="text-[10px] font-mono text-[hsl(var(--destructive))] font-semibold uppercase tracking-wider">
            {CONSEQUENCE_LABELS[consequenceLabel]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{costLine}</p>
        <p className="text-sm text-primary/80 font-medium leading-relaxed border-l-2 border-primary/30 pl-3">
          {hopeLine}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Pattern-Break Section ── */

function PatternBreakSection({ choiceId }: { choiceId: string }) {
  const broke = HEALTHY_CHOICES.has(choiceId);
  if (!broke) return null;

  const msg = PATTERN_BREAK_MESSAGES[choiceId];
  if (!msg) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-xl border border-[hsl(var(--civic-green))]/25 bg-[hsl(var(--civic-green))]/5 overflow-hidden"
    >
      <div className="px-5 py-2.5 border-b border-[hsl(var(--civic-green))]/15 flex items-center gap-2">
        <span className="text-sm">🔓</span>
        <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-[hsl(var(--civic-green))]">
          Pattern Broken
        </p>
      </div>
      <div className="p-5 space-y-2">
        <h4 className="text-sm font-display font-bold text-foreground">{msg.title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{msg.detail}</p>
      </div>
    </motion.div>
  );
}

/* ── What-If Section ── */

const WHAT_IF: Record<ConsequenceLabel, string> = {
  "moral-injury":
    "If you'd pulled the employer's PAC filings, EEOC settlements, and lobbying record before signing, you'd have seen the silence was structural — not accidental. The data was public. The pattern was clear. You just didn't know where to look.",
  "mission-collapse":
    "If you'd checked the burn rate, the cap table, and the leadership departure pattern before joining, you'd have seen this wasn't a scrappy startup — it was a slow collapse with good branding. The SEC filings told the story months before the all-hands did.",
  "burnout-spiral":
    "If you'd looked at the tenure data, the lobbying spend on labor classification, and the gap between the awards and the attrition rate, you'd have seen that the brand was the product — not the people. The receipts were there. The warning was free.",
};

/* ── Main Component ── */

export default function NoRegretsEpisode3Recap() {
  const [data, setData] = useState<RecapData | null>(null);
  const [playerArchetype, setPlayerArchetype] = useState("stability-first");
  const [companyArchetype, setCompanyArchetype] = useState("safe-pay-shaky-ethics");

  useEffect(() => {
    const raw = sessionStorage.getItem("noRegrets_ep3");
    if (raw) setData(JSON.parse(raw));

    const ep1 = sessionStorage.getItem("noRegrets_ep1");
    if (ep1) {
      try { setPlayerArchetype(JSON.parse(ep1).archetype || "stability-first"); } catch {}
    }
    const ep2 = sessionStorage.getItem("noRegrets_ep2");
    if (ep2) {
      try { setCompanyArchetype(JSON.parse(ep2).companyArchetype || "safe-pay-shaky-ethics"); } catch {}
    }
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

      {/* ── Shareable result card ── */}
      <ResultCard
        playerArchetype={playerArchetype}
        companyArchetype={companyArchetype}
        consequenceLabel={data.consequenceLabel}
        choiceId={data.choiceId}
      />

      {/* ── Pattern break (if healthy choice) ── */}
      <PatternBreakSection choiceId={data.choiceId} />

      {/* ── What-if section ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="rounded-xl border border-border/30 bg-card/30 overflow-hidden"
      >
        <div className="px-5 py-2.5 border-b border-border/20 flex items-center gap-2">
          <span className="text-sm">🔍</span>
          <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/60">
            If you'd had the data
          </p>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            {WHAT_IF[data.consequenceLabel]}
          </p>
        </div>
      </motion.div>

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
            <Button asChild variant="premium" size="lg" className="flex-1" onClick={() => trackNoRegrets("recap_cta_clicked", { episode: 3, consequence_label: data.consequenceLabel, cta_destination: cta.primaryLink })}>
              <Link to={cta.primaryLink} className="gap-2">
                {cta.primary} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1" onClick={() => trackNoRegrets("recap_cta_clicked", { episode: 3, consequence_label: data.consequenceLabel, cta_destination: cta.secondaryLink })}>
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
