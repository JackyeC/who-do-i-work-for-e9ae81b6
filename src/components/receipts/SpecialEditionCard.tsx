import { Link } from "react-router-dom";

export function SpecialEditionCard() {
  return (
    <div className="py-8 mb-8 border-b border-border/30">
      <div className="p-8 rounded-2xl border border-primary/20" style={{ background: "hsl(var(--primary) / 0.04)" }}>
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-primary mb-3">
          Special Edition
        </p>
        <h3 className="text-2xl font-black text-foreground mb-2 uppercase tracking-tight">
          Your company just made the feed.
        </h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Need help reading the receipts? Jackye Clayton has 15+ years decoding what companies actually mean.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/advisory"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm no-underline hover:opacity-90 transition-opacity"
          >
            Audit My Stack
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center px-5 py-2.5 rounded-lg border border-border font-bold text-sm text-foreground no-underline hover:border-primary/40 transition-colors"
          >
            Solve My Puzzle
          </Link>
        </div>
        <div className="flex justify-end mt-4">
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "hsl(var(--muted-foreground))", fontWeight: 300, opacity: 0.6 }}>
            JRC EDIT
          </span>
        </div>
      </div>
    </div>
  );
}
