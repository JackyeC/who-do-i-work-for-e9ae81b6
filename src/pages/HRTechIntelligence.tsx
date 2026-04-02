import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
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
  Landmark,
  Scale,
  Eye,
  Users,
  HeartPulse,
  Cpu,
  Search,
  ArrowRight,
  Zap,
  Building2,
  CircleAlert,
} from "lucide-react";
import HRTechVendorDirectory from "@/components/TransformSponsorsSection";
import {
  HR_TECH_VENDORS,
  PE_OWNERS,
  LABOR_MARKET_DATA,
  type VendorRating,
  type HRTechVendor,
  type PEOwner,
  type LaborDataPoint,
} from "@/data/hrtechData";

/* ─── animation ─── */
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

/* ═══════════════════════════════════════════════════════
   SECTION 1: "What's Happening in HR Tech" — top signals
   ═══════════════════════════════════════════════════════ */
interface TopSignal {
  headline: string;
  detail: string;
  source: string;
  sourceUrl: string;
  severity: "critical" | "warning" | "watch";
  company?: string;
  companySlug?: string;
}

const TOP_SIGNALS: TopSignal[] = (() => {
  // Pull the most impactful findings from vendor data
  const signals: TopSignal[] = [];

  // Workday AI class action
  const workday = HR_TECH_VENDORS.find(v => v.slug === "workday");
  if (workday) {
    signals.push({
      headline: "Workday faces class action alleging AI discrimination against millions of applicants",
      detail: workday.keyFinding.split(".").slice(0, 2).join(".") + ".",
      source: "PACER / Court Filing",
      sourceUrl: workday.sources[0]?.url || "#",
      severity: "critical",
      company: "Workday",
      companySlug: "workday",
    });
  }

  // HireVue
  const hirevue = HR_TECH_VENDORS.find(v => v.slug === "hirevue");
  if (hirevue) {
    signals.push({
      headline: "HireVue dropped facial analysis after FTC complaint — still uses AI video scoring",
      detail: hirevue.keyFinding.split(".").slice(0, 2).join(".") + ".",
      source: "FTC / EPIC",
      sourceUrl: hirevue.sources[0]?.url || "#",
      severity: "warning",
      company: "HireVue",
      companySlug: "hirevue",
    });
  }

  // Oracle ICE
  const oracle = HR_TECH_VENDORS.find(v => v.slug === "oracle-hcm");
  if (oracle) {
    signals.push({
      headline: "Oracle spends $11.8M/year lobbying with 54 former government officials as lobbyists",
      detail: `Larry Ellison gave $1M to Trump-aligned PAC. Oracle is an authorized DHS/ICE cloud provider and Pentagon JWCC partner.`,
      source: "OpenSecrets",
      sourceUrl: oracle.sources[0]?.url || "#",
      severity: "critical",
      company: "Oracle",
      companySlug: "oracle",
    });
  }

  // Salesforce ICE
  const salesforce = HR_TECH_VENDORS.find(v => v.slug === "salesforce");
  if (salesforce) {
    signals.push({
      headline: "1,400+ Salesforce employees signed letter opposing company's ICE AI pitch",
      detail: salesforce.keyFinding.split(".").slice(0, 2).join(".") + ".",
      source: "CNBC / Wired",
      sourceUrl: salesforce.sources[0]?.url || "#",
      severity: "warning",
      company: "Salesforce",
      companySlug: "salesforce",
    });
  }

  // Kronos child labor
  const pe = PE_OWNERS.find(p => p.slug === "blackstone");
  if (pe) {
    signals.push({
      headline: "Blackstone-owned portfolio company found guilty of systemic child labor violations",
      detail: `Blackstone gave $48M in political contributions while owning UKG and companies with documented labor violations.`,
      source: "DOL / Court Records",
      sourceUrl: pe.sources[0]?.url || "#",
      severity: "critical",
    });
  }

  return signals.slice(0, 5);
})();

const SEVERITY_STYLES = {
  critical: "border-red-500/30 bg-red-500/5",
  warning: "border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5",
  watch: "border-border/40 bg-muted/10",
};
const SEVERITY_BADGE = {
  critical: { label: "HIGH IMPACT", variant: "destructive" as const },
  warning: { label: "WATCH", variant: "warning" as const },
  watch: { label: "CONTEXT", variant: "secondary" as const },
};

/* ═══════════════════════════════════════════════════════
   SECTION 2: "Patterns We're Seeing" — thematic groups
   ═══════════════════════════════════════════════════════ */
interface Pattern {
  icon: typeof Shield;
  theme: string;
  signal: string;
  companies: string[];
}

