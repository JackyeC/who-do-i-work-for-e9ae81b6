/**
 * CareerReadinessRing — SVG progress ring showing profile completeness.
 * Incomplete items show as actionable checklist items.
 */
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePersona } from "@/hooks/use-persona";
import { useCivicImpact } from "@/hooks/use-civic-impact";
import { useDashboardBriefing } from "@/hooks/use-dashboard-briefing";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { evaluateReadiness, type ReadinessInput } from "@/lib/dopamine-engine";
import { motion } from "framer-motion";
import { Check, ArrowRight, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CareerReadinessRingProps {
  onNavigate: (tab: string) => void;
}

function ProgressRing({ score, size = 72, stroke = 5 }: { score: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "stroke-civic-green" :
    score >= 50 ? "stroke-primary" :
    score >= 25 ? "stroke-civic-gold" :
    "stroke-muted-foreground";

  const bgColor =
    score >= 80 ? "text-civic-green" :
    score >= 50 ? "text-primary" :
    score >= 25 ? "text-civic-gold" :
    "text-muted-foreground";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border/30"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-lg font-bold font-mono leading-none", bgColor)}>
          {score}%
        </span>
      </div>
    </div>
  );
}

export function CareerReadinessRing({ onNavigate }: CareerReadinessRingProps) {
  const { user } = useAuth();
  const { hasTakenQuiz } = usePersona();
  const { data: civic } = useCivicImpact();
  const { data: briefing } = useDashboardBriefing();
  const navigate = useNavigate();

  const { data: profileData } = useQuery({
    queryKey: ["readiness-data", user?.id],
    queryFn: async () => {
      const [values, docs] = await Promise.all([
        (supabase as any)
          .from("user_values_profile")
          .select("id")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase.from("user_documents").select("id").limit(1),
      ]);
      return {
        hasValuesProfile: !!values.data,
        hasResume: (docs.data?.length ?? 0) > 0 || localStorage.getItem("wdiwf_resume_uploaded") === "true",
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const readiness = useMemo(() => {
    if (!profileData || !civic || !briefing) return null;
    const input: ReadinessInput = {
      hasResume: profileData.hasResume,
      hasValuesProfile: profileData.hasValuesProfile,
      hasTakenQuiz,
      hasTrackedCompany: (civic.employersTracked ?? 0) > 0,
      hasApplication: (briefing as any)?.applications > 0 || false,
      hasAlerts: (civic.signalsUncovered ?? 0) > 0,
    };
    return evaluateReadiness(input);
  }, [profileData, civic, briefing, hasTakenQuiz]);

  if (!readiness) return null;

  const incomplete = readiness.items.filter((i) => !i.done);
  const isComplete = readiness.score === 100;

  const handleItemAction = (item: typeof readiness.items[0]) => {
    if (item.targetType === "route") {
      navigate(item.target);
    } else {
      onNavigate(item.target);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-xl border p-4",
        isComplete ? "border-civic-green/25 bg-civic-green/[0.04]" : "border-border/30 bg-card"
      )}
    >
      <div className="flex items-start gap-4">
        <ProgressRing score={readiness.score} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Target className={cn("w-3.5 h-3.5", isComplete ? "text-civic-green" : "text-primary")} />
            <h4 className="text-sm font-bold text-foreground">
              {isComplete ? "Career-ready" : "Career Readiness"}
            </h4>
          </div>

          {isComplete ? (
            <p className="text-xs text-civic-green font-medium">
              Your profile is fully loaded. You're operating with full intelligence.
            </p>
          ) : (
            <div className="space-y-1.5">
              {incomplete.slice(0, 3).map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleItemAction(item)}
                  className="flex items-center gap-2 group w-full text-left"
                >
                  <span className="w-4 h-4 rounded border border-border/50 shrink-0 flex items-center justify-center group-hover:border-primary/40">
                    <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </span>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {item.label}
                  </span>
                </button>
              ))}
              {incomplete.length > 3 && (
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  +{incomplete.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
