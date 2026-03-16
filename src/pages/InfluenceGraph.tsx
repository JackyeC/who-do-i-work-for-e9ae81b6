import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Filter, AlertTriangle, Eye, EyeOff, Loader2, X, ExternalLink, ChevronRight, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useInfluenceGraphData } from "@/hooks/use-influence-graph-data";
import { SignalFreshness } from "@/components/SignalFreshness";
import { NODE_COLORS, NODE_LABELS, EDGE_LABELS, FILTER_LABELS, type GraphNode, type GraphEdge, type NodeType, type EdgeType, type FilterCategory } from "@/lib/influence-graph-types";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";

/* ────────────────────────────────────────────────── */
/* Evidence Drawer                                    */
/* ────────────────────────────────────────────────── */
function EvidenceDrawer({
  node,
  edge,
  onClose,
}: {
  node?: GraphNode | null;
  edge?: GraphEdge | null;
  onClose: () => void;
}) {
  if (!node && !edge) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[380px] bg-card border-l border-border z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right-full duration-200">
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
        <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider">
          {node ? 'Node Evidence' : 'Relationship Evidence'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {node && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[node.type] }} />
              <Badge variant="outline" className="text-[10px] font-mono">{NODE_LABELS[node.type]}</Badge>
            </div>
            <h4 className="text-lg font-semibold text-foreground">{node.label}</h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Confidence</span>
                <Badge variant={node.confidence === 'high' ? 'success' : node.confidence === 'medium' ? 'warning' : 'outline'} className="text-[10px]">
                  {node.confidence}
                </Badge>
              </div>
              {node.amount && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount</span>
                  <span className="text-foreground font-mono">${node.amount.toLocaleString()}</span>
                </div>
              )}
              {node.lastUpdated && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Freshness</span>
                  <SignalFreshness lastUpdated={node.lastUpdated} compact />
                </div>
              )}
              {node.sourceUrl && (
                <a href={node.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  View source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {node.metadata && Object.keys(node.metadata).length > 0 && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Details</p>
                  {Object.entries(node.metadata).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-foreground max-w-[200px] text-right truncate">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {edge && (
          <>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{typeof edge.source === 'string' ? edge.source.split('::')[1] : ''}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="font-mono">{typeof edge.target === 'string' ? edge.target.split('::')[1] : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={edge.isContradiction ? 'destructive' : 'outline'} className="text-[10px] font-mono">
                {EDGE_LABELS[edge.edgeType] || edge.edgeType}
              </Badge>
              {edge.isContradiction && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlertTriangle className="w-3 h-3" /> Contradiction
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground">{edge.label}</p>
            {edge.description && <p className="text-xs text-muted-foreground">{edge.description}</p>}

            <div className="space-y-2 text-xs">
              {edge.amount && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount</span>
                  <span className="text-foreground font-mono">${edge.amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Confidence</span>
                <Badge variant={edge.confidence === 'high' ? 'success' : edge.confidence === 'medium' ? 'warning' : 'outline'} className="text-[10px]">
                  {edge.confidence}
                </Badge>
              </div>
              {edge.date && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Date</span>
                  <span className="text-foreground">{new Date(edge.date).toLocaleDateString()}</span>
                </div>
              )}
              {edge.sourceName && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Source</span>
                  <span className="text-foreground">{edge.sourceName}</span>
                </div>
              )}
              {edge.evidenceUrl && (
                <a href={edge.evidenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  View evidence <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────── */
/* Main Influence Graph Page                          */
/* ────────────────────────────────────────────────── */
export default function InfluenceGraph() {
  const { id } = useParams<{ id: string }>();
  const graphRef = useRef<ForceGraphMethods>();

  // Resolve company
  const { data: dbCompany, isLoading: companyLoading } = useQuery({
    queryKey: ["ig-company-resolve", id],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name, industry, state, ticker, parent_company, is_publicly_traded").eq("slug", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { graph, isLoading: graphLoading } = useInfluenceGraphData(dbCompany?.id, dbCompany?.name);

  // State
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [showContradictionsOnly, setShowContradictionsOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<FilterCategory>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter graph data
  const filteredGraph = useMemo(() => {
    let nodes = graph.nodes;
    let edges = graph.edges;

    if (showContradictionsOnly) {
      const contradictionEdges = edges.filter(e => e.isContradiction);
      const involvedNodeIds = new Set(contradictionEdges.flatMap(e => [
        typeof e.source === 'string' ? e.source : (e.source as any)?.id,
        typeof e.target === 'string' ? e.target : (e.target as any)?.id
      ]));
      nodes = nodes.filter(n => involvedNodeIds.has(n.id));
      edges = contradictionEdges;
    }

    if (showVerifiedOnly) {
      nodes = nodes.filter(n => n.confidence === 'high');
      const nodeIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => {
        const sid = typeof e.source === 'string' ? e.source : (e.source as any)?.id;
        const tid = typeof e.target === 'string' ? e.target : (e.target as any)?.id;
        return nodeIds.has(sid) && nodeIds.has(tid);
      });
    }

    // Topic filters
    if (activeFilters.size > 0) {
      const topicKeywords: Record<FilterCategory, string[]> = {
        money: ['pac', 'donation', 'spending', 'campaign'],
        lobbying: ['lobby', 'lobbying', 'registrant'],
        civil_rights: ['civil', 'rights', 'equality', 'discrimination', 'lgbtq', 'dei', 'voting'],
        labor: ['labor', 'worker', 'union', 'wage', 'osha', 'nlrb'],
        climate: ['climate', 'environment', 'epa', 'emissions', 'carbon'],
        immigration: ['immigration', 'h-1b', 'visa', 'border'],
        healthcare: ['health', 'insurance', 'pharmaceutical', 'cms'],
        guns: ['gun', 'firearm', 'nra', 'atf'],
        consumer_protection: ['consumer', 'ftc', 'cfpb', 'fda', 'cpsc'],
      };
      const keywords = [...activeFilters].flatMap(f => topicKeywords[f] || []);
      if (keywords.length > 0) {
        edges = edges.filter(e => {
          const text = `${e.label} ${e.description || ''} ${e.edgeType}`.toLowerCase();
          return keywords.some(kw => text.includes(kw));
        });
        const edgeNodeIds = new Set(edges.flatMap(e => [
          typeof e.source === 'string' ? e.source : (e.source as any)?.id,
          typeof e.target === 'string' ? e.target : (e.target as any)?.id
        ]));
        // Always keep the company node
        const companyNodes = nodes.filter(n => n.type === 'company');
        nodes = nodes.filter(n => edgeNodeIds.has(n.id) || n.type === 'company');
      }
    }

    return { nodes, edges };
  }, [graph, showContradictionsOnly, showVerifiedOnly, activeFilters]);

  // Graph data for force-graph
  const forceData = useMemo(() => ({
    nodes: filteredGraph.nodes.map(n => ({ ...n })),
    links: filteredGraph.edges.map(e => ({
      ...e,
      source: typeof e.source === 'string' ? e.source : (e.source as any)?.id,
      target: typeof e.target === 'string' ? e.target : (e.target as any)?.id,
    })),
  }), [filteredGraph]);

  // Auto-center on load
  useEffect(() => {
    if (graphRef.current && forceData.nodes.length > 0) {
      setTimeout(() => graphRef.current?.zoomToFit(400, 60), 500);
    }
  }, [forceData.nodes.length]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedEdge(null);
    setSelectedNode(node as GraphNode);
  }, []);

  const handleLinkClick = useCallback((link: any) => {
    setSelectedNode(null);
    setSelectedEdge(link as GraphEdge);
  }, []);

  const toggleFilter = (filter: FilterCategory) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  if (companyLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dbCompany) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Company Not Found</h1>
          <Link to="/browse"><Button>Browse Companies</Button></Link>
        </div>
      </div>
    );
  }

  const contradictionCount = graph.edges.filter(e => e.isContradiction).length;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top Bar */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3 shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/company/${id}`} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{dbCompany.name}</h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Corporate Influence Graph</p>
            </div>
            {dbCompany.ticker && <Badge variant="outline" className="font-mono text-[10px] shrink-0">{dbCompany.ticker}</Badge>}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {contradictionCount > 0 && (
              <Badge variant="destructive" className="gap-1 text-xs">
                <AlertTriangle className="w-3 h-3" />
                {contradictionCount} Contradiction{contradictionCount !== 1 ? 's' : ''}
              </Badge>
            )}
            <div className="text-[10px] font-mono text-muted-foreground">
              {filteredGraph.nodes.length} nodes · {filteredGraph.edges.length} edges
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Filter sidebar */}
        <div className={cn(
          "border-r border-border bg-card shrink-0 overflow-y-auto transition-all duration-200",
          filtersOpen ? "w-[260px]" : "w-0"
        )}>
          {filtersOpen && (
            <div className="p-4 space-y-5 w-[260px]">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">Display</p>
                <div className="space-y-3">
                  <label className="flex items-center justify-between gap-2 cursor-pointer">
                    <span className="text-xs text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-[hsl(var(--civic-red))]" />
                      Contradictions only
                    </span>
                    <Switch checked={showContradictionsOnly} onCheckedChange={setShowContradictionsOnly} />
                  </label>
                  <label className="flex items-center justify-between gap-2 cursor-pointer">
                    <span className="text-xs text-foreground flex items-center gap-1.5">
                      <Eye className="w-3 h-3" />
                      Verified only
                    </span>
                    <Switch checked={showVerifiedOnly} onCheckedChange={setShowVerifiedOnly} />
                  </label>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">Topic Filters</p>
                <div className="space-y-1.5">
                  {(Object.entries(FILTER_LABELS) as [FilterCategory, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleFilter(key)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors",
                        activeFilters.has(key)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {activeFilters.size > 0 && (
                  <button
                    onClick={() => setActiveFilters(new Set())}
                    className="text-[10px] text-primary mt-2 hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">Legend</p>
                <div className="space-y-1">
                  {(Object.entries(NODE_LABELS) as [NodeType, string][]).map(([type, label]) => (
                    <div key={type} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[type] }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn(
            "absolute top-3 left-3 z-20 p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-muted/50 transition-colors",
            filtersOpen && "left-[268px]"
          )}
        >
          <Filter className="w-4 h-4 text-foreground" />
        </button>

        {/* Graph canvas */}
        <div className="flex-1 bg-background relative">
          {graphLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Building influence graph…</p>
              </div>
            </div>
          ) : forceData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Influence Data Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run an intelligence scan on this company to populate the influence graph.
                </p>
                <Link to={`/company/${id}`}><Button size="sm">Back to Company Report</Button></Link>
              </div>
            </div>
          ) : (
            <ForceGraph2D
              ref={graphRef}
              graphData={forceData}
              nodeId="id"
              nodeLabel={(node: any) => `${NODE_LABELS[(node as GraphNode).type] || ''}: ${(node as GraphNode).label}`}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const gn = node as GraphNode & { x: number; y: number };
                const size = gn.type === 'company' ? 10 : gn.type === 'pac' ? 7 : 5;
                const color = NODE_COLORS[gn.type] || '#888';

                // Node circle
                ctx.beginPath();
                ctx.arc(gn.x, gn.y, size, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();

                // Border for selected
                if (selectedNode?.id === gn.id) {
                  ctx.strokeStyle = '#fff';
                  ctx.lineWidth = 2;
                  ctx.stroke();
                }

                // Contradiction glow
                if (gn.type === 'statement' && graph.edges.some(e => e.isContradiction &&
                  (typeof e.source === 'string' ? e.source : (e.source as any)?.id) === gn.id
                )) {
                  ctx.beginPath();
                  ctx.arc(gn.x, gn.y, size + 4, 0, 2 * Math.PI);
                  ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
                  ctx.lineWidth = 1.5;
                  ctx.stroke();
                }

                // Label
                if (globalScale > 0.6 || gn.type === 'company') {
                  const label = gn.label.length > 28 ? gn.label.slice(0, 26) + '…' : gn.label;
                  const fontSize = gn.type === 'company' ? 14 / globalScale : 10 / globalScale;
                  ctx.font = `${gn.type === 'company' ? 'bold ' : ''}${fontSize}px "IBM Plex Sans", sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';

                  // Background for readability
                  const textWidth = ctx.measureText(label).width;
                  const pad = 2 / globalScale;
                  ctx.fillStyle = 'rgba(0,0,0,0.65)';
                  ctx.fillRect(gn.x - textWidth / 2 - pad, gn.y + size + 2, textWidth + pad * 2, fontSize + pad * 2);

                  ctx.fillStyle = '#fff';
                  ctx.fillText(label, gn.x, gn.y + size + 3);
                }
              }}
              linkColor={(link: any) => {
                if ((link as GraphEdge).isContradiction) return 'rgba(239, 68, 68, 0.8)';
                return 'rgba(148, 163, 184, 0.25)';
              }}
              linkWidth={(link: any) => (link as GraphEdge).isContradiction ? 2.5 : 1}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={0.85}
              linkCurvature={0.15}
              onNodeClick={handleNodeClick}
              onLinkClick={handleLinkClick}
              cooldownTicks={80}
              d3AlphaDecay={0.04}
              d3VelocityDecay={0.3}
              backgroundColor="transparent"
              enableNodeDrag
              enableZoomInteraction
              enablePanInteraction
            />
          )}

          {/* Disclaimer */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-lg">
            <p className="text-[9px] font-mono text-muted-foreground/50 text-center leading-relaxed px-4">
              This graph shows verified relationships from public records (FEC, Senate LDA, CourtListener, SEC).
              No intent is inferred — interpret connections using the evidence links provided.
            </p>
          </div>
        </div>

        {/* Evidence drawer */}
        <EvidenceDrawer
          node={selectedNode}
          edge={selectedEdge}
          onClose={() => { setSelectedNode(null); setSelectedEdge(null); }}
        />
      </div>
    </div>
  );
}
