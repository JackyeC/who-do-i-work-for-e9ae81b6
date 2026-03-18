import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, AlertTriangle, Info, Lock, Loader2 } from "lucide-react";
import { usePremium } from "@/hooks/use-premium";
import { Link } from "react-router-dom";

interface LevelsFyiEmbedProps {
  companyName: string;
}

export function LevelsFyiEmbed({ companyName }: LevelsFyiEmbedProps) {
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isPremium } = usePremium();

  const encodedName = encodeURIComponent(companyName.trim());
  const salaryUrl = `https://www.levels.fyi/charts_embed.html?company=${encodedName}&track=Software%20Engineer`;
  const levelingUrl = `https://www.levels.fyi/charts_embed.html?company=${encodedName}&track=Software%20Engineer&chart=leveling`;

  // Timeout fallback — if iframe hasn't signaled load after 8s, show error
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        // Don't set error — the iframe may just be slow; show it anyway
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [loading]);

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
        {/* Salary Chart — Free tier */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={salaryUrl}
            title={`${companyName} compensation chart`}
            className="w-full border-0"
            style={{ height: 420 }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setLoadError(true); }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        {/* Title Comparison / Leveling — Pro gate */}
        <div className="mx-4 mt-4 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Title Comparison & Leveling</p>
            {!isPremium && (
              <Badge variant="outline" className="text-xs gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Pro
              </Badge>
            )}
          </div>
          {isPremium ? (
            <iframe
              src={levelingUrl}
              title={`${companyName} leveling chart`}
              className="w-full border-0 rounded-lg border border-border/20"
              style={{ height: 380 }}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="relative rounded-lg border border-border/30 bg-muted/20 overflow-hidden" style={{ height: 200 }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <Lock className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Unlock Title Comparison</p>
                <p className="text-xs text-muted-foreground mb-3">
                  See how compensation maps across engineering levels at {companyName}.
                </p>
                <Link
                  to="/pricing"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Upgrade to Pro →
                </Link>
              </div>
            </div>
          )}
        </div>

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
                <span className="font-medium text-foreground not-italic">Strategic Context:</span>{" "}
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
