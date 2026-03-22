import { useAuth } from "@/contexts/AuthContext";
import { usePersona, type PersonaId } from "@/hooks/use-persona";
import { useDashboardBriefing } from "@/hooks/use-dashboard-briefing";
import DailyBriefingCard from "@/components/DailyBriefingCard";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, ArrowRight, ExternalLink, AlertTriangle, Shield,
  FileText, BookOpen, TrendingDown, Eye,
} from "lucide-react";
import { useState } from "react";
import { AlignedValuesSearch } from "./AlignedValuesSearch";

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

/* ── Theme tokens ── */
const C = {
  bg: "#0a0a0e",
  card: "#13121a",
  border: "rgba(255,255,255,0.08)",
  gold: "#f0c040",
  cream: "#f0ebe0",
  muted: "#b8b4a8",
  dimmed: "#7a7590",
  red: "#ff4d6d",
  green: "#47ffb3",
  blue: "#1f7ad6",
  orange: "#e07a10",
};

/* ── Signal card data ── */
const SIGNAL_CARDS = [
  {
    company: "Amazon",
    slug: "amazon",
    badge: "OSHA",
    badgeColor: C.red,
    summary: "6 OSHA citations across 4 fulfillment centers — ergonomic & rate-related injuries",
    amount: "$60K+ penalties",
    severity: "HIGH",
    date: "Jan 2025",
    source: "OSHA",
  },
  {
    company: "Goldman Sachs",
    slug: "goldman-sachs",
    badge: "DOJ",
    badgeColor: C.red,
    summary: "1MDB global bribery & money-laundering settlement — systemic compliance failure",
    amount: "$2.9B settlement",
    severity: "CRITICAL",
    date: "2020",
    source: "DOJ",
  },
  {
    company: "JPMorgan Chase",
    slug: "jpmorgan-chase",
    badge: "SEC",
    badgeColor: C.orange,
    summary: "Spoofing precious-metals & Treasury markets — traders convicted",
    amount: "$920M fine",
    severity: "HIGH",
    date: "2020",
    source: "SEC / CFTC",
  },
  {
    company: "Starbucks",
    slug: "starbucks",
    badge: "NLRB",
    badgeColor: C.orange,
    summary: "$1B restructuring — 500+ store closures, 2,000 layoffs, union suppression findings",
    amount: "$1B restructuring",
    severity: "HIGH",
    date: "2025",
    source: "NLRB / Reuters",
  },
  {
    company: "Google / Alphabet",
    slug: "google-alphabet",
    badge: "DOJ",
    badgeColor: C.red,
    summary: "Antitrust ruling — illegal monopoly on search ads, remedies pending breakup risk",
    amount: "Monopoly ruling",
    severity: "CRITICAL",
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
    riskColor: C.red,
  },
  {
    text: "Goldman Sachs' 1MDB settlement revealed systemic compliance gaps at the leadership level — ask about post-settlement governance reforms in any interview.",
    source: "DOJ / SEC",
    risk: "HIGH",
    riskColor: C.red,
  },
  {
    text: "Starbucks has closed 500+ stores and laid off 2,000 employees while fighting NLRB union complaints in 30+ states — workforce stability is a live concern.",
    source: "Reuters / NLRB",
    risk: "MEDIUM",
    riskColor: C.orange,
  },
  {
    text: "Google's antitrust ruling could force structural changes to Search — any role tied to ad revenue should be evaluated for 12-month exposure.",
    source: "DOJ Antitrust",
    risk: "MEDIUM",
    riskColor: C.orange,
  },
];

