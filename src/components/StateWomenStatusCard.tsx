import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateWomenStatusCardProps {
  stateCode: string;
  companyName: string;
  variant?: "full" | "compact";
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-[hsl(var(--civic-green))]/15 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  "A": "bg-[hsl(var(--civic-green))]/15 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  "A-": "bg-[hsl(var(--civic-green))]/15 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  "B+": "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20",
  "B": "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20",
  "B-": "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/20",
  "C+": "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20",
  "C": "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20",
  "C-": "bg-[hsl(var(--civic-yellow))]/15 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
  "D+": "bg-[hsl(var(--civic-red))]/10 text-[hsl(var(--civic-red))] border-[hsl(var(--civic-red))]/20",
  "D": "bg-[hsl(var(--civic-red))]/10 text-[hsl(var(--civic-red))] border-[hsl(var(--civic-red))]/20",
  "D-": "bg-[hsl(var(--civic-red))]/15 text-[hsl(var(--civic-red))] border-[hsl(var(--civic-red))]/30",
  "F": "bg-destructive/10 text-destructive border-destructive/30",
};

const CATEGORIES = [
  { key: "employment_earnings_grade", label: "Employment & Earnings", shortLabel: "Employment" },
  { key: "political_participation_grade", label: "Political Participation", shortLabel: "Politics" },
  { key: "poverty_opportunity_grade", label: "Poverty & Opportunity", shortLabel: "Poverty" },
  { key: "reproductive_rights_grade", label: "Reproductive Rights", shortLabel: "Repro Rights" },
  { key: "health_wellbeing_grade", label: "Health & Well-Being", shortLabel: "Health" },
  { key: "work_family_grade", label: "Work & Family", shortLabel: "Work/Family" },
] as const;

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <Badge variant="outline" className="text-[10px] font-mono">N/A</Badge>;
  const colors = GRADE_COLORS[grade] || "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("text-[10px] font-mono font-bold px-1.5 py-0", colors)}>
      {grade}
    </Badge>
  );
}

export function StateWomenStatusCard({ stateCode, companyName, variant = "full" }: StateWomenStatusCardProps) {
  const { data: stateGrades, isLoading } = useQuery({
    queryKey: ["state-women-status", stateCode],
    queryFn: async () => {
      const { data } = await supabase
        .from("state_women_status_grades" as any)
        .select("*")
        .eq("state_code", stateCode)
        .order("data_year", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
    enabled: !!stateCode && stateCode.length === 2,
  });

  if (isLoading || !stateGrades) return null;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] text-muted-foreground font-medium">
          {stateGrades.state_name} Women's Status:
        </span>
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="flex items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground">{cat.shortLabel}</span>
            <GradeBadge grade={stateGrades[cat.key]} />
          </div>
        ))}
      </div>
    );
  }

  // Count low grades (D or F)
  const lowGrades = CATEGORIES.filter(cat => {
    const g = stateGrades[cat.key];
    return g && (g.startsWith("D") || g === "F");
  });

  const highGrades = CATEGORIES.filter(cat => {
    const g = stateGrades[cat.key];
    return g && (g.startsWith("A") || g.startsWith("B"));
  });

  return (
    <Card className="border-border/40 bg-card">
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <div>
              <h4 className="text-xs font-bold text-foreground">
                State Context: {stateGrades.state_name}
              </h4>
              <p className="text-[10px] text-muted-foreground">
                IWPR Status of Women in the States ({stateGrades.data_year})
              </p>
            </div>
          </div>
          <a
            href={`https://statusofwomendata.org/explore-the-data/state-data/${stateGrades.state_name.toLowerCase().replace(/\s+/g, "-")}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
          >
            Source <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {CATEGORIES.map(cat => (
            <div key={cat.key} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/30 border border-border/20">
              <span className="text-[10px] text-muted-foreground truncate mr-1">{cat.label}</span>
              <GradeBadge grade={stateGrades[cat.key]} />
            </div>
          ))}
        </div>

        {/* Contextual callout */}
        {lowGrades.length > 0 && (
          <div className="text-[10px] text-muted-foreground bg-[hsl(var(--civic-red))]/5 border border-[hsl(var(--civic-red))]/10 rounded-lg px-2.5 py-2">
            <span className="font-semibold text-[hsl(var(--civic-red))]">State context: </span>
            {companyName} is headquartered in {stateGrades.state_name}, which grades poorly on{" "}
            {lowGrades.map(g => g.label.toLowerCase()).join(", ")} for women.
            Company-specific policies may differ from state-level trends.
          </div>
        )}

        {lowGrades.length === 0 && highGrades.length >= 4 && (
          <div className="text-[10px] text-muted-foreground bg-[hsl(var(--civic-green))]/5 border border-[hsl(var(--civic-green))]/10 rounded-lg px-2.5 py-2">
            <span className="font-semibold text-[hsl(var(--civic-green))]">State context: </span>
            {stateGrades.state_name} performs above average for women across most indicators.
          </div>
        )}

        <p className="text-[9px] text-muted-foreground mt-2 italic">
          State-level grades reflect systemic conditions, not individual company practices. Source: Institute for Women's Policy Research.
        </p>
      </CardContent>
    </Card>
  );
}
