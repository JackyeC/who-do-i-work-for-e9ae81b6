import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploader } from "@/components/career/DocumentUploader";
import { CareerProfile } from "@/components/career/CareerProfile";
import { DreamJobAlerts } from "@/components/career/DreamJobAlerts";
import { MyDocuments } from "@/components/career/MyDocuments";
import { ResumeTailor } from "@/components/career/ResumeTailor";
import { DataWipeButton } from "@/components/career/DataWipeButton";
import { CareerChecklist } from "@/components/career/CareerChecklist";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText, User, Bell, Upload, Wand2, Compass, CheckCircle2 } from "lucide-react";
import { CareerMappingView } from "@/components/career/CareerMappingView";

export default function CareerIntelligence() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "upload");

  // Auto-create a career profile for every authenticated user
  useEffect(() => {
    if (!user) return;
    const ensureProfile = async () => {
      const { data } = await supabase
        .from("user_career_profile")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!data) {
        await supabase.from("user_career_profile").insert({
          user_id: user.id,
          auto_generated: true,
          skills: [],
          industries: [],
          job_titles: [],
        });
      }
    };
    ensureProfile();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 font-display">
            Map My Career
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Upload career documents for AI-powered signal analysis. Get career trajectory suggestions,
            skill gap identification, and dream job alerts based on your skills and values.
          </p>
          <p className="text-xs text-muted-foreground mt-2 max-w-xl mx-auto italic">
            This tool detects signals in uploaded documents and public sources. It provides educational insights only — not legal, financial, or employment advice.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="upload" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Upload className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <FileText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Docs</span>
            </TabsTrigger>
            <TabsTrigger value="tailor" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Wand2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tailor</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <User className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Bell className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="pathing" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Compass className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Next Move</span>
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Checklist</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <DocumentUploader onUploadComplete={() => setActiveTab("documents")} />
          </TabsContent>
          <TabsContent value="documents" className="mt-6">
            <MyDocuments />
          </TabsContent>
          <TabsContent value="tailor" className="mt-6">
            <ResumeTailor />
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <CareerProfile />
          </TabsContent>
          <TabsContent value="alerts" className="mt-6">
            <DreamJobAlerts />
          </TabsContent>
          <TabsContent value="pathing" className="mt-6">
            <CareerMappingView />
          </TabsContent>
          <TabsContent value="checklist" className="mt-6">
            <CareerChecklist />
          </TabsContent>
        </Tabs>

        {/* Data Wipe - always visible at bottom */}
        <div className="max-w-4xl mx-auto mt-8">
          <DataWipeButton />
        </div>
      </main>
      <Footer />
    </div>
  );
}
