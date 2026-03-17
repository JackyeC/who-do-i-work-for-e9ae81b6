import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CIOAuditBadgeProps {
  lastAuditedAt?: string | null;
}

export function CIOAuditBadge({ lastAuditedAt }: CIOAuditBadgeProps) {
  if (!lastAuditedAt) return null;

  const date = new Date(lastAuditedAt);
  const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  // Only show if audited within the past 30 days
  if (daysSince > 30) return null;

  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Badge
      variant="outline"
      className="text-[10px] gap-1.5 font-semibold border-[hsl(var(--civic-gold))]/40 text-[hsl(var(--civic-gold))] bg-[hsl(var(--civic-gold))]/[0.06] shadow-[0_0_8px_hsl(var(--civic-gold)/0.15)]"
    >
      <ShieldCheck className="w-3 h-3" />
      Verified CIO Audit · {formatted}
    </Badge>
  );
}
