import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface Props {
  companyId: string;
  companyName: string;
}

export function LeadershipSnapshot({ companyId, companyName }: Props) {
  const { data: executives = [] } = useQuery({
    queryKey: ["leadership-snapshot", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("name, title, total_donations")
        .eq("company_id", companyId)
        .order("total_donations", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: boardMembers = [] } = useQuery({
    queryKey: ["leadership-board", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("board_members")
        .select("name, title, is_independent")
        .eq("company_id", companyId)
        .is("departed_at", null)
        .limit(6);
      return data || [];
    },
    enabled: !!companyId,
  });

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
    </div>
  );
}
