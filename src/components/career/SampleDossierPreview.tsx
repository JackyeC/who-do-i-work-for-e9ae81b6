import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ThumbsUp, ShieldAlert } from "lucide-react";

export function SampleDossierPreview() {
  return (
    <div className="max-w-2xl mx-auto select-none">
      <div className="text-center mb-3">
        <Badge variant="outline" className="text-[10px] bg-muted/50">
          Preview — Search a company above to get your report
        </Badge>
      </div>

      {/* Score Card */}
      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-elevated">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">Amazon</h2>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-destructive/10 border-destructive/30 text-destructive">High Risk</Badge>
            <Badge variant="outline" className="bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))] text-[9px]">High Confidence</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-5">Technology · Washington · 1,500,000 employees</p>

        <div className="text-center py-4">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Employer Clarity Score</div>
          <div className="flex items-end justify-center gap-2">
            <span className="font-data text-6xl sm:text-7xl font-black tabular-nums text-destructive">4.2</span>
            <span className="text-lg text-muted-foreground mb-2">/10</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden max-w-xs mx-auto mt-3">
            <div className="h-full rounded-full bg-destructive" style={{ width: "42%" }} />
          </div>
        </div>

        <p className="text-sm text-foreground/80 text-center mt-3 font-medium">
          High opportunity, high volatility. You're not joining a steady system — you're joining a company mid-reset.
        </p>

        <p className="text-[11px] text-muted-foreground text-center mt-4 italic">
          Sources analyzed: SEC filings, WARN notices, workforce data, compensation signals, and employee sentiment trends
        </p>
      </div>

      {/* Before you accept */}
      <div className="mt-5">
        <h3 className="font-display font-bold text-foreground text-base sm:text-lg flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))]" /> Before you accept:
        </h3>
        <ul className="space-y-2">
          {[
            "Large-scale layoffs underway (30,000 roles through May 2026)",
            "Middle management roles are being eliminated (\"de-layering\")",
            "Mandatory 5-day RTO continues to drive attrition in tech roles",
            "Hiring frozen in generalist roles — surging in AI/AWS infrastructure",
            "Org structure and priorities are actively changing in real time",
          ].map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--civic-yellow))] shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* What this means for you */}
      <div className="mt-5 grid sm:grid-cols-2 gap-4">
        <div className="bg-[hsl(var(--civic-green))]/5 border border-[hsl(var(--civic-green))]/20 rounded-lg p-4">
          <h4 className="font-display font-bold text-sm text-[hsl(var(--civic-green))] flex items-center gap-1.5 mb-2">
            <ThumbsUp className="w-3.5 h-3.5" /> Strong fit if you:
          </h4>
          <ul className="space-y-1.5">
            {[
              "Thrive in high-pressure, fast-moving environments",
              "Are focused on AI, AWS, or infrastructure work",
              "See brand exposure as worth the tradeoffs",
            ].map((s, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[hsl(var(--civic-green))] shrink-0" />{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <h4 className="font-display font-bold text-sm text-destructive flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Risk if you:
          </h4>
          <ul className="space-y-1.5">
            {[
              "Are targeting HR, operations, or middle-management roles",
              "Need remote or hybrid flexibility (non-negotiable RTO)",
              "Prefer predictable org structure or long-term stability",
            ].map((s, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-destructive shrink-0" />{s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
