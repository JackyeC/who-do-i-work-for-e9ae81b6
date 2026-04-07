import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      {/* Footer columns */}
      <div className="px-6 lg:px-16 py-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center mb-3">
                <span style={{ fontFamily: "Inter,sans-serif", fontWeight: 900, letterSpacing: "-0.03em", fontSize: "22px" }}>
                  <span className="text-foreground">W</span>
                  <span style={{ color: "#F0C040" }}>?</span>
                </span>
              </Link>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-[28ch]">
                The trust layer for the world of work. Know before you go.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">Platform</p>
              <nav className="flex flex-col gap-2">
                {[
                  { label: "Home", to: "/" },
                  { label: "How It Works", to: "/how-it-works" },
                  { label: "Companies", to: "/browse" },
                  { label: "The Work Signal", to: "/newsletter" },
                  { label: "Quick Check", to: "/check" },
                  { label: "Pricing", to: "/pricing" },
                  { label: "Work With Jackye", to: "/work-with-jackye" },
                ].map((link) => (
                  <Link key={link.to} to={link.to} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Connect */}
            <div>
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">Connect</p>
              <nav className="flex flex-col gap-2">
                {[
                  { label: "LinkedIn", url: "https://www.linkedin.com/in/jackyeclayton/" },
                  { label: "Speaking", url: "https://jackyeclayton.com/speaking" },
                  { label: "Inclusive AF Podcast", url: "https://www.inclusiveafpodcast.com" },
                  { label: "But First, Coffee", url: "https://wrkdefined.com/podcast/but-first-coffee" },
                  { label: "Contact", to: "/contact" },
                  { label: "Submit a Tip", to: "/submit-tip" },
                ].map((link) => (
                  'url' in link ? (
                    <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.label} to={link.to!} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  )
                ))}
              </nav>
            </div>

            {/* Legal */}
            <div>
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">Legal</p>
              <nav className="flex flex-col gap-2">
                {[
                  { label: "Privacy Policy", to: "/privacy" },
                  { label: "Terms of Service", to: "/terms" },
                  { label: "Methodology", to: "/methodology" },
                  { label: "Data Ethics", to: "/data-ethics" },
                  { label: "About", to: "/about" },
                ].map((link) => (
                  <Link key={link.to} to={link.to} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex justify-between items-center flex-wrap gap-3">
            <p className="font-sans text-xs text-muted-foreground/50">
              © {new Date().getFullYear()} Who Do I Work For. Created by Jackye Clayton · WDIWF
            </p>
            <p className="font-sans text-xs text-muted-foreground/50">
              Built on public records: FEC · SEC · BLS · OSHA · NLRB · Senate Lobbying
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
