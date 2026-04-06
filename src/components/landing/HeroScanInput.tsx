import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import { useScanUsage } from "@/hooks/use-scan-usage";
import { toast } from "sonner";

export function HeroScanInput() {
  const [query, setQuery] = useState("");
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const { containerRef, getToken, resetToken } = useTurnstile();
  const { hasScansRemaining, scansRemaining, recordScan, FREE_SCAN_LIMIT } = useScanUsage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!hasScansRemaining) {
      toast.error("You have used all 3 free scans. Sign up to continue.");
      navigate("/login");
      return;
    }

    setVerifying(true);
    try {
      const token = await getToken();
      if (token) {
        const verified = await verifyTurnstileToken(token);
        resetToken();
        if (!verified) {
          setVerifying(false);
          return;
        }
      }
    } catch (err) {
      console.warn("[HeroScanInput] Turnstile verification skipped:", err);
    }
    setVerifying(false);

    try {
      await recordScan("company", query.trim());
      navigate(`/offer-check?q=${encodeURIComponent(query.trim())}`);
    } catch (err) {
      console.warn("[HeroScanInput] Scan record failed, navigating anyway:", err);
      navigate(`/offer-check?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const suggestions = ["SpaceX", "Amazon", "Goldman Sachs", "Meta"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="w-full max-w-[560px] px-1"
    >
      <form onSubmit={handleSubmit} className="relative group">
        <div ref={containerRef} />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-card border border-border focus-within:border-primary/40 transition-colors rounded-md">
          <div className="flex items-center flex-1 min-w-0">
            <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any employer..."
              className="flex-1 min-w-0 bg-transparent px-3 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={verifying || !query.trim()}
            className="mx-2 mb-2 sm:mb-0 sm:my-0 px-5 py-2.5 bg-primary text-primary-foreground font-mono text-sm tracking-wider uppercase font-semibold hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 rounded-md whitespace-nowrap"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Run My Free Scan <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </form>

      {/* Try pills — populate input only, no navigation */}
      <div className="flex flex-wrap items-center gap-2.5 mt-4">
        <span className="font-mono text-sm tracking-wider uppercase text-muted-foreground">Try:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            className="font-mono text-sm tracking-wider text-muted-foreground hover:text-primary active:scale-95 active:bg-primary/20 transition-all cursor-pointer rounded px-1.5 py-0.5"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Scan counter for non-authenticated users */}
      {!hasScansRemaining ? null : scansRemaining < FREE_SCAN_LIMIT && (
        <p className="font-mono text-xs text-muted-foreground mt-3 text-center tracking-wider">
          {scansRemaining} of {FREE_SCAN_LIMIT} free scans remaining
        </p>
      )}
    </motion.div>
  );
}
