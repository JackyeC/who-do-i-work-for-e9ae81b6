import { useState } from "react";
import { DollarSign, Megaphone, Landmark, Network, ChevronDown, ExternalLink, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Signal {
  label: string;
  summary: string;
  sourceType: string;
  sourceUrl?: string;
  confidence: "strong" | "likely" | "possible";
  amount?: number;
}

interface InfluencePolicyProps {
  politicalGiving: Signal[];
  lobbyingActivity: Signal[];
  governmentContracts: Signal[];
  policyLinks: Signal[];
}

function ConfidenceBadge({ level }: { level: Signal["confidence"] }) {
  const styles = {
    strong: "bg-civic-green/10 text-civic-green border-civic-green/20",
    likely: "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20",
    possible: "bg-muted text-muted-foreground border-border/40",
  };
  const labels = { strong: "Strong Evidence", likely: "Likely Connection", possible: "Possible Connection" };
  return <Badge variant="outline" className={cn("text-micro", styles[level])}>{labels[level]}</Badge>;
}

function SignalGroup({ title, icon: Icon, signals, defaultOpen = false }: { title: string; icon: React.ElementType; signals: Signal[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  if (signals.length === 0) return null;

  return (
    <Card className="border-border/30">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-accent/20 transition-colors">
        <Icon className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground text-body">{title}</h4>
          <p className="text-micro text-muted-foreground">{signals.length} signal{signals.length !== 1 ? 's' : ''} detected</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <CardContent className="px-5 pb-5 pt-0 space-y-3 border-t border-border/20">
          {signals.map((signal, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/20">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="font-medium text-foreground text-caption">{signal.label}</span>
                <ConfidenceBadge level={signal.confidence} />
              </div>
              <p className="text-caption text-muted-foreground leading-relaxed">{signal.summary}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="text-micro">{signal.sourceType}</Badge>
                {signal.sourceUrl && (
                  <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-micro text-primary hover:underline flex items-center gap-1">
                    View Source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {signal.amount && signal.amount > 0 && (
                  <span className="text-micro font-mono text-foreground">${signal.amount.toLocaleString()}</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export function InfluencePolicyLayer({ politicalGiving, lobbyingActivity, governmentContracts, policyLinks }: InfluencePolicyProps) {
  const hasData = [politicalGiving, lobbyingActivity, governmentContracts, policyLinks].some(a => a.length > 0);

  return (
    <div className="space-y-4">
      {/* Explainer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-caption text-foreground/80 leading-relaxed">
          This view shows how a company connects to politics, policy, government contracts, and institutional relationships using public records.
        </p>
      </div>

      {!hasData ? (
        <div className="text-center py-8">
          <Landmark className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-caption text-muted-foreground">No influence or policy signals detected yet. Run a scan to populate this section.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <SignalGroup title="Executive Giving" icon={DollarSign} signals={politicalGiving} defaultOpen />
          <SignalGroup title="Lobbying Activity" icon={Megaphone} signals={lobbyingActivity} />
          <SignalGroup title="Government Contracts" icon={Landmark} signals={governmentContracts} />
          <SignalGroup title="Policy & Institutional Links" icon={Network} signals={policyLinks} />
        </div>
      )}
    </div>
  );
}
