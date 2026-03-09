import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  DollarSign, FileText, Landmark, Building2, Activity,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const SIGNAL_ICONS: Record<string, React.ElementType> = {
  pac: DollarSign,
  lobbying: FileText,
  contract: Landmark,
  executive: Building2,
  enforcement: AlertTriangle,
};

const SIGNAL_COLORS: Record<string, string> = {
  pac: "text-civic-gold",
  lobbying: "text-primary",
  contract: "text-[hsl(var(--civic-green))]",
  executive: "text-primary",
  enforcement: "text-destructive",
};

function classifySignal(cat: string): string {
  const lower = cat.toLowerCase();
  if (lower.includes("pac") || lower.includes("donation") || lower.includes("campaign")) return "pac";
  if (lower.includes("lobby")) return "lobbying";
  if (lower.includes("contract") || lower.includes("grant") || lower.includes("spending")) return "contract";
  if (lower.includes("enforce") || lower.includes("osha") || lower.includes("violation")) return "enforcement";
  return "executive";
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05 },
  }),
};

export function RecentSignalsFeed() {
  const { data: signals, isLoading } = useQuery({
    queryKey: ["recent-signals-feed"],
    queryFn: async () => {
      // Pull recent scan signals with company info
      const { data } = await supabase
        .from("company_signal_scans")
        .select("id, company_id, signal_category, signal_type, signal_value, confidence_level, scan_timestamp, source_url")
        .order("scan_timestamp", { ascending: false })
        .limit(8);

      if (!data?.length) return [];

      // Get company names
      const companyIds = [...new Set(data.map((s) => s.company_id))];
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, slug")
        .in("id", companyIds);

      const companyMap = new Map((companies || []).map((c) => [c.id, c]));

      return data.map((s) => ({
        ...s,
        company: companyMap.get(s.company_id),
        kind: classifySignal(s.signal_category),
      }));
    },
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading || !signals?.length) return null;

  return (
    <section className="section-padding bg-secondary/40">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--civic-green))] animate-pulse" />
                <h2 className="text-xl font-bold text-foreground font-display">
                  Recent Signals
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Latest signals detected from public records
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {signals.map((signal, i) => {
              const Icon = SIGNAL_ICONS[signal.kind] || Activity;
              const color = SIGNAL_COLORS[signal.kind] || "text-muted-foreground";

              return (
                <motion.div
                  key={signal.id}
                  variants={fadeUp}
                  custom={i + 1}
                  className="bg-card rounded-xl border border-border/40 p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {signal.company ? (
                          <Link
                            to={`/company/${signal.company.slug}`}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
                          >
                            {signal.company.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-foreground truncate">
                            Unknown Entity
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0 capitalize"
                        >
                          {signal.confidence_level}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {signal.signal_type}
                        {signal.signal_value && ` — ${signal.signal_value}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(signal.scan_timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {signal.company && (
                      <Link
                        to={`/company/${signal.company.slug}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
