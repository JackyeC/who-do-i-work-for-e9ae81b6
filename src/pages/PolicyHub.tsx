import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Landmark, Search, ArrowRight, Building2, Users, TrendingUp,
  AlertTriangle, FileText, Briefcase, ChevronRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

// Sample policy impacts — in production these come from the database
const SAMPLE_BILLS = [
  {
    id: "ai-hiring-regulation",
    title: "AI Hiring Regulation Act",
    status: "Introduced",
    statusColor: "bg-civic-yellow/20 text-civic-yellow",
    summary: "Regulates the use of AI systems in hiring decisions, requiring bias audits and transparency disclosures for automated employment tools.",
    industries: ["HR Technology", "Enterprise Software", "Recruiting Platforms"],
    companies: ["Workday", "Eightfold", "Greenhouse", "Lever", "HireVue"],
    careerSignals: [
      "Demand for AI compliance specialists may increase",
      "Talent intelligence analyst roles likely to grow",
      "HR tech product managers need regulatory expertise",
    ],
    workforceImpact: "High",
    issueArea: "Labor Rights",
  },
  {
    id: "clean-energy-transition",
    title: "Clean Energy Workforce Investment Act",
    status: "In Committee",
    statusColor: "bg-civic-blue/20 text-civic-blue",
    summary: "Invests $50B in clean energy workforce training and incentivizes companies transitioning to renewable infrastructure.",
    industries: ["Renewable Energy", "Manufacturing", "Construction", "Utilities"],
    companies: ["NextEra Energy", "First Solar", "Tesla", "Vestas Wind Systems"],
    careerSignals: [
      "Solar installation technician demand projected to grow 27%",
      "Energy auditor roles expanding in commercial sector",
      "Battery storage engineers in high demand",
    ],
    workforceImpact: "Very High",
    issueArea: "Climate",
  },
  {
    id: "healthcare-price-transparency",
    title: "Healthcare Price Transparency Enforcement Act",
    status: "Passed House",
    statusColor: "bg-civic-green/20 text-civic-green",
    summary: "Strengthens enforcement of hospital price transparency rules and expands requirements to insurance companies and pharmacy benefit managers.",
    industries: ["Healthcare", "Health Insurance", "Pharmacy", "Health IT"],
    companies: ["UnitedHealth Group", "CVS Health", "Cigna", "Epic Systems"],
    careerSignals: [
      "Health data analysts needed for compliance reporting",
      "Healthcare compliance officers in higher demand",
      "Revenue cycle management roles evolving",
    ],
    workforceImpact: "Medium",
    issueArea: "Healthcare",
  },
  {
    id: "data-privacy-act",
    title: "American Data Privacy and Protection Act",
    status: "In Committee",
    statusColor: "bg-civic-blue/20 text-civic-blue",
    summary: "Establishes comprehensive federal data privacy standards, granting consumers rights over personal data and imposing obligations on companies handling user information.",
    industries: ["Technology", "Advertising", "E-Commerce", "Financial Services"],
    companies: ["Meta", "Google", "Amazon", "Palantir", "Salesforce"],
    careerSignals: [
      "Privacy engineer roles projected to double",
      "Data protection officer positions becoming mandatory",
      "Compliance automation specialist demand rising",
    ],
    workforceImpact: "High",
    issueArea: "Consumer Protection",
  },
];

const ISSUE_AREAS = ["All", "Labor Rights", "Climate", "Healthcare", "Consumer Protection", "Immigration", "Civil Rights"];

export default function PolicyHub() {
  usePageSEO({
    title: "Policy Intelligence — How Legislation Shapes Careers",
    description: "Track federal bills and regulations that affect companies, industries, and careers. See workforce impact, affected employers, and career signals.",
    path: "/policy",
    jsonLd: {
      "@type": "WebPage",
      name: "Policy Intelligence Hub",
      description: "Track federal bills and regulations affecting companies, industries, and careers. Workforce impact analysis and career signals.",
      isPartOf: { "@type": "WebApplication", name: "Who Do I Work For?" },
    },
  });

  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState("All");
  const navigate = useNavigate();
  const activeView = searchParams.get("view") || "impact";

  const filteredBills = SAMPLE_BILLS.filter(bill => {
    const matchesSearch = !query || bill.title.toLowerCase().includes(query.toLowerCase()) ||
      bill.summary.toLowerCase().includes(query.toLowerCase());
    const matchesIssue = selectedIssue === "All" || bill.issueArea === selectedIssue;
    return matchesSearch && matchesIssue;
  });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border/30 bg-gradient-to-b from-primary/[0.04] to-transparent">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <motion.div initial="hidden" animate="show" className="max-w-3xl">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
              <Landmark className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Policy Intelligence</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1}
              className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3 tracking-tight"
            >
              How legislation shapes industries, companies, and careers
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-2xl">
              Track bills and regulations. See which companies are affected, which industries are growing, and which careers are emerging.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Controls */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search legislation..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ISSUE_AREAS.map(area => (
              <Button
                key={area}
                variant={selectedIssue === area ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedIssue(area)}
                className="rounded-full text-xs"
              >
                {area}
              </Button>
            ))}
          </div>
        </div>

        {/* Bill cards */}
        <div className="space-y-4">
          {filteredBills.map((bill, i) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/policy/${bill.id}`)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Main info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="outline" className={`${bill.statusColor} border-0 text-xs`}>
                              {bill.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {bill.issueArea}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground font-display group-hover:text-primary transition-colors">
                            {bill.title}
                          </h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground/40 shrink-0 group-hover:text-primary transition-colors mt-1" />
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {bill.summary}
                      </p>

                      {/* Impact grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-civic-blue mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Industries</p>
                            <div className="flex flex-wrap gap-1">
                              {bill.industries.slice(0, 3).map(ind => (
                                <span key={ind} className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground">{ind}</span>
                              ))}
                              {bill.industries.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{bill.industries.length - 3}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-civic-gold mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Companies</p>
                            <div className="flex flex-wrap gap-1">
                              {bill.companies.slice(0, 3).map(co => (
                                <span key={co} className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground">{co}</span>
                              ))}
                              {bill.companies.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{bill.companies.length - 3}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Briefcase className="w-4 h-4 text-civic-green mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Career Signals</p>
                            <p className="text-xs text-foreground">{bill.careerSignals[0]}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Workforce impact badge */}
                    <div className="lg:w-32 border-t lg:border-t-0 lg:border-l border-border/30 flex items-center justify-center p-4 bg-muted/30">
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Workforce Impact</p>
                        <Badge variant={bill.workforceImpact === "Very High" ? "destructive" : "default"} className="text-xs">
                          {bill.workforceImpact}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredBills.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No legislation found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
