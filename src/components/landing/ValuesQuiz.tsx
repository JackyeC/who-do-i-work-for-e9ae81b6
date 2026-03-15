import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SectionReveal } from "./SectionReveal";

const QUIZ_VALUES = [
  { key: "pay_equity", label: "Pay Equity", emoji: "💰" },
  { key: "dei_equity", label: "Diversity & Inclusion", emoji: "🤝" },
  { key: "climate_policy", label: "Climate Action", emoji: "🌍" },
  { key: "ai_ethics", label: "AI Ethics", emoji: "🤖" },
  { key: "political_donations", label: "Political Donations", emoji: "🏛️" },
  { key: "union_labor", label: "Union & Labor Rights", emoji: "✊" },
  { key: "data_privacy", label: "Data Privacy", emoji: "🔒" },
  { key: "worker_safety", label: "Worker Safety", emoji: "🦺" },
  { key: "lgbtq_rights", label: "LGBTQ+ Rights", emoji: "🏳️‍🌈" },
  { key: "anti_corruption", label: "Anti-Corruption", emoji: "⚖️" },
];

export function ValuesQuiz() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const navigate = useNavigate();

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <SectionReveal>
      <section className="px-6 lg:px-16 py-16 lg:py-20 max-w-[1100px] mx-auto w-full">
        <div className="text-center mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-3">Career DNA</div>
          <h2 className="text-2xl lg:text-[clamp(1.8rem,3.5vw,2.6rem)] mb-3 text-foreground">
            What matters to you?
          </h2>
          <p className="text-muted-foreground text-body-lg max-w-[500px] mx-auto">
            Pick the values you care about. We'll show you how employers stack up — with receipts.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex flex-wrap justify-center gap-2.5 max-w-[700px] mx-auto mb-8">
                {QUIZ_VALUES.map((v) => {
                  const isSelected = selected.has(v.key);
                  return (
                    <button
                      key={v.key}
                      onClick={() => toggle(v.key)}
                      className={`flex items-center gap-2 px-4 py-2.5 border text-sm transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <span>{v.emoji}</span>
                      {v.label}
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>

              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <Button
                    onClick={() => setShowResult(true)}
                    className="gap-1.5 font-mono text-xs tracking-wider uppercase"
                  >
                    See how employers measure up
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[500px] mx-auto"
            >
              <div className="bg-card border border-border p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 font-display">
                  Your Career DNA: {selected.size} values loaded
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  We track {selected.size * 3}+ data points across your values using FEC filings, OSHA records, EEOC data, and more.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 my-4">
                  {Array.from(selected).map(key => {
                    const v = QUIZ_VALUES.find(q => q.key === key);
                    return v ? (
                      <span key={key} className="text-xs bg-primary/10 text-primary px-2.5 py-1 font-mono">
                        {v.emoji} {v.label}
                      </span>
                    ) : null;
                  })}
                </div>
                <p className="text-sm text-foreground font-medium mb-6">
                  Create a free account to see how every company aligns with what matters to you.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => navigate("/login")}
                    className="font-mono text-xs tracking-wider uppercase gap-1.5"
                  >
                    Get My Intelligence
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowResult(false); setSelected(new Set()); }}
                    className="font-mono text-xs tracking-wider uppercase"
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </SectionReveal>
  );
}
