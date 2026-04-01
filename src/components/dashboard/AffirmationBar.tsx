import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { startOfWeek } from "date-fns";

export function AffirmationBar() {
  const { user } = useAuth();

  const { data: count = 0 } = useQuery({
    queryKey: ["weekly-applications", user?.id],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
      const { count } = await supabase
        .from("applications_tracker")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", weekStart);
      return count ?? 0;
    },
    enabled: !!user,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="flex items-center gap-3 border border-[hsl(var(--gold-border))]"
        style={{
          borderRadius: 14,
          padding: "16px 20px",
          background:
            "linear-gradient(135deg, rgba(212,168,67,0.06) 0%, rgba(212,168,67,0.02) 100%)",
        }}
      >
        <span className="text-xl shrink-0" role="img" aria-label="strength">
          💪
        </span>
        <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
          <span className="font-bold text-primary">{count} applications this week.</span>{" "}
          Every single one — even the auto-applies — took guts. You're not just looking, you're
          moving. Keep going.
        </p>
      </div>
    </motion.div>
  );
}
