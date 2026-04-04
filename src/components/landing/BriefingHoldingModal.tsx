import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePersona, PERSONA_NAMES, type PersonaId } from "@/hooks/use-persona";

interface BriefingHoldingModalProps {
  open: boolean;
  onClose: () => void;
}

const DNA_LABELS: Record<string, string> = {
  job_seeker: "Architect",
  career_changer: "Navigator",
  recruiter: "Scout",
  researcher: "Pattern Hunter",
  executive: "Reckoner",
  journalist: "Auditor",
  investor: "Signal Reader",
  sales: "Operator",
  marketing: "Brand Auditor",
};

export function BriefingHoldingModal({ open, onClose }: BriefingHoldingModalProps) {
  const { persona, personaName } = usePersona();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dnaLabel = persona ? (DNA_LABELS[persona] || personaName || "Advocate") : "Advocate";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubmitting(true);
    try {
      await supabase.from("briefing_signals").insert({
        email: email.toLowerCase().trim(),
        dna_profile: persona || "unknown",
        title: `Briefing request: ${dnaLabel}`,
        source_name: dnaLabel,
        signal_type: "briefing_dna",
      } as any);
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-card border border-border w-full max-w-[460px] p-8 relative shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="capture"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* DNA badge */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xl">♕</span>
                  <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary font-bold">
                    DIWF Intelligence
                  </span>
                </div>

                {/* Profile type pill */}
                <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 text-xs font-mono tracking-wider uppercase mb-4">
                  <span>♕</span>
                  {dnaLabel} Profile
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 font-display">
                  Your Briefing Is Coming
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Your ♕DIWF briefing — personalized to your{" "}
                  <span className="text-foreground font-medium">{dnaLabel}</span>{" "}
                  profile — is being built. Be the first to get it.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs tracking-wider uppercase font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send Me My Briefing
                      </>
                    )}
                  </button>
                </form>

                <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
                  No account needed. We'll only email you your personalized briefing.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                  className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-7 h-7 text-primary" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <h3 className="text-lg font-bold text-foreground mb-2 font-display">
                    You're on the list.
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Your <span className="text-primary font-medium">{dnaLabel}</span> briefing is being built.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We'll send it to <span className="text-foreground">{email}</span>.
                  </p>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={onClose}
                  className="mt-6 text-xs text-muted-foreground hover:text-foreground font-mono tracking-wider uppercase transition-colors"
                >
                  Continue exploring →
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
