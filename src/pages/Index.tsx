import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, Shield, Building2, ClipboardCheck, FileText, Map, ArrowRight,
  CheckCircle2, Landmark, Scale, Globe, Users, Lock, BarChart3, BookOpen,
  Network, DollarSign, Layers, Target, Briefcase, Bell,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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

      {/* ─── 1. HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-civic-gold-light/50 via-background to-background pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-civic-gold/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 gold-line" />

        <div className="container mx-auto px-4 pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 relative">
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
              the real signals around any organization.
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

      {/* ─── 2. FOUR CORE QUESTIONS — asymmetric layout ─── */}
      <section className="section-padding border-t border-border/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-6xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <div className="gold-line w-16 mx-auto mb-8" />
              <h2 className="text-headline text-foreground mb-4 font-display">Four Questions. One Platform.</h2>
              <p className="text-body-lg text-muted-foreground max-w-xl mx-auto">Every tool helps answer a core talent intelligence question.</p>
            </motion.div>

            {/* Asymmetric: large left + stacked right */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Featured card — spans 3 cols */}
              <motion.div variants={fadeUp} custom={1} className="lg:col-span-3 bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-10 shadow-luxury text-primary-foreground relative overflow-hidden group flex flex-col justify-between min-h-[320px]">
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }} />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mb-6 border border-primary-foreground/10">
                    <Building2 className="w-6 h-6 text-primary-foreground/80" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 font-display">Who Do We Actually Work For?</h3>
                  <p className="text-primary-foreground/60 text-sm leading-relaxed max-w-md">
                    Public signals reveal workforce stability, government contracts, policy influence, and organizational affiliations behind the brand.
                  </p>
                </div>
                <Button onClick={() => navigate("/check?tab=company")} variant="secondary" className="w-fit gap-2 rounded-xl font-semibold mt-6">
                  Scan an Employer <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>

              {/* Stacked right — spans 2 cols */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <motion.div variants={fadeUp} custom={2} className="bg-card rounded-2xl border border-border/40 p-6 shadow-luxury hover:shadow-elevated hover:border-civic-gold-muted/30 transition-all duration-300 group flex-1 flex flex-col">
                  <ClipboardCheck className="w-5 h-5 text-civic-gold mb-3" />
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-display">Is This Offer Right?</h3>
                  <p className="text-caption text-muted-foreground leading-relaxed mb-4 flex-1">Analyze compensation patterns and contract language against employer signals.</p>
                  <Button onClick={() => navigate("/check?tab=offer")} variant="outline" size="sm" className="w-fit gap-1.5 rounded-lg text-xs">
                    Analyze Offer <ArrowRight className="w-3 h-3" />
                  </Button>
                </motion.div>

                <motion.div variants={fadeUp} custom={3} className="bg-card rounded-2xl border border-border/40 p-6 shadow-luxury hover:shadow-elevated hover:border-civic-gold-muted/30 transition-all duration-300 group flex-1 flex flex-col">
                  <Map className="w-5 h-5 text-civic-green mb-3" />
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-display">Where Could My Career Go?</h3>
                  <p className="text-caption text-muted-foreground leading-relaxed mb-4 flex-1">Discover career paths and skill gaps aligned with industry signals.</p>
                  <Button onClick={() => navigate("/career-map")} variant="outline" size="sm" className="w-fit gap-1.5 rounded-lg text-xs">
                    Explore Paths <ArrowRight className="w-3 h-3" />
                  </Button>
                </motion.div>

                <motion.div variants={fadeUp} custom={4} className="bg-card rounded-2xl border border-border/40 p-6 shadow-luxury hover:shadow-elevated hover:border-civic-gold-muted/30 transition-all duration-300 group flex-1 flex flex-col">
                  <Network className="w-5 h-5 text-civic-blue mb-3" />
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-display">What Does This Company Prioritize?</h3>
                  <p className="text-caption text-muted-foreground leading-relaxed mb-4 flex-1">Trace connections between companies, executives, and policy recipients.</p>
                  <Button onClick={() => navigate("/check?tab=candidate")} variant="outline" size="sm" className="w-fit gap-1.5 rounded-lg text-xs">
                    Explore Signals <ArrowRight className="w-3 h-3" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 3. LIVE INFLUENCE PREVIEW (interactive data — visual break) ─── */}
      <LiveInfluencePreview />

      {/* ─── 4. HOW IT WORKS — horizontal stepper ─── */}
      <section className="section-padding-sm bg-secondary/40 border-t border-border/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <h2 className="text-headline text-foreground mb-3 font-display">How It Works</h2>
              <p className="text-body text-muted-foreground">Three steps from question to intelligence.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {[
                { icon: Search, step: "01", title: "Search or Upload", desc: "Enter an employer name, upload an offer letter, or import your resume." },
                { icon: Layers, step: "02", title: "System Analyzes", desc: "We cross-reference policy filings, lobbying disclosures, contracts, and workforce data." },
                { icon: Network, step: "03", title: "Get Intelligence", desc: "See employer reality signals, offer analysis, and talent alignment insights." },
              ].map((item, i) => (
                <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="relative text-center px-6 py-8">
                  {/* Connector line */}
                  {i < 2 && <div className="hidden md:block absolute top-1/2 right-0 w-px h-16 -translate-y-1/2 bg-gradient-to-b from-transparent via-border to-transparent" />}
                  <div className="text-micro text-civic-gold font-bold tracking-[0.2em] uppercase mb-4">Step {item.step}</div>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border/40 mb-5 shadow-elevated">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2 font-display">{item.title}</h3>
                  <p className="text-caption text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 5. DATA CREDIBILITY — dark contrast section ─── */}
      <section className="section-padding bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
        <div className="container mx-auto px-4 relative">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/10 mb-6">
                <Shield className="w-6 h-6 text-primary-foreground/80" />
              </div>
              <h2 className="text-headline mb-3 font-display">Powered by Verified Public Data</h2>
              <p className="text-body text-primary-foreground/55 max-w-xl mx-auto">Every signal is traced to its original source. No anonymous tips, no unverifiable claims.</p>
            </motion.div>

            <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Scale, label: "FEC", desc: "PAC contributions & committee filings" },
                { icon: FileText, label: "Lobbying Disclosure", desc: "Registered lobbyists & expenditures" },
                { icon: Landmark, label: "USASpending", desc: "Federal contracts, grants & procurement" },
                { icon: Building2, label: "SEC EDGAR", desc: "Public company disclosures" },
                { icon: Users, label: "Congressional Records", desc: "Votes, committees & sponsorships" },
                { icon: Globe, label: "State Sources", desc: "WARN notices & state registries" },
              ].map((item) => (
                <motion.div key={item.label} variants={stagger.item} className="flex items-start gap-3.5 p-4 rounded-xl bg-primary-foreground/[0.04] border border-primary-foreground/[0.06]">
                  <div className="w-10 h-10 rounded-lg bg-primary-foreground/[0.06] flex items-center justify-center shrink-0">
                    <item.icon className="w-4.5 h-4.5 text-primary-foreground/60" />
                  </div>
                  <div>
                    <div className="font-semibold text-primary-foreground/90 text-sm">{item.label}</div>
                    <p className="text-xs text-primary-foreground/40">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── 6. FINAL CTA — different from hero (sign-up / alerts focused) ─── */}
      <section className="section-padding bg-gradient-to-b from-background to-civic-gold-light/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-civic-gold/10 border border-civic-gold/20 mb-6">
              <Bell className="w-6 h-6 text-civic-gold" />
            </div>
            <h2 className="text-headline text-foreground mb-4 font-display">
              Stay ahead of employer signals.
            </h2>
            <p className="text-body-lg text-muted-foreground mb-8">
              Create your free account to track employers, get weekly intelligence briefs, and receive alerts when new signals are detected.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/login")} size="lg" className="h-14 px-10 rounded-xl text-base font-semibold shadow-elevated gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
              <Button onClick={() => navigate("/browse")} size="lg" variant="outline" className="h-14 px-10 rounded-xl text-base font-semibold gap-2">
                Browse Employers
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="py-10 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-xs text-muted-foreground">
            {[
              { icon: Lock, label: "Evidence-Based Signals" },
              { icon: BarChart3, label: "Confidence Scoring" },
              { icon: BookOpen, label: "Open Methodology" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-2">
                <item.icon className="w-3.5 h-3.5 text-primary/60" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
