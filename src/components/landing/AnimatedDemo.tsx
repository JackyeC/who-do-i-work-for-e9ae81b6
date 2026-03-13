import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { SectionReveal } from "./SectionReveal";

const steps = [
  {
    label: "Search",
    caption: "Type any employer name",
    content: (
      <div className="space-y-3">
        <div className="flex items-center bg-background border border-border px-3 py-2.5">
          <span className="text-muted-foreground/40 text-sm mr-2">🔍</span>
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: "auto" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="text-sm text-foreground overflow-hidden whitespace-nowrap"
          >
            Amazon
          </motion.span>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-0.5 h-4 bg-primary ml-0.5"
          />
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
          850+ companies in database
        </div>
      </div>
    ),
  },
  {
    label: "Scan",
    caption: "Intelligence scan runs instantly",
    content: (
      <div className="space-y-2">
        {[
          { label: "FEC Filings", delay: 0 },
          { label: "Lobbying Disclosures", delay: 0.2 },
          { label: "Federal Contracts", delay: 0.4 },
          { label: "SEC Filings", delay: 0.6 },
          { label: "BLS Wage Data", delay: 0.8 },
        ].map((src) => (
          <motion.div
            key={src.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: src.delay, duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: src.delay + 0.3, duration: 0.2 }}
              className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </motion.div>
            <span className="text-xs text-muted-foreground font-mono">{src.label}</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: src.delay + 0.5 }}
              className="text-[9px] text-primary font-mono ml-auto"
            >
              ✓ matched
            </motion.span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    label: "Report",
    caption: "Full employer intelligence, sourced",
    content: (
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="font-serif text-sm text-foreground">Amazon.com, Inc.</span>
          <span className="font-mono text-[9px] text-primary">Score: 5.8 / 10</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: "PAC Spending", val: "$2.1M", color: "text-destructive" },
            { label: "Lobbying", val: "$21.4M", color: "text-destructive" },
            { label: "Fed. Contracts", val: "$10.2B", color: "text-primary" },
            { label: "Workforce", val: "1.5M+", color: "text-muted-foreground" },
          ].map((m) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-background p-2 border border-border"
            >
              <div className="font-mono text-[8px] uppercase text-muted-foreground/70">{m.label}</div>
              <div className={`font-data text-sm font-bold ${m.color}`}>{m.val}</div>
            </motion.div>
          ))}
        </div>
        <div className="text-[10px] text-muted-foreground/60 font-mono">
          3 red flags · 2 caution signals · 1 positive signal
        </div>
      </div>
    ),
  },
];

export function AnimatedDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <SectionReveal>
      <section ref={ref} className="px-6 lg:px-16 py-16 lg:py-20 max-w-[1100px] mx-auto w-full">
        <div className="text-center mb-10">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-3">
            How It Works
          </div>
          <h2 className="text-xl lg:text-2xl text-foreground">
            Three steps. Full transparency.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-12 items-center">
          {/* Step indicators */}
          <div className="flex flex-col gap-1">
            {steps.map((step, i) => (
              <button
                key={step.label}
                onClick={() => setActiveStep(i)}
                className={`text-left p-4 border transition-all duration-300 ${
                  activeStep === i
                    ? "border-primary/30 bg-card"
                    : "border-transparent hover:bg-card/50"
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`font-mono text-[10px] font-bold w-5 h-5 flex items-center justify-center transition-colors ${
                      activeStep === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`font-mono text-[11px] tracking-wider uppercase transition-colors ${
                    activeStep === i ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground pl-8">{step.caption}</p>
              </button>
            ))}
          </div>

          {/* Demo preview */}
          <div className="bg-card border border-border p-6 min-h-[220px] relative">
            <div className="absolute -top-2.5 left-4 bg-background px-2 font-mono text-micro uppercase text-primary tracking-widest">
              Live Preview
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {steps[activeStep].content}
              </motion.div>
            </AnimatePresence>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border">
              <motion.div
                key={activeStep}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3.5, ease: "linear" }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        </div>
      </section>
    </SectionReveal>
  );
}
