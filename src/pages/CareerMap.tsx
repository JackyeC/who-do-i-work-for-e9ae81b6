import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileInputStep } from "@/components/career-discovery/ProfileInputStep";
import { CareerAnchorsStep } from "@/components/career-discovery/CareerAnchorsStep";
import { TargetDestinationStep } from "@/components/career-discovery/TargetDestinationStep";
import { AICareerDiscoveryStep } from "@/components/career-discovery/AICareerDiscoveryStep";
import { AICompanyDiscoveryStep } from "@/components/career-discovery/AICompanyDiscoveryStep";
import { SkillGapStep } from "@/components/career-discovery/SkillGapStep";
import { MultipleFuturesStep } from "@/components/career-discovery/MultipleFuturesStep";
import { ActionPlanStep } from "@/components/career-discovery/ActionPlanStep";
import { NetworkIntelligenceStep } from "@/components/career-discovery/NetworkIntelligenceStep";
import { useAuth } from "@/contexts/AuthContext";
import { useCareerDiscovery, type CareerProfile } from "@/hooks/use-career-discovery";
import { Navigate } from "react-router-dom";
import { CareerWrappedStep } from "@/components/career-discovery/CareerWrappedStep";
import {
  Upload, Anchor, Compass, Sparkles, Building2, BarChart3,
  GitBranch, ClipboardList, Users, ChevronRight, ArrowLeft, CheckCircle2, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "profile", label: "Build Profile", icon: Upload, section: "Where You Are Now" },
  { id: "anchors", label: "Career Anchors", icon: Anchor, section: "Where You Are Now" },
  { id: "target", label: "Destination", icon: Compass, section: "Where You Could Go" },
  { id: "discover", label: "Career Discovery", icon: Sparkles, section: "Where You Could Go" },
  { id: "companies", label: "Company Discovery", icon: Building2, section: "Companies You May Not Have Considered" },
  { id: "skills", label: "Skill Gap", icon: BarChart3, section: "Skills to Build" },
  { id: "futures", label: "Possible Paths", icon: GitBranch, section: "Possible Paths" },
  { id: "action", label: "Action Plan", icon: ClipboardList, section: "Your Action Plan" },
  { id: "network", label: "Path Guides", icon: Users, section: "Who Can Help" },
  { id: "wrapped", label: "Your Results", icon: Trophy, section: "Career Mapped!" },
] as const;

type StepId = typeof STEPS[number]["id"];

// Map which AI call each step needs
const AI_STEP_MAP: Partial<Record<StepId, "career_discovery" | "company_discovery" | "skill_gap" | "multiple_futures" | "action_plan">> = {
  discover: "career_discovery",
  companies: "company_discovery",
  skills: "skill_gap",
  futures: "multiple_futures",
  action: "action_plan",
};

export default function CareerMap() {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState<StepId>("profile");
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [profile, setProfile] = useState<CareerProfile | null>(null);

  const { careerPaths, companies, skillGap, futures, actionPlan, discover } = useCareerDiscovery(profile);

  // Trigger AI discovery when entering an AI step
  useEffect(() => {
    if (!user) return;
    const aiType = AI_STEP_MAP[activeStep];
    if (!aiType || !profile) return;
    const stateMap = { career_discovery: careerPaths, company_discovery: companies, skill_gap: skillGap, multiple_futures: futures, action_plan: actionPlan };
    const state = stateMap[aiType];
    if (!state.data && !state.loading) {
      discover(aiType);
    }
  }, [activeStep, profile, user]);

  if (!user) return <Navigate to="/login" replace />;

  const currentIndex = STEPS.findIndex(s => s.id === activeStep);
  const currentStep = STEPS[currentIndex];
  const canGoNext = currentIndex < STEPS.length - 1;
  const canGoBack = currentIndex > 0;

  const markComplete = (step: StepId) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const goNext = () => {
    markComplete(activeStep);
    if (canGoNext) setActiveStep(STEPS[currentIndex + 1].id);
  };

  const goBack = () => {
    if (canGoBack) setActiveStep(STEPS[currentIndex - 1].id);
  };




  const handleProfileComplete = (data: Omit<CareerProfile, "anchors" | "targetRole">) => {
    setProfile(prev => ({ ...data, anchors: prev?.anchors || [], targetRole: prev?.targetRole || null }));
    markComplete("profile");
    setActiveStep("anchors");
  };

  const handleAnchorsComplete = (anchors: string[]) => {
    setProfile(prev => prev ? { ...prev, anchors } : null);
    markComplete("anchors");
    setActiveStep("target");
  };

  const handleTargetComplete = (targetRole: string | null) => {
    setProfile(prev => prev ? { ...prev, targetRole } : null);
    markComplete("target");
    setActiveStep("discover");
  };

  const renderContent = () => {
    switch (activeStep) {
      case "profile":
        return <ProfileInputStep onComplete={handleProfileComplete} />;
      case "anchors":
        return <CareerAnchorsStep onComplete={handleAnchorsComplete} />;
      case "target":
        return <TargetDestinationStep profileData={profile || undefined} onComplete={handleTargetComplete} />;
      case "discover":
        return <AICareerDiscoveryStep data={careerPaths.data} loading={careerPaths.loading} error={careerPaths.error} onRetry={() => discover("career_discovery")} />;
      case "companies":
        return <AICompanyDiscoveryStep data={companies.data} loading={companies.loading} error={companies.error} onRetry={() => discover("company_discovery")} />;
      case "skills":
        return <SkillGapStep data={skillGap.data} loading={skillGap.loading} error={skillGap.error} onRetry={() => discover("skill_gap")} />;
      case "futures":
        return <MultipleFuturesStep data={futures.data} loading={futures.loading} error={futures.error} onRetry={() => discover("multiple_futures")} />;
      case "action":
        return <ActionPlanStep data={actionPlan.data} loading={actionPlan.loading} error={actionPlan.error} onRetry={() => discover("action_plan")} />;
      case "network":
        return <NetworkIntelligenceStep />;
      case "wrapped":
        return (
          <CareerWrappedStep
            profile={profile!}
            careerPaths={careerPaths.data}
            companies={companies.data}
            skillGap={skillGap.data}
            futures={futures.data}
            actionPlan={actionPlan.data}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-10 flex-1">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 font-display">
            Career Discovery & Path Mapping
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Use AI and market intelligence to discover career paths and companies you may not have considered.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2 scrollbar-thin">
            {STEPS.map((step, i) => {
              const isActive = step.id === activeStep;
              const isCompleted = completedSteps.has(step.id);
              return (
                <button key={step.id} onClick={() => setActiveStep(step.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0",
                    isActive && "bg-primary text-primary-foreground shadow-sm",
                    !isActive && isCompleted && "bg-primary/10 text-primary hover:bg-primary/15",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}>
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

          <Card className="mb-6 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <currentStep.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">{currentStep.section}</p>
                <h2 className="text-lg font-bold text-foreground font-display">{currentStep.label}</h2>
                <p className="text-xs text-muted-foreground">Step {currentIndex + 1} of {STEPS.length}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {canGoBack && (
                  <Button variant="outline" size="sm" onClick={goBack}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                )}
                {canGoNext && (
                  <Button size="sm" onClick={goNext} className="gap-1.5">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {renderContent()}

          <div className="mt-10 text-center">
            <p className="text-xs text-muted-foreground italic">
              Career paths and company suggestions are generated using AI and market intelligence. This tool does not provide employment or financial advice.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
