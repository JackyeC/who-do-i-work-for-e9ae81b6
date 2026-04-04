import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { LogoMark } from "@/components/brand/LogoMark";
import { cn } from "@/lib/utils";

const PRIMARY_LINKS = [
  { label: "How It Works", to: "/how-it-works" },
  { label: "Check a Company", to: "/offer-check" },
  { label: "Pricing", to: "/pricing" },
];

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();

  if (!isLoaded || authLoading) return null;

  const linkClass = (to: string) =>
    cn(
      "font-sans text-sm transition-colors",
      location.pathname === to || (to !== "/" && location.pathname.startsWith(to + "/"))
        ? "text-foreground font-medium"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border px-6 lg:px-16 py-4 w-full">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center shrink-0">
            <LogoMark showWordmark iconSize={22} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-end mr-6">
            {PRIMARY_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center shrink-0">
            {user ? (
              <Link to="/dashboard" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">
                Workspace
              </Link>
            ) : (
              <Link to="/login" className="font-sans text-sm text-muted-foreground/80 hover:text-foreground transition-colors">
                Log in
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1 text-muted-foreground hover:text-foreground transition-colors ml-auto"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-6 pb-4 border-b border-border/50 bg-background">
          <nav className="flex flex-col gap-1">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn("font-sans text-sm py-2.5", linkClass(link.to))}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="font-sans text-sm py-2.5 text-muted-foreground hover:text-foreground"
              >
                Workspace
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="font-sans text-sm py-2.5 text-muted-foreground hover:text-foreground"
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
