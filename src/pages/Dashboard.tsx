import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePersona } from "@/hooks/use-persona";
import { Navigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { YourSignalDashboard } from "@/components/dashboard/YourSignalDashboard";
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
import { supabase } from "@/integrations/supabase/client";
import { OfferClarityWizard } from "@/components/offer-clarity/OfferClarityWizard";
import { PremiumGate } from "@/components/PremiumGate";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { JobsFeedSection } from "@/components/dashboard/JobsFeedSection";
import { TrackerSection } from "@/components/dashboard/TrackerSection";
import { ApplyKitSection } from "@/components/dashboard/ApplyKitSection";
import { MockInterviewSection } from "@/components/dashboard/MockInterviewSection";
import { InboxSection } from "@/components/dashboard/InboxSection";
import { SavedSection } from "@/components/dashboard/SavedSection";
import { DreamJobProfileSummaryCard } from "@/components/career/DreamJobProfileSummaryCard";

const TAB_TITLES: Record<string, string> = {
  overview: "Your Signal",
  tracked: "Tracked Companies",
  matches: "Matched Jobs",
  values: "My Values Profile",
  how: "How Do I Get There?",
  outreach: "Outreach Intelligence",
  tracker: "My Applications",
  "auto-apply": "Auto-Apply",
  relationships: "Relationship Intelligence",
  offers: "My Offer Checks",
  alerts: "Signal Alerts",
  preferences: "Preferences",
  profile: "My Profile",
  jobs: "Places That Deserve You",
  "app-tracker": "Tracker",
  "apply-kit": "Apply Kit",
  "mock-interview": "Mock Interview",
  "search-inbox": "Inbox",
  "search-saved": "Saved",
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { hasTakenQuiz } = usePersona();
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
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (loading || onboardingLoading) {
      const timer = setTimeout(() => setTimedOut(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [loading, onboardingLoading]);

  if (!timedOut && (loading || onboardingLoading)) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your signal…</p>
      </div>
    );
  }
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
        return <YourSignalDashboard />;
      case "tracked":
        return <SlotManagementDashboard />;
      case "matches":
        return <AlignedJobsList />;
      case "values":
        return (
          <div className="space-y-6">
            <DreamJobProfileSummaryCard compact showSync />
            <MyValuesProfile />
          </div>
        );
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
            <DreamJobProfileSummaryCard showSync />
            <AutoApplySettings />
            <ApplyQueueDashboard />
          </div>
        );
      }
      case "offers":
        return (
          <div className="space-y-6">
            <PremiumGate feature="Offer Clarity Check" requiredTier="candidate">
              <OfferClarityWizard />
            </PremiumGate>
            <div className="text-center">
              <a href="/my-offer-checks" className="text-sm text-muted-foreground hover:text-primary underline transition-colors">
                View past reports →
              </a>
            </div>
          </div>
        );
      case "alerts":
        return <UserAlertsList />;
      case "preferences":
        return <PreferenceCenter />;
      case "profile":
        return (
          <div className="space-y-6">
            <DreamJobProfileSummaryCard showSync />
            <UserProfileForm />
            <DataWipeButton />
          </div>
        );
      case "jobs":
        return <JobsFeedSection />;
      case "app-tracker":
        return <TrackerSection />;
      case "apply-kit":
        return <ApplyKitSection />;
      case "mock-interview":
        return <MockInterviewSection />;
      case "search-inbox":
        return <InboxSection />;
      case "search-saved":
        return <SavedSection />;
      default:
        return <YourSignalDashboard />;
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <Helmet>
        <title>Your Signal — Who Do I Work For?</title>
      </Helmet>

      {showOnboarding && (
        <FirstLoginOnboarding
          onComplete={() => {
            queryClient.setQueryData(["onboarding-status", user.id], true);
          }}
        />
      )}

      <div className="flex items-center gap-3 border-b border-border/30 px-6 h-12">
        <h1 className="text-sm font-semibold text-foreground truncate">
          {TAB_TITLES[tab] || "Your Signal"}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {showUpsell && <PostPurchaseUpsell onDismiss={dismissUpsell} />}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
