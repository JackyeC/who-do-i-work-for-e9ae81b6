import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, LayoutDashboard, Zap, Mic, Newspaper, ArrowRight } from "lucide-react";
import { useJobMatcher, useApplicationsTracker } from "@/hooks/use-job-matcher";
import { cn } from "@/lib/utils";

const LiveIntelligenceTicker = lazy(() =>
  import("@/components/landing/LiveIntelligenceTicker").then((m) => ({
    default: m.LiveIntelligenceTicker,
  }))
);

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

interface HeartbeatProps {
  onNavigate: (tab: string) => void;
}

export function DashboardHeartbeat({ onNavigate }: HeartbeatProps) {
  const jobData = useJobMatcher();
  const { applications } = useApplicationsTracker();

  const matchedJobs = jobData?.matches ?? [];
  const matchCount = matchedJobs.length;
  const appCount = applications?.length ?? 0;

  const tiles = [
    {
      icon: Briefcase,
      label: "Job Matches",
      stat: matchCount > 0 ? `${matchCount} aligned` : "Scan to match",
      sub: matchedJobs?.[0]?.job_title ?? "Based on your values",
      tab: "matches",
      color: "hsl(142, 70%, 45%)",
    },
    {
      icon: LayoutDashboard,
      label: "Applications",
      stat: appCount > 0 ? `${appCount} tracked` : "None yet",
      sub: "Pipeline & status",
      tab: "app-tracker",
      color: "hsl(43, 96%, 56%)",
    },
    {
      icon: Zap,
      label: "Auto-Apply & Materials",
      stat: "Apply Kit",
      sub: "Resume, cover letter, prep",
      tab: "auto-apply",
      color: "hsl(262, 80%, 60%)",
    },
    {
      icon: Mic,
      label: "AI Mock Interview",
      stat: "Practice now",
      sub: "Get sharp before you go in",
      tab: "mock-interview",
      color: "hsl(200, 90%, 55%)",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Pulse — Live ticker */}
      <motion.div {...anim(0)}>
        <Suspense fallback={<div className="h-[36px] bg-muted/30 rounded-lg animate-pulse" />}>
          <LiveIntelligenceTicker />
        </Suspense>
      </motion.div>

      {/* Action tiles */}
      <motion.div {...anim(0.05)}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <button
              key={t.tab}
              onClick={() => onNavigate(t.tab)}
              className="group text-left rounded-xl p-4 bg-card border border-border/30 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <t.icon className="w-4 h-4" style={{ color: t.color }} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t.label}
                </span>
              </div>
              <p className="text-sm font-bold text-foreground">{t.stat}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{t.sub}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Briefing link */}
      <motion.div {...anim(0.1)}>
        <Link
          to="/briefing"
          className="flex items-center gap-3 rounded-xl px-4 py-3 bg-card border border-border/30 hover:border-primary/30 transition-all group"
        >
          <Newspaper className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground flex-1">
            Today's Briefing
          </span>
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
            Latest summary <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </motion.div>
    </div>
  );
}
