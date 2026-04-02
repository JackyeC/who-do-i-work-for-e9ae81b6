import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star, Shield, MessageSquare } from "lucide-react";

interface CommunitySignal {
  id: string;
  source: string;
  signal_type: string;
  label: string;
  value: string | null;
  numeric_value: number | null;
  detail: string | null;
  source_url: string | null;
  badge_label: string;
}

const SOURCE_ICONS: Record<string, typeof Star> = {
  Indeed: Star,
  "Better Business Bureau": Shield,
  Glassdoor: Star,
};

const SCORE_LEVEL = (score: number | null, max = 5) => {
  if (score == null) return "neutral" as const;
  const pct = score / max;
  if (pct >= 0.6) return "positive" as const;
  if (pct >= 0.4) return "neutral" as const;
  return "caution" as const;
};

const LEVEL_STYLES = {
  positive: "border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/5",
  caution: "border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5",
  neutral: "border-border/40 bg-muted/10",
};

export function CommunitySignals({ companyId }: { companyId: string }) {
  const { data: signals = [] } = useQuery({
    queryKey: ["community-signals", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_community_signals")
        .select("*")
        .eq("company_id", companyId)
        .order("source");
      if (error) throw error;
      return (data ?? []) as CommunitySignal[];
    },
  });

  if (signals.length === 0) return null;

  // Group by source
  const grouped = signals.reduce<Record<string, CommunitySignal[]>>(
    (acc, s) => {
      (acc[s.source] ??= []).push(s);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([source, items]) => {
        const Icon = SOURCE_ICONS[source] ?? MessageSquare;
        return (
          <div key={source}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {source}
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono">
                Community Data
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((s) => {
                const level = SCORE_LEVEL(s.numeric_value);
                return (
                  <Card
                    key={s.id}
                    className={`border ${LEVEL_STYLES[level]}`}
                  >
                    <CardContent className="p-4">
                      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                        {s.label}
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {s.value ?? "—"}
                      </p>
                      {s.detail && (
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {s.detail}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
                          {s.badge_label}
                        </Badge>
                        {s.source_url && (
                          <a
                            href={s.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-[10px]"
                          >
                            View source
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
