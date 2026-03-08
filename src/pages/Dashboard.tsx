import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { AlignedJobsList } from "@/components/jobs/AlignedJobsList";
import { PreferenceCenter } from "@/components/jobs/PreferenceCenter";
import { UserProfileForm } from "@/components/jobs/UserProfileForm";
import { TrackingDashboard } from "@/components/jobs/TrackingDashboard";
import { AutoApplySettings } from "@/components/jobs/AutoApplySettings";
import { ApplyQueueDashboard } from "@/components/jobs/ApplyQueueDashboard";
import { UserAlertsList } from "@/components/UserAlerts";
import {
  ClipboardCheck, Bookmark, Bell, Briefcase, LayoutDashboard,
  Settings, User, Zap, Map
} from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("matches");

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground font-display">
            My Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Your career intelligence hub — offers, jobs, applications, and alerts in one place.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="matches" className="gap-1.5">
              <Briefcase className="w-4 h-4" /> Matched Jobs
            </TabsTrigger>
            <TabsTrigger value="tracker" className="gap-1.5">
              <LayoutDashboard className="w-4 h-4" /> Applications
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-1.5">
              <ClipboardCheck className="w-4 h-4" /> My Offer Checks
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5">
              <Bell className="w-4 h-4" /> Signal Alerts
            </TabsTrigger>
            <TabsTrigger value="auto-apply" className="gap-1.5">
              <Zap className="w-4 h-4" /> Auto-Apply
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1.5">
              <Settings className="w-4 h-4" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="w-4 h-4" /> Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <AlignedJobsList />
          </TabsContent>
          <TabsContent value="tracker">
            <TrackingDashboard />
          </TabsContent>
          <TabsContent value="offers">
            <div className="text-center py-12">
              <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">My Offer Checks</h3>
              <p className="text-sm text-muted-foreground mb-4">View and compare your saved offer check reports.</p>
              <a href="/my-offer-checks" className="text-sm text-primary underline">Go to My Offer Checks →</a>
            </div>
          </TabsContent>
          <TabsContent value="alerts">
            <UserAlerts />
          </TabsContent>
          <TabsContent value="auto-apply">
            <div className="space-y-6">
              <AutoApplySettings />
              <ApplyQueueDashboard />
            </div>
          </TabsContent>
          <TabsContent value="preferences">
            <PreferenceCenter />
          </TabsContent>
          <TabsContent value="profile">
            <UserProfileForm />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
