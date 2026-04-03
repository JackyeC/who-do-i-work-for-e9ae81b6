import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Info, ChevronDown, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchExplainerProps {
  alignmentScore: number;
  matchedSignals: string[];
  jobTitle?: string;
  department?: string | null;
  industry?: string;
  employerClarityScore?: number;
}

export function MatchExplainer({
  alignmentScore,
  matchedSignals,
  jobTitle,
  department,
  industry,
  employerClarityScore,
}: MatchExplainerProps) {
  const [open, setOpen] = useState(false);

  const riskNote =
    typeof employerClarityScore === "number" && employerClarityScore < 45
      ? "Employer clarity is below our comfort band for blind trust — read the dossier before you invest time."
      : typeof employerClarityScore === "number" && employerClarityScore < 60
        ? "Mixed transparency — worth a second pass on leadership and labor signals."
        : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7 px-2">
          <Info className="w-3 h-3" />
          Why this matches you
          <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/40 animate-in slide-in-from-top-1">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium text-foreground">
              Values / mission fit: {alignmentScore}%
            </span>
          </div>

          {(jobTitle || department || industry) && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                <span className="text-foreground/90 font-medium">Role family: </span>
                {jobTitle || "—"}
                {department ? ` · ${department}` : ""}
              </p>
              {industry && (
                <p>
                  <span className="text-foreground/90 font-medium">Sector: </span>
                  {industry}
                </p>
              )}
            </div>
          )}

          {typeof employerClarityScore === "number" && (
            <p className="text-xs">
              <span className="text-foreground/90 font-medium">Employer clarity: </span>
              <span className="font-mono">{employerClarityScore}</span>
              {riskNote && (
                <span className="block mt-1.5 text-amber-200/90 leading-relaxed">{riskNote}</span>
              )}
            </p>
          )}

          {matchedSignals.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Signals overlapping your Dream Job Profile:</p>
              <div className="flex flex-wrap gap-1">
                {matchedSignals.map((sig) => (
                  <Badge key={sig} variant="outline" className="text-xs bg-primary/5 border-primary/20">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    {sig}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1.5 border-t border-border/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <ShieldCheck className="w-3 h-3 inline mr-1 text-civic-green" />
              No race, age, or gender data is used in scoring — only public employer signals and your stated preferences (including your Dream Job Profile).
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
