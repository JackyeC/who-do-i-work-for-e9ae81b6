import { Network, ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EcosystemEntity {
  name: string;
  type: "subcontractor" | "supplier" | "outsourcing" | "federal_partner";
  relationship?: string;
  value?: number;
  source?: string;
}

interface EcosystemSubcontractorsProps {
  entities: EcosystemEntity[];
  companyName: string;
}

export function EcosystemSubcontractorsLayer({ entities, companyName }: EcosystemSubcontractorsProps) {
  if (!entities || entities.length === 0) {
    return (
      <div className="text-center py-8">
        <Network className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground">No ecosystem data available yet for {companyName}.</p>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    subcontractor: "Subcontractors",
    supplier: "Suppliers",
    outsourcing: "Outsourcing Partners",
    federal_partner: "Federal Contract Partners",
  };

  const grouped = entities.reduce((acc, e) => {
    acc[e.type] = acc[e.type] || [];
    acc[e.type].push(e);
    return acc;
  }, {} as Record<string, EcosystemEntity[]>);

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h4 className="text-caption font-semibold text-foreground mb-2">{typeLabels[type] || type}</h4>
          <div className="space-y-2">
            {items.map((entity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/30">
                <div>
                  <span className="font-medium text-foreground text-body">{entity.name}</span>
                  {entity.relationship && <span className="text-caption text-muted-foreground ml-2">· {entity.relationship}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {entity.value && <span className="text-caption font-mono text-foreground">${(entity.value / 1e6).toFixed(1)}M</span>}
                  {entity.source && <Badge variant="outline" className="text-micro">{entity.source}</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
