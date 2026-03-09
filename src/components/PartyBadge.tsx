import { useState } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Maps raw party strings to a standardized short code and display config.
 * Handles candidates, PACs, orgs, ballot measures, and unknown types.
 */

export type AffiliationType =
  | "D" | "R" | "I" | "L" | "G" | "3P"
  | "D-aligned" | "R-aligned" | "Mixed"
  | "PAC" | "ORG" | "BALLOT" | "UNK";

interface AffiliationConfig {
  code: AffiliationType;
  label: string;
  className: string;
}

const AFFILIATION_MAP: Record<AffiliationType, AffiliationConfig> = {
  D:           { code: "D",          label: "D",           className: "bg-[hsl(218,55%,48%)]/15 text-[hsl(218,55%,48%)] border-[hsl(218,55%,48%)]/35" },
  R:           { code: "R",          label: "R",           className: "bg-[hsl(0,65%,50%)]/15 text-[hsl(0,65%,50%)] border-[hsl(0,65%,50%)]/35" },
  I:           { code: "I",          label: "I",           className: "bg-muted text-muted-foreground border-border" },
  L:           { code: "L",          label: "L",           className: "bg-[hsl(38,72%,50%)]/15 text-[hsl(38,72%,50%)] border-[hsl(38,72%,50%)]/35" },
  G:           { code: "G",          label: "G",           className: "bg-[hsl(158,45%,36%)]/15 text-[hsl(158,45%,36%)] border-[hsl(158,45%,36%)]/35" },
  "3P":        { code: "3P",         label: "3P",          className: "bg-muted text-muted-foreground border-border" },
  "D-aligned": { code: "D-aligned",  label: "D-aligned",   className: "bg-[hsl(218,55%,48%)]/10 text-[hsl(218,55%,48%)]/70 border-[hsl(218,55%,48%)]/25 border-dashed" },
  "R-aligned": { code: "R-aligned",  label: "R-aligned",   className: "bg-[hsl(0,65%,50%)]/10 text-[hsl(0,65%,50%)]/70 border-[hsl(0,65%,50%)]/25 border-dashed" },
  Mixed:       { code: "Mixed",      label: "Mixed",       className: "bg-muted text-muted-foreground border-border border-dashed" },
  PAC:         { code: "PAC",        label: "PAC",         className: "bg-card text-foreground/70 border-border" },
  ORG:         { code: "ORG",        label: "ORG",         className: "bg-card text-foreground/70 border-border" },
  BALLOT:      { code: "BALLOT",     label: "BALLOT",      className: "bg-card text-foreground/70 border-border" },
  UNK:         { code: "UNK",        label: "UNK",         className: "bg-muted text-muted-foreground/60 border-border" },
};

/**
 * Resolve a raw party string + entity type to an AffiliationType.
 * For candidates: use the party directly.
 * For committees/PACs: show type badge, use alignment only if confident.
 */
export function resolveAffiliation(
  party?: string | null,
  entityType?: string | null,
  isInferred?: boolean
): AffiliationType {
  const p = (party || "").toLowerCase().trim();
  const et = (entityType || "").toLowerCase().trim();

  // Non-candidate entity types get structural badges
  if (["pac", "super_pac", "political_action_committee"].includes(et)) {
    if (!p || p === "unknown") return "PAC";
    if (isInferred) {
      if (p.includes("democrat") || p === "d") return "D-aligned";
      if (p.includes("republican") || p === "r") return "R-aligned";
      return "Mixed";
    }
    // Explicit party on a PAC
    if (p.includes("democrat") || p === "d") return "D-aligned";
    if (p.includes("republican") || p === "r") return "R-aligned";
    return "PAC";
  }
  if (["organization", "org", "501c4", "nonprofit", "advocacy", "trade_association"].includes(et)) return "ORG";
  if (["ballot", "ballot_measure", "ballot_committee"].includes(et)) return "BALLOT";

  // Candidate / member / politician: direct party
  if (p.includes("democrat") || p === "d") return "D";
  if (p.includes("republican") || p === "r") return "R";
  if (p.includes("independent") || p === "i") return "I";
  if (p.includes("libertarian") || p === "l") return "L";
  if (p.includes("green") || p === "g") return "G";
  if (p && p !== "unknown" && p !== "n/a") return "3P";
  return "UNK";
}

export function getAffiliationConfig(type: AffiliationType): AffiliationConfig {
  return AFFILIATION_MAP[type] || AFFILIATION_MAP.UNK;
}

interface PartyBadgeProps {
  party?: string | null;
  entityType?: string | null;
  isInferred?: boolean;
  size?: "xs" | "sm";
  className?: string;
}

export function PartyBadge({ party, entityType, isInferred, size = "xs", className }: PartyBadgeProps) {
  const affiliation = resolveAffiliation(party, entityType, isInferred);
  const config = getAffiliationConfig(affiliation);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-semibold shrink-0",
        size === "xs" ? "px-1.5 py-0 text-[9px] leading-4 min-w-[20px]" : "px-2 py-0.5 text-[10px] leading-4 min-w-[24px]",
        config.className,
        className
      )}
      title={`${party || "Unknown"}${isInferred ? " (inferred)" : ""}`}
    >
      {config.label}
    </span>
  );
}

/**
 * Compute recipient mix percentages from a list of affiliations.
 */
export function computeRecipientMix(items: { party?: string | null; entityType?: string | null; amount?: number }[]): {
  label: string;
  percentage: number;
  config: AffiliationConfig;
}[] {
  const totals: Record<string, number> = {};
  let grandTotal = 0;

  for (const item of items) {
    const aff = resolveAffiliation(item.party, item.entityType);
    // Bucket: D + D-aligned → D family, R + R-aligned → R family, rest → other
    let bucket: string;
    if (aff === "D" || aff === "D-aligned") bucket = "D";
    else if (aff === "R" || aff === "R-aligned") bucket = "R";
    else bucket = "Other";
    const amt = item.amount || 1; // fallback to count if no amount
    totals[bucket] = (totals[bucket] || 0) + amt;
    grandTotal += amt;
  }

  if (grandTotal === 0) return [];

  const order = ["R", "D", "Other"];
  return order
    .filter((b) => totals[b])
    .map((bucket) => ({
      label: bucket === "Other" ? "Other / Unknown" : bucket,
      percentage: Math.round((totals[bucket] / grandTotal) * 100),
      config: getAffiliationConfig(bucket === "D" ? "D" : bucket === "R" ? "R" : "UNK"),
    }));
}
