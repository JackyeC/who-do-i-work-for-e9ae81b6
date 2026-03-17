import { useApplicationsTracker } from "@/hooks/use-job-matcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Target, Clock, Briefcase } from "lucide-react";

const STAGE_ORDER = ["Draft", "Submitted", "Interviewing", "Offered", "Rejected", "Withdrawn"];
const STAGE_COLORS: Record<string, string> = {
  Draft: "hsl(var(--muted-foreground))",
  Submitted: "hsl(217, 91%, 60%)",
  Interviewing: "hsl(45, 93%, 47%)",
  Offered: "hsl(142, 71%, 45%)",
  Rejected: "hsl(0, 84%, 60%)",
  Withdrawn: "hsl(var(--muted-foreground))",
};

export function ApplicationAnalytics() {
  const { applications, isLoading } = useApplicationsTracker();

  if (isLoading) {
    return <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-48 w-full" />)}</div>;
  }

  if (!applications?.length) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No analytics yet</h3>
          <p className="text-sm text-muted-foreground">Start applying to jobs to see your pipeline analytics.</p>
        </CardContent>
      </Card>
    );
  }

  const total = applications.length;
  const pastSubmitted = applications.filter((a: any) =>
    ["Interviewing", "Offered"].includes(a.status)
  ).length;
  const submitted = applications.filter((a: any) => a.status !== "Draft").length;
  const responseRate = submitted > 0 ? Math.round((pastSubmitted / submitted) * 100) : 0;

  // Pipeline funnel data
  const funnelData = STAGE_ORDER.map(stage => ({
    name: stage,
    count: applications.filter((a: any) => a.status === stage).length,
  })).filter(d => d.count > 0);

  // Industry breakdown
  const industryMap: Record<string, number> = {};
  applications.forEach((a: any) => {
    const key = a.company_name || "Unknown";
    industryMap[key] = (industryMap[key] || 0) + 1;
  });
  const companyData = Object.entries(industryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, count }));

  // Alignment score distribution
  const alignmentBuckets = [
    { range: "0-25%", count: 0 },
    { range: "26-50%", count: 0 },
    { range: "51-75%", count: 0 },
    { range: "76-100%", count: 0 },
  ];
  applications.forEach((a: any) => {
    const score = a.alignment_score || 0;
    if (score <= 25) alignmentBuckets[0].count++;
    else if (score <= 50) alignmentBuckets[1].count++;
    else if (score <= 75) alignmentBuckets[2].count++;
    else alignmentBuckets[3].count++;
  });

  const avgAlignment = Math.round(
    applications.reduce((s: number, a: any) => s + (a.alignment_score || 0), 0) / total
  );

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Briefcase className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Apps</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{responseRate}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Response Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{avgAlignment}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Alignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{pastSubmitted}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pipeline Funnel</CardTitle>
          <CardDescription className="text-xs">Applications by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {funnelData.map((entry) => (
                    <Cell key={entry.name} fill={STAGE_COLORS[entry.name] || "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Companies */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Companies</CardTitle>
            <CardDescription className="text-xs">Where you've applied most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyData} margin={{ left: 0, right: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={40} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alignment Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Alignment Distribution</CardTitle>
            <CardDescription className="text-xs">Civic alignment scores of applied companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alignmentBuckets} margin={{ left: 0, right: 8 }}>
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--accent-foreground))" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
