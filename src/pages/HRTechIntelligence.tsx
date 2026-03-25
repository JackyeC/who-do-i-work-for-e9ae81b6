import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Minus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Building2,
  Landmark,
  DollarSign,
  Users,
  BriefcaseBusiness,
  Scale,
  Eye,
  Handshake,
  CircleAlert,
  HeartPulse,
  Cpu,
  Factory,
} from "lucide-react";
import {
  HR_TECH_VENDORS,
  PE_OWNERS,
  LABOR_MARKET_DATA,
  type VendorRating,
  type HRTechVendor,
  type PEOwner,
  type LaborDataPoint,
} from "@/data/hrtechData";

/* ─── animation variants ─── */
const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  item: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  },
};

/* ─── helpers ─── */
const ratingConfig: Record<
  VendorRating,
  { label: string; color: string; bg: string; border: string; icon: typeof Shield }
> = {
  "follow-the-money": {
    label: "Follow the Money",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: ShieldAlert,
  },
  mixed: {
    label: "Mixed / Neutral",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: Shield,
  },
  aligns: {
    label: "Aligns with Workers",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: ShieldCheck,
  },
};

const trendIcon = (trend: LaborDataPoint["trend"]) => {
  switch (trend) {
    case "negative":
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    case "positive":
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case "alert":
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    default:
      return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
};

/* ─── VENDOR CARD ─── */
function VendorCard({ vendor }: { vendor: HRTechVendor }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ratingConfig[vendor.rating];
  const Icon = cfg.icon;

  return (
    <motion.div variants={stagger.item}>
      <Card
        className={`bg-card border ${cfg.border} hover:border-primary/40 transition-colors cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                <h3 className="font-semibold text-foreground text-base truncate">
                  {vendor.name}
                </h3>
              </div>
              <p className="text-xs font-mono text-muted-foreground tracking-wide uppercase">
                {vendor.category}
                {vendor.ticker && (
                  <span className="ml-2 text-primary/60">{vendor.ticker}</span>
                )}
              </p>
            </div>
            <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs font-mono shrink-0`}>
              {cfg.label}
            </Badge>
          </div>

          {/* Rating Note */}
          {vendor.ratingNote && (
            <p className="text-xs text-muted-foreground italic mb-2">{vendor.ratingNote}</p>
          )}

          {/* Key Finding */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {vendor.keyFinding}
          </p>

          {/* Expand/Collapse */}
          <button
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Full intel
              </>
            )}
          </button>

          {/* Expanded Details */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border space-y-3"
            >
              {vendor.overview && (
                <div>
                  <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-1">
                    Overview
                  </p>
                  <p className="text-sm text-muted-foreground">{vendor.overview}</p>
                </div>
              )}
              {vendor.ownership && (
                <div>
                  <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-1">
                    Ownership
                  </p>
                  <p className="text-sm text-muted-foreground">{vendor.ownership}</p>
                </div>
              )}
              {vendor.politicalSpend && (
                <div>
                  <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-1">
                    Political Spending
                  </p>
                  <p className="text-sm text-muted-foreground">{vendor.politicalSpend}</p>
                </div>
              )}
              {vendor.lobbying && (
                <div>
                  <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-1">
                    Lobbying
                  </p>
                  <p className="text-sm text-muted-foreground">{vendor.lobbying}</p>
                </div>
              )}
              {vendor.laborPractices && (
                <div>
                  <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-1">
                    Labor Practices
                  </p>
                  <p className="text-sm text-muted-foreground">{vendor.laborPractices}</p>
                </div>
              )}
              {vendor.deiStatus && (
                <div>
                  <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-1">
                    DEI Status
                  </p>
                  <p className="text-sm text-muted-foreground">{vendor.deiStatus}</p>
                </div>
              )}
              {vendor.govContracts && (
                <div>
                  <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-1">
                    Government Contracts
                  </p>
                  <p className="text-sm text-muted-foreground">{vendor.govContracts}</p>
                </div>
              )}

              {/* Sources */}
              <div className="pt-2">
                <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-2">
                  Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {vendor.sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── PE OWNER CARD ─── */
function PECard({ pe }: { pe: PEOwner }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ratingConfig[pe.rating];
  const Icon = cfg.icon;

  return (
    <motion.div variants={stagger.item}>
      <Card
        className={`bg-card border ${cfg.border} hover:border-primary/40 transition-colors cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Landmark className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                <h3 className="font-semibold text-foreground text-base truncate">
                  {pe.name}
                </h3>
              </div>
              <p className="text-xs font-mono text-muted-foreground tracking-wide uppercase">
                Private Equity
                {pe.aum && <span className="ml-2 text-primary/60">AUM: {pe.aum}</span>}
              </p>
            </div>
            <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs font-mono shrink-0`}>
              {cfg.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            {pe.keyFinding}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {pe.portfolioHRTech.map((name) => (
              <Badge
                key={name}
                variant="outline"
                className="text-xs border-primary/30 text-primary/80"
              >
                Owns: {name}
              </Badge>
            ))}
          </div>

          <button
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Full intel
              </>
            )}
          </button>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-4 border-t border-border space-y-3"
            >
              {pe.politicalSpend && (
                <div>
                  <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-1">
                    Political Spending
                  </p>
                  <p className="text-sm text-muted-foreground">{pe.politicalSpend}</p>
                </div>
              )}
              <div className="pt-2">
                <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-2">
                  Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {pe.sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── LABOR DATA CARD ─── */
function LaborCard({ dp }: { dp: LaborDataPoint }) {
  return (
    <motion.div variants={stagger.item}>
      <Card className="bg-card border border-border hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono text-primary/70 uppercase tracking-wider">
              {dp.label}
            </p>
            {trendIcon(dp.trend)}
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mb-1 tabular-nums">
            {dp.value}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{dp.context}</p>
          <a
            href={dp.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary/60 hover:text-primary"
          >
            <ExternalLink className="w-3 h-3" />
            {dp.source}
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── THEME CARD (5 key themes) ─── */
interface ThemeItem {
  icon: typeof Shield;
  title: string;
  body: string;
}

const KEY_THEMES: ThemeItem[] = [
  {
    icon: Landmark,
    title: "The PE Overlay",
    body: "Many HR tech companies are owned by private equity firms whose political activity, labor records, and extraction models are the real story. When your employer uses UKG, the money flows to Blackstone — which gave $48M in political contributions, lobbied to access your 401(k), and owned a company found guilty of systemic child labor violations.",
  },
  {
    icon: Scale,
    title: "The AI Regulation Gap",
    body: "Workday is lobbying state-by-state to shape AI regulation that protects employers from accountability while leaving workers unprotected — removing workers' right to sue and allowing self-auditing. Meanwhile, it faces a class action alleging its AI discriminated against millions of Black, disabled, and older applicants.",
  },
  {
    icon: Eye,
    title: "The ICE/CBP Connection",
    body: "Oracle, Salesforce, and Microsoft are all entangled in providing technology to immigration enforcement. Government contracts are profitable. Employee protests are manageable. Values statements are marketing.",
  },
  {
    icon: Users,
    title: "The DEI Rollback",
    body: "IBM rolled back race/gender supplier diversity targets in 2025. Companies under federal contracting pressure are quietly removing DEI language from job postings, annual reports, and performance metrics. The companies that maintained DEI commitments tend to be smaller and less exposed to government pressure.",
  },
  {
    icon: HeartPulse,
    title: "One Industry Carrying Everything",
    body: "Healthcare accounts for 109% of all private-sector job gains. 10,000 Americans turn 65 daily. The rest of the economy is contracting on a net basis. Your HR tech vendor's choices matter more when there's less room to move.",
  },
];

/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function HRTechIntelligence() {
  usePageSEO({
    title: "HR Tech Intelligence",
    description:
      "Know what your HR tech stack supports. Follow the money behind 25+ HR technology vendors — political donations, lobbying, labor practices, and ownership.",
    path: "/hrtech",
  });

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<VendorRating | "all">("all");

  const filteredVendors = useMemo(() => {
    return HR_TECH_VENDORS.filter((v) => {
      const matchesSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.category.toLowerCase().includes(search.toLowerCase()) ||
        v.keyFinding.toLowerCase().includes(search.toLowerCase());
      const matchesRating = ratingFilter === "all" || v.rating === ratingFilter;
      return matchesSearch && matchesRating;
    });
  }, [search, ratingFilter]);

  const counts = useMemo(
    () => ({
      all: HR_TECH_VENDORS.length,
      "follow-the-money": HR_TECH_VENDORS.filter((v) => v.rating === "follow-the-money").length,
      mixed: HR_TECH_VENDORS.filter((v) => v.rating === "mixed").length,
      aligns: HR_TECH_VENDORS.filter((v) => v.rating === "aligns").length,
    }),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ HERO ═══ */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-4">
            HR Tech Intelligence
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Know What Your
            <br />
            <span className="text-primary">Tech Stack Supports</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
            Every dollar your company spends on HR technology flows somewhere.
            Some of it funds tools that protect workers. Some of it funds
            lobbying that strips away your rights. This page follows the money.
          </p>
          <p className="text-sm text-muted-foreground/70 max-w-xl mx-auto">
            25 HR tech vendors. 5 private equity owners. Political donations,
            lobbying records, labor practices, and ownership traced to the source.
          </p>
        </div>
      </section>

      {/* ═══ STATE OF WORK — THE ECONOMY ═══ */}
      <section className="py-16 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-3">
              The State of Work — March 2026
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Why This Matters Right Now
            </h2>
            <p className="text-muted-foreground max-w-3xl leading-relaxed">
              The US economy lost 92,000 jobs in February — the worst miss
              in years. More workers are struggling than thriving for the first
              time ever recorded. One single sector is carrying the entire
              economy. And the tools your HR team uses? They're connected to all
              of it.
            </p>
          </div>

          {/* Labor Market Data Grid */}
          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-10"
          >
            {LABOR_MARKET_DATA.map((dp) => (
              <LaborCard key={dp.label} dp={dp} />
            ))}
          </motion.div>

          {/* Narrative Block */}
          <Card className="bg-card border border-primary/20">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-4">
                <CircleAlert className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">The Numbers Behind the Headlines</h3>
                  <p className="text-xs font-mono text-primary/70 uppercase tracking-wider">
                    Sources: BLS, Gallup, ADP Research, NBER, CompTIA, Bankrate
                  </p>
                </div>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">The economy lost 92,000 jobs in February</strong> — far below
                  the gain of 50,000 experts predicted. With downward revisions, average monthly job creation in 2025
                  fell to fewer than 10,000 jobs a month. Bankrate's Mark Hamrick called it{" "}
                  <em>"ugly across the board."</em> This isn't a one-month anomaly — since June 2025,
                  the pattern has been one month of job creation followed by a month of contraction.
                </p>
                <p>
                  <strong className="text-foreground">For the first time in recorded history</strong>, more
                  American workers are struggling (49%) than thriving (46%), according to Gallup's survey of 22,000+
                  employed adults. Only 28% say now is a good time to find quality employment — a 42-point
                  collapse from 2022. Employee engagement is at a decade low: 31%, representing 3.2 million
                  fewer engaged workers. Gallup calls it <em>the Great Detachment</em> — workers are
                  restless but stuck. 69% can't afford to lose their current pay and benefits.
                </p>
                <p>
                  <strong className="text-foreground">One industry is carrying everything.</strong> Education
                  and health services generated 109% of all private sector job gains through January 2025,
                  according to ADP Research. Healthcare alone accounts for 88% of that supersector. The driver:
                  approximately 10,000 Americans turn 65 every single day. As ADP's Nela Richardson wrote,{" "}
                  <em>
                    "Unlike past labor market upheavals, this one isn't being driven by technology. People,
                    older people in particular, are having a profound effect on labor supply and demand."
                  </em>
                </p>
                <p>
                  <strong className="text-foreground">AI isn't the job killer headlines suggest — yet.</strong>{" "}
                  A National Bureau of Economic Research survey of nearly 750 CFOs found that 50% of companies
                  expect AI to replace zero roles this year. The projected total employment impact: less than
                  0.4% in 2026. But there's a productivity paradox — executives <em>feel</em> more productive,
                  while revenue data hasn't caught up. Tech employment actually declined in 2025 (-33,624 jobs),
                  but CompTIA projects a rebound of 185,000+ jobs in 2026, with AI-skilled roles leading the way.
                </p>
                <p>
                  <strong className="text-foreground">Meanwhile, the macro picture is volatile.</strong>{" "}
                  Gas prices jumped $0.34 in a week after the Iran conflict. The Kansas City Fed estimates
                  tariffs cost ~19,000 jobs per month. Manufacturing has lost 100,000 jobs since Trump
                  took office. Professor Lonnie Golden of Penn State Abington said it plainly:{" "}
                  <em>
                    "Somehow this is not yet translating into the overall level of unemployment...
                    but the job market is really weak right now in terms of job creation."
                  </em>
                </p>
              </div>

              {/* Attribution */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Analysis informed by{" "}
                  <a
                    href="https://youtu.be/h-zmyIy92oA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                  >
                    Cornering The Job Market
                  </a>{" "}
                  (Pete Newsome, March 24, 2026),{" "}
                  <a
                    href="https://www.bls.gov/news.release/empsit.nr0.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                  >
                    Bureau of Labor Statistics
                  </a>
                  ,{" "}
                  <a
                    href="https://www.gallup.com/workplace/703280/worker-thriving-declines-job-market-pessimism-grows.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                  >
                    Gallup Workforce Wellbeing Report
                  </a>
                  ,{" "}
                  <a
                    href="https://www.adpresearch.com/health-care-is-reshaping-the-labor-market/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                  >
                    ADP Research
                  </a>
                  ,{" "}
                  <a
                    href="https://www.nber.org/papers/w34984"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                  >
                    NBER Working Paper
                  </a>
                  , and{" "}
                  <a
                    href="https://www.comptia.org/en-us/resources/research/state-of-the-tech-workforce-2026/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                  >
                    CompTIA State of the Tech Workforce 2026
                  </a>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══ THE QUESTION ═══ */}
      <section className="py-16 px-4 border-t border-border bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-4">
            The Question No One Is Asking
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            What Does Your HR Tech Stack Actually Support?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Your company chose an HRIS. A payroll provider. An ATS. A learning platform.
            Every one of those vendors has a political profile — lobbying activity,
            campaign contributions, government contracts, and labor practices that either
            align with the needs of employees or work against them.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            This isn't about being anti-vendor. It's about being informed. When
            30% of workers feel stuck, when engagement is at a decade low, and
            when the economy is losing jobs — the companies that manage your
            people data, process your payroll, and screen your candidates are
            making political choices with your money.
          </p>
        </div>
      </section>

      {/* ═══ KEY THEMES ═══ */}
      <section className="py-16 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-3">
              What We Found
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Five Patterns You Should Know
            </h2>
          </div>

          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {KEY_THEMES.map((theme) => {
              const TIcon = theme.icon;
              return (
                <motion.div key={theme.title} variants={stagger.item}>
                  <Card className="bg-card border border-border hover:border-primary/30 transition-colors h-full">
                    <CardContent className="p-5">
                      <TIcon className="w-5 h-5 text-primary mb-3" />
                      <h3 className="font-semibold text-foreground text-sm mb-2">{theme.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{theme.body}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══ VENDOR DIRECTORY ═══ */}
      <section className="py-16 px-4 border-t border-border" id="vendors">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-3">
              The Directory
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              HR Tech Vendor Intelligence
            </h2>
            <p className="text-muted-foreground">
              25 vendors rated on political spending, lobbying, labor practices, and ownership.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(
                [
                  { key: "all", label: `All (${counts.all})`, color: "text-foreground" },
                  {
                    key: "follow-the-money",
                    label: `Follow the Money (${counts["follow-the-money"]})`,
                    color: "text-red-400",
                  },
                  { key: "mixed", label: `Mixed (${counts.mixed})`, color: "text-amber-400" },
                  { key: "aligns", label: `Aligns (${counts.aligns})`, color: "text-emerald-400" },
                ] as const
              ).map((f) => (
                <Button
                  key={f.key}
                  variant={ratingFilter === f.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRatingFilter(f.key as typeof ratingFilter)}
                  className={
                    ratingFilter === f.key
                      ? "bg-primary text-primary-foreground"
                      : `border-border ${f.color} hover:bg-card`
                  }
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Vendor Cards */}
          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.slug} vendor={vendor} />
            ))}
          </motion.div>

          {filteredVendors.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No vendors match your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ PE OWNERS ═══ */}
      <section className="py-16 px-4 border-t border-border bg-card/50" id="pe-owners">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-3">
              Who Owns the Stack
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              The Private Equity Owners Behind HR Tech
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Many HR tech companies are privately held by PE firms whose political
              spending, labor records, and portfolio decisions are the real story.
              The vendor and the PE firm behind it are inseparable.
            </p>
          </div>

          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {PE_OWNERS.map((pe) => (
              <PECard key={pe.slug} pe={pe} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA / METHODOLOGY ═══ */}
      <section className="py-16 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-3">
            From Jackye Clayton
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            This Isn't About Being Anti-Vendor
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            I've spent my career in HR technology. I've used most of these tools.
            I've recommended them. Some of them are genuinely good products. But
            being good at processing payroll doesn't mean your political lobbying
            aligns with the people whose paychecks you process.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The question isn't whether to use HR technology — it's whether
            you know what you're supporting when you do. When your vendor
            lobbies to gut AI regulation while facing a class action for AI
            discrimination, that's a choice. When your vendor's PE owner
            spends $48 million on political campaigns while its portfolio
            company employs children in meatpacking plants, that's a choice.
          </p>
          <p className="text-foreground font-semibold leading-relaxed mb-8">
            You deserve to know what those choices are.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <a href="/receipts">See All Company Receipts</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <a href="/methodology">Our Methodology</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ METHODOLOGY NOTE ═══ */}
      <section className="py-12 px-4 border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-semibold text-foreground mb-3">Methodology & Sources</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Vendor intelligence is compiled from public filings, OpenSecrets.org (Federal Election
            Commission data and lobbying disclosures), NLRB case records, SEC filings, federal
            government contract databases, and investigative reporting. Political contribution data
            is primarily from the 2024 election cycle. Lobbying data is from Senate Office of
            Public Records via OpenSecrets. This page is maintained by Jackye Clayton — a career
            intelligence analyst, not a vendor.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Labor market data from the Bureau of Labor Statistics (BLS Employment Situation Summary,
            March 2026), Gallup Workforce Wellbeing Report (March 2026, n=22,368), ADP Research
            Institute (March 2026), National Bureau of Economic Research Working Paper (survey of
            ~750 CFOs), CompTIA State of the Tech Workforce 2026, and Bankrate economic analysis.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ratings are editorial assessments based on publicly available evidence. Companies
            rated "Follow the Money" have significant political spending against worker interests,
            anti-labor lobbying, or controversial government contracts. "Mixed/Neutral" indicates
            typical corporate behavior. "Aligns with Workers" indicates demonstrably worker-friendly
            practices and minimal anti-worker political activity. All sources are cited
            and linked for independent verification.
          </p>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Last updated: March 25, 2026 · A{" "}
              <a href="/" className="text-primary/80 hover:text-primary">
                WDIWF
              </a>{" "}
              investigation · by{" "}
              <a href="/about" className="text-primary/80 hover:text-primary">
                Jackye Clayton
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
