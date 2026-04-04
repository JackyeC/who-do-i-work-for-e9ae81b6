import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowLeft,
  FileSearch,
  Shield,
  Briefcase,
  Heart,
  Sparkles,
  CheckCircle2,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageSEO } from "@/hooks/use-page-seo";

const WELCOME_SEEN_KEY = "wdiwf-welcome-seen";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip: () => void;
}

/* ── Step 1: Hook ── */
function StepWelcome({ onNext, onSkip }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
      >
        <Sparkles className="w-8 h-8 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight mb-4"
      >
        Know who you&apos;re<br />
        <span className="text-primary">really</span> working for.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-[44ch] mb-8"
      >
        We pull the public record on any employer — politics, enforcement history, pay practices, AI usage — so you can make career moves on facts, not vibes.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <Button size="lg" onClick={onNext} className="gap-2 px-8">
          Show me how <ArrowRight className="w-4 h-4" />
        </Button>
        <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Skip intro →
        </button>
      </motion.div>
    </div>
  );
}

/* ── Step 2: What we do ── */
function StepWhatWeDo({ onNext, onBack, onSkip }: StepProps) {
  const features = [
    {
      icon: <FileSearch className="w-5 h-5" />,
      title: "Employer Dossiers",
      desc: "Forensic profiles from FEC, SEC, OSHA, NLRB, and more.",
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      title: "Aligned Jobs",
      desc: "Roles matched to your values, skills, and priorities.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Offer & Interview Intel",
      desc: "Pre-negotiation clarity on what a company actually does.",
    },
  ];

  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto px-4">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-3"
      >
        What you get
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-foreground mb-8"
      >
        Facts. Not press releases.
      </motion.h2>

      <div className="space-y-4 w-full mb-8">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.1 }}
            className="flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-card text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              {f.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Button>
        <Button onClick={onNext} className="gap-2">
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ── Step 3: Pick your path ── */
function StepPickPath({ onSkip }: StepProps & { onNavigate: (path: string) => void }) {
  const navigate = useNavigate();

  const paths = [
    {
      icon: <Search className="w-5 h-5" />,
      label: "Check an employer",
      desc: "Search any company and see their full dossier.",
      path: "/check?tab=company",
      color: "text-primary",
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: "Set my values",
      desc: "Tell us what matters and we'll match accordingly.",
      path: "/login",
      color: "text-[hsl(var(--civic-green))]",
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      label: "Browse jobs",
      desc: "See aligned roles from employers we've vetted.",
      path: "/jobs-feed",
      color: "text-[hsl(var(--civic-gold))]",
    },
  ];

  const markSeen = () => {
    try { localStorage.setItem(WELCOME_SEEN_KEY, "true"); } catch {}
  };

  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"
      >
        <CheckCircle2 className="w-6 h-6 text-primary" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-foreground mb-2"
      >
        Where do you want to start?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted-foreground mb-8"
      >
        Pick one. You can always come back to the others.
      </motion.p>

      <div className="space-y-3 w-full mb-8">
        {paths.map((p, i) => (
          <motion.button
            key={p.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.1 }}
            onClick={() => {
              markSeen();
              navigate(p.path);
            }}
            className="flex items-center gap-4 w-full p-4 rounded-xl border border-border/40 bg-card hover:border-primary/40 hover:bg-accent/30 transition-all text-left group"
          >
            <div className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 ${p.color} group-hover:scale-105 transition-transform`}>
              {p.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{p.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </motion.button>
        ))}
      </div>

      <button
        onClick={() => { markSeen(); onSkip(); }}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Just take me to the homepage →
      </button>
    </div>
  );
}

/* ── Main Welcome Page ── */
export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  usePageSEO({
    title: "Welcome — Who Do I Work For?",
    description: "Get started with career intelligence. Check any employer, set your values, and find aligned roles — all grounded in the public record.",
    path: "/welcome",
  });

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // If they've already seen the welcome, redirect to home
  useEffect(() => {
    try {
      if (localStorage.getItem(WELCOME_SEEN_KEY) === "true") {
        navigate("/", { replace: true });
      }
    } catch {}
  }, [navigate]);

  const goHome = () => {
    try { localStorage.setItem(WELCOME_SEEN_KEY, "true"); } catch {}
    navigate("/");
  };

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted/30 z-50">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center py-16 sm:py-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {step === 0 && (
              <StepWelcome
                onNext={() => setStep(1)}
                onSkip={goHome}
              />
            )}
            {step === 1 && (
              <StepWhatWeDo
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
                onSkip={goHome}
              />
            )}
            {step === 2 && (
              <StepPickPath
                onNext={goHome}
                onBack={() => setStep(1)}
                onSkip={goHome}
                onNavigate={(path) => navigate(path)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step dots */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-2 z-50">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === step ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
