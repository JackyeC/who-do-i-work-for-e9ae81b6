import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SignalsThisWeek } from "@/components/intelligence/SignalsThisWeek";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  FileText, Search, Calendar, User, ArrowRight, Sparkles,
  Filter, Shield, Loader2
} from "lucide-react";

const REPORT_TYPE_LABELS: Record<string, string> = {
  intelligence_report: "Evidence Receipt",
  weekly_brief: "Weekly Brief",
  issue_audit: "Signal Audit",
  company_alignment_report: "Employer Alignment",
  legislative_watch: "Legislative Watch",
  policy_alert: "Policy Signal Report",
};

const ISSUE_OPTIONS = [
  "gun_policy", "reproductive_rights", "labor_rights", "climate",
  "civil_rights", "lgbtq_rights", "voting_rights", "immigration",
  "education", "healthcare", "consumer_protection", "ai_bias",
  "animal_welfare", "dei_workplace_equity",
];

export default function IntelligenceReports() {
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get("type");
  const isSignalsView = urlType === "weekly_brief";

  const [searchText, setSearchText] = useState("");
  const [issueFilter, setIssueFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["intelligence-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_reports" as any)
        .select("*")
        .eq("status", "published")
        .order("publication_date", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const filtered = (reports || []).filter((r: any) => {
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      if (!r.title?.toLowerCase().includes(q) && !r.subtitle?.toLowerCase().includes(q) && !r.executive_summary?.toLowerCase().includes(q)) return false;
    }
    if (issueFilter !== "all" && r.primary_issue_category !== issueFilter) return false;
    if (typeFilter !== "all" && r.report_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/3" />
          <div className="container mx-auto px-4 py-16 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="w-3 h-3" /> {isSignalsView ? "Employer Reality Signals" : "Evidence Receipts"}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4">
                {isSignalsView ? "Employer Signals This Week" : "Evidence Receipts"}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {isSignalsView
                  ? "Employer reality signals auto-detected from public filings, federal databases, and verified web sources."
                  : "Structured evidence receipts linking employer signals, policy influence, and workforce data — backed by documented public records."}
              </p>
            </div>
          </div>
        </section>

        {isSignalsView ? (
          <section className="container mx-auto px-4 py-8">
            <SignalsThisWeek />
          </section>
        ) : (
        <section className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search evidence receipts..." className="pl-10" />
            </div>
            <Select value={issueFilter} onValueChange={setIssueFilter}>
              <SelectTrigger className="w-[180px]"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Signal Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ISSUE_OPTIONS.map(i => <SelectItem key={i} value={i}>{i.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]"><FileText className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Report Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(REPORT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No evidence receipts found</h3>
              <p className="text-sm text-muted-foreground">
                {reports?.length === 0 ? "Evidence receipts will appear here as they are published." : "Try adjusting your filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl">
              {filtered.map((r: any) => {
                const issueCats: string[] = r.issue_categories_json || [];
                return (
                  <Link key={r.id} to={`/intelligence/${r.slug}`}>
                    <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                            {REPORT_TYPE_LABELS[r.report_type] || r.report_type}
                          </Badge>
                          {issueCats.slice(0, 3).map((cat: string) => (
                            <Badge key={cat} variant="outline" className="text-[10px] capitalize">{cat.replace(/_/g, " ")}</Badge>
                          ))}
                        </div>
                        <h2 className="text-lg font-display font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                          {r.title}
                        </h2>
                        {r.subtitle && <p className="text-sm text-muted-foreground mb-3">{r.subtitle}</p>}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.author_name}</span>
                          {r.publication_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(r.publication_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {r.verification_status?.replace(/_/g, " ")}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
