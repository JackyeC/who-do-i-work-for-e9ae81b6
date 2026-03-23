import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Download, MapPin, Target, DollarSign, GraduationCap,
  Users, Calendar, CheckCircle2, ArrowRight, TrendingUp,
  Clock, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface CareerReportViewProps {
  track: any;
  currentRole: string;
  currentSkills: string[];
}

function formatSalary(n: number) {
  if (!n) return "N/A";
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n.toLocaleString()}`;
}

export function CareerReportView({ track, currentRole, currentSkills }: CareerReportViewProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const ga = track.gap_analysis || {};
  const salary = ga.salary || {};
  const plan = ga.plan_30_60_90 || {};

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `career-report-${track.target_role.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Career report downloaded!");
    } catch (e) {
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground font-display flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(var(--civic-gold))]" />
          Full Career Report
        </h3>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="gap-1.5">
          <Download className="w-3.5 h-3.5" />
          {downloading ? "Generating..." : "Download Report"}
        </Button>
      </div>

      <div ref={reportRef} className="space-y-4 bg-card rounded-xl p-6 border border-border">
        {/* Report Header */}
        <div className="text-center pb-4 border-b border-border">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Career Roadmap Report</p>
          <h2 className="text-xl font-bold text-foreground font-display">
            {currentRole} → {track.target_role}
          </h2>
          {ga.career_path_label && (
            <Badge variant="outline" className="mt-2">{ga.career_path_label}</Badge>
          )}
          {ga.career_path_summary && (
            <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto">{ga.career_path_summary}</p>
          )}
        </div>

        {/* Section 1: Career Roadmap Overview */}
        <ReportSection icon={MapPin} title="Career Roadmap" number={1}>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-center shrink-0">
              <p className="text-xs text-muted-foreground uppercase">Now</p>
              <p className="text-xs font-semibold text-foreground">{currentRole}</p>
            </div>
            <div className="flex-1 relative h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${track.skills_match_pct}%` }} />
            </div>
            <div className="text-center shrink-0">
              <p className="text-xs text-muted-foreground uppercase">Goal</p>
              <p className="text-xs font-semibold text-foreground">{track.target_role}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <StatBox label="Skills Match" value={`${track.skills_match_pct}%`} color="text-primary" />
            <StatBox label="Est. Timeline" value={`~${ga.estimated_months || "?"}mo`} color="text-foreground" />
            <StatBox label="Difficulty" value={`${ga.difficulty || "?"}/10`} color="text-foreground" />
          </div>
        </ReportSection>

        {/* Section 2: Gap Analysis */}
        <ReportSection icon={Target} title="Gap Analysis" number={2}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Your Matching Skills</p>
              <div className="flex flex-wrap gap-1">
                {(track.completed_skills || []).slice(0, 8).map((s: string, i: number) => (
                  <span key={i} className="text-xs bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] rounded px-1.5 py-0.5">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Skills to Build</p>
              <div className="flex flex-wrap gap-1">
                {(track.missing_skills || []).map((s: string, i: number) => (
                  <span key={i} className="text-xs bg-[hsl(var(--civic-red))]/10 text-[hsl(var(--civic-red))] rounded px-1.5 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ReportSection>

        {/* Section 3: Salary Progression */}
        <ReportSection icon={DollarSign} title="Salary Estimate" number={3}>
          {salary.current && salary.target ? (
            <div className="flex items-end justify-between gap-2">
              <SalaryBar label={currentRole} low={salary.current.low} high={salary.current.high} height={40} />
              {salary.mid?.role && (
                <SalaryBar label={salary.mid.role} low={salary.mid.low} high={salary.mid.high} height={60} />
              )}
              <SalaryBar label={track.target_role} low={salary.target.low} high={salary.target.high} height={80} highlight />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Salary data not available for this path.</p>
          )}
        </ReportSection>

        {/* Section 4: Recommended Training */}
        <ReportSection icon={GraduationCap} title="Recommended Training" number={4}>
          {(ga.recommended_certs || []).length > 0 ? (
            <ul className="space-y-1.5">
              {ga.recommended_certs.map((cert: string, i: number) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <GraduationCap className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  {cert}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Upload your resume to get personalized recommendations.</p>
          )}
        </ReportSection>

        {/* Section 5: Networking Strategy */}
        <ReportSection icon={Users} title="Networking Strategy" number={5}>
          {(ga.networking_tips || []).length > 0 ? (
            <ul className="space-y-1.5">
              {ga.networking_tips.map((tip: string, i: number) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <Users className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Networking tips will appear after analysis.</p>
          )}
        </ReportSection>

        {/* Section 6: 30-60-90 Day Plan */}
        <ReportSection icon={Calendar} title="30-60-90 Day Plan" number={6}>
          {plan.days_30 ? (
            <div className="space-y-3">
              <PlanPhase label="First 30 Days" items={plan.days_30} color="bg-primary" />
              <PlanPhase label="Days 31–60" items={plan.days_60} color="bg-[hsl(var(--civic-gold))]" />
              <PlanPhase label="Days 61–90" items={plan.days_90} color="bg-[hsl(var(--civic-green))]" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Action plan will appear after analysis.</p>
          )}
        </ReportSection>

        {/* Footer */}
        <div className="text-center pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground italic">
            Generated by Who Do I Work For? · {new Date().toLocaleDateString()} · AI-powered estimates, not guarantees
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportSection({ icon: Icon, title, number, children }: {
  icon: any; title: string; number: number; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">{number}</span>
        </div>
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground font-display">{title}</h4>
      </div>
      <div className="ml-8">{children}</div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-bold font-mono", color)}>{value}</p>
    </div>
  );
}

function SalaryBar({ label, low, high, height, highlight }: {
  label: string; low: number; high: number; height: number; highlight?: boolean;
}) {
  return (
    <div className="flex-1 text-center">
      <div
        className={cn(
          "rounded-t-lg mx-auto w-full max-w-[80px] flex items-end justify-center",
          highlight ? "bg-primary/20" : "bg-muted"
        )}
        style={{ height: `${height}px` }}
      >
        <div className={cn(
          "rounded-t-lg w-full",
          highlight ? "bg-primary" : "bg-muted-foreground/30"
        )} style={{ height: `${height * 0.7}px` }} />
      </div>
      <p className="text-xs font-medium text-foreground mt-1 truncate">{label}</p>
      <p className="text-xs text-muted-foreground">
        {formatSalary(low)} – {formatSalary(high)}
      </p>
    </div>
  );
}

function PlanPhase({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("w-2 h-2 rounded-full", color)} />
        <p className="text-xs font-semibold text-foreground">{label}</p>
      </div>
      <ul className="ml-4 space-y-0.5">
        {(items || []).map((item: string, i: number) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
