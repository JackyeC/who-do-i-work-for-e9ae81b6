import { ShieldCheck } from "lucide-react";

export function PlatformPhilosophy() {
  return (
    <div className="card-official rounded-xl p-4 mb-4">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Recruiting works best when messaging and reality match. This platform surfaces
            Employer Reality Signals from publicly available records so recruiters and candidates
            can make informed career decisions. No moral judgments are assigned.
          </p>
          <div className="flex flex-wrap gap-3">
            <ConfidencePill level="Direct Source" color="text-[hsl(var(--civic-green))]" description="Official filing or disclosure" />
            <ConfidencePill level="Multi-Source Signal" color="text-primary" description="Corroborated across sources" />
            <ConfidencePill level="Inferred Signal" color="text-[hsl(var(--civic-yellow))]" description="Indirect public evidence" />
            <ConfidencePill level="No Public Evidence" color="text-muted-foreground" description="Not detected in scanned sources" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidencePill({ level, color, description }: { level: string; color: string; description: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${color} bg-current`} />
      <span className="text-[10px] text-muted-foreground">
        <strong className={color}>{level}</strong> — {description}
      </span>
    </div>
  );
}
