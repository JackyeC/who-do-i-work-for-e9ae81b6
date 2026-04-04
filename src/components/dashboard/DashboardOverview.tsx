import { useAuth } from "@/contexts/AuthContext";
import { usePersona, type PersonaId } from "@/hooks/use-persona";
import { useDashboardBriefing } from "@/hooks/use-dashboard-briefing";
import DailyBriefingCard from "@/components/DailyBriefingCard";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, ArrowRight, ExternalLink, AlertTriangle, Shield,
  FileText, BookOpen, TrendingDown, Eye, Award, Newspaper,
  ChevronDown, Zap, FileCheck, Scale, BarChart3,
} from "lucide-react";
import { useState } from "react";
import { AlignedValuesSearch } from "./AlignedValuesSearch";
import { FoundingMemberBadge } from "@/components/FoundingMemberBadge";
import { AffirmationBar } from "./AffirmationBar";
import { YourJourney } from "./YourJourney";
import { JackyeMessage } from "./JackyeMessage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HireToRetireCommandCenter } from "@/components/dashboard/HireToRetireCommandCenter";

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

/* ── Map alert signal_category to severity ── */
function alertSeverity(cat: string | null): string {
  const high = ["enforcement", "regulatory", "lawsuit", "safety", "osha", "doj", "sec"];
  const critical = ["criminal", "fraud", "monopoly"];
  const c = (cat || "").toLowerCase();
  if (critical.some((k) => c.includes(k))) return "CRITICAL";
  if (high.some((k) => c.includes(k))) return "HIGH";
  return "MEDIUM";
}

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

/* ── Severity → RAG color mapping ── */
const SEVERITY_STYLES: Record<string, { dot: string; badge: string; border: string }> = {
  CRITICAL: {
    dot: "bg-destructive",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    border: "border-l-destructive",
  },
  HIGH: {
    dot: "bg-[hsl(35,100%,50%)]",
    badge: "bg-[hsla(35,100%,50%,0.15)] text-[hsl(35,100%,50%)] border-[hsla(35,100%,50%,0.3)]",
    border: "border-l-[hsl(35,100%,50%)]",
  },
  MEDIUM: {
    dot: "bg-[hsl(45,100%,50%)]",
    badge: "bg-[hsla(45,100%,50%,0.15)] text-[hsl(45,100%,50%)] border-[hsla(45,100%,50%,0.3)]",
    border: "border-l-[hsl(45,100%,50%)]",
  },
  LOW: {
    dot: "bg-[hsl(142,70%,45%)]",
    badge: "bg-[hsla(142,70%,45%,0.15)] text-[hsl(142,70%,45%)] border-[hsla(142,70%,45%,0.3)]",
    border: "border-l-[hsl(142,70%,45%)]",
  },
};

/* ── Helpers ── */
function scoreColorClass(score: number): string {
  if (score >= 70) return "text-[hsl(142,70%,45%)]";
  if (score >= 40) return "text-[hsl(45,100%,50%)]";
  return "text-destructive";
}

function scoreBgClass(score: number): string {
  if (score >= 70) return "bg-[hsla(142,70%,45%,0.15)] text-[hsl(142,70%,45%)]";
  if (score >= 40) return "bg-[hsla(45,100%,50%,0.15)] text-[hsl(45,100%,50%)]";
  return "bg-destructive/15 text-destructive";
}

function scoreDotClass(score: number): string {
  if (score >= 70) return "bg-[hsl(142,70%,45%)]";
  if (score >= 40) return "bg-[hsl(45,100%,50%)]";
  return "bg-destructive";
}

function BriefingCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 bg-card border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] ${className}`}>
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
   DASHBOARD OVERVIEW — Decision Engine Layout
   ════════════════════════════════════════════════════════════ */
export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { user } = useAuth();
  const { persona, personaName, hasTakenQuiz } = usePersona();
  const { data, isLoading } = useDashboardBriefing();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFoundingBadge, setShowFoundingBadge] = useState(false);
  const [dailyNoteOpen, setDailyNoteOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

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

      <HireToRetireCommandCenter onNavigate={onNavigate} />

      {/* ═══ QUICK ACTIONS BAR ═══ */}
      <motion.div {...anim(0)}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Shield, label: "Check an Offer", desc: "Numbers + culture", to: "/dashboard?tab=offers" },
            { icon: Search, label: "Audit a Company", desc: "Pull the receipts", to: "/dashboard?tab=tracked" },
            { icon: Scale, label: "Compare Benefits", desc: "Side by side", to: "/dashboard?tab=values" },
          ].map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="flex items-center gap-3 rounded-xl p-4 bg-card border border-border/30 hover:border-primary/30 hover:bg-card/80 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsla(43, 96%, 56%, 0.1)" }}>
                <a.icon className="w-4 h-4" style={{ color: "hsl(43, 96%, 56%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground">{a.label}</p>
                <p className="text-[11px] text-muted-foreground">{a.desc}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ═══ DAILY NOTE (collapsible Jackye + Affirmation) ═══ */}
      <motion.div {...anim(0.03)}>
        <Collapsible open={dailyNoteOpen} onOpenChange={setDailyNoteOpen}>
          <CollapsibleTrigger className="w-full">
            <div
              className="flex items-center justify-between rounded-xl px-5 py-3 border cursor-pointer transition-all hover:bg-card/80"
              style={{
                background: "linear-gradient(135deg, hsla(43, 96%, 56%, 0.04) 0%, transparent 100%)",
                borderColor: "hsla(43, 96%, 56%, 0.15)",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">✉️</span>
                <span className="text-[13px] font-semibold text-foreground">Daily Note from Jackye</span>
                <span className="text-xs text-muted-foreground">— tap to read</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${dailyNoteOpen ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-3">
              <JackyeMessage firstName={firstName} />
              <AffirmationBar />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>


      {/* ═══ URGENT SIGNALS — only shown when real alerts exist ═══ */}
      {alerts.length > 0 && (
      <motion.div {...anim(0.05)}>
        <BriefingCard className="border-l-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <h3 className="text-[16px] font-bold text-foreground tracking-tight">
                Urgent Signals
              </h3>
            </div>
            <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold border" style={{ color: "hsl(43, 96%, 56%)", backgroundColor: "hsla(43, 96%, 56%, 0.1)", borderColor: "hsla(43, 96%, 56%, 0.3)" }}>
              {alerts.length} ACTIVE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Signals from your watched companies — violations, settlements, and regulatory actions
          </p>
          <div className="space-y-2">
            {alerts.map((a: any, i: number) => {
              const sev = alertSeverity(a.signal_category);
              const style = SEVERITY_STYLES[sev] || SEVERITY_STYLES.MEDIUM;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={a.company_id ? `/dossier/${a.company_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "#"}
                    className={`block rounded-xl p-4 border-l-[3px] transition-all duration-200 hover:scale-[1.005] hover:shadow-md bg-muted/30 border border-border/30 hover:border-border/60 ${style.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                          <span className="text-sm font-bold text-foreground">{a.company_name}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono border ${style.badge}`}>
                            {sev}
                          </span>
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted/50">
                            {a.signal_category}
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground leading-snug">{a.change_description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground/50 font-mono">
                            {a.date_detected ? new Date(a.date_detected).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold whitespace-nowrap mt-0.5 flex items-center gap-1 shrink-0" style={{ color: "hsl(43, 96%, 56%)" }}>
                        Full story <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </BriefingCard>
      </motion.div>
      )}

      {/* ═══ EMPLOYER SEARCH (inline) ═══ */}
      <motion.div {...anim(0.08)}>
        <form onSubmit={handleSearch}>
          <div className="flex items-center rounded-xl px-4 py-3 bg-card border border-border/30 hover:border-border/60 transition-colors">
            <Search className="w-4 h-4 shrink-0 mr-3 text-primary" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Look up any employer — I'll tell you what I find..."
              className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </form>
      </motion.div>

      {/* ═══ TWO-COLUMN: WORK STREAM (left) + RESOURCES (right) ═══ */}
      <div className="grid md:grid-cols-[1fr_320px] gap-7">

        {/* ──── LEFT: WORK STREAM ──── */}
        <div className="space-y-5">

          {/* YOUR JOURNEY */}
          <YourJourney onNavigate={onNavigate} />

          {/* COMPANIES YOU'RE WATCHING */}
          <motion.div {...anim(0.12)}>
            <BriefingCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-bold text-foreground">
                  Companies You're Watching
                </h3>
                <span className="text-[10px] font-bold rounded-full px-2.5 py-1 border" style={{ color: "hsl(43, 96%, 56%)", backgroundColor: "hsla(43, 96%, 56%, 0.1)", borderColor: "hsla(43, 96%, 56%, 0.3)" }}>
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
                className="text-[12px] font-semibold mt-3 flex items-center gap-1 transition-colors hover:brightness-110"
                style={{ color: "hsl(43, 96%, 56%)" }}
              >
                Manage watchlist <ArrowRight className="w-3 h-3" />
              </button>
            </BriefingCard>
          </motion.div>

          {/* VALUES ALIGNMENT */}
          <motion.div {...anim(0.16)}>
            <BriefingCard>
              <h3 className="text-[16px] font-bold text-foreground mb-0.5">
                Aligned With Your Values
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Based on your Work DNA profile</p>
              <AlignedValuesSearch hasTakenQuiz={hasTakenQuiz} />
            </BriefingCard>
          </motion.div>
        </div>

        {/* ──── RIGHT: RESOURCES ──── */}
        <div className="space-y-5">

          {/* STRAIGHT FROM JACKYE */}
          <motion.div {...anim(0.14)}>
            <BriefingCard>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-[16px] font-bold text-foreground">Straight From Jackye</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Curated insider intel — not generic advice</p>
              <div className="space-y-2.5">
                {JACKYE_CONTENT.map((item) => {
                  const Wrapper = item.internal ? Link : "a";
                  const linkProps = item.internal
                    ? { to: item.link }
                    : { href: item.link, target: "_blank", rel: "noopener noreferrer" };
                  return (
                    <Wrapper
                      key={item.number}
                      {...(linkProps as any)}
                      className="block rounded-lg p-3 transition-all duration-200 bg-muted/20 border border-border/30 hover:bg-muted/40 hover:border-border/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-extrabold text-primary font-mono">
                              {item.number}
                            </span>
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold font-mono border" style={{ color: "hsl(43, 96%, 56%)", backgroundColor: "hsla(43, 96%, 56%, 0.1)", borderColor: "hsla(43, 96%, 56%, 0.3)" }}>
                              {item.type}
                            </span>
                          </div>
                          <p className="text-[12px] font-semibold text-foreground leading-snug mt-1">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            {item.source}
                          </p>
                        </div>
                        <span className="shrink-0 mt-1" style={{ color: "hsl(43, 96%, 56%)" }}>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            </BriefingCard>
          </motion.div>

          {/* THE TUESDAY LETTER */}
          <motion.div {...anim(0.18)}>
            <div className="rounded-xl overflow-hidden border" style={{ background: "linear-gradient(135deg, hsla(43, 96%, 56%, 0.08), hsla(35, 90%, 50%, 0.12))", borderColor: "hsla(43, 96%, 56%, 0.3)" }}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper className="w-4 h-4" style={{ color: "hsl(43, 96%, 56%)" }} />
                  <h3 className="text-[16px] font-bold text-foreground font-display">The Tuesday Letter</h3>
                </div>
                <p className="text-[12px] text-foreground/80 leading-relaxed mb-4">
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

          {/* FOUNDING MEMBER */}
          <motion.div {...anim(0.2)}>
            <div
              className="rounded-xl p-4 border cursor-pointer transition-all hover:bg-card/80"
              style={{
                background: "linear-gradient(135deg, rgba(240,192,64,0.06) 0%, rgba(240,192,64,0.02) 100%)",
                borderColor: "rgba(240,192,64,0.2)",
              }}
              onClick={() => setShowFoundingBadge(true)}
            >
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-foreground">Founding Member</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    You were here before day one.
                  </p>
                </div>
                <span className="text-[11px] font-semibold flex items-center gap-1 shrink-0" style={{ color: "hsl(43, 96%, 56%)" }}>
                  Badge <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Founding Member Badge Modal */}
      {showFoundingBadge && (
        <FoundingMemberBadge
          memberName={
            user?.email === "jackyeclayton@gmail.com"
              ? "Jackye Clayton"
              : data?.firstName || user?.email?.split("@")[0]
          }
          joinedDate={user?.created_at}
          onClose={() => setShowFoundingBadge(false)}
        />
      )}
    </div>
  );
}
