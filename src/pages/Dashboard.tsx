import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { AlignedJobsList } from "@/components/jobs/AlignedJobsList";
import { PreferenceCenter } from "@/components/jobs/PreferenceCenter";
import { UserProfileForm } from "@/components/jobs/UserProfileForm";
import { TrackingDashboard } from "@/components/jobs/TrackingDashboard";
import { AutoApplySettings } from "@/components/jobs/AutoApplySettings";
import { ApplyQueueDashboard } from "@/components/jobs/ApplyQueueDashboard";
import { PurpleSquirrelOnboarding } from "@/components/jobs/PurpleSquirrelOnboarding";
import { SlotManagementDashboard } from "@/components/slots/SlotManagementDashboard";
import { UserAlertsList } from "@/components/UserAlerts";
import { MyValuesProfile } from "@/components/career/MyValuesProfile";
import { HowDoIGetThere } from "@/components/career/HowDoIGetThere";
import { OutreachIntelligence } from "@/components/career/OutreachIntelligence";
import { RelationshipDashboard } from "@/components/career/RelationshipDashboard";
import { FirstLoginOnboarding } from "@/components/FirstLoginOnboarding";
import { DataWipeButton } from "@/components/career/DataWipeButton";
import { PostPurchaseUpsell } from "@/components/PostPurchaseUpsell";
import { DecisionCheckpoint } from "@/components/dashboard/DecisionCheckpoint";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardCheck } from "lucide-react";

const TAB_TITLES: Record<string, string> = {
  overview: "Dashboard Overview",
  tracked: "Tracked Companies",
  matches: "Matched Jobs",
  values: "My Values Profile",
  how: "How Do I Get There?",
  outreach: "Outreach Intelligence",
  tracker: "Application Tracker",
  "auto-apply": "Auto-Apply",
  relationships: "Relationship Intelligence",
  offers: "My Offer Checks",
  alerts: "Signal Alerts",
  preferences: "Preferences",
  profile: "My Profile",
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const queryClient = useQueryClient();

  const setTab = (newTab: string) => {
    setSearchParams({ tab: newTab });
  };

  const { data: onboardingCompleted, isLoading: onboardingLoading } = useQuery({
    queryKey: ["onboarding-status", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user!.id)
        .maybeSingle();
      return data?.onboarding_completed ?? false;
    },
    enabled: !!user,
  });

  const creditPurchase = searchParams.get("credit_purchase");
  const [showUpsell, setShowUpsell] = useState(creditPurchase === "success");

  if (loading || onboardingLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const showOnboarding = onboardingCompleted === false;

  const dismissUpsell = () => {
    setShowUpsell(false);
    searchParams.delete("credit_purchase");
    setSearchParams(searchParams, { replace: true });
  };

  const renderContent = () => {
    switch (tab) {
      case "overview":
        return (
          <>
            <DecisionCheckpoint />
            <DashboardOverview onNavigate={setTab} />
          </>
        );
      case "tracked":
        return <SlotManagementDashboard />;
      case "matches":
        return <AlignedJobsList />;
      case "values":
        return <MyValuesProfile />;
      case "how":
        return <HowDoIGetThere />;
      case "outreach":
        return <OutreachIntelligence />;
      case "relationships":
        return <RelationshipDashboard />;
      case "tracker":
        return <TrackingDashboard />;
      case "auto-apply": {
        const hasCompleted = !!localStorage.getItem("purpleSquirrelParams");
        if (!hasCompleted) {
          return <PurpleSquirrelOnboarding onComplete={() => setTab("auto-apply")} />;
        }
        return (
          <div className="space-y-6">
            <AutoApplySettings />
            <ApplyQueueDashboard />
          </div>
        );
      }
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
        return (
          <div className="space-y-6">
            <UserProfileForm />
            <DataWipeButton />
          </div>
        );
      default:
        return <DashboardOverview onNavigate={setTab} />;
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {showOnboarding && (
        <FirstLoginOnboarding
          onComplete={() => {
            queryClient.setQueryData(["onboarding-status", user.id], true);
          }}
        />
      )}

      <div className="flex items-center gap-3 border-b border-border/30 px-6 h-12">
        <h1 className="text-sm font-semibold text-foreground truncate">
          {TAB_TITLES[tab] || "Dashboard"}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-5xl">
        {showUpsell && <PostPurchaseUpsell onDismiss={dismissUpsell} />}
        {renderContent()}
      </div>
    </div>
  );
}
