import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Building2, X, ChevronRight, ExternalLink, Filter,
  DollarSign, RotateCcw, Zap, Eye, EyeOff, Maximize2,
  AlertTriangle, TrendingUp, Lightbulb, Route, Crosshair,
  Download, Share2, Users, Scale, FileText, Factory, Landmark,
  Loader2, ArrowRight, Shield, Globe, Minimize2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ───

interface GraphNode {
  id: string;
  label: string;
  group: string;
  val: number;
  amount?: number;
  metadata?: Record<string, any>;
  cluster?: number;
  issueCategories?: string[];
  party?: string;
  state?: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string | any;
  target: string | any;
  label: string;
  amount?: number;
  linkType: string;
  issueCategory?: string;
  year?: number;
  confidence?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ─── Constants ───

const GROUP_COLORS: Record<string, string> = {
  Company: "#D4A843",
  PAC: "#7C5CFC",
  Politician: "#3B82F6",
  Legislation: "#22C55E",
  Industry: "#EF4444",
  Agency: "#A855F7",
  Committee: "#14B8A6",
};

const GROUP_SHAPES: Record<string, string> = {
  Company: "◆",
  PAC: "●",
  Politician: "▲",
  Legislation: "■",
  Industry: "⬟",
  Agency: "★",
  Committee: "◎",
};

const GROUP_LABELS: Record<string, { icon: any; desc: string }> = {
  Company: { icon: Building2, desc: "Corporation" },
  PAC: { icon: DollarSign, desc: "Political Action Committee" },
  Politician: { icon: Landmark, desc: "Elected Official" },
  Legislation: { icon: FileText, desc: "Bill / Resolution" },
  Industry: { icon: Factory, desc: "Industry Sector" },
  Agency: { icon: Shield, desc: "Government Agency" },
  Committee: { icon: Users, desc: "Congressional Committee" },
};

const ISSUE_CATEGORIES = [
  "All", "Labor Rights", "Immigration", "Climate", "Gun Policy",
  "Civil Rights", "Healthcare", "Consumer Protection", "Defense",
  "Technology", "Education", "Financial Services", "Energy", "Housing",
];

const RELATIONSHIP_TYPES = [
  { key: "all", label: "All" },
  { key: "donation_to_member", label: "Donations" },
  { key: "lobbying_on_bill", label: "Lobbying" },
  { key: "dark_money_channel", label: "Dark Money" },
  { key: "committee_oversight_of_contract", label: "Contracts" },
  { key: "revolving_door", label: "Revolving Door" },
  { key: "member_on_committee", label: "Committee" },
];

const LINK_STYLES: Record<string, { dash: number[]; color: string; label: string }> = {
  donation_to_member:           { dash: [],       color: "rgba(76, 175, 80, 0.7)",  label: "Donated to" },
  trade_association_lobbying:   { dash: [6, 3],   color: "rgba(66, 133, 244, 0.7)", label: "Trade Lobbying" },
  lobbying_on_bill:             { dash: [6, 3],   color: "rgba(66, 133, 244, 0.7)", label: "Lobbied On" },
  dark_money_channel:           { dash: [2, 4],   color: "rgba(244, 67, 54, 0.6)",  label: "Dark Money" },
  member_on_committee:          { dash: [10, 5],  color: "rgba(158, 158, 158, 0.5)", label: "Committee Member" },
  committee_oversight_of_contract: { dash: [],    color: "rgba(255, 152, 0, 0.6)",  label: "Contract Oversight" },
  revolving_door:               { dash: [3, 3],   color: "rgba(156, 39, 176, 0.6)", label: "Revolving Door" },
  foundation_grant_to_district: { dash: [],       color: "rgba(0, 188, 212, 0.6)",  label: "Grant" },
  advisory_committee_appointment: { dash: [4, 4], color: "rgba(121, 85, 72, 0.6)",  label: "Advisory Role" },
  interlocking_directorate:     { dash: [2, 2],   color: "rgba(96, 125, 139, 0.6)", label: "Board Interlock" },
  state_lobbying_contract:      { dash: [],       color: "rgba(255, 193, 7, 0.6)",  label: "State Contract" },
  international_influence:      { dash: [8, 4],   color: "rgba(233, 30, 99, 0.6)",  label: "International" },
};

const CONFIDENCE_LABELS: Record<string, string> = {
  direct: "Direct — documented in public filings",
  likely: "Likely — strong circumstantial evidence",
  inferred: "Inferred — pattern-based connection",
  partial: "Partial — limited evidence available",
};

// ─── Helpers ───

function mapEntityType(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("pac") || lower.includes("political_action")) return "PAC";
  if (lower.includes("politician") || lower.includes("member") || lower.includes("candidate") || lower.includes("congress")) return "Politician";
  if (lower.includes("bill") || lower.includes("legislation") || lower.includes("law")) return "Legislation";
  if (lower.includes("industry") || lower.includes("sector")) return "Industry";
  if (lower.includes("agency") || lower.includes("department") || lower.includes("government")) return "Agency";
  if (lower.includes("committee")) return "Committee";
  return "Company";
}

