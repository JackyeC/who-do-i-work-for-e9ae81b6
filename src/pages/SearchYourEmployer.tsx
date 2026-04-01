import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, DollarSign, Megaphone, Landmark, Network, ArrowRight,
  Shield, FileText, Building2, Scale, Users, Globe,
  Crosshair, Heart, Hammer, Leaf, Rainbow, Vote,
  ChevronRight, TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfluencePipelineVisual } from "@/components/InfluencePipelineVisual";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const EXAMPLE_COMPANIES = ["Amazon", "ExxonMobil", "Pfizer", "Meta", "Walmart"];

const ISSUE_LENSES = [
  { label: "Climate", icon: Leaf, color: "text-[hsl(var(--civic-green))]" },
  { label: "Labor Rights", icon: Hammer, color: "text-[hsl(var(--civic-blue))]" },
  { label: "Gun Policy", icon: Crosshair, color: "text-destructive" },
  { label: "Healthcare", icon: Heart, color: "text-[hsl(var(--civic-red))]" },
  { label: "Civil Rights", icon: Rainbow, color: "text-[hsl(var(--civic-yellow))]" },
];

const WHAT_YOULL_SEE = [
  {
    icon: DollarSign,
    title: "Money in Politics",
    description: "Campaign donations, PAC activity, and political spending connected to the company and its leadership.",
    color: "text-civic-gold",
    bg: "bg-civic-gold/10 border-civic-gold/20",
  },
  {
    icon: Megaphone,
    title: "Lobbying Activity",
    description: "How the organization influences policy through lobbying and political advocacy.",
    color: "text-[hsl(var(--civic-yellow))]",
    bg: "bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/20",
  },
  {
    icon: Landmark,
    title: "Government Benefits",
    description: "Federal contracts, grants, subsidies, and other public funding connected to the company.",
    color: "text-[hsl(var(--civic-green))]",
    bg: "bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/20",
  },
];

const DATA_SOURCES = [
  { icon: Scale, label: "Federal Election Commission campaign finance data" },
  { icon: FileText, label: "Lobbying disclosure filings" },
  { icon: Landmark, label: "Government spending records" },
  { icon: Building2, label: "Corporate filings" },
  { icon: Globe, label: "Public organization profiles" },
];

