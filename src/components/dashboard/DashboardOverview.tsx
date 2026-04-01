import { useAuth } from "@/contexts/AuthContext";
import { usePersona, type PersonaId } from "@/hooks/use-persona";
import { useDashboardBriefing } from "@/hooks/use-dashboard-briefing";
import DailyBriefingCard from "@/components/DailyBriefingCard";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, ArrowRight, ExternalLink, AlertTriangle, Shield,
  FileText, BookOpen, TrendingDown, Eye, Award, Newspaper,
} from "lucide-react";
import { useState } from "react";
import { AlignedValuesSearch } from "./AlignedValuesSearch";
import { FoundingMemberBadge } from "@/components/FoundingMemberBadge";
import { JackyeMessage } from "./JackyeMessage";
import { AffirmationBar } from "./AffirmationBar";
import { YourJourney } from "./YourJourney";

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

/* ── Signal card data ── */
const SIGNAL_CARDS = [
  {
    company: "Amazon",
    slug: "amazon",
    badge: "OSHA",
    badgeVariant: "destructive" as const,
    summary: "We found 6 OSHA citations across 4 fulfillment centers — ergonomic injuries and heat exposure. If you're interviewing here, ask about warehouse safety culture.",
    amount: "$60K+ penalties",
    severity: "HIGH",
    severityVariant: "destructive" as const,
    date: "Jan 2025",
    source: "OSHA",
  },
  {
    company: "Goldman Sachs",
    slug: "goldman-sachs",
    badge: "DOJ",
    badgeVariant: "destructive" as const,
    summary: "$6B+ in fines since 2010. Off-channel comms, 1MDB fraud, misleading investors. Their compliance record tells a story worth reading.",
    amount: "$2.9B settlement",
    severity: "CRITICAL",
    severityVariant: "destructive" as const,
    date: "2020",
    source: "DOJ",
  },
  {
    company: "JPMorgan Chase",
    slug: "jpmorgan-chase",
    badge: "SEC",
    badgeVariant: "warning" as const,
    summary: "Spoofing precious-metals and Treasury markets — traders convicted. $920M in fines. Worth understanding before you walk in.",
    amount: "$920M fine",
    severity: "HIGH",
    severityVariant: "warning" as const,
    date: "2020",
    source: "SEC / CFTC",
  },
  {
    company: "Starbucks",
    slug: "starbucks",
    badge: "NLRB",
    badgeVariant: "warning" as const,
    summary: "$1B restructuring with 500+ store closures and 2,000 layoffs. Union disputes ongoing. Know what you're walking into.",
    amount: "$1B restructuring",
    severity: "HIGH",
    severityVariant: "warning" as const,
    date: "2025",
    source: "NLRB / Reuters",
  },
  {
    company: "Google / Alphabet",
    slug: "google-alphabet",
    badge: "DOJ",
    badgeVariant: "destructive" as const,
    summary: "Found guilty of maintaining an illegal monopoly on search ads. Remedies pending — this could reshape the entire company.",
    amount: "Monopoly ruling",
    severity: "CRITICAL",
    severityVariant: "destructive" as const,
    date: "2024",
    source: "DOJ Antitrust",
  },
];

/* ── Intel bullets ── */
const INTEL_BULLETS = [
  {
    text: "Amazon is under active wage/hour scrutiny exceeding $100M in violations — verify comp equity before accepting any offer.",
    source: "DOJ / OSHA",
    risk: "HIGH",
    variant: "destructive" as const,
  },
  {
    text: "Goldman Sachs' 1MDB settlement revealed systemic compliance gaps at the leadership level — ask about post-settlement governance reforms in any interview.",
    source: "DOJ / SEC",
    risk: "HIGH",
    variant: "destructive" as const,
  },
  {
    text: "Starbucks has closed 500+ stores and laid off 2,000 employees while fighting NLRB union complaints in 30+ states — workforce stability is a live concern.",
    source: "Reuters / NLRB",
    risk: "MEDIUM",
    variant: "warning" as const,
  },
  {
    text: "Google's antitrust ruling could force structural changes to Search — any role tied to ad revenue should be evaluated for 12-month exposure.",
    source: "DOJ Antitrust",
    risk: "MEDIUM",
    variant: "warning" as const,
  },
];

