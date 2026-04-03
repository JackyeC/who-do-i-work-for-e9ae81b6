import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

type IdentityStatus = "complete" | "partial" | "missing";

interface IdentityStatusBadgeProps {
  status: IdentityStatus;
  className?: string;
}

const CONFIG: Record<IdentityStatus, { icon: typeof ShieldCheck; label: string; style: string }> = {
  complete: {
    icon: ShieldCheck,
    label: "Identity: Complete",
    style: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/8",
  },
  partial: {
    icon: ShieldAlert,
    label: "Identity: Partial",
    style: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/8",
  },
  missing: {
    icon: ShieldX,
    label: "Identity: Missing",
    style: "text-destructive border-destructive/30 bg-destructive/8",
  },
};

export function IdentityStatusBadge({ status, className }: IdentityStatusBadgeProps) {
  const config = CONFIG[status] || CONFIG.missing;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("text-xs gap-1", config.style, className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

/** Derive identity status from company fields */
export function deriveIdentityStatus(company: {
  name?: string | null;
  website_url?: string | null;
  domain?: string | null;
  identity_status?: string | null;
}): IdentityStatus {
  // Use DB-computed value if available
  if (company.identity_status === "complete" || company.identity_status === "partial" || company.identity_status === "missing") {
    return company.identity_status;
  }
  // Fallback client-side derivation
  if (company.name && company.website_url && company.domain) return "complete";
  if (company.name && (company.website_url || company.domain)) return "partial";
  return "missing";
}
