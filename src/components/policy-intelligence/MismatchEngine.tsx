import { useState } from "react";
import { IntelligenceEmptyState } from "@/components/intelligence/IntelligenceEmptyState";
import { AlertTriangle, ExternalLink, Shield, CheckCircle2, HelpCircle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityDetailDrawer, type DarkMoneyEntity } from "@/components/company/EntityDetailDrawer";

interface Stance {
  topic: string;
  public_position: string;
  spending_reality: string;
  gap: string;
}

interface DarkMoneyEntry {
  name: string;
  org_type: string;
  estimated_amount: number | null;
  source: string | null;
}

interface Props {
  stances: Stance[];
  darkMoney: DarkMoneyEntry[];
  tradeAssociations: Array<{ name: string }>;
  companyName?: string;
}

const GAP_CONFIG = {
  "direct-conflict": { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/5 border-destructive/20", label: "Contradiction Detected" },
  mixed: { icon: HelpCircle, color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/5 border-[hsl(var(--civic-yellow))]/20", label: "Mixed Signals" },
  aligned: { icon: CheckCircle2, color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/5 border-[hsl(var(--civic-green))]/20", label: "Aligned" },
} as const;

export function MismatchEngine({ stances, darkMoney, tradeAssociations, companyName }: Props) {
  const [selectedEntity, setSelectedEntity] = useState<DarkMoneyEntity | null>(null);
  const conflicts = stances.filter(s => s.gap === "direct-conflict");
  const mixed = stances.filter(s => s.gap === "mixed");
  const aligned = stances.filter(s => s.gap === "aligned");

  const sortedStances = [...conflicts, ...mixed, ...aligned];

  if (sortedStances.length === 0 && darkMoney.length === 0) {
    return <IntelligenceEmptyState category="mismatch" state="after" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-foreground">Say vs. Do Analysis</h3>
        {conflicts.length > 0 && (
           <Badge variant="destructive" className="text-xs">{conflicts.length} contradiction{conflicts.length > 1 ? "s" : ""}</Badge>
        )}
        {mixed.length > 0 && (
          <Badge variant="warning" className="text-xs">{mixed.length} mixed</Badge>
        )}
        {aligned.length > 0 && (
          <Badge variant="success" className="text-xs">{aligned.length} aligned</Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Comparing public corporate statements against observable spending, lobbying, and association activity.
        Gaps don't imply wrongdoing — they represent areas worth understanding.
      </p>

      <div className="space-y-2">
        {sortedStances.map((s, i) => {
          const config = GAP_CONFIG[s.gap as keyof typeof GAP_CONFIG] ?? GAP_CONFIG.mixed;
          const Icon = config.icon;
          return (
            <Card key={i} className={`${config.bg}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 ${config.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{s.topic}</p>
                      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Public position:</strong> {s.public_position}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Spending reality:</strong> {s.spending_reality}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {darkMoney.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            Undisclosed Spending Channels
          </h4>
          {darkMoney.map((dm, i) => (
            <Card key={i} className="border-border/40 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedEntity({ name: dm.name, org_type: dm.org_type, estimated_amount: dm.estimated_amount, source: dm.source ?? undefined, relationship: "Undisclosed spending channel", confidence: null })}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{dm.name}</p>
                    <p className="text-xs text-muted-foreground">{dm.org_type} · {dm.estimated_amount ? `~$${dm.estimated_amount.toLocaleString()}` : "Amount undisclosed"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tradeAssociations.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-foreground mb-2">Trade Association Memberships</h4>
          <div className="flex flex-wrap gap-1.5">
            {tradeAssociations.map((ta, i) => (
              <Badge key={i} variant="outline" className="text-xs">{ta.name}</Badge>
            ))}
          </div>
        </div>
      )}

      <EntityDetailDrawer
        entity={selectedEntity}
        companyName={companyName}
        open={!!selectedEntity}
        onOpenChange={(open) => { if (!open) setSelectedEntity(null); }}
      />
    </div>
  );
}