const PATTERNS: Pattern[] = [
  {
    icon: Cpu,
    theme: "AI Bias & Accountability",
    signal: "Workday is lobbying state-by-state to weaken AI hiring regulation while facing a class action for algorithmic discrimination. HireVue dropped facial analysis after FTC pressure but still scores candidates via AI video.",
    companies: ["Workday", "HireVue", "Paradox"],
  },
  {
    icon: Users,
    theme: "DEI Rollbacks Under Pressure",
    signal: "IBM removed race/gender supplier diversity targets in 2025. Companies with federal contracts are quietly stripping DEI language from postings and annual reports.",
    companies: ["IBM", "Oracle", "Salesforce"],
  },
  {
    icon: Scale,
    theme: "Government Enforcement Contracts",
    signal: "Oracle, Salesforce, and Microsoft provide technology to ICE and CBP. Employee protests are documented but haven't changed contract decisions.",
    companies: ["Oracle", "Salesforce", "Microsoft"],
  },
  {
    icon: Landmark,
    theme: "Private Equity Extraction",
    signal: "PE firms like Blackstone, Vista, and Thoma Bravo own major HR platforms (UKG, Ping Identity, Cornerstone). Their political spending and portfolio labor records tell a different story than the vendor's marketing.",
    companies: ["UKG", "Cornerstone", "Ping Identity"],
  },
];

/* ═══════════════════════════════════════════════════════
   SECTION 3: "Companies to Watch" — actionable list
   ═══════════════════════════════════════════════════════ */
const COMPANIES_TO_WATCH = HR_TECH_VENDORS
  .filter(v => v.rating === "follow-the-money")
  .slice(0, 6)
  .map(v => ({
    name: v.name,
    slug: v.slug,
    category: v.category,
    finding: v.keyFinding.split(".")[0] + ".",
    rating: v.rating,
    sources: v.sources,
  }));

/* ═══════════════════════════════════════════════════════
   SUBCOMPONENTS
   ═══════════════════════════════════════════════════════ */
