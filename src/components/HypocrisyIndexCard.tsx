import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquareWarning } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SayDoGapData {
  chiScore: number; // 0-100
  grade: string;
  directConflicts: number;
  indirectConflicts: number;
  alignedStances: number;
  totalStances: number;
}

/** @deprecated Use SayDoGapData instead */
export type HypocrisyIndex = SayDoGapData;

function gapColor(score: number) {
  if (score >= 70) return "text-civic-red";
  if (score >= 40) return "text-civic-yellow";
  return "text-civic-green";
}

function gradeStyle(grade: string) {
  if (["A", "A+", "A-"].includes(grade)) return "bg-civic-green/10 text-civic-green border-civic-green/30";
  if (["B", "B+", "B-"].includes(grade)) return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30";
  return "bg-civic-red/10 text-civic-red border-civic-red/30";
}

export function HypocrisyIndexCard({ data }: { data: SayDoGapData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquareWarning className="w-5 h-5 text-primary" />
          Say-Do Gap™
          <Badge className={cn("ml-auto text-sm", gradeStyle(data.grade))}>{data.grade}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Measures the gap between public statements and actual political spending. Lower = more consistent.
        </p>
      </CardHeader>
      <CardContent>
        {/* Score gauge */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={data.chiScore >= 70 ? "hsl(var(--civic-red))" : data.chiScore >= 40 ? "hsl(var(--civic-yellow))" : "hsl(var(--civic-green))"}
                strokeWidth="8"
                strokeDasharray={`${data.chiScore * 2.64} 264`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-2xl font-bold", gapColor(data.chiScore))}>{data.chiScore}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Direct Conflicts</span>
              <span className="font-medium text-civic-red">{data.directConflicts}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Indirect Conflicts</span>
              <span className="font-medium text-civic-yellow">{data.indirectConflicts}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Aligned Stances</span>
              <span className="font-medium text-civic-green">{data.alignedStances}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-border pt-1">
              <span className="text-muted-foreground">Total Stances Analyzed</span>
              <span className="font-medium text-foreground">{data.totalStances}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-civic-red" /> Direct (100% weight)</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-civic-yellow" /> Indirect (50% weight)</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-civic-green" /> Aligned (0% weight)</div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">
          Score = (Direct Conflicts × 100% + Indirect Conflicts × 50%) / Total Stances × 100.
          A score of 0 means perfect alignment; 100 means maximum disconnect.
        </p>
      </CardContent>
    </Card>
  );
}
