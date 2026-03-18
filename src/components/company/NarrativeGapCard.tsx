import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, TrendingUp, AlertCircle } from "lucide-react";

interface NarrativeGapCardProps {
  companyName: string;
  lastAuditedAt?: string | null;
  signalGroupCount: number;
  isCertified: boolean;
}

export function NarrativeGapCard({ companyName, lastAuditedAt, signalGroupCount, isCertified }: NarrativeGapCardProps) {
  if (isCertified) return null;

  const isStale = !lastAuditedAt || (Date.now() - new Date(lastAuditedAt).getTime()) > 180 * 24 * 60 * 60 * 1000;
  const isSparse = signalGroupCount < 3;

  if (!isStale && !isSparse) return null;

  return (
    <Card className="border-[hsl(var(--civic-gold))]/30 bg-[hsl(var(--civic-gold))]/[0.04] overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[hsl(var(--civic-gold))] via-[hsl(var(--civic-gold-muted))] to-transparent" />
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--civic-gold))]/15 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-4.5 h-4.5 text-[hsl(var(--civic-gold))]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-sm font-bold text-foreground">The Narrative Gap</h3>
              <Badge variant="outline" className="text-xs font-mono tracking-wider border-[hsl(var(--civic-gold))]/20 text-[hsl(var(--civic-gold))]">
                OPPORTUNITY
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Current public records are incomplete. <span className="text-foreground font-medium">{companyName}</span> has
              an opportunity to provide context and verify their 2026 alignment.
              {isStale && " Intelligence data hasn't been refreshed recently."}
              {isSparse && " Key signal categories are missing from the public record."}
            </p>
            <div className="flex items-center gap-3">
              <Button asChild size="sm" className="bg-[hsl(var(--civic-gold))] hover:bg-[hsl(var(--civic-gold))]/90 text-foreground gap-1.5 font-semibold text-xs">
                <Link to="/for-employers">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Claim This Profile & Provide Context
                </Link>
              </Button>
              <span className="text-xs text-muted-foreground">
                Narrative Alignment Package · $599/yr
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
