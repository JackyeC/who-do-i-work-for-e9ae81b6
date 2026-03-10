import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  lines?: number;
  children: React.ReactNode;
}

export function DiscoveryLoadingState({ loading, error, onRetry, lines = 6, children }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 animate-pulse" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          AI is analyzing your profile and generating personalized results…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-foreground font-medium">Something went wrong</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
