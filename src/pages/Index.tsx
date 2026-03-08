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
  hidden: { opacity: 0, y: 20 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] as const } }),
};

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } } },
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
      <section className="relative overflow-hidden bg-primary/[0.02]">
        {/* Refined herringbone pattern */}
        <div className="absolute inset-0 opacity-[0.012]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, hsl(var(--foreground)) 0, hsl(var(--foreground)) 1px, transparent 0, transparent 50%)`,
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-background pointer-events-none" />
        {/* Gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-civic-gold-muted to-transparent" />

        <div className="container mx-auto px-4 pt-24 sm:pt-32 lg:pt-40 pb-20 sm:pb-28 relative">
          <motion.div initial="hidden" animate="show" className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-card text-primary text-caption px-5 py-2 rounded-full mb-8 border border-border/60 shadow-elegant">
              <Database className="w-3.5 h-3.5" />
              <span className="font-semibold">{companyCount.toLocaleString()} companies analyzed</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-foreground mb-6 text-balance leading-[1.06]" style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)', fontFamily: "'Source Serif 4', serif", fontWeight: 800, letterSpacing: '-0.03em' }}>
              Trace How Corporate Money{" "}
              <span className="bg-gradient-to-r from-primary to-civic-blue bg-clip-text text-transparent">Becomes Influence</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-body-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Search any company to uncover political spending, lobbying networks, government contracts, and worker signals — all from verified public records.
            </motion.p>

            <motion.form variants={fadeUp} custom={3} onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative flex flex-col sm:flex-row gap-3 bg-card rounded-2xl p-2.5 shadow-prominent border border-border/50">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search a company, organization, or executive..."
                    className="pl-12 h-13 text-base border-0 shadow-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50"
                  />
                </div>
                <Button type="submit" size="lg" className="h-13 px-8 rounded-xl shadow-sm text-base font-semibold">
                  <Search className="w-4 h-4 mr-2" />
                  Analyze
                </Button>
              </div>
            </motion.form>

            <motion.div variants={fadeUp} custom={4} className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {[
                { icon: CheckCircle2, label: "FEC & lobbying filings" },
                { icon: Landmark, label: "USASpending contracts" },
                { icon: FileText, label: "SEC & public records" },
              ].map(s => (
                <span key={s.label} className="flex items-center gap-1.5 text-caption text-muted-foreground/60 bg-muted/50 px-3 py-1 rounded-full border border-border/40">
                  <s.icon className="w-3 h-3" />
                  {s.label}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── LIVE PRODUCT PREVIEW ─── */}
      <section className="section-padding bg-muted/30 border-t border-border/40">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <h2 className="text-headline text-foreground mb-3">See the Intelligence in Action</h2>
              <p className="text-body text-muted-foreground max-w-xl mx-auto">Here's what an analysis looks like — real data, real connections, traced from public records.</p>
            </motion.div>

            {/* Mock pipeline visualization */}
            <motion.div variants={fadeUp} custom={1} className="bg-card rounded-2xl border border-border/60 shadow-elevated overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-civic-green" />
                <span className="text-caption font-semibold text-foreground">Influence Pipeline — Sample Company</span>
                <span className="ml-auto text-micro text-muted-foreground">Live example</span>
              </div>

              <div className="p-6 sm:p-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { label: "Money In", value: "$2.4M", sub: "PAC + executive giving", icon: DollarSign, color: "text-civic-blue" },
                    { label: "Influence Network", value: "47 nodes", sub: "Lobbyists, PACs, committees", icon: Network, color: "text-primary" },
                    { label: "Benefits Out", value: "$18.7M", sub: "Contracts + subsidies", icon: TrendingUp, color: "text-civic-green" },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-5 bg-muted/40 rounded-xl border border-border/40">
                      <m.icon className={`w-6 h-6 mx-auto mb-3 ${m.color}`} />
                      <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "'Source Serif 4', serif" }}>{m.value}</div>
                      <div className="text-caption font-medium text-foreground/80 mb-0.5">{m.label}</div>
                      <div className="text-micro text-muted-foreground">{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Pipeline flow */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 py-4 overflow-x-auto">
                  {["PAC Contributions", "→", "Lobbying Firms", "→", "Congressional Committees", "→", "Federal Contracts"].map((node, i) => (
                    i % 2 === 0 ? (
                      <div key={i} className="px-4 py-2.5 bg-primary/[0.06] border border-primary/15 rounded-xl text-caption font-medium text-foreground whitespace-nowrap">
                        {node}
                      </div>
                    ) : (
                      <ChevronRight key={i} className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    )
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <h2 className="text-headline text-foreground mb-3">How It Works</h2>
              <p className="text-body text-muted-foreground">Three steps from question to intelligence.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {[
                { icon: Search, step: "01", title: "Search a Company", desc: "Enter any company name. If it's not in our database, we'll automatically add and scan it." },
                { icon: Layers, step: "02", title: "System Analyzes Records", desc: "We cross-reference FEC filings, lobbying disclosures, government contracts, SEC data, and more." },
                { icon: Network, step: "03", title: "View the Influence Pipeline", desc: "See how money flows through political networks and what government benefits come back." },
              ].map((item, i) => (
                <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="relative text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/[0.06] border border-primary/10 mb-5">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-micro text-primary font-bold tracking-widest uppercase mb-2">Step {item.step}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: "'Source Serif 4', serif" }}>{item.title}</h3>
                  <p className="text-body text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CAPABILITIES ─── */}
      <section className="section-padding bg-muted/30 border-t border-border/40">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <h2 className="text-headline text-foreground mb-3">Platform Capabilities</h2>
              <p className="text-body text-muted-foreground max-w-lg mx-auto">Every signal is sourced, confidence-rated, and reported without judgment.</p>
            </motion.div>

            <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
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
                  className="bg-card rounded-xl border border-border/60 p-6 hover:shadow-elevated hover:border-primary/15 transition-all duration-200 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/[0.06] flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors border border-primary/8">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.label}</h3>
                  <p className="text-caption text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── DATA CREDIBILITY ─── */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-civic-green/10 border border-civic-green/15 mb-5">
                <Shield className="w-7 h-7 text-civic-green" />
              </div>
              <h2 className="text-headline text-foreground mb-3">Powered by Verified Public Data</h2>
              <p className="text-body text-muted-foreground max-w-xl mx-auto">Every signal is traced to its original source. No anonymous tips, no unverifiable claims.</p>
            </motion.div>

            <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Scale, label: "Federal Election Commission", desc: "PAC contributions, individual donations, and committee filings" },
                { icon: FileText, label: "Lobbying Disclosure Act", desc: "Registered lobbyists, issues, and quarterly expenditure reports" },
                { icon: Landmark, label: "USASpending.gov", desc: "Federal contracts, grants, loans, and procurement data" },
                { icon: Building2, label: "SEC EDGAR Filings", desc: "Public company disclosures, executive compensation, ownership" },
                { icon: Users, label: "Congressional Records", desc: "Voting records, committee assignments, bill sponsorships" },
                { icon: Globe, label: "State-Level Sources", desc: "WARN notices, state lobbying registries, pay transparency laws" },
              ].map((item) => (
                <motion.div key={item.label} variants={stagger.item} className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/40">
                  <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center shrink-0 border border-border/60">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm mb-0.5">{item.label}</div>
                    <p className="text-caption text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST & METHODOLOGY ─── */}
      <section className="section-padding-sm bg-muted/30 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Lock, title: "Evidence-Based Signals", desc: "Every finding links to its source document. We show our work so you can verify independently." },
              { icon: BarChart3, title: "Confidence Scoring", desc: "Each signal is rated High, Medium, or Low confidence based on source reliability and corroboration." },
              { icon: BookOpen, title: "Open Methodology", desc: "Our detection methods, scoring models, and data pipeline logic are published and auditable." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                <div className="w-12 h-12 rounded-2xl bg-primary/[0.06] border border-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-caption text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RECENTLY SCANNED ─── */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10 max-w-5xl mx-auto">
            <div>
              <h2 className="text-headline text-foreground">Recently Analyzed</h2>
              <p className="text-body text-muted-foreground mt-1">Latest company profiles with detected signals</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/browse")} className="hidden sm:flex gap-1.5">
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {featuredCompanies.map((company) => (
              <motion.div
                key={company.id}
                variants={stagger.item}
                className="bg-card rounded-xl border border-border/60 p-5 cursor-pointer hover:shadow-elevated hover:border-primary/15 transition-all duration-200 group"
                onClick={() => navigate(`/company/${company.slug}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{company.name}</h3>
                    <p className="text-caption text-muted-foreground mt-0.5">{company.industry} · {company.state}</p>
                  </div>
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/[0.06] flex items-center justify-center text-caption font-bold text-primary border border-primary/10">
                    {company.civic_footprint_score}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-border/60">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-caption text-primary font-medium group-hover:underline">View Analysis →</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="sm:hidden mt-6 text-center">
            <Button variant="outline" onClick={() => navigate("/browse")} className="gap-1.5">
              View All Companies
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ─── WHO IS THIS FOR ─── */}
      <section className="section-padding-sm bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-headline mb-3" style={{ fontFamily: "'Source Serif 4', serif" }}>Built for People Who Need to Know</h2>
            <p className="text-body-lg text-primary-foreground/65">Whether you're evaluating an employer, investigating a company, or tracking influence.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
            {[
              { label: "Job Seekers", icon: Users },
              { label: "Researchers", icon: BookOpen },
              { label: "Journalists", icon: FileText },
              { label: "Analysts", icon: BarChart3 },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary-foreground/80" />
                </div>
                <span className="text-caption font-medium text-primary-foreground/80">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="section-padding-sm border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center max-w-3xl mx-auto">
            {[
              { value: companyCount.toLocaleString(), label: "Companies Analyzed" },
              { value: "12+", label: "Data Source Categories" },
              { value: "2026", label: "Current Data Cycle" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1" style={{ fontFamily: "'Source Serif 4', serif" }}>{stat.value}</div>
                <div className="text-muted-foreground text-caption">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="section-padding bg-muted/30 border-t border-border/40">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="max-w-2xl mx-auto">
            <h2 className="text-headline text-foreground mb-4" style={{ fontFamily: "'Source Serif 4', serif" }}>Start Exploring Corporate Influence</h2>
            <p className="text-body-lg text-muted-foreground mb-10">Search any company to uncover how money moves through political networks.</p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative flex flex-col sm:flex-row gap-3 bg-card rounded-2xl p-2 shadow-elevated border border-border/60">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search a company..."
                    className="pl-12 h-13 text-base border-0 shadow-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50"
                  />
                </div>
                <Button type="submit" size="lg" className="h-13 px-8 rounded-xl shadow-sm text-base font-semibold">
                  Analyze
                </Button>
              </div>
            </form>

            <div className="mt-8">
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
