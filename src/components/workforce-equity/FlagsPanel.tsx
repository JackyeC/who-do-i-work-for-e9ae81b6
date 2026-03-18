import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { safeSignalLabel } from "@/utils/signalTextSanitizer";

export function FlagsPanel({ signals }: { signals: any[] }) {
  const greenFlags = signals.filter(
    (s) => s.confidence === "direct" || s.confidence === "high"
  );
  const riskFlags = signals.filter(
    (s) =>
      s.signal_type?.toLowerCase().includes("layoff") ||
      s.signal_type?.toLowerCase().includes("warn") ||
      s.signal_type?.toLowerCase().includes("churn") ||
      s.signal_type?.toLowerCase().includes("attrition") ||
      s.value_category === "retention_risk"
  );

  if (!greenFlags.length && !riskFlags.length) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {greenFlags.length > 0 && (
        <Card className="border-civic-green/20 bg-civic-green/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-civic-green">
              <CheckCircle2 className="w-4 h-4" />
              Green Flags ({greenFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {greenFlags.slice(0, 6).map((s: any, i: number) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-civic-green mt-0.5 shrink-0" />
                  {safeSignalLabel(s.signal_summary || s.signal_type, "Verified Signal")}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {riskFlags.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Risk Flags ({riskFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {riskFlags.slice(0, 6).map((s: any, i: number) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                  {safeSignalLabel(s.signal_summary || s.signal_type, "Risk Signal Detected")}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
