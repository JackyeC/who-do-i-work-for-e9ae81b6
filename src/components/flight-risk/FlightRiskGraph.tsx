import { useRef, useEffect, useCallback, useMemo } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import type { MovementGraphData } from "@/lib/flightRiskScore";

const NODE_COLORS = {
  center: "hsl(43, 53%, 54%)",    // primary gold
  outgoing: "hsl(6, 65%, 55%)",   // destructive red
  incoming: "hsl(152, 46%, 42%)", // civic green
};

const NODE_SIZES = {
  center: 18,
  outgoing: 10,
  incoming: 10,
};

export function FlightRiskGraph({
  data,
  companyName,
  width,
  height,
}: {
  data: MovementGraphData;
  companyName: string;
  width: number;
  height: number;
}) {
  const fgRef = useRef<ForceGraphMethods>();

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force("charge")?.strength(-200);
      fgRef.current.d3Force("link")?.distance(120);
      // Pin center node
      const centerNode = data.nodes.find((n) => n.type === "center");
      if (centerNode) {
        (centerNode as any).fx = 0;
        (centerNode as any).fy = 0;
      }
      setTimeout(() => fgRef.current?.zoomToFit(400, 40), 300);
    }
  }, [data]);

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const size = NODE_SIZES[node.type as keyof typeof NODE_SIZES] || 8;
      const color = NODE_COLORS[node.type as keyof typeof NODE_COLORS] || "#888";
      const label = node.name || node.id;
      const fontSize = Math.max(10 / globalScale, 2.5);

      // Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Ring for center
      if (node.type === "center") {
        ctx.strokeStyle = "hsl(43, 53%, 40%)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.font = `${node.type === "center" ? "bold " : ""}${fontSize}px IBM Plex Sans, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = node.type === "center" ? color : "hsl(220, 20%, 12%)";
      ctx.fillText(label, node.x, node.y + size + 3);

      // Count badge
      if (node.count && node.type !== "center") {
        const badgeText = `${node.count}`;
        ctx.font = `bold ${fontSize * 0.8}px IBM Plex Sans, sans-serif`;
        const tw = ctx.measureText(badgeText).width;
        ctx.fillStyle = "hsl(220, 14%, 94%)";
        ctx.fillRect(node.x - tw / 2 - 2, node.y - size - fontSize - 2, tw + 4, fontSize + 2);
        ctx.fillStyle = "hsl(220, 20%, 12%)";
        ctx.fillText(badgeText, node.x, node.y - size - fontSize - 1);
      }
    },
    []
  );

  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const start = link.source;
      const end = link.target;
      if (!start || !end || typeof start.x === "undefined") return;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle =
        link.direction === "outgoing"
          ? "hsla(6, 65%, 55%, 0.35)"
          : "hsla(152, 46%, 42%, 0.35)";
      ctx.lineWidth = Math.max(1, Math.min(link.count || 1, 5));
      ctx.stroke();

      // Arrow
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const arrowLen = 6;
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX - arrowLen * Math.cos(angle - Math.PI / 6),
        midY - arrowLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        midX - arrowLen * Math.cos(angle + Math.PI / 6),
        midY - arrowLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle =
        link.direction === "outgoing"
          ? "hsla(6, 65%, 55%, 0.5)"
          : "hsla(152, 46%, 42%, 0.5)";
      ctx.fill();
    },
    []
  );

  if (data.nodes.length === 0) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={width}
        height={height}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          const size = NODE_SIZES[node.type as keyof typeof NODE_SIZES] || 8;
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTime={2000}
        minZoom={0.5}
        maxZoom={4}
      />
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-2 border-t border-border bg-muted/30 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.center }} />
          <span className="text-foreground font-medium">{companyName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.incoming }} />
          <span className="text-muted-foreground">Where they came from</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.outgoing }} />
          <span className="text-muted-foreground">Where they went</span>
        </div>
      </div>
    </div>
  );
}
