import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";

export const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="border-t border-border/30 bg-primary text-primary-foreground mt-auto relative overflow-hidden">
      {/* Gold accent line */}
      <div className="gold-line" />
      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="container mx-auto px-4 py-20 relative">
        <div className="flex flex-col md:flex-row justify-between items-start gap-14">
          <div className="max-w-xs">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="relative w-9 h-9 rounded-xl bg-primary-foreground/10 flex items-center justify-center overflow-hidden border border-primary-foreground/10">
                <ClipboardCheck className="w-4.5 h-4.5 text-primary-foreground/80 relative z-10" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-primary-foreground font-display text-lg">Who Do I Work For?</span>
                <span className="text-[8px] text-primary-foreground/40 tracking-[0.2em] uppercase font-semibold mt-0.5">Career Intelligence by Jackye Clayton</span>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/45 leading-relaxed">
              Understand the company behind the job offer. Career intelligence powered by public signals — helping candidates, recruiters, and leaders make informed decisions.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-14">
            <div className="space-y-4">
              <p className="text-[10px] font-semibold text-primary-foreground/30 uppercase tracking-[0.2em]">Evaluate</p>
              <div className="space-y-3">
                <Link to="/check?tab=company" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Employer Scan</Link>
                <Link to="/check?tab=offer" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Offer Analysis</Link>
                <Link to="/check?tab=candidate" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Policy Influence Map</Link>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-semibold text-primary-foreground/30 uppercase tracking-[0.2em]">Explore</p>
              <div className="space-y-3">
                <Link to="/career-map" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Career Path Explorer</Link>
                <Link to="/jobs" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Jobs</Link>
                <Link to="/recruiting" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Talent Intelligence</Link>
                <Link to="/dashboard" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">My Dashboard</Link>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-semibold text-primary-foreground/30 uppercase tracking-[0.2em]">Resources</p>
              <div className="space-y-3">
                <Link to="/pricing" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Pricing</Link>
                <Link to="/site-map" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Site Map</Link>
                <Link to="/methodology" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Methodology</Link>
                <a href="#evidence-sources" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Evidence Sources</a>
                <Link to="/request-correction" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Request a Correction</Link>
                <Link to="/privacy" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Terms of Service</Link>
                <Link to="/disclaimers" className="block text-sm text-primary-foreground/55 hover:text-primary-foreground/90 transition-colors">Disclaimers</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-14 pt-8 border-t border-primary-foreground/[0.06] space-y-4">
          <p className="text-xs text-primary-foreground/30">
            © {new Date().getFullYear()} Who Do I Work For? — Career Intelligence by Jackye Clayton. All rights reserved. This platform surfaces publicly available data as employer reality signals for informational purposes only.
          </p>
          <p className="text-[10px] text-primary-foreground/25 leading-relaxed">
            WDIWF is a live intelligence aggregator. Because corporate and political landscapes shift daily, we rely on public filings and community verification. Found a discrepancy?{" "}
            <Link to="/request-correction" className="text-primary-foreground/50 hover:text-primary-foreground/70 underline underline-offset-2">Report it here</Link>.
          </p>
          <p className="text-[10px] text-primary-foreground/20 leading-relaxed">
            AI Training Restriction: Content on this website may not be used to train artificial intelligence systems, machine learning models, or large language models without explicit written permission. Automated scraping, dataset creation, or model training using this content is prohibited.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
