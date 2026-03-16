import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Building2, Landmark, Users, ExternalLink, Briefcase, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  companyId?: string;
  companyName: string;
}

interface ConnectionNode {
  name: string;
  type: "company" | "policy_org" | "board" | "pac" | "lobbying" | "nonprofit";
  role?: string;
  icon?: typeof Building2;
}

interface ExecutiveNetwork {
  name: string;
  title: string;
  connections: ConnectionNode[];
  donationTotal: number;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  company: { bg: "bg-primary/10", text: "text-primary", label: "Company" },
  policy_org: { bg: "bg-[hsl(var(--civic-yellow))]/10", text: "text-[hsl(var(--civic-yellow))]", label: "Policy Org" },
  board: { bg: "bg-[hsl(var(--civic-blue))]/10", text: "text-[hsl(var(--civic-blue))]", label: "Board Seat" },
  pac: { bg: "bg-destructive/10", text: "text-destructive", label: "PAC" },
  lobbying: { bg: "bg-[hsl(var(--civic-green))]/10", text: "text-[hsl(var(--civic-green))]", label: "Lobbying" },
  nonprofit: { bg: "bg-muted", text: "text-muted-foreground", label: "Nonprofit" },
};

const TYPE_ICONS: Record<string, typeof Building2> = {
  company: Building2,
  policy_org: Landmark,
  board: Briefcase,
  pac: Landmark,
  lobbying: Globe,
  nonprofit: Users,
};

export function ExecutivePowerNetworkCard({ companyId, companyName }: Props) {
  // Fetch executives
  const { data: executives } = useQuery({
    queryKey: ["epn-execs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("id, name, title, total_donations, departed_at")
        .eq("company_id", companyId!)
        .is("departed_at", null)
        .order("total_donations", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Fetch board interlocks
  const { data: interlocks } = useQuery({
    queryKey: ["epn-interlocks", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("board_interlocks")
        .select("person_name, person_title, interlock_type, company_b_name, nonprofit_org_name, nonprofit_role, political_network, influence_score")
        .eq("company_a_id", companyId!);
      return data || [];
    },
  });

  // Fetch board members with affiliations
  const { data: boardMembers } = useQuery({
    queryKey: ["epn-board", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("board_members")
        .select("name, title, previous_company, committees, is_independent")
        .eq("company_id", companyId!)
        .is("departed_at", null);
      return data || [];
    },
  });

  // Fetch advisory committees
  const { data: advisoryCommittees } = useQuery({
    queryKey: ["epn-advisory", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_advisory_committees")
        .select("person, title_at_company, committee_name, agency")
        .eq("company_id", companyId!);
      return data || [];
    },
  });

  // Build executive networks
  const networks: ExecutiveNetwork[] = [];

  // Map from interlocks
  const interlockMap = new Map<string, ConnectionNode[]>();
  (interlocks || []).forEach((il: any) => {
    const conns = interlockMap.get(il.person_name) || [];
    if (il.company_b_name) {
      conns.push({ name: il.company_b_name, type: "company", role: il.interlock_type });
    }
    if (il.nonprofit_org_name) {
      conns.push({ name: il.nonprofit_org_name, type: il.political_network ? "policy_org" : "nonprofit", role: il.nonprofit_role || undefined });
    }
    interlockMap.set(il.person_name, conns);
  });

  // Advisory committee connections
  const advisoryMap = new Map<string, ConnectionNode[]>();
  (advisoryCommittees || []).forEach((ac: any) => {
    const conns = advisoryMap.get(ac.person) || [];
    conns.push({ name: `${ac.committee_name} (${ac.agency})`, type: "policy_org", role: "Advisory Member", icon: Landmark });
    advisoryMap.set(ac.person, conns);
  });

  // Build networks for executives
  (executives || []).forEach((exec: any) => {
    const connections: ConnectionNode[] = [];

    // From interlocks
    const ilConns = interlockMap.get(exec.name) || [];
    connections.push(...ilConns.map(c => ({ ...c, icon: TYPE_ICONS[c.type] || Building2 })));

    // From advisory
    const advConns = advisoryMap.get(exec.name) || [];
    connections.push(...advConns);

    // If has donations
    if (exec.total_donations > 0) {
      connections.push({ name: "Political Donations", type: "pac", role: `$${exec.total_donations.toLocaleString()}`, icon: Landmark });
    }

    if (connections.length > 0) {
      networks.push({
        name: exec.name,
        title: exec.title,
        connections,
        donationTotal: exec.total_donations || 0,
      });
    }
  });

  // Board members who have previous companies
  (boardMembers || []).forEach((bm: any) => {
    const existing = networks.find(n => n.name === bm.name);
    if (bm.previous_company && !existing) {
      networks.push({
        name: bm.name,
        title: bm.title,
        connections: [{ name: bm.previous_company, type: "company", role: "Previous employer", icon: Building2 }],
        donationTotal: 0,
      });
    } else if (bm.previous_company && existing) {
      existing.connections.push({ name: bm.previous_company, type: "company", role: "Previous employer", icon: Building2 });
    }
  });

  if (networks.length === 0 && !executives?.length) return null;

  const totalConnections = networks.reduce((a, n) => a + n.connections.length, 0);
  const uniqueOrgs = new Set(networks.flatMap(n => n.connections.map(c => c.name)));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Network className="w-4 h-4" />
          Executive Power Network
          {totalConnections > 0 && (
            <Badge variant="outline" className="ml-auto text-[10px]">
              {totalConnections} connections · {uniqueOrgs.size} organizations
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {networks.length === 0 && (
          <p className="text-sm text-muted-foreground">No executive network connections detected yet. This updates as more intelligence is gathered.</p>
        )}

        {networks.slice(0, 6).map((net, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
            {/* Executive header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{net.name}</p>
                <p className="text-xs text-muted-foreground">{net.title}</p>
              </div>
              {net.donationTotal > 0 && (
                <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 bg-destructive/8">
                  ${net.donationTotal.toLocaleString()} donations
                </Badge>
              )}
            </div>

            {/* Connections */}
            <div className="grid gap-1.5">
              {net.connections.map((conn, j) => {
                const typeStyle = TYPE_STYLES[conn.type] || TYPE_STYLES.company;
                const Icon = conn.icon || TYPE_ICONS[conn.type] || Building2;
                return (
                  <div key={j} className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs", typeStyle.bg)}>
                    <Icon className={cn("w-3.5 h-3.5 shrink-0", typeStyle.text)} />
                    <span className="text-foreground font-medium truncate">{conn.name}</span>
                    {conn.role && <span className="text-muted-foreground ml-auto shrink-0 text-[10px]">{conn.role}</span>}
                    <Badge variant="outline" className={cn("text-[8px] px-1 py-0 shrink-0", typeStyle.text)}>{typeStyle.label}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {networks.length > 6 && (
          <p className="text-xs text-muted-foreground text-center">+ {networks.length - 6} more executives with connections</p>
        )}

        <p className="text-[10px] text-muted-foreground">
          Sources: SEC EDGAR · OpenCorporates · Board records · Political donation records · Advisory committee filings · 
          A documented mention does not establish wrongdoing.
        </p>
      </CardContent>
    </Card>
  );
}
