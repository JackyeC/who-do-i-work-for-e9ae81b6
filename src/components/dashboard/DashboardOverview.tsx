import { useAuth } from "@/contexts/AuthContext";
import { usePersona, PERSONA_NAMES, type PersonaId } from "@/hooks/use-persona";
import { useDashboardBriefing } from "@/hooks/use-dashboard-briefing";
import { useGNews } from "@/hooks/use-gnews";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlignedValuesSearch } from "./AlignedValuesSearch";

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

/* ── Persona taglines ── */
const PERSONA_TAGLINES: Record<string, string> = {
  investor: "Investor lens",
  job_seeker: "Job seeker lens",
  recruiter: "Recruiter lens",
  executive: "Executive lens",
  researcher: "Research lens",
  journalist: "Accountability lens",
  sales: "Sales intel lens",
  marketing: "Brand audit lens",
  career_changer: "Career pivot lens",
};

/* ── Persona greetings ── */
const PERSONA_GREETINGS: Record<string, string> = {
  recruiter: "here's what candidates are finding about the market today.",
  executive: "here's what your talent pipeline is seeing today.",
  sales: "here's the intelligence on your pipeline.",
};

/* ── Alert dot color ── */
function alertDotColor(category: string, changeType?: string): string {
  const negative = ["nlrb", "osha", "warn_act", "reality_gap_down", "score_dropped"];
  const positive = ["score_improved", "glassdoor_up", "comp_listed"];
  if (negative.some(n => category?.toLowerCase().includes(n) || changeType?.toLowerCase()?.includes(n))) return "#ff4d6d";
  if (positive.some(p => category?.toLowerCase().includes(p) || changeType?.toLowerCase()?.includes(p))) return "#47ffb3";
  return "#f0c040";
}

/* ── Score pill color ── */
function scoreColor(score: number): string {
  if (score >= 70) return "#47ffb3";
  if (score >= 40) return "#f0c040";
  return "#ff4d6d";
}

/* ── News source badge color ── */
function sourceBadgeColor(source: string): string {
  const s = (source || "").toLowerCase();
  if (s.includes("nlrb")) return "#ff6b35";
  if (s.includes("osha")) return "#f0c040";
  return "#7eb8f7";
}

