import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, Shield, Building2, ClipboardCheck, FileText, Map, ArrowRight,
  CheckCircle2, Landmark, Scale, Globe, Users, Lock, BarChart3, BookOpen,
  Heart, Bot, Network, DollarSign, TrendingUp, ChevronRight, Layers, Target
} from "lucide-react";
import { RecentSignalsFeed } from "@/components/RecentSignalsFeed";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PlatformPhilosophy } from "@/components/PlatformPhilosophy";
import { InfluencePipelineVisual } from "@/components/InfluencePipelineVisual";
import { LiveInfluencePreview } from "@/components/LiveInfluencePreview";
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { count } = await supabase.from("companies").select("*", { count: "exact", head: true });
      setCompanyCount(count || 0);
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
        <div className="absolute inset-0 bg-gradient-to-b from-civic-gold-light/50 via-background to-background pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-civic-gold/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 gold-line" />

        <div className="container mx-auto px-4 pt-24 sm:pt-32 lg:pt-40 pb-20 sm:pb-28 relative">
          <motion.div initial="hidden" animate="show" className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2.5 bg-card/80 backdrop-blur-sm text-foreground text-caption px-6 py-2.5 rounded-full mb-8 border border-civic-gold-muted/30 shadow-elegant">
              <div className="w-1.5 h-1.5 rounded-full bg-civic-gold animate-pulse-subtle" />
              <span className="font-semibold tracking-wide">{companyCount.toLocaleString()} employers analyzed</span>
            </motion.div>

            <motion.p variants={fadeUp} custom={0.5} className="text-sm uppercase tracking-[0.25em] text-civic-gold font-semibold mb-4">
              Talent Intelligence by Jackye Clayton
            </motion.p>

            <motion.h1 variants={fadeUp} custom={1} className="text-foreground mb-6 text-balance leading-[1.02] font-display" style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Know the company<br />
              <span className="text-civic-gold" style={{ textDecorationLine: 'underline', textDecorationColor: 'hsl(38 72% 50% / 0.25)', textUnderlineOffset: '8px', textDecorationThickness: '3px' }}>
                behind the job description.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-body-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Employer intelligence that helps recruiters, candidates, and talent leaders understand 
              the real signals around any organization — so recruiting messaging can be honest, 
              transparent, and aligned with candidate expectations.
            </motion.p>

            <motion.form variants={fadeUp} custom={3} onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
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
                  Start Exploring
                </Button>
              </div>
            </motion.form>

            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                { icon: CheckCircle2, label: "Policy influence filings" },
                { icon: Landmark, label: "Government contracts" },
                { icon: FileText, label: "Workforce & regulatory records" },
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

      {/* ─── LIVE INFLUENCE PREVIEW ─── */}
      <LiveInfluencePreview />

      {/* ─── PRODUCT PROMISE ─── */}
      <section className="section-padding border-t border-border/30 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="gold-line w-16 mx-auto mb-8" />
            <h2 className="text-headline text-foreground mb-4 font-display">Recruit with evidence, not assumptions.</h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
              This platform analyzes publicly available records and documented signals to help 
              recruiters and candidates understand the broader environment surrounding an employer. 
              It does not assign moral judgment. It surfaces evidence so people can make informed career decisions.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              {["Employer intelligence for modern recruiting", "Talent decisions deserve real signals"].map(t => (
                <span key={t} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border/40">
                  <Target className="w-3 h-3 text-civic-gold" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── EMPLOYER REALITY SIGNALS ─── */}
      <section className="section-padding border-t border-border/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-6xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <div className="gold-line w-16 mx-auto mb-8" />
              <h2 className="text-headline text-foreground mb-4 font-display">Employer Reality Signals</h2>
              <p className="text-body-lg text-muted-foreground max-w-xl mx-auto">Evidence-backed indicators generated from public data that reveal how companies actually operate.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "Workforce Signals", items: ["Layoffs & WARN notices", "Hiring surges", "Restructuring events", "Workforce reporting"] },
                { icon: Scale, title: "Policy Signals", items: ["Lobbying disclosures", "PAC activity", "Legislation sponsorship", "Policy positions"] },
                { icon: DollarSign, title: "Economic Signals", items: ["Government contracts", "Regulatory disputes", "Industry alliances", "Public company disclosures"] },
                { icon: Building2, title: "Governance Signals", items: ["Leadership structure", "Corporate governance changes", "Human capital disclosures", "Regulatory filings"] },
              ].map((cat, i) => (
                <motion.div key={cat.title} variants={fadeUp} custom={i + 1} className="bg-card rounded-2xl border border-border/40 p-6 shadow-luxury">
                  <div className="w-12 h-12 rounded-xl bg-primary/[0.06] flex items-center justify-center mb-4 border border-primary/[0.06]">
                    <cat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-3 font-display">{cat.title}</h3>
                  <ul className="space-y-1.5">
                    {cat.items.map(item => (
                      <li key={item} className="text-caption text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-civic-gold shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOUR CORE QUESTIONS ─── */}
      <section className="section-padding border-t border-border/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-6xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <div className="gold-line w-16 mx-auto mb-8" />
              <h2 className="text-headline text-foreground mb-4 font-display">Four Questions. One Platform.</h2>
              <p className="text-body-lg text-muted-foreground max-w-xl mx-auto">Every tool helps answer a core talent intelligence question.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div variants={fadeUp} custom={1} className="bg-card rounded-3xl border border-border/40 p-8 shadow-luxury hover:shadow-elegant hover:border-civic-gold-muted/30 transition-all duration-300 group flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-6 group-hover:bg-civic-gold/[0.08] transition-colors border border-primary/[0.06]">
                  <Building2 className="w-6 h-6 text-primary group-hover:text-civic-gold transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 font-display">Who Do We Actually Work For?</h3>
                <p className="text-sm text-muted-foreground mb-2 font-medium">Understand the employer behind the brand.</p>
                <p className="text-caption text-muted-foreground leading-relaxed mb-6 flex-1">
                  Public signals suggest how companies operate — including workforce stability, government contracts, policy influence, and organizational affiliations.
                </p>
                <Button onClick={() => navigate("/check?tab=company")} className="w-full gap-2 rounded-xl font-semibold">
                  Scan an Employer <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} custom={2} className="bg-card rounded-3xl border border-border/40 p-8 shadow-luxury hover:shadow-elegant hover:border-civic-gold-muted/30 transition-all duration-300 group flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-6 group-hover:bg-civic-gold/[0.08] transition-colors border border-primary/[0.06]">
                  <ClipboardCheck className="w-6 h-6 text-primary group-hover:text-civic-gold transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 font-display">Is This Offer Right For Me?</h3>
                <p className="text-sm text-muted-foreground mb-2 font-medium">Analyze offer terms against employer signals.</p>
                <p className="text-caption text-muted-foreground leading-relaxed mb-6 flex-1">
                  Available filings indicate compensation patterns, equity terms, and contract language — matched with employer reality signals.
                </p>
                <Button onClick={() => navigate("/check?tab=offer")} variant="outline" className="w-full gap-2 rounded-xl font-semibold">
                  Analyze My Offer <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} custom={3} className="bg-card rounded-3xl border border-border/40 p-8 shadow-luxury hover:shadow-elegant hover:border-civic-gold-muted/30 transition-all duration-300 group flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-6 group-hover:bg-civic-gold/[0.08] transition-colors border border-primary/[0.06]">
                  <Map className="w-6 h-6 text-primary group-hover:text-civic-gold transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 font-display">Where Could My Career Go?</h3>
                <p className="text-sm text-muted-foreground mb-2 font-medium">Map career paths aligned with your profile.</p>
                <p className="text-caption text-muted-foreground leading-relaxed mb-6 flex-1">
                  Discover career paths, skill gaps, and aligned employers based on documented workforce and industry signals.
                </p>
                <Button onClick={() => navigate("/career-map")} variant="outline" className="w-full gap-2 rounded-xl font-semibold">
                  Explore My Career Map <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="bg-card rounded-3xl border border-border/40 p-8 shadow-luxury hover:shadow-elegant hover:border-civic-gold-muted/30 transition-all duration-300 group flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-6 group-hover:bg-civic-gold/[0.08] transition-colors border border-primary/[0.06]">
                  <Network className="w-6 h-6 text-primary group-hover:text-civic-gold transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 font-display">What Does This Company Prioritize?</h3>
                <p className="text-sm text-muted-foreground mb-2 font-medium">Explore documented financial and influence relationships.</p>
                <p className="text-caption text-muted-foreground leading-relaxed mb-6 flex-1">
                  Documented records show connections between companies, executives, trade groups, and policy recipients — revealing what companies invest in beyond their products.
                </p>
                <Button onClick={() => navigate("/check?tab=candidate")} variant="outline" className="w-full gap-2 rounded-xl font-semibold">
                  Explore Employer Signals <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
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
                { icon: Search, step: "01", title: "Search or Upload", desc: "Enter an employer name, upload an offer letter, or import your resume to get started." },
                { icon: Layers, step: "02", title: "System Analyzes Signals", desc: "We cross-reference policy filings, lobbying disclosures, government contracts, workforce data, and regulatory records." },
                { icon: Network, step: "03", title: "Get Employer Intelligence", desc: "See employer reality signals, offer analysis, and talent alignment insights all in one place." },
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

      {/* ─── DATA CREDIBILITY ─── */}
      <section className="section-padding bg-primary text-primary-foreground relative overflow-hidden">
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
                { icon: Globe, label: "State-Level Sources", desc: "WARN notices, state lobbying registries, workforce reporting" },
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

      {/* ─── RECENT SIGNALS FEED ─── */}
      <RecentSignalsFeed />

      {/* ─── INFLUENCE PIPELINE VISUAL ─── */}
      <InfluencePipelineVisual />

      {/* ─── SEARCH YOUR EMPLOYER CTA ─── */}
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
              Search your employer.
            </h2>
            <p className="text-body-lg text-muted-foreground mb-8">
              Curious what signals are available about your employer? You might be surprised what public records reveal.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement).elements.namedItem("employer") as HTMLInputElement;
                if (input.value.trim()) navigate(`/search?q=${encodeURIComponent(input.value.trim())}`);
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <Input
                name="employer"
                placeholder="Enter your employer's name..."
                className="h-14 text-base rounded-xl flex-1"
              />
              <Button type="submit" size="lg" className="h-14 px-8 rounded-xl text-base font-semibold">
                Search
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ─── PHILOSOPHY ─── */}
      <section className="section-padding">
        <div className="container mx-auto px-4 max-w-3xl">
          <PlatformPhilosophy />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center mt-12">
            {[
              { icon: Lock, title: "Evidence-Based Signals", desc: "Every finding links to its source document. We show our work so you can verify independently." },
              { icon: BarChart3, title: "Confidence Scoring", desc: "Each signal is rated High, Medium, or Low confidence based on source reliability and corroboration." },
              { icon: BookOpen, title: "Open Methodology", desc: "Our detection methods, scoring models, and data pipeline logic are published and auditable." },
            ].map((item) => (
              <div key={item.title}>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border/40 mb-5 shadow-elevated">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2 font-display">{item.title}</h3>
                <p className="text-caption text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
