import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search, Menu, X, LayoutDashboard, ClipboardCheck,
  ChevronDown, Building2, PlusCircle, TrendingUp, ScanSearch,
  Briefcase, FileCheck, Map, Heart, Leaf, Users, Scale,
  Stethoscope, ShieldAlert, GraduationCap, Globe2, ShoppingCart,
  FileText, BarChart3, Eye, Landmark, Network, Home,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Dropdown data                                                      */
/* ------------------------------------------------------------------ */

const EXPLORE_ITEMS = [
  { to: "/search", label: "Search Everything", icon: Search },
  { to: "/add-company", label: "Add Company", icon: PlusCircle },
  { to: "/browse", label: "Company Directory", icon: Building2 },
  { to: "/examples", label: "Top Searched Companies", icon: TrendingUp },
  { to: "/search-your-employer", label: "Recent Scans", icon: ScanSearch },
];

const CAREER_SECTIONS = [
  {
    heading: "Evaluate Employers",
    items: [
      { to: "/check?tab=company", label: "Employer Scan", icon: Briefcase, desc: "Research who you really work for" },
      { to: "/check?tab=offer", label: "Offer Check", icon: FileCheck, desc: "Evaluate an offer before you accept" },
    ],
  },
  {
    heading: "Career Direction",
    items: [
      { to: "/career-map", label: "Career Path Explorer", icon: Map, desc: "Map where your career could go" },
    ],
  },
];

const VALUES_ISSUES = [
  { to: "/values-search?issue=climate", label: "Climate", icon: Leaf },
  { to: "/values-search?issue=labor_rights", label: "Labor Rights", icon: Users },
  { to: "/values-search?issue=civil_rights", label: "Civil Rights", icon: Scale },
  { to: "/values-search?issue=healthcare", label: "Healthcare", icon: Stethoscope },
  { to: "/values-search?issue=gun_policy", label: "Gun Policy", icon: ShieldAlert },
  { to: "/values-search?issue=education", label: "Education", icon: GraduationCap },
  { to: "/values-search?issue=immigration", label: "Immigration", icon: Globe2 },
  { to: "/values-search?issue=consumer_protection", label: "Consumer Protection", icon: ShoppingCart },
  { to: "/values-search?issue=reproductive_rights", label: "Reproductive Rights", icon: Heart },
  { to: "/values-search?issue=voting_rights", label: "Voting Rights", icon: Landmark },
  { to: "/values-search?issue=lgbtq_rights", label: "LGBTQ+ Rights", icon: Heart },
];

const INTELLIGENCE_ITEMS = [
  { to: "/intelligence", label: "Investigations", icon: FileText },
  { to: "/intelligence?type=policy_alert", label: "Policy Reports", icon: BarChart3 },
  { to: "/intelligence?type=weekly_brief", label: "Signals This Week", icon: Eye },
  { to: "/intelligence?type=legislative_watch", label: "Legislation Watch", icon: Landmark },
  { to: "/check?tab=candidate", label: "Corporate Influence Map", icon: Network },
];

/* ------------------------------------------------------------------ */
/*  Generic dropdown wrapper                                           */
/* ------------------------------------------------------------------ */

