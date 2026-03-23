import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, ShieldCheck, TrendingUp, Users, Star, Landmark,
  AlertTriangle, CheckCircle2, XCircle, MessageCircle, FileText,
  Eye, ChevronDown, ArrowRight, Sparkles, Route, Check, Lock,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SignedIn, SignedOut, useAuth as useClerkAuth } from "@clerk/clerk-react";

/* ── Types ── */

interface SignalData {
  icon: string;
  label: string;
  status: "confirmed" | "watch" | "flag";
  detail: string;
}

interface RedFlagData {
  observed: string;
  maySuggest: string;
  askInInterview: string;
}

interface TrajectoryData {
  avgTenure: string;
  nextSteps: string[];
  tradeoff: string;
}

interface CompanyDossier {
  name: string;
  industry: string;
  location: string;
  employees: string;
  integrityScore: number;
  worthYourTime: string;
  verdict: string;
  jackyeRead: string;
  signals: SignalData[];
  coachingNote: string;
  coverLetterAngle: string;
  interviewQuestions: string[];
  redFlags: RedFlagData[];
  trajectory: TrajectoryData;
}

/* ── Sample data ── */
const COMPANY_DATA: Record<string, CompanyDossier> = {
  patagonia: {
    name: "Patagonia",
    industry: "Outdoor Apparel",
    location: "Ventura, CA",
    employees: "~4,200",
    integrityScore: 8.7,
    worthYourTime:
      "Yes — if you want a high-integrity environment and can tolerate a longer hiring process. This is one of the few where the mission is structural, not decorative.",
    verdict:
      "This is one of the few companies where the mission isn't marketing — it's embedded in the business model. But don't confuse purpose with comfort. They move fast and expect a lot.",
    jackyeRead:
      "I've watched Patagonia for years. The ownership transfer was real — not a PR stunt with a legal loophole. That said, the new leadership team is still finding its footing operationally. The culture is strong, but don't assume 'mission-driven' means 'low-pressure.' These people work hard and hold each other to a very high bar. If you're looking for meaningful work with real accountability, this is it. If you're looking for a chill vibe because you like hiking — keep looking.",
    signals: [
      {
        icon: "pay",
        label: "Pay Transparency",
        status: "confirmed",
        detail: "Salary ranges published on all U.S. job postings since 2023. Internal pay equity audits conducted annually.",
      },
      {
        icon: "stability",
        label: "Workforce Stability",
        status: "confirmed",
        detail: "Voluntary turnover under 12% — well below apparel industry average of 22%. No layoffs in the past 3 years.",
      },
      {
        icon: "leadership",
        label: "Leadership Tenure",
        status: "watch",
        detail: "CEO transition in 2022 when Yvon Chouinard transferred ownership. New leadership is mission-aligned but still proving itself operationally.",
      },
      {
        icon: "glassdoor",
        label: "Glassdoor Trajectory",
        status: "confirmed",
        detail: "4.1 stars with an upward trend over 18 months. 82% would recommend to a friend. CEO approval at 89%.",
      },
      {
        icon: "civic",
        label: "Civic Footprint",
        status: "confirmed",
        detail: "1% for the Planet member since founding. $140M+ donated to environmental causes. B Corp certified.",
      },
    ],
    coachingNote:
      "Don't lead with 'I love the outdoors' — they hear it 200 times a week. Lead with what you've actually done that moved a number, changed a process, or solved a hard problem. They want operators who happen to care, not fans who happen to work.",
    coverLetterAngle:
      "Frame your experience around measurable impact in a mission-driven context. If you've ever made a trade-off between profit and principle — and can articulate why — that's your hook. They don't want passion statements. They want evidence of judgment.",
    interviewQuestions: [
      "How does your mission show up in a decision that was actually hard to make?",
      "What's one thing about working here that surprises new hires in the first 90 days?",
      "How do you handle disagreements between business targets and environmental commitments at the team level?",
    ],
    redFlags: [
      {
        observed: "The hiring manager deflects when asked about the 2022 ownership transition.",
        maySuggest: "The internal narrative around the restructuring may still be unsettled, which could affect team direction.",
        askInInterview: "Can you walk me through how the ownership change has affected your team's day-to-day priorities?",
      },
      {
        observed: "Interview process exceeds 4 weeks with gaps in communication.",
        maySuggest: "Internal hiring coordination may be under-resourced, which sometimes signals competing priorities at the leadership level.",
        askInInterview: "What does a typical hiring timeline look like for this role, and who's involved in the final decision?",
      },
      {
        observed: "Job description emphasizes 'passion for the mission' over specific competencies.",
        maySuggest: "The role scope may be loosely defined, which can mean high autonomy or high ambiguity depending on the team.",
        askInInterview: "What would success look like in the first 6 months, and how is that measured?",
      },
    ],
    trajectory: {
      avgTenure: "3.4 years",
      nextSteps: [
        "Senior Operations or Program Manager",
        "Sustainability Strategy Lead",
        "Director-level role at a peer B Corp or nonprofit",
      ],
      tradeoff:
        "People who do well here often move into senior ops or sustainability roles elsewhere within 3–4 years. The tradeoff: strong mission alignment and resume credibility, but slower comp growth than corporate peers.",
    },
  },
};