/* ── Skeleton shimmer ── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: "#1c1a27" }}
    />
  );
}

/* ── Card shell ── */
function BriefingCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: "#13121a",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </div>
  );
}

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { user } = useAuth();
  const { persona, personaName, hasTakenQuiz } = usePersona();
  const { data, isLoading } = useDashboardBriefing();
  const { data: gnewsArticles } = useGNews();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // Build briefing summary
  const buildSummary = () => {
    if (!data) return "";
    const parts: string[] = [];
    if (data.alerts.length > 0) {
      const companyCount = new Set(data.alerts.map((a: any) => a.company_name)).size;
      parts.push(`${companyCount} ${companyCount === 1 ? "company" : "companies"} you're watching had signal updates.`);
    }
    if (data.news.length > 0) {
      parts.push("New workforce intelligence in today's feed.");
    }
    if (parts.length === 0) {
      parts.push("No new signals overnight. Your watched companies are steady.");
    }
    return parts.join(" ");
  };

  const greeting = persona && PERSONA_GREETINGS[persona]
    ? `Good morning${data?.firstName ? `, ${data.firstName}` : ""} — ${PERSONA_GREETINGS[persona]}`
    : `Good morning${data?.firstName ? `, ${data.firstName}` : ""}.`;

  const tagline = persona ? PERSONA_TAGLINES[persona] || "" : "";

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[1200px] mx-auto">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-2 gap-5">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">

      {/* ═══ SECTION 1 — Morning Greeting ═══ */}
      <motion.div {...anim(0)}>
        <BriefingCard>
          {persona && personaName && (
            <span
              className="inline-block rounded-full text-xs font-semibold mb-3"
              style={{
                background: "rgba(240,192,64,0.1)",
                border: "1px solid rgba(240,192,64,0.3)",
                padding: "4px 12px",
                color: "#f0c040",
                fontSize: "11px",
              }}
            >
              {personaName} · {tagline}
            </span>
          )}
          <h2
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#f0ebe0",
              letterSpacing: "-0.5px",
              lineHeight: 1.3,
            }}
          >
            {greeting}
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", color: "#b8b4a8", lineHeight: 1.6, marginTop: "8px" }}>
            {buildSummary()}
          </p>
          {data?.hasResume && data.parsedSkillsCount > 0 && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#7a7590", marginTop: "6px" }}>
              Resume parsed — {data.parsedSkillsCount} skills extracted
            </p>
          )}
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", marginTop: "4px" }} className="text-muted-foreground">
            {dateStr}
          </p>
        </BriefingCard>
      </motion.div>

      {/* ═══ SECTION 2 — Alerts + Values Alignment (2 columns) ═══ */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* 2A — Your Alerts */}
        <motion.div {...anim(0.06)}>
          <BriefingCard className="h-full">
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: "#f0ebe0", marginBottom: "12px" }}>
              Your Alerts
            </h3>
            {data?.alerts && data.alerts.length > 0 ? (
              <div className="space-y-2">
                {data.alerts.map((alert: any) => (
                  <Link
                    key={alert.id}
                    to={alert.company_id ? `/company/${alert.company_name?.toLowerCase().replace(/\s+/g, "-")}` : "#"}
                    className="flex items-start gap-3 p-2.5 rounded-lg transition-colors"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <span
                      className="mt-1.5 shrink-0 rounded-full"
                      style={{ width: 8, height: 8, background: alertDotColor(alert.signal_category, alert.change_type) }}
                    />
                    <div className="min-w-0">
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: "#f0ebe0" }}>
                        {alert.company_name}
                      </span>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#b8b4a8", lineHeight: 1.45, marginTop: "2px" }}>
                        {alert.change_description}
                      </p>
                    </div>
                  </Link>
                ))}
                <button
                  onClick={() => onNavigate("alerts")}
                  className="text-xs font-medium mt-2 flex items-center gap-1 transition-colors"
                  style={{ color: "#f0c040" }}
                >
                  See all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#7a7590" }}>
                No new signals since your last visit. Your watched companies are steady.
              </p>
            )}
          </BriefingCard>
        </motion.div>

        {/* 2B — Aligned With Your Values */}
        <motion.div {...anim(0.1)}>
          <BriefingCard className="h-full">
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: "#f0ebe0", marginBottom: "2px" }}>
              Aligned With Your Values
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#7a7590", marginBottom: "12px" }}>
              Based on your Work DNA profile
            </p>
            <AlignedValuesSearch hasTakenQuiz={hasTakenQuiz} />
          </BriefingCard>
        </motion.div>
      </div>

      {/* ═══ SECTION 3 — Newsletter + World of Work (2 columns) ═══ */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* 3A — From Jackye */}
        <motion.div {...anim(0.14)}>
          <BriefingCard className="h-full">
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: "#f0ebe0", marginBottom: "2px" }}>
              From Jackye
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#7a7590", marginBottom: "12px" }}>
              Insights & resources
            </p>
            <div className="space-y-3">
              <a
                href="https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description/why-job-descriptions-matter"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg p-3 transition-colors"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", fontWeight: 700, color: "#f0c040", letterSpacing: "0.5px" }}>
                  01
                </span>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: "#f0ebe0", marginTop: "4px", lineHeight: 1.4 }}>
                  Writing an Effective Job Description
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#7a7590", marginTop: "2px" }}>
                  LinkedIn Learning · Course
                </p>
              </a>
              <a
                href="https://www.linkedin.com/in/jackyeclayton/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: "#f0c040" }}
              >
                Follow Jackye on LinkedIn <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </BriefingCard>
        </motion.div>

        {/* 3B — World of Work Today (GNews) */}
        {gnewsArticles && gnewsArticles.length > 0 && (
          <motion.div {...anim(0.18)}>
            <BriefingCard className="h-full">
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: "#f0ebe0", marginBottom: "12px" }}>
                World of Work — Today
              </h3>
              <div className="space-y-2.5">
                {gnewsArticles.map((item, i) => {
                  const relTime = formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="shrink-0 rounded-full text-[9px] font-bold uppercase px-1.5 py-0.5 mt-0.5"
                        style={{
                          background: `${sourceBadgeColor(item.source.name)}20`,
                          color: sourceBadgeColor(item.source.name),
                        }}
                      >
                        {item.source.name.split(".")[0].toUpperCase().slice(0, 8)}
                      </span>
                      <div className="min-w-0">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 500, color: "#f0ebe0", lineHeight: 1.4 }}
                        >
                          {item.title.length > 80 ? item.title.slice(0, 80) + "…" : item.title}
                        </a>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#7a7590", marginTop: "2px" }}>
                          {relTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </BriefingCard>
          </motion.div>
        )}
      </div>

      {/* ═══ SECTION 4 — Companies You're Watching ═══ */}
      <motion.div {...anim(0.22)}>
        <BriefingCard>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: "#f0ebe0" }}>
              Companies You're Watching
            </h3>
            <button
              onClick={() => {
                const el = document.querySelector<HTMLInputElement>("[data-quick-audit]");
                if (el) el.focus();
              }}
              className="text-xs font-medium flex items-center gap-1 transition-colors"
              style={{ color: "#f0c040" }}
            >
              Add a company <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {data?.tracked && data.tracked.length > 0 ? (
            <div className="space-y-1">
              {data.tracked.map((t: any) => {
                const score = t.company?.civic_footprint_score ?? 0;
                return (
                  <Link
                    key={t.id}
                    to={`/company/${t.company?.slug}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg transition-colors group"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <span
                      className="shrink-0 rounded-full"
                      style={{ width: 8, height: 8, background: scoreColor(score) }}
                    />
                    <span
                      className="flex-1 min-w-0 truncate group-hover:text-primary transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: "#f0ebe0" }}
                    >
                      {t.company?.name}
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#7a7590" }} className="hidden sm:block">
                      {t.company?.industry}
                    </span>
                    <span
                      className="text-xs font-bold shrink-0 rounded-full px-2 py-0.5"
                      style={{
                        background: `${scoreColor(score)}15`,
                        color: scoreColor(score),
                      }}
                    >
                      {score}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-4">
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#7a7590", marginBottom: "12px" }}>
                You're not watching any companies yet. Search for any employer to start watching them.
              </p>
            </div>
          )}
        </BriefingCard>
      </motion.div>

      {/* ═══ SECTION 5 — Quick Audit ═══ */}
      <motion.div {...anim(0.26)}>
        <BriefingCard>
          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", fontWeight: 600, color: "#f0ebe0", marginBottom: "12px" }}>
            Audit a company now →
          </h3>
          <form onSubmit={handleSearch}>
            <div
              className="flex items-center rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Search className="w-4 h-4 shrink-0 mr-3" style={{ color: "#f0c040" }} />
              <input
                data-quick-audit
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search any employer — Amazon, Goldman Sachs, your next interview..."
                className="bg-transparent border-none outline-none w-full"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#f0ebe0" }}
              />
            </div>
          </form>
        </BriefingCard>
      </motion.div>
    </div>
  );
}