function formatAmount(amount: number | null | undefined): string {
  if (!amount) return "";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function mapLinkLabel(linkType: string): string {
  return LINK_STYLES[linkType]?.label || linkType.replace(/_/g, " ");
}

function assignClusters(nodes: GraphNode[], links: GraphLink[]): GraphNode[] {
  const adj = new Map<string, Set<string>>();
  for (const n of nodes) adj.set(n.id, new Set());
  for (const l of links) {
    const src = typeof l.source === "string" ? l.source : l.source.id;
    const tgt = typeof l.target === "string" ? l.target : l.target.id;
    adj.get(src)?.add(tgt);
    adj.get(tgt)?.add(src);
  }
  const visited = new Set<string>();
  let clusterId = 0;
  const clusterMap = new Map<string, number>();
  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const queue = [node.id];
    visited.add(node.id);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      clusterMap.set(curr, clusterId);
      for (const neighbor of adj.get(curr) || []) {
        if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
      }
    }
    clusterId++;
  }
  return nodes.map(n => ({ ...n, cluster: clusterMap.get(n.id) ?? 0 }));
}

// BFS shortest path
function findPath(nodes: GraphNode[], links: GraphLink[], startId: string, endId: string): { nodeIds: string[]; linkIndices: number[] } | null {
  const adj = new Map<string, { nodeId: string; linkIdx: number }[]>();
  for (const n of nodes) adj.set(n.id, []);
  links.forEach((l, i) => {
    const src = typeof l.source === "string" ? l.source : l.source.id;
    const tgt = typeof l.target === "string" ? l.target : l.target.id;
    adj.get(src)?.push({ nodeId: tgt, linkIdx: i });
    adj.get(tgt)?.push({ nodeId: src, linkIdx: i });
  });
  const visited = new Set<string>([startId]);
  const queue: { id: string; path: string[]; linkPath: number[] }[] = [{ id: startId, path: [startId], linkPath: [] }];
  while (queue.length > 0) {
    const { id, path, linkPath } = queue.shift()!;
    if (id === endId) return { nodeIds: path, linkIndices: linkPath };
    for (const neighbor of adj.get(id) || []) {
      if (!visited.has(neighbor.nodeId)) {
        visited.add(neighbor.nodeId);
        queue.push({ id: neighbor.nodeId, path: [...path, neighbor.nodeId], linkPath: [...linkPath, neighbor.linkIdx] });
      }
    }
  }
  return null;
}

