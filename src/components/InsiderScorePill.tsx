import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface InsiderScorePillProps {
  score: number | null | undefined;
  className?: string;
}

function getScoreConfig(score: number) {
  if (score <= 39) return {
    label: "Open Network",
    color: "#47ffb3",
    bg: "rgba(71,255,179,0.1)",
    border: "rgba(71,255,179,0.25)",
  };
  if (score <= 69) return {
    label: "Moderate Concentration",
    color: "#f0c040",
    bg: "rgba(240,192,64,0.1)",
    border: "rgba(240,192,64,0.3)",
  };
  return {
    label: "High Concentration",
    color: "#ff6b35",
    bg: "rgba(255,107,53,0.1)",
    border: "rgba(255,107,53,0.3)",
  };
}

export function InsiderScorePill({ score, className = "" }: InsiderScorePillProps) {
  const isPending = score === null || score === undefined;

  if (isPending) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1.5 rounded-[20px] px-3 py-[5px] text-xs font-medium cursor-default ${className}`}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              color: "hsl(var(--muted-foreground))",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            Connected Dots · Pending
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          Connected Dots data is not yet available for this company. Check back soon.
        </TooltipContent>
      </Tooltip>
    );
  }

  const config = getScoreConfig(score);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`inline-flex items-center gap-1.5 rounded-[20px] px-3 py-[5px] cursor-default ${className}`}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            color: config.color,
            background: config.bg,
            border: `1px solid ${config.border}`,
          }}
        >
          Connected Dots · {score} · {config.label}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm text-xs leading-relaxed">
        <p>
          <strong>What this means:</strong> {score}% of this company's senior leadership came from the same schools, previous employers, or personal networks. High scores may indicate limited mobility for external candidates.
        </p>
        <p className="mt-1 text-muted-foreground">Source: SEC proxy statements, ProPublica, public filings.</p>
      </TooltipContent>
    </Tooltip>
  );
}
