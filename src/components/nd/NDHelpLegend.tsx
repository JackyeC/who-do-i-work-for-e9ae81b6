import { useState } from "react";
import { HelpCircle, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetNDOnboarding } from "@/components/nd/NDOnboardingWalkthrough";

interface NDHelpLegendProps {
  onReplayWalkthrough: () => void;
}

const legendSections = [
  {
    title: "Ratings: Low, Medium, High",
    items: [
      { label: "Low", color: "bg-civic-green", meaning: "This area looks manageable based on available data." },
      { label: "Medium", color: "bg-civic-yellow", meaning: "Some signals to be aware of. Worth asking about." },
      { label: "High", color: "bg-destructive", meaning: "Strong signals that may need careful consideration." },
    ],
  },
  {
    title: "Page sections",
    items: [
      { label: "Quick Read", meaning: "Five key indicators about what this workplace may be like." },
      { label: "What We Found", meaning: "Evidence from public records with plain-language explanations." },
      { label: "What It Feels Like", meaning: "How signals translate into daily work experience." },
      { label: "Questions", meaning: "Interview questions you can copy, with softer versions." },
      { label: "Use In My Application", meaning: "How to apply what you learned to your resume, cover letter, or interview." },
    ],
  },
  {
    title: "View modes",
    items: [
      { label: "Detailed", meaning: "Shows all information in every section." },
      { label: "Summary", meaning: "Shows only the most important points." },
      { label: "Checklist", meaning: "Action-oriented list of things to check or do." },
      { label: "Script", meaning: "Ready-to-use scripts for interviews and applications." },
    ],
  },
];

export function NDHelpLegend({ onReplayWalkthrough }: NDHelpLegendProps) {
  const [open, setOpen] = useState(false);

  const handleReplay = () => {
    resetNDOnboarding();
    setOpen(false);
    onReplayWalkthrough();
  };

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Open help legend"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Legend panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 max-h-[70vh] overflow-y-auto border border-border/50 bg-card shadow-xl">
          <div className="sticky top-0 bg-card border-b border-border/30 p-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">ND Mode Help</h3>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted/40 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {legendSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  {section.title}
                </h4>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.label} className="flex items-start gap-2">
                      {"color" in item && (
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${(item as any).color}`} />
                      )}
                      <div>
                        <span className="text-xs font-medium text-foreground">{item.label}</span>
                        <span className="text-xs text-foreground/60"> — {item.meaning}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-border/30 pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5 w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleReplay}
              >
                <RotateCcw className="w-3 h-3" />
                Show walkthrough again
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
