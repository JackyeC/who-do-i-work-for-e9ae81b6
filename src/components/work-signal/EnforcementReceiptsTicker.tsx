import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReceiptItem {
  id: string;
  company_name: string;
  headline: string;
  source_name: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  "OpenSecrets / FEC": "OpenSecrets",
  "OSHA": "OSHA",
  "NLRB": "NLRB",
  "DOJ Press Release": "DOJ",
  "SEC": "SEC",
  "Reuters": "Reuters",
  "Reuters / Court Filing": "Reuters",
  "FTC": "FTC",
  "Bloomberg": "Bloomberg",
  "AP News": "AP News",
  "Washington Post": "Washington Post",
  "New York Times": "NYT",
  "Violation Tracker": "Violation Tracker",
  "SEC DEF 14A": "SEC",
  "Senate LDA": "OpenSecrets",
};

export function EnforcementReceiptsTicker() {
  const navigate = useNavigate();

  const { data: receipts } = useQuery({
    queryKey: ["enforcement-receipts-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accountability_signals")
        .select("id, company_id, headline, source_name, companies!inner(name, slug)")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        company_name: r.companies?.name || "Unknown",
        company_slug: r.companies?.slug || "",
        headline: r.headline,
        source_name: r.source_name,
      }));
    },
    staleTime: 300_000,
  });

  const items: ReceiptItem[] = receipts && receipts.length > 0
    ? receipts
    : [];

  if (items.length === 0) return null;

  const totalChars = items.reduce(
    (sum, i) => sum + (i.company_name?.length || 0) + (i.headline?.length || 0) + 30,
    0
  );
  const duration = Math.max(80, Math.min(totalChars * 0.45, 300));

  const renderItem = (item: any, key: string) => {
    const sourceLabel = SOURCE_LABELS[item.source_name || ""] || item.source_name || "Source";
    
    return (
      <button
        key={key}
        type="button"
        onClick={() => item.company_slug && navigate(`/dossier/${item.company_slug}`)}
        className="px-5 inline-flex items-center gap-2 bg-transparent border-none p-0 font-inherit text-left cursor-pointer hover:text-primary transition-colors shrink-0"
      >
        <span className="font-mono text-[10px] tracking-wider uppercase text-primary/70 shrink-0">
          ({sourceLabel})
        </span>
        <span className="font-semibold text-[11px] text-foreground/90 shrink-0">
          {item.company_name}
        </span>
        <span className="text-foreground/40 text-[11px]">—</span>
        <span className="text-[11px] text-foreground/70">
          {item.headline.length > 80 ? item.headline.slice(0, 80) + "…" : item.headline}
        </span>
      </button>
    );
  };

  return (
    <div
      className="bg-card overflow-hidden whitespace-nowrap h-[36px] flex items-center border-b border-border/30"
    >
      <div
        className="flex items-center gap-2 px-3 shrink-0 h-full"
        style={{ borderRight: "1px solid hsl(var(--border) / 0.3)" }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-green opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-civic-green" />
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-foreground/60">Live</span>
      </div>

      <div
        className="ticker-track"
        style={{ ["--ticker-duration" as string]: `${duration}s` }}
      >
        {items.map((t, i) => renderItem(t, `item-${i}`))}
        {items.map((t, i) => renderItem(t, `dup-${i}`))}
      </div>
    </div>
  );
}
