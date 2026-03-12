import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, Maximize2, Minimize2, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PowerMapNode {
  id: string;
  label: string;
  type: "executive" | "board_member" | "company" | "trade_association" | "lobbying_org" | "political_committee" | "government_role" | "pac";
  value?: number;
}

interface PowerMapEdge {
  source: string;
  target: string;
  label: string;
  amount?: number;
}

const NODE_COLORS: Record<string, string> = {
  executive: "hsl(var(--primary))",
  board_member: "hsl(var(--civic-blue, 210 70% 50%))",
  company: "hsl(var(--foreground))",
  trade_association: "hsl(var(--civic-yellow))",
  lobbying_org: "hsl(var(--civic-yellow))",
  political_committee: "hsl(var(--destructive))",
  government_role: "hsl(var(--civic-green))",
  pac: "hsl(var(--destructive))",
};

const NODE_LABELS: Record<string, string> = {
  executive: "Executive",
  board_member: "Board",
  company: "Company",
  trade_association: "Trade Assoc.",
  lobbying_org: "Lobbying",
  political_committee: "Political",
  government_role: "Government",
  pac: "PAC",
};

interface PowerMapProps {
  companyId?: string;
  companyName: string;
  executives?: { id: string; name: string; title: string; total_donations: number }[];
}

