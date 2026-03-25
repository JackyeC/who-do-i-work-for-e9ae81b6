/**
 * VoteCard — shows a single legislative vote with YES/NO pill
 */

import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export interface VoteData {
  billTitle: string;
  vote: "yes" | "no" | "not_voting";
  outcome?: "passed" | "failed" | string;
  date: string;
  sourceUrl?: string;
  sourceName?: string;
}

interface VoteCardProps {
  vote: VoteData;
  className?: string;
}

const VOTE_STYLES: Record<string, string> = {
  yes: "bg-[hsl(var(--civic-green))]/12 text-[hsl(var(--civic-green))]",
  no: "bg-destructive/12 text-destructive",
  not_voting: "bg-muted text-muted-foreground",
};

export function VoteCard({ vote, className }: VoteCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-5 grid grid-cols-[1fr_auto] gap-3 items-center",
        "hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-default",
        className
      )}
    >
      <p className="font-semibold text-[0.9375rem] text-foreground leading-snug">
        {vote.billTitle}
      </p>

      <div className="flex items-center gap-2 justify-self-end">
        <span
          className={cn(
            "font-mono text-xs font-medium px-3.5 py-1 rounded-full uppercase tracking-wider",
            VOTE_STYLES[vote.vote] || VOTE_STYLES.not_voting
          )}
        >
          {vote.vote === "not_voting" ? "N/V" : vote.vote.toUpperCase()}
        </span>
        {vote.outcome && (
          <span className="font-mono text-[0.6875rem] px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground capitalize">
            {vote.outcome}
          </span>
        )}
      </div>

      <div className="col-span-2 flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
        <span>{vote.date}</span>
        {vote.sourceUrl ? (
          <a
            href={vote.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            {vote.sourceName || "Source"} <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span>{vote.sourceName || "Congress.gov"}</span>
        )}
      </div>
    </div>
  );
}
