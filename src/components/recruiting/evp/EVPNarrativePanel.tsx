import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Target, TrendingUp } from "lucide-react";

interface Props {
  narrativeSuggestions: string[];
  evpPositioning: string[];
  attractionInsights: string[];
}

export function EVPNarrativePanel({ narrativeSuggestions, evpPositioning, attractionInsights }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" /> Recruiting Narrative Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {narrativeSuggestions.map((n, i) => (
            <div key={i} className="p-3 rounded-lg bg-primary/[0.04] border border-primary/10">
              <p className="text-sm text-foreground italic">{n}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> EVP Positioning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {evpPositioning.map((p, i) => (
              <Badge key={i} variant="secondary" className="text-sm py-1.5 px-3">{p}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Candidate Attraction Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {attractionInsights.map((a, i) => (
            <p key={i} className="text-sm text-foreground p-3 rounded-lg bg-muted/30">{a}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