export function PowerMap({ companyId, companyName, executives }: PowerMapProps) {
  const [revealed, setRevealed] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch entity linkages for the power map
  const { data: linkages } = useQuery({
    queryKey: ["power-map-linkages", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("entity_linkages")
        .select("source_entity_name, source_entity_type, target_entity_name, target_entity_type, link_type, amount, description")
        .eq("company_id", companyId!)
        .limit(200);
      return data || [];
    },
    enabled: !!companyId && revealed,
  });

  const { data: boardMembers } = useQuery({
    queryKey: ["power-map-board", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("board_members")
        .select("id, name, title, committees")
        .eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId && revealed,
  });

  const { data: tradeAssociations } = useQuery({
    queryKey: ["power-map-trade", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_trade_associations")
        .select("id, association_name, relationship_type")
        .eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId && revealed,
  });

  // Build graph data
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, PowerMapNode>();
    const edgeList: PowerMapEdge[] = [];

    // Company node
    nodeMap.set("company", { id: "company", label: companyName, type: "company" });

    // Executives
    (executives || []).forEach((e) => {
      const nid = `exec-${e.id}`;
      nodeMap.set(nid, { id: nid, label: e.name, type: "executive", value: e.total_donations });
      edgeList.push({ source: "company", target: nid, label: "Executive" });
    });

    // Board members
    (boardMembers || []).forEach((b: any) => {
      const nid = `board-${b.id}`;
      nodeMap.set(nid, { id: nid, label: b.name, type: "board_member" });
      edgeList.push({ source: "company", target: nid, label: "Board Member" });
    });

    // Trade associations
    (tradeAssociations || []).forEach((t: any) => {
      const nid = `trade-${t.id}`;
      nodeMap.set(nid, { id: nid, label: t.association_name, type: "trade_association" });
      edgeList.push({ source: "company", target: nid, label: t.relationship_type || "Member" });
    });

    // Entity linkages
    (linkages || []).forEach((l: any) => {
      const sourceId = `entity-${l.source_entity_name}`;
      const targetId = `entity-${l.target_entity_name}`;
      const typeMap: Record<string, PowerMapNode["type"]> = {
        politician: "political_committee",
        pac: "pac",
        committee: "political_committee",
        trade_association: "trade_association",
        lobbyist: "lobbying_org",
        government_agency: "government_role",
      };

      if (!nodeMap.has(sourceId)) {
        nodeMap.set(sourceId, {
          id: sourceId,
          label: l.source_entity_name,
          type: typeMap[l.source_entity_type] || "company",
          value: l.amount,
        });
      }
      if (!nodeMap.has(targetId)) {
        nodeMap.set(targetId, {
          id: targetId,
          label: l.target_entity_name,
          type: typeMap[l.target_entity_type] || "political_committee",
          value: l.amount,
        });
      }

      edgeList.push({
        source: sourceId,
        target: targetId,
        label: l.link_type?.replace(/_/g, " ") || "connected",
        amount: l.amount,
      });
    });

    return { nodes: Array.from(nodeMap.values()), edges: edgeList };
  }, [companyName, executives, boardMembers, tradeAssociations, linkages]);

  // Simple force-directed layout rendered on canvas
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (nodes.length === 0) return;
    const w = 600, h = 400;
    const pos: Record<string, { x: number; y: number }> = {};
    // Initialize positions in a circle
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const r = Math.min(w, h) * 0.35;
      pos[n.id] = { x: w / 2 + r * Math.cos(angle), y: h / 2 + r * Math.sin(angle) };
    });

    // Simple force simulation (few iterations)
    for (let iter = 0; iter < 50; iter++) {
      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = pos[nodes[i].id], b = pos[nodes[j].id];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 800 / (dist * dist);
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          a.x -= fx; a.y -= fy;
          b.x += fx; b.y += fy;
        }
      }
      // Attraction along edges
      edges.forEach((e) => {
        const a = pos[e.source], b = pos[e.target];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - 100) * 0.01;
        const fx = (dx / Math.max(dist, 1)) * force;
        const fy = (dy / Math.max(dist, 1)) * force;
        a.x += fx; a.y += fy;
        b.x -= fx; b.y -= fy;
      });
      // Center gravity
      nodes.forEach((n) => {
        const p = pos[n.id];
        p.x += (w / 2 - p.x) * 0.01;
        p.y += (h / 2 - p.y) * 0.01;
        // Bounds
        p.x = Math.max(40, Math.min(w - 40, p.x));
        p.y = Math.max(40, Math.min(h - 40, p.y));
      });
    }
    setPositions(pos);
  }, [nodes, edges]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || Object.keys(positions).length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 600 * dpr;
    canvas.height = 400 * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, 600, 400);

    // Edges
    ctx.strokeStyle = "rgba(128,128,128,0.2)";
    ctx.lineWidth = 1;
    edges.forEach((e) => {
      const a = positions[e.source], b = positions[e.target];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    // Nodes
    nodes.forEach((n) => {
      const p = positions[n.id];
      if (!p) return;
      const r = n.id === "company" ? 18 : 10;
      const color = NODE_COLORS[n.type] || "#888";
      const isSelected = selectedNode === n.id;

      ctx.beginPath();
      ctx.arc(p.x, p.y, r + (isSelected ? 3 : 0), 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.globalAlpha = isSelected ? 1 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;

      if (isSelected) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground') ? '#e0e0e0' : '#333';
      ctx.font = n.id === "company" ? "bold 10px sans-serif" : "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(n.label.length > 18 ? n.label.slice(0, 16) + "…" : n.label, p.x, p.y + r + 12);
    });
  }, [positions, nodes, edges, selectedNode]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const n of nodes) {
      const p = positions[n.id];
      if (!p) continue;
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
      if (dist < 15) {
        setSelectedNode(selectedNode === n.id ? null : n.id);
        return;
      }
    }
    setSelectedNode(null);
  }, [nodes, positions, selectedNode]);

  const selectedNodeData = selectedNode ? nodes.find((n) => n.id === selectedNode) : null;
  const selectedEdges = selectedNode
    ? edges.filter((e) => e.source === selectedNode || e.target === selectedNode)
    : [];

  if (!revealed) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-8 text-center">
          <Network className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
          <h3 className="text-xl font-bold text-foreground mb-2">Power Map</h3>
          <p className="text-sm text-muted-foreground mb-1 max-w-md mx-auto">
            See how executives, board members, trade associations, lobbying organizations, and political committees connect.
          </p>
          <p className="text-xs text-muted-foreground/70 mb-6">
            Interactive influence network • Click any node to explore connections
          </p>
          <Button
            size="lg"
            onClick={() => setRevealed(true)}
            className="gap-2"
          >
            <ZoomIn className="w-4 h-4" />
            Reveal the Power Map
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Network className="w-5 h-5 text-primary" />
            Power Map
          </div>
          <Badge variant="secondary" className="text-xs">
            {nodes.length} nodes · {edges.length} connections
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Click any node to explore its connections. This map shows verified relationships from public records.
        </p>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          {Object.entries(NODE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: NODE_COLORS[type] }}
              />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="relative rounded-lg border border-border/50 bg-muted/20 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full cursor-pointer"
            style={{ height: 400 }}
            onClick={handleCanvasClick}
          />

          {/* Selected node info panel */}
          {selectedNodeData && (
            <div className="absolute bottom-3 left-3 right-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: NODE_COLORS[selectedNodeData.type] }}
                  />
                  <span className="text-sm font-semibold text-foreground">{selectedNodeData.label}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {NODE_LABELS[selectedNodeData.type]}
                  </Badge>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {selectedEdges.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Connections</p>
                  {selectedEdges.slice(0, 5).map((e, i) => {
                    const other = e.source === selectedNode
                      ? nodes.find((n) => n.id === e.target)
                      : nodes.find((n) => n.id === e.source);
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                        <span className="text-muted-foreground">→</span>
                        <span>{other?.label || "Unknown"}</span>
                        <Badge variant="outline" className="text-[9px] px-1">{e.label}</Badge>
                        {e.amount && e.amount > 0 && (
                          <span className="text-muted-foreground ml-auto">${e.amount.toLocaleString()}</span>
                        )}
                      </div>
                    );
                  })}
                  {selectedEdges.length > 5 && (
                    <p className="text-[10px] text-muted-foreground">+ {selectedEdges.length - 5} more connections</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
