import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentUploader } from "@/components/career/DocumentUploader";
import { CareerProfile } from "@/components/career/CareerProfile";
import { DreamJobAlerts } from "@/components/career/DreamJobAlerts";
import { MyDocuments } from "@/components/career/MyDocuments";
import { ResumeTailor } from "@/components/career/ResumeTailor";
import { DataWipeButton } from "@/components/career/DataWipeButton";
import { CareerJourneyTimeline } from "@/components/career/CareerJourneyTimeline";
import { MyValuesProfile } from "@/components/career/MyValuesProfile";
import { PersonalityProfile } from "@/components/career/PersonalityProfile";
import { HowDoIGetThere } from "@/components/career/HowDoIGetThere";
import { OutreachIntelligence } from "@/components/career/OutreachIntelligence";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Heart, Compass, Route, Users, Wand2, ChevronRight,
  CheckCircle2, Circle, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "upload", label: "Upload Resume", icon: Upload, description: "Upload your resume or career documents to build your profile." },
  { id: "values", label: "Define Values", icon: Heart, description: "Tell us what matters to you in an employer." },
  { id: "personality", label: "Work Style", icon: Upload, description: "Describe how you work best and your personality strengths." },
  { id: "explore", label: "Map My Path", icon: Compass, description: "Visualize your career journey with SMART goals." },
  { id: "plan", label: "Plan Your Move", icon: Route, description: "Get a gap analysis and learning plan for your target role." },
  { id: "connect", label: "Connect", icon: Users, description: "Find people who can help you get there." },
  { id: "apply", label: "Tailor & Apply", icon: Wand2, description: "Tailor your resume and set up job alerts." },
] as const;

type StepId = typeof STEPS[number]["id"];

export default function CareerMap() {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState<StepId>("upload");
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());

  useEffect(() => {
    if (!user) return;
    const ensureProfile = async () => {
      const { data } = await supabase
        .from("user_career_profile")
        .select("id, skills, industries")
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
      } else {
        // Auto-detect completed steps
        const done = new Set<StepId>();
        if ((data.skills as any[])?.length > 0) done.add("upload");
        if ((data.industries as any[])?.length > 0) done.add("values");
        setCompletedSteps(done);
        // Start at the first incomplete step
        const firstIncomplete = STEPS.find(s => !done.has(s.id));
        if (firstIncomplete) setActiveStep(firstIncomplete.id);
      }
    };
    ensureProfile();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const currentIndex = STEPS.findIndex(s => s.id === activeStep);
  const canGoNext = currentIndex < STEPS.length - 1;
  const canGoBack = currentIndex > 0;

  const markComplete = (step: StepId) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const goNext = () => {
    markComplete(activeStep);
    if (canGoNext) setActiveStep(STEPS[currentIndex + 1].id);
  };

  const renderContent = () => {
    switch (activeStep) {
      case "upload":
        return (
          <div className="space-y-6">
            <DocumentUploader onUploadComplete={() => {
              markComplete("upload");
              setActiveStep("values");
            }} />
            <MyDocuments />
          </div>
        );
      case "values":
        return <MyValuesProfile />;
      case "explore":
        return (
          <div className="space-y-6">
            <CareerMappingView />
            <CareerProfile />
          </div>
        );
      case "plan":
        return <HowDoIGetThere />;
      case "connect":
        return <OutreachIntelligence />;
      case "apply":
        return (
          <div className="space-y-6">
            <ResumeTailor />
            <DreamJobAlerts />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 font-display">
            Map My Career
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Follow these steps to build your career profile, explore paths, and plan your next move.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step progress bar */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
            {STEPS.map((step, i) => {
              const isActive = step.id === activeStep;
              const isCompleted = completedSteps.has(step.id);
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                    isActive && "bg-primary text-primary-foreground shadow-sm",
                    !isActive && isCompleted && "bg-primary/10 text-primary hover:bg-primary/15",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <step.icon className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Step header */}
          <Card className="mb-6 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              {(() => {
                const step = STEPS[currentIndex];
                return (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Step {currentIndex + 1} of {STEPS.length}</span>
                        {completedSteps.has(activeStep) && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-foreground font-display">{step.label}</h2>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {canGoBack && (
                        <Button variant="outline" size="sm" onClick={() => setActiveStep(STEPS[currentIndex - 1].id)}>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canGoNext && (
                        <Button size="sm" onClick={goNext} className="gap-1.5">
                          Next <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Step content */}
          {renderContent()}

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground mb-4 italic">
              This tool detects signals in uploaded documents and public sources. It does not provide legal, financial, or employment advice.
            </p>
            <DataWipeButton />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
