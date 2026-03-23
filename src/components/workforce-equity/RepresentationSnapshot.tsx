import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Info } from "lucide-react";

interface RepresentationData {
  category: string;
  value: string | null;
  scope: "U.S." | "Global" | "Unknown";
  source?: string;
}

const DEFAULT_CATEGORIES: RepresentationData[] = [
  { category: "Overall Workforce Diversity", value: null, scope: "Unknown" },
  { category: "Leadership Diversity", value: null, scope: "Unknown" },
  { category: "Board Diversity", value: null, scope: "Unknown" },
  { category: "Technical Team Diversity", value: null, scope: "Unknown" },
];

export function RepresentationSnapshot({
  signals,
  companyName,
}: {
  signals: any[];
  companyName: string;
}) {
  // Map signals to representation categories
  const categories = DEFAULT_CATEGORIES.map((cat) => {
    const match = signals.find(
      (s) =>
        s.signal_type?.toLowerCase().includes(cat.category.toLowerCase().split(" ")[0]) ||
        s.value_category === "representation"
    );
    if (match) {
      return {
        ...cat,
        value: match.signal_summary || "Signal detected",
        scope: match.signal_summary?.toLowerCase().includes("global") ? "Global" as const : "U.S." as const,
        source: match.evidence_url,
      };
    }
    return cat;
  });

  const hasAny = categories.some((c) => c.value);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Representation Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className="flex items-start justify-between p-2.5 rounded-lg border border-border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{cat.category}</span>
                  {cat.value && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {cat.scope}
                    </Badge>
                  )}
                </div>
                {cat.value ? (
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.value}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Public reporting not detected in scanned sources
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        {!hasAny && (
          <p className="text-xs text-muted-foreground mt-3">
            {companyName} has not published detectable workforce representation data in scanned sources.
            This represents a transparency gap — not necessarily the absence of programs.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
