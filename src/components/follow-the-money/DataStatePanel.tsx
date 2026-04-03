import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, AlertCircle, Search } from "lucide-react";

type Status = "strong" | "limited" | "none" | "error" | "loading";

interface Props {
  status: Status;
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
          Data temporarily unavailable
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We could not load imported political contribution data right now.
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh FEC Data
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
          No verified federal contribution activity imported yet for this employer name
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          We did not find federal political contribution records tied to
          {companyName ? ` ${companyName}` : " this employer name"} in the current import.
          That may reflect low federal political giving, messy employer naming, or a limited match in public filings.
        </p>
      </div>
    );
  }

  if (status === "limited") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex gap-3 items-start">
          <Search className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            We found some federal political contribution records connected to
            {companyName ? ` ${companyName}` : " this employer name"},
            but the footprint is limited or inconsistent across cycles.
          </p>
        </div>
        {children}
      </div>
    );
  }

  // strong
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex gap-3 items-start">
        <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          Political contribution activity linked to
          {companyName ? ` ${companyName}` : " this employer"} appears in federal records for the cycles below.
        </p>
      </div>
      {children}
    </div>
  );
}
