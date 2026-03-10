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
  Home, Compass, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Overview",
    items: [
      { id: "overview", label: "Dashboard", icon: Home },
      { id: "tracked", label: "Tracked Companies", icon: Building2 },
    ],
  },
  {
    label: "Career Intelligence",
    items: [
      { id: "matches", label: "Matched Jobs", icon: Briefcase },
      { id: "values", label: "My Values", icon: Heart },
      { id: "how", label: "How Do I Get There?", icon: Route },
      { id: "outreach", label: "Outreach", icon: Users },
    ],
  },
  {
    label: "Applications",
    items: [
      { id: "tracker", label: "Application Tracker", icon: LayoutDashboard },
      { id: "auto-apply", label: "Auto-Apply", icon: Zap },
      { id: "offers", label: "Offer Checks", icon: ClipboardCheck },
    ],
  },
  {
    label: "Settings",
    items: [
      { id: "alerts", label: "Signal Alerts", icon: Bell },
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
              <p className="text-[10px] text-muted-foreground mt-0.5">Career Intelligence Hub</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-semibold">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "transition-all duration-200 rounded-lg",
                        activeTab === item.id
                          ? "bg-primary/[0.08] text-foreground font-medium border border-primary/[0.08]"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <item.icon className={cn(
                        "w-4 h-4 shrink-0",
                        activeTab === item.id ? "text-primary" : ""
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
