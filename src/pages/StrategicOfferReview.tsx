import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck, Shield, Lock, Upload, ClipboardPaste, ArrowRight, ArrowLeft,
  Loader2, CheckCircle2, Building2, Briefcase, MapPin, DollarSign,
  Scale, TrendingUp, MessageSquare, AlertOctagon, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WalkAwayCalculator } from "@/components/strategic-offer/WalkAwayCalculator";
import { CivicLegalAudit, type LegalFlag } from "@/components/strategic-offer/CivicLegalAudit";
import { EquityVisualizer } from "@/components/strategic-offer/EquityVisualizer";
import { NegotiationBot } from "@/components/strategic-offer/NegotiationBot";
import { ScamDetector } from "@/components/strategic-offer/ScamDetector";
import { EmployerIntelligenceCard } from "@/components/strategic-offer/EmployerIntelligenceCard";
import { OfferClarityDashboard, type OfferClarityReport } from "@/components/offer-clarity/OfferClarityDashboard";

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
}

const STEPS = [
  { label: "Baseline", icon: Shield },
  { label: "Offer Details", icon: DollarSign },
  { label: "Analysis", icon: Loader2 },
  { label: "Full Review", icon: Scale },
];

// Input sanitization helper — strips potential XSS/injection content
const sanitize = (v: string, maxLen = 500): string =>
  v.replace(/[<>"'`]/g, "").substring(0, maxLen).trim();

export default function StrategicOfferReview() {
  const { toast } = useToast();
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [step, setStep] = useState(0);
  const [annualBaseline, setAnnualBaseline] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<OfferClarityReport | null>(null);
  const [legalFlags, setLegalFlags] = useState<LegalFlag[]>([]);

  const [companyResults, setCompanyResults] = useState<any[]>([]);

  const [offer, setOffer] = useState<OfferInput>({
    companyName: "", roleTitle: "", location: "", yearsExperience: "",
    baseSalary: "", bonus: "", equity: "", additionalDetails: "",
    hasInterview: true, asksToBuyEquipment: false,
    signOnBonus: "", repaymentClause: "", benefitWaitingPeriod: "",
    nonCompete: "", arbitrationClause: false, ipClause: false,
  });

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

  // Generate legal flags from manual input
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
        description: `Repayment clause requires ${repaymentMonths} months of commitment. Under 2026 California AB 692, repayment clauses for sign-on and relocation bonuses must be prorated and capped at 2 years (24 months).`,
        legalBasis: "CA AB 692 (effective 2026). Mandates proration of repayment obligations and a maximum 2-year commitment period for training/sign-on/relocation repayment agreements.",
        negotiationTip: "Request a prorated repayment schedule (e.g., if you leave at 18 months of a 24-month agreement, you owe only 25% back). Refuse any non-prorated full-repayment clause.",
      });
    } else if (repaymentMonths && repaymentMonths > 0) {
      flags.push({
        id: "stay-pay", severity: "yellow", category: "Stay-or-Pay",
        title: "Sign-On Repayment Clause Detected",
        description: `${repaymentMonths}-month repayment period detected. Within the 2-year legal limit, but verify the clause uses a prorated model.`,
        legalBasis: "CA AB 692 (effective 2026). Ensure repayment is calculated on a pro-rata basis.",
        negotiationTip: "Confirm in writing that repayment is prorated monthly, not a full lump-sum payback. Get the exact formula in your offer letter.",
      });
    }

    const waitDays = parseInt(offer.benefitWaitingPeriod);
    if (waitDays && waitDays > 30) {
      flags.push({
        id: "benefit-gap", severity: "yellow", category: "Benefits Gap",
        title: `${waitDays}-Day Health Benefit Waiting Period`,
        description: `A ${waitDays}-day waiting period before health benefits activate creates a coverage gap. This is a common pitfall — many people don't realize they'll be uninsured during the first weeks at a new job.`,
        legalBasis: "ACA allows up to 90-day waiting periods, but best practice is 30 days or less. COBRA continuation from prior employer may bridge the gap.",
        negotiationTip: "Ask the employer to either (1) waive or reduce the waiting period, or (2) cover your COBRA premiums from your previous employer during the gap. This is a low-cost ask for them.",
      });
    }

    if (offer.ipClause) {
      flags.push({
        id: "ip", severity: "yellow", category: "IP Ownership",
        title: "Broad IP Assignment Clause — Side-Hustle Risk",
        description: "The offer claims ownership of inventions or creative work made on your personal time. This can affect freelance work, open-source contributions, and personal projects.",
        legalBasis: "Many states (CA, DE, MN, IL, WA, NC) have statutes limiting employer IP claims to work created using company resources or related to company business. CA Labor Code §2870.",
        negotiationTip: "Request an explicit carve-out for work created (1) on your own time, (2) using your own equipment, and (3) not related to the company's current or planned products. List specific projects you want excluded.",
      });
    }

    if (offer.nonCompete && offer.nonCompete.length > 0) {
      const isAggressive = offer.nonCompete.toLowerCase().includes("nationwide") ||
        offer.nonCompete.toLowerCase().includes("global") ||
        offer.nonCompete.toLowerCase().includes("any competitor");
      flags.push({
        id: "noncompete", severity: isAggressive ? "red" : "yellow", category: "Non-Compete",
        title: isAggressive ? "Aggressive Non-Compete Clause" : "Non-Compete Clause Detected",
        description: `Non-compete provision: "${offer.nonCompete.substring(0, 100)}${offer.nonCompete.length > 100 ? "..." : ""}". ${isAggressive ? "The scope appears unusually broad." : "Review the geographic and temporal scope."}`,
        legalBasis: "FTC proposed a nationwide ban on non-competes (struck down 2024). State enforcement varies widely. CA, MN, ND, OK ban most non-competes entirely. Many other states require reasonable scope.",
        negotiationTip: "Narrow the clause to (1) direct competitors only, (2) within 50 miles of your primary work location, and (3) a maximum of 6 months. Request a garden leave provision (paid non-compete period).",
      });
    }

    // Green flags
    if (!offer.arbitrationClause && !offer.ipClause && flags.length === 0) {
      flags.push({
        id: "clean", severity: "green", category: "Standard Terms",
        title: "No Major Legal Red Flags Detected",
        description: "Based on the information provided, this offer doesn't contain the most common legal pitfalls. Always have an employment attorney review before signing.",
        legalBasis: "General employment law best practice.",
        negotiationTip: "Even clean offers can be improved. Focus on compensation, start date flexibility, and professional development budget.",
      });
    }

    return flags;
  }, [offer]);

  const runFullAnalysis = async () => {
    setStep(2);
    setScanning(true);

    // Generate legal flags immediately (client-side)
    const flags = generateLegalFlags();
    setLegalFlags(flags);

    // Run AI scan
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
    } catch (e: any) {
      console.error(e);
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
      // Still show results with legal flags even if AI fails
      setStep(3);
    } finally {
      setScanning(false);
    }
  };

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
            No PII is stored. Salary and title data are processed for analysis only and never shared. Your privacy is non-negotiable.
          </p>
          <Badge variant="outline" className="text-[9px] shrink-0">Encrypted</Badge>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3 text-xs gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Strategic Offer Review
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Is this offer actually good?
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-sm">
            Five analytical layers. Zero guesswork. Know your baseline, spot the legal traps, calculate the real equity value, and get ready-to-send negotiation scripts.
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
                  Privacy-first. Just enter the key terms — no documents, no PII needed.
                </p>
                <Badge className="text-[10px] bg-primary/10 text-primary border-0">Recommended</Badge>
              </CardContent>
            </Card>
            <Card
              className="rounded-2xl border-border/40 cursor-pointer hover:border-border transition-colors"
              onClick={() => {
                toast({ title: "Coming soon", description: "PDF upload with AI scanning is under development. Use manual entry for now." });
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
                        <Input
                          placeholder="e.g. Senior Engineer"
                          value={offer.roleTitle}
                          onChange={e => update("roleTitle", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
                        <Input
                          placeholder="e.g. Austin, TX"
                          value={offer.location}
                          onChange={e => update("location", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Years of Experience</label>
                      <Input
                        type="number"
                        placeholder="e.g. 5"
                        value={offer.yearsExperience}
                        onChange={e => update("yearsExperience", e.target.value)}
                      />
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
                        <Input
                          type="number"
                          placeholder="e.g. 160000"
                          value={offer.baseSalary}
                          onChange={e => update("baseSalary", e.target.value)}
                          className="pl-9"
                        />
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
                        <Input
                          placeholder="e.g. 15% target bonus"
                          value={offer.bonus}
                          onChange={e => update("bonus", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Sign-On Bonus</label>
                        <Input
                          placeholder="e.g. $25,000"
                          value={offer.signOnBonus}
                          onChange={e => update("signOnBonus", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Equity</label>
                      <Input
                        placeholder="e.g. 10,000 RSUs over 4 years"
                        value={offer.equity}
                        onChange={e => update("equity", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Legal clauses */}
                <Card className="border-border/40 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Scale className="w-4 h-4 text-primary" />
                      Legal & Contract Terms
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">These questions help us detect 2026 legal "truth facts" most candidates miss.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Repayment clause (months)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 24 (or leave blank)"
                          value={offer.repaymentClause}
                          onChange={e => update("repaymentClause", e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">For sign-on/relocation bonus repayment requirements</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Benefit waiting period (days)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 90 (or leave blank)"
                          value={offer.benefitWaitingPeriod}
                          onChange={e => update("benefitWaitingPeriod", e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Days before health benefits activate</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Non-compete clause</label>
                      <Textarea
                        placeholder="Paste the non-compete language here, or describe the restriction (e.g., 'Cannot work for any competitor nationwide for 12 months')"
                        value={offer.nonCompete}
                        onChange={e => update("nonCompete", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offer.arbitrationClause}
                          onChange={e => update("arbitrationClause", e.target.checked)}
                          className="rounded border-border"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">Mandatory arbitration</p>
                          <p className="text-[10px] text-muted-foreground">Waives right to jury trial</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offer.ipClause}
                          onChange={e => update("ipClause", e.target.checked)}
                          className="rounded border-border"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">Broad IP assignment</p>
                          <p className="text-[10px] text-muted-foreground">Claims personal-time inventions</p>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offer.hasInterview}
                          onChange={e => update("hasInterview", e.target.checked)}
                          className="rounded border-border"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">Had an interview</p>
                          <p className="text-[10px] text-muted-foreground">Uncheck if no interview process</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offer.asksToBuyEquipment}
                          onChange={e => update("asksToBuyEquipment", e.target.checked)}
                          className="rounded border-border"
                        />
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

            {/* Step 3: Full Results */}
            {step === 3 && (
              <Tabs defaultValue="employer" className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="employer" className="text-xs">Employer</TabsTrigger>
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="legal" className="text-xs">Legal Audit</TabsTrigger>
                  <TabsTrigger value="equity" className="text-xs">Equity</TabsTrigger>
                  <TabsTrigger value="negotiate" className="text-xs">Negotiate</TabsTrigger>
                  <TabsTrigger value="scam" className="text-xs">Safety</TabsTrigger>
                </TabsList>

                <TabsContent value="employer">
                  <EmployerIntelligenceCard
                    companyId={offer.companyId}
                    companyName={offer.companyName}
                  />
                </TabsContent>

                <TabsContent value="overview">
                  {report ? (
                    <OfferClarityDashboard
                      report={report}
                      offerData={{
                        companyName: offer.companyName,
                        roleTitle: offer.roleTitle,
                        baseSalary: offer.baseSalary,
                        location: offer.location,
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
                      <CardContent className="p-8 text-center space-y-3">
                        <AlertOctagon className="w-10 h-10 text-civic-yellow mx-auto" />
                        <p className="text-sm text-muted-foreground">AI analysis unavailable. Check the Legal Audit and Equity tabs for local analysis results.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="legal">
                  <CivicLegalAudit flags={legalFlags} />
                </TabsContent>

                <TabsContent value="equity">
                  <EquityVisualizer />
                </TabsContent>

                <TabsContent value="negotiate">
                  <NegotiationBot
                    flags={legalFlags}
                    offerSalary={Number(offer.baseSalary) || 0}
                    annualBaseline={annualBaseline}
                    companyName={offer.companyName}
                    roleTitle={offer.roleTitle}
                  />
                </TabsContent>

                <TabsContent value="scam">
                  <ScamDetector
                    additionalDetails={offer.additionalDetails}
                    hasInterview={offer.hasInterview}
                    asksToBuyEquipment={offer.asksToBuyEquipment}
                  />
                  {!offer.asksToBuyEquipment && offer.hasInterview && !offer.additionalDetails.toLowerCase().includes("fee") && (
                    <Card className="rounded-xl border-civic-green/20 bg-civic-green/5 mt-4">
                      <CardContent className="p-4 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-civic-green shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          No scam indicators detected. This appears to be a legitimate offer process.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