function NavDropdown({
  label,
  icon: Icon,
  children,
  active,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const enter = () => {
    clearTimeout(timeout.current);
    setOpen(true);
  };
  const leave = () => {
    timeout.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearTimeout(timeout.current), []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <button
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors",
          active
            ? "text-foreground bg-accent"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 pt-2 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
          onMouseEnter={enter}
          onMouseLeave={leave}
        >
          <div
            className="min-w-[240px] rounded-xl border border-border/60 bg-popover shadow-lg p-1.5"
            onClick={() => setOpen(false)}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dropdown primitives                                                */
/* ------------------------------------------------------------------ */

function DropItem({
  to,
  label,
  icon: Icon,
  desc,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
  desc?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-accent group"
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
      <div className="flex flex-col">
        <span className="font-medium text-foreground leading-tight">{label}</span>
        {desc && (
          <span className="text-xs text-muted-foreground leading-snug mt-0.5">
            {desc}
          </span>
        )}
      </div>
    </Link>
  );
}

function DropHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 pt-2.5 pb-1">
      {children}
    </p>
  );
}

function DropDivider() {
  return <div className="h-px bg-border/60 my-1.5 mx-2" />;
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

export function Header() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (paths: string[]) =>
    paths.some((p) => {
      const [base, qs] = p.split("?");
      if (qs) return location.pathname === base && location.search.includes(qs);
      return location.pathname === base;
    });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header
      className="border-b border-border/30 bg-card/90 backdrop-blur-xl sticky top-0 z-50"
      style={{
        boxShadow:
          "0 1px 0 hsl(38 72% 50% / 0.06), 0 4px 20px -4px hsl(var(--foreground) / 0.04)",
      }}
    >
      <div className="container mx-auto px-4 h-[4.5rem] flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <ClipboardCheck className="w-[18px] h-[18px] text-primary-foreground relative z-10" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold text-foreground tracking-tight font-display">
              Who Do I Work For?
            </span>
            <span className="text-[7px] text-civic-gold tracking-[0.18em] uppercase font-semibold mt-0.5">
              Career Intelligence by Jackye Clayton
            </span>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {/* Home */}
          <Link
            to="/"
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors",
              location.pathname === "/"
                ? "text-foreground bg-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>

          {/* Explore */}
          <NavDropdown
            label="Explore"
            icon={Search}
            active={isActive(["/search", "/add-company", "/browse", "/examples", "/search-your-employer"])}
          >
            {EXPLORE_ITEMS.map((item) => (
              <DropItem key={item.to} {...item} />
            ))}
          </NavDropdown>

          {/* Career */}
          <NavDropdown
            label="Career"
            icon={Briefcase}
            active={isActive(["/check", "/career-map", "/jobs"])}
          >
            {CAREER_SECTIONS.map((section, i) => (
              <div key={section.heading}>
                {i > 0 && <DropDivider />}
                <DropHeading>{section.heading}</DropHeading>
                {section.items.map((item) => (
                  <DropItem key={item.to} {...item} />
                ))}
              </div>
            ))}
            <DropDivider />
            <DropItem to="/jobs" label="Job Board" icon={Briefcase} desc="Browse values-aligned jobs" />
          </NavDropdown>

          {/* Values */}
          <NavDropdown
            label="Values"
            icon={Heart}
            active={isActive(["/values-search"])}
          >
            <DropItem
              to="/values-search"
              label="Values Search"
              icon={Heart}
              desc="Explore companies by issue signals"
            />
            <DropDivider />
            <DropHeading>Issue Areas</DropHeading>
            <div className="grid grid-cols-2 gap-0.5">
              {VALUES_ISSUES.map((item) => (
                <DropItem key={item.to} {...item} />
              ))}
            </div>
          </NavDropdown>

          {/* Intelligence */}
          <NavDropdown
            label="Intelligence"
            icon={FileText}
            active={isActive(["/intelligence"])}
          >
            {INTELLIGENCE_ITEMS.map((item) => (
              <DropItem key={item.to} {...item} />
            ))}
          </NavDropdown>

          {/* Dashboard */}
          {user && (
            <Link
              to="/dashboard"
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors",
                isActive(["/dashboard"])
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          )}
        </nav>

        {/* ── Right side: search + auth ── */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, leaders, policies…"
              className="h-9 w-[200px] xl:w-[260px] pl-8 text-sm rounded-xl bg-muted/50 border-border/40 focus:w-[280px] xl:focus:w-[320px] transition-all duration-200"
            />
          </form>
          {!user && (
            <Link to="/login">
              <Button
                size="sm"
                variant="default"
                className="shadow-elevated font-semibold rounded-xl px-5"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* ── Mobile toggle ── */}
        <button
          className="lg:hidden p-2.5 -mr-2 text-muted-foreground hover:text-foreground rounded-lg active:bg-accent transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile nav ── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/40 bg-card px-4 py-4 max-h-[80vh] overflow-y-auto animate-fade-in space-y-4">
          {/* Mobile search */}
          <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies, leaders, policies…"
                className="pl-9 rounded-xl"
              />
            </div>
          </form>

          {/* Home */}
          <MobileLink to="/" label="Home" icon={Home} onClick={() => setMobileOpen(false)} active={location.pathname === "/"} />

          {/* Explore */}
          <MobileSection title="Explore">
            {EXPLORE_ITEMS.map((item) => (
              <MobileLink key={item.to} {...item} onClick={() => setMobileOpen(false)} />
            ))}
          </MobileSection>

          {/* Career */}
          <MobileSection title="Career">
            {CAREER_SECTIONS.map((section) =>
              section.items.map((item) => (
                <MobileLink key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={() => setMobileOpen(false)} />
              ))
            )}
            <MobileLink to="/jobs" label="Job Board" icon={Briefcase} onClick={() => setMobileOpen(false)} />
          </MobileSection>

          {/* Values */}
          <MobileSection title="Values">
            <MobileLink to="/values-search" label="Values Search" icon={Heart} onClick={() => setMobileOpen(false)} />
            {VALUES_ISSUES.map((item) => (
              <MobileLink key={item.to} {...item} onClick={() => setMobileOpen(false)} />
            ))}
          </MobileSection>

          {/* Intelligence */}
          <MobileSection title="Intelligence">
            {INTELLIGENCE_ITEMS.map((item) => (
              <MobileLink key={item.to} {...item} onClick={() => setMobileOpen(false)} />
            ))}
          </MobileSection>

          {/* Dashboard / Auth */}
          <div className="pt-2 border-t border-border/40 space-y-2">
            {user ? (
              <MobileLink to="/dashboard" label="Dashboard" icon={LayoutDashboard} onClick={() => setMobileOpen(false)} />
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="default" size="default" className="w-full rounded-xl">
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

/* ── Mobile helpers ── */

function MobileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1 px-1">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MobileLink({
  to,
  label,
  icon: Icon,
  onClick,
  active,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 text-sm font-medium py-2.5 px-3 rounded-lg transition-colors",
        active
          ? "text-foreground bg-accent"
          : "text-muted-foreground hover:text-foreground active:bg-accent/50"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}
