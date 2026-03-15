import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Shield, Lock, ArrowRight, Building2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionReveal } from "./SectionReveal";
import { SignupModal } from "@/components/SignupModal";

interface MiniReport {
  name: string;
  slug: string;
  industry: string;
  civic_footprint_score: number;
  state: string;
  corporate_pac_exists: boolean;
  lobbying_spend: number | null;
}

export function MiniReportTeaser() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MiniReport | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setNotFound(false);
    setReport(null);

    const { data } = await supabase
      .from("companies")
      .select("name, slug, industry, civic_footprint_score, state, corporate_pac_exists, lobbying_spend")
      .ilike("name", `%${query.trim()}%`)
      .limit(1)
      .maybeSingle();

    if (data) {
      setReport(data as MiniReport);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const scoreColor = (score: number) =>
    score >= 70 ? "text-[hsl(var(--civic-green))]" : score >= 40 ? "text-[hsl(var(--civic-yellow))]" : "text-[hsl(var(--civic-red))]";

  return (
    <SectionReveal>
      <section className="px-6 lg:px-16 py-16 lg:py-20 max-w-[1100px] mx-auto w-full">
        <div className="text-center mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-3">Free Intelligence</div>
          <h2 className="text-2xl lg:text-[clamp(1.8rem,3.5vw,2.6rem)] mb-3 text-foreground">
            Scan any employer. Free.
          </h2>
          <p className="text-muted-foreground text-body-lg max-w-[500px] mx-auto">
            Get an instant snapshot — civic score, PAC status, and lobbying data. Sign up to see the full chain.
          </p>
        </div>

        <div className="max-w-md mx-auto mb-6">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter a company name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading} className="font-mono text-xs tracking-wider uppercase">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan"}
            </Button>
          </form>
        </div>

        <AnimatePresence mode="wait">
          {report && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-card border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="font-serif text-lg text-foreground">{report.name}</span>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{report.industry} · {report.state}</span>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold font-data ${scoreColor(report.civic_footprint_score)}`}>
                      {report.civic_footprint_score}
                    </div>
                    <div className="font-mono text-[9px] uppercase text-muted-foreground">Civic Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-border border border-border mb-4">
                  <div className="bg-card p-3">
                    <div className="font-mono text-[10px] uppercase text-muted-foreground mb-0.5">Corporate PAC</div>
                    <div className={`text-sm font-semibold ${report.corporate_pac_exists ? "text-[hsl(var(--civic-red))]" : "text-[hsl(var(--civic-green))]"}`}>
                      {report.corporate_pac_exists ? "Active" : "None Detected"}
                    </div>
                  </div>
                  <div className="bg-card p-3">
                    <div className="font-mono text-[10px] uppercase text-muted-foreground mb-0.5">Lobbying Spend</div>
                    <div className="text-sm font-semibold text-foreground">
                      {report.lobbying_spend ? `$${(report.lobbying_spend / 1000000).toFixed(1)}M` : "Not reported"}
                    </div>
                  </div>
                </div>

                {/* Locked section */}
                <div className="relative">
                  <div className="bg-muted/50 border border-border p-4 blur-[2px] select-none pointer-events-none">
                    <div className="text-sm text-muted-foreground">Connection Chain: 14 influence links detected...</div>
                    <div className="text-sm text-muted-foreground mt-1">Board Intelligence: 8 members, 3 flagged affiliations...</div>
                    <div className="text-sm text-muted-foreground mt-1">Worker Sentiment: Mixed signals from 4 sources...</div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/60">
                    <Lock className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground mb-3">Sign up to see the full intelligence report</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setShowSignup(true)}
                        className="gap-1.5 font-mono text-xs tracking-wider uppercase"
                      >
                        Get Full Report <ArrowRight className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/company/${report.slug}`)}
                        className="font-mono text-xs tracking-wider uppercase"
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <SignupModal
                open={showSignup}
                onOpenChange={setShowSignup}
                headline={`Unlock the full ${report.name} report`}
                subtext="No credit card required. Your first report is free."
              />
            </motion.div>
          )}

          {notFound && (
            <motion.div
              key="notfound"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground mb-3">
                We don't have that company yet. Want us to scan it?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/check?tab=company")}
                className="font-mono text-xs tracking-wider uppercase gap-1.5"
              >
                Request a Scan <ArrowRight className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </SectionReveal>
  );
}
