import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/landing/SectionReveal";
import { ArrowRight, Play } from "lucide-react";

const EPISODES = [
  {
    number: "01",
    title: "The Shock",
    question: "Who are you under pressure?",
    description:
      "You just got laid off. Your savings are thin, your confidence is cracked, and three very different instincts are pulling you in three directions. Which one wins?",
  },
  {
    number: "02",
    title: "The Offer",
    question: "What kind of company lies to you best?",
    description:
      "Three offers land. One pays well but smells wrong. One believes in something but can't keep the lights on. One has the name — and the burnout reputation to match.",
  },
  {
    number: "03",
    title: "The Cost",
    question: "What did that choice cost you?",
    description:
      "Six months in. The warning signs you ignored are now your daily reality. The justifications you told yourself are wearing thin. Something has to give.",
  },
];

const FORCES = [
  { emoji: "💰", name: "Money", detail: "Can you pay your bills, or are you bleeding out slowly while pretending everything is fine?" },
  { emoji: "🛡️", name: "Safety", detail: "How exposed are you? Job security, benefits, legal protection — what's actually underneath you?" },
  { emoji: "🧠", name: "Sanity", detail: "How much of yourself are you spending to keep this going? And what happens when you run out?" },
  { emoji: "⚡", name: "Power", detail: "Do you have leverage, or are you just grateful they haven't fired you yet?" },
];

export default function NoRegretsLanding() {
  return (
    <>
      <Helmet>
        <title>No-Regrets Career Story | WDIWF</title>
        <meta
          name="description"
          content="Play the career story you don't want to live. A 3-episode interactive thriller about layoffs, offers, compromise, and what your choices cost — powered by WDIWF."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border/20">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto px-5 pt-24 pb-20 md:pt-32 md:pb-28 text-center relative z-10">
            <SectionReveal>
              <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-primary/70 mb-5">
                A WDIWF story experience
              </p>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground leading-[1.15] tracking-tight mb-6">
                Play the career story you<br className="hidden md:block" /> don't want to live.
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.2}>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto mb-10">
                A three-episode interactive career thriller about layoffs, offers, compromise, burnout,
                and what your choices actually cost — built on the same intelligence that powers WDIWF.
              </p>
            </SectionReveal>
            <SectionReveal delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild variant="premium" size="lg">
                  <Link to="/no-regrets-game" className="gap-2">
                    <Play className="w-4 h-4" /> Start Season 1
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/how-it-works">Explore WDIWF</Link>
                </Button>
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* ── Season structure ── */}
        <section className="border-b border-border/20">
          <div className="max-w-3xl mx-auto px-5 py-20 md:py-28">
            <SectionReveal>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60 mb-3">
                Season 1 · Three Episodes
              </p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-12">
                The arc of a decision you can't undo.
              </h2>
            </SectionReveal>

            <div className="space-y-6">
              {EPISODES.map((ep, i) => (
                <SectionReveal key={ep.number} delay={i * 0.1}>
                  <div className="rounded-xl border border-border/30 bg-card/40 p-5 md:p-7 flex gap-5 items-start">
                    <span className="shrink-0 text-2xl md:text-3xl font-mono font-bold text-primary/30 leading-none pt-1">
                      {ep.number}
                    </span>
                    <div className="space-y-2 min-w-0">
                      <h3 className="text-lg font-display font-bold text-foreground">{ep.title}</h3>
                      <p className="text-xs font-mono text-primary/70 italic">{ep.question}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{ep.description}</p>
                    </div>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Four forces ── */}
        <section className="border-b border-border/20">
          <div className="max-w-3xl mx-auto px-5 py-20 md:py-28">
            <SectionReveal>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60 mb-3">
                What the game tracks
              </p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                Four forces. Every choice shifts them.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mb-12">
                These aren't game stats. They're the pressures that silently shape every career decision
                you make under stress — and the ones most people only notice after it's too late.
              </p>
            </SectionReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FORCES.map((f, i) => (
                <SectionReveal key={f.name} delay={i * 0.08}>
                  <div className="rounded-xl border border-border/30 bg-card/40 p-5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{f.emoji}</span>
                      <span className="text-sm font-display font-bold text-foreground uppercase tracking-wide">{f.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.detail}</p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Powered by receipts ── */}
        <section className="border-b border-border/20">
          <div className="max-w-3xl mx-auto px-5 py-20 md:py-28">
            <SectionReveal>
              <div className="rounded-xl border border-primary/15 bg-card/40 overflow-hidden">
                <div className="px-5 py-3 border-b border-border/20 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/70">
                    Powered by Follow The Money
                  </p>
                </div>
                <div className="p-5 md:p-7 space-y-4">
                  <h2 className="text-lg md:text-xl font-display font-bold text-foreground">
                    This story has receipts.
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The companies in this game are fictional. The patterns are not.
                    Every employer archetype, warning sign, and consequence path in the No-Regrets Career Story
                    is informed by the same intelligence WDIWF uses to vet real employers — federal filings,
                    lobbying disclosures, political contribution records, and labor signals most job seekers never see.
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 italic border-l-2 border-primary/20 pl-3">
                    The story is made up. The logic behind it is real.
                  </p>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* ── Why this exists ── */}
        <section className="border-b border-border/20">
          <div className="max-w-3xl mx-auto px-5 py-20 md:py-28">
            <SectionReveal>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60 mb-3">
                Why this exists
              </p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-5">
                Most career decisions are made in survival mode.
              </h2>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed max-w-xl">
                <p>
                  People accept offers in panic. They stay in bad jobs out of fear.
                  They ignore warning signs because the paycheck is too good or the mission sounds too noble
                  or the brand looks too impressive on a resume.
                </p>
                <p>
                  Then, six months later, they wonder why they feel trapped.
                </p>
                <p>
                  The No-Regrets Career Story exists to help you recognize those patterns before
                  you repeat them — in a format that feels like something you'd actually finish.
                </p>
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section>
          <div className="max-w-3xl mx-auto px-5 py-20 md:py-28 text-center">
            <SectionReveal>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60 mb-3">
                Season 1 · Ready
              </p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                Find out what you'd really do.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-10">
                Three episodes. Twelve minutes. One career you don't have to actually live through.
              </p>
            </SectionReveal>
            <SectionReveal delay={0.15}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild variant="premium" size="lg">
                  <Link to="/no-regrets-game" className="gap-2">
                    Start Season 1 <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/follow-the-money">See real employer receipts</Link>
                </Button>
              </div>
            </SectionReveal>

            {/* Footer stamp */}
            <div className="mt-16 flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-primary/20" />
              <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">
                WDIWF Intelligence · Confidential Career Stories
              </p>
              <div className="h-px w-8 bg-primary/20" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
