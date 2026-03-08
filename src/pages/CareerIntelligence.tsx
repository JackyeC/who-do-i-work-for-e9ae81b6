import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploader } from "@/components/career/DocumentUploader";
import { CareerProfile } from "@/components/career/CareerProfile";
import { DreamJobAlerts } from "@/components/career/DreamJobAlerts";
import { MyDocuments } from "@/components/career/MyDocuments";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { FileText, User, Bell, Upload } from "lucide-react";

export default function CareerIntelligence() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upload");

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
            Career Intelligence
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Upload career documents for AI-powered signal analysis. Get risk detection on offers, 
            build your career profile from your resume, and receive dream job alerts.
          </p>
          <p className="text-xs text-muted-foreground mt-2 max-w-xl mx-auto italic">
            This tool detects signals in uploaded documents and public sources. It does not provide legal, financial, or employment advice.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Upload className="w-3.5 h-3.5" /> Upload
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <FileText className="w-3.5 h-3.5" /> Documents
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <User className="w-3.5 h-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Bell className="w-3.5 h-3.5" /> Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <DocumentUploader onUploadComplete={() => setActiveTab("documents")} />
          </TabsContent>
          <TabsContent value="documents" className="mt-6">
            <MyDocuments />
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <CareerProfile />
          </TabsContent>
          <TabsContent value="alerts" className="mt-6">
            <DreamJobAlerts />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
