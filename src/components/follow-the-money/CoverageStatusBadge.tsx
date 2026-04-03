import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle, Search } from "lucide-react";
import type { CoverageStatus } from "@/types/follow-the-money";

const CONFIG: Record<CoverageStatus, { label: string; className: string; icon: typeof Shield }> = {
  strong: {
    label: "Strong Coverage",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: Shield,
  },
  limited: {
    label: "Limited Coverage",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: Search,
  },
  none: {
    label: "No Records Found",
    className: "bg-muted/50 text-muted-foreground border-border",
    icon: Search,
  },
  error: {
    label: "Data Unavailable",
    className: "bg-destructive/15 text-destructive border-destructive/30",
    icon: AlertCircle,
  },
};

interface Props {
  status: CoverageStatus;
}

export function CoverageStatusBadge({ status }: Props) {
  const { label, className, icon: Icon } = CONFIG[status];
  return (
    <Badge variant="outline" className={`gap-1.5 text-xs font-mono ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}
