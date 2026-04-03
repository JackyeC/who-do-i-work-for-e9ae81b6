import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentScan {
  source_family: string;
  company_name: string;
  last_run_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  sec: "SEC filing processed",
  fec: "FEC records scanned",
  osha: "OSHA inspection reviewed",
  warn: "WARN notice checked",
  news: "News intel refreshed",
  careers: "Careers page analyzed",
  lobbying: "Lobbying disclosure pulled",
};

export function LiveDataFeed() {
  const { data: recentPulls } = useQuery({
    queryKey: ["live-data-feed"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_ingestion_queue")
        .select("source_family, next_run_at, company_id")
        .eq("status", "completed")
        .order("next_run_at", { ascending: false })
        .limit(8);

      if (!data?.length) return [];

      // Fetch company names
      const companyIds = [...new Set(data.map(d => d.company_id))];
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);

      const nameMap = new Map(companies?.map(c => [c.id, c.name]) || []);

      return data.map(d => ({
        source_family: d.source_family,
        company_name: nameMap.get(d.company_id) || "Unknown",
        last_run_at: d.next_run_at,
      }));
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const items = recentPulls?.length
    ? recentPulls
    : [{ source_family: "sec", company_name: "...", last_run_at: new Date().toISOString() }];

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0">
        <Radio className="w-3 h-3 text-primary animate-pulse" />
        <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-primary">LIVE DATA</span>
      </div>
      <div className="overflow-hidden">
        <div className="flex gap-6 animate-scroll-left">
          {items.map((item, i) => (
            <span key={i} className="font-mono text-[10px] text-muted-foreground/60 whitespace-nowrap flex items-center gap-1.5">
              <Database className="w-2.5 h-2.5 text-primary/40" />
              {SOURCE_LABELS[item.source_family] || item.source_family} for {item.company_name}
              {item.last_run_at && (
                <span className="text-muted-foreground/30">
                  {formatDistanceToNow(new Date(item.last_run_at), { addSuffix: true })}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
