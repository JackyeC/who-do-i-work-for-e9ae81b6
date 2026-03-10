import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Target, TrendingUp, Zap, MessageCircle } from "lucide-react";

interface Props {
  narrativeSuggestions: string[];
  evpPositioning: string[];
  attractionInsights: string[];
}

export function EVPNarrativePanel({ narrativeSuggestions, evpPositioning, attractionInsights }: Props) {
  return (
    <div className="space-y-4">
      {/* Jackye's Take — Main narrative */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Jackye's Take
          </CardTitle>
          <CardDescription className="text-xs">
            Real talk based on what the data actually says — not what the marketing team wishes it said.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {narrativeSuggestions.map((n, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border text-sm leading-relaxed ${
                n.startsWith("🚨")
                  ? "border-destructive/20 bg-destructive/[0.04] text-foreground"
                  : n.startsWith("✅")
                  ? "border-[hsl(var(--civic-green))]/20 bg-[hsl(var(--civic-green))]/[0.04] text-foreground"
                  : "border-border/50 bg-muted/30 text-foreground"
              }`}
            >
              {n}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* EVP Positioning Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> What You Can Actually Claim
          </CardTitle>
          <CardDescription className="text-xs">
            EVP pillars backed by evidence — use these, skip the rest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {evpPositioning.map((p, i) => (
              <Badge key={i} variant="secondary" className="text-sm py-1.5 px-3 font-medium">{p}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Candidate Attraction Insights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> What Candidates Will Actually Ask
          </CardTitle>
          <CardDescription className="text-xs">
            The questions coming your way based on what's public. Be ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {attractionInsights.map((a, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border text-sm leading-relaxed ${
                a.startsWith("🚩") || a.startsWith("⚠️")
                  ? "border-destructive/20 bg-destructive/[0.04] text-foreground"
                  : a.startsWith("🎯")
                  ? "border-primary/20 bg-primary/[0.04] text-foreground"
                  : "border-border/50 bg-muted/30 text-foreground"
              }`}
            >
              {a}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
