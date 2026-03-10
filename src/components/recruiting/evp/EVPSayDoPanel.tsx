import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import type { SayDoItem } from "../EVPIntelligence";

const gapConfig = {
  aligned: { label: "Aligned", icon: CheckCircle2, color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20" },
  minor: { label: "Minor Gap", icon: AlertTriangle, color: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20" },
  major: { label: "Say-Do Gap", icon: AlertTriangle, color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function EVPSayDoPanel({ items }: { items: SayDoItem[] }) {
  const gaps = items.filter(i => i.gap !== "aligned");
  const aligned = items.filter(i => i.gap === "aligned");

  return (
    <Card className={gaps.length > 0 ? "border-destructive/30" : "border-[hsl(var(--civic-green))]/30"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Say vs. Do Analysis
          </CardTitle>
          <div className="flex gap-2">
            {gaps.length > 0 && (
              <Badge variant="destructive" className="text-xs">{gaps.length} gap{gaps.length > 1 ? "s" : ""}</Badge>
            )}
            {aligned.length > 0 && (
              <Badge className="text-xs bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20">
                {aligned.length} aligned
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Comparing career site messaging against public spending records, lobbying filings, and WARN data
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, i) => {
          const config = gapConfig[item.gap];
          const Icon = config.icon;
          return (
            <div key={i} className={`p-4 rounded-xl border ${item.gap === "major" ? "border-destructive/20 bg-destructive/[0.03]" : item.gap === "minor" ? "border-[hsl(var(--civic-yellow))]/20 bg-[hsl(var(--civic-yellow))]/[0.03]" : "border-[hsl(var(--civic-green))]/20 bg-[hsl(var(--civic-green))]/[0.03]"}`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${item.gap === "major" ? "text-destructive" : item.gap === "minor" ? "text-[hsl(var(--civic-yellow))]" : "text-[hsl(var(--civic-green))]"}`} />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${config.color}`}>{config.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">What they say:</strong> "{item.whatTheySay}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">What records show:</strong> {item.whatRecordsShow}
                  </p>
                  {item.source && (
                    <p className="text-[10px] text-muted-foreground/70 italic">{item.source}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
