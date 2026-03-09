import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, BookOpen, Menu, X, Plus, LayoutDashboard, Shield, Briefcase, Map, ClipboardCheck, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/check?tab=company", label: "Who Do I Work For?", icon: Shield },
    { to: "/check?tab=offer", label: "Is This Offer Right For Me?", icon: ClipboardCheck },
    { to: "/career-map", label: "Where Could My Career Go?", icon: Map },
    { to: "/check?tab=candidate", label: "What Am I Supporting?", icon: Users },
    { to: "/values-search", label: "Values Search", icon: Search },
    { to: "/jobs", label: "Jobs", icon: Briefcase },
  ];

  const authLinks = user
    ? [
        { to: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
      ]
    : [];

  const isActive = (path: string) => {
    const [basePath, queryString] = path.split('?');
    if (queryString) {
      return location.pathname === basePath && location.search.includes(queryString);
    }
    return location.pathname === basePath;
  };

  return (
    <header className="border-b border-border/30 bg-card/90 backdrop-blur-xl sticky top-0 z-50" style={{ boxShadow: '0 1px 0 hsl(38 72% 50% / 0.06), 0 4px 20px -4px hsl(var(--foreground) / 0.04)' }}>
      <div className="container mx-auto px-4 h-[4.5rem] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="relative w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <ClipboardCheck className="w-5 h-5 text-primary-foreground relative z-10" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold text-foreground tracking-tight font-display">
              Who Do I Work For?
            </span>
            <span className="text-[8px] text-civic-gold tracking-[0.2em] uppercase font-semibold mt-0.5">Career Intelligence by Jackye Clayton</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5",
                isActive(link.to)
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {link.icon && <link.icon className="w-3.5 h-3.5" />}
              {link.label}
            </Link>
          ))}
          {authLinks.length > 0 && <div className="w-px h-5 bg-border mx-2" />}
          {authLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5",
                isActive(link.to)
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 ml-3">
            <Link to="/search">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl">
                <Search className="w-3.5 h-3.5" />
                Search Everything
              </Button>
            </Link>
            <Link to="/add-company">
              <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl text-muted-foreground">
                <Plus className="w-3.5 h-3.5" />
                Add Company
              </Button>
            </Link>
            {!user && (
              <Link to="/login">
                <Button size="sm" variant="default" className="gap-1.5 shadow-elevated font-semibold rounded-xl px-5">
                  Sign In
                </Button>
              </Link>
            )}
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
        <div className="lg:hidden border-t border-border/40 bg-card px-4 py-4 space-y-0.5 max-h-[70vh] overflow-y-auto animate-fade-in">
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
          {authLinks.length > 0 && <div className="border-t border-border/40 my-2" />}
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
          <div className="pt-3 pb-1 space-y-2">
            <Link to="/search" onClick={() => setMobileOpen(false)}>
              <Button size="default" variant="outline" className="gap-1.5 w-full rounded-xl">
                <Search className="w-4 h-4" />
                Search Everything
              </Button>
            </Link>
            {!user && (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button size="default" variant="default" className="gap-1.5 w-full rounded-xl">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
