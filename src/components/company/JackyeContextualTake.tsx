import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquareWarning, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface JackyeContextualTakeProps {
  companyId: string;
  companyName: string;
  /** Which section this take is for */
  section: "insider_brief" | "structured_signals" | "accountability";
  /** Signal summaries to pass as context to the AI */
  signalSummaries?: string[];
  className?: string;
}

export function JackyeContextualTake({
  companyId,
  companyName,
  section,
  signalSummaries,
  className,
}: JackyeContextualTakeProps) {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["jackye-take", companyId, section],
    queryFn: async () => {
      const { data: fnData, error } = await supabase.functions.invoke(
        "jackye-contextual-take",
        {
          body: {
            companyId,
            companyName,
            section,
            signals: signalSummaries?.slice(0, 5) || [],
          },
        }
      );
      if (error) throw error;
      return fnData as { take: string; cached: boolean };
    },
    enabled: !!companyId && !!companyName,
    staleTime: 30 * 60 * 1000, // 30 min client-side
    retry: 1,
  });

  if (!data?.take && !isLoading) return null;

  return (
    <div className={cn("mt-3", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex items-center gap-2 text-left w-full"
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:border-primary/20 transition-colors">
          {isLoading ? (
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          ) : (
            <MessageSquareWarning className="w-3 h-3 text-primary" />
          )}
          <span className="text-xs font-semibold text-primary">
            {isLoading ? "Jackye is reading this..." : "Jackye's Take"}
          </span>
          {!isLoading && (
            <ChevronDown
              className={cn(
                "w-3 h-3 text-primary/60 transition-transform",
                expanded && "rotate-180"
              )}
            />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && data?.take && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-2 px-3 py-2.5 rounded-md bg-primary/[0.03] border border-primary/10">
              <p className="text-sm text-foreground/85 leading-relaxed italic">
                {data.take}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
