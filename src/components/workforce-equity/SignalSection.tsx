import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeSignalLabel } from "@/utils/signalTextSanitizer";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, ArrowUpRight, AlertTriangle, EyeOff, Info,
  type LucideIcon,
} from "lucide-react";

type Strength = "strong" | "moderate" | "limited" | "none";

const strengthConfig: Record<Strength, { icon: LucideIcon; label: string; badge: string }> = {
  strong: { icon: CheckCircle2, label: "Strong Evidence", badge: "bg-civic-green/10 text-civic-green border-civic-green/20" },
  moderate: { icon: ArrowUpRight, label: "Moderate Evidence", badge: "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20" },
  limited: { icon: AlertTriangle, label: "Limited Evidence", badge: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  none: { icon: EyeOff, label: "No Public Signals", badge: "bg-muted text-muted-foreground border-border" },
};

function getStrength(signals: any[]): Strength {
  if (!signals.length) return "none";
  const direct = signals.filter((s) => s.confidence === "direct" || s.confidence === "high").length;
  if (direct >= 2) return "strong";
  if (direct >= 1 || signals.length >= 3) return "moderate";
  return "limited";
}

interface SignalItem {
  key: string;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  keywords: string[];
}

export function SignalSection({
  title,
  icon: TitleIcon,
  items,
  signals,
  companyName,
}: {
  title: string;
  icon: LucideIcon;
  items: SignalItem[];
  signals: any[];
  companyName: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TitleIcon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1.5">
          {items.map((item) => {
            const matching = signals.filter((s) =>
              item.keywords.some(
                (kw) =>
                  s.value_category === item.key ||
                  s.signal_type?.toLowerCase().includes(kw) ||
                  s.signal_summary?.toLowerCase().includes(kw)
              )
            );
            const strength = getStrength(matching);
            const config = strengthConfig[strength];
            const StatusIcon = config.icon;

            return (
              <div
                key={item.key}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border"
              >
                <item.icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", item.iconClass)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <Badge variant="outline" className={cn("text-[9px] gap-1 px-1.5 py-0", config.badge)}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {config.label}
                    </Badge>
                  </div>
                  {matching.length > 0 ? (
                    <div className="mt-1 space-y-0.5">
                      {matching.slice(0, 2).map((s: any, i: number) => (
                        <p key={i} className="text-[11px] text-muted-foreground">
                          {safeSignalLabel(s.signal_summary, "Signal detected")}
                          {s.evidence_url && (
                            <a
                              href={s.evidence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              source <ArrowUpRight className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Info className="w-2.5 h-2.5" />
                      No public signals found yet
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
