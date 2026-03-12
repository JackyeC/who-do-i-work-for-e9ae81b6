import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Search, LogIn, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const MAIN_SECTIONS = [
  {
    id: "intelligence",
    label: "Company Intelligence",
    path: "/browse",
    matchPaths: ["/browse", "/search", "/company/", "/dossier/", "/add-company", "/values-search", "/intelligence"],
    subItems: [],
  },
  {
    id: "offer",
    label: "Offer Intelligence",
    path: "/check",
    matchPaths: ["/check", "/offer-check", "/offer-review", "/strategic-offer-review"],
    subItems: [],
  },
  {
    id: "coach",
    label: "Ask Jackye",
    path: "/ask-jackye",
    matchPaths: ["/ask-jackye"],
    subItems: [],
  },
  {
    id: "career",
    label: "Career Intelligence",
    path: "/career-intelligence",
    matchPaths: ["/career-intelligence", "/career-map"],
    auth: true,
    subItems: [],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    matchPaths: ["/dashboard"],
    auth: true,
    subItems: [],
  },
];

function isSectionActive(section: typeof MAIN_SECTIONS[0], pathname: string) {
  return section.matchPaths.some(p => {
    if (p === "/") return pathname === "/";
    return pathname.startsWith(p);
  });
}

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Don't show the terminal header on the landing page
  if (location.pathname === "/") return null;

  return (
    <>
      {/* Ticker Bar */}
      <div className="bg-primary text-primary-foreground overflow-hidden whitespace-nowrap h-[26px] flex items-center">
        <div className="inline-block animate-ticker">
          {[
            "INTEL UPDATE: Koch Industries lobbying spend +12% QoQ",
            "OFFER ALERT: 3 new red flags identified",
            "EVP SCORE: Amazon drops to 61 — culture risk elevated",
            'JACKYE INSIGHT: "Don\'t accept an offer without running the chain first"',
            `NEW DATA: ${new Date().toLocaleDateString()} connection chains updated`,
          ].map((t, i) => (
            <span key={i} className="px-8">
              <span className="font-mono text-[10px] font-medium tracking-wider">{t}</span>
              <span className="opacity-50 px-4">|</span>
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {[
            "INTEL UPDATE: Koch Industries lobbying spend +12% QoQ",
            "OFFER ALERT: 3 new red flags identified",
          ].map((t, i) => (
            <span key={`dup-${i}`} className="px-8">
              <span className="font-mono text-[10px] font-medium tracking-wider">{t}</span>
              <span className="opacity-50 px-4">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border h-[52px] flex items-center px-4 lg:px-6 gap-4 lg:gap-8">
        {/* Logo */}
        <Link to="/" className="flex flex-col shrink-0">
          <span className="font-serif text-[13px] text-primary leading-none">Who Do I Work For</span>
          <span className="font-mono text-micro uppercase text-muted-foreground tracking-[0.2em]">Employer Intelligence by Jackye Clayton</span>
        </Link>

        <div className="w-px h-6 bg-border hidden lg:block" />

        {/* Main Nav */}
        <nav className="hidden md:flex items-center gap-0 h-full flex-1">
          {MAIN_SECTIONS.map(section => {
            if ((section as any).auth && !user) return null;
            const active = isSectionActive(section, location.pathname);
            return (
              <Link
                key={section.id}
                to={section.path}
                className={cn(
                  "font-mono text-[10px] tracking-wider uppercase px-4 h-full flex items-center border-b-2 transition-colors",
                  active
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3 ml-auto">
          {user && (
            <div className="hidden lg:flex font-mono text-[9px] tracking-wider uppercase px-2 py-1 border border-primary/40 text-primary">
              Pro
            </div>
          )}

          <form onSubmit={handleSearch} className="hidden sm:flex items-center bg-surface-2 border border-border px-3 py-1.5 w-[200px]">
            <Search className="w-3 h-3 text-muted-foreground mr-2 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, person..."
              className="bg-transparent border-none outline-none text-foreground font-mono text-[10px] w-full placeholder:text-muted-foreground"
            />
          </form>

          <ThemeToggle />

          {user ? (
            <button
              onClick={signOut}
              className="font-mono text-[10px] tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-primary text-primary-foreground px-4 py-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase hover:brightness-110 transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3 h-3" />
              Sign In
            </Link>
          )}

          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card py-2 px-4 space-y-1">
          {MAIN_SECTIONS.map(section => {
            if ((section as any).auth && !user) return null;
            const active = isSectionActive(section, location.pathname);
            return (
              <Link
                key={section.id}
                to={section.path}
                className={cn(
                  "block px-3 py-2.5 font-mono text-[11px] tracking-wider uppercase transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {section.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
