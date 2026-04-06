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
      className="w-full max-w-[560px]"
    >
      <form onSubmit={handleSubmit} className="relative group">
        <div ref={containerRef} />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

        <div className="relative flex items-center bg-card border border-border focus-within:border-primary/40 transition-colors">
          <Search className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any employer..."
            className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-sans"
          />
          <button
            type="submit"
            disabled={verifying || !query.trim()}
            className="mr-2 px-5 py-2 bg-primary text-primary-foreground font-mono text-xs tracking-wider uppercase font-semibold hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Run My Free Scan <ArrowRight className="w-3 h-3" /></>}
          </button>
        </div>
      </form>

      {/* Try pills — populate input only, no navigation */}
      <div className="flex items-center gap-2 mt-3">
        <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground/60">Try:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            className="font-mono text-xs tracking-wider text-muted-foreground hover:text-primary active:scale-95 active:bg-primary/20 transition-all cursor-pointer rounded px-1 py-0.5"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Scan counter for non-authenticated users */}
      {!hasScansRemaining ? null : scansRemaining < FREE_SCAN_LIMIT && (
        <p className="font-mono text-[10px] text-muted-foreground/60 mt-3 text-center tracking-wider">
          {scansRemaining} of {FREE_SCAN_LIMIT} free scans remaining
        </p>
      )}
    </motion.div>
  );
}
