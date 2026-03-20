import { useNavigate } from "react-router-dom";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search, Shield, Eye, Zap, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { usePageSEO } from "@/hooks/use-page-seo";

export default function Welcome() {
  const { isLoaded } = useClerkAuth();
  const navigate = useNavigate();

  usePageSEO({
    title: "Who Do I Work For? — Know Exactly Who You Work For",
    description: "Company intelligence for candidates. Check any employer's integrity before you apply, interview, or accept.",
    path: "/welcome",
  });

  if (!isLoaded) return null;

  const capabilities = [
    { icon: Search, text: "Run integrity checks on any employer before you apply" },
    { icon: Eye, text: "See what companies say vs. what they actually do" },
    { icon: Shield, text: "Spot risk signals most candidates never see" },
    { icon: BarChart3, text: "Get a dossier with governance, lobbying, and culture data" },
    { icon: Zap, text: "Apply only to companies that pass your values filter" },
  ];

  const stats = [
    { value: "2,400+", label: "Companies Audited" },
    { value: "12", label: "Signal Categories" },
    { value: "50+", label: "Public Data Sources" },
  ];

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="px-6 lg:px-16 pt-20 pb-16 max-w-[960px] mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Badge variant="secondary" className="mb-5 text-xs font-mono uppercase tracking-wider">
            Company Intelligence for Candidates
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }}
          className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground leading-[1.1] mb-6"
          style={{ fontWeight: 800, letterSpacing: "-0.5px" }}
        >
          You deserve to know exactly{" "}
          <span className="text-primary">who you work for.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Before you apply, interview, or accept — check the receipts. WDIWF audits employers using public data so you can make career decisions based on evidence, not marketing.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button size="lg" onClick={() => navigate("/join")} className="gap-2 px-8 py-6 text-base">
            Get Early Access <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/browse")} className="gap-2 px-8 py-6 text-base">
            <Search className="w-4 h-4" /> Browse Companies
          </Button>
        </motion.div>
      </section>

      {/* Stats row */}
      <section className="px-6 lg:px-16 pb-16 max-w-[800px] mx-auto">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }}
          className="grid grid-cols-3 gap-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center py-5 rounded-xl border border-border/40 bg-card">
              <p className="text-2xl font-bold font-mono text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* What you get */}
      <section className="px-6 lg:px-16 pb-20 max-w-[720px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="font-serif text-xl sm:text-2xl text-foreground text-center mb-8" style={{ fontWeight: 700 }}>
            What WDIWF gives you
          </h2>
          <div className="space-y-4">
            {capabilities.map((item) => (
              <div key={item.text} className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card">
                <item.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 lg:px-16 pb-24 max-w-[640px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-8"
        >
          <h3 className="font-serif text-lg font-bold text-foreground mb-3">Stop guessing. Start checking.</h3>
          <p className="text-sm text-muted-foreground mb-6">Join thousands of candidates who refuse to apply blind.</p>
          <Button onClick={() => navigate("/join")} className="gap-2">
            Get Early Access <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </section>
    </main>
  );
}
