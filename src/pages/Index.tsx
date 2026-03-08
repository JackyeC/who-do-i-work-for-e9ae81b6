import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Shield, BookOpen, Building2, ClipboardCheck, Bot, DollarSign, Users, BarChart3, Heart, ArrowRight, Eye, Bell, CheckCircle2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { supabase } from "@/integrations/supabase/client";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } } },
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
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.04),transparent_60%)] pointer-events-none" />
        <div className="container mx-auto px-4 pt-20 sm:pt-28 pb-20 sm:pb-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="inline-flex items-center gap-2 bg-primary/8 text-primary text-caption px-4 py-1.5 rounded-full mb-8 border border-primary/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Intelligence-grade employer research
            </motion.div>
            <h1 className="text-display text-foreground mb-6 text-balance">
              Run the{" "}
              <span className="text-primary">Offer Check</span>{" "}
              before you say yes
            </h1>
            <p className="text-body-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Review public signals about any employer — hiring technology, worker benefits, 
              compensation transparency, and political influence — so you can decide with your eyes open.
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3 px-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any company..."
                  className="pl-11 h-12 text-base shadow-elegant rounded-xl border-border/80 focus:shadow-elevated"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8 shadow-sm">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Run Offer Check
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-caption text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {companyCount.toLocaleString()} companies tracked
              </span>
              <span className="hidden sm:inline text-border/80">|</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                FEC, USASpending &amp; public filings
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What the Offer Check Covers */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-headline text-foreground mb-3">What the Offer Check Covers</h2>
            <p className="text-body text-muted-foreground max-w-lg mx-auto">
              Every signal is sourced, confidence-rated, and reported without judgment.
            </p>
          </div>
          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
          >
            {[
              { icon: DollarSign, label: "Influence Signals", desc: "PAC spending, lobbying, executive donations, and political affiliations" },
              { icon: Bot, label: "Hiring Technology & AI", desc: "Automated screening tools, AI vendors, and bias audit status" },
              { icon: Heart, label: "Worker Benefits", desc: "Healthcare, parental leave, retirement, and union relationships" },
              { icon: BarChart3, label: "Compensation Transparency", desc: "Salary range disclosures, pay equity signals, and reporting practices" },
              { icon: Users, label: "Worker Sentiment", desc: "Aggregated employee satisfaction signals from public review sites" },
              { icon: Shield, label: "Public Statements vs Observed", desc: "Where marketing language and actual practices diverge" },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={stagger.item}
                className="bg-card rounded-xl border border-border/60 p-5 hover:shadow-elevated hover:border-primary/15 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/6 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-semibold text-foreground text-body">{item.label}</div>
                </div>
                <p className="text-caption text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-headline text-foreground mb-3">How It Works</h2>
            <p className="text-body text-muted-foreground">Three steps to employer intelligence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Search, title: "Search Any Company", desc: "Type a company name. If it's not in our database, we'll add it and start scanning automatically.", step: "01" },
              { icon: ClipboardCheck, title: "Review the Offer Check", desc: "Get a structured summary of detected signals across hiring, benefits, transparency, and influence.", step: "02" },
              { icon: Shield, title: "Decide With Your Eyes Open", desc: "All signals include sources and confidence ratings. Interpretation is always yours.", step: "03" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="text-center relative"
              >
                <div className="text-6xl font-bold text-primary/[0.04] absolute top-0 left-1/2 -translate-x-1/2 select-none pointer-events-none" style={{ fontFamily: "'Source Serif 4', serif" }}>
                  {item.step}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-5 relative z-10 border border-primary/10">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-title text-lg">{item.title}</h3>
                <p className="text-body text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-headline text-foreground">Recently Scanned</h2>
              <p className="text-body text-muted-foreground mt-1">Latest company profiles with detected signals</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/browse")} className="hidden sm:flex gap-1.5">
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {featuredCompanies.map((company) => (
              <motion.div
                key={company.id}
                variants={stagger.item}
                className="bg-card rounded-xl border border-border/60 p-5 cursor-pointer hover:shadow-elevated hover:border-primary/15 transition-all duration-200 group"
                onClick={() => navigate(`/company/${company.slug}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate text-body">
                      {company.name}
                    </h3>
                    <p className="text-caption text-muted-foreground mt-0.5">{company.industry} · {company.state}</p>
                  </div>
                  <CivicFootprintBadge score={company.civic_footprint_score} size="sm" />
                </div>
                <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-border/60">
                  <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="text-caption text-primary font-medium group-hover:underline">Run Offer Check →</span>
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

      {/* Key Features */}
      <section className="section-padding-sm bg-muted/40 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            {[
              { icon: Eye, title: "Watch Companies", desc: "Follow companies and get notified when new signals are detected." },
              { icon: Bell, title: "Signal Alerts", desc: "Real-time alerts when hiring, pay, or influence signals change." },
              { icon: BarChart3, title: "Values Job Match", desc: "Find jobs at companies that align with your values." },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-4 border border-primary/10">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-caption text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground section-padding-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center max-w-3xl mx-auto">
            {[
              { value: companyCount.toLocaleString(), label: "Companies Scanned" },
              { value: "7", label: "Signal Categories" },
              { value: "2026", label: "Current Data Cycle" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold mb-1.5" style={{ fontFamily: "'Source Serif 4', serif" }}>{stat.value}</div>
                <div className="text-primary-foreground/60 text-caption">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology CTA */}
      <section className="section-padding text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-headline text-foreground mb-4">Transparent About Transparency</h2>
            <p className="text-body text-muted-foreground mb-8 leading-relaxed">
              Every signal is labeled by source, detection method, and confidence level. We publish our methodology so you can verify our work.
            </p>
            <Button variant="outline" size="lg" onClick={() => navigate("/methodology")} className="gap-2">
              <BookOpen className="w-4 h-4" />
              Read Our Methodology
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
