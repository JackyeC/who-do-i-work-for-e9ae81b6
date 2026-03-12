import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Building2, Landmark, Users, Factory, DollarSign,
  ArrowRight, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw,
  ChevronRight, ExternalLink, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───

interface GraphNode {
  id: string;
  label: string;
  type: "company" | "pac" | "politician" | "legislation" | "industry" | "agency" | "committee";
  x: number;
  y: number;
  vx: number;
  vy: number;
  amount?: number;
  metadata?: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  amount?: number;
  linkType: string;
}

const NODE_COLORS: Record<string, string> = {
  company: "hsl(var(--civic-gold))",
  pac: "hsl(var(--primary))",
  politician: "hsl(var(--civic-blue))",
  legislation: "hsl(var(--civic-green))",
  industry: "hsl(var(--civic-red))",
  agency: "hsl(245, 30%, 50%)",
  committee: "hsl(200, 40%, 50%)",
};

const NODE_ICONS: Record<string, string> = {
  company: "🏢",
  pac: "💰",
  politician: "🏛️",
  legislation: "📜",
  industry: "🏭",
  agency: "⚖️",
  committee: "👥",
};

const TYPE_LABELS: Record<string, string> = {
  company: "Company",
  pac: "PAC",
  politician: "Politician",
  legislation: "Legislation",
  industry: "Industry",
  agency: "Agency",
  committee: "Committee",
};

function mapEntityType(raw: string): GraphNode["type"] {
  const lower = raw.toLowerCase();
  if (lower.includes("pac") || lower.includes("political_action")) return "pac";
  if (lower.includes("politician") || lower.includes("member") || lower.includes("candidate") || lower.includes("congress")) return "politician";
  if (lower.includes("bill") || lower.includes("legislation") || lower.includes("law")) return "legislation";
  if (lower.includes("industry") || lower.includes("sector")) return "industry";
  if (lower.includes("agency") || lower.includes("department") || lower.includes("government")) return "agency";
  if (lower.includes("committee")) return "committee";
  if (lower.includes("company") || lower.includes("corporation") || lower.includes("employer")) return "company";
  return "company";
}

function mapLinkLabel(linkType: string): string {
  const map: Record<string, string> = {
    donation_to_member: "Donated to",
    member_on_committee: "Serves on",
    committee_oversight_of_contract: "Oversees contract",
    lobbying_on_bill: "Lobbied on",
    revolving_door: "Revolving door",
    foundation_grant_to_district: "Grant to district",
    trade_association_lobbying: "Trade lobbying",
    dark_money_channel: "Dark money",
    advisory_committee_appointment: "Advisory role",
    interlocking_directorate: "Board interlock",
    state_lobbying_contract: "State lobby/contract",
    international_influence: "International",
  };
  return map[linkType] || linkType.replace(/_/g, " ");
}