/* ── Helpers ── */

function scoreColor(score: number) {
  if (score >= 7) return "text-civic-green";
  if (score >= 4) return "text-civic-yellow";
  return "text-destructive";
}

function scoreBadgeCn(score: number) {
  if (score >= 7) return "bg-civic-green/10 text-civic-green border-civic-green/30";
  if (score >= 4) return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

function scoreLabel(score: number) {
  if (score >= 8) return "Strong Integrity";
  if (score >= 6) return "Moderate";
  if (score >= 4) return "Mixed Signals";
  return "Elevated Risk";
}

const STATUS_MAP = {
  confirmed: { icon: CheckCircle2, label: "Confirmed", cn: "text-civic-green" },
  watch: { icon: AlertTriangle, label: "Watch", cn: "text-civic-yellow" },
  flag: { icon: XCircle, label: "Flag", cn: "text-destructive" },
} as const;

const SIGNAL_ICONS: Record<string, React.ElementType> = {
  pay: TrendingUp,
  stability: Users,
  leadership: Building2,
  glassdoor: Star,
  civic: Landmark,
};

/* ── Reveal wrapper ── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Section header ── */
function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="font-mono text-xs tracking-[0.25em] uppercase text-primary font-semibold shrink-0">
        {number}
      </span>
      <h2 className="text-base sm:text-lg font-display font-bold text-foreground tracking-tight">
        {title}
      </h2>
    </div>
  );
}

/* ── Expandable question ── */
function ExpandableQuestion({ question, index }: { question: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left border border-border/40 bg-card p-4 transition-colors hover:bg-accent/20 active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs text-primary font-semibold mt-0.5">Q{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-relaxed">{question}</p>
          <div className={cn("overflow-hidden transition-all duration-300", open ? "max-h-40 mt-2" : "max-h-0")}>
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              Listen for specifics. If they answer in slogans or redirect, that's data too.
            </p>
          </div>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0 mt-0.5", open && "rotate-180")} />
      </div>
    </button>
  );
}

/* ── Pricing tiers ── */
const PRICING_TIERS = [
  {
    name: "Career Fit Report",
    price: "$149",
    interval: "one-time",
    description: "Full integrity analysis of this company, tailored to your background and role.",
    features: ["Complete signal breakdown", "Negotiation talking points", "Compensation benchmarks"],
    cta: "Get Your Dossier",
    highlighted: false,
  },
  {
    name: "Scout",
    price: "$19",
    interval: "/month",
    description: "24/7 AI coach. Audit any job link. Know before you apply.",
    features: ["Unlimited AI job-link audits", "Values alignment scoring", "Signal alerts", "Ask Jackye — unlimited"],
    cta: "Activate AI Coach",
    highlighted: true,
  },
  {
    name: "Executive",
    price: "$999",
    interval: "/year",
    description: "Full search management + priority access. Your career, on cruise control.",
    features: ["Apply When It Counts™ engine", "Full career mapping", "Priority 1-on-1 with Jackye", "All Scout + Strategist features"],
    cta: "Go Executive",
    highlighted: false,
  },
];

