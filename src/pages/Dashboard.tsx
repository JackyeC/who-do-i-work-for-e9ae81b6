import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { AlignedJobsList } from "@/components/jobs/AlignedJobsList";
import { PreferenceCenter } from "@/components/jobs/PreferenceCenter";
import { UserProfileForm } from "@/components/jobs/UserProfileForm";
import { TrackingDashboard } from "@/components/jobs/TrackingDashboard";
import { AutoApplySettings } from "@/components/jobs/AutoApplySettings";
import { ApplyQueueDashboard } from "@/components/jobs/ApplyQueueDashboard";
import { UserAlertsList } from "@/components/UserAlerts";
import { MyValuesProfile } from "@/components/career/MyValuesProfile";
import { HowDoIGetThere } from "@/components/career/HowDoIGetThere";
import { OutreachIntelligence } from "@/components/career/OutreachIntelligence";
import { ClipboardCheck } from "lucide-react";

const TAB_TITLES: Record<string, string> = {
  overview: "Dashboard Overview",
  matches: "Matched Jobs",
  values: "My Values Profile",
  how: "How Do I Get There?",
  outreach: "Outreach Intelligence",
  tracker: "Application Tracker",
  "auto-apply": "Auto-Apply",
  offers: "My Offer Checks",
  alerts: "Signal Alerts",
  preferences: "Preferences",
  profile: "My Profile",
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";

  const setTab = (newTab: string) => {
    setSearchParams({ tab: newTab });
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const renderContent = () => {
    switch (tab) {
      case "overview":
        return <DashboardOverview onNavigate={setTab} />;
      case "matches":
        return <AlignedJobsList />;
      case "values":
        return <MyValuesProfile />;
      case "how":
        return <HowDoIGetThere />;
      case "outreach":
        return <OutreachIntelligence />;
      case "tracker":
        return <TrackingDashboard />;
      case "auto-apply":
        return (
          <div className="space-y-6">
            <AutoApplySettings />
            <ApplyQueueDashboard />
          </div>
        );
      case "offers":
        return (
          <div className="text-center py-12">
            <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">My Offer Checks</h3>
            <p className="text-sm text-muted-foreground mb-4">View and compare your saved offer check reports.</p>
            <a href="/my-offer-checks" className="text-sm text-primary underline">Go to My Offer Checks →</a>
          </div>
        );
      case "alerts":
        return <UserAlertsList />;
      case "preferences":
        return <PreferenceCenter />;
      case "profile":
        return <UserProfileForm />;
      default:
        return <DashboardOverview onNavigate={setTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <SidebarProvider>
        <div className="flex-1 flex w-full">
          <DashboardSidebar activeTab={tab} onTabChange={setTab} />
          <main className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-3 border-b border-border/30 px-6 h-12">
              <SidebarTrigger className="-ml-1" />
              <h1 className="text-sm font-semibold text-foreground truncate">
                {TAB_TITLES[tab] || "Dashboard"}
              </h1>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 max-w-5xl">
              {renderContent()}
            </div>
          </main>
        </div>
      </SidebarProvider>
      <Footer />
    </div>
  );
}
