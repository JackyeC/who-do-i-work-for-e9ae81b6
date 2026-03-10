import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Scale, ShieldAlert, Clock, Lightbulb, Gavel, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LegalFlag {
  id: string;
  severity: "red" | "yellow" | "green";
  category: string;
  title: string;
  description: string;
  legalBasis: string;
  negotiationTip: string;
}

interface Props {
  flags: LegalFlag[];
}

const SEVERITY_CONFIG = {
  red: { label: "High Risk", color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20", icon: XCircle },
  yellow: { label: "Caution", color: "text-civic-yellow", bg: "bg-civic-yellow/5", border: "border-civic-yellow/20", icon: AlertTriangle },
  green: { label: "Standard", color: "text-civic-green", bg: "bg-civic-green/5", border: "border-civic-green/20", icon: CheckCircle2 },
};

export function CivicLegalAudit({ flags }: Props) {
  const redFlags = flags.filter(f => f.severity === "red");
  const yellowFlags = flags.filter(f => f.severity === "yellow");
  const greenFlags = flags.filter(f => f.severity === "green");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-display font-bold text-foreground mb-1">
          Civic & Legal Audit
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          We scan for 2026 legal "truth facts" — clauses that many candidates miss because they sound normal but carry real consequences.
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { count: redFlags.length, label: "Red Flags", color: "text-destructive", bg: "bg-destructive/5" },
          { count: yellowFlags.length, label: "Cautions", color: "text-civic-yellow", bg: "bg-civic-yellow/5" },
          { count: greenFlags.length, label: "Standard", color: "text-civic-green", bg: "bg-civic-green/5" },
        ].map(item => (
          <div key={item.label} className={cn("rounded-xl p-3 text-center", item.bg)}>
            <p className={cn("text-2xl font-display font-bold", item.color)}>{item.count}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Flags list */}
      <div className="space-y-3">
        {flags.map(flag => {
          const config = SEVERITY_CONFIG[flag.severity];
          const Icon = config.icon;
          return (
            <Card key={flag.id} className={cn("rounded-xl border", config.border)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{flag.title}</h3>
                      <Badge variant="outline" className={cn("text-[9px]", config.color)}>
                        {flag.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{flag.description}</p>
                  </div>
                </div>

                <div className="ml-11 space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                    <Scale className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">Legal basis: </span>
                      {flag.legalBasis}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg">
                    <Lightbulb className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-primary">Negotiation tip: </span>
                      {flag.negotiationTip}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {flags.length === 0 && (
        <Card className="rounded-xl border-border/40">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-civic-green mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No significant legal flags detected. Review the full analysis for details.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
