import { AlertTriangle, ExternalLink, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConflictSignal {
  company_name: string;
  company_slug: string;
  public_claim: string;
  conflicting_evidence: string;
  evidence_url?: string;
  lens_label: string;
}

interface Props {
  conflicts: ConflictSignal[];
}

export function ValueConflictAlert({ conflicts }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />
        <h3 className="text-sm font-semibold text-foreground">Value Conflict Signals</h3>
        <Badge variant="outline" className="text-[10px] border-[hsl(var(--civic-yellow))]/30 text-[hsl(var(--civic-yellow))]">
          {conflicts.length} detected
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        These companies have public messaging that may differ from their documented political spending, lobbying, or advocacy activity.
        This does not imply wrongdoing — interpretation is left to the user.
      </p>
      <div className="space-y-2">
        {conflicts.map((c, i) => (
          <Card key={i} className="border-[hsl(var(--civic-yellow))]/20 bg-[hsl(var(--civic-yellow))]/[0.03]">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">{c.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Public claim:</strong> {c.public_claim}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Evidence:</strong> {c.conflicting_evidence}
                  </p>
                  {c.evidence_url && (
                    <a
                      href={c.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <Shield className="w-3 h-3" /> View source <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
