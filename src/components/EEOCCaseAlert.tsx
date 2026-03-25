import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Gavel, ExternalLink, ChevronRight } from "lucide-react";
import type { EEOCDroppedCase } from "@/hooks/use-eeoc-cases";

interface Props {
  cases: EEOCDroppedCase[];
}

const ACTION_COLORS: Record<string, string> = {
  moved_to_dismiss: "text-civic-red border-civic-red/30 bg-civic-red/10",
  withdrew: "text-civic-yellow border-civic-yellow/30 bg-civic-yellow/10",
};

export function EEOCCaseAlert({ cases }: Props) {
  if (!cases.length) return null;

  return (
    <Card className="border-civic-red/30 bg-civic-red/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-civic-red">
          <AlertTriangle className="w-4 h-4" />
          EEOC Enforcement Alert
          <Badge variant="outline" className="text-xs ml-auto border-civic-red/30 text-civic-red">
            {cases.length} {cases.length === 1 ? "CASE" : "CASES"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cases.map((c) => (
          <div key={c.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Gavel className="w-3.5 h-3.5 text-civic-red shrink-0" />
              <span className="text-sm font-medium text-foreground">{c.case_name}</span>
              <Badge variant="outline" className={`text-xs ${ACTION_COLORS[c.action_type] || ""}`}>
                {c.action_type === "moved_to_dismiss" ? "MOVED TO DISMISS" : "WITHDREW"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{c.discrimination_type}</p>
            {c.summary && (
              <p className="text-xs text-muted-foreground/80 leading-relaxed">{c.summary}</p>
            )}
            <div className="flex gap-3">
              {c.source_url && (
                <a href={c.source_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Source
                </a>
              )}
            </div>
          </div>
        ))}
        <Link to="/eeoc-tracker" className="text-xs text-primary hover:underline flex items-center gap-1 pt-1">
          View Full EEOC Tracker <ChevronRight className="w-3 h-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
