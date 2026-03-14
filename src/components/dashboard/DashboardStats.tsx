import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Target, Bell, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function DashboardStats() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      const [apps, alerts, values, growth] = await Promise.all([
        supabase.from("applications_tracker").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        (supabase as any).from("user_alerts").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false),
        (supabase as any).from("user_values_profile").select("id").eq("user_id", user!.id).maybeSingle(),
        (supabase as any).from("employee_growth_tracker").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);
      return {
        applications: apps.count || 0,
        unreadAlerts: alerts.count || 0,
        hasValues: !!values.data,
        growthTracks: growth.count || 0,
      };
    },
    enabled: !!user,
  });

  const cards = [
    {
      label: "Applications",
      value: stats?.applications ?? 0,
      icon: Briefcase,
      color: "text-[hsl(var(--civic-blue))]",
      bg: "bg-[hsl(var(--civic-blue))]/[0.08]",
    },
    {
      label: "Growth Tracks",
      value: stats?.growthTracks ?? 0,
      icon: Target,
      color: "text-[hsl(var(--civic-green))]",
      bg: "bg-[hsl(var(--civic-green))]/[0.08]",
    },
    {
      label: "Unread Alerts",
      value: stats?.unreadAlerts ?? 0,
      icon: Bell,
      color: "text-[hsl(var(--civic-gold))]",
      bg: "bg-[hsl(var(--civic-gold))]/[0.08]",
    },
    {
      label: "Values Profile",
      value: stats?.hasValues ? "Complete" : "Incomplete",
      icon: CheckCircle2,
      color: stats?.hasValues ? "text-[hsl(var(--civic-green))]" : "text-muted-foreground",
      bg: stats?.hasValues ? "bg-[hsl(var(--civic-green))]/[0.08]" : "bg-muted/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground font-display-number">{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
