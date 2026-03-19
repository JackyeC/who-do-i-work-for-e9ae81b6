import { getFreshnessInfo } from "@/lib/freshness-utils";

interface FreshnessLabelProps {
  lastVerifiedAt?: string | null;
}

export function FreshnessLabel({ lastVerifiedAt }: FreshnessLabelProps) {
  const info = getFreshnessInfo(lastVerifiedAt);

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] whitespace-nowrap"
      style={{ fontFamily: "'DM Sans', sans-serif", color: info.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: info.dotColor }}
      />
      {info.label}
    </span>
  );
}
