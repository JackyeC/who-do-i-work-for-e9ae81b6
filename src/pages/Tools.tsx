import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileSearch, Map, GitCompare, Landmark, Briefcase, Radio, UserCheck, ArrowRight,
} from "lucide-react";

const TOOLS = [
  {
    icon: FileSearch,
    title: "The Receipts",
    description: "Company-by-company investigations connecting corporate values claims to political spending, DEI actions, and labor impact. Every claim sourced. Every dollar traced.",
    path: "/receipts",
    badge: "Free",
  },
  {
    icon: Map,
    title: "Career Map",
    description: "Explore career paths with intelligence-backed insights. Understand role progressions, skill gaps, and industry trajectories powered by public data.",
    path: "/career-intelligence",
    badge: "Pro",
  },
  {
    icon: GitCompare,
    title: "Compare Companies",
    description: "Side-by-side comparison of two employers across civic footprint, lobbying, PAC spending, workforce signals, and transparency metrics.",
    path: "/compare",
  },
  {
    icon: Landmark,
    title: "Follow the Money",
    description: "Trace PAC donations, lobbying expenditures, and political spending from any company to the candidates and bills they support.",
    path: "/follow-the-money",
  },
  {
    icon: UserCheck,
    title: "Recruiter Brief",
    description: "Generate signal-grounded intelligence briefs for candidate conversations. Honest, non-salesy framing backed by real data.",
    path: "/recruiter-brief",
  },
  {
    icon: Radio,
    title: "Signal Alerts",
    description: "Monitor companies for new signals — WARN Act filings, lobbying changes, OSHA complaints, executive turnover — delivered in real time.",
    path: "/signal-alerts",
    badge: "Pro",
  },
  {
    icon: Briefcase,
    title: "Job Board",
    description: "Browse job listings enriched with employer transparency signals, civic scores, and values alignment data. Know before you apply.",
    path: "/jobs",
  },
];

export default function Tools() {
  usePageSEO({
    title: "All Tools — Who Do I Work For?",
    description: "Explore every tool on the WDIWF platform: Receipts, Career Map, Compare, Follow the Money, Recruiter Brief, Signal Alerts, and Job Board.",
    path: "/tools",
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="text-center py-16 px-4 max-w-3xl mx-auto">
        <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-4">Platform</p>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">All Tools</h1>
        <p className="text-muted-foreground text-lg">
          Every tool you need to understand who you really work for — powered by public records, not opinions.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-16 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link key={tool.path} to={tool.path} className="group">
            <Card className="bg-card border border-border hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-5 flex flex-col gap-3 h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <tool.icon className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold text-foreground">{tool.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tool.badge && (
                      <Badge variant={tool.badge === "Free" ? "default" : "secondary"} className="text-xs">
                        {tool.badge}
                      </Badge>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
