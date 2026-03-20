import { useLocation, useNavigate } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Heart, Route, Users, LayoutDashboard,
  Settings, User, Zap, Bell, ClipboardCheck, LogOut,
  Home, Compass, Building2, Network, FileText, MessageSquare,
  Inbox, Bookmark, PenTool, Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Align",
    items: [
      { id: "overview", label: "Dashboard", icon: Home },
      { id: "link:/jobs-feed", label: "Jobs Feed", icon: Briefcase },
      { id: "values", label: "My Values", icon: Heart },
      { id: "tracked", label: "Tracked Companies", icon: Building2 },
    ],
  },
  {
    label: "Apply",
    items: [
      { id: "auto-apply", label: "Apply When It Counts™", icon: Zap },
      { id: "tracker", label: "Application Tracker", icon: LayoutDashboard },
      { id: "link:/saved", label: "Saved", icon: Bookmark },
    ],
  },
  {
    label: "Prepare",
    items: [
      { id: "link:/resume", label: "Resume Optimizer", icon: FileText },
      { id: "link:/cover-letter", label: "Cover Letter", icon: PenTool },
      { id: "link:/mock-interview", label: "Mock Interview", icon: Mic },
      { id: "matches", label: "Interview Kits", icon: ClipboardCheck },
    ],
  },
  {
    label: "Activity",
    items: [
      { id: "link:/inbox", label: "Inbox", icon: Inbox },
      { id: "how", label: "Dossier History", icon: Route },
      { id: "alerts", label: "Signal Alerts", icon: Bell },
    ],
  },
  {
    label: "Settings",
    items: [
      { id: "preferences", label: "Preferences", icon: Settings },
      { id: "profile", label: "Profile", icon: User },
    ],
  },
];

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (id: string) => {
    if (id.startsWith("link:")) {
      navigate(id.slice(5));
    } else {
      onTabChange(id);
    }
  };

  const isActive = (id: string) => {
    if (id.startsWith("link:")) {
      return location.pathname === id.slice(5);
    }
    return activeTab === id;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Compass className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-foreground font-display">My Dashboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">Career Intelligence Hub</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60 font-semibold">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleClick(item.id)}
                      className={cn(
                        "transition-all duration-200 rounded-lg",
                        isActive(item.id)
                          ? "bg-primary/[0.08] text-foreground font-medium border border-primary/[0.08]"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <item.icon className={cn(
                        "w-4 h-4 shrink-0",
                        isActive(item.id) ? "text-primary" : ""
                      )} />
                      {!collapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