export default function SearchYourEmployer() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: trendingCompanies } = useQuery({
    queryKey: ["trending-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("name, slug, total_pac_spending, industry")
        .order("total_pac_spending", { ascending: false })
        .limit(6);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const searchCompany = (name: string) => {
    navigate(`/search?q=${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
{/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-civic-gold-light/50 via-background to-background pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-radial from-civic-gold/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 gold-line" />

        <div className="container mx-auto px-4 pt-24 sm:pt-32 lg:pt-40 pb-20 sm:pb-28 relative">
          <motion.div initial="hidden" animate="show" className="max-w-3xl mx-auto text-center">
            <motion.p variants={fadeUp} custom={0} className="text-sm uppercase tracking-[0.25em] text-civic-gold font-semibold mb-6">
              Career Intelligence Platform
            </motion.p>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-foreground mb-6 font-display"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05 }}
            >
              Search Your{" "}
              <span className="text-civic-gold" style={{ textDecorationLine: "underline", textDecorationColor: "hsl(38 72% 50% / 0.25)", textUnderlineOffset: "8px", textDecorationThickness: "3px" }}>
                Employer.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
              See how money, influence, and policy signals connect to the companies shaping our world.
            </motion.p>

            <motion.p variants={fadeUp} custom={2.5} className="text-sm text-muted-foreground/70 mb-10 max-w-xl mx-auto leading-relaxed">
              Search any company to explore political spending, lobbying activity, leadership donations, and government benefits using public records.
            </motion.p>

            <motion.form variants={fadeUp} custom={3} onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
              <div className="relative flex flex-col sm:flex-row gap-3 bg-card rounded-2xl p-3 shadow-luxury border border-border/40 glow-gold">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search your employer or any company…"
                    className="pl-12 h-14 text-base border-0 shadow-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40"
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-10 rounded-xl text-base font-semibold shadow-elevated gap-2">
                  <Shield className="w-4 h-4" />
                  Run Company Scan
                </Button>
              </div>
            </motion.form>

            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/50">
              <span className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> FEC filings</span>
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Lobbying disclosures</span>
              <span className="flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> USASpending.gov</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── EXAMPLE COMPANIES ─── */}
      <section className="section-padding border-t border-border/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0}>
              <div className="gold-line w-12 mx-auto mb-6" />
              <h2 className="text-xl font-bold text-foreground mb-2 font-display">Try a company people are searching for</h2>
              <p className="text-sm text-muted-foreground mb-8">Click any company to see how influence flows.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="flex flex-wrap justify-center gap-3">
              {EXAMPLE_COMPANIES.map((name) => (
                <Button
                  key={name}
                  variant="outline"
                  size="lg"
                  className="rounded-xl gap-2 font-semibold hover:border-civic-gold-muted/50 hover:bg-civic-gold/[0.03] transition-all"
                  onClick={() => searchCompany(name)}
                >
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  {name}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── WHAT YOU'LL SEE ─── */}
      <section className="section-padding bg-secondary/40">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <div className="gold-line w-12 mx-auto mb-6" />
              <h2 className="text-headline text-foreground mb-3 font-display">What You'll See</h2>
              <p className="text-body text-muted-foreground max-w-lg mx-auto">Every scan reveals the political and financial signals connected to an organization.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {WHAT_YOULL_SEE.map((card, i) => (
                <motion.div key={card.title} variants={fadeUp} custom={i + 1}>
                  <Card className={`h-full border ${card.bg}`}>
                    <CardContent className="p-7">
                      <div className="w-12 h-12 rounded-2xl bg-card/80 border border-border/40 flex items-center justify-center mb-5 shadow-sm">
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2 font-display">{card.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── INFLUENCE PIPELINE PREVIEW ─── */}
      <InfluencePipelineVisual />

      <section className="pb-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            This platform maps how money, influence, and policy outcomes connect across public records.
          </p>
        </div>
      </section>

      {/* ─── VALUES CHECK ─── */}
      <section className="section-padding border-t border-border/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0}>
              <div className="gold-line w-12 mx-auto mb-6" />
              <h2 className="text-headline text-foreground mb-3 font-display">Work Here With Eyes Open</h2>
              <p className="text-body text-muted-foreground max-w-xl mx-auto mb-10">
                Review signals related to political giving, lobbying, executive activity, and public policy issues that may matter to you before accepting a job or supporting a company.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="flex flex-wrap justify-center gap-3">
              {ISSUE_LENSES.map((issue) => (
                <div
                  key={issue.label}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-border/40 bg-card shadow-sm"
                >
                  <issue.icon className={`w-4 h-4 ${issue.color}`} />
                  <span className="text-sm font-medium text-foreground">{issue.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── DATA TRANSPARENCY ─── */}
      <section className="section-padding bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }} />
        <div className="container mx-auto px-4 relative">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/10 mb-6">
                <Shield className="w-6 h-6 text-primary-foreground/80" />
              </div>
              <h2 className="text-headline mb-3 font-display">Where the Data Comes From</h2>
              <p className="text-body-lg text-primary-foreground/55 max-w-xl mx-auto mb-10">
                We use public information to create transparency. Every signal is traced to its original source.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="space-y-3 max-w-lg mx-auto text-left">
              {DATA_SOURCES.map((source) => (
                <div key={source.label} className="flex items-center gap-4 p-4 rounded-xl bg-primary-foreground/[0.04] border border-primary-foreground/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-primary-foreground/[0.06] flex items-center justify-center shrink-0">
                    <source.icon className="w-5 h-5 text-primary-foreground/60" />
                  </div>
                  <span className="text-sm text-primary-foreground/80">{source.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── MOST SEARCHED ─── */}
      {trendingCompanies && trendingCompanies.length > 0 && (
        <section className="section-padding border-t border-border/30">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-3xl mx-auto">
              <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-civic-gold" />
                  <h2 className="text-xl font-bold text-foreground font-display">Most searched companies this week</h2>
                </div>
                <p className="text-sm text-muted-foreground">See what others are exploring.</p>
              </motion.div>

              <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {trendingCompanies.map((company) => (
                  <button
                    key={company.slug}
                    onClick={() => navigate(`/dossier/${company.slug}`)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card hover:border-civic-gold-muted/40 hover:shadow-sm transition-all text-left group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-muted-foreground/70" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.industry}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── BOTTOM CTA ─── */}
      <section className="section-padding bg-gradient-to-b from-background to-civic-gold-light/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-headline text-foreground mb-4 font-display">
              Curious about your own workplace?
            </h2>
            <p className="text-body-lg text-muted-foreground mb-8">
              Search your employer and see how influence flows.
            </p>
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your employer's name…"
                className="h-14 text-base rounded-xl flex-1"
              />
              <Button type="submit" size="lg" className="h-14 px-8 rounded-xl text-base font-semibold gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
</div>
  );
}
