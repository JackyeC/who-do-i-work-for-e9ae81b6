import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileSearch, Map, GitCompare, Landmark, Briefcase, Radio, UserCheck, ArrowRight, Dna, Shield, Newspaper,
} from "lucide-react";

const TOOLS = [
  {
    icon: FileSearch,
    title: "The Receipts",
    description: "Forensic company files: values claims vs. political spend, labor signals, and citations. You see the evidence, not a verdict handed down.",
    path: "/receipts",
    badge: "Free",
  },
  {
    icon: Newspaper,
    title: "The Work Signal",
    description: "Live employer intelligence feed — layoffs, policy shifts, AI workplace moves, pay equity, enforcement. Each story: what happened, what it means, what to watch.",
    path: "/newsletter",
    badge: "Free",
  },
  {
    icon: Map,
    title: "Career Map",
    description: "Career paths with public-data context — where demand is moving, what skills gap actually costs you, and what to verify next.",
    path: "/career-intelligence",
    badge: "Pro",
  },
  {
    icon: GitCompare,
    title: "Compare Companies",
    description: "Two employers, same lens: clarity scores, money out the door, workforce risk, transparency gaps — so you can choose with leverage.",
    path: "/compare",
  },
  {
    icon: Landmark,
    title: "Follow the Money",
    description: "PACs, lobbying, where dollars land. Follow incentives to see who benefits when the talking points say something else.",
    path: "/follow-the-money",
  },
  {
    icon: UserCheck,
    title: "Recruiter Brief",
    description: "Signal-grounded talking points for candidate conversations — what the record supports, what to ask, without recruiter theater.",
    path: "/recruiter-brief",
  },
  {
    icon: Radio,
    title: "Signal Alerts",
    description: "WARN, filings, leadership moves, lobbying shifts — when the public record changes, you know before the narrative solidifies.",
    path: "/signal-alerts",
    badge: "Pro",
  },
  {
    icon: Briefcase,
    title: "Job Board",
    description: "Open roles with employer context attached: money, risk, values signals. Apply with eyes open, not after the fact.",
    path: "/jobs",
  },
  {
    icon: Dna,
    title: "Workplace DNA",
    description: "Short calibration on what you actually need from a workplace — we match you to employers whose signals fit, not whose ads do.",
    path: "/quiz",
    badge: "Free",
  },
  {
    icon: Shield,
    title: "Submit a Tip",
    description: "Anonymous tip line; we only publish what we can verify in public records or filings.",
    path: "/submit-tip",
    badge: "Free",
  },
];

export default function Tools() {
  usePageSEO({
    title: "All Tools — Who Do I Work For?",
    description: "Explore every tool on the Who Do I Work For platform: Receipts, Career Map, Compare, Follow the Money, Recruiter Brief, Signal Alerts, and Job Board.",
    path: "/tools",
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="text-center py-16 px-4 max-w-3xl mx-auto">
        <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-4">Platform</p>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">All Tools</h1>
        <p className="text-muted-foreground text-lg">
          Decision intelligence for work: public records, clear implications, and what most people skip — not inspiration, not HR fluff.
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
