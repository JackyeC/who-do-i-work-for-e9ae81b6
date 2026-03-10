import { useState, useEffect } from "react";
import { useAutoApplySettings } from "@/hooks/use-auto-apply";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Zap, Pause, Play, Settings, ArrowRight,
  Search, FileText, Send, CheckCircle2, Heart,
  Building2, Scale, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

const HOW_IT_WORKS_STEPS = [
  {
    icon: Search,
    title: "We scan jobs daily",
    description: "New jobs from tracked companies are checked against your values profile automatically.",
  },
  {
    icon: Heart,
    title: "We score each job",
    description: "Each job gets a match % based on the company's political spending, workplace signals, and how they align with the values YOU picked.",
  },
  {
    icon: FileText,
    title: "AI writes your cover letter",
    description: "For jobs above your threshold, AI generates a personalized cover letter that highlights why you're a values-aligned fit.",
  },
  {
    icon: Send,
    title: "Ready to send",
    description: "Queued applications appear below with one-click copy & apply. Nothing is sent without your review.",
  },
];

const SCORE_EXPLAINER: Record<number, { label: string; description: string; color: string }> = {
  40: { label: "Cast a wide net", description: "You'll see most jobs — even from companies with limited transparency data", color: "text-amber-600" },
  50: { label: "Some alignment", description: "Companies with at least basic public records and some values overlap", color: "text-amber-500" },
  60: { label: "Moderate alignment", description: "Companies that have documented signals matching several of your values", color: "text-primary" },
  70: { label: "Strong alignment", description: "Only companies with clear evidence of values alignment across multiple categories", color: "text-primary" },
  80: { label: "Very selective", description: "Only top-scoring companies with strong, verified signals in your values areas", color: "text-emerald-600" },
  90: { label: "Best matches only", description: "Extremely selective — only companies with the strongest alignment to your values", color: "text-emerald-600" },
  100: { label: "Perfect match", description: "Almost nothing will qualify — requires near-perfect alignment", color: "text-emerald-700" },
};

function getScoreExplainer(threshold: number) {
  const keys = Object.keys(SCORE_EXPLAINER).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) => Math.abs(curr - threshold) < Math.abs(prev - threshold) ? curr : prev);
  return SCORE_EXPLAINER[closest];
}

export function AutoApplySettings() {
  const { settings, isLoading, upsert } = useAutoApplySettings();
  const [threshold, setThreshold] = useState(70);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [enabled, setEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(true);

  useEffect(() => {
    if (settings) {
      setThreshold(settings.min_alignment_threshold);
      setDailyLimit(settings.max_daily_applications);
      setEnabled(settings.is_enabled);
      setPaused(settings.is_paused);
      setShowHowItWorks(false);
    }
  }, [settings]);

  const handleSave = () => {
    upsert.mutate({
      is_enabled: enabled,
      min_alignment_threshold: threshold,
      max_daily_applications: dailyLimit,
      is_paused: paused,
    });
    setShowHowItWorks(false);
  };

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    upsert.mutate({ is_paused: next });
  };

  const explainer = getScoreExplainer(threshold);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* How It Works — always visible for new users, collapsible after */}
      {showHowItWorks && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              How Values-Based Auto-Apply Works
            </CardTitle>
            <CardDescription>
              This isn't a normal job board. We only queue jobs at companies that match <strong>your values</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {HOW_IT_WORKS_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="relative">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <StepIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-primary">STEP {i + 1}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                    {i < HOW_IT_WORKS_STEPS.length - 1 && (
                      <ArrowRight className="hidden lg:block absolute -right-3 top-3 w-4 h-4 text-primary/30" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-background border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">🔒 You stay in control:</strong> Auto-Apply generates cover letters and queues them — but <strong>nothing is submitted without you clicking "Apply."</strong> Think of it as your AI assistant that pre-writes applications only for companies that pass your values test.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What your match score means */}
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="w-5 h-5 text-primary" />
                Your Match Score = Your Values
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-relaxed">
                Every job gets a score based on how the company's <strong>real behavior</strong> lines up with what matters to you:
              </CardDescription>
            </div>
            {!showHowItWorks && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowHowItWorks(true)}>
                How does this work?
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Company Footprint</span>
                <Badge variant="outline" className="text-[9px]">40%</Badge>
              </div>
              <p className="text-muted-foreground">How politically active is this company? PAC spending, lobbying, government contracts.</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Workplace Signals</span>
                <Badge variant="outline" className="text-[9px]">~30%</Badge>
              </div>
              <p className="text-muted-foreground">Benefits, worker sentiment, AI hiring tools, enforcement actions — what's it like to work there?</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Your Values Match</span>
                <Badge variant="outline" className="text-[9px]">~30%</Badge>
              </div>
              <p className="text-muted-foreground">Does the company's spending and lobbying align with the issues <em>you</em> care about?</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Your Auto-Apply Rules
              </CardTitle>
              <CardDescription className="mt-1">
                Set your minimum standards. Only jobs that pass these rules get queued.
              </CardDescription>
            </div>
            <Badge
              variant={paused ? "secondary" : enabled ? "default" : "outline"}
              className="text-xs"
            >
              {paused ? "Paused" : enabled ? "Active" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Turn on Auto-Apply</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                When enabled, jobs above your threshold are automatically queued for cover letter generation
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Threshold slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Minimum Values Match
              </Label>
              <span className="text-sm font-semibold text-primary">{threshold}%</span>
            </div>
            <Slider
              value={[threshold]}
              onValueChange={([v]) => setThreshold(v)}
              min={40}
              max={100}
              step={5}
            />
            {/* Dynamic explainer */}
            <div className={cn("p-3 rounded-lg border", threshold >= 70 ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-border")}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-sm font-semibold", explainer.color)}>{explainer.label}</span>
                <span className="text-xs text-muted-foreground">({threshold}%)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {explainer.description}
              </p>
            </div>
          </div>

          {/* Daily limit */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              Daily Application Limit
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={25}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Math.max(1, Math.min(25, Number(e.target.value))))}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">
                applications per day max
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Keeps your applications targeted instead of spamming. Quality over quantity.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button onClick={handleSave} disabled={upsert.isPending} size="sm" className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Rules
            </Button>
            <Button
              onClick={togglePause}
              variant={paused ? "default" : "secondary"}
              size="sm"
              className="gap-1.5"
            >
              {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {paused ? "Resume" : "Pause"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