/* ── From Jackye content ── */
const JACKYE_CONTENT = [
  {
    number: "01",
    type: "ARTICLE" as const,
    title: "The Interview Is a Two-Way Street — Why You Should Audit Your Interviewer",
    desc: "Jackye breaks down why candidates who research the company's public record outperform those who only rehearse answers.",
    link: "https://www.linkedin.com/pulse/interview-two-way-street-jackye-clayton/",
    source: "LinkedIn · Jackye Clayton",
  },
  {
    number: "02",
    type: "TOOL TIP" as const,
    title: "Use the Interview Dossier Before Every Interview — Not After",
    desc: "The Dossier shows you what the company's public record says vs. what their careers page promises. Read the 'Smart Questions' tab and ask at least 2 in the room.",
    link: "/interview-dossier",
    source: "Who Do I Work For Interview Dossier",
    internal: true,
  },
  {
    number: "03",
    type: "DEEP DIVE" as const,
    title: "Read the SEC Proxy Statement Before Your Interview — Here's Why",
    desc: "The DEF 14A filing shows executive compensation, board composition, and governance risks. If you're interviewing at a public company, 10 minutes on EDGAR is worth 2 hours of Glassdoor.",
    link: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=DEF+14A",
    source: "SEC EDGAR · Pro tip",
  },
];

/* ── Demo watched companies (fallback) ── */
const DEMO_WATCHED = [
  { name: "Amazon", slug: "amazon", industry: "Technology / Logistics", score: 42 },
  { name: "Goldman Sachs", slug: "goldman-sachs", industry: "Financial Services", score: 38 },
  { name: "Starbucks", slug: "starbucks", industry: "Food & Beverage", score: 51 },
  { name: "Google / Alphabet", slug: "google-alphabet", industry: "Technology", score: 62 },
  { name: "JPMorgan Chase", slug: "jpmorgan-chase", industry: "Financial Services", score: 55 },
];

/* ── Helpers ── */
function scoreColorClass(score: number): string {
  if (score >= 70) return "text-civic-green";
  if (score >= 40) return "text-primary";
  return "text-destructive";
}

function scoreBgClass(score: number): string {
  if (score >= 70) return "bg-civic-green/10 text-civic-green";
  if (score >= 40) return "bg-primary/10 text-primary";
  return "bg-destructive/10 text-destructive";
}

function scoreDotClass(score: number): string {
  if (score >= 70) return "bg-civic-green";
  if (score >= 40) return "bg-primary";
  return "bg-destructive";
}

const VARIANT_CLASSES = {
  destructive: {
    badge: "bg-destructive/10 text-destructive border-destructive/30",
  },
  warning: {
    badge: "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30",
  },
  info: {
    badge: "bg-civic-blue/10 text-civic-blue border-civic-blue/30",
  },
};

function BriefingCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-6 bg-card border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] hover:bg-card/80 ${className}`}>
      {children}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg animate-pulse bg-muted ${className}`} />;
}

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

/* ════════════════════════════════════════════════════════════
   DASHBOARD OVERVIEW
   ════════════════════════════════════════════════════════════ */
