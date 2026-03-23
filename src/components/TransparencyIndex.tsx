import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryStatus {
  key: string;
  label: string;
  hasSignals: boolean;
}

interface TransparencyIndexProps {
  categories: CategoryStatus[];
}

const ALL_CATEGORIES: { key: string; label: string }[] = [
  { key: "civic-influence", label: "Civic Influence" },
  { key: "workforce-disclosure", label: "Workforce Disclosure" },
  { key: "hiring-technology", label: "Hiring Technology" },
  { key: "compensation-transparency", label: "Compensation Transparency" },
  { key: "worker-benefits", label: "Worker Benefits" },
  { key: "organizational-affiliation", label: "Organizational Affiliations" },
  { key: "worker-sentiment", label: "Worker Sentiment" },
];

/**
 * TransparencyIndex — measures disclosure completeness, NOT company behavior.
 * It counts how many of 7 standard disclosure categories have at least one public signal.
 */
export function TransparencyIndex({ categories }: TransparencyIndexProps) {
  const detected = categories.filter((c) => c.hasSignals).length;
  const total = categories.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Transparency Index
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          This index reflects disclosure completeness, not company behavior.
          It measures how much information is publicly available across standard disclosure categories.
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary line */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl font-bold text-foreground">{detected}</span>
          <span className="text-sm text-muted-foreground">of {total} disclosure categories have public signals.</span>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((cat) => (
            <div
              key={cat.key}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg border",
                cat.hasSignals
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted/30 border-border/50"
              )}
            >
              <span className={cn("text-sm", cat.hasSignals ? "text-foreground" : "text-muted-foreground")}>
                {cat.label}
              </span>
              {cat.hasSignals ? (
                <Badge variant="secondary" className="text-xs">Signal detected</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">No public evidence detected</span>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
          Signals are detected from publicly available sources. This index does not evaluate
          the quality or sufficiency of disclosures.
        </p>
      </CardContent>
    </Card>
  );
}

export { ALL_CATEGORIES };
