import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquareWarning, CheckCircle2, AlertTriangle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stance {
  id: string;
  topic: string;
  public_position: string;
  spending_reality: string;
  gap: string;
}

interface AlignmentDashboardProps {
  stances: Stance[];
}

function getGapStyle(gap: string) {
  if (gap === "aligned") return {
    label: "Aligned",
    icon: CheckCircle2,
    color: "text-[hsl(var(--civic-green))]",
    bg: "bg-[hsl(var(--civic-green))]/10",
    border: "border-[hsl(var(--civic-green))]/20",
    barColor: "bg-[hsl(var(--civic-green))]",
  };
  if (gap === "direct-conflict") return {
    label: "Gap Detected",
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    barColor: "bg-destructive",
  };
  return {
    label: "Mixed",
    icon: Minus,
    color: "text-[hsl(var(--civic-yellow))]",
    bg: "bg-[hsl(var(--civic-yellow))]/10",
    border: "border-[hsl(var(--civic-yellow))]/20",
    barColor: "bg-[hsl(var(--civic-yellow))]",
  };
}

export function AlignmentDashboard({ stances }: AlignmentDashboardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!stances || stances.length === 0) return null;

  const aligned = stances.filter(s => s.gap === "aligned").length;
  const conflicts = stances.filter(s => s.gap === "direct-conflict").length;
  const mixed = stances.length - aligned - conflicts;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquareWarning className="w-4 h-4 text-primary" />
          Say vs. Do — Alignment Dashboard
        </CardTitle>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--civic-green))]" />
            <span className="text-xs text-muted-foreground">{aligned} Aligned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--civic-yellow))]" />
            <span className="text-xs text-muted-foreground">{mixed} Mixed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">{conflicts} Gap{conflicts !== 1 ? "s" : ""}</span>
          </div>
        </div>
        {/* Summary bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden flex mt-2">
          {aligned > 0 && <div className="bg-[hsl(var(--civic-green))] transition-all" style={{ width: `${(aligned / stances.length) * 100}%` }} />}
          {mixed > 0 && <div className="bg-[hsl(var(--civic-yellow))] transition-all" style={{ width: `${(mixed / stances.length) * 100}%` }} />}
          {conflicts > 0 && <div className="bg-destructive transition-all" style={{ width: `${(conflicts / stances.length) * 100}%` }} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_90px] gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
          <span>Issue</span>
          <span>Public Stance</span>
          <span>Spending Reality</span>
          <span className="text-right">Alignment</span>
        </div>

        {/* Rows */}
        {stances.map((stance) => {
          const style = getGapStyle(stance.gap);
          const Icon = style.icon;
          const isExpanded = expanded === stance.id;

          return (
            <button
              key={stance.id}
              onClick={() => setExpanded(isExpanded ? null : stance.id)}
              className={cn(
                "w-full text-left grid grid-cols-[1fr_1fr_1fr_90px] gap-3 px-3 py-3 transition-colors border-b border-border/10 hover:bg-muted/30",
                isExpanded && "bg-muted/20"
              )}
            >
              <span className="text-sm font-medium text-foreground truncate">{stance.topic}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{stance.public_position}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{stance.spending_reality}</span>
              <div className="flex items-center justify-end gap-1.5">
                <Icon className={cn("w-3.5 h-3.5", style.color)} />
                <Badge variant="outline" className={cn("text-xs px-1.5", style.color, style.border)}>
                  {style.label}
                </Badge>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
