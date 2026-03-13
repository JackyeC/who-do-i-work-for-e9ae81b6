import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, Clock, Scale, AlertTriangle, Eye,
  CheckCircle2, FileWarning, Bot,
} from "lucide-react";

export type AccountabilityStatus =
  | "verified"
  | "audit_pending"
  | "compliant"
  | "leader"
  | "conflict_detected"
  | "published"
  | "not_disclosed"
  | "partial";

interface AccountabilityBadgeProps {
  status: AccountabilityStatus;
  label: string;
  className?: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  AccountabilityStatus,
  { icon: typeof ShieldCheck; color: string; bg: string; border: string }
> = {
  verified: {
    icon: CheckCircle2,
    color: "text-[hsl(var(--civic-green))]",
    bg: "bg-[hsl(var(--civic-green))]/8",
    border: "border-[hsl(var(--civic-green))]/20",
  },
  published: {
    icon: Eye,
    color: "text-[hsl(var(--civic-green))]",
    bg: "bg-[hsl(var(--civic-green))]/8",
    border: "border-[hsl(var(--civic-green))]/20",
  },
  compliant: {
    icon: Scale,
    color: "text-[hsl(var(--civic-green))]",
    bg: "bg-[hsl(var(--civic-green))]/8",
    border: "border-[hsl(var(--civic-green))]/20",
  },
  leader: {
    icon: ShieldCheck,
    color: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/20",
  },
  audit_pending: {
    icon: Clock,
    color: "text-[hsl(var(--civic-yellow))]",
    bg: "bg-[hsl(var(--civic-yellow))]/8",
    border: "border-[hsl(var(--civic-yellow))]/20",
  },
  partial: {
    icon: FileWarning,
    color: "text-[hsl(var(--civic-yellow))]",
    bg: "bg-[hsl(var(--civic-yellow))]/8",
    border: "border-[hsl(var(--civic-yellow))]/20",
  },
  not_disclosed: {
    icon: Bot,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border/50",
  },
  conflict_detected: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/8",
    border: "border-destructive/20",
  },
};

export function AccountabilityBadge({
  status,
  label,
  className,
  size = "sm",
}: AccountabilityBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-semibold",
        config.color,
        config.bg,
        config.border,
        size === "sm" && "text-[10px] px-2 py-0.5",
        size === "md" && "text-xs px-2.5 py-1",
        className,
      )}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
      {label}
    </Badge>
  );
}

/* ── Preset badges ── */

export function AIBiasAuditBadge({ status }: { status: "published" | "audit_pending" | "not_disclosed" }) {
  const labels: Record<string, string> = {
    published: "AI Bias Audit Published",
    audit_pending: "Audit Pending",
    not_disclosed: "AI Audit Not Disclosed",
  };
  return <AccountabilityBadge status={status} label={labels[status]} />;
}

export function CROWNActBadge({ compliant }: { compliant: boolean }) {
  return (
    <AccountabilityBadge
      status={compliant ? "compliant" : "audit_pending"}
      label={compliant ? "CROWN Act Compliant" : "CROWN Act Status Unknown"}
    />
  );
}

export function TransparencyLeaderBadge() {
  return <AccountabilityBadge status="leader" label="Transparency Leader" />;
}

export function PolicyConflictBadge() {
  return <AccountabilityBadge status="conflict_detected" label="Policy Conflict Detected" />;
}
