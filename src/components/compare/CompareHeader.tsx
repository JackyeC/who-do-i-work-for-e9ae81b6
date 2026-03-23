import { ArrowLeftRight } from "lucide-react";

interface CompareHeaderProps {
  nameA?: string;
  nameB?: string;
}

export function CompareHeader({ nameA, nameB }: CompareHeaderProps) {
  const hasMatch = nameA && nameB;

  return (
    <div className="text-center mb-10">
      <div className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4 flex items-center justify-center gap-2">
        <span className="w-8 h-px bg-primary/40" />
        Intelligence Comparison
        <span className="w-8 h-px bg-primary/40" />
      </div>
      <h1 className="text-2xl lg:text-[clamp(2rem,4.5vw,3.5rem)] font-bold mb-3 text-foreground leading-tight">
        {hasMatch ? (
          <span className="flex items-center justify-center gap-3 flex-wrap">
            <span>{nameA}</span>
            <span className="relative">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </span>
              <span className="absolute inset-0 rounded-full bg-primary/5 animate-ping" style={{ animationDuration: '3s' }} />
            </span>
            <span>{nameB}</span>
          </span>
        ) : (
          <>Compare Employers</>
        )}
      </h1>
      <p className="text-muted-foreground max-w-[500px] mx-auto text-[13px]">
        Side-by-side transparency comparison. Same data sources. Same scoring. You decide.
      </p>
    </div>
  );
}