export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { user } = useAuth();
  const { persona, personaName, hasTakenQuiz } = usePersona();
  const { data, isLoading } = useDashboardBriefing();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFoundingBadge, setShowFoundingBadge] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[1200px] mx-auto">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-2 gap-5"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      </div>
    );
  }

  const firstName = data?.firstName || "there";
  const trackedCompanies = data?.tracked && data.tracked.length > 0
    ? data.tracked.map((t: any) => ({
        name: t.company?.name,
        slug: t.company?.slug,
        industry: t.company?.industry,
        score: t.company?.employer_clarity_score ?? 0,
      }))
    : DEMO_WATCHED;

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">

      {/* ═══ 1 — JACKYE'S MESSAGE ═══ */}
      <JackyeMessage firstName={firstName} />

      {/* ═══ AFFIRMATION BAR ═══ */}
      <AffirmationBar />

      {/* ═══ QUICK EMPLOYER SEARCH ═══ */}
      <motion.div {...anim(0.05)}>
        <div className="rounded-2xl p-5 bg-card border border-border/30">
          <h3 className="text-base font-bold text-foreground mb-1">
            Audit any employer →
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Search by name. We'll pull the public record, signals, and receipts.
          </p>
          <form onSubmit={handleSearch}>
            <div className="flex items-center rounded-xl px-4 py-3 bg-muted/30 border border-border/30">
              <Search className="w-4 h-4 shrink-0 mr-3 text-primary" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Look up any employer — I'll tell you what I find..."
                className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          </form>
        </div>
      </motion.div>

      {/* ═══ YOUR JOURNEY ═══ */}
      <YourJourney onNavigate={onNavigate} />

      {/* ═══ FOUNDING MEMBER BANNER ═══ */}
      <motion.div {...anim(0.03)}>
        <div
          className="rounded-2xl p-5 border cursor-pointer transition-all hover:scale-[1.005]"
          style={{
            background: "linear-gradient(135deg, rgba(240,192,64,0.06) 0%, rgba(240,192,64,0.02) 100%)",
            borderColor: "rgba(240,192,64,0.2)",
          }}
          onClick={() => setShowFoundingBadge(true)}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "radial-gradient(circle, rgba(240,192,64,0.15) 0%, transparent 70%)",
                border: "1.5px solid rgba(240,192,64,0.3)",
              }}
            >
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-foreground">You're a Founding Member</h3>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                  PRE-LAUNCH
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                You joined before April 7. Download and share your badge — let people know you were here first.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary whitespace-nowrap flex items-center gap-1 shrink-0">
              Get Badge <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* Founding Member Badge Modal */}
      {showFoundingBadge && (
        <FoundingMemberBadge
          memberName={
            // Prefer email-derived name for known accounts; full_name may be legal name from OAuth
            user?.email === "jackyeclayton@gmail.com"
              ? "Jackye Clayton"
              : data?.firstName || user?.email?.split("@")[0]
          }
          joinedDate={user?.created_at}
          onClose={() => setShowFoundingBadge(false)}
        />
      )}

      {/* ═══ 2 — SIGNAL CARDS (5 real company violations) ═══ */}
      <motion.div {...anim(0.06)}>
        <BriefingCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[16px] font-bold text-foreground tracking-tight">
                We're Watching Your Back
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active violations, settlements, and regulatory actions we found in the public record
              </p>
            </div>
            <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold bg-destructive/10 text-destructive border border-destructive/30">
              {SIGNAL_CARDS.length} ACTIVE
            </span>
          </div>
          <div className="space-y-2.5">
            {SIGNAL_CARDS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={`/dossier/${s.slug}`}
                  className="block rounded-xl p-4 transition-all duration-200 hover:scale-[1.008] hover:shadow-md hover:shadow-primary/[0.06] bg-muted/30 border border-border/30 hover:border-primary/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{s.company}</span>
                        <span className={`rounded px-1.5 py-0.5 text-xs font-bold font-mono border ${VARIANT_CLASSES[s.badgeVariant].badge}`}>
                          {s.badge}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-xs font-bold font-mono ${VARIANT_CLASSES[s.severityVariant].badge}`}>
                          {s.severity}
                        </span>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-snug">{s.summary}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-bold text-primary font-mono">
                          {s.amount}
                        </span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="text-xs text-muted-foreground/50 font-mono">{s.date}</span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="text-xs text-muted-foreground/50">{s.source}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold whitespace-nowrap mt-0.5 flex items-center gap-1 transition-all" style={{ color: "hsl(43, 96%, 56%)" }}>
                      Read the full story <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </BriefingCard>
      </motion.div>

      {/* ═══ YOUR NEXT MOVE ═══ */}
      <motion.div {...anim(0.09)}>
        <BriefingCard>
          <h3 className="text-base font-extrabold text-foreground tracking-tight mb-4">Your Next Move</h3>
          <div className="space-y-2.5">
            {[
              { label: "Protect My Career", subtitle: "I'll audit any employer you're looking at", to: "/dashboard?tab=tracked" },
              { label: "Review My Offer", subtitle: "Let's make sure the numbers and culture add up", to: "/dashboard?tab=offers" },
              { label: "Build My Career Map", subtitle: "Figure out your next move — together", to: "/dashboard?tab=how" },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center justify-between gap-3 rounded-xl p-4 bg-muted/30 border border-border/30 hover:border-primary/20 hover:shadow-md transition-all duration-200"
              >
                <div>
                  <p className="text-[14px] font-bold text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.subtitle}</p>
                </div>
                <span className="shrink-0" style={{ color: "hsl(43, 96%, 56%)" }}>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </BriefingCard>
      </motion.div>

      {/* ═══ 3 — INTELLIGENCE BULLETS + FROM JACKYE (2 cols) ═══ */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* 3A — Intelligence Briefing */}
        <motion.div {...anim(0.12)}>
          <BriefingCard className="h-full">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">What You Should Know</h3>
            </div>
            <div className="space-y-3">
              {INTEL_BULLETS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-lg p-3 bg-muted/30 border border-border/30 transition-all duration-200 hover:border-border/60"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-bold font-mono border ${VARIANT_CLASSES[b.variant].badge}`}>
                      {b.risk} RISK
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Source: {b.source}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-foreground leading-relaxed">{b.text}</p>
                </motion.div>
              ))}
            </div>
          </BriefingCard>
        </motion.div>

        {/* 3B — From Jackye */}
        <motion.div {...anim(0.16)}>
          <BriefingCard className="h-full">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Straight From Jackye</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Curated insider intel — not generic advice</p>
            <div className="space-y-3">
              {JACKYE_CONTENT.map((item) => {
                const Wrapper = item.internal ? Link : "a";
                const linkProps = item.internal
                  ? { to: item.link }
                  : { href: item.link, target: "_blank", rel: "noopener noreferrer" };
                return (
                  <Wrapper
                    key={item.number}
                    {...(linkProps as any)}
                    className="block rounded-lg p-3.5 transition-colors bg-muted/20 border border-border/30 hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-extrabold text-primary font-mono">
                            {item.number}
                          </span>
                          <span className="rounded px-1.5 py-0.5 text-xs font-bold font-mono border" style={{ color: "hsl(43, 96%, 56%)", backgroundColor: "hsla(43, 96%, 56%, 0.1)", borderColor: "hsla(43, 96%, 56%, 0.3)" }}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[13px] font-semibold text-foreground leading-snug mt-1">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {item.source}
                        </p>
                      </div>
                      <span className="shrink-0 mt-1" style={{ color: "hsl(43, 96%, 56%)" }}>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </BriefingCard>
        </motion.div>
      </div>

      {/* ═══ 4 — COMPANIES YOU'RE WATCHING + DAILY BRIEFING (2 cols) ═══ */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* 4A — Watched Companies */}
        <motion.div {...anim(0.2)}>
          <BriefingCard className="h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">
                Companies You're Watching
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                {trackedCompanies.length} tracked
              </span>
            </div>
            <div className="space-y-1">
              {trackedCompanies.map((t: any, i: number) => {
                const score = t.score ?? 0;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      to={`/dossier/${t.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group bg-muted/20 hover:bg-muted/40 hover:translate-x-0.5"
                    >
                      <span className={`shrink-0 w-2 h-2 rounded-full ${scoreDotClass(score)}`} />
                      <span className="flex-1 min-w-0 truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {t.name}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:block">{t.industry}</span>
                      <span className={`text-xs font-bold shrink-0 rounded-full px-2 py-0.5 ${scoreBgClass(score)}`}>
                        {score}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            <button
              onClick={() => onNavigate("tracked")}
              className="text-xs font-medium mt-3 flex items-center gap-1 transition-colors text-primary hover:text-primary/80"
            >
              Manage watchlist <ArrowRight className="w-3 h-3" />
            </button>
          </BriefingCard>
        </motion.div>

        {/* 4B — The Tuesday Letter */}
        <motion.div {...anim(0.24)}>
          <div className="rounded-xl overflow-hidden border" style={{ background: "linear-gradient(135deg, hsla(43, 96%, 56%, 0.08), hsla(35, 90%, 50%, 0.12))", borderColor: "hsla(43, 96%, 56%, 0.3)" }}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Newspaper className="w-4 h-4" style={{ color: "hsl(43, 96%, 56%)" }} />
                <h3 className="text-sm font-bold text-foreground font-display">The Tuesday Letter</h3>
              </div>
              <p className="text-[13px] text-foreground/80 leading-relaxed mb-4">
                Every Tuesday I send out what I'm seeing — the signals, the moves, the things nobody else is saying out loud. It's free, it's unfiltered, and it's for you.
              </p>
              <button
                onClick={() => navigate("/newsletter")}
                className="w-full rounded-lg py-2.5 text-sm font-bold transition-all hover:brightness-110"
                style={{ backgroundColor: "hsl(43, 96%, 56%)", color: "hsl(0, 0%, 10%)" }}
              >
                I'm In
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ 5 — VALUES ALIGNMENT + AUDIT SEARCH (2 cols) ═══ */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* 5A — Values Alignment */}
        <motion.div {...anim(0.28)}>
          <BriefingCard className="h-full">
            <h3 className="text-sm font-bold text-foreground mb-0.5">
              Aligned With Your Values
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Based on your Work DNA profile</p>
            <AlignedValuesSearch hasTakenQuiz={hasTakenQuiz} />
          </BriefingCard>
        </motion.div>

      </div>
    </div>
  );
}
