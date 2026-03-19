import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDemoSafeMode } from "@/contexts/DemoSafeModeContext";
import { cn } from "@/lib/utils";
import { Search, LogIn, LogOut, Menu, X, Shield, ChevronDown, Lock, Compass, BarChart3, Radio } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PersonaChip } from "@/components/PersonaChip";
import { usePersona } from "@/hooks/use-persona";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SignupModal } from "@/components/SignupModal";
import { getUiStatement } from "@/lib/signalPersonalization";

/* ── MAIN_SECTIONS — kept for ContextSidebar compatibility ── */
export const MAIN_SECTIONS = [
  {
    id: "audit",
    label: "Audit a Company",
    path: "/browse",
    matchPaths: ["/browse", "/search", "/company/", "/dossier/", "/add-company", "/values-search", "/intelligence", "/what-am-i-supporting"],
    subItems: [],
  },
  {
    id: "intelligence",
    label: "My Intelligence",
    path: "/dashboard",
    matchPaths: ["/dashboard"],
    auth: true,
    subItems: [],
  },
  {
    id: "signals",
    label: "Live Signals",
    path: "/signal-alerts",
    matchPaths: ["/signal-alerts"],
    subItems: [],
  },
  {
    id: "career-map",
    label: "Career Map",
    path: "/career-intelligence",
    matchPaths: ["/career-intelligence", "/career-map"],
    auth: true,
    subItems: [],
  },
  {
    id: "more",
    label: "More",
    path: "/site-map",
    matchPaths: [
      "/check", "/offer-check", "/offer-review", "/strategic-offer-review", "/offer-clarity",
      "/job-board", "/jobs", "/ask-jackye", "/methodology", "/pricing",
      "/would-you-work-here", "/employer-receipt", "/employer-promise-check", "/follow-the-money", "/compare", "/site-map",
    ],
    subItems: [
      { label: "Job Board", path: "/job-board" },
      { label: "Offer Analysis", path: "/check" },
      { label: "Career Path Explorer", path: "/career-map" },
      { label: "Advisor", path: "/ask-jackye" },
      { label: "Compare Companies", path: "/compare" },
      { label: "Follow the Money", path: "/follow-the-money" },
      { label: "Methodology", path: "/methodology" },
      { label: "Pricing", path: "/pricing" },
      { label: "All Tools →", path: "/site-map" },
    ],
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
  const { hasTakenQuiz } = usePersona();

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

  const handleMyIntelligence = () => {
    if (!hasTakenQuiz) {
      navigate("/quiz");
    } else {
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  if (location.pathname === "/") return null;

  /* Primary nav items (desktop) */
  const PRIMARY_NAV = [
    { id: "intelligence", label: "My Intelligence", icon: BarChart3, onClick: handleMyIntelligence, matchPaths: ["/dashboard"] },
    { id: "signals", label: "Live Signals", icon: Radio, path: "/signal-alerts", matchPaths: ["/signal-alerts"] },
    { id: "career-map", label: "Career Map", icon: Compass, path: "/career-intelligence", matchPaths: ["/career-intelligence", "/career-map"], auth: true },
  ];

  /* Secondary nav items (More dropdown) */
  const SECONDARY_NAV = [
    { label: "Job Board", path: "/job-board" },
    { label: "Offer Analysis", path: "/check" },
    { label: "Career Path Explorer", path: "/career-map" },
    { label: "Advisor", path: "/ask-jackye" },
    { label: "Compare Companies", path: "/compare" },
    { label: "Follow the Money", path: "/follow-the-money" },
    { label: "Methodology", path: "/methodology" },
    { label: "Pricing", path: "/pricing" },
    { label: "All Tools →", path: "/site-map" },
  ];

  const isMoreActive = SECONDARY_NAV.some(s => location.pathname.startsWith(s.path.split("?")[0]));

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
        {/* Brand */}
        <Link to="/" className="flex flex-col shrink-0 mr-4">
          <span className="font-serif text-sm text-primary leading-none whitespace-nowrap flex items-center gap-1.5">
            Who Do I Work For?
            <span className="font-mono text-[9px] tracking-wider uppercase px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-sm leading-none">Beta</span>
          </span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[0.2em] whitespace-nowrap">Career Intelligence Platform</span>
        </Link>

        {/* ── Audit search bar (always visible, most prominent) ── */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center bg-muted/40 border border-border rounded-full px-3 py-1.5 w-[200px] lg:w-[240px] mr-2 shrink-0">
          <Search className="w-3.5 h-3.5 text-primary mr-2 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Audit a company..."
            className="bg-transparent border-none outline-none text-foreground font-mono text-xs w-full placeholder:text-muted-foreground"
          />
        </form>

        {/* ── Primary nav (desktop) ── */}
        <nav className="hidden md:flex items-center gap-0 h-full flex-1 min-w-0">
          {PRIMARY_NAV.map(item => {
            const requiresAuth = (item as any).auth && !user;
            const active = item.matchPaths.some(p => location.pathname.startsWith(p));
            const Icon = item.icon;
            return (
              <div key={item.id} className="h-full">
                {requiresAuth ? (
                  <button
                    onClick={() => setSignupModalOpen(true)}
                    className="font-mono text-xs tracking-wider uppercase px-3 h-full flex items-center border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors gap-1.5 whitespace-nowrap"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                    <Lock className="w-2.5 h-2.5 opacity-50" />
                  </button>
                ) : item.onClick ? (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      "font-mono text-xs tracking-wider uppercase px-3 h-full flex items-center border-b-2 transition-colors gap-1.5 whitespace-nowrap",
                      active ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                ) : (
                  <Link
                    to={item.path!}
                    className={cn(
                      "font-mono text-xs tracking-wider uppercase px-3 h-full flex items-center border-b-2 transition-colors gap-1.5 whitespace-nowrap",
                      active ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}

          {/* More dropdown */}
          <div className="relative h-full group">
            <button
              className={cn(
                "font-mono text-xs tracking-wider uppercase px-3 h-full flex items-center border-b-2 transition-colors gap-1 whitespace-nowrap",
                isMoreActive ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              More <ChevronDown className="w-2.5 h-2.5" />
            </button>
            <div className="absolute top-full left-0 hidden group-hover:block bg-card border border-border shadow-lg min-w-[200px] z-50">
              {SECONDARY_NAV.map(sub => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  className="block px-4 py-2.5 font-mono text-xs tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/[0.04] transition-colors whitespace-nowrap"
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-3 shrink-0">
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

          {/* Persona chip or quiz prompt */}
          {hasTakenQuiz ? (
            <PersonaChip />
          ) : (
            <Link
              to="/quiz"
              className="hidden sm:inline-flex whitespace-nowrap"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#f0c040" }}
            >
              Get your lens →
            </Link>
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

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card py-2 px-4 space-y-1">
          {/* Mobile search */}
          <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} className="flex items-center bg-muted/40 border border-border rounded-full px-3 py-2 mb-2">
            <Search className="w-3.5 h-3.5 text-primary mr-2 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Audit a company..."
              className="bg-transparent border-none outline-none text-foreground font-mono text-xs w-full placeholder:text-muted-foreground"
            />
          </form>

          {/* Primary */}
          <button
            onClick={() => { setMobileMenuOpen(false); handleMyIntelligence(); }}
            className="block w-full text-left px-3 py-2.5 font-mono text-[11px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            My Intelligence
          </button>
          <Link to="/signal-alerts" className="block px-3 py-2.5 font-mono text-[11px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
            Live Signals
          </Link>
          {user ? (
            <Link to="/career-intelligence" className="block px-3 py-2.5 font-mono text-[11px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
              Career Map
            </Link>
          ) : (
            <button
              onClick={() => { setMobileMenuOpen(false); setSignupModalOpen(true); }}
              className="block w-full text-left px-3 py-2.5 font-mono text-[11px] tracking-wider uppercase text-muted-foreground"
            >
              Career Map <Lock className="w-2.5 h-2.5 inline opacity-50 ml-1" />
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-border/50 my-1" />

          {/* Secondary */}
          {SECONDARY_NAV.map(sub => (
            <Link
              key={sub.path}
              to={sub.path}
              className="block px-3 py-2.5 font-mono text-[11px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {sub.label}
            </Link>
          ))}
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