// Generate insights from current graph
function generateInsights(nodes: GraphNode[], links: GraphLink[]): string[] {
  const insights: string[] = [];
  const companyCounts = nodes.filter(n => n.group === "Company").length;
  const politicianCounts = nodes.filter(n => n.group === "Politician").length;
  const pacCounts = nodes.filter(n => n.group === "PAC").length;
  const legislationCounts = nodes.filter(n => n.group === "Legislation").length;

  // Hub detection
  const connectionCounts = new Map<string, number>();
  for (const l of links) {
    const src = typeof l.source === "string" ? l.source : l.source.id;
    const tgt = typeof l.target === "string" ? l.target : l.target.id;
    connectionCounts.set(src, (connectionCounts.get(src) || 0) + 1);
    connectionCounts.set(tgt, (connectionCounts.get(tgt) || 0) + 1);
  }
  const hub = [...connectionCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const hubNode = hub ? nodes.find(n => n.id === hub[0]) : null;
  if (hubNode && hub[1] >= 3) {
    insights.push(`${hubNode.label} is the most connected entity in this network with ${hub[1]} relationships.`);
  }

  // Money flow
  const totalAmount = links.reduce((s, l) => s + (l.amount || 0), 0);
  if (totalAmount > 0) {
    insights.push(`${formatAmount(totalAmount)} in documented money flow across ${links.filter(l => l.amount).length} financial connections.`);
  }

  // Dark money
  const darkMoneyLinks = links.filter(l => l.linkType === "dark_money_channel");
  if (darkMoneyLinks.length > 0) {
    insights.push(`${darkMoneyLinks.length} dark money channel${darkMoneyLinks.length > 1 ? "s" : ""} detected — these represent undisclosed political spending paths.`);
  }

  // Multi-company overlap
  if (companyCounts > 1) {
    insights.push(`${companyCounts} companies appear in this network — potential shared influence infrastructure.`);
  }

  // PAC-to-politician ratio
  if (pacCounts > 0 && politicianCounts > 0) {
    const ratio = (politicianCounts / pacCounts).toFixed(1);
    insights.push(`Each PAC connects to an average of ${ratio} politicians in this network.`);
  }

  // Legislation reach
  if (legislationCounts > 0) {
    insights.push(`${legislationCounts} piece${legislationCounts > 1 ? "s" : ""} of legislation connected to this influence network.`);
  }

  return insights.slice(0, 5);
}

// ─── Sample data ───

const SAMPLE_NODES: GraphNode[] = [
  { id: "amazon", label: "Amazon", group: "Company", val: 22, metadata: { industry: "Technology / E-Commerce", summary: "One of the largest corporate political spenders in tech, with extensive lobbying on AI regulation, antitrust, and labor policy." } },
  { id: "amazon-pac", label: "Amazon.com PAC", group: "PAC", val: 16, amount: 1_200_000, metadata: { summary: "Amazon's corporate PAC disbursing funds to candidates across both parties." } },
  { id: "sen-cantwell", label: "Sen. Maria Cantwell (D-WA)", group: "Politician", val: 12, party: "Democrat", state: "WA", issueCategories: ["Technology", "Consumer Protection"] },
  { id: "sen-wyden", label: "Sen. Ron Wyden (D-OR)", group: "Politician", val: 12, party: "Democrat", state: "OR", issueCategories: ["Technology", "Civil Rights"] },
  { id: "rep-delbene", label: "Rep. Suzan DelBene (D-WA)", group: "Politician", val: 10, party: "Democrat", state: "WA", issueCategories: ["Technology"] },
  { id: "rep-mcmorris", label: "Rep. Cathy McMorris Rodgers (R-WA)", group: "Politician", val: 10, party: "Republican", state: "WA", issueCategories: ["Technology", "Energy"] },
  { id: "commerce-committee", label: "Senate Commerce Committee", group: "Committee", val: 14, issueCategories: ["Technology", "Consumer Protection"] },
  { id: "finance-committee", label: "Senate Finance Committee", group: "Committee", val: 14, issueCategories: ["Financial Services"] },
  { id: "ai-regulation-bill", label: "AI Accountability Act (S.3312)", group: "Legislation", val: 12, issueCategories: ["Technology", "Labor Rights"], metadata: { status: "In Committee", description: "Requires algorithmic impact assessments for automated decision systems." } },
  { id: "data-privacy-bill", label: "American Data Privacy Act (H.R.8152)", group: "Legislation", val: 12, issueCategories: ["Consumer Protection", "Technology"], metadata: { status: "Passed House", description: "Comprehensive federal data privacy framework." } },
  { id: "tech-industry", label: "Technology Sector", group: "Industry", val: 16, issueCategories: ["Technology"] },
  { id: "ecommerce-industry", label: "E-Commerce & Retail", group: "Industry", val: 14, issueCategories: ["Consumer Protection"] },
  { id: "dod", label: "Dept. of Defense", group: "Agency", val: 18, amount: 10_000_000, issueCategories: ["Defense"] },
  { id: "microsoft", label: "Microsoft", group: "Company", val: 18, metadata: { industry: "Technology", summary: "Major government contractor and political spender with interests in AI regulation." } },
  { id: "ms-pac", label: "Microsoft PAC", group: "PAC", val: 14, amount: 890_000 },
];

const SAMPLE_LINKS: GraphLink[] = [
  { source: "amazon", target: "amazon-pac", label: "Funds", linkType: "donation_to_member", amount: 1_200_000, confidence: "direct" },
  { source: "amazon-pac", target: "sen-cantwell", label: "Donated $45K", linkType: "donation_to_member", amount: 45_000, year: 2024, confidence: "direct" },
  { source: "amazon-pac", target: "sen-wyden", label: "Donated $38K", linkType: "donation_to_member", amount: 38_000, year: 2024, confidence: "direct" },
  { source: "amazon-pac", target: "rep-delbene", label: "Donated $25K", linkType: "donation_to_member", amount: 25_000, year: 2024, confidence: "direct" },
  { source: "amazon-pac", target: "rep-mcmorris", label: "Donated $20K", linkType: "donation_to_member", amount: 20_000, year: 2023, confidence: "direct" },
  { source: "sen-cantwell", target: "commerce-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "sen-wyden", target: "finance-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "commerce-committee", target: "ai-regulation-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "finance-committee", target: "data-privacy-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "ai-regulation-bill", target: "tech-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "data-privacy-bill", target: "ecommerce-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "amazon", target: "dod", label: "AWS GovCloud Contract", linkType: "committee_oversight_of_contract", amount: 10_000_000, confidence: "direct" },
  { source: "microsoft", target: "ms-pac", label: "Funds", linkType: "donation_to_member", amount: 890_000, confidence: "direct" },
  { source: "ms-pac", target: "sen-cantwell", label: "Donated $30K", linkType: "donation_to_member", amount: 30_000, year: 2024, confidence: "direct" },
  { source: "microsoft", target: "dod", label: "JEDI Contract", linkType: "committee_oversight_of_contract", amount: 7_500_000, confidence: "direct" },
  { source: "microsoft", target: "tech-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "amazon", target: "tech-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
];

// ─── Main Component ───

export default function FollowTheMoney() {
  const navigate = useNavigate();
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [allNodes, setAllNodes] = useState<GraphNode[]>(SAMPLE_NODES);
  const [allLinks, setAllLinks] = useState<GraphLink[]>(SAMPLE_LINKS);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIssueFilter, setActiveIssueFilter] = useState("All");
  const [activeRelFilter, setActiveRelFilter] = useState("all");
  const [showLabels, setShowLabels] = useState(false);
  const [strongOnly, setStrongOnly] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [pathMode, setPathMode] = useState(false);
  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<{ nodeIds: string[]; linkIndices: number[] } | null>(null);
  const [graphExpanded, setGraphExpanded] = useState(false);
  const [hoverTooltip, setHoverTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Cluster foci positions by group type
  const CLUSTER_FOCI: Record<string, { x: number; y: number }> = {
    Company:     { x: 0,    y: 0 },
    PAC:         { x: -150, y: -100 },
    Politician:  { x: 150,  y: -100 },
    Legislation: { x: 200,  y: 100 },
    Industry:    { x: -200, y: 100 },
    Agency:      { x: 0,    y: 200 },
    Committee:   { x: 0,    y: -200 },
  };

  // D3 forces configured after graphData (defined below)

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(width, 300), height: Math.max(height, 300) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Filter graph
  const graphData: GraphData = useMemo(() => {
    let filteredLinks = [...allLinks];
    let relevantNodeIds = new Set(allNodes.map(n => n.id));

    // Relationship type filter
    if (activeRelFilter !== "all") {
      filteredLinks = filteredLinks.filter(l => l.linkType === activeRelFilter);
      relevantNodeIds = new Set<string>();
      for (const l of filteredLinks) {
        const src = typeof l.source === "string" ? l.source : l.source.id;
        const tgt = typeof l.target === "string" ? l.target : l.target.id;
        relevantNodeIds.add(src);
        relevantNodeIds.add(tgt);
      }
      if (selectedCompanyId) relevantNodeIds.add(selectedCompanyId);
    }

    // Issue filter
    if (activeIssueFilter !== "All") {
      const issueNodeIds = new Set(allNodes.filter(n => n.issueCategories?.includes(activeIssueFilter)).map(n => n.id));
      filteredLinks = filteredLinks.filter(l => {
        const src = typeof l.source === "string" ? l.source : l.source.id;
        const tgt = typeof l.target === "string" ? l.target : l.target.id;
        return issueNodeIds.has(src) || issueNodeIds.has(tgt) || l.issueCategory === activeIssueFilter;
      });
      relevantNodeIds = new Set<string>();
      for (const l of filteredLinks) {
        const src = typeof l.source === "string" ? l.source : l.source.id;
        const tgt = typeof l.target === "string" ? l.target : l.target.id;
        relevantNodeIds.add(src);
        relevantNodeIds.add(tgt);
      }
      if (selectedCompanyId) relevantNodeIds.add(selectedCompanyId);
    }

    // Strong connections only
    if (strongOnly) {
      filteredLinks = filteredLinks.filter(l => l.confidence === "direct" || (l.amount && l.amount >= 10000));
    }

    const filteredNodes = allNodes.filter(n => relevantNodeIds.has(n.id));
    const clustered = assignClusters(filteredNodes, filteredLinks);
    return { nodes: clustered, links: filteredLinks };
  }, [allNodes, allLinks, activeIssueFilter, activeRelFilter, strongOnly, selectedCompanyId]);

  // Configure D3 forces after graphData is ready
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;
    // @ts-ignore
    fg.d3Force("charge")?.strength(-120).distanceMax(400);
    // @ts-ignore
    fg.d3Force("link")?.distance(60);
    // @ts-ignore
    fg.d3Force("center")?.strength(0.05);

    // Add cluster foci forces
    if (fg.d3Force) {
      // @ts-ignore
      fg.d3Force("clusterX", (alpha: number) => {
        graphData.nodes.forEach((node: any) => {
          const foci = CLUSTER_FOCI[node.group] || { x: 0, y: 0 };
          node.vx = (node.vx || 0) + (foci.x - (node.x || 0)) * alpha * 0.03;
        });
      });
      // @ts-ignore
      fg.d3Force("clusterY", (alpha: number) => {
        graphData.nodes.forEach((node: any) => {
          const foci = CLUSTER_FOCI[node.group] || { x: 0, y: 0 };
          node.vy = (node.vy || 0) + (foci.y - (node.y || 0)) * alpha * 0.03;
        });
      });
    }
  }, [graphData]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug")
        .ilike("name", `%${query}%`)
        .limit(8);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Load entity linkages
  const loadCompanyGraph = useCallback(async (companyId: string, companyName: string) => {
    setLoading(true);
    setSelectedCompanyId(companyId);
    setSelectedCompanyName(companyName);
    setQuery("");
    setSearchResults([]);
    setSelectedNode(null);
    setActiveIssueFilter("All");
    setActiveRelFilter("all");
    setPathMode(false);
    setActivePath(null);

    try {
      const { data: linkages } = await supabase
        .from("entity_linkages")
        .select("*")
        .eq("company_id", companyId)
        .order("amount", { ascending: false })
        .limit(150);

      if (!linkages || linkages.length === 0) {
        setAllNodes([{ id: companyId, label: companyName, group: "Company", val: 22 }]);
        setAllLinks([]);
        setLoading(false);
        return;
      }

      const nodeMap = new Map<string, GraphNode>();
      const links: GraphLink[] = [];

      nodeMap.set(companyId, {
        id: companyId, label: companyName, group: "Company", val: 22,
      });

      for (const link of linkages) {
        const srcId = link.source_entity_id || `src-${link.source_entity_name}`;
        if (!nodeMap.has(srcId) && link.source_entity_name !== companyName) {
          nodeMap.set(srcId, {
            id: srcId,
            label: link.source_entity_name,
            group: mapEntityType(link.source_entity_type),
            val: Math.max(6, Math.min(20, Math.log10((link.amount || 1000) + 1) * 3)),
            amount: link.amount || undefined,
          });
        }

        const tgtId = link.target_entity_id || `tgt-${link.target_entity_name}`;
        if (!nodeMap.has(tgtId)) {
          nodeMap.set(tgtId, {
            id: tgtId,
            label: link.target_entity_name,
            group: mapEntityType(link.target_entity_type),
            val: Math.max(6, Math.min(20, Math.log10((link.amount || 1000) + 1) * 3)),
            amount: link.amount || undefined,
          });
        }

        const sourceId = link.source_entity_name === companyName ? companyId : srcId;
        links.push({
          source: sourceId,
          target: tgtId,
          label: mapLinkLabel(link.link_type),
          amount: link.amount || undefined,
          linkType: link.link_type,
          confidence: link.confidence_score >= 0.8 ? "direct" : link.confidence_score >= 0.5 ? "likely" : "inferred",
          issueCategory: link.description?.match(/issue:\s*(.+)/i)?.[1] || undefined,
        });
      }

      setAllNodes(assignClusters(Array.from(nodeMap.values()), links));
      setAllLinks(links);
    } catch (err) {
      console.error("Failed to load graph:", err);
    }
    setLoading(false);
  }, []);

  const resetGraph = () => {
    setSelectedCompanyId(null);
    setSelectedCompanyName("");
    setAllNodes(SAMPLE_NODES);
    setAllLinks(SAMPLE_LINKS);
    setSelectedNode(null);
    setActiveIssueFilter("All");
    setActiveRelFilter("all");
    setPathMode(false);
    setActivePath(null);
    setPathStart(null);
    setPathEnd(null);
  };

  // Hover highlight — 1-hop neighbors only (not full BFS)
  const highlightedIds = useMemo(() => {
    // Path mode takes priority
    if (activePath) {
      return { nodes: new Set(activePath.nodeIds), links: new Set(activePath.linkIndices) };
    }
    if (!hoveredNode) return null;
    const ids = new Set<string>();
    const linkIds = new Set<number>();
    ids.add(hoveredNode);
    // Only direct neighbors (1-hop)
    graphData.links.forEach((l, i) => {
      const src = typeof l.source === "string" ? l.source : l.source.id;
      const tgt = typeof l.target === "string" ? l.target : l.target.id;
      if (src === hoveredNode) { ids.add(tgt); linkIds.add(i); }
      if (tgt === hoveredNode) { ids.add(src); linkIds.add(i); }
    });
    return { nodes: ids, links: linkIds };
  }, [hoveredNode, graphData, activePath]);

  // Path exploration
  useEffect(() => {
    if (pathStart && pathEnd && pathStart !== pathEnd) {
      const result = findPath(graphData.nodes, graphData.links, pathStart, pathEnd);
      setActivePath(result);
    } else {
      setActivePath(null);
    }
  }, [pathStart, pathEnd, graphData]);

  // Handle node click in path mode
  const handleNodeClick = useCallback((node: any) => {
    if (pathMode) {
      if (!pathStart) {
        setPathStart(node.id);
      } else if (!pathEnd && node.id !== pathStart) {
        setPathEnd(node.id);
      } else {
        setPathStart(node.id);
        setPathEnd(null);
        setActivePath(null);
      }
    } else {
      const n = graphData.nodes.find(gn => gn.id === node.id);
      setSelectedNode(prev => prev?.id === node.id ? null : (n || null));
    }
  }, [pathMode, pathStart, pathEnd, graphData.nodes]);

  // Connected edges for selected node
  const selectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return graphData.links.filter(l => {
      const src = typeof l.source === "string" ? l.source : l.source.id;
      const tgt = typeof l.target === "string" ? l.target : l.target.id;
      return src === selectedNode.id || tgt === selectedNode.id;
    });
  }, [selectedNode, graphData]);

  // Insights
  const insights = useMemo(() => generateInsights(graphData.nodes, graphData.links), [graphData]);

  // ─── Node paint ───
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const r = Math.max(4, (node.val || 8) / globalScale * 1.5);
    const color = GROUP_COLORS[node.group] || "#888";
    const isHighlighted = !highlightedIds || highlightedIds.nodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const isPathNode = activePath?.nodeIds.includes(node.id);
    const isPathEndpoint = node.id === pathStart || node.id === pathEnd;
    const alpha = isHighlighted ? 1 : 0.12;

    ctx.globalAlpha = alpha;

    // Glow for path endpoints
    if (isPathEndpoint) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Selected glow
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
      ctx.fillStyle = color + "33";
      ctx.fill();
    }

    // Main node
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Border
    if (isSelected || isPathNode) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = (isPathNode ? 2.5 : 2) / globalScale;
      ctx.stroke();
    }

    // Initials inside circle
    const initials = node.label.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("");
    const fontSize = Math.max(7, Math.min(r * 0.85, 14 / globalScale));
    ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(initials || "?", node.x, node.y);

    // Label — show on hover/selected/path, or when showLabels is toggled on
    const shouldShowLabel = showLabels || isSelected || (highlightedIds && highlightedIds.nodes.has(node.id));
    if (shouldShowLabel && globalScale > 0.4) {
      const labelSize = Math.max(7, 10 / globalScale);
      ctx.font = `600 ${labelSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isHighlighted ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)";
      const label = node.label.length > 22 ? node.label.slice(0, 20) + "…" : node.label;
      ctx.fillText(label, node.x, node.y + r + 3);

      if (node.amount && globalScale > 0.7) {
        const amtSize = Math.max(6, 8 / globalScale);
        ctx.font = `${amtSize}px system-ui, sans-serif`;
        ctx.fillStyle = isHighlighted ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)";
        ctx.fillText(formatAmount(node.amount), node.x, node.y + r + 3 + labelSize + 2);
      }
    }

    ctx.globalAlpha = 1;
  }, [highlightedIds, selectedNode, showLabels, activePath, pathStart, pathEnd]);

  // ─── Link paint ───
  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const src = link.source;
    const tgt = link.target;
    if (!src.x || !tgt.x) return;

    const style = LINK_STYLES[link.linkType] || { dash: [], color: "rgba(150,150,150,0.4)", label: "" };
    const linkIdx = graphData.links.indexOf(link);
    const isHighlighted = !highlightedIds || highlightedIds.links.has(linkIdx);
    const isPathLink = activePath?.linkIndices.includes(linkIdx);
    const alpha = isHighlighted ? 1 : 0.06;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.setLineDash(style.dash);

    const baseWidth = link.amount ? Math.min(Math.max(Math.log10(link.amount) - 2, 0.5), 4) : 1;
    ctx.lineWidth = (isPathLink ? baseWidth * 2 : baseWidth) / globalScale;
    ctx.strokeStyle = isPathLink ? "#fff" : style.color;
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Amount on link
    if (link.amount && globalScale > 0.8 && isHighlighted) {
      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y + tgt.y) / 2;
      const fontSize = Math.max(6, 8 / globalScale);
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isPathLink ? "#fff" : "rgba(255,255,255,0.6)";
      ctx.fillText(formatAmount(link.amount), midX, midY - 6 / globalScale);
    }

    ctx.globalAlpha = 1;
  }, [highlightedIds, graphData.links, activePath]);

  // Path breadcrumb nodes
  const pathNodes = useMemo(() => {
    if (!activePath) return [];
    return activePath.nodeIds.map(id => graphData.nodes.find(n => n.id === id)).filter(Boolean) as GraphNode[];
  }, [activePath, graphData.nodes]);

  return (
    <div className="flex flex-col h-full">
      {/* ═══ HEADER ═══ */}
      <section className="border-b border-border/30 bg-gradient-to-b from-primary/[0.04] to-transparent">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-extrabold text-primary uppercase tracking-[0.15em]">Follow the Money</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
                Influence Network Map
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg mt-0.5">
                See how companies, PACs, politicians, legislation, and industries connect through money and influence.
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
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                  {searchResults.map(c => (
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

      {/* ═══ CONTROLS BAR ═══ */}
      <div className="border-b border-border/30 bg-card/50">
        <div className="px-4 lg:px-6 py-2.5 space-y-2">
          {/* Issue filter row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider shrink-0">Issue:</span>
            {ISSUE_CATEGORIES.slice(0, 8).map(cat => (
              <Button
                key={cat}
                variant={activeIssueFilter === cat ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveIssueFilter(cat)}
                className="rounded-full text-[10px] shrink-0 h-6 px-2.5"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Relationship + controls row */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider shrink-0">Link:</span>
            {RELATIONSHIP_TYPES.map(rt => (
              <Button
                key={rt.key}
                variant={activeRelFilter === rt.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveRelFilter(rt.key)}
                className="rounded-full text-[10px] shrink-0 h-6 px-2.5"
              >
                {rt.label}
              </Button>
            ))}

            <div className="flex-1" />

            <Button
              variant={pathMode ? "default" : "outline"}
              size="sm"
              onClick={() => { setPathMode(!pathMode); setPathStart(null); setPathEnd(null); setActivePath(null); }}
              className="gap-1.5 text-[10px] h-7 shrink-0"
            >
              <Route className="w-3 h-3" />
              Path Trace
            </Button>
            <Button
              variant={strongOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setStrongOnly(!strongOnly)}
              className="gap-1 text-[10px] h-7 shrink-0"
            >
              <Zap className="w-3 h-3" />
              Strong Only
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 shrink-0"
              onClick={() => setShowLabels(!showLabels)}
            >
              {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 shrink-0"
              onClick={resetGraph}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ PATH TRACE BREADCRUMB ═══ */}
      {pathMode && (
        <div className="border-b border-primary/20 bg-primary/[0.04] px-4 lg:px-6 py-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Route className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-primary">Path Trace:</span>

            {!pathStart && (
              <span className="text-xs text-muted-foreground italic">Click a starting node on the graph…</span>
            )}
            {pathStart && !pathEnd && (
              <>
                <Badge className="bg-primary text-primary-foreground text-[10px]">
                  {graphData.nodes.find(n => n.id === pathStart)?.label || "Start"}
                </Badge>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground italic">Click a destination node…</span>
              </>
            )}

            {activePath && pathNodes.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {pathNodes.map((node, i) => (
                  <div key={node.id} className="flex items-center gap-1.5">
                    {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                    <Badge
                      variant="outline"
                      className="text-[10px] gap-1 cursor-pointer hover:bg-accent/50"
                      style={{ borderColor: GROUP_COLORS[node.group] + "60" }}
                      onClick={() => { setSelectedNode(node); }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GROUP_COLORS[node.group] }} />
                      {node.label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {activePath === null && pathStart && pathEnd && (
              <span className="text-xs text-destructive font-medium">No path found between these nodes.</span>
            )}

            {(pathStart || pathEnd) && (
              <Button variant="ghost" size="sm" className="h-5 text-[10px] ml-auto" onClick={() => { setPathStart(null); setPathEnd(null); setActivePath(null); }}>
                Clear Path
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Graph Canvas */}
        <div
          ref={containerRef}
          className={cn(
            "relative overflow-hidden transition-all",
            graphExpanded ? "flex-1" : "flex-1 lg:flex-[2]",
            "bg-[#0B0F1A]"
          )}
          style={{ minHeight: graphExpanded ? 600 : 420 }}
        >
          {/* Active company badge */}
          {selectedCompanyName && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-card/90 backdrop-blur-sm text-foreground border border-border/40 gap-1.5 px-3 py-1.5 shadow-lg">
                <Building2 className="w-3 h-3" />
                {selectedCompanyName}
                <button onClick={resetGraph} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            </div>
          )}

          {/* Top-right controls */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="w-8 h-8 bg-card/90 backdrop-blur-sm" onClick={() => setGraphExpanded(!graphExpanded)}>
              {graphExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="outline" size="icon" className="w-8 h-8 bg-card/90 backdrop-blur-sm" onClick={resetGraph}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Node count */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <Badge variant="outline" className="bg-card/80 backdrop-blur-sm text-[10px] text-muted-foreground border-border/30">
              {graphData.nodes.length} nodes · {graphData.links.length} connections
            </Badge>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
            {Object.entries(GROUP_COLORS).map(([group, color]) => (
              <div key={group} className="flex items-center gap-1.5 text-[9px] text-white/60 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                {group}
              </div>
            ))}
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0B0F1A]/80 backdrop-blur-sm z-20">
              <div className="flex items-center gap-3 text-white/70">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Mapping influence network…</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center max-w-sm">
                <Globe className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white/60 mb-1">No connections match your filters</h3>
                <p className="text-xs text-white/40 mb-3">Try broadening your filters or searching for a different company.</p>
                <Button variant="outline" size="sm" onClick={resetGraph} className="gap-1.5">
                  <RotateCcw className="w-3 h-3" /> Reset Filters
                </Button>
              </div>
            </div>
          )}

          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="transparent"
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              const r = Math.max(6, (node.val || 8));
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fill();
            }}
            linkCanvasObject={paintLink}
            linkDirectionalParticles={(link: any) => link.amount && link.amount > 10000 ? 2 : 0}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={(link: any) =>
              LINK_STYLES[link.linkType]?.color || "rgba(150,150,150,0.5)"
            }
            onNodeHover={(node: any) => {
              setHoveredNode(node?.id || null);
              if (node) {
                const receipts = graphData.links
                  .filter(l => {
                    const src = typeof l.source === "string" ? l.source : l.source.id;
                    const tgt = typeof l.target === "string" ? l.target : l.target.id;
                    return src === node.id || tgt === node.id;
                  })
                  .filter(l => l.amount)
                  .slice(0, 3)
                  .map(l => {
                    const src = typeof l.source === "string" ? l.source : l.source.id;
                    const tgt = typeof l.target === "string" ? l.target : l.target.id;
                    const srcNode = graphData.nodes.find(n => n.id === src);
                    const tgtNode = graphData.nodes.find(n => n.id === tgt);
                    return `${srcNode?.label || src} → ${tgtNode?.label || tgt}: ${formatAmount(l.amount)}`;
                  });
                if (receipts.length > 0) {
                  setHoverTooltip({ x: node.x || 0, y: node.y || 0, text: receipts.join("\n") });
                } else {
                  setHoverTooltip(null);
                }
              } else {
                setHoverTooltip(null);
              }
            }}
            onNodeClick={handleNodeClick}
            onNodeDragEnd={(node: any) => { node.fx = node.x; node.fy = node.y; }}
            d3AlphaDecay={0.015}
            d3VelocityDecay={0.25}
            cooldownTicks={300}
            warmupTicks={100}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
          />
        </div>

        {/* ═══ DETAIL PANEL ═══ */}
        {!graphExpanded && (
          <div className="w-full lg:w-[340px] bg-card border-l border-border/30 overflow-y-auto">
            {selectedNode ? (
              <div className="p-5 space-y-4">
                {/* Node header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: GROUP_COLORS[selectedNode.group] + "22", color: GROUP_COLORS[selectedNode.group] }}
                    >
                      {GROUP_SHAPES[selectedNode.group]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground font-display leading-tight">{selectedNode.label}</h3>
                      <Badge variant="outline" className="text-[9px] mt-0.5">{selectedNode.group}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setSelectedNode(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Party / State (politicians) */}
                {selectedNode.party && (
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedNode.party === "Democrat" ? "default" : "destructive"} className="text-[10px]">
                      {selectedNode.party}
                    </Badge>
                    {selectedNode.state && <span className="text-xs text-muted-foreground">{selectedNode.state}</span>}
                  </div>
                )}

                {/* Amount */}
                {selectedNode.amount && (
                  <div className="p-3 rounded-xl bg-primary/[0.06] border border-primary/10">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Documented Amount</p>
                    <p className="text-xl font-bold font-display text-foreground">{formatAmount(selectedNode.amount)}</p>
                  </div>
                )}

                {/* Metadata summary */}
                {selectedNode.metadata?.summary && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.metadata.summary}</p>
                )}
                {selectedNode.metadata?.industry && (
                  <div className="flex items-center gap-1.5">
                    <Factory className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{selectedNode.metadata.industry}</span>
                  </div>
                )}
                {selectedNode.metadata?.status && (
                  <Badge variant="secondary" className="text-[10px]">{selectedNode.metadata.status}</Badge>
                )}
                {selectedNode.metadata?.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed italic">"{selectedNode.metadata.description}"</p>
                )}

                {/* Issue Areas */}
                {selectedNode.issueCategories && selectedNode.issueCategories.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Issue Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.issueCategories.map(c => (
                        <Badge key={c} variant="secondary" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => setActiveIssueFilter(c)}>
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connections */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Connections ({selectedEdges.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedEdges.map((edge, i) => {
                      const src = typeof edge.source === "string" ? edge.source : edge.source.id;
                      const tgt = typeof edge.target === "string" ? edge.target : edge.target.id;
                      const isSource = src === selectedNode.id;
                      const otherNodeId = isSource ? tgt : src;
                      const otherNode = graphData.nodes.find(n => n.id === otherNodeId);
                      if (!otherNode) return null;
                      const style = LINK_STYLES[edge.linkType];
                      const confLabel = edge.confidence ? CONFIDENCE_LABELS[edge.confidence] : null;

                      return (
                        <button
                          key={i}
                          className="w-full text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/20 hover:border-border/40"
                          onClick={() => { setSelectedNode(otherNode); setHoveredNode(null); }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: GROUP_COLORS[otherNode.group] }} />
                            <span className="text-xs font-semibold text-foreground truncate">{otherNode.label}</span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">{isSource ? "→" : "←"} {edge.label}</span>
                            {style && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {style.label}
                              </span>
                            )}
                            {edge.amount && (
                              <Badge variant="secondary" className="text-[10px] font-mono">{formatAmount(edge.amount)}</Badge>
                            )}
                          </div>
                          {confLabel && (
                            <p className="text-[9px] text-muted-foreground/60 mt-1 italic">{confLabel}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-border/30">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => {
                      setPathMode(true);
                      setPathStart(selectedNode.id);
                      setPathEnd(null);
                      setActivePath(null);
                    }}
                  >
                    <Route className="w-3 h-3" />
                    Trace path from here
                  </Button>
                  {selectedNode.group === "Company" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(selectedNode.label)}`)}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Company Snapshot
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* ═══ DEFAULT PANEL — How to Use + Insights ═══ */
              <div className="p-5 space-y-5">
                {/* Path mode instructions */}
                {pathMode && (
                  <div className="p-3 rounded-xl bg-primary/[0.06] border border-primary/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Route className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Path Trace Mode</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Click two nodes on the graph to trace the path of influence between them. The system will find the shortest connection chain.
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-bold text-foreground font-display mb-1.5">How to use</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Search for a company to map its influence network. <strong>Hover</strong> to trace influence paths. <strong>Click</strong> for details. <strong>Drag</strong> to rearrange. Use <strong>Path Trace</strong> to find connections between any two entities.
                  </p>
                </div>

                {/* Node type legend */}
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Entity Types</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(GROUP_LABELS).map(([group, { icon: Icon, desc }]) => (
                      <div key={group} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: GROUP_COLORS[group] + "22", color: GROUP_COLORS[group] }}>
                          {GROUP_SHAPES[group]}
                        </div>
                        <span className="text-[10px] text-foreground font-medium">{group}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                {insights.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3 text-primary" />
                      What Stands Out
                    </h4>
                    <div className="space-y-2">
                      {insights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/[0.04] border border-primary/10">
                          <Zap className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                          <p className="text-[11px] text-foreground leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connection type legend */}
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Connection Types</h4>
                  <div className="space-y-1">
                    {[
                      { label: "Donation", desc: "FEC-documented financial contribution", color: LINK_STYLES.donation_to_member.color },
                      { label: "Lobbying", desc: "LDA-filed lobbying activity", color: LINK_STYLES.lobbying_on_bill.color },
                      { label: "Dark Money", desc: "501(c)(4) untraceable channel", color: LINK_STYLES.dark_money_channel.color },
                      { label: "Contract", desc: "Federal contract or grant", color: LINK_STYLES.committee_oversight_of_contract.color },
                      { label: "Revolving Door", desc: "Government ↔ private sector", color: LINK_STYLES.revolving_door.color },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-2 py-1">
                        <div className="w-3 h-0.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color.replace(/[\d.]+\)$/, "1)") }} />
                        <div>
                          <p className="text-[10px] font-medium text-foreground">{item.label}</p>
                          <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!selectedCompanyId && (
                  <div className="p-3 rounded-xl bg-primary/[0.06] border border-primary/10">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Demo mode:</strong> Showing a sample influence network.
                      Search for a tracked company to see real data from FEC, lobbying disclosures, and contract records.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ INSIGHTS FOOTER ═══ */}
      {insights.length > 0 && graphExpanded && (
        <div className="border-t border-border/30 bg-card/50 px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">What Stands Out</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {insights.slice(0, 3).map((insight, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                <Zap className="w-3 h-3 text-primary shrink-0" />
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="border-t border-border/30 px-4 lg:px-6 py-2 text-center">
        <p className="text-[9px] text-muted-foreground">
          Built from FEC filings, Senate LDA lobbying disclosures, USASpending.gov contracts, and verified public records.
          Connections labeled "inferred" are pattern-based — not confirmed.
        </p>
      </div>
    </div>
  );
}
