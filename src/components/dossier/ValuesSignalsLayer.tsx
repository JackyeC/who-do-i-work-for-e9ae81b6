import { Heart, ExternalLink, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

const LENSES = [
  "Animal Welfare", "DEI / Workplace Equity", "Climate", "Labor Rights",
  "Civil Rights", "LGBTQ+ Rights", "Reproductive Rights", "Voting Rights",
  "Immigration", "Education", "Healthcare", "Consumer Protection",
  "Faith / Christian Values", "Israel / Middle East"
];

type SignalDirection = "alignment_signal" | "conflict_signal" | "informational_signal" | "mixed_signal";

interface ValuesSignal {
  issueCategory: string;
  summary: string;
  direction: SignalDirection;
  sourceUrl?: string;
  verificationStatus?: string;
  confidence: "strong" | "likely" | "possible";
}

interface ValuesSignalsProps {
  signals: ValuesSignal[];
  companyName: string;
}

const directionConfig: Record<SignalDirection, { label: string; color: string }> = {
  alignment_signal: { label: "Alignment", color: "bg-civic-green/10 text-civic-green border-civic-green/20" },
  conflict_signal: { label: "Conflict", color: "bg-destructive/10 text-destructive border-destructive/20" },
  informational_signal: { label: "Informational", color: "bg-civic-blue/10 text-civic-blue border-civic-blue/20" },
  mixed_signal: { label: "Mixed", color: "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20" },
};

export function ValuesSignalsLayer({ signals, companyName }: ValuesSignalsProps) {
  const [activeLens, setActiveLens] = useState<string | null>(null);
  const filtered = activeLens ? signals.filter(s => s.issueCategory === activeLens) : signals;

  if (signals.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground">No values signals detected yet for {companyName}.</p>
        <p className="text-micro text-muted-foreground mt-1">Run a scan to generate evidence-based values signals.</p>
      </div>
    );
  }

  const availableLenses = [...new Set(signals.map(s => s.issueCategory))];

  return (
    <div className="space-y-4">
      {/* Lens filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <button onClick={() => setActiveLens(null)} className={cn("text-micro px-2.5 py-1 rounded-full border transition-colors", !activeLens ? "bg-primary text-primary-foreground border-primary" : "border-border/40 text-muted-foreground hover:text-foreground")}>
          All ({signals.length})
        </button>
        {availableLenses.map(lens => (
          <button key={lens} onClick={() => setActiveLens(lens === activeLens ? null : lens)} className={cn("text-micro px-2.5 py-1 rounded-full border transition-colors", activeLens === lens ? "bg-primary text-primary-foreground border-primary" : "border-border/40 text-muted-foreground hover:text-foreground")}>
            {lens}
          </button>
        ))}
      </div>

      {/* Signals */}
      <div className="space-y-2">
        {filtered.map((signal, i) => {
          const dir = directionConfig[signal.direction];
          return (
            <Card key={i} className="border-border/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-micro">{signal.issueCategory}</Badge>
                    <Badge variant="outline" className={cn("text-micro", dir.color)}>{dir.label}</Badge>
                  </div>
                  <Badge variant="outline" className="text-micro">
                    {signal.confidence === "strong" ? "Strong Evidence" : signal.confidence === "likely" ? "Likely Connection" : "Possible Connection"}
                  </Badge>
                </div>
                <p className="text-caption text-foreground leading-relaxed">{signal.summary}</p>
                <div className="flex items-center gap-3 mt-2">
                  {signal.verificationStatus && <span className="text-micro text-muted-foreground">{signal.verificationStatus}</span>}
                  {signal.sourceUrl && (
                    <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-micro text-primary hover:underline flex items-center gap-1">
                      Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
