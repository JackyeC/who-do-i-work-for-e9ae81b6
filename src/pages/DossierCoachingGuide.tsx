import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, ShieldCheck, TrendingUp, Users, Star, Landmark,
  AlertTriangle, CheckCircle2, XCircle, MessageCircle, FileText,
  HelpCircle, Eye, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/* ── Sample data keyed by slug ── */
const COMPANY_DATA: Record<string, CompanyDossier> = {
  patagonia: {
    name: "Patagonia",
    industry: "Outdoor Apparel",
    location: "Ventura, CA",
    employees: "~4,200",
    integrityScore: 8.7,
    verdict:
      "This is one of the few companies where the mission isn't marketing — it's embedded in the business model. But don't confuse purpose with comfort. They move fast and expect a lot.",
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
      "If the hiring manager can't name a specific time the company chose mission over margin, the culture may be thinner than the brand suggests.",
      "Watch for vague answers about the ownership transition — if they deflect, the internal narrative may still be unsettled.",
      "If the interview process takes more than 4 weeks with no status updates, that's a sign of internal disorganization, not thoroughness.",
    ],
  },
};

interface SignalData {
  icon: string;
  label: string;
  status: "confirmed" | "watch" | "flag";
  detail: string;
}

interface CompanyDossier {
  name: string;
  industry: string;
  location: string;
  employees: string;
  integrityScore: number;
  verdict: string;
  signals: SignalData[];
  coachingNote: string;
  coverLetterAngle: string;
  interviewQuestions: string[];
  redFlags: string[];
}

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
      <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary font-semibold shrink-0">
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
        <span className="font-mono text-[10px] text-primary font-semibold mt-0.5">Q{index + 1}</span>
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

/* ── Page ── */
export default function DossierCoachingGuide() {
  const { slug } = useParams<{ slug: string }>();
  const data = COMPANY_DATA[slug || ""] || COMPANY_DATA.patagonia;

  return (
    <>
      <Helmet>
        <title>{data.name} — Coaching Guide | WDIWF</title>
        <meta name="description" content={`Candidate coaching dossier for ${data.name}. Integrity signals, interview prep, and cover letter strategy.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">

          {/* ─── 1. COMPANY VERDICT ─── */}
          <Reveal>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[9px] font-mono tracking-wider bg-primary/5 border-primary/20 text-primary">
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

              {/* Score + verdict */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-end gap-1.5">
                  <span className={cn("font-data text-4xl font-black tabular-nums", scoreColor(data.integrityScore))}>
                    {data.integrityScore.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">/10</span>
                </div>
                <Badge variant="outline" className={cn("text-[10px]", scoreBadgeCn(data.integrityScore))}>
                  {scoreLabel(data.integrityScore)}
                </Badge>
              </div>

              <blockquote className="border-l-2 border-primary/40 pl-4 text-sm text-foreground/80 leading-relaxed italic">
                "{data.verdict}"
              </blockquote>
            </div>
          </Reveal>

          {/* ─── 2. WHAT THE RECORD SHOWS ─── */}
          <Reveal delay={0.05}>
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
                          <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", status.cn)}>
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

          {/* ─── 3. HOW TO HANDLE THIS APPLICATION ─── */}
          <Reveal delay={0.08}>
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

          {/* ─── 4. YOUR COVER LETTER ANGLE ─── */}
          <Reveal delay={0.1}>
            <SectionHeader number="03" title="Your Cover Letter Angle" />
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

          {/* ─── 5. QUESTIONS TO ASK THEM ─── */}
          <Reveal delay={0.12}>
            <SectionHeader number="04" title="Questions to Ask Them" />
            <div className="space-y-2">
              {data.interviewQuestions.map((q, i) => (
                <ExpandableQuestion key={i} question={q} index={i} />
              ))}
            </div>
          </Reveal>

          {/* ─── 6. RED FLAGS TO WATCH ─── */}
          <Reveal delay={0.14}>
            <SectionHeader number="05" title="Red Flags to Watch in This Process" />
            <div className="space-y-3">
              {data.redFlags.map((flag, i) => (
                <div key={i} className="flex items-start gap-3 border border-destructive/15 bg-destructive/5 p-4">
                  <Eye className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80 leading-relaxed">{flag}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Disclaimer */}
          <Reveal delay={0.16}>
            <div className="border border-border/30 bg-muted/30 px-5 py-4 text-[10px] text-muted-foreground leading-relaxed font-mono">
              <span className="text-primary font-semibold tracking-wider uppercase text-[9px]">NOTE</span>{" "}
              This coaching guide is generated from public records and documented signals. It does not constitute legal or employment advice.
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}
