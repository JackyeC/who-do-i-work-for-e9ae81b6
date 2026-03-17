import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowRight, ArrowLeft, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITIES = [
  "Higher pay",
  "Flexibility",
  "Stability",
  "Clear growth and advancement paths",
  "Clear and consistent leadership",
  "Respectful team environment",
  "Work that aligns with your priorities",
  "Clearly defined role and expectations",
  "Transparent communication",
] as const;

const SLIDERS = [
  { left: "Flexible", right: "Structured", key: "flexible_structured" },
  { left: "Remote", right: "In-person", key: "remote_inperson" },
  { left: "Steady", right: "Fast-moving", key: "steady_fastmoving" },
  { left: "Stable", right: "Dynamic", key: "stable_dynamic" },
  { left: "Hands-off", right: "Hands-on", key: "handsoff_handson" },
  { left: "Open", right: "Need-to-know", key: "open_needtoknow" },
] as const;

const AVOIDANCES = [
  "Frequent layoffs or instability",
  "Unsustainable workload or burnout",
  "Inconsistent or unclear management",
  "Below-market compensation",
  "Limited growth opportunities",
  "High turnover or negative culture signals",
  "Unclear role or shifting expectations",
] as const;

export interface WorkProfile {
  priorities: string[];
  avoids: string[];
  sliders: Record<string, number>;
}

const SIGNAL_ADVICE: Record<string, string> = {
  "Higher pay": "Look for companies with transparent compensation data and above-market benchmarks.",
  "Flexibility": "Look for companies with low RTO enforcement signals and remote-friendly hiring patterns.",
  "Stability": "Look for companies with low layoff signals and stable hiring patterns.",
  "Clear growth and advancement paths": "Look for companies with internal mobility signals and defined career tracks.",
  "Clear and consistent leadership": "Look for companies with low executive turnover and consistent sentiment patterns.",
  "Respectful team environment": "Look for companies with positive worker sentiment and low culture risk signals.",
  "Work that aligns with your priorities": "Look for companies whose public stances align with their spending patterns.",
  "Clearly defined role and expectations": "Look for companies with structured job descriptions and clear ATS signals.",
  "Transparent communication": "Look for companies with high transparency scores and public disclosure records.",
};

const AVOID_WARNINGS: Record<string, string> = {
  "Frequent layoffs or instability": "Watch for active WARN notices, workforce reduction signals, or hiring volatility.",
  "Unsustainable workload or burnout": "Watch for burnout themes in worker sentiment and high hiring volume relative to size.",
  "Inconsistent or unclear management": "Watch for executive turnover, leadership gaps, or conflicting public statements.",
  "Below-market compensation": "Watch for missing compensation data or below-benchmark pay signals.",
  "Limited growth opportunities": "Watch for flat hiring patterns and absence of internal mobility signals.",
  "High turnover or negative culture signals": "Watch for recurring negative sentiment themes and rapid hiring cycles.",
  "Unclear role or shifting expectations": "Watch for vague job postings, frequent re-listing, or ghost job signals.",
};

export function getStoredWorkProfile(): WorkProfile | null {
  try {
    const raw = localStorage.getItem("userWorkProfile");
    if (!raw) return null;
    return JSON.parse(raw) as WorkProfile;
  } catch {
    return null;
  }
}

export function WorkProfileQuiz({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [sliders, setSliders] = useState<Record<string, number>>(
    Object.fromEntries(SLIDERS.map((s) => [s.key, 50]))
  );
  const [avoids, setAvoids] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const existing = getStoredWorkProfile();
    if (existing) {
      setPriorities(existing.priorities);
      setSliders(existing.sliders);
      setAvoids(existing.avoids);
      setCompleted(true);
    }
  }, []);

  const togglePriority = (p: string) => {
    setPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : prev.length < 3 ? [...prev, p] : prev
    );
  };

  const toggleAvoid = (a: string) => {
    setAvoids((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : prev.length < 2 ? [...prev, a] : prev
    );
  };

  const handleComplete = () => {
    const profile: WorkProfile = { priorities, avoids, sliders };
    localStorage.setItem("userWorkProfile", JSON.stringify(profile));
    setCompleted(true);
    onComplete?.();
  };

  if (completed) {
    return <WorkProfileResult />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Set Your Work Profile</CardTitle>
          <span className="text-xs text-muted-foreground font-mono">Step {step + 1} of 3</span>
        </div>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {step === 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">What matters most to you in a workplace? Select up to 3.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                    priorities.includes(p)
                      ? "bg-primary/10 border-primary/30 text-primary font-medium"
                      : "bg-card border-border text-foreground/70 hover:border-primary/20"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button onClick={() => setStep(1)} disabled={priorities.length === 0} className="gap-1.5">
              Next <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="text-sm text-muted-foreground mb-5">Where do you fall on these spectrums?</p>
            <div className="space-y-5">
              {SLIDERS.map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground/80">{s.left}</span>
                    <span className="text-xs font-medium text-foreground/80">{s.right}</span>
                  </div>
                  <Slider
                    value={[sliders[s.key]]}
                    onValueChange={([v]) => setSliders((prev) => ({ ...prev, [s.key]: v }))}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(0)} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
              <Button onClick={() => setStep(2)} className="gap-1.5">
                Next <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">What would you want to avoid? Select up to 2.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {AVOIDANCES.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAvoid(a)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                    avoids.includes(a)
                      ? "bg-destructive/10 border-destructive/30 text-destructive font-medium"
                      : "bg-card border-border text-foreground/70 hover:border-destructive/20"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
              <Button onClick={handleComplete} disabled={avoids.length === 0} className="gap-1.5">
                <Check className="w-3.5 h-3.5" /> Save Profile
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WorkProfileResult() {
  const [open, setOpen] = useState(false);
  const profile = getStoredWorkProfile();
  if (!profile) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Your Work Profile</CardTitle>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.priorities.map((p) => (
                <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
              ))}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">What to look for</p>
              <ul className="space-y-1.5">
                {profile.priorities.map((p) => (
                  <li key={p} className="text-sm text-foreground/85 leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[hsl(var(--civic-green))]/40">
                    {SIGNAL_ADVICE[p] || `Evaluate ${p.toLowerCase()} signals in each company profile.`}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Watch for</p>
              <ul className="space-y-1.5">
                {profile.avoids.map((a) => (
                  <li key={a} className="text-sm text-foreground/85 leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-destructive/40">
                    {AVOID_WARNINGS[a] || `Monitor for ${a.toLowerCase()} signals.`}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                localStorage.removeItem("userWorkProfile");
                window.location.reload();
              }}
            >
              Reset profile
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
