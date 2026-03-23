import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { useAuth } from "@/contexts/AuthContext";
import { useDemoSafeMode } from "@/contexts/DemoSafeModeContext";
import { cn } from "@/lib/utils";
import { Search, Menu, X, Shield, ChevronDown, Lock, Compass, BarChart3, Radio, FileSearch } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PersonaChip } from "@/components/PersonaChip";
import { usePersona } from "@/hooks/use-persona";
import { SignupModal } from "@/components/SignupModal";
import { IntelligenceTicker } from "@/components/layout/IntelligenceTicker";

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
    id: "receipts",
    label: "Receipts",
    path: "/receipts",
    matchPaths: ["/receipts"],
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
      { label: "Career Path Explorer", path: "/career-intelligence" },
      { label: "Advisor", path: "/career-intelligence" },
      { label: "Compare Companies", path: "/compare" },
      { label: "Follow the Money", path: "/follow-the-money" },
      { label: "Recruiter Brief", path: "/recruiter-brief" },
      { label: "Methodology", path: "/methodology" },
      { label: "Pricing", path: "/pricing" },
      { label: "All Tools →", path: "/tools" },
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
  const { isLoaded, isFallback } = useClerkWithFallback();
  const { isDemoSafe, toggleDemoSafe, canToggle } = useDemoSafeMode();
  const { hasTakenQuiz } = usePersona();

  // Ticker is now a standalone component: IntelligenceTicker

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

  if (!isLoaded) return null;

  if (location.pathname === "/") return null;

  /* Primary nav items (desktop) */
  const PRIMARY_NAV = [
    { id: "receipts", label: "Receipts", icon: FileSearch, path: "/receipts", matchPaths: ["/receipts"] },
    { id: "intelligence", label: "My Intel", icon: BarChart3, onClick: handleMyIntelligence, matchPaths: ["/dashboard"] },
    { id: "signals", label: "Signals", icon: Radio, path: "/signal-alerts", matchPaths: ["/signal-alerts"] },
    { id: "career-map", label: "Career Map", icon: Compass, path: "/career-intelligence", matchPaths: ["/career-intelligence", "/career-map"], auth: true },
  ];

  /* Secondary nav items (More dropdown) */
  const SECONDARY_NAV = [
    { label: "Hire", path: "/hire" },
    { label: "Job Board", path: "/job-board" },
    { label: "Offer Analysis", path: "/check" },
    { label: "Career Path Explorer", path: "/career-intelligence" },
    { label: "Advisor", path: "/career-intelligence" },
    { label: "Compare Companies", path: "/compare" },
    { label: "Follow the Money", path: "/follow-the-money" },
    { label: "Recruiter Brief", path: "/recruiter-brief" },
    { label: "Methodology", path: "/methodology" },
    { label: "Pricing", path: "/pricing" },
    { label: "All Tools →", path: "/tools" },
    { label: "Get early access", path: "/join" },
  ];

  const isMoreActive = SECONDARY_NAV.some(s => location.pathname.startsWith(s.path.split("?")[0]));

  return (
    <>
      {/* Intelligence Ticker — fixed at top, 36px */}
      <IntelligenceTicker />
      {/* Header — fixed below ticker */}
      <header className="fixed top-[36px] left-0 right-0 z-50 border-b border-border h-[64px] flex items-center px-4 lg:px-6 bg-background/[0.92] backdrop-blur-[20px]">
        {/* Brand */}
        <Link to="/" className="flex items-center shrink-0 mr-4">
          <span style={{fontFamily:"Inter,sans-serif",fontWeight:900,letterSpacing:"-0.03em",fontSize:"26px"}}>
            <span style={{color:"#111111"}}>W</span>
            <span style={{color:"#F0C040"}}>?</span>
          </span>
        </Link>

        {/* ── Audit search bar (always visible, most prominent) ── */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center border border-border rounded-full px-3 py-2 w-[200px] lg:w-[260px] mr-3 shrink-0 bg-muted/30">
          <Search className="w-3.5 h-3.5 text-primary mr-2 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Audit a company..."
            className="bg-transparent border-none outline-none text-foreground font-sans text-nav w-full placeholder:text-muted-foreground"
          />
        </form>

        {/* ── Primary nav (desktop) ── */}
        <nav className="hidden md:flex items-center gap-0 h-full flex-1 min-w-0">
          {PRIMARY_NAV.map(item => {
            const requiresAuth = (item as any).auth && !user;
            const active = item.matchPaths.some(p => location.pathname.startsWith(p));
            const Icon = item.icon;
            const navClass = "font-sans text-nav px-3 h-full flex items-center border-b-2 transition-colors gap-1.5 whitespace-nowrap";
            return (
              <div key={item.id} className="h-full">
                {requiresAuth ? (
                  <button
                    onClick={() => setSignupModalOpen(true)}
                    className={cn(navClass, "border-transparent text-muted-foreground hover:text-foreground")}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    <Lock className="w-3 h-3 opacity-50" />
                  </button>
                ) : item.onClick ? (
                  <button
                    onClick={item.onClick}
                    className={cn(navClass, active ? "text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground")}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ) : (
                  <Link
                    to={item.path!}
                    className={cn(navClass, active ? "text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground")}
                  >
                    <Icon className="w-4 h-4" />
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
                "font-sans text-nav px-3 h-full flex items-center border-b-2 transition-colors gap-1 whitespace-nowrap",
                isMoreActive ? "text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              ··· <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute top-full left-0 hidden group-hover:block border border-border min-w-[220px] z-50 py-1 bg-popover rounded-md shadow-lg">
              {SECONDARY_NAV.map(sub => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  className="block px-4 py-2.5 font-sans text-nav text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors whitespace-nowrap"
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
              className="hidden lg:flex items-center gap-1.5 font-sans text-caption tracking-wider uppercase px-2 py-1 border border-civic-green/60 text-civic-green bg-civic-green/10 cursor-pointer hover:bg-civic-green/20 transition-colors whitespace-nowrap"
              title="Demo Safe Mode"
            >
              <Shield className="w-3 h-3" />
              Demo
            </button>
          )}
          {user && !isDemoSafe && (
            <div className="hidden lg:flex font-sans text-caption tracking-wider uppercase px-2 py-1 border border-primary/40 text-primary whitespace-nowrap">
              Pro
            </div>
          )}

          {/* Persona chip or quiz prompt */}
          {hasTakenQuiz ? (
            <PersonaChip />
          ) : (
            <Link
              to="/join"
              className="hidden sm:inline-flex whitespace-nowrap font-sans text-label text-primary hover-btn"
            >
              Get early access →
            </Link>
          )}

          <ThemeToggle />

          {isLoaded && !isFallback && (
            <>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-primary text-primary-foreground px-5 py-2 font-sans text-btn rounded-full hover:brightness-110 transition-all whitespace-nowrap">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="border border-primary text-primary px-5 py-2 font-sans text-btn rounded-full hover:bg-primary/10 transition-all whitespace-nowrap">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
            </>
          )}
          {isLoaded && isFallback && (
            <span className="font-sans text-caption text-muted-foreground whitespace-nowrap">Preview Mode</span>
          )}

          {/* Audit CTA */}
          <Link
            to="/browse"
            className="hidden sm:inline-flex items-center whitespace-nowrap font-sans transition-all hover:brightness-110 bg-primary text-primary-foreground rounded-full px-5 py-2 text-btn"
          >
            Audit →
          </Link>

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
          <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} className="flex items-center border border-border rounded-full px-3 py-2.5 mb-2 bg-muted/30">
            <Search className="w-3.5 h-3.5 text-primary mr-2 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Audit a company..."
              className="bg-transparent border-none outline-none text-foreground font-sans text-body w-full placeholder:text-muted-foreground"
            />
          </form>

          {/* Primary */}
          <Link to="/receipts" className="block px-3 py-3 font-sans text-nav text-primary font-semibold hover:text-foreground transition-colors">
            Receipts
          </Link>
          <button
            onClick={() => { setMobileMenuOpen(false); handleMyIntelligence(); }}
            className="block w-full text-left px-3 py-3 font-sans text-nav text-muted-foreground hover:text-foreground transition-colors"
          >
            My Intel
          </button>
          <Link to="/signal-alerts" className="block px-3 py-3 font-sans text-nav text-muted-foreground hover:text-foreground transition-colors">
            Signals
          </Link>
          {user ? (
            <Link to="/career-intelligence" className="block px-3 py-3 font-sans text-nav text-muted-foreground hover:text-foreground transition-colors">
              Career Map
            </Link>
          ) : (
            <button
              onClick={() => { setMobileMenuOpen(false); setSignupModalOpen(true); }}
              className="block w-full text-left px-3 py-3 font-sans text-nav text-muted-foreground"
            >
              Career Map <Lock className="w-3 h-3 inline opacity-50 ml-1" />
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-border/50 my-1" />

          {/* Secondary */}
          {SECONDARY_NAV.map(sub => (
            <Link
              key={sub.path}
              to={sub.path}
              className="block px-3 py-3 font-sans text-nav text-muted-foreground hover:text-foreground transition-colors"
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
