import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApplicationActionCardProps {
  type: "resume" | "cover_letter" | "auto_apply" | "interview";
  recommendation: string;
  actionLabel?: string;
  onAction?: () => void;
}

const typeLabels: Record<string, { title: string; icon: string }> = {
  resume: { title: "Resume suggestion", icon: "Resume" },
  cover_letter: { title: "Cover letter suggestion", icon: "Cover Letter" },
  auto_apply: { title: "AutoApply note", icon: "AutoApply" },
  interview: { title: "Interview prep", icon: "Interview" },
};

export function ApplicationActionCard({ type, recommendation, actionLabel, onAction }: ApplicationActionCardProps) {
  const meta = typeLabels[type] || typeLabels.resume;

  return (
    <div className="border border-border/40 bg-card p-4 space-y-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-primary">{meta.title}</span>
      <p className="text-xs text-foreground/75 leading-relaxed">{recommendation}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="text-xs gap-1.5 mt-1" onClick={onAction}>
          {actionLabel}
          <ArrowRight className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
