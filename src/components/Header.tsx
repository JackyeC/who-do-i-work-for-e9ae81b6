import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ClipboardCheck, BookOpen, Briefcase, Plus, HardHat, Target, Bell, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: "'Source Serif 4', serif" }}>
              Offer Check
            </span>
            <span className="text-[9px] text-muted-foreground tracking-wide">by Jackye Clayton</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              {link.icon && <link.icon className="w-3.5 h-3.5" />}
              {link.label}
            </Link>
          ))}
          {authLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          ))}
          <Link to={user ? "/who-do-i-work-for" : "/login"}>
            <Button size="sm" variant="default" className="gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Who Do I Work For?
            </Button>
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2.5 -mr-2 text-muted-foreground hover:text-foreground rounded-md active:bg-muted"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-3 px-3 rounded-md active:bg-muted/50"
            >
              {link.icon && <link.icon className="w-4 h-4" />}
              {link.label}
            </Link>
          ))}
          {authLinks.length > 0 && <div className="border-t border-border my-1" />}
          {authLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-3 px-3 rounded-md active:bg-muted/50"
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
          <div className="pt-2 pb-1">
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
