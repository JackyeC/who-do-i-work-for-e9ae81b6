import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, ZoomIn, Minimize2, Filter } from "lucide-react";
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
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 500 });

  // Responsive canvas sizing
  useEffect(() => {
    if (!containerRef.current || !revealed) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      setCanvasSize({ w: Math.max(w, 400), h: Math.min(Math.max(w * 0.55, 350), 600) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [revealed]);

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
  const { allNodes, allEdges } = useMemo(() => {
    const nodeMap = new Map<string, PowerMapNode>();
    const edgeList: PowerMapEdge[] = [];

    nodeMap.set("company", { id: "company", label: companyName, type: "company" });

    (executives || []).forEach((e) => {
      const nid = `exec-${e.id}`;
      nodeMap.set(nid, { id: nid, label: e.name, type: "executive", value: e.total_donations });
      edgeList.push({ source: "company", target: nid, label: "Executive" });
    });

    (boardMembers || []).forEach((b: any) => {
      const nid = `board-${b.id}`;
      nodeMap.set(nid, { id: nid, label: b.name, type: "board_member" });
      edgeList.push({ source: "company", target: nid, label: "Board Member" });
    });

    (tradeAssociations || []).forEach((t: any) => {
      const nid = `trade-${t.id}`;
      nodeMap.set(nid, { id: nid, label: t.association_name, type: "trade_association" });
      edgeList.push({ source: "company", target: nid, label: t.relationship_type || "Member" });
    });

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
          id: sourceId, label: l.source_entity_name,
          type: typeMap[l.source_entity_type] || "company", value: l.amount,
        });
      }
      if (!nodeMap.has(targetId)) {
        nodeMap.set(targetId, {
          id: targetId, label: l.target_entity_name,
          type: typeMap[l.target_entity_type] || "political_committee", value: l.amount,
        });
      }

      edgeList.push({
        source: sourceId, target: targetId,
        label: l.link_type?.replace(/_/g, " ") || "connected", amount: l.amount,
      });
    });

    return { allNodes: Array.from(nodeMap.values()), allEdges: edgeList };
  }, [companyName, executives, boardMembers, tradeAssociations, linkages]);

  // Determine which types are present for filter buttons
  const presentTypes = useMemo(() => {
    const types = new Set<string>();
    allNodes.forEach(n => types.add(n.type));
    return types;
  }, [allNodes]);

  // Filter nodes & edges
  const { nodes, edges } = useMemo(() => {
    if (activeFilters.size === 0) return { nodes: allNodes, edges: allEdges };
    const visibleNodes = allNodes.filter(n => n.type === "company" || activeFilters.has(n.type));
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = allEdges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
    return { nodes: visibleNodes, edges: visibleEdges };
  }, [allNodes, allEdges, activeFilters]);

  // Neighbor set for highlighting
  const neighborIds = useMemo(() => {
    const focus = hoveredNode || selectedNode;
    if (!focus) return null;
    const set = new Set<string>([focus]);
    edges.forEach(e => {
      if (e.source === focus) set.add(e.target);
      if (e.target === focus) set.add(e.source);
    });
    return set;
  }, [hoveredNode, selectedNode, edges]);

  // Force-directed layout
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (nodes.length === 0) return;
    const { w, h } = canvasSize;
    const pos: Record<string, { x: number; y: number }> = {};

    // Place company at center, others in a circle
    pos["company"] = { x: w / 2, y: h / 2 };
    const others = nodes.filter(n => n.id !== "company");
    others.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / others.length;
      const r = Math.min(w, h) * 0.38;
      pos[n.id] = { x: w / 2 + r * Math.cos(angle), y: h / 2 + r * Math.sin(angle) };
    });

    const nodeCount = nodes.length;
    const repulsion = Math.max(2000, nodeCount * 60);
    const idealDist = Math.max(140, Math.min(w, h) / Math.sqrt(nodeCount) * 1.2);
    const iterations = 80;

    for (let iter = 0; iter < iterations; iter++) {
      const cooling = 1 - iter / iterations;

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = pos[nodes[i].id], b = pos[nodes[j].id];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = (repulsion / (dist * dist)) * cooling;
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          if (nodes[i].id !== "company") { a.x -= fx; a.y -= fy; }
          if (nodes[j].id !== "company") { b.x += fx; b.y += fy; }
        }
      }

      // Attraction along edges
      edges.forEach((e) => {
        const a = pos[e.source], b = pos[e.target];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - idealDist) * 0.008 * cooling;
        const fx = (dx / Math.max(dist, 1)) * force;
        const fy = (dy / Math.max(dist, 1)) * force;
        if (e.source !== "company") { a.x += fx; a.y += fy; }
        if (e.target !== "company") { b.x -= fx; b.y -= fy; }
      });

      // Center gravity (gentle)
      nodes.forEach((n) => {
        if (n.id === "company") return;
        const p = pos[n.id];
        p.x += (w / 2 - p.x) * 0.005 * cooling;
        p.y += (h / 2 - p.y) * 0.005 * cooling;
        // Keep in bounds with padding
        p.x = Math.max(60, Math.min(w - 60, p.x));
        p.y = Math.max(50, Math.min(h - 50, p.y));
      });
    }
    setPositions(pos);
  }, [nodes, edges, canvasSize]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || Object.keys(positions).length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = canvasSize;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const hasFocus = !!neighborIds;

    // Edges
    edges.forEach((e) => {
      const a = positions[e.source], b = positions[e.target];
      if (!a || !b) return;
      const highlighted = !hasFocus || (neighborIds!.has(e.source) && neighborIds!.has(e.target));
      ctx.strokeStyle = highlighted ? "rgba(128,128,128,0.3)" : "rgba(128,128,128,0.06)";
      ctx.lineWidth = highlighted ? 1.5 : 0.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    // Nodes
    nodes.forEach((n) => {
      const p = positions[n.id];
      if (!p) return;
      const r = n.id === "company" ? 20 : 9;
      const color = NODE_COLORS[n.type] || "#888";
      const isSelected = selectedNode === n.id;
      const isNeighbor = !hasFocus || neighborIds!.has(n.id);

      ctx.beginPath();
      ctx.arc(p.x, p.y, r + (isSelected ? 3 : 0), 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.globalAlpha = isNeighbor ? (isSelected ? 1 : 0.9) : 0.12;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }

      // Label — only show for focused/neighbor nodes or if graph is small
      if (isNeighbor || nodes.length <= 15) {
        ctx.fillStyle = "#c0c0c0";
        ctx.globalAlpha = isNeighbor ? 0.95 : 0.2;
        ctx.font = n.id === "company" ? "bold 11px sans-serif" : "9px sans-serif";
        ctx.textAlign = "center";
        const maxLen = n.id === "company" ? 24 : 16;
        const label = n.label.length > maxLen ? n.label.slice(0, maxLen - 1) + "…" : n.label;
        ctx.fillText(label, p.x, p.y + r + 13);
      }

      ctx.globalAlpha = 1;
    });
  }, [positions, nodes, edges, selectedNode, neighborIds, canvasSize]);

  // Canvas mouse interaction
  const getNodeAtPos = useCallback((cx: number, cy: number) => {
    for (const n of nodes) {
      const p = positions[n.id];
      if (!p) continue;
      const dist = Math.sqrt((cx - p.x) ** 2 + (cy - p.y) ** 2);
      if (dist < 16) return n.id;
    }
    return null;
  }, [nodes, positions]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = canvasSize.w / rect.width;
    const scaleY = canvasSize.h / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const hit = getNodeAtPos(x, y);
    setSelectedNode(hit && hit !== selectedNode ? hit : null);
  }, [getNodeAtPos, selectedNode, canvasSize]);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = canvasSize.w / rect.width;
    const scaleY = canvasSize.h / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const hit = getNodeAtPos(x, y);
    setHoveredNode(hit);
    if (canvasRef.current) canvasRef.current.style.cursor = hit ? "pointer" : "default";
  }, [getNodeAtPos, canvasSize]);

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setSelectedNode(null);
  };

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
            Interactive influence network · Hover to highlight · Click to inspect
          </p>
          <Button size="lg" onClick={() => setRevealed(true)} className="gap-2">
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
          Hover a node to highlight its neighborhood. Click to inspect connections. Use filters to reduce noise.
        </p>
      </CardHeader>
      <CardContent>
        {/* Filters + Legend */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {Object.entries(NODE_LABELS).map(([type, label]) => {
            if (!presentTypes.has(type) || type === "company") return null;
            const isActive = activeFilters.size === 0 || activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`flex items-center gap-1.5 px-2 py-0.5 border text-xs transition-all ${
                  isActive
                    ? "border-border text-foreground bg-muted/50"
                    : "border-transparent text-muted-foreground/40 opacity-50"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: NODE_COLORS[type] }}
                />
                {label}
              </button>
            );
          })}
          {activeFilters.size > 0 && (
            <button
              onClick={() => setActiveFilters(new Set())}
              className="text-xs text-primary hover:underline ml-1"
            >
              Show all
            </button>
          )}
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="relative border border-border/50 bg-muted/10 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full cursor-default"
            style={{ height: canvasSize.h, display: "block" }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMove}
            onMouseLeave={() => setHoveredNode(null)}
          />

          {/* Selected node info panel */}
          {selectedNodeData && (
            <div className="absolute bottom-3 left-3 right-3 max-w-sm bg-card/95 backdrop-blur-sm border border-border p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: NODE_COLORS[selectedNodeData.type] }}
                  />
                  <span className="text-sm font-semibold text-foreground">{selectedNodeData.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {NODE_LABELS[selectedNodeData.type]}
                  </Badge>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {selectedEdges.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Connections</p>
                  {selectedEdges.slice(0, 5).map((e, i) => {
                    const other = e.source === selectedNode
                      ? nodes.find((n) => n.id === e.target)
                      : nodes.find((n) => n.id === e.source);
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                        <span className="text-muted-foreground">→</span>
                        <span>{other?.label || "Unknown"}</span>
                        <Badge variant="outline" className="text-xs px-1">{e.label}</Badge>
                        {e.amount && e.amount > 0 && (
                          <span className="text-muted-foreground ml-auto">${e.amount.toLocaleString()}</span>
                        )}
                      </div>
                    );
                  })}
                  {selectedEdges.length > 5 && (
                    <p className="text-xs text-muted-foreground">+ {selectedEdges.length - 5} more</p>
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
