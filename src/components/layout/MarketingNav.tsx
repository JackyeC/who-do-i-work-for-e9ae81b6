import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/LogoMark";

const PRIMARY_LINKS = [
  { label: "How It Works", to: "/about" },
  { label: "Companies", to: "/browse" },
  { label: "The Receipts", to: "/receipts" },
  { label: "Pricing", to: "/pricing" },
];

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();

  if (!isLoaded || authLoading) return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 px-6 lg:px-16 py-4 w-full">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center shrink-0">
            <LogoMark showWordmark iconSize={22} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-sans text-sm transition-colors ${
                  location.pathname === link.to || location.pathname.startsWith(link.to + "/")
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")} className="font-sans text-sm">
                Dashboard
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate("/join")} className="font-sans text-sm px-5">
                Get Started
              </Button>
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1 text-muted-foreground hover:text-foreground transition-colors"
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
          <nav className="flex flex-col gap-3">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-sans text-sm py-2 transition-colors ${
                  location.pathname === link.to ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Button size="sm" variant="outline" onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }} className="w-full mt-2">
                Dashboard
              </Button>
            ) : (
              <Button size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/join"); }} className="w-full mt-2">
                Get Started
              </Button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
