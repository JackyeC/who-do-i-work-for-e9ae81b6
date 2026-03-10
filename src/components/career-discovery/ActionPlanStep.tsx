import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, BookOpen, Wrench, Users, Building2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  period: string;
  icon: typeof Calendar;
  color: string;
  actions: { type: "course" | "skill" | "project" | "connect" | "company"; text: string; done?: boolean }[];
}

const MOCK_MILESTONES: Milestone[] = [
  {
    period: "Next 30 Days",
    icon: Calendar,
    color: "text-[hsl(var(--civic-green))]",
    actions: [
      { type: "course", text: "Complete 'Intro to People Analytics' (Coursera)", done: false },
      { type: "skill", text: "Start learning SQL basics for HR data", done: false },
      { type: "connect", text: "Reach out to 3 People Analytics professionals on LinkedIn", done: false },
      { type: "company", text: "Research Lattice, Visier, and Eightfold AI", done: false },
    ],
  },
  {
    period: "Next 90 Days",
    icon: Calendar,
    color: "text-[hsl(var(--civic-blue))]",
    actions: [
      { type: "course", text: "Complete 'HR Analytics' certificate (SHRM or AIHR)", done: false },
      { type: "project", text: "Build a recruiting funnel dashboard using real data", done: false },
      { type: "skill", text: "Practice data storytelling with 3 case studies", done: false },
      { type: "connect", text: "Attend 1 People Analytics meetup or webinar", done: false },
      { type: "company", text: "Apply to 2 bridge roles (People Ops Analyst, TA Data Analyst)", done: false },
    ],
  },
  {
    period: "Next 6 Months",
    icon: Calendar,
    color: "text-[hsl(var(--civic-yellow))]",
    actions: [
      { type: "course", text: "Start 'Product Management Fundamentals' if pursuing PM path", done: false },
      { type: "project", text: "Publish a LinkedIn article on talent market insights", done: false },
      { type: "skill", text: "Build proficiency in a data visualization tool (Tableau/Looker)", done: false },
      { type: "connect", text: "Secure 1 informational interview at a target company", done: false },
    ],
  },
  {
    period: "Next 12 Months",
    icon: Calendar,
    color: "text-primary",
    actions: [
      { type: "skill", text: "Achieve intermediate-level People Analytics competency", done: false },
      { type: "project", text: "Lead a workforce planning initiative at current company", done: false },
      { type: "connect", text: "Build a network of 10+ contacts in target roles", done: false },
      { type: "company", text: "Apply to 3-5 target roles at aligned companies", done: false },
      { type: "course", text: "Present career transition portfolio to mentors for feedback", done: false },
    ],
  },
];

const ACTION_ICONS = {
  course: BookOpen,
  skill: Wrench,
  project: CheckCircle2,
  connect: Users,
  company: Building2,
};

const ACTION_LABELS = {
  course: "Course",
  skill: "Skill",
  project: "Project",
  connect: "Network",
  company: "Company",
};

export function ActionPlanStep() {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground text-center max-w-lg mx-auto">
        Your personalized action plan based on your target role and skill gaps. Check items off as you complete them.
      </p>

      {MOCK_MILESTONES.map((milestone, mi) => (
        <Card key={milestone.period}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <milestone.icon className={cn("w-4 h-4", milestone.color)} />
              {milestone.period}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {milestone.actions.map((action, ai) => {
              const ActionIcon = ACTION_ICONS[action.type];
              return (
                <div key={ai} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer">
                  <div className="mt-0.5">
                    {action.done ? (
                      <CheckCircle2 className="w-4 h-4 text-[hsl(var(--civic-green))]" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", action.done ? "text-muted-foreground line-through" : "text-foreground")}>{action.text}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                    <ActionIcon className="w-2.5 h-2.5" />
                    {ACTION_LABELS[action.type]}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
