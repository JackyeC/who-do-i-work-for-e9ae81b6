import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";

interface ReceiptsCompany {
  slug: string;
  name: string;
  sector: string;
  state: string;
  categories: string[];
  stat: string;
  status: "full-report" | "coming-soon";
  date: string;
}

const COMPANIES: ReceiptsCompany[] = [
  { slug: "meta", name: "Meta", sector: "Big Tech", state: "CA", categories: ["big-tech"], stat: "PAC: $341K · 57% Republican · DEI Team Disbanded Jan 2025 · 155 WARN filings", status: "full-report", date: "March 2026" },
  { slug: "google", name: "Google", sector: "Big Tech", state: "CA", categories: ["big-tech"], stat: "Diversity report stopped after 11 years · Hiring targets eliminated Feb 2025", status: "full-report", date: "March 2026" },
  { slug: "amazon", name: "Amazon", sector: "Big Tech", state: "WA", categories: ["big-tech"], stat: "14,000 HR cuts · Programs 'wound down' · WARN: 4,085 WA employees", status: "full-report", date: "March 2026" },
  { slug: "microsoft", name: "Microsoft", sector: "Big Tech", state: "WA", categories: ["big-tech"], stat: "DEI team laid off Jul 2024 · Diversity report discontinued", status: "full-report", date: "March 2026" },
  { slug: "boeing", name: "Boeing", sector: "Defense", state: "VA", categories: ["big-tech", "defense"], stat: "DEI department dismantled Oct 2024 · 20% Black representation goal abandoned", status: "full-report", date: "March 2026" },
  { slug: "booz-allen-hamilton", name: "Booz Allen Hamilton", sector: "Consulting", state: "VA", categories: ["consulting", "defense"], stat: "Full DEI closure · Federal contractor compliance · WorldPride withdrawal", status: "full-report", date: "March 2026" },
  { slug: "accenture", name: "Accenture", sector: "Consulting", state: "Global", categories: ["consulting"], stat: "All diversity goals 'sunsetted' Feb 2025 · 800K employees affected", status: "full-report", date: "March 2026" },
  { slug: "verizon", name: "Verizon", sector: "Telecom", state: "NY", categories: ["telecom"], stat: "DEI eliminated as FCC merger condition · $20B Frontier deal", status: "full-report", date: "March 2026" },
  { slug: "t-mobile", name: "T-Mobile", sector: "Telecom", state: "WA", categories: ["telecom"], stat: "DEI eliminated for FCC approval · $4.4B US Cellular deal", status: "full-report", date: "March 2026" },
  { slug: "att", name: "AT&T", sector: "Telecom", state: "TX", categories: ["telecom"], stat: "'DEI does not exist at AT&T' · FCC letter Dec 2025", status: "full-report", date: "March 2026" },
];

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "big-tech", label: "Big Tech" },
  { value: "defense", label: "Defense" },
  { value: "telecom", label: "Telecom" },
  { value: "consulting", label: "Consulting" },
  { value: "finance", label: "Finance" },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } } },
};

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

  const filtered = useMemo(() => {
    return COMPANIES.filter((c) => {
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
  }, [search, category]);

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
        <p className="font-mono text-muted-foreground text-xs mb-4">
          Powered by FEC, BLS, LDA, SEC EDGAR, and WARN Act data
        </p>
        <Link
          to="/submit-tip"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Know something? Submit a tip anonymously →
        </Link>
      </section>

      {/* Filter bar */}
      <div className="max-w-5xl mx-auto px-4 mb-10">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
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
      </div>

      {/* Cards grid */}
      <motion.div
        className="max-w-5xl mx-auto px-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={stagger.container}
        initial="hidden"
        animate="show"
        key={`${category}-${search}`}
      >
        {filtered.map((company) => {
          const cardInner = (
            <Card
              className={`bg-card border border-border transition-colors ${
                company.status === "full-report"
                  ? "hover:border-primary/60 cursor-pointer"
                  : "opacity-80"
              }`}
            >
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-foreground">
                    {company.name}
                  </span>
                  {company.status === "full-report" && (
                    <ArrowRight className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {company.sector} · {company.state}
                </span>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  {company.stat}
                </p>
                <div className="flex items-center justify-between pt-1">
                  {company.status === "full-report" ? (
                    <Badge className="bg-primary/15 text-primary border-primary/30">
                      Full Report
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
