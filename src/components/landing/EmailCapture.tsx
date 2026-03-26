import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Check } from "lucide-react";
import { SectionReveal } from "./SectionReveal";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { containerRef, getToken, resetToken } = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email.");
      setStatus("error");
      return;
    }
    setStatus("loading");

    const token = await getToken();
    if (!token) {
      setErrorMsg("Bot verification failed. Please try again.");
      setStatus("error");
      resetToken();
      return;
    }

    const verified = await verifyTurnstileToken(token);
    if (!verified) {
      setErrorMsg("Verification failed. Please try again.");
      setStatus("error");
      resetToken();
      return;
    }

    const { error } = await supabase.from("email_signups").insert({ email: trimmed });
    if (error) {
      if (error.code === "23505") {
        setStatus("success");
      } else {
        setErrorMsg("Something went wrong. Try again.");
        setStatus("error");
      }
    } else {
      setStatus("success");
    }
    resetToken();
  };

  return (
    <SectionReveal>
      <section className="px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[640px] mx-auto">
          <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-3 text-foreground">
                Get weekly intelligence drops.
              </h2>
              <p className="text-sm lg:text-base text-muted-foreground mb-8 max-w-[460px] mx-auto leading-relaxed">
                New signals, trending companies, and career intelligence — delivered once a week. No spam. Unsubscribe anytime.
              </p>
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2.5 text-primary font-semibold text-base"
                >
                  <Check className="w-5 h-5" /> You're in. Watch your inbox.
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="relative group max-w-[480px] mx-auto">
                  <div ref={containerRef} />
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/25 via-primary/10 to-primary/25 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-md rounded-xl" />
                  <div className="relative flex items-center bg-background/80 backdrop-blur-sm border-2 border-primary/20 focus-within:border-primary/50 transition-colors rounded-xl">
                    <Mail className="w-4.5 h-4.5 text-muted-foreground ml-4 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                      placeholder="you@company.com"
                      className="flex-1 bg-transparent px-3 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-sans"
                      disabled={status === "loading"}
                    />
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="mr-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {status === "loading" ? "..." : <>Subscribe <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                  {status === "error" && (
                    <p className="text-destructive text-xs mt-3 font-mono">{errorMsg}</p>
                  )}
                </form>
              )}
              <p className="text-xs text-muted-foreground/60 mt-5">
                Join career researchers getting weekly intelligence. Free forever.
              </p>
            </div>
          </div>
        </div>
      </section>
    </SectionReveal>
  );
}
