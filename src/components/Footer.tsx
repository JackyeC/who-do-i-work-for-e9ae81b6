import { Link } from "react-router-dom";
import { Eye } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Eye className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground" style={{ fontFamily: "'Source Serif 4', serif" }}>CivicLens</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Helping people make informed work and spending decisions using publicly available data about political and civic influence.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="text-sm space-y-2">
              <p className="font-medium text-foreground">Navigate</p>
              <Link to="/browse" className="block text-muted-foreground hover:text-foreground transition-colors">Browse Companies</Link>
              <Link to="/methodology" className="block text-muted-foreground hover:text-foreground transition-colors">Methodology</Link>
              <Link to="/search" className="block text-muted-foreground hover:text-foreground transition-colors">Search</Link>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">About</p>
              <p>Data from FEC.gov, OpenSecrets &amp; public filings.</p>
              <p>Donations do not always equal endorsement.</p>
              <Link to="/request-correction" className="block text-primary hover:underline">Request a Correction</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CivicLens. All rights reserved. This tool provides publicly available data for informational purposes only.</p>
        </div>
      </div>
    </footer>
  );
}
