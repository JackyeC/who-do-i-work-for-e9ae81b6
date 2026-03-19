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
import { SkillGapBridge } from "@/components/career/SkillGapBridge";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText, User, Bell, Upload, Wand2, Compass, CheckCircle2, Zap } from "lucide-react";
import { CareerMappingView } from "@/components/career/CareerMappingView";
import { EmployerDossierSearch, type CompanyResult } from "@/components/career/EmployerDossierSearch";
import { EmployerDossierCard } from "@/components/career/EmployerDossierCard";
import { BeforeYouAcceptBlock } from "@/components/career/BeforeYouAcceptBlock";
import { WhatThisMeansForYou } from "@/components/career/WhatThisMeansForYou";
import { SampleDossierPreview } from "@/components/career/SampleDossierPreview";
import { CompanyResearchTrigger } from "@/components/research/CompanyResearchTrigger";

export default function CareerIntelligence() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "upload");
  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null);
  const [unknownCompanyName, setUnknownCompanyName] = useState<string | null>(null);

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

  const handleUploadComplete = () => {
    setActiveTab("documents");
    if (user) {
      supabase.functions.invoke("dream-job-detect", {
        body: { user_id: user.id },
      }).then(({ data }) => {
        if (data?.alertsCreated > 0) {
          console.log(`Background scan: ${data.alertsCreated} dream job matches found`);
        }
      }).catch((err) => {
        console.error("Background dream job scan failed:", err);
      });
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 font-display">
            You vetted the role. We vet the employer.
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Analyze compensation risk, leadership signals, hiring practices, and company behavior — before you accept an offer.
          </p>
        </div>

        {/* Employer Dossier Search */}
        <EmployerDossierSearch
          onSelect={(c) => { setSelectedCompany(c); setUnknownCompanyName(null); }}
          selectedCompany={selectedCompany}
          onNotFound={(name) => { setUnknownCompanyName(name); setSelectedCompany(null); }}
        />

        {/* Research trigger for unknown companies */}
        {unknownCompanyName && !selectedCompany && (
          <div className="max-w-2xl mx-auto mb-8">
            <CompanyResearchTrigger companyName={unknownCompanyName} />
          </div>
        )}

        {/* Dossier Results or Sample Preview */}
        {selectedCompany ? (
          <div className="mb-8">
            <EmployerDossierCard company={selectedCompany} />
            <BeforeYouAcceptBlock company={selectedCompany} />
            <WhatThisMeansForYou company={selectedCompany} />
          </div>
        ) : !unknownCompanyName ? (
          <div className="mb-8">
            <SampleDossierPreview />
          </div>
        ) : null}

        {/* Deep Dive Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-8">
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
            <TabsTrigger value="gigs" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Zap className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Gigs</span>
            </TabsTrigger>
            <TabsTrigger value="pathing" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Compass className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Next Move</span>
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Checklist</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <DocumentUploader onUploadComplete={handleUploadComplete} />
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
          <TabsContent value="gigs" className="mt-6">
            <SkillGapBridge />
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
