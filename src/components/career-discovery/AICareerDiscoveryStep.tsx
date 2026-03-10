import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shuffle, Lightbulb, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_LIKELY = [
  { from: "Senior Recruiter", to: "Talent Acquisition Manager", confidence: 92, skills: ["Team Leadership", "ATS Strategy", "Hiring Analytics"] },
  { from: "Talent Acquisition Manager", to: "Director of Talent Acquisition", confidence: 85, skills: ["Executive Recruiting", "Workforce Planning", "Budget Management"] },
  { from: "Director of TA", to: "VP People", confidence: 68, skills: ["HR Strategy", "Org Design", "Board Reporting"] },
];

const MOCK_ADJACENT = [
  { role: "People Analytics Lead", industry: "Tech / SaaS", match: 88, reason: "Your data-driven recruiting background maps directly to workforce analytics" },
  { role: "Customer Success Manager (HR Tech)", industry: "HR Technology", match: 82, reason: "Recruiter empathy + tech knowledge = perfect for HR tool adoption" },
  { role: "Talent Intelligence Analyst", industry: "Consulting", match: 79, reason: "Research and sourcing skills translate to market intelligence" },
];

const MOCK_UNEXPECTED = [
  { role: "HR Tech Product Manager", match: 76, reason: "Daily ATS frustrations give you unique product insight", skills: ["Product Thinking", "UX Research", "Agile"] },
  { role: "Workforce Strategy Consultant", match: 72, reason: "You understand hiring cycles, talent markets, and employer challenges", skills: ["Consulting", "Data Storytelling", "Strategy"] },
  { role: "Community Manager (Talent Platform)", match: 68, reason: "Building candidate relationships is community management", skills: ["Content Strategy", "Event Planning", "Brand Building"] },
];

export function AICareerDiscoveryStep() {
  return (
    <div className="space-y-6">
      {/* Likely Paths */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Likely Career Paths
          </CardTitle>
          <p className="text-xs text-muted-foreground">Roles people with similar skills often move into.</p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {MOCK_LIKELY.map((path, i) => (
              <div key={i} className="flex items-center gap-3 mb-4 last:mb-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{path.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-primary">{path.to}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {path.skills.map(s => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-foreground">{path.confidence}%</div>
                  <div className="text-[10px] text-muted-foreground">match</div>
                </div>
              </div>
            ))}
            {/* Visual connecting line */}
            <div className="absolute left-4 top-6 bottom-6 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent hidden sm:block" />
          </div>
        </CardContent>
      </Card>

      {/* Adjacent Paths */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-[hsl(var(--civic-blue))]" />
            Adjacent Career Paths
          </CardTitle>
          <p className="text-xs text-muted-foreground">Roles that use similar skills but in different industries.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_ADJACENT.map((path, i) => (
            <div key={i} className="p-3 rounded-lg border border-border hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{path.role}</p>
                    <Badge variant="outline" className="text-[10px]">{path.industry}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{path.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-[hsl(var(--civic-blue))]">{path.match}%</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Unexpected Paths */}
      <Card className="border-[hsl(var(--civic-gold))]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[hsl(var(--civic-gold))]" />
            Unexpected Career Paths
          </CardTitle>
          <p className="text-xs text-muted-foreground">Roles you may not have considered but for which you are well suited.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_UNEXPECTED.map((path, i) => (
            <div key={i} className="p-4 rounded-xl bg-[hsl(var(--civic-gold-light))] border border-[hsl(var(--civic-gold))]/15">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-[hsl(var(--civic-gold))]" />
                    <p className="text-sm font-semibold text-foreground">{path.role}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{path.reason}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {path.skills.map(s => (
                      <Badge key={s} variant="outline" className="text-[10px] border-[hsl(var(--civic-gold))]/30">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-[hsl(var(--civic-gold))]">{path.match}%</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
