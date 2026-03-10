import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, BookOpen, Wrench, Users, Building2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscoveryLoadingState } from "./DiscoveryLoadingState";
import type { ActionPlanData } from "@/hooks/use-career-discovery";

interface Props {
  data: ActionPlanData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const ACTION_ICONS: Record<string, typeof Calendar> = {
  course: BookOpen,
  skill: Wrench,
  project: CheckCircle2,
  connect: Users,
  company: Building2,
};

const ACTION_LABELS: Record<string, string> = {
  course: "Course",
  skill: "Skill",
  project: "Project",
  connect: "Network",
  company: "Company",
};

const PERIOD_COLORS = [
  "text-[hsl(var(--civic-green))]",
  "text-[hsl(var(--civic-blue))]",
  "text-[hsl(var(--civic-yellow))]",
  "text-primary",
];

export function ActionPlanStep({ data, loading, error, onRetry }: Props) {
  return (
    <DiscoveryLoadingState loading={loading} error={error} onRetry={onRetry} lines={10}>
      {data && (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground text-center max-w-lg mx-auto">
            Your personalized action plan based on your target role and skill gaps.
          </p>

          {data.milestones.map((milestone, mi) => (
            <Card key={milestone.period}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className={cn("w-4 h-4", PERIOD_COLORS[mi] || "text-primary")} />
                  {milestone.period}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {milestone.actions.map((action, ai) => {
                  const ActionIcon = ACTION_ICONS[action.type] || CheckCircle2;
                  return (
                    <div key={ai} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer">
                      <div className="mt-0.5">
                        <Circle className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{action.text}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                        <ActionIcon className="w-2.5 h-2.5" />
                        {ACTION_LABELS[action.type] || action.type}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DiscoveryLoadingState>
  );
}