/* ── From Jackye content ── */
const JACKYE_CONTENT = [
  {
    number: "01",
    type: "ARTICLE",
    title: "The Interview Is a Two-Way Street — Why You Should Audit Your Interviewer",
    desc: "Jackye breaks down why candidates who research the company's public record outperform those who only rehearse answers.",
    link: "https://www.linkedin.com/pulse/interview-two-way-street-jackye-clayton/",
    source: "LinkedIn · Jackye Clayton",
  },
  {
    number: "02",
    type: "TOOL TIP",
    title: "Use the Interview Dossier Before Every Interview — Not After",
    desc: "The Dossier shows you what the company's public record says vs. what their careers page promises. Read the 'Smart Questions' tab and ask at least 2 in the room.",
    link: "/interview-dossier",
    source: "WDIWF Interview Dossier",
    internal: true,
  },
  {
    number: "03",
    type: "INSIDER INTEL",
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
function scoreColor(score: number): string {
  if (score >= 70) return C.green;
  if (score >= 40) return C.gold;
  return C.red;
}

function BriefingCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-6 ${className}`} style={{ background: C.card, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: "#1c1a27" }} />;
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
        score: t.company?.civic_footprint_score ?? 0,
      }))
    : DEMO_WATCHED;

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">

      {/* ═══ 1 — MORNING GREETING ═══ */}
      <motion.div {...anim(0)}>
        <BriefingCard>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full text-xs font-bold px-3 py-1"
              style={{ background: "rgba(240,192,64,0.1)", border: "1px solid rgba(240,192,64,0.3)", color: C.gold, fontSize: 11 }}
            >
              <Eye className="w-3 h-3" /> LIVE INTELLIGENCE
            </span>
            <span style={{ fontSize: 11, color: C.dimmed, fontFamily: "'DM Mono',monospace" }}>{dateStr}</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.cream, letterSpacing: "-0.5px", lineHeight: 1.3 }}>
            Good morning, {firstName}.
          </h2>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.6, marginTop: 8 }}>
            {data?.alerts && data.alerts.length > 0
              ? `${new Set(data.alerts.map((a: any) => a.company_name)).size} companies you're watching had signal updates. `
              : ""}
            5 employer signals require your attention today. Here's what the public record is showing.
          </p>
          <p style={{ fontSize: 13, color: C.cream, marginTop: 10, fontWeight: 600, fontStyle: "italic" }}>
            "You deserve to know exactly who you work for."
          </p>
        </BriefingCard>
      </motion.div>

      {/* ═══ 2 — SIGNAL CARDS (5 real company violations) ═══ */}
      <motion.div {...anim(0.06)}>
        <BriefingCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.cream, letterSpacing: "-0.3px" }}>
                Employer Signal Alerts
              </h3>
              <p style={{ fontSize: 12, color: C.dimmed, marginTop: 2 }}>
                Active violations, settlements, and regulatory actions from the public record
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: `${C.red}18`, color: C.red, border: `1px solid ${C.red}40` }}
            >
              {SIGNAL_CARDS.length} ACTIVE
            </span>
          </div>
          <div className="space-y-2.5">
            {SIGNAL_CARDS.map((s, i) => (
              <Link
                key={i}
                to={`/dossier/${s.slug}`}
                className="block rounded-xl p-4 transition-all hover:scale-[1.005]"
                style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.cream }}>{s.company}</span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-bold"
                        style={{
                          background: `${s.badgeColor}18`,
                          color: s.badgeColor,
                          border: `1px solid ${s.badgeColor}40`,
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 10,
                        }}
                      >
                        {s.badge}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-bold"
                        style={{
                          background: s.severity === "CRITICAL" ? `${C.red}18` : `${C.orange}18`,
                          color: s.severity === "CRITICAL" ? C.red : C.orange,
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 10,
                        }}
                      >
                        {s.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>{s.summary}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: "'DM Mono',monospace" }}>
                        {s.amount}
                      </span>
                      <span style={{ fontSize: 11, color: C.dimmed }}>·</span>
                      <span style={{ fontSize: 11, color: C.dimmed, fontFamily: "'DM Mono',monospace" }}>{s.date}</span>
                      <span style={{ fontSize: 11, color: C.dimmed }}>·</span>
                      <span style={{ fontSize: 11, color: C.dimmed }}>{s.source}</span>
                    </div>
                  </div>
                  <span style={{ color: C.gold, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", marginTop: 2 }} className="flex items-center gap-1">
                    View Full Audit <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
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
              <AlertTriangle className="w-4 h-4" style={{ color: C.gold }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.cream }}>Intelligence Briefing</h3>
            </div>
            <div className="space-y-3">
              {INTEL_BULLETS.map((b, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="rounded px-1.5 py-0.5 text-xs font-bold"
                      style={{
                        background: `${b.riskColor}18`,
                        color: b.riskColor,
                        border: `1px solid ${b.riskColor}40`,
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 10,
                      }}
                    >
                      {b.risk} RISK
                    </span>
                    <span style={{ fontSize: 10, color: C.dimmed, fontFamily: "'DM Mono',monospace" }}>
                      Source: {b.source}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.cream, lineHeight: 1.5 }}>{b.text}</p>
                </div>
              ))}
            </div>
          </BriefingCard>
        </motion.div>

        {/* 3B — From Jackye */}
        <motion.div {...anim(0.16)}>
          <BriefingCard className="h-full">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4" style={{ color: C.gold }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.cream }}>From Jackye</h3>
            </div>
            <p style={{ fontSize: 11, color: C.dimmed, marginBottom: 12 }}>Curated insider intel — not generic advice</p>
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
                    className="block rounded-lg p-3.5 transition-colors"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'DM Mono',monospace" }}>
                        {item.number}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: C.blue,
                          background: `${C.blue}15`,
                          border: `1px solid ${C.blue}30`,
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.cream, lineHeight: 1.4, marginTop: 4 }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45, marginTop: 3 }}>
                      {item.desc}
                    </p>
                    <p style={{ fontSize: 10, color: C.dimmed, marginTop: 4 }} className="flex items-center gap-1">
                      {item.source} {!item.internal && <ExternalLink className="w-2.5 h-2.5" />}
                    </p>
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
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.cream }}>
                Companies You're Watching
              </h3>
              <span style={{ fontSize: 11, color: C.dimmed, fontFamily: "'DM Mono',monospace" }}>
                {trackedCompanies.length} tracked
              </span>
            </div>
            <div className="space-y-1">
              {trackedCompanies.map((t: any, i: number) => {
                const score = t.score ?? 0;
                return (
                  <Link
                    key={i}
                    to={`/dossier/${t.slug}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg transition-colors group"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <span className="shrink-0 rounded-full" style={{ width: 8, height: 8, background: scoreColor(score) }} />
                    <span className="flex-1 min-w-0 truncate group-hover:text-primary transition-colors" style={{ fontSize: 14, fontWeight: 600, color: C.cream }}>
                      {t.name}
                    </span>
                    <span style={{ fontSize: 12, color: C.dimmed }} className="hidden sm:block">{t.industry}</span>
                    <span
                      className="text-xs font-bold shrink-0 rounded-full px-2 py-0.5"
                      style={{ background: `${scoreColor(score)}15`, color: scoreColor(score) }}
                    >
                      {score}
                    </span>
                  </Link>
                );
              })}
            </div>
            <button
              onClick={() => onNavigate("tracked")}
              className="text-xs font-medium mt-3 flex items-center gap-1 transition-colors"
              style={{ color: C.gold }}
            >
              Manage watchlist <ArrowRight className="w-3 h-3" />
            </button>
          </BriefingCard>
        </motion.div>

        {/* 4B — Daily Briefing */}
        <motion.div {...anim(0.24)}>
          <DailyBriefingCard />
        </motion.div>
      </div>

      {/* ═══ 5 — VALUES ALIGNMENT + AUDIT SEARCH (2 cols) ═══ */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* 5A — Values Alignment */}
        <motion.div {...anim(0.28)}>
          <BriefingCard className="h-full">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.cream, marginBottom: 2 }}>
              Aligned With Your Values
            </h3>
            <p style={{ fontSize: 11, color: C.dimmed, marginBottom: 12 }}>Based on your Work DNA profile</p>
            <AlignedValuesSearch hasTakenQuiz={hasTakenQuiz} />
          </BriefingCard>
        </motion.div>

        {/* 5B — Quick Audit */}
        <motion.div {...anim(0.32)}>
          <BriefingCard className="h-full flex flex-col justify-center">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.cream, marginBottom: 4 }}>
              Audit any employer →
            </h3>
            <p style={{ fontSize: 12, color: C.dimmed, marginBottom: 12 }}>
              Search by name. We'll pull the public record, signals, and receipts.
            </p>
            <form onSubmit={handleSearch}>
              <div
                className="flex items-center rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.1)` }}
              >
                <Search className="w-4 h-4 shrink-0 mr-3" style={{ color: C.gold }} />
                <input
                  data-quick-audit
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Amazon, Goldman Sachs, your next interview..."
                  className="bg-transparent border-none outline-none w-full"
                  style={{ fontSize: 14, color: C.cream }}
                />
              </div>
            </form>
          </BriefingCard>
        </motion.div>
      </div>
    </div>
  );
}
