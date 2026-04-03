import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/landing/SectionReveal";
import { ArrowRight, Play } from "lucide-react";

const EPISODES = [
  {
    number: "01",
    title: "The Shock",
    question: "Who are you when the floor drops?",
    description:
      "Friday afternoon. Your badge stops working. HR is smiling. Your manager won't make eye contact. You have rent due in eleven days, a kid on your insurance, and three very different instincts screaming at once. Which one do you listen to?",
  },
  {
    number: "02",
    title: "The Offer",
    question: "What kind of company lies to you best?",
    description:
      "Three offers arrive the same week. One pays 40% more but the Glassdoor reviews read like hostage letters. One has a beautiful mission statement and six months of runway. One has a name your parents would recognize — and an attrition rate they wouldn't. You have 48 hours.",
  },
  {
    number: "03",
    title: "The Cost",
    question: "What did that choice actually cost you?",
    description:
      "Six months in. The warning signs you rationalized on day one are now your morning commute. The thing you told yourself you could live with is the thing keeping you up at 2 a.m. Something has to break. The question is whether it's the job or you.",
  },
];

const FORCES = [
  { emoji: "💰", name: "Money", detail: "Not wealth. Survival. Can you cover rent, insurance, and the life you promised someone? Or are you slowly drowning while telling everyone you're fine?" },
  { emoji: "🛡️", name: "Safety", detail: "Not comfort. Exposure. If this company lays off your team tomorrow, what's actually underneath you? Severance? Savings? Nothing?" },
  { emoji: "🧠", name: "Sanity", detail: "Not happiness. Capacity. How much of yourself are you burning to keep this job running? And what happens to the rest of your life when there's nothing left?" },
  { emoji: "⚡", name: "Power", detail: "Not ambition. Leverage. Can you say no? Can you negotiate? Or are you just grateful they haven't replaced you yet?" },
];

export default function NoRegretsLanding() {
  return (
    <>
      <Helmet>
        <title>No-Regrets Career Story | WDIWF</title>
        <meta
          name="description"
          content="Play the career story you don't want to live. A 3-episode interactive thriller about layoffs, bad offers, and the choices that cost people careers — powered by WDIWF employer intelligence."
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
                You get laid off. Three offers land. Each one is hiding something.
                You pick the one that feels safest — and six months later, you're wondering
                how you ended up here again. This is that story. Except this time,
                you get to see what it costs before you sign.
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
                Three decisions. Each one closes a door.
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
                What shapes your choices
              </p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                Four pressures. You can't max them all.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mb-12">
                Every career decision you make under stress is a trade between these four forces.
                Most people don't realize which one they're sacrificing until it's already gone.
                The game makes you watch it happen in real time.
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
                    Fiction built on public records.
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The companies in this story are invented. The behavior is not.
                    Every archetype, every warning sign, every consequence path is modeled on patterns
                    WDIWF tracks across real employers — PAC spending, lobbying disclosures,
                    OSHA violations, EEO-1 filings, executive donation histories, and labor signals
                    that never make it into a job posting or a recruiter pitch.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Most people job-search in panic. They skip the research. They trust the brand.
                    They take the first thing that feels stable. This game exists because that instinct
                    is usually wrong — and the data to prove it is already public. People just don't know where to look.
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 italic border-l-2 border-primary/20 pl-3">
                    The story is made up. The pattern recognition is real. The receipts are waiting.
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
                The wrong company at the wrong time will cost you years.
              </h2>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed max-w-xl">
                <p>
                  People take jobs in panic and call it being decisive.
                  They stay in toxic roles and call it loyalty.
                  They ignore the public record on an employer because the offer letter felt like rescue.
                </p>
                <p>
                  Then, eighteen months later, they're burned out, underpaid, or complicit in something
                  they never agreed to — and they can't explain how they got there.
                </p>
                <p>
                  We built this because the patterns are predictable. The warning signs
                  are almost always visible in advance. And the cost of ignoring them
                  isn't a bad quarter — it's your health, your savings, your reputation,
                  or the version of your career you actually wanted.
                </p>
                <p className="text-primary/80 font-medium">
                  The No-Regrets Career Story lets you live those patterns without paying for them.
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
                You already know someone who made this mistake.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-10">
                Three episodes. Twelve minutes. One career you don't have to actually live through.
                Find out which pressure you'd sacrifice — before a real offer forces you to choose.
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
                WDIWF Intelligence · No Spin · No Rankings · Just Receipts
              </p>
              <div className="h-px w-8 bg-primary/20" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
