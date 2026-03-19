import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function WelcomeLiveTicker() {
  const { data: tickerText } = useQuery({
    queryKey: ["welcome-live-ticker"],
    queryFn: async () => {
      // Try to get a recent signal
      const { data } = await (supabase as any)
        .from("institutional_alignment_signals")
        .select("institution_name, companies!inner(name)")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data?.[0]) {
        return `${data[0].companies.name} flagged for ${data[0].institution_name} link in the last 24 hours`;
      }

      // Fallback to recent company update
      const { data: companies } = await supabase
        .from("companies")
        .select("name")
        .in("record_status", ["verified", "active"])
        .order("updated_at", { ascending: false })
        .limit(1);

      if (companies?.[0]) {
        return `${companies[0].name} intelligence updated in the last 24 hours`;
      }

      return "Live employer intelligence scanning active";
    },
    staleTime: 120_000,
  });

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <span className="font-mono tracking-wider uppercase">
        LIVE — {tickerText || "Scanning active"}
      </span>
    </div>
  );
}
