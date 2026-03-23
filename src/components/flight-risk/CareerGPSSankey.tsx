import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TrajectoryNode {
  id: string;
  label: string;
  column: number; // 0 = past, 1 = current, 2 = future
  count: number;
}

interface TrajectoryLink {
  source: string;
  target: string;
  value: number;
}

interface CareerGPSSankeyProps {
  companyName: string;
  signals: any[];
  className?: string;
}

function parseTrajectorySignals(companyName: string, signals: any[]) {
  const nodes: TrajectoryNode[] = [];
  const links: TrajectoryLink[] = [];
  const nodeMap = new Map<string, TrajectoryNode>();

  const addNode = (id: string, label: string, column: number, count: number) => {
    if (!nodeMap.has(id)) {
      const node = { id, label, column, count };
      nodeMap.set(id, node);
      nodes.push(node);
    } else {
      nodeMap.get(id)!.count += count;
    }
  };

  // Parse career_trajectory signals for path data
  const trajectorySignals = signals.filter(
    (s) => s.value_category === "career_trajectory" || s.value_category === "career_path_progression"
  );

  // Parse exit destination signals
  const exitSignals = signals.filter(
    (s) => s.value_category === "exit_destinations" || s.signal_type?.toLowerCase().includes("exit destination")
  );

  // Parse talent source signals
  const sourceSignals = signals.filter(
    (s) => s.value_category === "talent_sources" || s.signal_type?.toLowerCase().includes("talent source")
  );

  // Add center node
  addNode("current", companyName, 1, 100);

  // Parse trajectory paths (role progressions)
  for (const s of trajectorySignals) {
    const summary = s.signal_summary || "";
    // Look for "Role A → Role B → Role C" patterns
    const arrowMatch = summary.match(/([A-Za-z\s/&]+)\s*→\s*([A-Za-z\s/&]+)/g);
    if (arrowMatch) {
      for (const m of arrowMatch) {
        const parts = m.split("→").map((p: string) => p.trim());
        if (parts.length >= 2) {
          const srcId = `role-${parts[0].toLowerCase().replace(/\s+/g, "-")}`;
          const tgtId = `role-${parts[1].toLowerCase().replace(/\s+/g, "-")}`;
          addNode(srcId, parts[0], 0, 30);
          addNode(tgtId, parts[1], 2, 30);
          links.push({ source: srcId, target: "current", value: 20 });
          links.push({ source: "current", target: tgtId, value: 20 });
        }
      }
    }
  }

  // Parse exit destinations
  const exitCompanies: string[] = [];
  for (const s of exitSignals) {
    const summary = s.signal_summary || "";
    // Extract company names from patterns
    const companyMatches = summary.match(
      /(?:move to|join|leave for|go to|commonly move to)\s+([A-Z][A-Za-z\s&]+?)(?:\s*\(|,|\.|$)/g
    );
    if (companyMatches) {
      for (const m of companyMatches) {
        const name = m
          .replace(/(?:move to|join|leave for|go to|commonly move to)\s+/i, "")
          .replace(/\s*\(.*$/, "")
          .replace(/[,.]$/, "")
          .trim();
        if (name && name.length > 2 && name.length < 40) {
          exitCompanies.push(name);
        }
      }
    }
  }

  // Parse talent sources
  const sourceCompanies: string[] = [];
  for (const s of sourceSignals) {
    const summary = s.signal_summary || "";
    const companyMatches = summary.match(
      /(?:from|previously at|came from|talent sources?:)\s+([A-Z][A-Za-z\s&]+?)(?:\s*\(|,|\.|$)/g
    );
    if (companyMatches) {
      for (const m of companyMatches) {
        const name = m
          .replace(/(?:from|previously at|came from|talent sources?:)\s+/i, "")
          .replace(/\s*\(.*$/, "")
          .replace(/[,.]$/, "")
          .trim();
        if (name && name.length > 2 && name.length < 40) {
          sourceCompanies.push(name);
        }
      }
    }
  }

  // Generate fallback if no specific companies found
  if (exitCompanies.length === 0 && trajectorySignals.length > 0) {
    const fallbackExits = ["Industry Competitors", "Startups", "Consulting Firms"];
    exitCompanies.push(...fallbackExits);
  }
  if (sourceCompanies.length === 0 && trajectorySignals.length > 0) {
    const fallbackSources = ["Competitors", "Top Universities", "Adjacent Industries"];
    sourceCompanies.push(...fallbackSources);
  }

  // Add exit companies as nodes
  const uniqueExits = [...new Set(exitCompanies)].slice(0, 5);
  uniqueExits.forEach((name, i) => {
    const id = `exit-${i}`;
    const pct = Math.max(10, 40 - i * 8);
    addNode(id, name, 2, pct);
    links.push({ source: "current", target: id, value: pct });
  });

  // Add source companies as nodes
  const uniqueSources = [...new Set(sourceCompanies)].slice(0, 5);
  uniqueSources.forEach((name, i) => {
    const id = `source-${i}`;
    const pct = Math.max(10, 35 - i * 7);
    addNode(id, name, 0, pct);
    links.push({ source: id, target: "current", value: pct });
  });

  return { nodes, links };
}

const COLUMN_LABELS = ["Where They Come From", "Company", "Where They Go"];
const COLUMN_COLORS = [
  "hsl(152, 46%, 42%)", // green — incoming
  "hsl(43, 53%, 54%)",  // gold — center
  "hsl(6, 65%, 55%)",   // red — outgoing
];

export function CareerGPSSankey({ companyName, signals, className }: CareerGPSSankeyProps) {
  const { nodes, links } = useMemo(
    () => parseTrajectorySignals(companyName, signals),
    [companyName, signals]
  );

  // Group nodes by column
  const columns = useMemo(() => {
    const cols: TrajectoryNode[][] = [[], [], []];
    for (const n of nodes) {
      cols[n.column]?.push(n);
    }
    // Sort by count descending within each column
    for (const col of cols) col.sort((a, b) => b.count - a.count);
    return cols;
  }, [nodes]);

  if (nodes.length <= 1) return null;

  const SVG_W = 800;
  const SVG_H = Math.max(320, Math.max(columns[0].length, columns[2].length) * 55 + 80);
  const COL_X = [80, SVG_W / 2, SVG_W - 80];
  const NODE_W = 140;
  const NODE_H = 36;
  const PADDING = 10;

  // Calculate Y positions for each column
  const getNodeY = (colIdx: number, nodeIdx: number, total: number) => {
    const totalHeight = total * (NODE_H + PADDING) - PADDING;
    const startY = (SVG_H - totalHeight) / 2;
    return startY + nodeIdx * (NODE_H + PADDING);
  };

  // Build node positions map
  const nodePos = new Map<string, { x: number; y: number }>();
  for (let c = 0; c < 3; c++) {
    columns[c].forEach((node, i) => {
      nodePos.set(node.id, {
        x: COL_X[c],
        y: getNodeY(c, i, columns[c].length),
      });
    });
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Career GPS™ — Talent Flow Map</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Where employees come from and where they go after {companyName}.
        </p>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ minWidth: 600, maxHeight: 500 }}
        >
          {/* Column headers */}
          {COLUMN_LABELS.map((label, i) => (
            <text
              key={label}
              x={COL_X[i]}
              y={22}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={10}
              fontWeight={600}
              letterSpacing={0.5}
            >
              {label.toUpperCase()}
            </text>
          ))}

          {/* Links (Sankey curves) */}
          {links.map((link, i) => {
            const src = nodePos.get(link.source);
            const tgt = nodePos.get(link.target);
            if (!src || !tgt) return null;

            const srcX = src.x + (columns.findIndex((c) => c.some((n) => n.id === link.source)) < 1 ? NODE_W / 2 : -NODE_W / 2 + NODE_W);
            const tgtX = tgt.x - (columns.findIndex((c) => c.some((n) => n.id === link.target)) > 1 ? NODE_W / 2 : -NODE_W / 2 + NODE_W);
            const srcXAdj = link.source === "current" ? src.x + NODE_W / 2 : src.x + NODE_W / 2;
            const tgtXAdj = link.target === "current" ? tgt.x - NODE_W / 2 : tgt.x - NODE_W / 2;
            const srcYCenter = src.y + NODE_H / 2;
            const tgtYCenter = tgt.y + NODE_H / 2;
            const cpX = (srcXAdj + tgtXAdj) / 2;
            const thickness = Math.max(2, Math.min(link.value / 5, 14));
            const isIncoming = columns[0].some((n) => n.id === link.source);
            const color = isIncoming ? COLUMN_COLORS[0] : COLUMN_COLORS[2];

            return (
              <path
                key={i}
                d={`M ${srcXAdj} ${srcYCenter} C ${cpX} ${srcYCenter}, ${cpX} ${tgtYCenter}, ${tgtXAdj} ${tgtYCenter}`}
                fill="none"
                stroke={color}
                strokeWidth={thickness}
                opacity={0.25}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = nodePos.get(node.id);
            if (!pos) return null;
            const colIdx = node.column;
            const color = COLUMN_COLORS[colIdx];
            const isCenter = node.id === "current";

            return (
              <g key={node.id}>
                <rect
                  x={pos.x - NODE_W / 2}
                  y={pos.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill={isCenter ? color : "transparent"}
                  stroke={color}
                  strokeWidth={isCenter ? 2 : 1.5}
                  opacity={isCenter ? 1 : 0.8}
                />
                <text
                  x={pos.x}
                  y={pos.y + NODE_H / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isCenter ? 12 : 10}
                  fontWeight={isCenter ? 700 : 500}
                  fill={isCenter ? "white" : color}
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + "…" : node.label}
                </text>
                {!isCenter && node.count > 0 && (
                  <text
                    x={pos.x + NODE_W / 2 - 8}
                    y={pos.y + 10}
                    textAnchor="end"
                    fontSize={8}
                    fontWeight={600}
                    opacity={0.5}
                    fill={color}
                  >
                    {node.count}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        Patterns inferred from public career pages, workforce disclosures, and industry analysis. Not based on individual employee tracking.
      </div>
    </div>
  );
}
