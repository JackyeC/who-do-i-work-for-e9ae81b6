import { Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LastAuditedStampProps {
  lastAuditedAt?: string | null;
  lastReviewed?: string | null;
}

export function LastAuditedStamp({ lastAuditedAt, lastReviewed }: LastAuditedStampProps) {
  const dateStr = lastAuditedAt || lastReviewed;
  if (!dateStr) return null;

  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  const isFresh = daysSince <= 30;

  return (
    <Badge
      variant="outline"
      className={`text-xs gap-1.5 font-medium ${
        isFresh
          ? "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/5"
          : "text-muted-foreground border-border/50"
      }`}
    >
      {isFresh ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      Intelligence current as of {formatted}
    </Badge>
  );
}