function PECard({ pe }: { pe: PEOwner }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ratingConfig[pe.rating];

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
                <h3 className="font-semibold text-foreground text-base truncate">{pe.name}</h3>
              </div>
              <p className="text-xs font-mono text-muted-foreground tracking-wide uppercase">
                Private Equity
                {pe.aum && <span className="ml-2 text-primary/60">AUM: {pe.aum}</span>}
              </p>
            </div>
            <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs font-mono shrink-0`}>{cfg.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{pe.keyFinding}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pe.portfolioHRTech.map((name) => (
              <Badge key={name} variant="outline" className="text-xs border-primary/30 text-primary/80">
                Owns: {name}
              </Badge>
            ))}
          </div>
          <button
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> Full intel</>}
          </button>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border space-y-3">
              {pe.politicalSpend && (
                <div>
                  <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-1">Political Spending</p>
                  <p className="text-sm text-muted-foreground">{pe.politicalSpend}</p>
                </div>
              )}
              <div className="pt-2">
                <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-2">Sources</p>
                <div className="flex flex-wrap gap-2">
                  {pe.sources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}>
                      <ExternalLink className="w-3 h-3" />{s.label}
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

function LaborCard({ dp }: { dp: LaborDataPoint }) {
  return (
    <motion.div variants={stagger.item}>
      <Card className="bg-card border border-border hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono text-primary/70 uppercase tracking-wider">{dp.label}</p>
            {trendIcon(dp.trend)}
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mb-1 tabular-nums">{dp.value}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{dp.context}</p>
          <a href={dp.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary/60 hover:text-primary">
            <ExternalLink className="w-3 h-3" />{dp.source}
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function HRTechIntelligence() {
  usePageSEO({
    title: "HR Tech Intelligence — What Your Tech Stack Actually Supports",
    description:
      "Follow the money behind HR technology vendors — political donations, lobbying, AI bias lawsuits, and ownership. Know what your tech stack supports.",
    path: "/hrtech",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ HERO — tight, purposeful ═══ */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-4">
            HR Tech Intelligence
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
            Know What Your <span className="text-primary">Tech Stack Supports</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Political donations, AI bias lawsuits, ICE contracts, child labor — traced back to the HR tools your company already uses.
          </p>
        </div>
      </section>

      {/* ═══ SECTION 1: What's Happening in HR Tech ═══ */}
      <section className="py-12 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm">
              What's Happening in HR Tech
            </p>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            High-impact signals from the last 12 months
          </h2>

          <div className="space-y-3">
            {TOP_SIGNALS.map((sig, i) => {
              const badge = SEVERITY_BADGE[sig.severity];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border ${SEVERITY_STYLES[sig.severity]}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant={badge.variant} className="text-[10px] font-mono">
                              {badge.label}
                            </Badge>
                            {sig.company && (
                              <span className="text-xs font-mono text-muted-foreground">{sig.company}</span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-foreground leading-snug mb-1.5">
                            {sig.headline}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {sig.detail}
                          </p>
                          <a
                            href={sig.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary mt-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {sig.source}
                          </a>
                        </div>
                        {sig.companySlug && (
                          <Link
                            to={`/search?q=${encodeURIComponent(sig.company || "")}`}
                            className="shrink-0 hidden sm:flex items-center gap-1 text-xs text-primary hover:text-primary/80 border border-primary/20 rounded-md px-3 py-1.5 hover:bg-primary/5 transition-colors"
                          >
                            <Search className="w-3 h-3" />
                            Check dossier
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: Patterns We're Seeing ═══ */}
      <section className="py-12 px-4 border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-primary" />
            <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm">
              Patterns We're Seeing
            </p>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Four themes across the HR tech landscape
          </h2>

          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-4 md:grid-cols-2"
          >
            {PATTERNS.map((p) => {
              const Icon = p.icon;
              return (
                <motion.div key={p.theme} variants={stagger.item}>
                  <Card className="bg-card border border-border hover:border-primary/30 transition-colors h-full">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{p.theme}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.signal}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.companies.map(c => (
                          <Link
                            key={c}
                            to={`/search?q=${encodeURIComponent(c)}`}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-primary/80 hover:text-primary border border-primary/20 rounded px-2 py-0.5 hover:bg-primary/5 transition-colors"
                          >
                            {c}
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══ SECTION 3: Companies to Watch ═══ */}
      <section className="py-12 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-primary" />
            <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm">
              Companies to Watch
            </p>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            HR tech vendors flagged by our analysis
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            These companies have significant political spending, documented labor issues, or active enforcement contracts.
          </p>

          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {COMPANIES_TO_WATCH.map((c) => {
              const cfg = ratingConfig[c.rating];
              const Icon = cfg.icon;
              return (
                <motion.div key={c.slug} variants={stagger.item}>
                  <Card className={`border ${cfg.border} hover:border-primary/40 transition-colors h-full`}>
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <h3 className="font-semibold text-foreground text-sm">{c.name}</h3>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-2">{c.category}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1">{c.finding}</p>
                      <Link
                        to={`/search?q=${encodeURIComponent(c.name.split(" ")[0])}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <Search className="w-3 h-3" />
                        Check this company
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══ LABOR MARKET CONTEXT ═══ */}
      <section className="py-12 px-4 border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <CircleAlert className="w-4 h-4 text-primary" />
            <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm">
              The Economic Context
            </p>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Why this matters right now
          </h2>
          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6"
          >
            {LABOR_MARKET_DATA.map((dp) => (
              <LaborCard key={dp.label} dp={dp} />
            ))}
          </motion.div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            The US economy lost 92,000 jobs in February — the worst miss in years. For the first time ever recorded, more workers are struggling than thriving. One sector (healthcare) is carrying the entire economy. The tools your HR team uses are connected to all of it.
          </p>
        </div>
      </section>

      {/* ═══ PE OWNERS ═══ */}
      <section className="py-12 px-4 border-t border-border" id="pe-owners">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-2">
              Who Owns the Stack
            </p>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Private equity behind your HR tools
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              The vendor and the PE firm behind it are inseparable. Their political spending and labor records are the real story.
            </p>
          </div>
          <motion.div
            variants={stagger.container} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-50px" }} className="grid gap-4 sm:grid-cols-2"
          >
            {PE_OWNERS.map((pe) => <PECard key={pe.slug} pe={pe} />)}
          </motion.div>
        </div>
      </section>

      {/* ═══ VENDOR DIRECTORY ═══ */}
      <section className="py-12 px-4 border-t border-border bg-card/50" id="vendors">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-2">
              Full Directory
            </p>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              HR Tech Vendor Intelligence
            </h2>
            <p className="text-sm text-muted-foreground">
              342 companies across 20 HR categories — founders, funding, political money, and red flags.
            </p>
          </div>
          <HRTechVendorDirectory />
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-12 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            This isn't about being anti-vendor. It's about being informed.
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl mx-auto">
            When your vendor lobbies to gut AI regulation while facing a class action for AI discrimination, that's a choice. You deserve to know what those choices are.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/receipts">See All Company Receipts</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              <Link to="/methodology">Our Methodology</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ METHODOLOGY NOTE ═══ */}
      <section className="py-8 px-4 border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-semibold text-foreground mb-2">Methodology & Sources</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Vendor intelligence compiled from OpenSecrets.org, FEC data, NLRB case records, SEC filings, federal contract databases, and investigative reporting. Political contribution data primarily from the 2024 election cycle. Lobbying data from Senate Office of Public Records via OpenSecrets.
          </p>
          <p className="text-xs text-muted-foreground">
            Last updated: March 25, 2026 · A{" "}
            <Link to="/" className="text-primary/80 hover:text-primary">Who Do I Work For</Link>{" "}
            investigation · by{" "}
            <Link to="/about" className="text-primary/80 hover:text-primary">Jackye Clayton</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
