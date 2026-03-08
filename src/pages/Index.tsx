import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Shield, BookOpen, Building2, ClipboardCheck, Bot, DollarSign, Users, BarChart3, Heart, ArrowRight, Eye, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { supabase } from "@/integrations/supabase/client";

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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06),transparent_60%)]" />
        <div className="container mx-auto px-4 pt-16 sm:pt-24 pb-16 sm:pb-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Know before you go.
            </motion.div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Run the{" "}
              <span className="text-primary relative">
                Offer Check
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5.5C47 2 153 2 199 5.5" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
                </svg>
              </span>{" "}
              before you say yes
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              Review public signals about any employer — hiring technology, worker benefits, 
              compensation transparency, and political influence — so you can decide with your eyes open.
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2 px-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any company..."
                  className="pl-10 h-12 text-base shadow-sm"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6 shadow-sm">
                <ClipboardCheck className="w-4 h-4 mr-2 sm:mr-1.5" />
                Run Offer Check
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {companyCount} companies
              </span>
              <span className="hidden sm:inline text-border">·</span>
              <span>FEC, USASpending &amp; public filings</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What the Offer Check Covers */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">What the Offer Check Covers</h2>
        <p className="text-muted-foreground text-center mb-8 sm:mb-10 max-w-xl mx-auto text-sm sm:text-base">
          Every signal is sourced, confidence-rated, and reported without judgment.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {[
            { icon: DollarSign, label: "Influence Signals", desc: "PAC spending, lobbying, executive donations, and political affiliations" },
            { icon: Bot, label: "Hiring Technology & AI", desc: "Automated screening tools, AI vendors, and bias audit status" },
            { icon: Heart, label: "Worker Benefits", desc: "Healthcare, parental leave, retirement, and union relationships" },
            { icon: BarChart3, label: "Compensation Transparency", desc: "Salary range disclosures, pay equity signals, and reporting practices" },
            { icon: Users, label: "Worker Sentiment", desc: "Aggregated employee satisfaction signals from public review sites" },
            { icon: Shield, label: "Public Statements vs Observed", desc: "Where marketing language and actual practices diverge" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="bg-card rounded-lg border border-border p-4 hover:border-primary/20 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="font-medium text-foreground text-sm">{item.label}</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8 sm:mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              { icon: Search, title: "Search Any Company", desc: "Type a company name. If it's not in our database, we'll add it and start scanning automatically.", step: "01" },
              { icon: ClipboardCheck, title: "Review the Offer Check", desc: "Get a structured summary of detected signals across hiring, benefits, transparency, and influence.", step: "02" },
              { icon: Shield, title: "Decide With Your Eyes Open", desc: "All signals include sources and confidence ratings. Interpretation is always yours.", step: "03" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="text-5xl font-bold text-primary/8 absolute top-0 left-1/2 -translate-x-1/2 select-none pointer-events-none">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 relative z-10">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Recently Scanned</h2>
            <p className="text-sm text-muted-foreground mt-1">Latest company profiles with detected signals</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/browse")} className="hidden sm:flex gap-1">
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {featuredCompanies.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
              onClick={() => navigate(`/company/${company.slug}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {company.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{company.industry} · {company.state}</p>
                </div>
                <CivicFootprintBadge score={company.civic_footprint_score} size="sm" />
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                <ClipboardCheck className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium group-hover:underline">Run Offer Check →</span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="sm:hidden mt-4 text-center">
          <Button variant="outline" onClick={() => navigate("/browse")} className="gap-1">
            View All Companies
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </section>

      {/* Key Features */}
      <section className="border-t border-border py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Watch Companies</h3>
              <p className="text-xs text-muted-foreground">Follow companies and get notified when new signals are detected.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Signal Alerts</h3>
              <p className="text-xs text-muted-foreground">Real-time alerts when hiring, pay, or influence signals change.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Values Job Match</h3>
              <p className="text-xs text-muted-foreground">Find jobs at companies that align with your values.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center max-w-3xl mx-auto">
            {[
              { value: companyCount, label: "Companies Scanned" },
              { value: "7", label: "Signal Categories" },
              { value: "2026", label: "Current Data Cycle" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-primary-foreground/70 text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology CTA */}
      <section className="container mx-auto px-4 py-12 sm:py-16 text-center">
        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-3">Transparent About Transparency</h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-6 text-sm sm:text-base leading-relaxed">
          Every signal is labeled by source, detection method, and confidence level. We publish our methodology so you can verify our work.
        </p>
        <Button variant="outline" onClick={() => navigate("/methodology")} className="gap-1.5">
          <BookOpen className="w-4 h-4" />
          Read Our Methodology
        </Button>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
