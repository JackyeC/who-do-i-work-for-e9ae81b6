import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import type { EVPSignal } from "../EVPIntelligence";

const sentimentColor = (s: "positive" | "neutral" | "caution") =>
  s === "positive" ? "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20" :
  s === "caution" ? "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20" :
  "bg-muted text-muted-foreground";

export function EVPSignalsPanel({ signals }: { signals: EVPSignal[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Public Signals Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {signals.map((s, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Badge className={`shrink-0 text-xs ${sentimentColor(s.sentiment)}`}>{s.category}</Badge>
            <p className="text-sm text-foreground">{s.detail}</p>
          </div>
        ))}
        {signals.length === 0 && (
          <p className="text-sm text-muted-foreground">No public signals found. The company may need a full intelligence scan first.</p>
        )}
      </CardContent>
    </Card>
  );
}
