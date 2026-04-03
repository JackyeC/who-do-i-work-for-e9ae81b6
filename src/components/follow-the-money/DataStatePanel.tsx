import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, AlertCircle, Search } from "lucide-react";
import type { CoverageStatus } from "@/types/follow-the-money";

interface Props {
  status: CoverageStatus | "loading";
  companyName?: string;
  onRetry?: () => void;
  children: ReactNode;
}

export function DataStatePanel({ status, companyName, onRetry, children }: Props) {
  if (status === "loading") {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading political spending data">
        <div className="space-y-3">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
        <h2 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We couldn't load political spending data right now. This is usually temporary.
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (status === "none") {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/10 p-6 text-center space-y-3">
        <Database className="w-8 h-8 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-semibold text-foreground">
          No political spending trail found
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {companyName
            ? `We searched FEC filings and lobbying disclosures for ${companyName} and related names. No linked contributions were found in the public record.`
            : "We searched FEC filings and lobbying disclosures. No linked contributions were found in the public record."}
        </p>
        <p className="text-xs text-muted-foreground/70 italic">
          That could mean they're clean — or that they route spending through channels we don't yet monitor.
        </p>
      </div>
    );
  }

  if (status === "limited") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex gap-3 items-start">
          <Search className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/90 leading-relaxed">
            <strong>Limited coverage.</strong> We found some records, but the trail is thin. 
            This could mean limited FEC matching, private spending channels, or that this company 
            isn't a major political player. What's here is real — there's just not much of it yet.
          </p>
        </div>
        {children}
      </div>
    );
  }

  // strong
  return <>{children}</>;
}
