import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDemoSafeMode } from "@/contexts/DemoSafeModeContext";
import { cn } from "@/lib/utils";
import { Search, LogIn, LogOut, Menu, X, Shield, Map, ChevronDown, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SignupModal } from "@/components/SignupModal";
import { getUiStatement } from "@/lib/signalPersonalization";

export const MAIN_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    matchPaths: ["/dashboard"],
    auth: true,
    subItems: [],
  },
  {
    id: "company",
    label: "Company",
    path: "/browse",
    matchPaths: ["/browse", "/search", "/company/", "/dossier/", "/add-company", "/values-search", "/intelligence"],
    subItems: [],
  },
  {
    id: "offers",
    label: "Offers",
    path: "/check",
    matchPaths: ["/check", "/offer-check", "/offer-review", "/strategic-offer-review", "/offer-clarity"],
    subItems: [],
  },
  {
    id: "careers",
    label: "Careers",
    path: "/career-intelligence",
    matchPaths: ["/career-intelligence", "/career-map"],
    auth: true,
    subItems: [],
  },
  {
    id: "tools",
    label: "Tools",
    path: "/site-map",
    matchPaths: ["/would-you-work-here", "/employer-receipt", "/employer-promise-check", "/what-am-i-supporting", "/follow-the-money", "/compare", "/site-map"],
    subItems: [
      { label: "Would You Work Here?", path: "/would-you-work-here" },
      { label: "Employer Receipt", path: "/employer-receipt" },
      { label: "Employer Promise vs. Reality", path: "/employer-promise-check" },
      { label: "Follow the Money", path: "/follow-the-money" },
      { label: "Compare Companies", path: "/compare" },
      { label: "All Tools →", path: "/site-map" },
      { label: "Methodology", path: "/methodology" },
    ],
  },
  {
    id: "jobs",
    label: "Job Board",
    path: "/job-board",
    matchPaths: ["/job-board", "/jobs"],
    subItems: [],
  },
  {
    id: "coach",
    label: "Advisor",
    path: "/ask-jackye",
    matchPaths: ["/ask-jackye"],
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
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isDemoSafe, toggleDemoSafe, canToggle } = useDemoSafeMode();

  // Live signal intelligence ticker
  const { data: tickerItems } = useQuery({
    queryKey: ["signal-ticker"],
    queryFn: async () => {
      const DIRECTION_ICON: Record<string, string> = { increase: "↑", decrease: "↓", stable: "—" };

      const { data: signals } = await supabase
        .from("company_signal_scans")
        .select("signal_category, value_normalized, direction, companies!inner(name)")
        .order("scan_timestamp", { ascending: false })
        .limit(10);

      const items: string[] = [];

      if (signals && signals.length > 0) {
        for (const s of signals) {
          const companyName = (s.companies as any)?.name ?? "—";
          const statement = getUiStatement(s.signal_category, s.value_normalized ?? "not_disclosed");
          const arrow = DIRECTION_ICON[s.direction ?? "stable"] ?? "—";
          items.push(`${companyName}: ${statement} ${arrow}`);
        }
      }

      // Fallback static items
      if (items.length < 3) {
        items.push("PLATFORM: Live intelligence scanning active");
        items.push(`UPDATED: ${new Date().toLocaleDateString()} — signals refreshed`);
      }

      return items;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const finalTickerItems = tickerItems ?? ["PLATFORM: Live intelligence scanning active"];

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
      <div className="bg-primary text-primary-foreground overflow-hidden whitespace-nowrap h-[30px] flex items-center">
        <div className="inline-block animate-ticker">
          {finalTickerItems.map((t, i) => (
            <span key={i} className="px-8">
              <span className="font-mono text-xs font-medium tracking-wider">{t}</span>
              <span className="opacity-50 px-4">|</span>
            </span>
          ))}
          {finalTickerItems.slice(0, 2).map((t, i) => (
            <span key={`dup-${i}`} className="px-8">
              <span className="font-mono text-xs font-medium tracking-wider">{t}</span>
              <span className="opacity-50 px-4">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border h-[56px] flex items-center px-4 lg:px-6">
        {/* Brand — left */}
        <Link to="/" className="flex flex-col shrink-0 mr-4">
          <span className="font-serif text-sm text-primary leading-none whitespace-nowrap flex items-center gap-1.5">
            Who Do I Work For?
            <span className="font-mono text-[9px] tracking-wider uppercase px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-sm leading-none">Beta</span>
          </span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[0.2em] whitespace-nowrap">Career Intelligence Platform</span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center justify-center gap-0 h-full flex-1 min-w-0">
          {MAIN_SECTIONS.map(section => {
            const requiresAuth = (section as any).auth && !user;
            const active = isSectionActive(section, location.pathname);
            const hasDropdown = section.subItems && section.subItems.length > 0;
            return (
              <div key={section.id} className="relative h-full group">
                {requiresAuth ? (
                  <button
                    onClick={() => setSignupModalOpen(true)}
                    className={cn(
                      "font-mono text-xs tracking-wider uppercase px-3 h-full flex items-center border-b-2 transition-colors gap-1 whitespace-nowrap",
                      "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {section.label}
                    <Lock className="w-2.5 h-2.5 opacity-50" />
                  </button>
                ) : (
                  <Link
                    to={section.path}
                    className={cn(
                      "font-mono text-xs tracking-wider uppercase px-3 h-full flex items-center border-b-2 transition-colors gap-1 whitespace-nowrap",
                      active
                        ? "text-primary border-primary"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {section.label}
                    {hasDropdown && <ChevronDown className="w-2.5 h-2.5" />}
                  </Link>
                )}
                {hasDropdown && !requiresAuth && (
                  <div className="absolute top-full left-0 hidden group-hover:block bg-card border border-border shadow-lg min-w-[200px] z-50">
                    {section.subItems.map(sub => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className="block px-4 py-2.5 font-mono text-xs tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/[0.04] transition-colors whitespace-nowrap"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3 shrink-0">
          <form onSubmit={handleSearch} className="hidden lg:flex items-center bg-surface-2 border border-border px-3 py-1.5 w-[160px]">
            <Search className="w-3 h-3 text-muted-foreground mr-2 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-foreground font-mono text-xs w-full placeholder:text-muted-foreground"
            />
          </form>

          {isDemoSafe && (
            <button
              onClick={canToggle ? toggleDemoSafe : undefined}
              className="hidden lg:flex items-center gap-1.5 font-mono text-[9px] tracking-wider uppercase px-2 py-1 border border-civic-green/60 text-civic-green bg-civic-green/10 cursor-pointer hover:bg-civic-green/20 transition-colors whitespace-nowrap"
              title="Demo Safe Mode"
            >
              <Shield className="w-3 h-3" />
              Demo
            </button>
          )}
          {user && !isDemoSafe && (
            <div className="hidden lg:flex font-mono text-[9px] tracking-wider uppercase px-2 py-1 border border-primary/40 text-primary whitespace-nowrap">
              Pro
            </div>
          )}

          <ThemeToggle />

          {user ? (
            <button
              onClick={signOut}
              className="font-mono text-[10px] tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-primary text-primary-foreground px-4 py-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase hover:brightness-110 transition-all flex items-center gap-1.5 whitespace-nowrap"
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
            const requiresAuth = (section as any).auth && !user;
            const active = isSectionActive(section, location.pathname);
            return requiresAuth ? (
              <button
                key={section.id}
                onClick={() => { setMobileMenuOpen(false); setSignupModalOpen(true); }}
                className="block w-full text-left px-3 py-2.5 font-mono text-[11px] tracking-wider uppercase text-muted-foreground"
              >
                {section.label} <Lock className="w-2.5 h-2.5 inline opacity-50 ml-1" />
              </button>
            ) : (
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

      {/* Signup gate modal */}
      <SignupModal
        open={signupModalOpen}
        onOpenChange={setSignupModalOpen}
        headline="Sign up to see the receipts"
        subtext="Create a free account to access Dashboard, Career Intelligence, and more."
      />
    </>
  );
}
