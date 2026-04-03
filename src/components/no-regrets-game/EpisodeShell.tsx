import type { ReactNode } from "react";

interface EpisodeShellProps {
  children: ReactNode;
}

export function EpisodeShell({ children }: EpisodeShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-5 text-center">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            No‑Regrets Career Story
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">
            Powered by WDIWF + Follow The Money
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {children}
      </main>
    </div>
  );
}
