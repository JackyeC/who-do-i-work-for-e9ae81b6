import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const STAGES = [
  { key: "saved", label: "Saved", note: "Ready when you are", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted-foreground) / 0.12)" },
  { key: "applied", label: "Applied", note: "You showed up", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  { key: "screening", label: "Screening", note: "They're looking", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  { key: "interview", label: "Interview", note: "You got this", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.12)" },
  { key: "offer", label: "Offer", note: "Coming soon", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
] as const;

type StageCounts = Record<string, number>;

const STATUS_MAP: Record<string, string> = {
  saved: "saved",
  applied: "applied",
  screening: "screening",
  interview: "interviewing",
  offer: "offer",
};

export function YourJourney() {
  const { user } = useAuth();

  const { data: counts = {} } = useQuery<StageCounts>({
    queryKey: ["journey-stages", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications_tracker")
        .select("status")
        .eq("user_id", user!.id);

      const result: StageCounts = {};
      for (const stage of STAGES) {
        const matchStatuses = [stage.key, STATUS_MAP[stage.key]].filter(Boolean);
        result[stage.key] = (data ?? []).filter((d) =>
          matchStatuses.includes(d.status?.toLowerCase())
        ).length;
      }
      return result;
    },
    enabled: !!user,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="rounded-2xl p-6 bg-card border border-border/30">
        <h3 className="text-sm font-bold text-foreground mb-5">Your Journey</h3>

        <div className="flex items-start justify-between relative">
          {/* Connecting line */}
          <div
            className="absolute top-5 left-5 right-5 h-px bg-border/40"
            style={{ zIndex: 0 }}
          />

          {STAGES.map((stage, i) => {
            const count = counts[stage.key] ?? 0;
            const hasCount = count > 0;

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center text-center relative z-10"
                style={{ flex: 1 }}
              >
                {/* Circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: hasCount ? stage.bg : "hsl(var(--muted) / 0.5)",
                    color: hasCount ? stage.color : "hsl(var(--muted-foreground))",
                    border: `1.5px solid ${hasCount ? stage.color : "hsl(var(--border))"}`,
                  }}
                >
                  {count}
                </div>

                {/* Label */}
                <span
                  className="text-xs font-semibold mt-2"
                  style={{ color: hasCount ? stage.color : "hsl(var(--muted-foreground))" }}
                >
                  {stage.label}
                </span>

                {/* Encouraging note */}
                <span className="text-[10px] text-[hsl(var(--text-tertiary))] mt-0.5 leading-tight">
                  {stage.note}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
