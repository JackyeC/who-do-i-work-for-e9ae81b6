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
              Transparency tool helping people make informed decisions about where they work and shop.
            </p>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Data sourced from FEC.gov and public records.</p>
            <p>Donations do not always equal total endorsement.</p>
            <p className="text-xs">© {new Date().getFullYear()} CivicLens. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
