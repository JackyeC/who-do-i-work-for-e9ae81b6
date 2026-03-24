import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="bg-card border-t border-border px-6 lg:px-16 py-12 mt-auto">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center mb-3">
              <span
                style={{
                  fontFamily: "Inter,sans-serif",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  fontSize: "22px",
                }}
              >
                <span className="text-foreground">W</span>
                <span style={{ color: "#F0C040" }}>?</span>
              </span>
            </Link>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-[28ch]">
              Career intelligence that closes the Integrity Gap. Know before you
              go.
            </p>
          </div>

          {/* WDIWF Links */}
          <div>
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">
              WDIWF
            </p>
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                to="/receipts"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Receipts
              </Link>
              <Link
                to="/browse"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Companies
              </Link>
              <Link
                to="/about"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                to="/for-employers"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                For Companies
              </Link>
              <Link
                to="/pricing"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/contact"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Connect */}
          <div>
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">
              Connect
            </p>
            <nav className="flex flex-col gap-2">
              <a
                href="https://www.linkedin.com/in/jackyeclayton/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://jackyeclayton.com/speaking"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Speaking
              </a>
              <a
                href="https://www.inclusiveafpodcast.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Inclusive AF Podcast
              </a>
              <a
                href="https://wrkdefined.com/podcast/but-first-coffee"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                But First, Coffee
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">
              Legal
            </p>
            <nav className="flex flex-col gap-2">
              <Link
                to="/privacy"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/methodology"
                className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Methodology
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex justify-between items-center flex-wrap gap-3">
          <p className="font-sans text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} WDIWF. A People Puzzles venture. Built
            because you deserve to know.
          </p>
          <p className="font-sans text-xs text-muted-foreground/50">
            Built on public records: FEC · SEC · BLS · OSHA · NLRB · Senate
            Lobbying
          </p>
        </div>
      </div>
    </footer>
  );
}
