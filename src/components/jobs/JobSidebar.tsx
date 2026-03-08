import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, Briefcase, Bookmark, LayoutDashboard, FileText,
  Settings, User, Sparkles, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Search Jobs", icon: Search, path: "/jobs", exact: true },
  { label: "Matched Jobs", icon: Sparkles, path: "/job-dashboard", auth: true },
  { label: "My Applications", icon: LayoutDashboard, path: "/job-dashboard?tab=tracker", auth: true },
  { label: "Saved Jobs", icon: Bookmark, path: "/job-dashboard?tab=saved", auth: true },
  { label: "Career Intel", icon: FileText, path: "/career-intelligence", auth: true },
];

const SETTINGS_ITEMS = [
  { label: "Signal Preferences", icon: Settings, path: "/job-dashboard?tab=preferences", auth: true },
  { label: "My Profile", icon: User, path: "/job-dashboard?tab=profile", auth: true },
];

export function JobSidebar() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-sidebar-background hidden lg:flex flex-col h-[calc(100vh-64px)] sticky top-16">
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Main</p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            if (item.auth && !user) return null;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname + location.search === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 mt-6">Settings</p>
        <nav className="space-y-0.5">
          {SETTINGS_ITEMS.map((item) => {
            if (item.auth && !user) return null;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {!user && (
        <div className="p-4 border-t border-border">
          <Link to="/login">
            <Button variant="default" size="sm" className="w-full gap-2">
              <LogIn className="w-4 h-4" /> Sign In
            </Button>
          </Link>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Sign in to unlock matching & tracking
          </p>
        </div>
      )}
    </aside>
  );
}
