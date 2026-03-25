/**
 * RepProfileCard — editorial-style representative card
 */

import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface RepProfileData {
  name: string;
  party: "D" | "R" | "I" | string;
  state: string;
  district?: string;
  committees?: string[];
  photoUrl?: string | null;
  lastUpdated?: string;
  sourceName?: string;
}

const PARTY_STYLES: Record<string, { label: string; badge: string }> = {
  D: { label: "D", badge: "bg-[hsl(var(--civic-blue))]/12 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/20" },
  R: { label: "R", badge: "bg-destructive/12 text-destructive border-destructive/20" },
  I: { label: "I", badge: "bg-muted text-muted-foreground border-border" },
};

interface RepProfileCardProps {
  rep: RepProfileData;
  className?: string;
}

export function RepProfileCard({ rep, className }: RepProfileCardProps) {
  const party = PARTY_STYLES[rep.party] || PARTY_STYLES.I;

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-6 sm:p-8 shadow-lg",
        "flex gap-6 items-start",
        className
      )}
    >
      {/* Avatar */}
      {rep.photoUrl ? (
        <img
          src={rep.photoUrl}
          alt={rep.name}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-border shrink-0"
        />
      ) : (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-card to-muted flex items-center justify-center border-2 border-border shrink-0">
          <User className="w-8 h-8 sm:w-9 sm:h-9 text-muted-foreground/40" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          <Link
            to={`/representative/${encodeURIComponent(rep.name)}`}
            className="hover:text-primary transition-colors"
          >
            {rep.name}
          </Link>
        </h3>

        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-0.5 rounded-full border", party.badge)}>
            {party.label}
          </span>
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground">{rep.state}</strong>
            {rep.district && ` — District ${rep.district}`}
          </span>
        </div>

        {/* Committees */}
        {rep.committees && rep.committees.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {rep.committees.map((c) => (
              <span
                key={c}
                className="font-mono text-[0.6875rem] px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground border border-border"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Freshness */}
        {rep.lastUpdated && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--civic-green))] shadow-[0_0_6px_hsl(var(--civic-green))] animate-pulse" />
            Last updated: {rep.lastUpdated}
            {rep.sourceName && ` · Source: ${rep.sourceName}`}
          </div>
        )}
      </div>
    </div>
  );
}
