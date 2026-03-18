import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Heart, FileText, Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardOnboardingProps {
  onNavigate: (tab: string) => void;
}

export function DashboardOnboarding({ onNavigate }: DashboardOnboardingProps) {
  const { user } = useAuth();

  const { data: progress } = useQuery({
    queryKey: ["onboarding-progress", user?.id],
    queryFn: async () => {
      const [values, docs, tracked, watchlist] = await Promise.all([
        (supabase as any).from("user_values_profile").select("id").eq("user_id", user!.id).maybeSingle(),
        (supabase as any).from("user_career_documents").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        (supabase as any).from("tracked_companies").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_active", true),
        (supabase as any).from("user_company_watchlist").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);
      return {
        hasValues: !!values.data,
        hasDocuments: (docs.count || 0) > 0,
        hasExploredCompany: (tracked.count || 0) > 0 || (watchlist.count || 0) > 0,
      };
    },
    enabled: !!user,
  });

  if (!progress) return null;

  const steps = [
    {
      id: "values",
      label: "Set your workplace values",
      description: "Tell us what matters — pay transparency, worker protections, AI ethics, and more.",
      done: progress.hasValues,
      action: () => onNavigate("values"),
      icon: Heart,
    },
    {
      id: "resume",
      label: "Upload your resume",
      description: "We'll extract your skills and experience to power career matching.",
      done: progress.hasDocuments,
      action: () => window.location.href = "/career-map",
      icon: FileText,
    },
    {
      id: "explore",
      label: "Check your first company",
      description: "Search any employer to see their civic footprint, hiring signals, and influence data.",
      done: progress.hasExploredCompany,
      action: () => window.location.href = "/check?tab=company",
      icon: Building2,
    },
  ];

  const completed = steps.filter(s => s.done).length;
  const allDone = completed === steps.length;

  if (allDone) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-border/40 overflow-hidden">
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-[hsl(var(--civic-gold))] transition-all duration-500"
            style={{ width: `${(completed / steps.length) * 100}%` }}
          />
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-foreground font-display">Get Started</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{completed} of {steps.length} steps complete</p>
            </div>
          </div>
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-3.5 rounded-xl transition-colors ${
                  step.done ? "bg-muted/30" : "bg-card hover:bg-accent/30 cursor-pointer border border-border/30"
                }`}
                onClick={!step.done ? step.action : undefined}
              >
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-[hsl(var(--civic-green))] shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {step.label}
                  </p>
                  {!step.done && (
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  )}
                </div>
                {!step.done && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
