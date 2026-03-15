import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, AlertTriangle, Info } from "lucide-react";

interface LevelsFyiEmbedProps {
  companyName: string;
}

export function LevelsFyiEmbed({ companyName }: LevelsFyiEmbedProps) {
  const [loadError, setLoadError] = useState(false);

  // Normalize company name for Levels.fyi URL (capitalize, remove special chars)
  const encodedName = encodeURIComponent(companyName.trim());
  const embedUrl = `https://www.levels.fyi/charts_embed.html?company=${encodedName}&track=Software%20Engineer`;

  if (loadError) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Compensation data is not available for this company yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Check back later or visit{" "}
            <a href={`https://www.levels.fyi/companies/${encodedName}/salaries`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Levels.fyi
            </a>{" "}
            directly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4.5 h-4.5 text-primary" />
          Compensation & Leveling
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Market compensation data powered by Levels.fyi
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          src={embedUrl}
          title={`${companyName} compensation chart`}
          className="w-full border-0"
          style={{ height: 420 }}
          onError={() => setLoadError(true)}
          sandbox="allow-scripts allow-same-origin"
        />
        {/* Compensation Intelligence Note */}
        <div className="mx-4 mb-4 mt-3 p-3 bg-muted/40 border border-border/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                📊 Intelligence Note
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Compensation data is provided via Levels.fyi and is based on self-reported and verified industry benchmarks.
                While these numbers are the gold standard for tech and corporate roles, they are estimates.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 italic">
                <span className="font-medium text-foreground not-italic">Jackye's Context:</span>{" "}
                A high salary is only one part of the equation. Use this data alongside the Connection Chain
                to see if the company's ethics and stability match the paycheck.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
