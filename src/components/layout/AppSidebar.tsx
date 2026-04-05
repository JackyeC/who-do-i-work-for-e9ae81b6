import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogIn, LogOut, Award } from "lucide-react";
import { useState } from "react";
import { FoundingMemberBadge } from "@/components/FoundingMemberBadge";
import logoSquare from "@/assets/wdiwf-logo-square.png";
import logoNav from "@/assets/wdiwf-logo-nav-light.png";

/* ------------------------------------------------------------------ */
/*  Nav items with colored dots                                        */
/* ------------------------------------------------------------------ */

interface NavItem {
  id: string;
  label: string;
  path: string;
  dotColor: string;          // Tailwind bg class
  badge?: string;
  badgeColor?: string;       // Tailwind text/bg classes
  auth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "command-center",
    label: "Command Center",
    path: "/dashboard",
    dotColor: "bg-[hsl(var(--primary))]",
    auth: true,
  },
  {
    id: "home",
    label: "Site Home",
    path: "/",
    dotColor: "bg-[hsl(var(--muted-foreground))]",
  },
  {
    id: "places",
    label: "Places That Deserve You",
    path: "/browse",
    dotColor: "bg-[#4ade80]",
    badge: "4",
    badgeColor: "text-[#4ade80] bg-[#4ade80]/10",
  },
  {
    id: "journey",
    label: "Your Journey",
    path: "/career-intelligence",
    dotColor: "bg-[#38bdf8]",
    auth: true,
  },
  {
    id: "watching",
    label: "Watching Your Back",
    path: "/intelligence",
    dotColor: "bg-[#fbbf24]",
  },
  {
    id: "work-signal",
    label: "The Work Signal",
    path: "/newsletter",
    dotColor: "bg-[#fb7185]",
  },
  {
    id: "apply-kit",
    label: "Your Apply Kit",
    path: "/apply-kit",
    dotColor: "bg-[hsl(var(--muted-foreground))]",
    auth: true,
  },
];

function isPathActive(itemPath: string, locationPathname: string) {
  if (itemPath === "/") return locationPathname === "/";
  return locationPathname.startsWith(itemPath);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [showBadge, setShowBadge] = useState(false);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      {/* ── Logo ── */}
      <SidebarHeader className="p-3">
        <Link to="/" className="flex items-center group">
          {collapsed ? (
            <img src={logoSquare} alt="W?" className="w-8 h-8 rounded-lg" />
          ) : (
            <img src={logoNav} alt="Who Do I Work For?" className="h-8" />
          )}
        </Link>
      </SidebarHeader>

      {/* ── Nav ── */}
      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                if (item.auth && !user) return null;
                const active = isPathActive(item.path, location.pathname);

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "transition-all duration-150 rounded-lg h-9",
                        active
                          ? "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <Link to={item.path} className="flex items-center gap-3">
                        {/* Colored dot */}
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            item.dotColor,
                            active && "ring-2 ring-[hsl(var(--primary)/0.3)]"
                          )}
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate text-sm">{item.label}</span>
                        )}
                        {!collapsed && item.badge && (
                          <span
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                              item.badgeColor || "text-muted-foreground bg-muted"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="p-3 space-y-2">
        {/* Founding Member card */}
        {user && !collapsed && (
          <button
            onClick={() => setShowBadge(true)}
            className="w-full rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-3.5 text-left hover:border-primary/40 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Founding Member
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
              You were here before day one. That means something. Your voice is shaping every feature we build.
            </p>
          </button>
        )}
        {user && collapsed && (
          <button
            onClick={() => setShowBadge(true)}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-primary/10 transition-colors"
            title="Founding Member"
          >
            <Award className="w-4 h-4 text-primary" />
          </button>
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
          <p className="text-xs text-muted-foreground text-center">
            Sign in for auto-apply, alerts & career tools
          </p>
        )}
      </SidebarFooter>

      {/* Founding Member Badge Modal */}
      {showBadge && (
        <FoundingMemberBadge
          memberName={user?.email?.split("@")[0]}
          joinedDate={user?.created_at}
          onClose={() => setShowBadge(false)}
        />
      )}
    </Sidebar>
  );
}
