import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, Building2, FileCheck, Map, ArrowRight, Shield, Bell,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const Index = () => {
  const [query, setQuery] = useState("");
  const [companyCount, setCompanyCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("companies").select("*", { count: "exact", head: true })
      .then(({ count }) => setCompanyCount(count || 0));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const actions = [
    {
      icon: Building2,
      emoji: "🔍",
      title: "Look up any employer",
      desc: "See what they spend on, who they support, and what workers say.",
      color: "from-primary to-primary/80",
      textColor: "text-primary-foreground",
      buttonLabel: "Search a Company",
      onClick: () => navigate("/check?tab=company"),
    },
    {
      icon: FileCheck,
      emoji: "📋",
      title: "Check a job offer",
      desc: "Upload an offer letter and see if the pay and terms are fair.",
      color: "from-civic-gold to-civic-gold/80",
      textColor: "text-primary-foreground",
      buttonLabel: "Check My Offer",
      onClick: () => navigate("/check?tab=offer"),
    },
    {
      icon: Map,
      emoji: "🗺️",
      title: "Plan your career",
      desc: "Find out what jobs fit your values and where to grow next.",
      color: "from-civic-green to-civic-green/80",
      textColor: "text-primary-foreground",
      buttonLabel: "Explore Careers",
      onClick: () => navigate("/career-map"),
    },
  ];

  const steps = [
    { num: "1", label: "Type a company name" },
    { num: "2", label: "We check public records" },
    { num: "3", label: "You see what matters" },
  ];

  return (
    <div className="flex flex-col">

      {/* ─── HERO: Ultra-simple ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-civic-gold-light/40 to-background pointer-events-none" />
        <div className="container mx-auto px-4 pt-20 sm:pt-28 pb-12 sm:pb-20 relative">
          <motion.div initial="hidden" animate="show" className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm text-foreground text-sm px-5 py-2 rounded-full mb-6 border border-border/40">
              <div className="w-2 h-2 rounded-full bg-civic-green animate-pulse" />
              {companyCount.toLocaleString()} companies tracked
            </motion.div>

            <motion.h1
              variants={fadeUp} custom={1}
              className="text-foreground mb-4 font-display leading-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}
            >
              Know who you're<br />
              <span className="text-civic-gold">really working for.</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Search any company. See where their money goes, how they treat workers, and what they actually stand for.
            </motion.p>

            <motion.form variants={fadeUp} custom={3} onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative flex flex-col sm:flex-row gap-3 bg-card rounded-2xl p-2.5 shadow-lg border border-border/40">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Try 'Amazon', 'Google', or your employer..."
                    className="pl-12 h-13 text-base border-0 shadow-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40"
                  />
                </div>
                <Button type="submit" size="lg" className="h-13 px-8 rounded-xl text-base font-semibold">
                  Search
                </Button>
              </div>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* ─── WHAT YOU CAN DO: 3 big clickable cards ─── */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }} className="max-w-5xl mx-auto">
            <motion.h2 variants={fadeUp} custom={0} className="text-center text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">
              What do you want to know?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-center text-muted-foreground mb-12 text-base">
              Pick one to get started. It only takes a few seconds.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {actions.map((action, i) => (
                <motion.button
                  key={action.title}
                  variants={fadeUp}
                  custom={i + 2}
                  onClick={action.onClick}
                  className={`group bg-gradient-to-br ${action.color} rounded-2xl p-8 text-left shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col min-h-[220px]`}
                >
                  <span className="text-4xl mb-4 block">{action.emoji}</span>
                  <h3 className={`text-xl font-bold ${action.textColor} mb-2 font-display`}>
                    {action.title}
                  </h3>
                  <p className={`text-sm ${action.textColor}/70 leading-relaxed flex-1`}>
                    {action.desc}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 mt-4 text-sm font-semibold ${action.textColor}/90 group-hover:gap-2.5 transition-all`}>
                    {action.buttonLabel}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS: 3 simple steps, horizontal ─── */}
      <section className="py-14 bg-muted/40 border-y border-border/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.h2 variants={fadeUp} custom={0} className="text-center text-xl font-display font-bold text-foreground mb-10">
              How it works
            </motion.h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {steps.map((step, i) => (
                <motion.div key={step.num} variants={fadeUp} custom={i + 1} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
                    {step.num}
                  </div>
                  <span className="text-sm font-medium text-foreground">{step.label}</span>
                  {i < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 hidden sm:block ml-2" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST: One clean line ─── */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-civic-gold" />
              <span className="font-semibold text-foreground text-sm">All data comes from public records</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              FEC filings, lobbying disclosures, government contracts, SEC reports, and state workforce records. 
              Every signal links back to its source.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA: Simple sign-up ─── */}
      <section className="py-16 bg-gradient-to-b from-background to-civic-gold-light/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mx-auto text-center"
          >
            <Bell className="w-8 h-8 text-civic-gold mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
              Get alerts when things change.
            </h2>
            <p className="text-muted-foreground mb-8">
              Free account. Track companies. Get notified.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/login")} size="lg" className="h-13 px-8 rounded-xl text-base font-semibold gap-2">
                Sign Up Free <ArrowRight className="w-4 h-4" />
              </Button>
              <Button onClick={() => navigate("/browse")} size="lg" variant="outline" className="h-13 px-8 rounded-xl text-base font-semibold">
                Browse Companies
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      
    </div>
  );
};

export default Index;
