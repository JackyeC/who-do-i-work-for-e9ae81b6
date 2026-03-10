import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shuffle, Sparkles, Building2, Clock, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface FuturePath {
  type: "expected" | "pivot" | "wildcard";
  label: string;
  description: string;
  roles: string[];
  skills: string[];
  companies: string[];
  timeline: string;
}

const MOCK_FUTURES: FuturePath[] = [
  {
    type: "expected",
    label: "Expected Path",
    description: "Most logical progression based on your current experience. Stay in recruiting leadership and grow into executive people operations.",
    roles: ["TA Manager → Director of TA → VP People → CPO"],
    skills: ["Executive Recruiting", "Org Design", "Board Communication", "HR Strategy"],
    companies: ["Salesforce", "HubSpot", "Stripe", "Atlassian"],
    timeline: "3-5 years to Director, 5-8 years to VP",
  },
  {
    type: "pivot",
    label: "Pivot Path",
    description: "A different but realistic career direction. Your sourcing and data skills translate directly into talent intelligence and workforce analytics.",
    roles: ["Talent Intelligence Analyst → People Analytics Lead → Head of Workforce Strategy"],
    skills: ["Data Visualization", "Python/SQL basics", "Market Research", "Predictive Analytics"],
    companies: ["LinkedIn", "Visier", "Eightfold AI", "Revelio Labs"],
    timeline: "6-12 months upskilling, 2-4 years to senior role",
  },
  {
    type: "wildcard",
    label: "Wild Card Path",
    description: "An unconventional but viable move. Your recruiting experience + tech frustrations = perfect background for HR Tech product management.",
    roles: ["Associate PM (HR Tech) → Product Manager → Senior PM → Director of Product"],
    skills: ["Product Management", "UX Research", "Agile/Scrum", "Technical Writing"],
    companies: ["Greenhouse", "Lever", "Ashby", "Gem"],
    timeline: "3-6 months transition, 2-3 years to mid-level PM",
  },
];

const PATH_CONFIG = {
  expected: { icon: TrendingUp, color: "text-[hsl(var(--civic-green))]", border: "border-[hsl(var(--civic-green))]/20", bg: "bg-[hsl(var(--civic-green))]/5" },
  pivot: { icon: Shuffle, color: "text-[hsl(var(--civic-blue))]", border: "border-[hsl(var(--civic-blue))]/20", bg: "bg-[hsl(var(--civic-blue))]/5" },
  wildcard: { icon: Sparkles, color: "text-[hsl(var(--civic-gold))]", border: "border-[hsl(var(--civic-gold))]/20", bg: "bg-[hsl(var(--civic-gold-light))]" },
};

export function MultipleFuturesStep() {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground text-center max-w-lg mx-auto">
        Three possible future paths based on your profile, skills, and career anchors. Each represents a different level of change.
      </p>

      {MOCK_FUTURES.map(future => {
        const config = PATH_CONFIG[future.type];
        const Icon = config.icon;
        return (
          <Card key={future.type} className={cn("border", config.border)}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div>
                  <CardTitle className="text-base">{future.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{future.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role Progression */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Role Progression
                </p>
                <p className="text-sm font-medium text-foreground">{future.roles[0]}</p>
              </div>

              {/* Skills */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Skills Needed
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {future.skills.map(s => (
                    <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </div>

              {/* Companies */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Companies to Watch
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {future.companies.map(c => (
                    <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{future.timeline}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
