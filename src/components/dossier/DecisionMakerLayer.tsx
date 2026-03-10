import { Target, Users, Shield, Scale, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DecisionMaker {
  name: string;
  title: string;
  role: "champion" | "blocker" | "economic_buyer" | "legal_finance" | "executive_sponsor";
  confidence: "high" | "medium" | "low";
  basis?: string;
}

interface DecisionMakerProps {
  decisionMakers: DecisionMaker[];
  companyName: string;
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  champion: { label: "Likely Champion", icon: Target, color: "text-civic-green" },
  blocker: { label: "Likely Blocker", icon: Shield, color: "text-destructive" },
  economic_buyer: { label: "Economic Buyer", icon: Scale, color: "text-civic-blue" },
  legal_finance: { label: "Legal / Finance", icon: Briefcase, color: "text-civic-yellow" },
  executive_sponsor: { label: "Executive Sponsor", icon: Users, color: "text-primary" },
};

export function DecisionMakerLayer({ decisionMakers, companyName }: DecisionMakerProps) {
  if (decisionMakers.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground">No decision-maker mapping available yet for {companyName}.</p>
        <p className="text-micro text-muted-foreground mt-1">This module is populated through organizational analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-caption text-muted-foreground">
        Inferred power centers based on organizational structure, procurement patterns, and governance clues. 
        Confidence labels reflect data availability.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {decisionMakers.map((dm, i) => {
          const config = roleConfig[dm.role] || roleConfig.champion;
          const Icon = config.icon;
          return (
            <Card key={i} className="border-border/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-body">{dm.name}</div>
                    <div className="text-caption text-muted-foreground">{dm.title}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-micro">{config.label}</Badge>
                      <span className="text-micro text-muted-foreground">
                        {dm.confidence === "high" ? "High confidence" : dm.confidence === "medium" ? "Medium confidence" : "Low confidence"}
                      </span>
                    </div>
                    {dm.basis && <p className="text-micro text-muted-foreground mt-1.5">{dm.basis}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
