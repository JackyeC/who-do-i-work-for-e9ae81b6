import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Search, Flame, ArrowUpDown, SortAsc, SortDesc,
  Scale, Landmark, Gavel, TrendingDown, Building2, Shield
} from "lucide-react";

// ─── Types ───

interface ReceiptsCompany {
  slug: string;
  name: string;
  sector: string;
  state: string;
  categories: string[];
  stat: string;
  status: "full-report" | "coming-soon";
  date: string;
  spice: 1 | 2 | 3 | 4 | 5;
  dramaScore: number; // 0-100
  topSignal: string;
  signalIcon: "layoff" | "pac" | "dei" | "lawsuit" | "lobbying" | "contract";
  sources: string[];
}

// ─── Spice / Drama config ───

const SPICE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Mild", color: "text-muted-foreground" },
  2: { label: "Warm", color: "text-[hsl(var(--civic-yellow))]" },
  3: { label: "Heated", color: "text-orange-400" },
  4: { label: "Spicy", color: "text-orange-500" },
  5: { label: "Five Alarm", color: "text-destructive" },
};

const SIGNAL_ICONS: Record<string, { icon: typeof Scale; color: string }> = {
  layoff:   { icon: TrendingDown, color: "text-destructive" },
  pac:      { icon: Landmark, color: "text-primary" },
  dei:      { icon: Scale, color: "text-[hsl(var(--civic-yellow))]" },
  lawsuit:  { icon: Gavel, color: "text-destructive" },
  lobbying: { icon: Building2, color: "text-primary" },
  contract: { icon: Shield, color: "text-[hsl(var(--civic-blue))]" },
};

