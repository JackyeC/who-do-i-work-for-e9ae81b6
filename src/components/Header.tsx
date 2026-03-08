import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ClipboardCheck, BookOpen, Briefcase, Plus, HardHat, Target, Bell, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/browse", label: "Browse" },
    { to: "/methodology", label: "Methodology", icon: BookOpen },
    { to: "/search", label: "Search", icon: Search },
    { to: "/add-company", label: "Add Company", icon: Plus },
    { to: "/jobs", label: "Jobs", icon: HardHat },
  ];

  const authLinks = user
    ? [
        { to: "/job-dashboard", label: "Job Match", icon: Target },
        { to: "/my-offer-checks", label: "My Offer Checks", icon: ClipboardCheck },
        { to: "/signal-alerts", label: "Alerts", icon: Bell },
      ]
    : [];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-border/40 bg-card/95 backdrop-blur-lg sticky top-0 z-50 shadow-elegant">
      <div className="container mx-auto px-4 h-[4.25rem] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          {/* Shield-inspired logo mark */}
          <div className="relative w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <ClipboardCheck className="w-4.5 h-4.5 text-primary-foreground relative z-10" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: "'Source Serif 4', serif" }}>
              Offer Check
            </span>
            <span className="text-[8.5px] text-civic-gold tracking-[0.18em] uppercase font-semibold">by Jackye Clayton</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-medium px-3 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5",
                isActive(link.to)
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {link.icon && <link.icon className="w-3.5 h-3.5" />}
              {link.label}
            </Link>
          ))}
          {authLinks.length > 0 && <div className="w-px h-5 bg-border mx-1.5" />}
          {authLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-medium px-3 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5",
                isActive(link.to)
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          ))}
          <div className="ml-2">
            <Link to={user ? "/who-do-i-work-for" : "/login"}>
              <Button size="sm" variant="default" className="gap-1.5 shadow-sm font-semibold">
                <Briefcase className="w-3.5 h-3.5" />
                Who Do I Work For?
              </Button>
            </Link>
          </div>
        </nav>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2.5 -mr-2 text-muted-foreground hover:text-foreground rounded-lg active:bg-accent transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/60 bg-card px-4 py-3 space-y-0.5 max-h-[70vh] overflow-y-auto animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 text-sm font-medium transition-colors py-3 px-3 rounded-lg",
                isActive(link.to)
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground active:bg-accent/50"
              )}
            >
              {link.icon && <link.icon className="w-4 h-4" />}
              {link.label}
            </Link>
          ))}
          {authLinks.length > 0 && <div className="border-t border-border/60 my-2" />}
          {authLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 text-sm font-medium transition-colors py-3 px-3 rounded-lg",
                isActive(link.to)
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground active:bg-accent/50"
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
          <div className="pt-3 pb-1">
            <Link to={user ? "/who-do-i-work-for" : "/login"} onClick={() => setMobileOpen(false)}>
              <Button size="default" variant="default" className="gap-1.5 w-full">
                <Briefcase className="w-4 h-4" />
                Who Do I Work For?
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
