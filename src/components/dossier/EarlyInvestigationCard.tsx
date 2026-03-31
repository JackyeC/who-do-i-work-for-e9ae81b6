import { FileSearch, AlertTriangle, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EarlyInvestigationCardProps {
  companyName: string;
  signalCount: number;
  hasExecutives?: boolean;
  hasContracts?: boolean;
  hasPublicStances?: boolean;
  hasEeocCases?: boolean;
}

export function EarlyInvestigationCard({
  companyName,
  signalCount,
  hasExecutives,
  hasContracts,
  hasPublicStances,
  hasEeocCases,
}: EarlyInvestigationCardProps) {
  const available: string[] = [];
  if (signalCount > 0) available.push(`${signalCount} signal${signalCount !== 1 ? "s" : ""}`);
  if (hasExecutives) available.push("executive records");
  if (hasContracts) available.push("government contracts");
  if (hasPublicStances) available.push("public stances");
  if (hasEeocCases) available.push("enforcement actions");

  return (
    <div className="space-y-4">
      <Card className="border-2 border-[hsl(var(--civic-yellow))]/40 bg-[hsl(var(--civic-yellow))]/5 rounded-none">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <FileSearch className="w-8 h-8 text-[hsl(var(--civic-yellow))] shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="text-xs border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] font-mono uppercase tracking-wider"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Early Investigation
                </Badge>
              </div>
              <h2 className="text-lg md:text-xl font-black tracking-tight text-foreground mb-2">
                We're still pulling the receipts on {companyName}.
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                Here's what we know so far:
              </p>
              {available.length > 0 ? (
                <ul className="space-y-1.5">
                  {available.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground/75">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--civic-yellow))] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No records found yet. Check back as our research progresses.
                </p>
              )}
              <p className="mt-4 text-xs text-muted-foreground italic">
                Scores and verdicts will appear once we have enough data to make a responsible assessment (minimum 5 verified signals).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community investigation CTA */}
      <Card className="border-2 border-primary/30 bg-primary/5 rounded-none">
        <CardContent className="p-6 text-center">
          <MessageSquare className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-base font-black tracking-tight text-foreground mb-1">
            Know something about {companyName}?
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Help us investigate. If you've worked there, seen something, or have a public source — your intel makes the record stronger for everyone.
          </p>
          <Link to={`/request-correction?company=${encodeURIComponent(companyName)}`}>
            <Button size="lg" className="gap-2 font-semibold">
              <MessageSquare className="w-4 h-4" />
              Help Us Investigate
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export const EARLY_INVESTIGATION_THRESHOLD = 5;
