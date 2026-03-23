import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type CauseTagColor = "red" | "blue" | "amber" | "gray";

export interface CauseTagData {
  label: string;
  color: CauseTagColor;
  source: string;
  sourceUrl?: string;
}

const COLOR_MAP: Record<CauseTagColor, { bg: string; text: string }> = {
  red:   { bg: "#FCEBEB", text: "#791F1F" },
  blue:  { bg: "#E6F1FB", text: "#0C447C" },
  amber: { bg: "#FAEEDA", text: "#633806" },
  gray:  { bg: "#F1EFE8", text: "#5F5E5A" },
};

/** Cause taxonomy — maps known cause labels to colors and source references */
export const CAUSE_TAXONOMY: Record<string, { color: CauseTagColor; source: string }> = {
  "Project 2025":                       { color: "red", source: "P2025 coalition member list (public)" },
  "Voting restrictions":                { color: "red", source: "Congressional voting record" },
  "Anti-DEI legislation":               { color: "red", source: "Bill sponsorship records" },
  "Anti-LGBTQ+":                        { color: "red", source: "HRC Congressional Scorecard" },
  "Reproductive rights — restrictive":  { color: "red", source: "NARAL / Planned Parenthood ratings" },
  "Reproductive rights — supportive":   { color: "blue", source: "NARAL / Planned Parenthood ratings" },
  "Labor / anti-union":                 { color: "amber", source: "NLRB records, AFL-CIO scorecard" },
  "Labor / pro-worker":                 { color: "blue", source: "NLRB records, AFL-CIO scorecard" },
  "Immigration — restrictive":          { color: "amber", source: "Congressional voting record" },
  "Immigration — expansive":            { color: "blue", source: "Congressional voting record" },
  "Climate / fossil fuels":             { color: "amber", source: "LCV scorecard" },
  "Climate / clean energy":             { color: "blue", source: "LCV scorecard" },
  "Tech regulation":                    { color: "gray", source: "Congressional record" },
  "Voting rights — supportive":         { color: "blue", source: "Brennan Center, congressional record" },
};

export function CauseTag({ label, color, source, sourceUrl }: CauseTagData) {
  const colors = COLOR_MAP[color];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-block cursor-default"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            borderRadius: "20px",
            padding: "2px 8px",
            margin: "2px",
            background: colors.bg,
            color: colors.text,
          }}
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-xs">
        <p>Classification based on {source}.</p>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            View source →
          </a>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/** Helper: get CauseTagData from a label string */
export function getCauseTag(label: string): CauseTagData {
  const entry = CAUSE_TAXONOMY[label];
  return {
    label,
    color: entry?.color ?? "gray",
    source: entry?.source ?? "Public record",
  };
}