function formatAmount(amount: number | null | undefined): string {
  if (!amount) return "";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

// ─── Simple force simulation ───

function useForceSimulation(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number) {
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const animRef = useRef<number>();
  const nodesRef = useRef<GraphNode[]>([]);

  useEffect(() => {
    if (nodes.length === 0) return;

    // Initialize positions in a circle
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;

    nodesRef.current = nodes.map((n, i) => ({
      ...n,
      x: cx + radius * Math.cos((2 * Math.PI * i) / nodes.length) + (Math.random() - 0.5) * 40,
      y: cy + radius * Math.sin((2 * Math.PI * i) / nodes.length) + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
    }));

    let iteration = 0;
    const maxIterations = 200;
    const alpha = 0.3;

    function tick() {
      if (iteration >= maxIterations) return;
      iteration++;
      const decay = 1 - iteration / maxIterations;
      const ns = nodesRef.current;
      const nodeMap = new Map(ns.map(n => [n.id, n]));

      // Repulsion
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          let dx = ns[j].x - ns[i].x;
          let dy = ns[j].y - ns[i].y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (600 * decay) / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          ns[i].vx -= fx;
          ns[i].vy -= fy;
          ns[j].vx += fx;
          ns[j].vy += fy;
        }
      }

      // Attraction along edges
      for (const edge of edges) {
        const s = nodeMap.get(edge.source);
        const t = nodeMap.get(edge.target);
        if (!s || !t) continue;
        let dx = t.x - s.x;
        let dy = t.y - s.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.01 * decay;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        s.vx += fx;
        s.vy += fy;
        t.vx -= fx;
        t.vy -= fy;
      }

      // Center gravity
      for (const n of ns) {
        n.vx += (cx - n.x) * 0.002 * decay;
        n.vy += (cy - n.y) * 0.002 * decay;
      }

      // Apply velocities
      for (const n of ns) {
        n.vx *= 0.6;
        n.vy *= 0.6;
        n.x += n.vx * alpha;
        n.y += n.vy * alpha;
        // Keep in bounds
        n.x = Math.max(60, Math.min(width - 60, n.x));
        n.y = Math.max(60, Math.min(height - 60, n.y));
      }

      const newPos = new Map<string, { x: number; y: number }>();
      for (const n of ns) {
        newPos.set(n.id, { x: n.x, y: n.y });
      }
      setPositions(new Map(newPos));

      if (iteration < maxIterations) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [nodes, edges, width, height]);

  return positions;
}

// ─── Sample data for demo when no company is selected ───

const SAMPLE_NODES: GraphNode[] = [
  { id: "amazon", label: "Amazon", type: "company", x: 0, y: 0, vx: 0, vy: 0 },
  { id: "amazon-pac", label: "Amazon PAC", type: "pac", x: 0, y: 0, vx: 0, vy: 0, amount: 1_200_000 },
  { id: "sen-cantwell", label: "Sen. Cantwell", type: "politician", x: 0, y: 0, vx: 0, vy: 0 },
  { id: "sen-wyden", label: "Sen. Wyden", type: "politician", x: 0, y: 0, vx: 0, vy: 0 },
  { id: "rep-delbene", label: "Rep. DelBene", type: "politician", x: 0, y: 0, vx: 0, vy: 0 },
  { id: "commerce-committee", label: "Commerce Committee", type: "committee", x: 0, y: 0, vx: 0, vy: 0 },
  { id: "finance-committee", label: "Finance Committee", type: "committee", x: 0, y: 0, vx: 0, vy: 0 },
  { id: "ai-regulation-bill", label: "AI Regulation Act", type: "legislation", x: 0, y: 0, vx: 0, vy: 0 },
  { id: "data-privacy-bill", label: "Data Privacy Act", type: "legislation", x: 0, y: 0, vx: 0, vy: 0 },
  { id: "tech-industry", label: "Technology", type: "industry", x: 0, y: 0, vx: 0, vy: 0 },
  { id: "ecommerce-industry", label: "E-Commerce", type: "industry", x: 0, y: 0, vx: 0, vy: 0 },
  { id: "dod", label: "Dept. of Defense", type: "agency", x: 0, y: 0, vx: 0, vy: 0, amount: 10_000_000 },
];

const SAMPLE_EDGES: GraphEdge[] = [
  { source: "amazon", target: "amazon-pac", label: "Funds", linkType: "donation_to_member", amount: 1_200_000 },
  { source: "amazon-pac", target: "sen-cantwell", label: "Donated to", linkType: "donation_to_member", amount: 45_000 },
  { source: "amazon-pac", target: "sen-wyden", label: "Donated to", linkType: "donation_to_member", amount: 38_000 },
  { source: "amazon-pac", target: "rep-delbene", label: "Donated to", linkType: "donation_to_member", amount: 25_000 },
  { source: "sen-cantwell", target: "commerce-committee", label: "Serves on", linkType: "member_on_committee" },
  { source: "sen-wyden", target: "finance-committee", label: "Serves on", linkType: "member_on_committee" },
  { source: "commerce-committee", target: "ai-regulation-bill", label: "Oversight", linkType: "lobbying_on_bill" },
  { source: "finance-committee", target: "data-privacy-bill", label: "Oversight", linkType: "lobbying_on_bill" },
  { source: "ai-regulation-bill", target: "tech-industry", label: "Affects", linkType: "committee_oversight_of_contract" },
  { source: "data-privacy-bill", target: "ecommerce-industry", label: "Affects", linkType: "committee_oversight_of_contract" },
  { source: "amazon", target: "dod", label: "Contract", linkType: "committee_oversight_of_contract", amount: 10_000_000 },
];

// ─── Main Component ───

export default function FollowTheMoney() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");
  const [companies, setCompanies] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>(SAMPLE_NODES);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>(SAMPLE_EDGES);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const graphWidth = 900;
  const graphHeight = 600;
  const positions = useForceSimulation(graphNodes, graphEdges, graphWidth, graphHeight);

  // Search companies
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setCompanies([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug")
        .ilike("name", `%${query}%`)
        .limit(8);
      setCompanies(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Load entity linkages for a company
  const loadCompanyGraph = useCallback(async (companyId: string, companyName: string) => {
    setLoading(true);
    setSelectedCompanyId(companyId);
    setSelectedCompanyName(companyName);
    setQuery("");
    setCompanies([]);
    setSelectedNode(null);

    try {
      const { data: linkages } = await supabase
        .from("entity_linkages")
        .select("*")
        .eq("company_id", companyId)
        .order("amount", { ascending: false })
        .limit(80);

      if (!linkages || linkages.length === 0) {
        // Show empty state with just the company
        setGraphNodes([{
          id: companyId,
          label: companyName,
          type: "company",
          x: graphWidth / 2,
          y: graphHeight / 2,
          vx: 0, vy: 0,
        }]);
        setGraphEdges([]);
        setLoading(false);
        return;
      }

      const nodeMap = new Map<string, GraphNode>();
      const edges: GraphEdge[] = [];

      // Always add the company as root
      nodeMap.set(companyId, {
        id: companyId, label: companyName, type: "company",
        x: 0, y: 0, vx: 0, vy: 0,
      });

      for (const link of linkages) {
        // Source node
        const srcId = link.source_entity_id || `src-${link.source_entity_name}`;
        if (!nodeMap.has(srcId) && link.source_entity_name !== companyName) {
          nodeMap.set(srcId, {
            id: srcId,
            label: link.source_entity_name,
            type: mapEntityType(link.source_entity_type),
            x: 0, y: 0, vx: 0, vy: 0,
            amount: link.amount || undefined,
          });
        }

        // Target node
        const tgtId = link.target_entity_id || `tgt-${link.target_entity_name}`;
        if (!nodeMap.has(tgtId)) {
          nodeMap.set(tgtId, {
            id: tgtId,
            label: link.target_entity_name,
            type: mapEntityType(link.target_entity_type),
            x: 0, y: 0, vx: 0, vy: 0,
            amount: link.amount || undefined,
          });
        }

        // Edge
        const sourceId = link.source_entity_name === companyName ? companyId : srcId;
        edges.push({
          source: sourceId,
          target: tgtId,
          label: mapLinkLabel(link.link_type),
          amount: link.amount || undefined,
          linkType: link.link_type,
        });
      }

      setGraphNodes(Array.from(nodeMap.values()));
      setGraphEdges(edges);
    } catch (err) {
      console.error("Failed to load graph:", err);
    }

    setLoading(false);
  }, []);

  // Reset to demo
  const resetGraph = () => {
    setSelectedCompanyId(null);
    setSelectedCompanyName("");
    setGraphNodes(SAMPLE_NODES);
    setGraphEdges(SAMPLE_EDGES);
    setSelectedNode(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Get connected edges for a node
  const getConnectedEdges = (nodeId: string) =>
    graphEdges.filter(e => e.source === nodeId || e.target === nodeId);

  const getConnectedNodeIds = (nodeId: string) => {
    const ids = new Set<string>();
    ids.add(nodeId);
    for (const e of graphEdges) {
      if (e.source === nodeId) ids.add(e.target);
      if (e.target === nodeId) ids.add(e.source);
    }
    return ids;
  };

  const highlightedIds = hoveredNode ? getConnectedNodeIds(hoveredNode) : null;

  // Node detail panel edges
  const selectedEdges = selectedNode ? getConnectedEdges(selectedNode.id) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <section className="border-b border-border/30 bg-gradient-to-b from-primary/[0.03] to-transparent">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Follow the Money</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight mb-1">
                Influence Network Map
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Trace how money flows from companies through PACs to politicians, committees, legislation, and industries.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a company to map…"
                className="pl-10"
              />
              {companies.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                  {companies.map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2"
                      onClick={() => loadCompanyGraph(c.id, c.name)}
                    >
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Graph */}
        <div className="flex-1 relative bg-muted/20 border-b lg:border-b-0 lg:border-r border-border/30 overflow-hidden">
          {/* Graph controls */}
          <div className="absolute top-3 right-3 z-10 flex gap-1.5">
            <Button variant="outline" size="icon" className="w-8 h-8 bg-card/90 backdrop-blur-sm" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="w-8 h-8 bg-card/90 backdrop-blur-sm" onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="w-8 h-8 bg-card/90 backdrop-blur-sm" onClick={resetGraph}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Active company badge */}
          {selectedCompanyName && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-card/90 backdrop-blur-sm text-foreground border border-border/40 gap-1.5 px-3 py-1.5">
                <Building2 className="w-3 h-3" />
                {selectedCompanyName}
                <button onClick={resetGraph} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded-full border border-border/30">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
                {label}
              </div>
            ))}
          </div>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20">
              <div className="text-sm text-muted-foreground animate-pulse">Loading influence map…</div>
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`${-pan.x} ${-pan.y} ${graphWidth} ${graphHeight}`}
            className="w-full h-[500px] lg:h-full"
            style={{ minHeight: 400 }}
          >
            <g transform={`scale(${zoom})`}>
              {/* Edges */}
              {graphEdges.map((edge, i) => {
                const sPos = positions.get(edge.source);
                const tPos = positions.get(edge.target);
                if (!sPos || !tPos) return null;

                const dimmed = highlightedIds && (!highlightedIds.has(edge.source) || !highlightedIds.has(edge.target));
                const midX = (sPos.x + tPos.x) / 2;
                const midY = (sPos.y + tPos.y) / 2;

                return (
                  <g key={`edge-${i}`} opacity={dimmed ? 0.12 : 0.6}>
                    <line
                      x1={sPos.x} y1={sPos.y}
                      x2={tPos.x} y2={tPos.y}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={edge.amount ? Math.min(Math.max(Math.log10(edge.amount) - 2, 1), 4) : 1}
                      strokeDasharray={edge.linkType === "dark_money_channel" ? "4,4" : undefined}
                    />
                    {edge.amount && !dimmed && (
                      <text x={midX} y={midY - 6} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" fontWeight="500">
                        {formatAmount(edge.amount)}
                      </text>
                    )}
                    {!dimmed && (
                      <text x={midX} y={midY + 8} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))" opacity="0.7">
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {graphNodes.map(node => {
                const pos = positions.get(node.id);
                if (!pos) return null;

                const dimmed = highlightedIds && !highlightedIds.has(node.id);
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode === node.id;
                const r = isSelected || isHovered ? 28 : 22;
                const color = NODE_COLORS[node.type] || "hsl(var(--muted-foreground))";

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    opacity={dimmed ? 0.2 : 1}
                    cursor="pointer"
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Glow ring for selected */}
                    {isSelected && (
                      <circle r={r + 6} fill="none" stroke={color} strokeWidth="2" opacity="0.3">
                        <animate attributeName="r" values={`${r + 4};${r + 8};${r + 4}`} dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    <circle
                      r={r}
                      fill={color}
                      opacity={isHovered || isSelected ? 1 : 0.85}
                      stroke={isSelected ? "hsl(var(--foreground))" : "none"}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                    <text textAnchor="middle" dy="0.35em" fontSize="14" fill="white">
                      {NODE_ICONS[node.type] || "●"}
                    </text>

                    {/* Label below */}
                    <text textAnchor="middle" y={r + 14} fontSize="10" fontWeight="600" fill="hsl(var(--foreground))">
                      {node.label.length > 18 ? node.label.slice(0, 16) + "…" : node.label}
                    </text>
                    {node.amount && !dimmed && (
                      <text textAnchor="middle" y={r + 26} fontSize="9" fill="hsl(var(--muted-foreground))">
                        {formatAmount(node.amount)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Detail Panel */}
        <div className="w-full lg:w-80 bg-card border-l border-border/30 overflow-y-auto">
          {selectedNode ? (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: NODE_COLORS[selectedNode.type] + "22" }}>
                    {NODE_ICONS[selectedNode.type]}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground font-display">{selectedNode.label}</h3>
                    <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[selectedNode.type]}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setSelectedNode(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {selectedNode.amount && (
                <div className="mb-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Amount</p>
                  <p className="text-lg font-bold font-display text-foreground">{formatAmount(selectedNode.amount)}</p>
                </div>
              )}

              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Connections ({selectedEdges.length})
              </h4>

              <div className="space-y-2">
                {selectedEdges.map((edge, i) => {
                  const isSource = edge.source === selectedNode.id;
                  const otherNodeId = isSource ? edge.target : edge.source;
                  const otherNode = graphNodes.find(n => n.id === otherNodeId);
                  if (!otherNode) return null;

                  return (
                    <button
                      key={i}
                      className="w-full text-left p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                      onClick={() => {
                        setSelectedNode(otherNode);
                        setHoveredNode(null);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: NODE_COLORS[otherNode.type] }} />
                        <span className="text-sm font-medium text-foreground">{otherNode.label}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{edge.label}</span>
                        {edge.amount && (
                          <Badge variant="secondary" className="text-[10px]">{formatAmount(edge.amount)}</Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action: navigate to company profile */}
              {selectedNode.type === "company" && selectedCompanyId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 gap-1.5"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(selectedNode.label)}`)}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Company Profile
                </Button>
              )}
            </div>
          ) : (
            <div className="p-5">
              <h3 className="text-sm font-semibold text-foreground font-display mb-2">How to use</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Search for a company above to map its influence network. Click any node to explore its connections.
              </p>

              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What you'll see</h4>
                {[
                  { icon: "🏢", label: "Company", desc: "The employer being investigated" },
                  { icon: "💰", label: "PAC", desc: "Political action committee funded by the company" },
                  { icon: "🏛️", label: "Politician", desc: "Candidates who received donations" },
                  { icon: "👥", label: "Committee", desc: "Congressional committees with oversight" },
                  { icon: "📜", label: "Legislation", desc: "Bills lobbied on or affected by spending" },
                  { icon: "🏭", label: "Industry", desc: "Sectors affected by policy outcomes" },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-primary/[0.06] border border-primary/10">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Demo mode:</strong> Showing a sample Amazon influence network.
                  Search a tracked company to see real data from FEC, lobbying, and contract records.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
