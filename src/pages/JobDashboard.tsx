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
import { Briefcase, Settings, User, LayoutDashboard, Zap } from "lucide-react";

export default function JobDashboard() {
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
            Values-Based Job Matching
          </h1>
          <p className="text-muted-foreground mt-1">
            Find jobs at companies that align with your values. Know Before You Go by Jackye Clayton.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="matches" className="gap-1.5">
              <Briefcase className="w-4 h-4" />
              Aligned Jobs
            </TabsTrigger>
            <TabsTrigger value="auto-apply" className="gap-1.5">
              <Zap className="w-4 h-4" />
              Auto-Apply
            </TabsTrigger>
            <TabsTrigger value="tracker" className="gap-1.5">
              <LayoutDashboard className="w-4 h-4" />
              My Applications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1.5">
              <Settings className="w-4 h-4" />
              Signal Preferences
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <AlignedJobsList />
          </TabsContent>
          <TabsContent value="auto-apply">
            <div className="space-y-6">
              <AutoApplySettings />
              <ApplyQueueDashboard />
            </div>
          </TabsContent>
          <TabsContent value="tracker">
            <TrackingDashboard />
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
