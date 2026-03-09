import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, TrendingUp, Building2, AlertTriangle, Heart, Briefcase, Target } from "lucide-react";

export function RecruitingInsightsDashboard() {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    companiesWithWarn: 0,
    companiesWithAIHiring: 0,
    topIndustries: [] as { industry: string; count: number }[],
    recentLayoffs: [] as { company_name: string; employees_affected: number; notice_date: string }[],
    competitorInsights: [] as { name: string; industry: string; score: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [companiesRes, warnRes, aiRes, industriesRes, layoffsRes] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("company_warn_notices").select("company_id", { count: "exact", head: true }),
        supabase.from("ai_hiring_signals").select("company_id", { count: "exact", head: true }),
        supabase.from("companies").select("industry").limit(1000),
        supabase.from("company_warn_notices").select("company_id, employees_affected, notice_date").order("notice_date", { ascending: false }).limit(10),
      ]);

      // Count industries
      const industryCounts: Record<string, number> = {};
      (industriesRes.data || []).forEach((c: any) => {
        industryCounts[c.industry] = (industryCounts[c.industry] || 0) + 1;
      });
      const topIndustries = Object.entries(industryCounts)
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Enrich layoffs with company names
      const layoffData = layoffsRes.data || [];
      let enrichedLayoffs: any[] = [];
      if (layoffData.length > 0) {
        const companyIds = [...new Set(layoffData.map((l: any) => l.company_id))];
        const { data: companyNames } = await supabase.from("companies").select("id, name").in("id", companyIds);
        const nameMap = Object.fromEntries((companyNames || []).map((c: any) => [c.id, c.name]));
        enrichedLayoffs = layoffData.map((l: any) => ({
          company_name: nameMap[l.company_id] || "Unknown",
          employees_affected: l.employees_affected,
          notice_date: l.notice_date,
        }));
      }

      // Top scored companies as "talent competitors"
      const { data: topCompanies } = await supabase
        .from("companies")
        .select("name, industry, civic_footprint_score")
        .order("civic_footprint_score", { ascending: false })
        .limit(10);

      setStats({
        totalCompanies: companiesRes.count || 0,
        companiesWithWarn: warnRes.count || 0,
        companiesWithAIHiring: aiRes.count || 0,
        topIndustries,
        recentLayoffs: enrichedLayoffs,
        competitorInsights: (topCompanies || []).map((c: any) => ({
          name: c.name,
          industry: c.industry,
          score: c.civic_footprint_score,
        })),
      });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display text-foreground">Recruiting Insights</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Market intelligence to inform your talent strategy
        </p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.totalCompanies}</p>
            <p className="text-xs text-muted-foreground">Companies Tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.companiesWithWarn}</p>
            <p className="text-xs text-muted-foreground">WARN Notices Filed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.companiesWithAIHiring}</p>
            <p className="text-xs text-muted-foreground">AI Hiring Signals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Briefcase className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.topIndustries.length}</p>
            <p className="text-xs text-muted-foreground">Industries Covered</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Industry Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topIndustries.map((ind) => (
              <div key={ind.industry} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{ind.industry}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, (ind.count / (stats.topIndustries[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{ind.count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Talent Competitors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Top Employer Brands (by Transparency)
            </CardTitle>
            <p className="text-xs text-muted-foreground">Companies that disclose the most about their political spending, lobbying, and governance — not a judgment of good or bad, just who shows their cards</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.competitorInsights.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.industry}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{c.score}/100</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Layoffs */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Recent Layoff Activity
            </CardTitle>
            <p className="text-xs text-muted-foreground">WARN Act notices — potential talent pool opportunities</p>
          </CardHeader>
          <CardContent>
            {stats.recentLayoffs.length > 0 ? (
              <div className="space-y-2">
                {stats.recentLayoffs.map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{l.company_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(l.notice_date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {l.employees_affected?.toLocaleString() || "N/A"} affected
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No recent WARN notices in the database</p>
            )}
          </CardContent>
        </Card>

        {/* Values-based insights */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" /> What Values Signals Attract or Repel Talent?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Attracts Talent</p>
                <div className="space-y-1.5">
                  {["Pay equity & salary transparency", "Strong DEI programs with measurable outcomes", "Remote/flexible work policies", "Environmental commitments with evidence", "Worker benefits beyond industry standard", "Clean AI hiring practices with published audits"].map((s) => (
                    <div key={s} className="flex items-center gap-2 text-sm text-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Repels Talent</p>
                <div className="space-y-1.5">
                  {["Say-Do gaps on public commitments", "Undisclosed AI hiring tools", "Recent mass layoffs without transparency", "Dark money political contributions", "DEI rollbacks or program closures", "Union-busting or labor violations"].map((s) => (
                    <div key={s} className="flex items-center gap-2 text-sm text-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
