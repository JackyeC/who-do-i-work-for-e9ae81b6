import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Network, Shield, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FirstLoginOnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to Who Do I Work For?",
    body: "This platform traces the political spending, influence networks, and government benefits connected to the companies you work for — or are thinking of working for.",
    detail: "We surface public-record signals from FEC filings, lobbying disclosures, government contracts, and more so you can make informed career decisions.",
  },
  {
    id: "search",
    icon: Search,
    title: "Search your first company",
    body: "Start by looking up a company you're curious about — your current employer, a company you're interviewing with, or any organization you want to understand better.",
    detail: null,
  },
  {
    id: "features",
    icon: Network,
    title: "Powerful intelligence at your fingertips",
    body: null,
    detail: null,
    features: [
      {
        icon: Network,
        name: "Influence Pipeline",
        desc: "Trace how political dollars flow from a company through PACs, lobbyists, and committees to policy outcomes and government contracts.",
      },
      {
        icon: Shield,
        name: "Values Check",
        desc: "Review a company's political and policy footprint across issues like labor rights, climate, civil rights, and more — before you apply.",
      },
    ],
  },
];

export function FirstLoginOnboarding({ onComplete }: FirstLoginOnboardingProps) {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleComplete = async (searchQuery?: string) => {
    setSaving(true);
    try {
      if (user) {
        await (supabase as any)
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", user.id);
      }
    } catch (err) {
      console.error("Failed to save onboarding status:", err);
    }
    onComplete();
    if (searchQuery?.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    setSaving(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleComplete(query);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="p-8"
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <current.icon className="w-6 h-6 text-primary" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground mb-3 font-display">
              {current.title}
            </h2>

            {/* Body */}
            {current.body && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {current.body}
              </p>
            )}

            {/* Detail */}
            {current.detail && (
              <p className="text-xs text-muted-foreground/70 leading-relaxed mb-6">
                {current.detail}
              </p>
            )}

            {/* Search step */}
            {current.id === "search" && (
              <form onSubmit={handleSearchSubmit} className="mt-4 mb-2">
                <div className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Amazon, Google, JPMorgan..."
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit" size="default" disabled={!query.trim() || saving}>
                    <Search className="w-4 h-4 mr-1.5" />
                    Search
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground/50 mt-2">
                  You can always search more companies later.
                </p>
              </form>
            )}

            {/* Features step */}
            {current.features && (
              <div className="space-y-4 mt-4 mb-2">
                {current.features.map((f) => (
                  <div key={f.name} className="flex gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <f.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="px-8 pb-6 flex items-center justify-between">
          <div>
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {current.id !== "search" && (
              <>
                {!isLast ? (
                  <Button onClick={() => setStep(step + 1)} className="gap-1.5">
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button onClick={() => handleComplete()} disabled={saving} className="gap-1.5">
                    Get Started
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </>
            )}
            {current.id === "search" && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step + 1)}>
                Skip for now
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 pb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === step ? "bg-primary" : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
