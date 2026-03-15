import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, AlertTriangle, DollarSign, Building2, Users, FileText, Briefcase,
  TrendingUp, Eye, Lock, ArrowRight, Search, Star, ExternalLink, Landmark,
  Scale, Globe, Zap, MessageSquare, CheckCircle2
} from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";

/* ── All static mock data — no DB calls, no AI, zero cost ── */

const DEMO_COMPANY = {
  name: "Acme Corp",
  industry: "Technology",
  state: "CA",
  civicScore: 62,
  pacExists: true,
  lobbyingSpend: 4_250_000,
  totalPac: 1_875_000,
  govContracts: 12,
  employeeCount: "10,001+",
  parentCompany: "Globex Holdings",
  confidenceRating: "medium",
};

const DEMO_EXECUTIVES = [
  { name: "Jordan Rivera", title: "CEO", donations: 48_500 },
  { name: "Priya Sharma", title: "CFO", donations: 12_000 },
  { name: "Marcus Johnson", title: "General Counsel", donations: 31_200 },
];

const DEMO_CANDIDATES = [
  { name: "Sen. Lisa Chen", party: "D", amount: 15_000, state: "CA" },
  { name: "Rep. David Brooks", party: "R", amount: 22_500, state: "TX" },
  { name: "Sen. Angela Torres", party: "D", amount: 8_000, state: "NY" },
  { name: "Rep. James O'Brien", party: "R", amount: 18_750, state: "FL" },
];

const DEMO_LOBBYING = [
  { issue: "Data Privacy Regulation", amount: 1_200_000, year: 2024 },
  { issue: "AI Safety Standards", amount: 850_000, year: 2024 },
  { issue: "Tax Reform", amount: 620_000, year: 2023 },
  { issue: "Immigration Policy", amount: 380_000, year: 2023 },
];

const DEMO_SIGNALS = [
  { type: "warning", text: "CEO donated to anti-labor PAC — $15K in Q4 2024", severity: "high" },
  { type: "info", text: "Parent company Globex Holdings lobbied against minimum wage increase", severity: "medium" },
  { type: "positive", text: "Company published pay equity audit — 2024", severity: "low" },
  { type: "warning", text: "3 active EEOC complaints filed in last 18 months", severity: "high" },
  { type: "info", text: "Board member sits on advisory committee for FTC", severity: "medium" },
];

const DEMO_OFFER = {
  salary: "$145,000",
  title: "Senior Product Manager",
  benchmarkMedian: "$152,000",
  benchmarkP75: "$168,000",
  flags: [
    { label: "Below median for role + metro", type: "warning" },
    { label: "Non-compete clause detected — 18 month restriction", type: "danger" },
    { label: "Unlimited PTO (no payout on departure)", type: "caution" },
    { label: "401(k) match at 4% — meets industry standard", type: "ok" },
  ],
};

