import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, Shield, BookOpen, Building2, ClipboardCheck, Bot, DollarSign,
  Users, BarChart3, Heart, ArrowRight, Eye, Bell, CheckCircle2, Sparkles,
  Network, FileText, Scale, Globe, Lock, TrendingUp, Landmark, Layers,
  ChevronRight, Database, Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const } }),
};

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } } },
};

const Index = () => {
  const [query, setQuery] = useState("");
  const [companyCount, setCompanyCount] = useState(0);
  const [featuredCompanies, setFeaturedCompanies] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { count } = await supabase.from("companies").select("*", { count: "exact", head: true });
      setCompanyCount(count || 0);
      const { data } = await supabase.from("companies").select("*").order("updated_at", { ascending: false }).limit(6);
      setFeaturedCompanies(data || []);
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Warm luxury gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-civic-gold-light/50 via-background to-background pointer-events-none" />
        {/* Subtle radial glow from top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-civic-gold/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 gold-line" />

        <div className="container mx-auto px-4 pt-28 sm:pt-36 lg:pt-44 pb-24 sm:pb-32 relative">
          <motion.div initial="hidden" animate="show" className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2.5 bg-card/80 backdrop-blur-sm text-foreground text-caption px-6 py-2.5 rounded-full mb-10 border border-civic-gold-muted/30 shadow-elegant">
              <div className="w-1.5 h-1.5 rounded-full bg-civic-gold animate-pulse-subtle" />
              <span className="font-semibold tracking-wide">{companyCount.toLocaleString()} companies analyzed</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-foreground mb-8 text-balance leading-[1.02] font-display" style={{ fontSize: 'clamp(2.75rem, 6vw, 4.75rem)', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Trace How Corporate Money<br />
              <span className="text-civic-gold" style={{ textDecorationLine: 'underline', textDecorationColor: 'hsl(38 72% 50% / 0.25)', textUnderlineOffset: '8px', textDecorationThickness: '3px' }}>Becomes Influence</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-body-lg text-muted-foreground mb-14 max-w-2xl mx-auto leading-relaxed">
              Search any company to uncover political spending, lobbying networks, government contracts, and worker signals — all from verified public records.
            </motion.p>

            <motion.form variants={fadeUp} custom={3} onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative flex flex-col sm:flex-row gap-3 bg-card rounded-2xl p-3 shadow-luxury border border-border/40 glow-gold">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search a company, organization, or executive..."
                    className="pl-12 h-14 text-base border-0 shadow-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40"
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-10 rounded-xl text-base font-semibold shadow-elevated">
                  <Search className="w-4 h-4 mr-2" />
                  Analyze
                </Button>
              </div>
            </motion.form>

            <motion.div variants={fadeUp} custom={4} className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                { icon: CheckCircle2, label: "FEC & lobbying filings" },
                { icon: Landmark, label: "USASpending contracts" },
                { icon: FileText, label: "SEC & public records" },
              ].map(s => (
                <span key={s.label} className="flex items-center gap-2 text-caption text-muted-foreground/50">
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── LIVE PRODUCT PREVIEW ─── */}
      <section className="section-padding border-t border-border/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <div className="gold-line w-16 mx-auto mb-8" />
              <h2 className="text-headline text-foreground mb-4 font-display">See the Intelligence in Action</h2>
              <p className="text-body-lg text-muted-foreground max-w-xl mx-auto">Here's what an analysis looks like — real data, real connections, traced from public records.</p>
            </motion.div>

            {/* Mock pipeline visualization */}
            <motion.div variants={fadeUp} custom={1} className="bg-card rounded-3xl border border-border/40 shadow-luxury overflow-hidden">
              <div className="px-8 py-5 border-b border-border/40 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-civic-gold animate-pulse-subtle" />
                <span className="text-caption font-semibold text-foreground tracking-wide">Influence Pipeline — Sample Company</span>
                <span className="ml-auto text-micro text-muted-foreground/60 uppercase tracking-widest">Live example</span>
              </div>

              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  {[
                    { label: "Money In", value: "$2.4M", sub: "PAC + executive giving", icon: DollarSign, accent: "civic-blue" },
                    { label: "Influence Network", value: "47", sub: "Lobbyists, PACs, committees", icon: Network, accent: "civic-gold" },
                    { label: "Benefits Out", value: "$18.7M", sub: "Contracts + subsidies", icon: TrendingUp, accent: "civic-green" },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-8 bg-background/60 rounded-2xl border border-border/30">
                      <m.icon className={`w-6 h-6 mx-auto mb-4 text-${m.accent}`} />
                      <div className="font-display-number text-4xl sm:text-5xl font-bold text-foreground mb-2">{m.value}</div>
                      <div className="text-caption font-semibold text-foreground/70 uppercase tracking-wider mb-1">{m.label}</div>
                      <div className="text-micro text-muted-foreground">{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Pipeline flow */}
                <div className="flex items-center justify-center gap-3 sm:gap-5 py-6 overflow-x-auto">
                  {["PAC Contributions", "→", "Lobbying Firms", "→", "Congressional Committees", "→", "Federal Contracts"].map((node, i) => (
                    i % 2 === 0 ? (
                      <div key={i} className="px-5 py-3 bg-primary/[0.04] border border-primary/10 rounded-xl text-caption font-medium text-foreground whitespace-nowrap">
                        {node}
                      </div>
                    ) : (
                      <ChevronRight key={i} className="w-4 h-4 text-civic-gold-muted shrink-0" />
                    )
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="section-padding bg-secondary/40">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-18">
              <div className="gold-line w-16 mx-auto mb-8" />
              <h2 className="text-headline text-foreground mb-4 font-display">How It Works</h2>
              <p className="text-body-lg text-muted-foreground">Three steps from question to intelligence.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
              {[
                { icon: Search, step: "01", title: "Search a Company", desc: "Enter any company name. If it's not in our database, we'll automatically add and scan it." },
                { icon: Layers, step: "02", title: "System Analyzes Records", desc: "We cross-reference FEC filings, lobbying disclosures, government contracts, SEC data, and more." },
                { icon: Network, step: "03", title: "View the Influence Pipeline", desc: "See how money flows through political networks and what government benefits come back." },
              ].map((item, i) => (
                <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="relative text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border/40 mb-6 shadow-elevated">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-micro text-civic-gold font-bold tracking-[0.2em] uppercase mb-3">Step {item.step}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 font-display">{item.title}</h3>
                  <p className="text-body text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CAPABILITIES ─── */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
            <motion.div variants={fadeUp} custom={0} className="text-center mb-18">
              <div className="gold-line w-16 mx-auto mb-8" />
              <h2 className="text-headline text-foreground mb-4 font-display">Platform Capabilities</h2>
              <p className="text-body-lg text-muted-foreground max-w-lg mx-auto">Every signal is sourced, confidence-rated, and reported without judgment.</p>
            </motion.div>

            <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Network, label: "Corporate Influence Mapping", desc: "Visualize how money flows through political and business networks across multiple hops." },
                { icon: DollarSign, label: "Political Spending Analysis", desc: "Track PAC contributions, executive donations, lobbying spend, and dark money connections." },
                { icon: Landmark, label: "Government Benefits Tracking", desc: "Identify federal contracts, grants, subsidies, and procurement relationships." },
                { icon: Globe, label: "Entity Resolution & Ownership", desc: "Uncover connections across subsidiaries, parent companies, and related entities." },
                { icon: Bot, label: "AI Hiring & HR Technology", desc: "Detect automated screening tools, AI vendors, bias audit status, and transparency." },
                { icon: Heart, label: "Worker Benefits & Sentiment", desc: "Healthcare, compensation transparency, employee satisfaction, and union relationships." },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  variants={stagger.item}
                  className="bg-card rounded-2xl border border-border/40 p-7 hover:shadow-luxury hover:border-civic-gold-muted/30 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/[0.04] flex items-center justify-center mb-5 group-hover:bg-civic-gold/[0.08] transition-colors duration-300 border border-primary/[0.06]">
                    <item.icon className="w-5 h-5 text-primary group-hover:text-civic-gold transition-colors duration-300" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 font-display text-base">{item.label}</h3>
                  <p className="text-caption text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── DATA CREDIBILITY ─── */}
      <section className="section-padding bg-primary text-primary-foreground relative overflow-hidden">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
        <div className="container mx-auto px-4 relative">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/10 mb-6">
                <Shield className="w-7 h-7 text-primary-foreground/80" />
              </div>
              <h2 className="text-headline mb-4 font-display">Powered by Verified Public Data</h2>
              <p className="text-body-lg text-primary-foreground/55 max-w-xl mx-auto">Every signal is traced to its original source. No anonymous tips, no unverifiable claims.</p>
            </motion.div>

            <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { icon: Scale, label: "Federal Election Commission", desc: "PAC contributions, individual donations, and committee filings" },
                { icon: FileText, label: "Lobbying Disclosure Act", desc: "Registered lobbyists, issues, and quarterly expenditure reports" },
                { icon: Landmark, label: "USASpending.gov", desc: "Federal contracts, grants, loans, and procurement data" },
                { icon: Building2, label: "SEC EDGAR Filings", desc: "Public company disclosures, executive compensation, ownership" },
                { icon: Users, label: "Congressional Records", desc: "Voting records, committee assignments, bill sponsorships" },
                { icon: Globe, label: "State-Level Sources", desc: "WARN notices, state lobbying registries, pay transparency laws" },
              ].map((item) => (
                <motion.div key={item.label} variants={stagger.item} className="flex items-start gap-4 p-5 rounded-2xl bg-primary-foreground/[0.04] border border-primary-foreground/[0.06]">
                  <div className="w-11 h-11 rounded-xl bg-primary-foreground/[0.06] flex items-center justify-center shrink-0 border border-primary-foreground/[0.06]">
                    <item.icon className="w-5 h-5 text-primary-foreground/60" />
                  </div>
                  <div>
                    <div className="font-semibold text-primary-foreground/90 text-sm mb-1">{item.label}</div>
                    <p className="text-caption text-primary-foreground/45">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST & METHODOLOGY ─── */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="gold-line w-16 mx-auto mb-16" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {[
                { icon: Lock, title: "Evidence-Based Signals", desc: "Every finding links to its source document. We show our work so you can verify independently." },
                { icon: BarChart3, title: "Confidence Scoring", desc: "Each signal is rated High, Medium, or Low confidence based on source reliability and corroboration." },
                { icon: BookOpen, title: "Open Methodology", desc: "Our detection methods, scoring models, and data pipeline logic are published and auditable." },
              ].map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                  <div className="w-14 h-14 rounded-2xl bg-card border border-border/40 flex items-center justify-center mx-auto mb-5 shadow-elevated">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-3 font-display">{item.title}</h3>
                  <p className="text-caption text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── RECENTLY SCANNED ─── */}
      <section className="section-padding bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12 max-w-5xl mx-auto">
            <div>
              <div className="gold-line w-12 mb-6" style={{ marginLeft: 0 }} />
              <h2 className="text-headline text-foreground font-display">Recently Analyzed</h2>
              <p className="text-body text-muted-foreground mt-2">Latest company profiles with detected signals</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/browse")} className="hidden sm:flex gap-2 rounded-xl">
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {featuredCompanies.map((company) => (
              <motion.div
                key={company.id}
                variants={stagger.item}
                className="bg-card rounded-2xl border border-border/40 p-6 cursor-pointer hover:shadow-luxury hover:border-civic-gold-muted/30 transition-all duration-300 group"
                onClick={() => navigate(`/company/${company.slug}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate font-display">{company.name}</h3>
                    <p className="text-caption text-muted-foreground mt-1">{company.industry} · {company.state}</p>
                  </div>
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/[0.04] flex items-center justify-center font-display-number text-lg font-bold text-primary border border-primary/[0.06]">
                    {company.civic_footprint_score}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-5 pt-5 border-t border-border/40">
                  <span className="text-caption text-civic-gold font-medium group-hover:text-civic-gold transition-colors">View Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5 text-civic-gold group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="sm:hidden mt-8 text-center">
            <Button variant="outline" onClick={() => navigate("/browse")} className="gap-2 rounded-xl">
              View All Companies
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ─── WHO IS THIS FOR ─── */}
      <section className="section-padding-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="gold-line w-16 mx-auto mb-8" />
            <h2 className="text-headline text-foreground mb-4 font-display">Built for People Who Need to Know</h2>
            <p className="text-body-lg text-muted-foreground">Whether you're evaluating an employer, investigating a company, or tracking influence.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
            {[
              { label: "Job Seekers", icon: Users },
              { label: "Researchers", icon: BookOpen },
              { label: "Journalists", icon: FileText },
              { label: "Analysts", icon: BarChart3 },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-card border border-border/40 flex items-center justify-center shadow-elevated">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-caption font-semibold text-foreground/70">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="section-padding-sm bg-secondary/40 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 sm:gap-12 text-center max-w-3xl mx-auto">
            {[
              { value: companyCount.toLocaleString(), label: "Companies Analyzed" },
              { value: "12+", label: "Data Source Categories" },
              { value: "2026", label: "Current Data Cycle" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display-number text-4xl sm:text-5xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-muted-foreground text-caption">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="section-padding relative overflow-hidden">
        {/* Subtle warm glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-radial from-civic-gold/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="max-w-2xl mx-auto">
            <div className="gold-line w-16 mx-auto mb-10" />
            <h2 className="text-headline text-foreground mb-5 font-display">Start Exploring Corporate Influence</h2>
            <p className="text-body-lg text-muted-foreground mb-12">Search any company to uncover how money moves through political networks.</p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative flex flex-col sm:flex-row gap-3 bg-card rounded-2xl p-3 shadow-luxury border border-border/40">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search a company..."
                    className="pl-12 h-14 text-base border-0 shadow-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40"
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-10 rounded-xl text-base font-semibold shadow-elevated">
                  Analyze
                </Button>
              </div>
            </form>

            <div className="mt-10">
              <Button variant="ghost" onClick={() => navigate("/methodology")} className="text-muted-foreground gap-2 hover:text-foreground">
                <BookOpen className="w-4 h-4" />
                Read Our Methodology
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
