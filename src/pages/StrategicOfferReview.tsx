import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck, Shield, Lock, Upload, ClipboardPaste, ArrowRight, ArrowLeft,
  Loader2, CheckCircle2, Building2, Briefcase, DollarSign,
  Scale, AlertOctagon, FileText, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WalkAwayCalculator } from "@/components/strategic-offer/WalkAwayCalculator";
import { CivicLegalAudit, type LegalFlag } from "@/components/strategic-offer/CivicLegalAudit";
import { EquityVisualizer } from "@/components/strategic-offer/EquityVisualizer";
import { NegotiationBot } from "@/components/strategic-offer/NegotiationBot";
import { ScamDetector } from "@/components/strategic-offer/ScamDetector";
import { EmployerIntelligenceCard } from "@/components/strategic-offer/EmployerIntelligenceCard";
import { OfferStrengthScore } from "@/components/strategic-offer/OfferStrengthScore";
import { useOfferStrengthScore } from "@/hooks/use-offer-strength-score";
import { GreenFlagsPanel } from "@/components/strategic-offer/GreenFlagsPanel";
import { QuestionsToAsk } from "@/components/strategic-offer/QuestionsToAsk";
import { CultureSnapshot } from "@/components/strategic-offer/CultureSnapshot";
import { OfferDecisionSummary } from "@/components/strategic-offer/OfferDecisionSummary";
import { OfferRealityCheck } from "@/components/strategic-offer/OfferRealityCheck";
import { OfferRiskSignals, computeRiskLevel, type RiskSignal } from "@/components/strategic-offer/OfferRiskSignals";
import { OfferClarityDashboard, type OfferClarityReport } from "@/components/offer-clarity/OfferClarityDashboard";
import { OfferLetterUpload } from "@/components/offer-review/OfferLetterUpload";
import { OfferReviewResults } from "@/components/offer-review/OfferReviewResults";
import { LegalDisclaimer } from "@/components/strategic-offer/LegalDisclaimer";
import { ConsentModal } from "@/components/strategic-offer/ConsentModal";
import { CareerPathForecast } from "@/components/strategic-offer/CareerPathForecast";
import { StabilityDelta } from "@/components/strategic-offer/StabilityDelta";
import { NegotiationCoach } from "@/components/strategic-offer/NegotiationCoach";
import { OutcomeFeedback } from "@/components/strategic-offer/OutcomeFeedback";
import { SituationContextBanner } from "@/components/policy-intelligence/SituationContextBanner";
import { getSituationsFromStorage, type Situation } from "@/lib/policyScoreEngine";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

type InputMode = null | "manual" | "upload";

interface OfferInput {
  companyName: string;
  companyId?: string;
  roleTitle: string;
  location: string;
  yearsExperience: string;
  baseSalary: string;
  bonus: string;
  equity: string;
  additionalDetails: string;
  hasInterview: boolean;
  asksToBuyEquipment: boolean;
  signOnBonus: string;
  repaymentClause: string;
  benefitWaitingPeriod: string;
  nonCompete: string;
  arbitrationClause: boolean;
  ipClause: boolean;
  salarySharedUpfront: boolean;
  interviewStartDate?: Date;
}

const STEPS = [
  { label: "Baseline", icon: Shield },
  { label: "Offer Details", icon: DollarSign },
  { label: "Analysis", icon: Loader2 },
  { label: "Full Review", icon: Scale },
];

