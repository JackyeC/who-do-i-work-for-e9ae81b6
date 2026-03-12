import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Search, Sun, Moon, ClipboardCheck, LogIn, LogOut,
  Landmark, Building2, Briefcase, LayoutDashboard,
  ChevronDown, Menu, X, TrendingUp,
} from "lucide-react";

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export const MAIN_SECTIONS = [
  {
    id: "policy",
    label: "Policy",
    icon: Landmark,
    path: "/policy",
    matchPaths: ["/policy", "/intelligence", "/follow-the-money"],
    subItems: [
      { label: "Policy Impact Hub", path: "/policy" },
      { label: "Follow the Money", path: "/follow-the-money" },
      { label: "Evidence Receipts", path: "/intelligence" },
      { label: "Signals This Week", path: "/intelligence?type=weekly_brief" },
    ],
  },
  {
    id: "companies",
    label: "Companies",
    icon: Building2,
    path: "/browse",
    matchPaths: ["/browse", "/search", "/company/", "/dossier/", "/add-company", "/examples", "/search-your-employer", "/values-search", "/recruiting"],
    subItems: [
      { label: "Employer Directory", path: "/browse" },
      { label: "Signal Search", path: "/values-search" },
      { label: "Add Company", path: "/add-company" },
      { label: "EVP Audit", path: "/recruiting?tab=evp" },
      { label: "Talent Dashboard", path: "/recruiting?tab=insights" },
    ],
  },
  {
    id: "careers",
    label: "Careers",
    icon: Briefcase,
    path: "/check",
    matchPaths: ["/check", "/career-map", "/jobs", "/offer-check", "/offer-clarity", "/offer-review", "/strategic-offer-review"],
    subItems: [
      { label: "Employer Scan", path: "/check?tab=company" },
      { label: "Offer Check", path: "/check?tab=offer" },
      { label: "Career Discovery", path: "/career-map", auth: true },
      { label: "Job Board", path: "/jobs" },
      { label: "Offer Clarity", path: "/offer-clarity" },
    ],
  },
  {
    id: "economy",
    label: "Economy",
    icon: TrendingUp,
    path: "/economy",
    matchPaths: ["/economy"],
    subItems: [
      { label: "Economic Dashboard", path: "/economy" },
      { label: "Industry Growth", path: "/economy?view=industries" },
      { label: "Labor Market", path: "/economy?view=labor" },
      { label: "Federal Spending", path: "/economy?view=spending" },
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    matchPaths: ["/dashboard"],
    auth: true,
    subItems: [
      { label: "Overview", path: "/dashboard" },
      { label: "Tracked Companies", path: "/dashboard?tab=tracked" },
      { label: "Matched Jobs", path: "/dashboard?tab=matches" },
      { label: "Signal Alerts", path: "/dashboard?tab=alerts" },
      { label: "Preferences", path: "/dashboard?tab=preferences" },
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>();
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
    setOpenDropdown(null);
  }, [location.pathname, location.search]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-card/95 backdrop-blur-md">
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 mr-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <ClipboardCheck className="w-4 h-4 text-primary-foreground relative z-10" />
          </div>
          <div className="hidden lg:block leading-none">
            <p className="text-sm font-bold text-foreground tracking-tight font-display">
              CivicLens
            </p>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Policy → Company → Career</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {MAIN_SECTIONS.map(section => {
            if (section.auth && !user) return null;
            const active = isSectionActive(section, location.pathname);
            const hasDropdown = section.subItems.length > 0;
            const Icon = section.icon;

            return (
              <div
                key={section.id}
                className="relative"
                onMouseEnter={() => {
                  if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
                  if (hasDropdown) setOpenDropdown(section.id);
                }}
                onMouseLeave={() => {
                  dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
                }}
              >
                <Link
                  to={section.path}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "text-primary font-semibold bg-primary/[0.08]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                  {hasDropdown && <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />}
                </Link>

                {hasDropdown && openDropdown === section.id && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-popover border border-border rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                    {section.subItems.map(sub => {
                      if ((sub as any).auth && !user) return null;
                      const [subBase, subQs] = sub.path.split("?");
                      const subActive = subQs
                        ? location.pathname === subBase && location.search.includes(subQs)
                        : location.pathname === subBase;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={cn(
                            "block px-4 py-2 text-sm transition-colors",
                            subActive
                              ? "text-primary font-medium bg-primary/5"
                              : "text-foreground hover:bg-accent/50"
                          )}
                          onClick={() => setOpenDropdown(null)}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden lg:block">
            <ViewModeToggle />
          </div>

          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employers…"
              className="h-8 w-[160px] xl:w-[200px] pl-8 text-sm rounded-xl bg-muted/50 border-border/40 focus:w-[240px] transition-all duration-200"
            />
          </form>

          <ThemeToggle />

          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive gap-1.5 hidden sm:flex"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sign Out</span>
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="default" size="sm" className="gap-1.5 rounded-xl">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          )}

          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/30 bg-card py-2 px-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {MAIN_SECTIONS.map(section => {
            if (section.auth && !user) return null;
            const active = isSectionActive(section, location.pathname);
            const Icon = section.icon;
            return (
              <div key={section.id}>
                <Link
                  to={section.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    active ? "text-primary font-semibold bg-primary/[0.08]" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </Link>
                {active && section.subItems.length > 0 && (
                  <div className="ml-8 space-y-0.5 mb-1">
                    {section.subItems.map(sub => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
