import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Trophy, DollarSign, Landmark, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/sampleData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  item: { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.3 } } },
};

interface LeaderboardEntry {
  name: string;
  slug: string;
  value: number;
}

function LeaderboardColumn({ title, icon: Icon, entries, formatFn, iconColor }: {
  title: string;
  icon: React.ElementType;
  entries: LeaderboardEntry[];
  formatFn: (v: number) => string;
  iconColor: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <motion.ol variants={stagger.container} initial="hidden" animate="show" className="space-y-2">
          {entries.map((entry, i) => (
            <motion.li key={entry.slug} variants={stagger.item}>
              <Link
                to={`/dossier/${entry.slug}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? "bg-civic-gold/15 text-civic-gold" : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-foreground truncate flex-1 group-hover:text-primary transition-colors">
                  {entry.name}
                </span>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0">
                  {formatFn(entry.value)}
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ol>
      </CardContent>
    </Card>
  );
}

export function InfluenceLeaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["influence-leaderboard"],
    queryFn: async () => {
      const [pacRes, lobbyRes, contractRes] = await Promise.all([
        supabase.from("companies").select("name, slug, total_pac_spending").order("total_pac_spending", { ascending: false }).limit(5),
        supabase.from("companies").select("name, slug, lobbying_spend").order("lobbying_spend", { ascending: false }).limit(5),
        supabase.from("companies").select("name, slug, government_contracts").order("government_contracts", { ascending: false }).limit(5),
      ]);

      return {
        topPac: (pacRes.data || []).filter(c => c.total_pac_spending > 0).map(c => ({ name: c.name, slug: c.slug, value: c.total_pac_spending })),
        topLobby: (lobbyRes.data || []).filter(c => (c.lobbying_spend || 0) > 0).map(c => ({ name: c.name, slug: c.slug, value: c.lobbying_spend! })),
        topContracts: (contractRes.data || []).filter(c => (c.government_contracts || 0) > 0).map(c => ({ name: c.name, slug: c.slug, value: c.government_contracts! })),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    );
  }

  if (!data || (!data.topPac.length && !data.topLobby.length && !data.topContracts.length)) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2.5 mb-5">
        <Trophy className="w-5 h-5 text-civic-gold" />
        <h2 className="text-lg font-bold text-foreground font-display">Influence Leaderboards</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.topPac.length > 0 && (
          <LeaderboardColumn title="Top PAC Spenders" icon={DollarSign} entries={data.topPac} formatFn={formatCurrency} iconColor="text-civic-gold" />
        )}
        {data.topLobby.length > 0 && (
          <LeaderboardColumn title="Top Lobbying Spenders" icon={Megaphone} entries={data.topLobby} formatFn={formatCurrency} iconColor="text-[hsl(var(--civic-yellow))]" />
        )}
        {data.topContracts.length > 0 && (
          <LeaderboardColumn title="Most Gov. Contracts" icon={Landmark} entries={data.topContracts} formatFn={formatCurrency} iconColor="text-[hsl(var(--civic-green))]" />
        )}
      </div>
    </div>
  );
}
