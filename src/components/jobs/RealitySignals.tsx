import { Badge } from "@/components/ui/badge";
import { RefreshCw, DollarSign, Activity, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealitySignalsProps {
  isRepost: boolean;
  hasSalary: boolean;
  isEvergreen: boolean;
  qualityTier: string;
  civicScore: number;
}

export function RealitySignals({ isRepost, hasSalary, isEvergreen, qualityTier, civicScore }: RealitySignalsProps) {
  const signals = [
    {
      show: isRepost,
      icon: RefreshCw,
      label: "Reposted",
      className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20",
    },
    {
      show: true,
      icon: DollarSign,
      label: hasSalary ? "Pay Transparent" : "Pay Undisclosed",
      className: hasSalary
        ? "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20"
        : "bg-muted/50 text-muted-foreground border-border/30",
    },
    {
      show: true,
      icon: Activity,
      label: civicScore >= 70 ? "Stable Signals" : civicScore >= 40 ? "Mixed Signals" : "Limited Visibility",
      className: civicScore >= 70
        ? "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20"
        : civicScore >= 40
        ? "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20"
        : "bg-muted/50 text-muted-foreground border-border/30",
    },
    {
      show: isEvergreen,
      icon: Eye,
      label: "Evergreen Listing",
      className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20",
    },
  ];

  const visible = signals.filter((s) => s.show);

  return (
    <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
      <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <Eye className="w-3 h-3 text-muted-foreground" /> Reality Signals
      </p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((s, i) => (
          <Badge key={i} variant="outline" className={cn("text-[10px] gap-1", s.className)}>
            <s.icon className="w-3 h-3" /> {s.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
