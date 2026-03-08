import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card mt-auto">
      {/* Gold accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-civic-gold-muted to-transparent" />
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <ClipboardCheck className="w-4 h-4 text-primary-foreground relative z-10" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-foreground" style={{ fontFamily: "'Source Serif 4', serif" }}>Offer Check</span>
                <span className="text-[8.5px] text-civic-gold tracking-[0.18em] uppercase font-semibold">by Jackye Clayton</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Know before you go. Review public signals about any employer before you accept the offer, buy their products, or invest your time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-12">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-[0.15em]">Navigate</p>
              <div className="space-y-2.5">
                <Link to="/browse" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Browse Companies</Link>
                <Link to="/methodology" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Methodology</Link>
                <Link to="/search" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Search</Link>
                <Link to="/jobs" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Job Board</Link>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-[0.15em]">About</p>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <p>Data from FEC.gov, Senate LDA, USASpending &amp; public filings.</p>
                <p>Signals reported. No conclusions drawn.</p>
                <Link to="/request-correction" className="block text-primary hover:underline">Request a Correction</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Offer Check by Jackye Clayton. All rights reserved. This tool reports publicly available data for informational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
