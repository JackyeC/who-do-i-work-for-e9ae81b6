import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const ISSUE_AREAS = [
  "Immigration", "Climate", "Labor", "Civil Rights",
  "Healthcare", "Firearms", "Consumer Protection",
] as const;

interface Stance {
  topic: string;
  public_position: string;
  gap: string;
}

interface Props {
  stances: Stance[];
}

function matchIssue(topic: string, issue: string): boolean {
  const t = topic.toLowerCase();
  const map: Record<string, string[]> = {
    immigration: ["immigration", "visa", "border", "migrant"],
    climate: ["climate", "environment", "carbon", "emissions", "esg", "sustainability"],
    labor: ["labor", "worker", "union", "wage", "employment"],
    "civil rights": ["civil rights", "discrimination", "dei", "diversity", "equity", "inclusion", "lgbtq", "racial"],
    healthcare: ["health", "medical", "pharma", "insurance"],
    firearms: ["gun", "firearm", "weapon", "second amendment"],
    "consumer protection": ["consumer", "privacy", "data protection", "antitrust"],
  };
  return (map[issue.toLowerCase()] || []).some(kw => t.includes(kw));
}

function getIssueScore(stances: Stance[], issue: string): { count: number; aligned: number; conflict: number } {
  const matched = stances.filter(s => matchIssue(s.topic, issue));
  return {
    count: matched.length,
    aligned: matched.filter(s => s.gap === "aligned").length,
    conflict: matched.filter(s => s.gap === "direct-conflict").length,
  };
}

export function IssueBreakdownGrid({ stances }: Props) {
  if (stances.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        Issue-by-Issue Breakdown
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ISSUE_AREAS.map((issue) => {
          const { count, aligned, conflict } = getIssueScore(stances, issue);
          const status = count === 0 ? "none" : conflict > 0 ? "conflict" : aligned === count ? "aligned" : "mixed";
          return (
            <Card key={issue} className="border-border/30">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{issue}</p>
                  <p className="text-xs text-muted-foreground">
                    {count === 0 ? "No signals" : `${count} signal${count > 1 ? "s" : ""}`}
                  </p>
                </div>
                <Badge
                  variant={status === "aligned" ? "success" : status === "conflict" ? "destructive" : "outline"}
                  className={cn("text-xs", status === "none" && "text-muted-foreground")}
                >
                  {status === "aligned" ? "Aligned" : status === "conflict" ? "Contradiction" : status === "mixed" ? "Mixed" : "No Data"}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
