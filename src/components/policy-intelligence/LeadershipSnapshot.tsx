import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { processExecutives, processBoardMembers } from "@/lib/executive-utils";

interface Props {
  companyId: string;
  companyName: string;
}

export function LeadershipSnapshot({ companyId, companyName }: Props) {
  const { data: rawExecutives = [] } = useQuery({
    queryKey: ["leadership-snapshot", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("name, title, total_donations, departed_at, verification_status")
        .eq("company_id", companyId)
        .order("total_donations", { ascending: false })
        .limit(12);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: rawBoardMembers = [] } = useQuery({
    queryKey: ["leadership-board", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("board_members")
        .select("name, title, is_independent, departed_at, verification_status")
        .eq("company_id", companyId)
        .limit(12);
      return data || [];
    },
    enabled: !!companyId,
  });

  const executives = useMemo(() => processExecutives(rawExecutives, companyName).slice(0, 6), [rawExecutives, companyName]);
  const boardMembers = useMemo(() => processBoardMembers(rawBoardMembers, companyName).slice(0, 6), [rawBoardMembers, companyName]);

  if (executives.length === 0 && boardMembers.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        Who Influences {companyName}
      </h3>

      {executives.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Executives</p>
          <div className="grid gap-1.5">
            {executives.map((exec, i) => (
              <Card key={i} className="border-border/30">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{exec.name}</p>
                    <p className="text-xs text-muted-foreground">{exec.title}</p>
                  </div>
                  {exec.total_donations > 0 && (
                    <Badge variant="outline" className="text-xs font-mono">
                      ${exec.total_donations.toLocaleString()} donated
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {boardMembers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Board Members</p>
          <div className="grid gap-1.5">
            {boardMembers.map((member, i) => (
              <Card key={i} className="border-border/30">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.title}</p>
                  </div>
                  {member.is_independent && (
                    <Badge variant="outline" className="text-xs text-[hsl(var(--civic-green))]">Independent</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-[#3d3a4a]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Leadership data sourced from SEC proxy statements and public disclosures.{" "}
        <Link to="/request-correction" className="underline hover:text-primary transition-colors">
          Found an error? Report it →
        </Link>
      </p>
    </div>
  );
}
