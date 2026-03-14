import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Eye } from "lucide-react";

interface ScanEvent {
  id: string;
  company_name: string;
  scanned_at: string;
}

export function LiveActivityTicker() {
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [totalToday, setTotalToday] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    // Fetch recent scans
    supabase
      .from("company_scan_events")
      .select("id, company_name, scanned_at")
      .gte("scanned_at", today)
      .order("scanned_at", { ascending: false })
      .limit(50)
      .then(({ data, count }) => {
        if (data) {
          setEvents(data);
          setTotalToday(data.length);
        }
      });

    // Subscribe to realtime
    const channel = supabase
      .channel("live-scans")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "company_scan_events" },
        (payload) => {
          const newEvent = payload.new as ScanEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 50));
          setTotalToday((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Show the most recent 3 distinct companies
  const recentCompanies = [...new Map(events.map((e) => [e.company_name, e])).values()].slice(0, 3);

  if (totalToday === 0 && recentCompanies.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-6 bg-primary/[0.06] border-y border-primary/10">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-green opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-civic-green" />
        </span>
        <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground">Live</span>
      </div>
      <span className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Eye className="w-3 h-3" />
        <span className="font-data font-semibold text-foreground">{totalToday}</span>
        <span>scans today</span>
      </div>
      {recentCompanies.length > 0 && (
        <>
          <span className="w-px h-4 bg-border hidden sm:block" />
          <AnimatePresence mode="popLayout">
            <div className="hidden sm:flex items-center gap-2">
              {recentCompanies.map((e) => (
                <motion.span
                  key={e.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-mono text-xs tracking-wider uppercase text-primary px-2 py-0.5 bg-primary/10 border border-primary/20"
                >
                  {e.company_name}
                </motion.span>
              ))}
            </div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