// Source tier badges (Ground News inspired)
const SOURCE_TIERS: Record<string, { label: string; color: string; description: string }> = {
  // Tier 1 — Government Records
  "FEC":           { label: "Gov Tier 1", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", description: "Federal Election Commission — official government records" },
  "SEC EDGAR":     { label: "Gov Tier 1", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", description: "Securities & Exchange Commission filings" },
  "BLS":           { label: "Gov Tier 1", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", description: "Bureau of Labor Statistics" },
  "LDA":           { label: "Gov Tier 1", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", description: "Senate Lobbying Disclosure Act filings" },
  "WARN":          { label: "Gov Tier 1", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", description: "Worker Adjustment and Retraining Notification Act" },
  "USASpending":   { label: "Gov Tier 1", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", description: "Federal contract awards database" },
  "CourtListener": { label: "Gov Tier 1", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", description: "Federal court records — PACER" },
  "OGE":           { label: "Gov Tier 1", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", description: "Office of Government Ethics — financial disclosure forms" },
  "FARA":          { label: "Gov Tier 1", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", description: "Foreign Agents Registration Act filings" },
  "IRS 990":       { label: "Gov Tier 1", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", description: "IRS Form 990 — nonprofit board and financial data" },

  // Tier 3 — Watchdog & OSINT
  "OpenSecrets":   { label: "Watchdog", color: "bg-primary/10 text-primary border-primary/30", description: "OpenSecrets — lobbying, revolving door, and campaign finance tracking" },
  "LittleSis":     { label: "Watchdog", color: "bg-primary/10 text-primary border-primary/30", description: "LittleSis — influence mapping, interlocking directorates, power networks" },
  "SPLC":          { label: "Watchdog", color: "bg-primary/10 text-primary border-primary/30", description: "Southern Poverty Law Center — extremist tracking, hate group mapping" },
  "ADL":           { label: "Watchdog", color: "bg-primary/10 text-primary border-primary/30", description: "Anti-Defamation League — extremism incidents and H.E.A.T. mapping" },
  "HRC":           { label: "Watchdog", color: "bg-primary/10 text-primary border-primary/30", description: "Human Rights Campaign — corporate equality index" },
  "POGO":          { label: "Watchdog", color: "bg-primary/10 text-primary border-primary/30", description: "Project on Government Oversight — Brass Parachutes, contractor oversight" },
  "PRRI":          { label: "Research", color: "bg-primary/10 text-primary border-primary/30", description: "Public Religion Research Institute — American Values Atlas" },
  "Candid":        { label: "Watchdog", color: "bg-primary/10 text-primary border-primary/30", description: "Candid/GuideStar — nonprofit grantmaking and foundation data" },
  "OpenCorporates":{ label: "OSINT", color: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30", description: "OpenCorporates — global corporate registry and subsidiary mapping" },

  // Tier 2 — Company Self-Report
  "Company":       { label: "Self-Report", color: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30", description: "Company's own disclosures and press releases" },

  // Tier 4 — Media Monitoring
  "GDELT":         { label: "Media", color: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30", description: "Global Database of Events, Language, and Tone — media monitoring" },
  "NewsAPI":       { label: "Media", color: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30", description: "Aggregated news media sources" },
  "Ground News":   { label: "Media", color: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30", description: "Ground News — bias-aware news aggregation" },
};

// ─── Company Data ───

const COMPANIES: ReceiptsCompany[] = [
  {
    slug: "meta", name: "Meta", sector: "Big Tech", state: "CA",
    categories: ["big-tech"],
    stat: "PAC: $341K · 57% Republican · DEI Team Disbanded Jan 2025 · 155 WARN filings",
    status: "full-report", date: "March 2026",
    spice: 5, dramaScore: 94,
    topSignal: "DEI team dissolved + massive WARN filings",
    signalIcon: "dei",
    sources: ["FEC", "WARN", "SEC EDGAR", "Company", "GDELT", "OpenSecrets", "LittleSis"],
  },
  {
    slug: "google", name: "Google", sector: "Big Tech", state: "CA",
    categories: ["big-tech"],
    stat: "Diversity report stopped after 11 years · Hiring targets eliminated Feb 2025",
    status: "full-report", date: "March 2026",
    spice: 4, dramaScore: 82,
    topSignal: "11-year diversity report killed",
    signalIcon: "dei",
    sources: ["FEC", "SEC EDGAR", "Company", "GDELT", "BLS", "OpenSecrets", "LittleSis"],
  },
  {
    slug: "amazon", name: "Amazon", sector: "Big Tech", state: "WA",
    categories: ["big-tech"],
    stat: "14,000 HR cuts · Programs 'wound down' · WARN: 4,085 WA employees",
    status: "full-report", date: "March 2026",
    spice: 5, dramaScore: 91,
    topSignal: "14K HR staff cut + 4,085 WARN notices",
    signalIcon: "layoff",
    sources: ["WARN", "FEC", "SEC EDGAR", "BLS", "GDELT", "OpenSecrets", "POGO"],
  },
  {
    slug: "microsoft", name: "Microsoft", sector: "Big Tech", state: "WA",
    categories: ["big-tech"],
    stat: "DEI team laid off Jul 2024 · Diversity report discontinued",
    status: "full-report", date: "March 2026",
    spice: 3, dramaScore: 68,
    topSignal: "DEI team laid off mid-year",
    signalIcon: "dei",
    sources: ["FEC", "SEC EDGAR", "Company", "GDELT", "OpenSecrets"],
  },
  {
    slug: "boeing", name: "Boeing", sector: "Defense", state: "VA",
    categories: ["big-tech", "defense"],
    stat: "DEI department dismantled Oct 2024 · 20% Black representation goal abandoned",
    status: "full-report", date: "March 2026",
    spice: 4, dramaScore: 85,
    topSignal: "Representation goals scrapped + safety lawsuits",
    signalIcon: "lawsuit",
    sources: ["FEC", "USASpending", "CourtListener", "WARN", "Company", "POGO", "OpenSecrets", "LittleSis"],
  },
  {
    slug: "booz-allen-hamilton", name: "Booz Allen Hamilton", sector: "Consulting", state: "VA",
    categories: ["consulting", "defense"],
    stat: "Full DEI closure · Federal contractor compliance · WorldPride withdrawal",
    status: "full-report", date: "March 2026",
    spice: 4, dramaScore: 79,
    topSignal: "Complete DEI shutdown as federal contractor",
    signalIcon: "contract",
    sources: ["USASpending", "FEC", "LDA", "Company", "OpenSecrets", "POGO", "LittleSis"],
  },
  {
    slug: "accenture", name: "Accenture", sector: "Consulting", state: "Global",
    categories: ["consulting"],
    stat: "All diversity goals 'sunsetted' Feb 2025 · 800K employees affected",
    status: "full-report", date: "March 2026",
    spice: 4, dramaScore: 83,
    topSignal: "800K employees affected by goal sunset",
    signalIcon: "dei",
    sources: ["FEC", "SEC EDGAR", "Company", "GDELT", "LDA", "OpenSecrets", "OpenCorporates"],
  },
  {
    slug: "verizon", name: "Verizon", sector: "Telecom", state: "NY",
    categories: ["telecom"],
    stat: "DEI eliminated as FCC merger condition · $20B Frontier deal",
    status: "full-report", date: "March 2026",
    spice: 3, dramaScore: 72,
    topSignal: "DEI traded away for merger approval",
    signalIcon: "lobbying",
    sources: ["FEC", "LDA", "Company", "GDELT", "OpenSecrets"],
  },
  {
    slug: "t-mobile", name: "T-Mobile", sector: "Telecom", state: "WA",
    categories: ["telecom"],
    stat: "DEI eliminated for FCC approval · $4.4B US Cellular deal",
    status: "full-report", date: "March 2026",
    spice: 3, dramaScore: 70,
    topSignal: "DEI commitments dropped for deal",
    signalIcon: "lobbying",
    sources: ["FEC", "LDA", "Company", "GDELT", "OpenSecrets"],
  },
  {
    slug: "att", name: "AT&T", sector: "Telecom", state: "TX",
    categories: ["telecom"],
    stat: "'DEI does not exist at AT&T' · FCC letter Dec 2025",
    status: "full-report", date: "March 2026",
    spice: 5, dramaScore: 88,
    topSignal: "Publicly declared DEI doesn't exist",
    signalIcon: "dei",
    sources: ["FEC", "LDA", "Company", "GDELT", "OpenSecrets"],
  },
];

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "big-tech", label: "Big Tech" },
  { value: "defense", label: "Defense" },
  { value: "telecom", label: "Telecom" },
  { value: "consulting", label: "Consulting" },
  { value: "finance", label: "Finance" },
];

type SortMode = "drama" | "alpha" | "spice" | "newest";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "drama", label: "Most Drama" },
  { value: "newest", label: "Newest" },
  { value: "spice", label: "Spiciest" },
  { value: "alpha", label: "A–Z" },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } } },
};

// ─── Spice Meter Component ───

function SpiceMeter({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const config = SPICE_LABELS[level];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Flame
          key={i}
          className={`w-3.5 h-3.5 transition-all ${
            i <= level ? config.color : "text-muted-foreground/20"
          }`}
          fill={i <= level ? "currentColor" : "none"}
        />
      ))}
      <span className={`text-xs font-mono ml-1 ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

// ─── Drama Score Bar ───

function DramaBar({ score }: { score: number }) {
  const color =
    score >= 90 ? "bg-destructive" :
    score >= 75 ? "bg-orange-500" :
    score >= 60 ? "bg-[hsl(var(--civic-yellow))]" :
    "bg-muted-foreground";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{score}</span>
    </div>
  );
}

// ─── Source Tier Badges ───

function SourceBadges({ sources }: { sources: string[] }) {
  // Deduplicate by tier label
  const tiers = new Map<string, { label: string; color: string; count: number }>();
  for (const src of sources) {
    const tier = SOURCE_TIERS[src];
    if (tier) {
      const existing = tiers.get(tier.label);
      if (existing) {
        existing.count++;
      } else {
        tiers.set(tier.label, { label: tier.label, color: tier.color, count: 1 });
      }
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from(tiers.values()).map((tier) => (
        <Badge
          key={tier.label}
          variant="outline"
          className={`text-[10px] px-1.5 py-0 border ${tier.color}`}
        >
          {tier.label} ({tier.count})
        </Badge>
      ))}
    </div>
  );
}

// ─── Page ───

export default function Receipts() {
  usePageSEO({
    title: "The Receipts",
    description: "Company-by-company investigations connecting corporate values claims to political spending, DEI actions, and labor impact. Every claim sourced. Every dollar traced.",
    path: "/receipts",
    jsonLd: {
      "@type": "CollectionPage",
      name: "The Receipts",
      description: "Company-by-company investigations connecting corporate values claims to political spending, DEI actions, and labor impact.",
      isPartOf: { "@type": "WebApplication", name: "Who Do I Work For?" },
      provider: { "@type": "Person", name: "Jackye Clayton" },
    },
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode | null>("drama");

  const filtered = useMemo(() => {
    let result = COMPANIES.filter((c) => {
      const matchesCategory =
        category === "all" || c.categories.includes(category);
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.sector.toLowerCase().includes(query) ||
        c.stat.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    // Sort
    switch (sortMode) {
      case "drama":
        result = [...result].sort((a, b) => b.dramaScore - a.dramaScore);
        break;
      case "newest":
        result = [...result].sort((a, b) => {
          const parseDate = (d: string) => {
            const [month, year] = d.split(" ");
            const months: Record<string, number> = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
            return new Date(Number(year), months[month] ?? 0).getTime();
          };
          return parseDate(b.date) - parseDate(a.date);
        });
        break;
      case "spice":
        result = [...result].sort((a, b) => b.spice - a.spice || b.dramaScore - a.dramaScore);
        break;
      case "alpha":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [search, category, sortMode]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="text-center py-16 px-4 max-w-3xl mx-auto">
        <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-4">
          The Receipts
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Follow the money.
          <br />
          Find the truth.
        </h1>
        <p className="text-muted-foreground text-lg mb-3">
          Company-by-company investigations connecting corporate values claims to
          political spending, DEI actions, and labor impact. Every claim sourced.
          Every dollar traced.
        </p>
        <p className="font-mono text-muted-foreground text-xs mb-2">
          Powered by FEC, BLS, LDA, SEC EDGAR, and WARN Act data
        </p>

        {/* Source Tier Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-4 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--civic-green))]" />
            <span className="text-xs text-muted-foreground">Gov Tier 1 — Official records</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Watchdog — OSINT &amp; civil rights orgs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--civic-yellow))]" />
            <span className="text-xs text-muted-foreground">Self-Report — Company disclosures</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--civic-blue))]" />
            <span className="text-xs text-muted-foreground">OSINT &amp; Media — Monitoring &amp; mapping</span>
          </div>
        </div>

        <Link
          to="/submit-tip"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-3"
        >
          Know something? Submit a tip anonymously →
        </Link>
      </section>

      {/* Filter bar */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                size="sm"
                variant={category === cat.value ? "default" : "secondary"}
                className={
                  category === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            {SORT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={sortMode === opt.value ? "default" : "ghost"}
                className={`text-xs h-7 px-2.5 ${
                  sortMode === opt.value
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
                onClick={() => setSortMode(prev => prev === opt.value ? null : opt.value)}
              >
                {opt.value === "drama" && <Flame className="w-3 h-3 mr-1" />}
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <motion.div
        className="max-w-5xl mx-auto px-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={stagger.container}
        initial="hidden"
        animate="show"
        key={`${category}-${search}-${sortMode}`}
      >
        {filtered.map((company, index) => {
          const SignalIcon = SIGNAL_ICONS[company.signalIcon]?.icon || Scale;
          const signalColor = SIGNAL_ICONS[company.signalIcon]?.color || "text-muted-foreground";

          const cardInner = (
            <Card
              className={`bg-card border border-border transition-all ${
                company.status === "full-report"
                  ? "hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                  : "opacity-80"
              }`}
            >
              <CardContent className="p-5 flex flex-col gap-3">
                {/* Header: rank + name + signal icon */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {sortMode === "drama" && (
                      <span className="text-2xl font-bold text-muted-foreground/30 font-mono leading-none">
                        {index + 1}
                      </span>
                    )}
                    <div>
                      <span className="text-lg font-semibold text-foreground block leading-tight">
                        {company.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {company.sector} · {company.state}
                      </span>
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-lg bg-card border border-border/50 ${signalColor}`}>
                    <SignalIcon className="w-4 h-4" />
                  </div>
                </div>

                {/* Spice meter */}
                <SpiceMeter level={company.spice} />

                {/* Drama score bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Drama Score
                    </span>
                  </div>
                  <DramaBar score={company.dramaScore} />
                </div>

                {/* Top signal callout */}
                <div className="bg-background/60 rounded-lg p-2.5 border border-border/30">
                  <p className="text-xs text-foreground font-medium leading-snug">
                    {company.topSignal}
                  </p>
                </div>

                {/* Key stat */}
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  {company.stat}
                </p>

                {/* Source tier badges */}
                <SourceBadges sources={company.sources} />

                {/* Footer */}
                <div className="flex items-center justify-between pt-1">
                  {company.status === "full-report" ? (
                    <Badge className="bg-primary/15 text-primary border-primary/30">
                      Full Report <ArrowRight className="w-3 h-3 ml-1" />
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Coming Soon</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {company.date}
                  </span>
                </div>
              </CardContent>
            </Card>
          );

          return (
            <motion.div key={company.slug} variants={stagger.item}>
              {company.status === "full-report" ? (
                <Link to={`/receipts/${company.slug}`}>{cardInner}</Link>
              ) : (
                cardInner
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No companies match your search.
        </p>
      )}

      {/* Bottom section */}
      <section className="max-w-3xl mx-auto px-4 py-16 space-y-8">
        {/* Source Reliability Explainer */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            How We Grade Our Sources
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Inspired by Ground News, every data point in The Receipts is tagged with its source tier so you know exactly where the information comes from and how much weight to give it.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background/60 border border-border/30">
              <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--civic-green))] mt-1 shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Gov Tier 1</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official government records: FEC, SEC EDGAR, BLS, WARN Act, USASpending, CourtListener, Senate LDA. The gold standard — public record, legally required filings.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background/60 border border-border/30">
              <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Nonprofit</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Third-party indices and ratings: HRC Corporate Equality Index, diversity benchmarks. Methodologically rigorous but not government-verified.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background/60 border border-border/30">
              <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--civic-yellow))] mt-1 shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Self-Report</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Company's own press releases, annual reports, and diversity disclosures. Useful, but remember: companies control this narrative.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background/60 border border-border/30">
              <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--civic-blue))] mt-1 shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Media</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  GDELT media monitoring and NewsAPI aggregation. Signals trends and narratives — strongest when corroborated by Tier 1 data.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            How We Verify Our Investigations
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every Receipts report follows the Who Do I Work For framework: four pillars of
            analysis (Integrity Gap, Labor Impact, Safety Alert, Connected Dots),
            with all data sourced from Tier 1 government records and Tier 2
            company disclosures. No anonymous tips. No AI hallucinations. Just
            public records, connected.
          </p>
          <a
            href="https://wdiwf.jackyeclayton.com/methodology"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Read our full methodology <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          <strong className="text-foreground">Jackye Clayton</strong> — Building
          Who Do I Work For to give workers the intelligence they deserve.
        </p>
      </section>
    </div>
  );
}
