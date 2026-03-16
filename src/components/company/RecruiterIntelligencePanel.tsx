import { Briefcase, Clock, TrendingUp, DollarSign, Star, AlertTriangle } from "lucide-react";

interface RecruiterMetric {
  label: string;
  value: string;
  level: "low" | "medium" | "high";
  icon: React.ElementType;
}

interface RecruiterIntelligencePanelProps {
  jobCount?: number;
  warnCount?: number;
  hasCompData?: boolean;
  sentimentScore?: number;
  execTurnover?: number;
}

function levelColor(level: "low" | "medium" | "high") {
  switch (level) {
    case "low": return "text-primary border-primary/30 bg-primary/5";
    case "medium": return "text-amber-500 border-amber-500/30 bg-amber-500/5";
    case "high": return "text-destructive border-destructive/30 bg-destructive/5";
  }
}

export function RecruiterIntelligencePanel({
  jobCount = 0,
  warnCount = 0,
  hasCompData = false,
  sentimentScore = 0,
  execTurnover = 0,
}: RecruiterIntelligencePanelProps) {
  const metrics: RecruiterMetric[] = [
    {
      label: "Recruiting Difficulty",
      value: jobCount > 50 ? "High Volume" : jobCount > 10 ? "Moderate" : "Low Volume",
      level: jobCount > 50 ? "high" : jobCount > 10 ? "medium" : "low",
      icon: Briefcase,
    },
    {
      label: "Offer Acceptance Prediction",
      value: sentimentScore > 5 ? "Favorable" : sentimentScore > 2 ? "Neutral" : "Uncertain",
      level: sentimentScore > 5 ? "low" : sentimentScore > 2 ? "medium" : "high",
      icon: TrendingUp,
    },
    {
      label: "Est. Time to Fill",
      value: jobCount > 30 ? "45-60 days" : jobCount > 10 ? "30-45 days" : "20-30 days",
      level: jobCount > 30 ? "high" : jobCount > 10 ? "medium" : "low",
      icon: Clock,
    },
    {
      label: "Comp Market Position",
      value: hasCompData ? "Data Available" : "Limited Data",
      level: hasCompData ? "low" : "medium",
      icon: DollarSign,
    },
    {
      label: "Talent Reputation",
      value: sentimentScore > 5 ? "Strong" : sentimentScore > 2 ? "Average" : "Needs Work",
      level: sentimentScore > 5 ? "low" : sentimentScore > 2 ? "medium" : "high",
      icon: Star,
    },
    {
      label: "Attrition Risk",
      value: warnCount > 3 ? "Elevated" : execTurnover > 3 ? "Moderate" : "Stable",
      level: warnCount > 3 ? "high" : execTurnover > 3 ? "medium" : "low",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="bg-card border border-border">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Briefcase className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="font-mono text-xs tracking-[0.15em] uppercase text-primary font-semibold">
          Recruiter Intelligence
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-border">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className={`p-4 border ${levelColor(m.level)}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-wider">{m.label}</span>
              </div>
              <div className="text-sm font-semibold">{m.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
