import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PatternsSynthesisProps {
  patterns: string[];
  companyName: string;
}

export function PatternsSynthesisLayer({ patterns, companyName }: PatternsSynthesisProps) {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground">No notable patterns identified yet for {companyName}.</p>
        <p className="text-micro text-muted-foreground mt-1">Patterns emerge as more data is collected through scans.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-caption text-muted-foreground">Key observations synthesized from available evidence:</p>
      {patterns.map((pattern, i) => (
        <Card key={i} className="border-border/30 border-l-4 border-l-primary/40">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-micro font-bold text-primary">{i + 1}</span>
            </div>
            <p className="text-body text-foreground leading-relaxed">{pattern}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
