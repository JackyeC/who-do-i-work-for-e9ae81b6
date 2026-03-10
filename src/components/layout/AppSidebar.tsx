import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home, Search, Building2, PlusCircle, TrendingUp, ScanSearch, Heart,
  Briefcase, FileCheck, Map, FileText, BarChart3, Eye, Landmark, Network,
  Megaphone, Users, Target,
  LayoutDashboard, Zap, Bell, Settings, User, ClipboardCheck,
  LogIn, LogOut, Compass, Flame, Shield,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Nav structure                                                      */
/* ------------------------------------------------------------------ */

const NAV_GROUPS = [
  {
    label: "Home",
    items: [
      { id: "home", label: "Home", icon: Home, path: "/" },
    ],
  },
  {
    label: "Explore",
    items: [
      { id: "search", label: "Search Everything", icon: Search, path: "/search" },
      { id: "browse", label: "Employer Directory", icon: Building2, path: "/browse" },
      { id: "add-company", label: "Add Company", icon: PlusCircle, path: "/add-company" },
      { id: "examples", label: "Top Searched", icon: TrendingUp, path: "/examples" },
      { id: "recent-scans", label: "Recent Scans", icon: ScanSearch, path: "/search-your-employer" },
      { id: "values-search", label: "Signal Search", icon: Heart, path: "/values-search" },
    ],
  },
  {
    label: "Career",
    items: [
      { id: "employer-scan", label: "Employer Scan", icon: Briefcase, path: "/check?tab=company" },
      { id: "offer-check", label: "Offer Check", icon: FileCheck, path: "/check?tab=offer" },
      { id: "career-map", label: "Career Path Explorer", icon: Map, path: "/career-map", auth: true },
      { id: "jobs", label: "Job Board", icon: Briefcase, path: "/jobs" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "receipts", label: "Evidence Receipts", icon: FileText, path: "/intelligence" },
      { id: "policy-signals", label: "Policy Signals", icon: BarChart3, path: "/intelligence?type=policy_alert" },
      { id: "signals-week", label: "Signals This Week", icon: Eye, path: "/intelligence?type=weekly_brief" },
      { id: "legislation", label: "Legislation Watch", icon: Landmark, path: "/intelligence?type=legislative_watch" },
      { id: "influence-map", label: "Influence Map", icon: Network, path: "/check?tab=candidate" },
      { id: "evp-audit", label: "EVP Audit", icon: Megaphone, path: "/recruiting?tab=evp" },
      { id: "talent-dash", label: "Talent Dashboard", icon: Target, path: "/recruiting?tab=insights" },
    ],
  },
  {
    label: "Dashboard",
    auth: true,
    items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
      { id: "tracked", label: "Tracked Companies", icon: Building2, path: "/dashboard?tab=tracked" },
      { id: "matched-jobs", label: "Matched Jobs", icon: Briefcase, path: "/dashboard?tab=matches" },
      { id: "auto-apply", label: "Auto-Apply", icon: Zap, path: "/dashboard?tab=auto-apply" },
      { id: "alerts", label: "Signal Alerts", icon: Bell, path: "/dashboard?tab=alerts" },
      { id: "preferences", label: "Preferences", icon: Settings, path: "/dashboard?tab=preferences" },
      { id: "profile", label: "Profile", icon: User, path: "/dashboard?tab=profile" },
    ],
  },
];

function isPathActive(itemPath: string, locationPathname: string, locationSearch: string) {
  const [base, qs] = itemPath.split("?");
  if (qs) {
    return locationPathname === base && locationSearch.includes(qs);
  }
  // Exact match for home
  if (base === "/") return locationPathname === "/";
  return locationPathname.startsWith(base);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const location = useLocation();
  

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      {/* ── Logo ── */}
      <SidebarHeader className="p-3">
        <Link to="/" className="flex items-center gap-2.5 group px-1">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <ClipboardCheck className="w-[16px] h-[16px] text-primary-foreground relative z-10" />
          </div>
          {!collapsed && (
            <div className="leading-none overflow-hidden">
              <p className="text-sm font-bold text-foreground tracking-tight font-display truncate">
                Who Do I Work For?
              </p>
              <p className="text-[7px] text-civic-gold tracking-[0.14em] uppercase font-semibold mt-0.5">
                Talent Intelligence
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* ── Nav groups ── */}
      <SidebarContent className="px-2">
        {NAV_GROUPS.map((group) => {
          // Hide auth-required groups for logged-out users
          if ((group as any).auth && !user) return null;
          const groupHasActive = group.items.some((item) =>
            isPathActive(item.path, location.pathname, location.search)
          );

          return (
            <SidebarGroup key={group.label}>
              {group.label !== "Home" && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-semibold px-3">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    if ((item as any).auth && !user) return null;
                    const active = isPathActive(item.path, location.pathname, location.search);
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            "transition-all duration-150 rounded-lg",
                            active
                              ? "bg-primary/[0.08] text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          <Link to={item.path}>
                            <item.icon
                              className={cn(
                                "w-4 h-4 shrink-0",
                                active ? "text-primary" : ""
                              )}
                            />
                            {!collapsed && <span>{item.label}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* ── Footer: Civic Impact + Auth ── */}
      <SidebarFooter className="p-3 space-y-2">
        {/* Civic Impact counter */}
        {user && !collapsed && (
          <div className="rounded-xl bg-gradient-to-br from-civic-gold/10 to-primary/5 border border-civic-gold/15 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3.5 h-3.5 text-civic-gold" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                My Civic Impact
              </span>
            </div>
            <p className="text-lg font-bold text-foreground font-display leading-none">
              0 <span className="text-xs font-normal text-muted-foreground">signals uncovered</span>
            </p>
          </div>
        )}

        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className={cn(
              "w-full justify-start gap-2 text-muted-foreground hover:text-destructive rounded-lg",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && "Sign Out"}
          </Button>
        ) : (
          <Link to="/login">
            <Button
              variant="default"
              size="sm"
              className={cn("w-full gap-2 rounded-xl", collapsed && "px-0")}
            >
              <LogIn className="w-4 h-4" />
              {!collapsed && "Sign In"}
            </Button>
          </Link>
        )}

        {!user && !collapsed && (
          <p className="text-[10px] text-muted-foreground text-center">
            Sign in for auto-apply, alerts & career tools
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
