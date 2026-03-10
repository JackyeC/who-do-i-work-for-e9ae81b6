import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, ArrowUpRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscoveryLoadingState } from "./DiscoveryLoadingState";
import type { SkillGapData } from "@/hooks/use-career-discovery";

interface Props {
  data: SkillGapData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const CATEGORY_CONFIG = {
  strong: { label: "Strong Match", icon: CheckCircle2, color: "text-[hsl(var(--civic-green))]", bar: "bg-[hsl(var(--civic-green))]", border: "border-l-[hsl(var(--civic-green))]" },
  transferable: { label: "Growing Skill", icon: TrendingUp, color: "text-[hsl(var(--civic-blue))]", bar: "bg-[hsl(var(--civic-blue))]", border: "border-l-[hsl(var(--civic-blue))]" },
  bridge: { label: "Bridge Skill", icon: ArrowUpRight, color: "text-[hsl(var(--civic-yellow))]", bar: "bg-[hsl(var(--civic-yellow))]", border: "border-l-[hsl(var(--civic-yellow))]" },
  develop: { label: "Needs Development", icon: AlertCircle, color: "text-[hsl(var(--civic-red))]", bar: "bg-[hsl(var(--civic-red))]", border: "border-l-[hsl(var(--civic-red))]" },
};

const CATEGORIES = ["strong", "transferable", "bridge", "develop"] as const;

export function SkillGapStep({ data, loading, error, onRetry }: Props) {
  return (
    <DiscoveryLoadingState loading={loading} error={error} onRetry={onRetry} lines={8}>
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => {
              const config = CATEGORY_CONFIG[cat];
              const Icon = config.icon;
              const count = data.skills.filter(s => s.category === cat).length;
              return (
                <Card key={cat} className={cn("border-l-2", config.border)}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={cn("w-3.5 h-3.5", config.color)} />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{config.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {CATEGORIES.map(cat => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            const skills = data.skills.filter(s => s.category === cat);
            if (skills.length === 0) return null;
            return (
              <Card key={cat}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", config.color)} />
                    {config.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {skills.map(skill => (
                    <div key={skill.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{skill.name}</span>
                        <span className={cn("text-xs font-semibold", config.color)}>{skill.level}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", config.bar)} style={{ width: `${skill.level}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DiscoveryLoadingState>
  );
}
