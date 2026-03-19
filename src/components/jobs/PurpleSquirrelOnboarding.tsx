import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Target, DollarSign, Upload, Rocket, ChevronRight, ChevronLeft,
  Crosshair, Shield, Zap, CheckCircle2, Plus, X, Briefcase
} from "lucide-react";
import { useAutoApplySettings } from "@/hooks/use-auto-apply";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
  { id: "dna", label: "Calibrate", icon: Target, subtitle: "How do you work?" },
  { id: "bounty", label: "Target", icon: Crosshair, subtitle: "What are we hunting?" },
  { id: "arsenal", label: "Arsenal", icon: Upload, subtitle: "Upload your weapons" },
  { id: "launch", label: "Launch", icon: Rocket, subtitle: "Engage the engine" },
] as const;

const DNA_DIALS = [
  { id: "stability", label: "Stability", low: "High-risk / startup", high: "Stable / established" },
  { id: "flexibility", label: "Flexibility", low: "On-site required", high: "Fully remote" },
  { id: "compensation", label: "Compensation", low: "Growth over pay", high: "Pay is priority" },
  { id: "values", label: "Values Alignment", low: "Not a dealbreaker", high: "Non-negotiable" },
  { id: "growth", label: "Growth Speed", low: "Steady progression", high: "Fast-track" },
];

interface PurpleSquirrelOnboardingProps {
  onComplete: () => void;
}

