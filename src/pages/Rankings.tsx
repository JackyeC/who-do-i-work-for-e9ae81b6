import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp, Shield, AlertTriangle, DollarSign, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type RankingCategory = "overall" | "stability" | "transparency" | "governance" | "mobility";

const categoryConfig: Record<RankingCategory, { label: string; icon: any; description: string }> = {
  overall: { label: "Overall CBI", icon: Trophy, description: "Corporate Behavior Index — composite employer responsibility score" },
  stability: { label: "Workforce Stability", icon: Shield, description: "Low layoffs, strong retention, and positive worker sentiment" },
  transparency: { label: "Pay Transparency", icon: DollarSign, description: "Published salary bands, pay equity reporting, compensation disclosure" },
  governance: { label: "Governance", icon: BarChart3, description: "Board independence, SEC reporting, low dark money connections" },
  mobility: { label: "Career Mobility", icon: TrendingUp, description: "Internal promotion signals, career paths, leadership diversity" },
};

function rankBadge(rank: number) {
  if (rank === 1) return "bg-[hsl(var(--civic-yellow))]/20 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30";
  if (rank === 2) return "bg-muted text-muted-foreground border-border";
  if (rank === 3) return "bg-primary/10 text-primary border-primary/20";
  return "bg-muted/50 text-muted-foreground border-border/50";
}

export default function Rankings() {
  const [category, setCategory] = useState<RankingCategory>("overall");
  const [industry, setIndustry] = useState<string>("all");

  const { data: companies, isLoading } = useQuery({
    queryKey: ["rankings-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state, civic_footprint_score, confidence_rating, record_status, employee_count")
        .in("record_status", ["verified", "partially_verified", "research_in_progress"])
        .order("civic_footprint_score", { ascending: true })
        .limit(100);
      return data || [];
    },
  });

  const { data: benchmarks } = useQuery({
    queryKey: ["rankings-benchmarks"],
    queryFn: async () => {
      const { data } = await supabase.from("company_benchmarks").select("*");
      return data || [];
    },
  });

  // Build ranked list
  const ranked = (companies || []).map((c: any) => {
    const bench = benchmarks?.find((b: any) => b.company_id === c.id);
    return { ...c, benchmark: bench };
  }).filter((c: any) => industry === "all" || c.industry === industry);

  // Sort by category
  const sorted = [...ranked].sort((a, b) => {
    // Lower civic_footprint_score = more transparent = better
    if (category === "overall") return a.civic_footprint_score - b.civic_footprint_score;
    if (category === "transparency") return (a.benchmark?.transparency_grade || "F").localeCompare(b.benchmark?.transparency_grade || "F");
    return a.civic_footprint_score - b.civic_footprint_score;
  });

  const industries = [...new Set((companies || []).map((c: any) => c.industry))].sort();

  const Cat = categoryConfig[category];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Company Rankings</h1>
        <p className="text-muted-foreground">
          Data-driven employer rankings powered by the Corporate Behavior Index™. Based on public filings, not employer branding.
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as RankingCategory)} className="mb-6">
        <TabsList className="flex-wrap h-auto gap-1">
          {(Object.entries(categoryConfig) as [RankingCategory, typeof Cat][]).map(([key, cfg]) => (
            <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
              <cfg.icon className="w-3.5 h-3.5" />
              {cfg.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Industry filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button variant={industry === "all" ? "default" : "outline"} size="sm" onClick={() => setIndustry("all")}>All Industries</Button>
        {industries.slice(0, 8).map((ind) => (
          <Button key={ind} variant={industry === ind ? "default" : "outline"} size="sm" onClick={() => setIndustry(ind)} className="text-xs">
            {ind}
          </Button>
        ))}
      </div>

      {/* Description */}
      <Card className="mb-6 border-primary/15 bg-primary/[0.02]">
        <CardContent className="p-4 flex items-start gap-3">
          <Cat.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground text-sm">{Cat.label} Rankings</p>
            <p className="text-xs text-muted-foreground">{Cat.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading rankings...</div>
          ) : sorted.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No companies match this filter.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead className="text-center">CBI Score</TableHead>
                  <TableHead className="text-center">Confidence</TableHead>
                  <TableHead className="text-right">Employees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.slice(0, 50).map((c, i) => (
                  <TableRow key={c.id} className="hover:bg-primary/[0.03]">
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-xs w-7 justify-center", rankBadge(i + 1))}>
                        {i + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link to={`/company/${c.slug}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {c.name}
                      </Link>
                      <div className="text-[10px] text-muted-foreground">{c.state}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{c.industry}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("font-bold text-lg",
                        c.civic_footprint_score <= 25 ? "text-[hsl(var(--civic-green))]" :
                        c.civic_footprint_score <= 50 ? "text-[hsl(var(--civic-blue))]" :
                        c.civic_footprint_score <= 75 ? "text-[hsl(var(--civic-yellow))]" :
                        "text-destructive"
                      )}>
                        {c.civic_footprint_score}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px]">{c.confidence_rating}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {c.employee_count || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Rankings based on public filings, FEC data, SEC EDGAR, BLS, WARN Act, and other government sources. Updated automatically.
      </p>
    </div>
  );
}