const sanitize = (v: string, maxLen = 500): string =>
  v.replace(/[<>"'`]/g, "").substring(0, maxLen).trim();

/* ── Navigation anchors for the scrolling dashboard ── */
const DASHBOARD_SECTIONS = [
  { id: "stability-delta", label: "Delta" },
  { id: "reality-check", label: "Reality Check" },
  { id: "offer-strength-score", label: "Score" },
  { id: "red-flags", label: "Red Flags" },
  { id: "green-flags", label: "Green Flags" },
  { id: "risk-signals", label: "Risk Signals" },
  { id: "employer-intel", label: "Employer" },
  { id: "compensation", label: "Compensation" },
  { id: "equity", label: "Equity" },
  { id: "career-freedom", label: "Career Freedom" },
  { id: "negotiate", label: "Negotiate" },
  { id: "negotiate-coach", label: "Coach" },
  { id: "questions-to-ask", label: "Questions" },
  { id: "culture-snapshot", label: "Culture" },
  { id: "decision-summary", label: "Decision" },
];

export default function StrategicOfferReview() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [step, setStep] = useState(0);
  const [annualBaseline, setAnnualBaseline] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<OfferClarityReport | null>(null);
  const [legalFlags, setLegalFlags] = useState<LegalFlag[]>([]);
  const [uploadReviewId, setUploadReviewId] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const userSituations = getSituationsFromStorage();

  const [companyResults, setCompanyResults] = useState<any[]>([]);

  const [offer, setOffer] = useState<OfferInput>({
    companyName: "", roleTitle: "", location: "", yearsExperience: "",
    baseSalary: "", bonus: "", equity: "", additionalDetails: "",
    hasInterview: true, asksToBuyEquipment: false,
    signOnBonus: "", repaymentClause: "", benefitWaitingPeriod: "",
    nonCompete: "", arbitrationClause: false, ipClause: false, salarySharedUpfront: true,
  });

  // Career path signals for the forecast module
  const { data: careerSignals = [] } = useQuery({
    queryKey: ["career-forecast-signals", offer.companyId],
    queryFn: async () => {
      if (!offer.companyId) return [];
      const { data } = await supabase
        .from("company_values_signals" as any)
        .select("*")
        .eq("company_id", offer.companyId)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!offer.companyId && step === 3,
  });

  // Internal consistency: compare offer to compensation_data for same company
  const { data: companyCompData = [] } = useQuery({
    queryKey: ["internal-comp", offer.companyId, offer.roleTitle],
    queryFn: async () => {
      if (!offer.companyId) return [];
      const { data } = await supabase
        .from("compensation_data" as any)
        .select("base_salary, total_comp, role_title")
        .eq("company", offer.companyId)
        .limit(20);
      return (data || []) as any[];
    },
    enabled: !!offer.companyId && step === 3,
  });

  // Risk signals for reality check
  const { data: riskSignals = [] } = useQuery({
    queryKey: ["offer-risk-signals-inline", offer.companyId],
    queryFn: async () => {
      if (!offer.companyId) return [];
      const { data } = await supabase
        .from("company_signal_scans" as any)
        .select("signal_category, normalized_value, direction, summary, confidence_score")
        .eq("company_id", offer.companyId)
        .order("scanned_at", { ascending: false })
        .limit(12);
      const seen = new Set<string>();
      return ((data || []) as unknown as RiskSignal[]).filter(s => {
        if (seen.has(s.signal_category)) return false;
        seen.add(s.signal_category);
        return true;
      });
    },
    enabled: !!offer.companyId && step === 3,
  });

  const riskLevel = riskSignals.length > 0 ? computeRiskLevel(riskSignals) : null;

  // Derive internal consistency
  const internalConsistency: "aligned" | "lower" | "unclear" = (() => {
    if (companyCompData.length === 0 || !offer.baseSalary) return "unclear";
    const salaries = companyCompData.map((c: any) => Number(c.base_salary) || Number(c.total_comp) || 0).filter((v: number) => v > 0);
    if (salaries.length === 0) return "unclear";
    const avg = salaries.reduce((a: number, b: number) => a + b, 0) / salaries.length;
    const offerSal = Number(offer.baseSalary);
    if (offerSal >= avg * 0.9) return "aligned";
    return "lower";
  })();

  const salaryTransparency: "transparent" | "delayed" | "unclear" = offer.salarySharedUpfront ? "transparent" : "delayed";

  const update = (field: keyof OfferInput, value: any) => {
    if (typeof value === "string") {
      const maxLen = field === "additionalDetails" || field === "nonCompete" ? 2000 : 500;
      value = sanitize(value, maxLen);
    }
    setOffer(d => ({ ...d, [field]: value }));
  };

  const searchCompany = async (name: string) => {
    const clean = sanitize(name, 200);
    update("companyName", clean);
    if (clean.length < 2) { setCompanyResults([]); return; }
    const { data } = await supabase
      .from("companies")
      .select("id, name, industry, state")
      .ilike("name", `%${clean}%`)
      .limit(5);
    setCompanyResults(data || []);
  };

  const selectCompany = (c: any) => {
    setOffer(d => ({ ...d, companyName: c.name, companyId: c.id }));
    setCompanyResults([]);
  };

  const generateLegalFlags = useCallback((): LegalFlag[] => {
    const flags: LegalFlag[] = [];

    if (offer.arbitrationClause) {
      flags.push({
        id: "arb", severity: "red", category: "Arbitration",
        title: "Mandatory Arbitration / Class Action Waiver",
        description: "This offer includes a clause waiving your constitutional right to a jury trial. Disputes will be resolved in private arbitration, typically favoring the employer.",
        legalBasis: "Federal Arbitration Act; SCOTUS Epic Systems v. Lewis (2018). Note: Some states have begun carving out exceptions for harassment and discrimination claims.",
        negotiationTip: "Request a carve-out for discrimination, harassment, and wage theft claims. At minimum, negotiate for mutual arbitrator selection and employer-paid arbitration costs.",
      });
    }

    const repaymentMonths = parseInt(offer.repaymentClause);
    if (repaymentMonths && repaymentMonths > 24) {
      flags.push({
        id: "stay-pay", severity: "red", category: "Stay-or-Pay",
        title: "Stay-or-Pay Trap (Exceeds CA AB 692 Limits)",
        description: `Repayment clause requires ${repaymentMonths} months of commitment. Under 2026 California AB 692, repayment clauses must be prorated and capped at 2 years.`,
        legalBasis: "CA AB 692 (effective 2026). Mandates proration of repayment obligations and a maximum 2-year commitment period.",
        negotiationTip: "Request a prorated repayment schedule. Refuse any non-prorated full-repayment clause.",
      });
    } else if (repaymentMonths && repaymentMonths > 0) {
      flags.push({
        id: "stay-pay", severity: "yellow", category: "Stay-or-Pay",
        title: "Sign-On Repayment Clause Detected",
        description: `${repaymentMonths}-month repayment period. Within the 2-year legal limit, but verify it uses a prorated model.`,
        legalBasis: "CA AB 692 (effective 2026). Ensure repayment is calculated on a pro-rata basis.",
        negotiationTip: "Confirm in writing that repayment is prorated monthly, not a full lump-sum payback.",
      });
    }

    const waitDays = parseInt(offer.benefitWaitingPeriod);
    if (waitDays && waitDays > 30) {
      flags.push({
        id: "benefit-gap", severity: "yellow", category: "Benefits Gap",
        title: `${waitDays}-Day Health Benefit Waiting Period`,
        description: `A ${waitDays}-day waiting period creates a coverage gap.`,
        legalBasis: "ACA allows up to 90-day waiting periods, but best practice is 30 days or less.",
        negotiationTip: "Ask the employer to waive or reduce the waiting period, or cover your COBRA premiums during the gap.",
      });
    }

    if (offer.ipClause) {
      flags.push({
        id: "ip", severity: "yellow", category: "IP Ownership",
        title: "Broad IP Assignment Clause — Side-Hustle Risk",
        description: "The offer claims ownership of inventions or creative work made on your personal time.",
        legalBasis: "Many states limit employer IP claims to work created using company resources. CA Labor Code §2870.",
        negotiationTip: "Request an explicit carve-out for work created on your own time, using your own equipment, and unrelated to the company's products.",
      });
    }

    if (offer.nonCompete && offer.nonCompete.length > 0) {
      const isAggressive = offer.nonCompete.toLowerCase().includes("nationwide") ||
        offer.nonCompete.toLowerCase().includes("global") ||
        offer.nonCompete.toLowerCase().includes("any competitor");
      flags.push({
        id: "noncompete", severity: isAggressive ? "red" : "yellow", category: "Non-Compete",
        title: isAggressive ? "Aggressive Non-Compete Clause" : "Non-Compete Clause Detected",
        description: `Non-compete provision: "${offer.nonCompete.substring(0, 100)}${offer.nonCompete.length > 100 ? "..." : ""}". ${isAggressive ? "The scope appears unusually broad." : "Review the scope."}`,
        legalBasis: "FTC proposed a nationwide ban on non-competes (struck down 2024). State enforcement varies. CA, MN, ND, OK ban most non-competes.",
        negotiationTip: "Narrow to direct competitors only, within 50 miles, and 6 months max. Request a garden leave provision.",
      });
    }

    if (!offer.arbitrationClause && !offer.ipClause && flags.length === 0) {
      flags.push({
        id: "clean", severity: "green", category: "Standard Terms",
        title: "No Major Legal Red Flags Detected",
        description: "Based on the information provided, no common legal pitfalls were found. Always have an employment attorney review before signing.",
        legalBasis: "General employment law best practice.",
        negotiationTip: "Even clean offers can be improved. Focus on compensation, start date flexibility, and professional development budget.",
      });
    }

    return flags;
  }, [offer]);

  const runFullAnalysis = async () => {
    setStep(2);
    setScanning(true);
    const flags = generateLegalFlags();
    setLegalFlags(flags);

    try {
      const { data, error } = await supabase.functions.invoke("offer-clarity-scan", {
        body: {
          offerData: {
            roleTitle: offer.roleTitle,
            location: offer.location,
            yearsExperience: offer.yearsExperience,
            baseSalary: offer.baseSalary,
            bonus: offer.bonus,
            equity: offer.equity,
            additionalDetails: [
              offer.additionalDetails,
              offer.signOnBonus ? `Sign-on bonus: ${offer.signOnBonus}` : "",
              offer.nonCompete ? `Non-compete: ${offer.nonCompete}` : "",
              offer.arbitrationClause ? "Contains mandatory arbitration clause" : "",
              offer.ipClause ? "Contains broad IP assignment clause" : "",
            ].filter(Boolean).join(". "),
          },
          companyName: offer.companyName,
          companyId: offer.companyId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data.report);
      setStep(3);
      // Fire AI strength score in background (uses clarity report)
      strengthScore.runAIScore();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
      setStep(3);
    } finally {
      setScanning(false);
    }
  };

  const strengthScore = useOfferStrengthScore({
    offer,
    annualBaseline,
    legalFlags,
    clarityReport: report,
  });

  const canAdvanceOffer = offer.companyName.length >= 2 && offer.roleTitle.length >= 2 && offer.baseSalary.length >= 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Privacy Banner */}
        <div className="flex items-center gap-2 p-3 mb-6 bg-muted/50 border border-border/40 rounded-xl">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Data Stays Local.</span>{" "}
            No PII is stored. Salary and title data are processed for analysis only and never shared.
          </p>
          <Badge variant="outline" className="text-[9px] shrink-0">Encrypted</Badge>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3 text-xs gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Offer Check
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Is this offer actually good?
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-sm">
            Strategic offer analysis. Compensation benchmarking. Contract red flag detection. Negotiation coaching. Company alignment context. All in one place.
          </p>
        </div>

        {/* Input mode selector */}
        {inputMode === null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <Card
              className="rounded-2xl border-primary/20 bg-primary/[0.02] cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setInputMode("manual")}
            >
              <CardContent className="p-6 text-center space-y-3">
                <ClipboardPaste className="w-10 h-10 text-primary mx-auto" />
                <h3 className="font-semibold text-foreground">Enter Offer Details</h3>
                <p className="text-xs text-muted-foreground">
                  Privacy-first. Just enter the key terms — no documents needed.
                </p>
                <Badge className="text-[10px] bg-primary/10 text-primary border-0">Recommended</Badge>
              </CardContent>
            </Card>
            <Card
              className={cn(
                "rounded-2xl border-border/40 cursor-pointer hover:border-border transition-colors",
                !user && "opacity-60"
              )}
              onClick={() => {
                if (!user) {
                  toast({ title: "Sign in required", description: "Create a free account to upload offer letters for private review." });
                  return;
                }
                setShowConsentModal(true);
              }}
            >
              <CardContent className="p-6 text-center space-y-3">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-foreground">Upload Offer Letter</h3>
                <p className="text-xs text-muted-foreground">
                  AI-powered term extraction from PDF/DOCX. Encrypted, auto-deleted after analysis.
                </p>
                <Badge variant="outline" className="text-[10px]">Premium</Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload flow */}
        {inputMode === "upload" && !uploadReviewId && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setInputMode(null)} className="gap-1.5 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>

            {/* Company selector for upload */}
            <Card className="border-border/40 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Select Company
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Input
                    placeholder="Search for the company..."
                    value={offer.companyName}
                    onChange={e => searchCompany(e.target.value)}
                  />
                  {companyResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                      {companyResults.map(c => (
                        <button
                          key={c.id}
                          onClick={() => selectCompany(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.industry}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {offer.companyId && (
                    <Badge variant="secondary" className="mt-2 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Matched — company signals included
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {offer.companyId && (
              <OfferLetterUpload
                companyId={offer.companyId}
                companyName={offer.companyName}
                onReviewCreated={(id) => setUploadReviewId(id)}
              />
            )}
            {!offer.companyId && offer.companyName.length >= 2 && (
              <p className="text-xs text-muted-foreground text-center">
                Select a company from the suggestions above, or <button className="text-primary hover:underline" onClick={() => setInputMode("manual")}>enter details manually</button>.
              </p>
            )}
          </div>
        )}

        {/* Upload results */}
        {inputMode === "upload" && uploadReviewId && (
          <UploadedOfferResults reviewId={uploadReviewId} onBack={() => { setUploadReviewId(null); setInputMode(null); }} />
        )}

        {/* Manual flow */}
        {inputMode === "manual" && (
          <>
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-8">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                      isActive ? "border-primary bg-primary text-primary-foreground" :
                      isDone ? "border-primary bg-primary/10 text-primary" :
                      "border-border bg-muted text-muted-foreground"
                    )}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className={cn("w-4 h-4", isActive && i === 2 ? "animate-spin" : "")} />}
                    </div>
                    <span className={cn("text-xs font-medium hidden sm:inline", isActive ? "text-foreground" : "text-muted-foreground")}>
                      {s.label}
                    </span>
                    {i < STEPS.length - 1 && <div className={cn("flex-1 h-px mx-2", isDone ? "bg-primary" : "bg-border")} />}
                  </div>
                );
              })}
            </div>

            {/* Step 0: Walk-Away Calculator */}
            {step === 0 && (
              <WalkAwayCalculator
                onComplete={(baseline) => {
                  setAnnualBaseline(baseline);
                  setStep(1);
                }}
                offerSalary={Number(offer.baseSalary) || undefined}
              />
            )}

            {/* Step 1: Offer Details */}
            {step === 1 && (
              <div className="space-y-6">
                <Card className="border-border/40 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Company & Role
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Company Name</label>
                      <Input
                        placeholder="e.g. Google, Amazon, Hines"
                        value={offer.companyName}
                        onChange={e => searchCompany(e.target.value)}
                      />
                      {companyResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                          {companyResults.map(c => (
                            <button
                              key={c.id}
                              onClick={() => selectCompany(c)}
                              className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors flex items-center justify-between"
                            >
                              <span className="text-sm font-medium">{c.name}</span>
                              <span className="text-xs text-muted-foreground">{c.industry} · {c.state}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {offer.companyId && (
                        <Badge variant="secondary" className="mt-2 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Matched — company signals included
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Role Title</label>
                        <Input placeholder="e.g. Senior Engineer" value={offer.roleTitle} onChange={e => update("roleTitle", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
                        <Input placeholder="e.g. Austin, TX" value={offer.location} onChange={e => update("location", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Years of Experience</label>
                      <Input type="number" placeholder="e.g. 5" value={offer.yearsExperience} onChange={e => update("yearsExperience", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Interview Start Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !offer.interviewStartDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {offer.interviewStartDate ? format(offer.interviewStartDate, "PPP") : "When did you start interviewing?"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={offer.interviewStartDate}
                            onSelect={(d) => setOffer(prev => ({ ...prev, interviewStartDate: d || undefined }))}
                            disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-[10px] text-muted-foreground mt-1">Optional — enables "What Changed" delta scan</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      Compensation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Base Salary (Annual)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="number" placeholder="e.g. 160000" value={offer.baseSalary} onChange={e => update("baseSalary", e.target.value)} className="pl-9" />
                      </div>
                      {annualBaseline > 0 && Number(offer.baseSalary) > 0 && Number(offer.baseSalary) < annualBaseline && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          Below your ${annualBaseline.toLocaleString()} safety line
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Bonus / Commission</label>
                        <Input placeholder="e.g. 15% target bonus" value={offer.bonus} onChange={e => update("bonus", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Sign-On Bonus</label>
                        <Input placeholder="e.g. $25,000" value={offer.signOnBonus} onChange={e => update("signOnBonus", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Equity</label>
                      <Input placeholder="e.g. 10,000 RSUs over 4 years" value={offer.equity} onChange={e => update("equity", e.target.value)} />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-foreground">Was the salary range shared before you applied?</p>
                        <p className="text-[10px] text-muted-foreground">Helps assess employer transparency</p>
                      </div>
                      <Switch
                        checked={offer.salarySharedUpfront}
                        onCheckedChange={(checked) => update("salarySharedUpfront", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Scale className="w-4 h-4 text-primary" />
                      Legal & Contract Terms
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">These questions help detect legal pitfalls most candidates miss.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Repayment clause (months)</label>
                        <Input type="number" placeholder="e.g. 24" value={offer.repaymentClause} onChange={e => update("repaymentClause", e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-1">For sign-on/relocation bonus repayment</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Benefit waiting period (days)</label>
                        <Input type="number" placeholder="e.g. 90" value={offer.benefitWaitingPeriod} onChange={e => update("benefitWaitingPeriod", e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-1">Days before health benefits activate</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Non-compete clause</label>
                      <Textarea
                        placeholder="Paste the non-compete language or describe the restriction"
                        value={offer.nonCompete}
                        onChange={e => update("nonCompete", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer">
                        <input type="checkbox" checked={offer.arbitrationClause} onChange={e => update("arbitrationClause", e.target.checked)} className="rounded border-border" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Mandatory arbitration</p>
                          <p className="text-[10px] text-muted-foreground">Waives right to jury trial</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer">
                        <input type="checkbox" checked={offer.ipClause} onChange={e => update("ipClause", e.target.checked)} className="rounded border-border" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Broad IP assignment</p>
                          <p className="text-[10px] text-muted-foreground">Claims personal-time inventions</p>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer">
                        <input type="checkbox" checked={offer.hasInterview} onChange={e => update("hasInterview", e.target.checked)} className="rounded border-border" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Had an interview</p>
                          <p className="text-[10px] text-muted-foreground">Uncheck if no interview</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer">
                        <input type="checkbox" checked={offer.asksToBuyEquipment} onChange={e => update("asksToBuyEquipment", e.target.checked)} className="rounded border-border" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Buy-equipment request</p>
                          <p className="text-[10px] text-muted-foreground">Asked to purchase via check</p>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Additional Details</label>
                      <Textarea
                        placeholder="Any other terms: PTO, remote policy, relocation package, training agreements..."
                        value={offer.additionalDetails}
                        onChange={e => update("additionalDetails", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Walk-Away Calc
                  </Button>
                  <Button onClick={runFullAnalysis} disabled={!canAdvanceOffer} className="gap-2">
                    Run Strategic Analysis <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Scanning */}
            {step === 2 && (
              <Card className="rounded-2xl border-border/40">
                <CardContent className="p-10 text-center space-y-6">
                  <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                  <div>
                    <h2 className="text-xl font-display font-semibold text-foreground mb-2">Running Full Analysis</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Scanning compensation benchmarks, legal clause patterns, company signals, and generating negotiation strategies for <span className="font-medium text-foreground">{offer.companyName}</span>.
                    </p>
                  </div>
                  <div className="max-w-xs mx-auto space-y-2">
                    <Progress value={scanning ? 60 : 100} className="h-2" />
                    <p className="text-[11px] text-muted-foreground">This typically takes 15–30 seconds</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Full Scrolling Dashboard */}
            {step === 3 && (
              <div className="space-y-8">
                {/* Sticky nav */}
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 -mx-4 px-4 py-2 mb-4">
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {DASHBOARD_SECTIONS.map(sec => (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted/50 whitespace-nowrap transition-colors"
                      >
                        {sec.label}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Situation Context */}
                {userSituations.length > 0 && (
                  <SituationContextBanner companyName={offer.companyName} />
                )}

                {/* -1. Stability Delta — What Changed */}
                <StabilityDelta
                  companyId={offer.companyId}
                  companyName={offer.companyName}
                  interviewStartDate={offer.interviewStartDate}
                />

                {/* 0. Offer Reality Check — Hero Summary */}
                <div id="reality-check">
                  <OfferRealityCheck
                    offerStrengthScore={strengthScore.result.totalScore}
                    offerSalary={Number(offer.baseSalary) || 0}
                    annualBaseline={annualBaseline}
                    legalFlags={legalFlags}
                    report={report}
                    hasEquity={!!offer.equity}
                    hasBonus={!!offer.bonus}
                    companyName={offer.companyName}
                    roleTitle={offer.roleTitle}
                    riskLevel={riskLevel}
                    salaryTransparency={salaryTransparency}
                    internalConsistency={internalConsistency}
                    situations={userSituations}
                  />
                </div>

                {/* 1. Offer Strength Score */}
                <OfferStrengthScore
                  result={strengthScore.result}
                  isAIPowered={strengthScore.isAIPowered}
                  loading={strengthScore.loading}
                />

                {/* 2. Scam Detector (only if triggered) */}
                <ScamDetector
                  additionalDetails={offer.additionalDetails}
                  hasInterview={offer.hasInterview}
                  asksToBuyEquipment={offer.asksToBuyEquipment}
                />

                {/* 3. Red Flags — Legal Audit */}
                <div id="red-flags">
                  <CivicLegalAudit flags={legalFlags} />
                </div>

                {/* 4. Green Flags */}
                <GreenFlagsPanel
                  legalFlags={legalFlags}
                  report={report}
                  offerSalary={Number(offer.baseSalary) || 0}
                  annualBaseline={annualBaseline}
                  hasEquity={!!offer.equity}
                  hasBonus={!!offer.bonus}
                  hasInterview={offer.hasInterview}
                />

                {/* 5. Employer Intelligence */}
                <div id="employer-intel">
                  <EmployerIntelligenceCard
                    companyId={offer.companyId}
                    companyName={offer.companyName}
                  />
                </div>

                {/* 5.5 Risk Signals */}
                <OfferRiskSignals
                  companyId={offer.companyId}
                  companyName={offer.companyName}
                />

                {/* 6. Compensation Analysis */}
                <div id="compensation">
                  {report ? (
                    <OfferClarityDashboard
                      report={report}
                      offerData={{
                        companyName: offer.companyName,
                        roleTitle: offer.roleTitle,
                        baseSalary: offer.baseSalary,
                        location: offer.location,
                        ...(offer.companyId ? { companyId: offer.companyId } : {}),
                      }}
                      onStartOver={() => {
                        setStep(0);
                        setReport(null);
                        setLegalFlags([]);
                        setInputMode(null);
                      }}
                    />
                  ) : (
                    <Card className="rounded-2xl border-border/40">
                      <CardContent className="p-6 text-center space-y-2">
                        <AlertOctagon className="w-8 h-8 text-[hsl(var(--civic-yellow))] mx-auto" />
                        <p className="text-sm text-muted-foreground">AI compensation analysis unavailable. Local analysis results shown below.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* 7. Equity */}
                <div id="equity">
                  <EquityVisualizer />
                </div>

                {/* 8. Career Freedom Risk (already shown in Legal Audit, but anchored) */}
                <div id="career-freedom" />

                {/* 9. Negotiation Planner */}
                <div id="negotiate">
                  <NegotiationBot
                    flags={legalFlags}
                    offerSalary={Number(offer.baseSalary) || 0}
                    annualBaseline={annualBaseline}
                    companyName={offer.companyName}
                    roleTitle={offer.roleTitle}
                    situations={userSituations}
                  />
                </div>

                {/* 9.5. AI Negotiation Coach */}
                <NegotiationCoach
                  companyName={offer.companyName}
                  roleTitle={offer.roleTitle}
                  baseSalary={Number(offer.baseSalary) || 0}
                  bonus={offer.bonus}
                  equity={offer.equity}
                  signOnBonus={offer.signOnBonus}
                  annualBaseline={annualBaseline}
                  legalFlags={legalFlags}
                  riskSignals={riskSignals}
                  userPriorities={userSituations}
                />

                {/* 10. Questions to Ask */}
                <QuestionsToAsk
                  legalFlags={legalFlags}
                  hasEquity={!!offer.equity}
                  hasBonus={!!offer.bonus}
                  offerSalary={Number(offer.baseSalary) || 0}
                  annualBaseline={annualBaseline}
                  companyName={offer.companyName}
                />

                {/* 11. Culture Snapshot */}
                <CultureSnapshot
                  companyId={offer.companyId}
                  companyName={offer.companyName}
                />

                {/* 11.5. Career Path Forecast — Future-Value Check */}
                {offer.companyId && careerSignals.length > 0 && (
                  <CareerPathForecast
                    companyName={offer.companyName}
                    roleTitle={offer.roleTitle}
                    signals={careerSignals}
                  />
                )}

                {/* 12. Final Decision Summary */}
                <OfferDecisionSummary
                  companyName={offer.companyName}
                  roleTitle={offer.roleTitle}
                  offerStrengthScore={strengthScore.result.totalScore}
                  report={report}
                  legalFlags={legalFlags}
                  offerSalary={Number(offer.baseSalary) || 0}
                  annualBaseline={annualBaseline}
                  hasEquity={!!offer.equity}
                  hasBonus={!!offer.bonus}
                />

                {/* 13. Outcome Feedback */}
                <OutcomeFeedback companyName={offer.companyName} />

                <div className="flex justify-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(0);
                      setReport(null);
                      setLegalFlags([]);
                      setInputMode(null);
                    }}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Start New Analysis
                  </Button>
                  <Button variant="secondary" className="gap-2" asChild>
                    <a href={`/negotiation-simulator?company=${encodeURIComponent(offer.companyName)}&role=${encodeURIComponent(offer.roleTitle)}&salary=${encodeURIComponent(offer.baseSalary)}`}>
                      Practice This Negotiation
                    </a>
                  </Button>
                </div>

                {/* Disclaimer */}
                <div className="p-4 bg-muted/30 rounded-xl border border-border/40">
                  <p className="text-[11px] text-muted-foreground text-center">
                    Created by Jackye Clayton. This tool provides educational insights and risk signals based on publicly available data and user-provided terms. It does not constitute legal, financial, or employment advice.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <LegalDisclaimer />
      <ConsentModal
        open={showConsentModal}
        onAccept={() => { setShowConsentModal(false); setInputMode("upload"); }}
        onCancel={() => setShowConsentModal(false)}
      />
      <Footer />
    </div>
  );
}

/* ── Uploaded offer results sub-component ── */
function UploadedOfferResults({ reviewId, onBack }: { reviewId: string; onBack: () => void }) {
  const { data: review, isLoading, refetch } = useUploadedReview(reviewId);

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (!review) {
    return (
      <Card className="rounded-2xl border-destructive/30">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Review not found.</p>
          <Button variant="outline" size="sm" onClick={onBack} className="mt-3 gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Button>
      <OfferReviewResults
        review={review}
        onRerun={() => refetch()}
      />
    </div>
  );
}

function useUploadedReview(reviewId: string) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["uploaded-review", reviewId],
    queryFn: async () => {
      const { data } = await supabase
        .from("offer_letter_reviews" as any)
        .select("*")
        .eq("id", reviewId)
        .single();
      return data;
    },
    refetchInterval: (data: any) => {
      if (data?.processing_status === "pending" || data?.processing_status === "processing") return 3000;
      return false;
    },
  });
  return { data, isLoading, refetch };
}
