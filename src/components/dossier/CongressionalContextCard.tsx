import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Landmark, ExternalLink, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface CongressionalContextCardProps {
  companyId: string;
  companyName: string;
}

const FEED_LABELS: Record<string, string> = {
  the_hill: "The Hill",
  politico: "Politico",
  house_clerk: "House Clerk",
};

const TAG_COLORS: Record<string, string> = {
  labor: "bg-[hsl(var(--civic-blue))]/15 text-[hsl(var(--civic-blue))]",
  immigration: "bg-amber-500/15 text-amber-400",
  defense: "bg-red-500/15 text-red-400",
  healthcare: "bg-emerald-500/15 text-emerald-400",
  tech: "bg-violet-500/15 text-violet-400",
  finance: "bg-yellow-500/15 text-yellow-400",
  energy: "bg-orange-500/15 text-orange-400",
  education: "bg-sky-500/15 text-sky-400",
};

export function CongressionalContextCard({ companyId, companyName }: CongressionalContextCardProps) {
  // Fetch news directly matched to this company
  const { data: directMatches } = useQuery({
    queryKey: ["congressional-context-direct", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("congressional_news")
        .select("*")
        .contains("matched_company_ids", [companyId])
        .order("published_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch workplace-relevant news as context (if no direct matches)
  const { data: relevantNews } = useQuery({
    queryKey: ["congressional-context-relevant"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("congressional_news")
        .select("*")
        .eq("is_workplace_relevant", true)
        .order("published_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !directMatches?.length,
  });

  const items = directMatches?.length ? directMatches : relevantNews || [];
  if (!items.length) return null;

  const isDirectMatch = !!directMatches?.length;

  return (
    <div className="border border-border/40 bg-card">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30">
        <Landmark className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Capitol Watch</h3>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground ml-auto">
          {isDirectMatch ? `Mentions ${companyName}` : "Workplace Policy"}
        </span>
      </div>

      <div className="divide-y divide-border/20">
        {items.map((item: any) => (
          <div key={item.id} className="px-5 py-3 hover:bg-muted/10 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                >
                  {item.title}
                </a>
                {item.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {FEED_LABELS[item.source_feed] || item.source_feed}
                  </span>
                  {item.published_at && (
                    <span className="text-[10px] text-muted-foreground">
                      · {new Date(item.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {item.relevance_tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className={cn(
                        "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded",
                        TAG_COLORS[tag] || "bg-muted text-muted-foreground"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors shrink-0 mt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {isDirectMatch && (
        <div className="px-5 py-2 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground italic">
            Matched via lobbying records and company name cross-reference
          </p>
        </div>
      )}
    </div>
  );
}
