import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, ArrowRight, Star, Upload, UserCheck, Compass } from "lucide-react";

const MOCK_CONNECTIONS = [
  { name: "Sarah Chen", title: "People Analytics Lead", company: "Lattice", type: "at_target" as const, note: "Working at one of your suggested companies" },
  { name: "Marcus Rivera", title: "Former Recruiter → Product Manager", company: "Greenhouse", type: "transition" as const, note: "Made a similar career transition 2 years ago" },
  { name: "Dr. Lisa Park", title: "VP Talent Strategy", company: "Salesforce", type: "mentor" as const, note: "15+ years in talent leadership — potential mentor" },
  { name: "James O'Brien", title: "Talent Intelligence Analyst", company: "LinkedIn", type: "transition" as const, note: "Transitioned from recruiting to analytics 18 months ago" },
  { name: "Priya Sharma", title: "Director of People Ops", company: "Stripe", type: "at_target" as const, note: "Hiring for People Analytics roles on her team" },
  { name: "David Kim", title: "Chief People Officer", company: "Gusto", type: "mentor" as const, note: "Shares your values around worker-first philosophy" },
];

const TYPE_CONFIG = {
  at_target: { label: "At Target Company", icon: Building2, color: "text-[hsl(var(--civic-blue))]", bg: "bg-[hsl(var(--civic-blue))]/10" },
  transition: { label: "Made Similar Move", icon: ArrowRight, color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10" },
  mentor: { label: "Potential Mentor", icon: Star, color: "text-[hsl(var(--civic-gold))]", bg: "bg-[hsl(var(--civic-gold))]/10" },
};

export function NetworkIntelligenceStep() {
  return (
    <div className="space-y-6">
      {/* Upload CTA */}
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Upload Your LinkedIn Connections</p>
            <p className="text-xs text-muted-foreground">Import your network to see who can help you along each career path.</p>
          </div>
          <Button variant="outline" size="sm">Upload CSV</Button>
        </CardContent>
      </Card>

      {/* Path Guides Header */}
      <div className="flex items-center gap-2">
        <Compass className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Path Guides</h3>
        <Badge variant="secondary" className="text-[10px]">{MOCK_CONNECTIONS.length} identified</Badge>
      </div>

      {/* Filter badges */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const count = MOCK_CONNECTIONS.filter(c => c.type === key).length;
          return (
            <Badge key={key} variant="outline" className="gap-1.5 text-xs cursor-pointer hover:bg-muted">
              <Icon className={`w-3 h-3 ${config.color}`} />
              {config.label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Connections */}
      <div className="space-y-3">
        {MOCK_CONNECTIONS.map((conn, i) => {
          const config = TYPE_CONFIG[conn.type];
          const Icon = config.icon;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                    <UserCheck className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{conn.name}</p>
                      <Badge variant="outline" className={`text-[10px] gap-1 ${config.color}`}>
                        <Icon className="w-2.5 h-2.5" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{conn.title} at {conn.company}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">"{conn.note}"</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] h-7 shrink-0">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
