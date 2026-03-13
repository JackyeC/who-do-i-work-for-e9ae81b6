import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Check } from "lucide-react";
import { SectionReveal } from "./SectionReveal";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    const { error } = await supabase.from("email_signups").insert({ email: trimmed });
    if (error) {
      if (error.code === "23505") {
        setStatus("success"); // already signed up
      } else {
        setErrorMsg("Something went wrong. Try again.");
        setStatus("error");
      }
    } else {
      setStatus("success");
    }
  };

  return (
    <SectionReveal>
      <section className="px-6 lg:px-16 py-16 lg:py-20">
        <div className="max-w-[600px] mx-auto text-center">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-3">Stay Informed</div>
          <h2 className="text-xl lg:text-2xl mb-3 text-foreground">
            Get weekly employer intelligence drops.
          </h2>
          <p className="text-[13px] text-muted-foreground mb-8 max-w-[440px] mx-auto">
            New signals, trending companies, and career intelligence — delivered once a week. No spam. Unsubscribe anytime.
          </p>
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-primary font-mono text-sm"
            >
              <Check className="w-4 h-4" /> You're in. Watch your inbox.
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="relative group max-w-[480px] mx-auto">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
              <div className="relative flex items-center bg-card border border-border focus-within:border-primary/40 transition-colors">
                <Mail className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                  placeholder="you@company.com"
                  className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-sans"
                  disabled={status === "loading"}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="mr-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-[10px] tracking-wider uppercase font-semibold hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {status === "loading" ? "..." : <>Subscribe <ArrowRight className="w-3 h-3" /></>}
                </button>
              </div>
              {status === "error" && (
                <p className="text-destructive text-xs mt-2 font-mono">{errorMsg}</p>
              )}
            </form>
          )}
        </div>
      </section>
    </SectionReveal>
  );
}