function scoreColor(score: number) {
  if (score >= 75) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

function scoreGrade(score: number) {
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

const partyColor: Record<string, string> = {
  D: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  R: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
};

const severityStyle: Record<string, string> = {
  high: "border-l-civic-red bg-civic-red/5",
  medium: "border-l-yellow-500 bg-yellow-500/5",
  low: "border-l-green-500 bg-green-500/5",
};

const flagStyle: Record<string, string> = {
  warning: "text-yellow-600 dark:text-yellow-400",
  danger: "text-red-600 dark:text-red-400",
  caution: "text-orange-500 dark:text-orange-400",
  ok: "text-green-600 dark:text-green-400",
};

const Demo = () => {
  const [activeTab, setActiveTab] = useState("report");

  usePageSEO({
    title: "Demo — Who Do I Work For",
    description: "Explore a live demo of career intelligence, employer transparency, and offer analysis — no signup required.",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <Badge variant="outline" className="mb-4 font-mono text-[10px] tracking-widest uppercase border-primary/40 text-primary">
            Interactive Demo — No Signup Required
          </Badge>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
            See What Your Employer Doesn't Tell You
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
            This is a sample report for a fictional company. Every section below is what a real report looks like.
            No data is being fetched — everything here is static demo content. <strong>Zero cost. Zero signup.</strong>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 max-w-xl mx-auto mb-8">
            <TabsTrigger value="report" className="font-mono text-[10px] uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Report
            </TabsTrigger>
            <TabsTrigger value="signals" className="font-mono text-[10px] uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Signals
            </TabsTrigger>
            <TabsTrigger value="offer" className="font-mono text-[10px] uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Offer Check
            </TabsTrigger>
            <TabsTrigger value="jackye" className="font-mono text-[10px] uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Ask Jackye
            </TabsTrigger>
          </TabsList>

          {/* ── REPORT TAB ── */}
          <TabsContent value="report" className="space-y-6">
            {/* Company Header */}
            <Card className="border-t-2 border-t-primary">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="font-serif text-2xl font-bold text-foreground">{DEMO_COMPANY.name}</h2>
                      <Badge variant="outline" className="font-mono text-[9px]">{DEMO_COMPANY.industry}</Badge>
                      <Badge variant="outline" className="font-mono text-[9px]">{DEMO_COMPANY.state}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Owned by <span className="text-primary font-medium">{DEMO_COMPANY.parentCompany}</span>
                    </p>
                  </div>
                  <div className="text-center px-6 py-3 border border-border rounded-lg">
                    <div className={`text-3xl font-bold font-data ${scoreColor(DEMO_COMPANY.civicScore)}`}>
                      {DEMO_COMPANY.civicScore}
                    </div>
                    <div className="font-mono text-[9px] uppercase text-muted-foreground tracking-wider">
                      Civic Score — Grade {scoreGrade(DEMO_COMPANY.civicScore)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: DollarSign, label: "PAC Spending", value: `$${(DEMO_COMPANY.totalPac / 1e6).toFixed(1)}M` },
                { icon: Landmark, label: "Lobbying", value: `$${(DEMO_COMPANY.lobbyingSpend / 1e6).toFixed(1)}M` },
                { icon: Scale, label: "Gov Contracts", value: String(DEMO_COMPANY.govContracts) },
                { icon: Users, label: "Employees", value: DEMO_COMPANY.employeeCount },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="py-4 text-center">
                    <s.icon className="w-4 h-4 mx-auto text-primary mb-1" />
                    <div className="font-data text-lg font-bold text-foreground">{s.value}</div>
                    <div className="font-mono text-[9px] uppercase text-muted-foreground tracking-wider">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Executives */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Executive Donations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DEMO_EXECUTIVES.map(e => (
                    <div key={e.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="text-sm font-medium text-foreground">{e.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{e.title}</div>
                      </div>
                      <div className="font-data text-sm font-semibold text-foreground">
                        ${e.donations.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Political Recipients */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-base flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-primary" />
                  Political Recipients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {DEMO_CANDIDATES.map(c => (
                    <div key={c.name} className="flex items-center justify-between p-3 border border-border rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[9px] ${partyColor[c.party]}`}>{c.party}</Badge>
                        <span className="text-sm text-foreground">{c.name}</span>
                      </div>
                      <span className="font-data text-sm font-semibold">${c.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lobbying */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Lobbying Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DEMO_LOBBYING.map(l => (
                    <div key={l.issue} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="text-sm text-foreground">{l.issue}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{l.year}</div>
                      </div>
                      <div className="font-data text-sm font-semibold">${(l.amount / 1e6).toFixed(2)}M</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SIGNALS TAB ── */}
          <TabsContent value="signals" className="space-y-4">
            <Card className="border-t-2 border-t-primary">
              <CardHeader>
                <CardTitle className="font-serif text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Intelligence Signals for {DEMO_COMPANY.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {DEMO_SIGNALS.map((s, i) => (
                  <div key={i} className={`border-l-[3px] ${severityStyle[s.severity]} p-3 rounded-r-md`}>
                    <div className="flex items-start gap-2">
                      {s.type === "warning" && <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />}
                      {s.type === "info" && <Eye className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                      {s.type === "positive" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />}
                      <div>
                        <div className="text-sm text-foreground">{s.text}</div>
                        <div className="font-mono text-[9px] uppercase text-muted-foreground mt-1">
                          Severity: {s.severity}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── OFFER CHECK TAB ── */}
          <TabsContent value="offer" className="space-y-4">
            <Card className="border-t-2 border-t-primary">
              <CardHeader>
                <CardTitle className="font-serif text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Offer Letter Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 border border-border rounded-lg">
                    <div className="font-data text-xl font-bold text-foreground">{DEMO_OFFER.salary}</div>
                    <div className="font-mono text-[9px] uppercase text-muted-foreground">Your Offer</div>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <div className="font-data text-xl font-bold text-yellow-500">{DEMO_OFFER.benchmarkMedian}</div>
                    <div className="font-mono text-[9px] uppercase text-muted-foreground">Market Median</div>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <div className="font-data text-xl font-bold text-green-500">{DEMO_OFFER.benchmarkP75}</div>
                    <div className="font-mono text-[9px] uppercase text-muted-foreground">75th Percentile</div>
                  </div>
                </div>

                <div className="font-serif text-sm font-semibold text-foreground mb-2">
                  {DEMO_OFFER.title} — Contract Flags
                </div>
                <div className="space-y-2">
                  {DEMO_OFFER.flags.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {f.type === "ok"
                        ? <CheckCircle2 className={`w-4 h-4 shrink-0 ${flagStyle[f.type]}`} />
                        : <AlertTriangle className={`w-4 h-4 shrink-0 ${flagStyle[f.type]}`} />
                      }
                      <span className="text-foreground">{f.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ASK JACKYE TAB ── */}
          <TabsContent value="jackye" className="space-y-4">
            <Card className="border-t-2 border-t-primary">
              <CardHeader>
                <CardTitle className="font-serif text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Ask Jackye — AI Career Coach
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Simulated conversation */}
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">You</div>
                  <p className="text-sm text-foreground">Should I accept this offer from Acme Corp? They're offering $145K for a Senior PM role.</p>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="font-mono text-[10px] text-primary uppercase tracking-wider mb-2">Jackye</div>
                  <p className="text-sm text-foreground leading-relaxed">
                    Here's what I'd tell you if we were sitting across the table: <strong>that number is low.</strong> Market median for your role in your metro is $152K, and strong candidates are pulling $168K at the 75th percentile.
                  </p>
                  <p className="text-sm text-foreground leading-relaxed mt-2">
                    But salary isn't the only flag here. I'm seeing an <strong>18-month non-compete</strong> in their standard contract — that's a career handcuff. And their "unlimited PTO" policy? No payout when you leave. That's not a benefit, that's a savings program for them.
                  </p>
                  <p className="text-sm text-foreground leading-relaxed mt-2">
                    My advice: <strong>counter at $160K</strong>, ask them to strike the non-compete or reduce it to 6 months, and negotiate a minimum PTO floor of 20 days. You have leverage — use it.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">You</div>
                  <p className="text-sm text-foreground">What about the company's political activity? Should I be concerned?</p>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="font-mono text-[10px] text-primary uppercase tracking-wider mb-2">Jackye</div>
                  <p className="text-sm text-foreground leading-relaxed">
                    Depends on what matters to you. Their CEO personally donated $15K to an anti-labor PAC last quarter. Their parent company, Globex Holdings, lobbied against the minimum wage increase. That's worth knowing before you put on their badge every morning.
                  </p>
                  <p className="text-sm text-foreground leading-relaxed mt-2">
                    On the positive side, they did publish a pay equity audit last year — that's more transparency than most. But eyes wide open, always.
                  </p>
                </div>

                <div className="text-center pt-2">
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    This is a simulated conversation showing how Ask Jackye works
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-12 text-center border-t border-border pt-10 pb-6">
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">
            Ready to run your own report?
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Search any real company. Get real data from FEC, USASpending, OpenSecrets, SEC EDGAR, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login">
              <Button size="lg" className="font-mono text-xs uppercase tracking-wider gap-2">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/browse">
              <Button size="lg" variant="outline" className="font-mono text-xs uppercase tracking-wider gap-2">
                <Search className="w-4 h-4" /> Browse Companies
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;
