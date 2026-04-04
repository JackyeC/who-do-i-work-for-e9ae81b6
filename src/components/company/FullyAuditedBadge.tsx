import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FullyAuditedBadgeProps {
  className?: string;
}

export function FullyAuditedBadge({ className }: FullyAuditedBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-xs gap-1.5 font-semibold border-[hsl(var(--civic-green))]/40 text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/[0.08] shadow-[0_0_8px_hsl(var(--civic-green)/0.12)] cursor-help ${className ?? ""}`}
          >
            <ShieldCheck className="w-3 h-3" />
            Audit Complete
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <p className="text-xs">This company has complete identity verification, multi-source claims, and full attribution. Every claim links to a public record.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
