import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, TrendingUp, ArrowUpRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillItem {
  name: string;
  level: number; // 0-100
  category: "strong" | "transferable" | "bridge" | "develop";
}

const MOCK_SKILLS: SkillItem[] = [
  { name: "Candidate Sourcing", level: 95, category: "strong" },
  { name: "Stakeholder Management", level: 90, category: "strong" },
  { name: "ATS / HR Tech", level: 88, category: "strong" },
  { name: "Employer Branding", level: 82, category: "strong" },
  { name: "Data Analysis", level: 70, category: "transferable" },
  { name: "Project Management", level: 68, category: "transferable" },
  { name: "Presentation Skills", level: 65, category: "transferable" },
  { name: "People Analytics", level: 45, category: "bridge" },
  { name: "Product Thinking", level: 35, category: "bridge" },
  { name: "Strategic Planning", level: 30, category: "bridge" },
  { name: "Executive Coaching", level: 20, category: "develop" },
  { name: "Financial Modeling", level: 15, category: "develop" },
  { name: "Org Design", level: 10, category: "develop" },
];

const CATEGORY_CONFIG = {
  strong: { label: "Strong Match", icon: CheckCircle2, color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", bar: "bg-[hsl(var(--civic-green))]" },
  transferable: { label: "Growing Skill", icon: TrendingUp, color: "text-[hsl(var(--civic-blue))]", bg: "bg-[hsl(var(--civic-blue))]/10", bar: "bg-[hsl(var(--civic-blue))]" },
  bridge: { label: "Bridge Skill", icon: ArrowUpRight, color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", bar: "bg-[hsl(var(--civic-yellow))]" },
  develop: { label: "Needs Development", icon: AlertCircle, color: "text-[hsl(var(--civic-red))]", bg: "bg-[hsl(var(--civic-red))]/10", bar: "bg-[hsl(var(--civic-red))]" },
};

export function SkillGapStep() {
  const categories = ["strong", "transferable", "bridge", "develop"] as const;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map(cat => {
          const config = CATEGORY_CONFIG[cat];
          const Icon = config.icon;
          const count = MOCK_SKILLS.filter(s => s.category === cat).length;
          return (
            <Card key={cat} className={cn("border-l-2", cat === "strong" ? "border-l-[hsl(var(--civic-green))]" : cat === "transferable" ? "border-l-[hsl(var(--civic-blue))]" : cat === "bridge" ? "border-l-[hsl(var(--civic-yellow))]" : "border-l-[hsl(var(--civic-red))]")}>
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

      {/* Detailed Breakdown */}
      {categories.map(cat => {
        const config = CATEGORY_CONFIG[cat];
        const Icon = config.icon;
        const skills = MOCK_SKILLS.filter(s => s.category === cat);
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
  );
}
