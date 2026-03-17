import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, AlertTriangle, Building2, Search, Heart, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";

const CHECKPOINT_KEY = "last_checkpoint_seen";

export function DecisionCheckpoint() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["checkpoint-alerts", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_alerts")
        .select("id, change_description, company_name, company_id, signal_category, date_detected, created_at, companies:company_id(slug)")
        .eq("user_id", user!.id)
        .eq("is_read", false)
        .is("dismissed_at", null)
        .order("date_detected", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user && !dismissed,
  });

  // Check if we should skip based on localStorage
  const lastSeen = localStorage.getItem(CHECKPOINT_KEY);
  const shouldShow = !dismissed && !isLoading && alerts && alerts.length > 0 && (() => {
    if (!lastSeen) return true;
    const lastSeenTime = parseInt(lastSeen, 10);
    // Show if any alert is newer than last checkpoint
    return alerts.some((a: any) => new Date(a.date_detected || a.created_at).getTime() > lastSeenTime);
  })();

  const handleDismiss = async () => {
    if (alerts && alerts.length > 0) {
      const ids = alerts.map((a: any) => a.id);
      await supabase
        .from("user_alerts")
        .update({ is_read: true })
        .in("id", ids);
      queryClient.invalidateQueries({ queryKey: ["unread-alerts-count"] });
      queryClient.invalidateQueries({ queryKey: ["user-alerts"] });
    }
    localStorage.setItem(CHECKPOINT_KEY, Date.now().toString());
    setDismissed(true);
  };

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-bold text-foreground font-display">
                Before you move forward, check this.
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Here's what changed since your last visit — and what might impact your decision.
            </p>
          </div>

          {/* Signal cards */}
          <div className="space-y-2 mb-6">
            {alerts.map((alert: any, i: number) => {
              const slug = alert.companies?.slug;
              const companyLink = slug ? `/company/${slug}` : "#";

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <Link
                    to={companyLink}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {alert.company_name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {alert.signal_category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {alert.change_description}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all mt-1 shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={handleDismiss}
            >
              Continue your evaluation
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>

            <div className="flex items-center justify-center gap-4">
              <Link
                to="/check"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3 h-3" />
                Check a company
              </Link>
              <Link
                to="/dashboard?tab=values"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <Heart className="w-3 h-3" />
                Define what you need
              </Link>
              <Link
                to="/dashboard?tab=tracked"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <Bookmark className="w-3 h-3" />
                Saved companies
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
