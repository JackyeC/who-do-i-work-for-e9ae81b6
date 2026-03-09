import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, FileText, ClipboardPaste, ArrowRight, ArrowLeft,
  Loader2, CheckCircle2, Building2, Briefcase, MapPin, DollarSign, BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OfferClarityDashboard, type OfferClarityReport } from "./OfferClarityDashboard";

interface OfferData {
  roleTitle: string;
  location: string;
  yearsExperience: string;
  baseSalary: string;
  bonus: string;
  equity: string;
  additionalDetails: string;
  companyName: string;
  companyId?: string;
}

const STEPS = [
  { label: "Company & Role", icon: Building2 },
  { label: "Compensation", icon: DollarSign },
  { label: "Scanning", icon: Loader2 },
  { label: "Results", icon: BarChart3 },
];

export function OfferClarityWizard() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<OfferClarityReport | null>(null);
  const [offerData, setOfferData] = useState<OfferData>({
    roleTitle: "", location: "", yearsExperience: "",
    baseSalary: "", bonus: "", equity: "",
    additionalDetails: "", companyName: "",
  });

  // Company search
  const [companyResults, setCompanyResults] = useState<any[]>([]);
  const [searchingCompany, setSearchingCompany] = useState(false);

  const searchCompany = async (name: string) => {
    setOfferData(d => ({ ...d, companyName: name }));
    if (name.length < 2) { setCompanyResults([]); return; }
    setSearchingCompany(true);
    const { data } = await supabase
      .from("companies")
      .select("id, name, industry, state")
      .ilike("name", `%${name}%`)
      .limit(5);
    setCompanyResults(data || []);
    setSearchingCompany(false);
  };

  const selectCompany = (c: any) => {
    setOfferData(d => ({ ...d, companyName: c.name, companyId: c.id }));
    setCompanyResults([]);
  };

  const update = (field: keyof OfferData, value: string) =>
    setOfferData(d => ({ ...d, [field]: value }));

  const canAdvanceStep0 = offerData.companyName.length >= 2 && offerData.roleTitle.length >= 2;
  const canAdvanceStep1 = offerData.baseSalary.length >= 1;

  const runScan = async () => {
    setStep(2);
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("offer-clarity-scan", {
        body: {
          offerData,
          companyName: offerData.companyName,
          companyId: offerData.companyId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data.report);
      setStep(3);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
      setStep(1);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                isActive ? "border-primary bg-primary text-primary-foreground" :
                isDone ? "border-primary bg-primary/10 text-primary" :
                "border-border bg-muted text-muted-foreground"
              }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className={`w-4 h-4 ${isActive && i === 2 ? "animate-spin" : ""}`} />}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${isDone ? "bg-primary" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>

      {/* Step 0: Company & Role */}
      {step === 0 && (
        <Card className="card-official rounded-2xl">
          <CardContent className="p-7 space-y-5">
            <div>
              <h2 className="text-xl font-display font-semibold text-foreground mb-1">Company & Role</h2>
              <p className="text-sm text-muted-foreground">Tell us about the position you're evaluating.</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. Google, Hines, Amazon"
                    value={offerData.companyName}
                    onChange={e => searchCompany(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
                {offerData.companyId && (
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Matched — company signals will be included
                  </Badge>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Role Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. Senior Software Engineer"
                    value={offerData.roleTitle}
                    onChange={e => update("roleTitle", e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. New York, NY"
                      value={offerData.location}
                      onChange={e => update("location", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Years of Experience</label>
                  <Input
                    type="number"
                    placeholder="e.g. 5"
                    value={offerData.yearsExperience}
                    onChange={e => update("yearsExperience", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(1)} disabled={!canAdvanceStep0} className="gap-2">
                Next: Compensation <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Compensation */}
      {step === 1 && (
        <Card className="card-official rounded-2xl">
          <CardContent className="p-7 space-y-5">
            <div>
              <h2 className="text-xl font-display font-semibold text-foreground mb-1">Compensation Details</h2>
              <p className="text-sm text-muted-foreground">Enter the financial terms of your offer.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Base Salary (Annual)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="e.g. 160000"
                    value={offerData.baseSalary}
                    onChange={e => update("baseSalary", e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Bonus / Commission</label>
                  <Input
                    placeholder="e.g. 15% target bonus"
                    value={offerData.bonus}
                    onChange={e => update("bonus", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Equity</label>
                  <Input
                    placeholder="e.g. 50,000 RSUs over 4 years"
                    value={offerData.equity}
                    onChange={e => update("equity", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Additional Details</label>
                <Textarea
                  placeholder="Any other relevant offer terms: signing bonus, relocation, PTO, remote policy, non-compete clauses..."
                  value={offerData.additionalDetails}
                  onChange={e => update("additionalDetails", e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={runScan} disabled={!canAdvanceStep1} className="gap-2">
                Run Offer Clarity Scan <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Scanning */}
      {step === 2 && (
        <Card className="card-official rounded-2xl">
          <CardContent className="p-10 text-center space-y-6">
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
            <div>
              <h2 className="text-xl font-display font-semibold text-foreground mb-2">Analyzing Your Offer</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Running market comparison, transparency check, legal risk scan, leadership analysis, and employee sentiment review for <span className="font-medium text-foreground">{offerData.companyName}</span>.
              </p>
            </div>
            <div className="max-w-xs mx-auto space-y-2">
              <Progress value={scanning ? 65 : 100} className="h-2" />
              <p className="text-[11px] text-muted-foreground">This typically takes 10–20 seconds</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === 3 && report && (
        <OfferClarityDashboard
          report={report}
          offerData={offerData}
          onStartOver={() => {
            setStep(0);
            setReport(null);
            setOfferData({
              roleTitle: "", location: "", yearsExperience: "",
              baseSalary: "", bonus: "", equity: "",
              additionalDetails: "", companyName: "",
            });
          }}
        />
      )}
    </div>
  );
}
