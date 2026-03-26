import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const { containerRef, getToken, resetToken } = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setVerifying(true);
    const token = await getToken();
    const verified = token ? await verifyTurnstileToken(token) : false;
    setVerifying(false);
    resetToken();

    if (!verified) return;

    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const suggestions = ["ExxonMobil", "Amazon", "Google", "Goldman Sachs"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="w-full max-w-[520px]"
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
            disabled={verifying}
            className="mr-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-xs tracking-wider uppercase font-semibold hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {verifying ? "..." : <>Scan <ArrowRight className="w-3 h-3" /></>}
          </button>
        </div>
      </form>
      <div className="flex items-center gap-2 mt-3">
        <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground/60">Try:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
            className="font-mono text-xs tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
