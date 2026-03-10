import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Sun, Crown, Target, Zap, Flame, Cpu, Rocket, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const ANCHORS = [
  { id: "security", label: "Security / Stability", icon: Shield, description: "Predictable career growth, job security, and benefits" },
  { id: "lifestyle", label: "Lifestyle / Flexibility", icon: Sun, description: "Work-life balance, location freedom, flexible schedule" },
  { id: "leadership", label: "Leadership", icon: Crown, description: "Managing teams, influencing strategy, executive roles" },
  { id: "purpose", label: "Purpose / Impact", icon: Target, description: "Meaningful work that contributes to a greater mission" },
  { id: "autonomy", label: "Autonomy", icon: Zap, description: "Independence, self-direction, minimal oversight" },
  { id: "challenge", label: "Pure Challenge", icon: Flame, description: "Complex problems, competitive environments, mastery" },
  { id: "technical", label: "Technical Mastery", icon: Cpu, description: "Becoming a deep expert in your craft or domain" },
  { id: "entrepreneurship", label: "Entrepreneurship", icon: Rocket, description: "Building ventures, creating something new, risk-taking" },
] as const;

interface Props {
  onComplete: (anchors: string[]) => void;
}

export function CareerAnchorsStep({ onComplete }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [ranked, setRanked] = useState<string[]>([]);

  const toggleAnchor = (id: string) => {
    if (ranked.includes(id)) {
      setRanked(ranked.filter(r => r !== id));
      setSelected(selected.filter(s => s !== id));
      return;
    }
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
      return;
    }
    if (ranked.length < 3) {
      setRanked([...ranked, id]);
      setSelected([...selected, id]);
    } else {
      setSelected([...selected, id]);
    }
  };

  const getRank = (id: string) => ranked.indexOf(id) + 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What Drives Your Career?</CardTitle>
          <p className="text-xs text-muted-foreground">
            Select what matters most to you. Your first 3 selections become your top priorities and will influence AI recommendations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ANCHORS.map(anchor => {
              const Icon = anchor.icon;
              const rank = getRank(anchor.id);
              const isSelected = selected.includes(anchor.id);
              return (
                <button key={anchor.id} onClick={() => toggleAnchor(anchor.id)}
                  className={cn(
                    "relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                    rank > 0 && "border-primary bg-primary/5 ring-1 ring-primary/20",
                    isSelected && !rank && "border-primary/40 bg-primary/5",
                    !isSelected && "border-border hover:border-primary/30 hover:bg-muted/30",
                  )}>
                  {rank > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                      {rank}
                    </div>
                  )}
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    rank > 0 ? "bg-primary/10" : "bg-muted")}>
                    <Icon className={cn("w-4.5 h-4.5", rank > 0 ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", isSelected ? "text-foreground" : "text-foreground/80")}>{anchor.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{anchor.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {ranked.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">YOUR TOP PRIORITIES</p>
              <div className="flex flex-wrap gap-2">
                {ranked.map((id, i) => {
                  const anchor = ANCHORS.find(a => a.id === id);
                  if (!anchor) return null;
                  const Icon = anchor.icon;
                  return (
                    <div key={id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-primary/20">
                      <span className="text-xs font-bold text-primary">#{i + 1}</span>
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium">{anchor.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onComplete(ranked)} disabled={ranked.length < 1}>
          Continue
        </Button>
      </div>
    </div>
  );
}