/* ── Auth gate overlay ── */
function DossierGateOverlay({ companyName }: { companyName: string }) {
  return (
    <div className="relative">
      {/* Blurred placeholder content */}
      <div className="blur-[6px] select-none pointer-events-none opacity-60 space-y-8" aria-hidden="true">
        <div className="bg-primary/10 border border-primary/25 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-primary font-bold">Jackye's Read</span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed font-medium">
            I've watched this company for years. The signals tell a story most candidates never see...
          </p>
        </div>
        <div className="border border-border/40 bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-2">Where This Role Usually Leads</h3>
          <p className="text-xs text-muted-foreground">Average tenure, career paths, and honest tradeoffs...</p>
        </div>
        <div className="border border-destructive/15 bg-destructive/5 p-4">
          <h3 className="text-sm font-bold text-foreground mb-2">Patterns to Watch</h3>
          <p className="text-xs text-muted-foreground">What was observed, what it may suggest, and what to ask...</p>
        </div>
        <div className="border border-border/40 bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-2">Your Cover Letter Angle</h3>
          <p className="text-xs text-muted-foreground">A specific strategy based on this company's signals...</p>
        </div>
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card border border-border/60 shadow-lg p-6 sm:p-8 max-w-sm mx-4 text-center space-y-4">
          <div className="w-10 h-10 mx-auto border border-primary/30 bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-foreground leading-relaxed font-medium">
            Sign up free to see Jackye's full read on {companyName} — including red flags, role trajectory, and your coaching guide.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild className="flex-1 font-mono text-xs tracking-wider">
              <Link to="/join">Get Free Access</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 font-mono text-xs tracking-wider">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Full dossier (signed-in) ── */
function FullDossierContent({ data }: { data: CompanyDossier }) {
  return (
    <>
      {/* ─── JACKYE'S READ ─── */}
      <Reveal delay={0.05}>
        <div className="bg-primary/10 border border-primary/25 p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-primary font-bold">
              Jackye's Read
            </span>
          </div>
          <p className="text-sm sm:text-[15px] text-foreground/90 leading-relaxed font-medium">
            {data.jackyeRead}
          </p>
          <p className="text-xs text-muted-foreground font-mono italic">
            Pattern-based insight · Not a verdict · Based on public signals
          </p>
        </div>
      </Reveal>

      {/* ─── WHAT THE RECORD SHOWS (remaining signals) ─── */}
      <Reveal delay={0.07}>
        <SectionHeader number="01" title="What the Record Shows" />
        <div className="space-y-3">
          {data.signals.map((signal, i) => {
            const IconComp = SIGNAL_ICONS[signal.icon] || ShieldCheck;
            const status = STATUS_MAP[signal.status];
            const StatusIcon = status.icon;
            return (
              <Card key={i} className="border-border/40 rounded-none shadow-none">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 border border-border/40 bg-muted/20 flex items-center justify-center shrink-0">
                    <IconComp className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{signal.label}</span>
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium", status.cn)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{signal.detail}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Reveal>

      {/* ─── HOW TO HANDLE THIS APPLICATION ─── */}
      <Reveal delay={0.09}>
        <SectionHeader number="02" title="How to Handle This Application" />
        <div className="bg-primary/5 border border-primary/15 p-5">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/85 leading-relaxed">
              {data.coachingNote}
            </p>
          </div>
        </div>
      </Reveal>

      {/* ─── ROLE REALITY + TRAJECTORY ─── */}
      <Reveal delay={0.1}>
        <SectionHeader number="03" title="Where This Role Usually Leads" />
        <div className="border border-border/40 bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Route className="w-5 h-5 text-primary shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Avg. tenure in this type of role</div>
              <div className="text-lg font-display font-bold text-foreground tabular-nums">{data.trajectory.avgTenure}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Common next steps</div>
            {data.trajectory.nextSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                {step}
              </div>
            ))}
          </div>
          <div className="border-t border-border/30 pt-3">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              {data.trajectory.tradeoff}
            </p>
          </div>
        </div>
      </Reveal>

      {/* ─── YOUR COVER LETTER ANGLE ─── */}
      <Reveal delay={0.11}>
        <SectionHeader number="04" title="Your Cover Letter Angle" />
        <div className="border border-border/40 bg-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/85 leading-relaxed">
              {data.coverLetterAngle}
            </p>
          </div>
          <Button asChild variant="outline" className="w-full font-mono text-xs tracking-wider">
            <Link to="/apply-kit">Generate Cover Letter →</Link>
          </Button>
        </div>
      </Reveal>

      {/* ─── QUESTIONS TO ASK THEM ─── */}
      <Reveal delay={0.12}>
        <SectionHeader number="05" title="Questions to Ask Them" />
        <div className="space-y-2">
          {data.interviewQuestions.map((q, i) => (
            <ExpandableQuestion key={i} question={q} index={i} />
          ))}
        </div>
      </Reveal>

      {/* ─── RED FLAGS TO WATCH ─── */}
      <Reveal delay={0.13}>
        <SectionHeader number="06" title="Patterns to Watch in This Process" />
        <div className="space-y-4">
          {data.redFlags.map((flag, i) => (
            <div key={i} className="border border-destructive/15 bg-destructive/5 p-4 space-y-3">
              <div>
                <div className="font-mono text-xs tracking-[0.2em] uppercase text-destructive/70 font-semibold mb-1">
                  What was observed
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{flag.observed}</p>
              </div>
              <div>
                <div className="font-mono text-xs tracking-[0.2em] uppercase text-civic-yellow font-semibold mb-1">
                  What it may suggest
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{flag.maySuggest}</p>
              </div>
              <div className="border-t border-border/20 pt-2">
                <div className="font-mono text-xs tracking-[0.2em] uppercase text-primary font-semibold mb-1">
                  What to explore further
                </div>
                <p className="text-xs text-foreground/75 leading-relaxed italic">"{flag.askInInterview}"</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ─── PRICING CTA ─── */}
      <Reveal delay={0.15}>
        <div className="space-y-5">
          <div className="text-center">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-primary font-semibold mb-1">
              Go deeper
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-foreground tracking-tight">
              Get the full picture before you decide.
            </h2>
            <p className="text-xs text-muted-foreground mt-1">No criticism. No shame. Just receipts.</p>
          </div>

          <div className="grid gap-4">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "border p-5 transition-all",
                  tier.highlighted
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]"
                    : "border-border/40 bg-card"
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-display font-bold text-foreground">{tier.name}</h3>
                      {tier.highlighted && (
                        <Badge variant="outline" className="text-xs font-mono bg-primary/10 border-primary/30 text-primary">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tier.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-data font-bold text-foreground tabular-nums">{tier.price}</span>
                    <span className="text-xs text-muted-foreground">{tier.interval}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                  {tier.features.map((f) => (
                    <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="w-3 h-3 text-civic-green" />
                      {f}
                    </span>
                  ))}
                </div>
                <Button
                  asChild
                  variant={tier.highlighted ? "default" : "outline"}
                  className="w-full font-mono text-xs tracking-wider"
                >
                  <Link to="/pricing">{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Disclaimer */}
      <Reveal delay={0.17}>
        <div className="border border-border/30 bg-muted/30 px-5 py-4 text-xs text-muted-foreground leading-relaxed font-mono">
          <span className="text-primary font-semibold tracking-wider uppercase text-xs">NOTE</span>{" "}
          This coaching guide is generated from public records and documented signals. It does not constitute legal or employment advice.
          WDIWF does not evaluate the content of your mission. We evaluate whether you're living it.
        </div>
      </Reveal>
    </>
  );
}

/* ── Page ── */
export default function DossierCoachingGuide() {
  const { slug } = useParams<{ slug: string }>();
  const data = COMPANY_DATA[slug || ""] || COMPANY_DATA.patagonia;

  // Get the first signal for the public preview
  const firstSignal = data.signals[0];
  const FirstIcon = SIGNAL_ICONS[firstSignal?.icon] || ShieldCheck;
  const firstStatus = STATUS_MAP[firstSignal?.status || "confirmed"];
  const FirstStatusIcon = firstStatus.icon;

  return (
    <>
      <Helmet>
        <title>{data.name} — Coaching Guide | WDIWF</title>
        <meta name="description" content={`Candidate coaching dossier for ${data.name}. Integrity signals, interview prep, and cover letter strategy.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">

          {/* ─── PUBLIC: Worth Your Time verdict ─── */}
          <Reveal>
            <div className="bg-primary/8 border border-primary/20 p-5 sm:p-6">
              <div className="font-mono text-xs tracking-[0.25em] uppercase text-primary font-semibold mb-2">
                Should you spend energy on this?
              </div>
              <p className="text-base sm:text-lg font-display font-bold text-foreground leading-snug tracking-tight">
                {data.worthYourTime}
              </p>
            </div>
          </Reveal>

          {/* ─── PUBLIC: Company header + score ─── */}
          <Reveal delay={0.03}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-mono tracking-wider bg-primary/5 border-primary/20 text-primary">
                  Coaching Guide
                </Badge>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-none border border-border/50 bg-muted/30 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight leading-tight">
                    {data.name}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data.industry} · {data.location} · {data.employees}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-end gap-1.5">
                  <span className={cn("font-data text-4xl font-black tabular-nums", scoreColor(data.integrityScore))}>
                    {data.integrityScore.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">/10</span>
                </div>
                <Badge variant="outline" className={cn("text-xs", scoreBadgeCn(data.integrityScore))}>
                  {scoreLabel(data.integrityScore)}
                </Badge>
              </div>

              <blockquote className="border-l-2 border-primary/40 pl-4 text-sm text-foreground/80 leading-relaxed italic">
                "{data.verdict}"
              </blockquote>
            </div>
          </Reveal>

          {/* ─── PUBLIC: First signal card (teaser) ─── */}
          {firstSignal && (
            <Reveal delay={0.04}>
              <Card className="border-border/40 rounded-none shadow-none">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 border border-border/40 bg-muted/20 flex items-center justify-center shrink-0">
                    <FirstIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{firstSignal.label}</span>
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium", firstStatus.cn)}>
                        <FirstStatusIcon className="w-3 h-3" />
                        {firstStatus.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{firstSignal.detail}</p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          )}

          {/* ─── AUTH SPLIT: gated preview vs. full content ─── */}
          <SignedOut>
            <DossierGateOverlay companyName={data.name} />
          </SignedOut>

          <SignedIn>
            <FullDossierContent data={data} />
          </SignedIn>
        </div>
      </div>
    </>
  );
}
