import { Globe, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Segment {
  name: string;
  type: "industry" | "customer" | "geographic" | "revenue";
  detail?: string;
}

interface MarketsSegmentsProps {
  segments: Segment[];
  companyName: string;
}

export function MarketsSegmentsLayer({ segments, companyName }: MarketsSegmentsProps) {
  if (!segments || segments.length === 0) {
    return (
      <div className="text-center py-8">
        <Globe className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground">No market segment data available yet for {companyName}.</p>
      </div>
    );
  }

  const grouped = segments.reduce((acc, s) => {
    acc[s.type] = acc[s.type] || [];
    acc[s.type].push(s);
    return acc;
  }, {} as Record<string, Segment[]>);

  const labels: Record<string, string> = {
    industry: "Industries Served",
    customer: "Customer Segments",
    geographic: "Geographic Exposure",
    revenue: "Revenue Segments",
  };

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h4 className="text-caption font-semibold text-foreground mb-2">{labels[type] || type}</h4>
          <div className="flex flex-wrap gap-2">
            {items.map((s, i) => (
              <Badge key={i} variant="secondary" className="text-caption px-3 py-1.5">
                {s.name}
                {s.detail && <span className="text-muted-foreground ml-1.5">· {s.detail}</span>}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
