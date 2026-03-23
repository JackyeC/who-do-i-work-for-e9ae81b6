import { motion } from "framer-motion";
import { Shield, Clock, DollarSign, Users, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RRSResult } from "@/lib/recruiterRealityScore";

const CATEGORY_ICONS: Record<string, any> = {
  response_transparency: Clock,
  interview_efficiency: Users,
  salary_transparency: DollarSign,
  candidate_experience: Shield,
  process_integrity: CheckCircle2,
};

const LEVEL_COLORS: Record<string, string> = {
  High: "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/30",
  Medium: "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/30",
  Low: "text-destructive bg-destructive/10 border-destructive/30",
};

const BAND_COLORS: Record<string, string> = {
  transparent: "border-[hsl(var(--civic-green))]/40",
  decent: "border-[hsl(var(--civic-blue))]/40",
  mixed: "border-[hsl(var(--civic-yellow))]/40",
  opaque: "border-destructive/30",
  ghosting_risk: "border-destructive/50",
};

interface RecruiterRealityScoreCardProps {
  result: RRSResult;
  companyName: string;
}

export function RecruiterRealityScoreCard({ result, companyName }: RecruiterRealityScoreCardProps) {
  const scoreColor = result.score >= 65 ? "text-[hsl(var(--civic-green))]"
    : result.score >= 45 ? "text-[hsl(var(--civic-yellow))]"
    : "text-destructive";

  return (
    <Card className={cn("overflow-hidden border-2", BAND_COLORS[result.band])}>
      <div className="h-1 bg-gradient-to-r from-[hsl(var(--civic-blue))] via-primary to-[hsl(var(--civic-green))]" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-1">Recruiter Reality Score™</p>
            <CardTitle className="text-lg">{companyName}</CardTitle>
          </div>
          <div className="text-right">
            <motion.span
              className={cn("text-4xl font-bold tabular-nums font-display", scoreColor)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {result.score}
            </motion.span>
            <span className="text-sm text-muted-foreground ml-1">/ 100</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">{result.label}</Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Info className="w-3 h-3" />
            {result.confidence} Confidence
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category scores */}
        <div className="grid sm:grid-cols-2 gap-2">
          {result.categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.key] || Shield;
            return (
              <div key={cat.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                </div>
                <Badge className={cn("text-xs border", LEVEL_COLORS[cat.level])}>
                  {cat.level}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Interpretation */}
        <div className="p-3 rounded-lg bg-primary/[0.04] border border-primary/10">
          <p className="text-sm text-foreground leading-relaxed">{result.interpretation}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          The Recruiter Reality Score™ evaluates observable recruiting signals — not employer branding claims.
        </p>
      </CardContent>
    </Card>
  );
}