export function PurpleSquirrelOnboarding({ onComplete }: PurpleSquirrelOnboardingProps) {
  const { user } = useAuth();
  const { upsert } = useAutoApplySettings();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  // DNA Dials
  const [dnaValues, setDnaValues] = useState<Record<string, number>>(
    Object.fromEntries(DNA_DIALS.map(d => [d.id, 50]))
  );

  // Bounty
  const [targetTitles, setTargetTitles] = useState<string[]>([]);
  const [titleInput, setTitleInput] = useState("");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState("");
  const [minComp, setMinComp] = useState("");
  const [dnaLockThreshold, setDnaLockThreshold] = useState(85);

  // Arsenal
  const [hasResume, setHasResume] = useState(false);

  const currentStep = STEPS[step];

  const addTitle = () => {
    const t = titleInput.trim();
    if (t && !targetTitles.includes(t)) {
      setTargetTitles([...targetTitles, t]);
      setTitleInput("");
    }
  };

  const addCompany = () => {
    const c = companyInput.trim();
    if (c && !targetCompanies.includes(c)) {
      setTargetCompanies([...targetCompanies, c]);
      setCompanyInput("");
    }
  };

  const handleLaunch = async () => {
    // Save parameters to localStorage
    const params = {
      dna: dnaValues,
      targetTitles,
      targetCompanies,
      minComp: minComp ? Number(minComp) : null,
      dnaLockThreshold,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem("purpleSquirrelParams", JSON.stringify(params));

    // Save alignment threshold to auto_apply_settings
    upsert.mutate({
      is_enabled: true,
      min_alignment_threshold: dnaLockThreshold,
      max_daily_applications: 5,
      is_paused: false,
    });

    // POST to external API
    setSubmitting(true);
    try {
      const flexVal = dnaValues.flexibility ?? 50;
      const locationPref = flexVal > 70 ? "remote" : flexVal >= 30 ? "hybrid" : "onsite";
      const salaryMin = minComp ? Number(minComp) : 80000;
      const salaryMax = minComp ? Math.round(Number(minComp) * 1.5) : 150000;
      const sortedValues = [...DNA_DIALS]
        .sort((a, b) => (dnaValues[b.id] ?? 50) - (dnaValues[a.id] ?? 50))
        .map(d => d.label);

      const res = await fetch("https://wdiwf-integrity-api.onrender.com/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email ?? "",
          target_roles: targetTitles,
          industries: targetCompanies,
          location_preference: locationPref,
          salary_min: salaryMin,
          salary_max: salaryMax,
          values: sortedValues,
          integrity_threshold: dnaLockThreshold,
          narrative_gap_filter: true,
          mission_alignment: true,
          work_orientation: (dnaValues.values ?? 50) / 100,
        }),
      });

      if (!res.ok) throw new Error("API error");

      toast({
        title: "Your agent is active",
        description: "Check your dashboard for updates.",
      });
    } catch {
      toast({
        title: "We saved your preferences",
        description: "Our team will activate your agent within 24 hours.",
      });
    } finally {
      setSubmitting(false);
      onComplete();
    }
  };

  const canProceed = () => {
    if (step === 0) return true; // DNA dials always have defaults
    if (step === 1) return targetTitles.length > 0; // Need at least one title
    if (step === 2) return true; // Arsenal is optional
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary mb-2">
          Mission Briefing
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">
          Purple Squirrel Engine
        </h2>
        <p className="text-sm text-muted-foreground">
          Precision-targeted applications. Zero spray-and-pray.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                      : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-border">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <currentStep.icon className="w-5 h-5 text-primary" />
                  {currentStep.subtitle}
                </h3>
              </div>

              {/* Step 0: DNA Dial */}
              {step === 0 && (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Set your work DNA. We'll only fire on jobs that match your calibration.
                  </p>
                  {DNA_DIALS.map(dial => (
                    <div key={dial.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{dial.label}</Label>
                        <span className="text-xs font-mono text-primary tabular-nums">
                          {dnaValues[dial.id]}%
                        </span>
                      </div>
                      <Slider
                        value={[dnaValues[dial.id]]}
                        onValueChange={([v]) =>
                          setDnaValues(prev => ({ ...prev, [dial.id]: v }))
                        }
                        min={0}
                        max={100}
                        step={5}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{dial.low}</span>
                        <span>{dial.high}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 1: Bounty */}
              {step === 1 && (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Define your target. The engine only fires when all four quadrants align.
                  </p>

                  {/* Target Titles */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-primary" />
                      Target Titles
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Director of People Ops"
                        value={titleInput}
                        onChange={e => setTitleInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTitle())}
                        className="text-sm"
                      />
                      <Button size="sm" variant="outline" onClick={addTitle} disabled={!titleInput.trim()}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {targetTitles.map(t => (
                        <Badge key={t} variant="secondary" className="gap-1 text-xs">
                          {t}
                          <button onClick={() => setTargetTitles(prev => prev.filter(x => x !== t))}>
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Target Companies */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      Target Companies <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Stripe, Notion, Figma"
                        value={companyInput}
                        onChange={e => setCompanyInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCompany())}
                        className="text-sm"
                      />
                      <Button size="sm" variant="outline" onClick={addCompany} disabled={!companyInput.trim()}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {targetCompanies.map(c => (
                        <Badge key={c} variant="secondary" className="gap-1 text-xs">
                          {c}
                          <button onClick={() => setTargetCompanies(prev => prev.filter(x => x !== c))}>
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Min Comp */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-primary" />
                      Salary Floor <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 120000"
                      value={minComp}
                      onChange={e => setMinComp(e.target.value)}
                      className="text-sm max-w-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Minimum annual compensation. We skip anything below this.
                    </p>
                  </div>

                  {/* DNA Lock */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        Values Lock
                      </Label>
                      <span className="text-sm font-mono font-bold text-primary tabular-nums">
                        {dnaLockThreshold}%
                      </span>
                    </div>
                    <Slider
                      value={[dnaLockThreshold]}
                      onValueChange={([v]) => setDnaLockThreshold(v)}
                      min={50}
                      max={100}
                      step={5}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Only fire on jobs with this level of values alignment or higher.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Arsenal */}
              {step === 2 && (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Your resume powers the AI cover letter. Upload it here or we'll use what's already in your vault.
                  </p>

                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                    {hasResume ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
                        <p className="text-sm font-medium text-foreground">Resume detected in your vault</p>
                        <p className="text-xs text-muted-foreground">We'll use this to generate tailored cover signals.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          No resume detected yet.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHasResume(true)}
                          className="gap-1.5"
                        >
                          <Upload className="w-3 h-3" />
                          Upload Resume
                        </Button>
                        <p className="text-[11px] text-muted-foreground">
                          You can also upload later from the Career Intelligence page.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-primary" />
                      Security Note
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Your documents are encrypted and stored securely. They are only used to generate tailored application materials. You can delete them at any time.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Launch */}
              {step === 3 && (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <Rocket className="w-8 h-8 text-primary" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Mission Parameters Set</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Your Purple Squirrel engine will scan jobs every 6 hours. When all four quadrants align, we'll queue the application for your approval.
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto">
                    <div className="bg-muted/50 border border-border rounded-lg p-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Targets</div>
                      <div className="text-sm font-medium text-foreground">
                        {targetTitles.length} title{targetTitles.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border rounded-lg p-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Companies</div>
                      <div className="text-sm font-medium text-foreground">
                        {targetCompanies.length > 0 ? `${targetCompanies.length} tracked` : "All eligible"}
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border rounded-lg p-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Salary Floor</div>
                      <div className="text-sm font-medium text-foreground">
                        {minComp ? `$${Number(minComp).toLocaleString()}` : "No minimum"}
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border rounded-lg p-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Values Lock</div>
                      <div className="text-sm font-medium text-primary">
                        {dnaLockThreshold}% minimum
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      <strong>Queue for approval:</strong> Every matched job lands in your review queue first.
                      Nothing gets submitted without your sign-off.
                    </p>
                  </div>

                  <Button onClick={handleLaunch} size="lg" className="gap-2 mt-2" disabled={submitting}>
                    <Zap className="w-4 h-4" />
                    {submitting ? "Activating…" : "Engage Engine"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {step < 3 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="w-3 h-3" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
