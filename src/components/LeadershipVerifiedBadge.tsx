import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeadershipVerifiedBadgeProps {
  lastVerifiedAt?: string | null;
  source?: string | null;
  compact?: boolean;
}

function getVerificationStatus(dateStr?: string | null) {
  if (!dateStr) return { label: "Unverified", stale: true, days: null };
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 30) return { label: "Verified", stale: false, days };
  if (days <= 90) return { label: "Aging", stale: false, days };
  return { label: "Stale", stale: true, days };
}

const SOURCE_LABELS: Record<string, string> = {
  sec_proxy: "SEC Proxy (DEF 14A)",
  company_page: "Company Leadership Page",
  press_release: "Press Release",
  manual: "Manual Entry",
  user_correction: "User Correction",
};

export function LeadershipVerifiedBadge({
  lastVerifiedAt,
  source,
  compact = false,
}: LeadershipVerifiedBadgeProps) {
  const status = getVerificationStatus(lastVerifiedAt);
  const sourceLabel = source ? SOURCE_LABELS[source] || source : "Unknown";
  const dateFormatted = lastVerifiedAt
    ? new Date(lastVerifiedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const Icon = status.stale ? AlertTriangle : ShieldCheck;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                "text-xs gap-1 cursor-help",
                status.stale
                  ? "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30"
                  : "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30"
              )}
            >
              <Icon className="w-2.5 h-2.5" />
              {status.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-56">
            <p className="font-medium">Leadership Data</p>
            {dateFormatted && <p>Verified: {dateFormatted}</p>}
            <p>Source: {sourceLabel}</p>
            {status.days !== null && <p>Last update: {status.days} days ago</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30">
      <Icon
        className={cn(
          "w-4 h-4 mt-0.5 shrink-0",
          status.stale
            ? "text-[hsl(var(--civic-yellow))]"
            : "text-[hsl(var(--civic-green))]"
        )}
      />
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-foreground">Leadership Data</p>
        {dateFormatted && (
          <p className="text-xs text-muted-foreground">
            Verified: {dateFormatted}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Source: {sourceLabel}
        </p>
        {status.days !== null && status.days > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Last leadership update: {status.days} days ago
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
