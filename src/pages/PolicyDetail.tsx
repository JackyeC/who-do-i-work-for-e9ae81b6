import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Landmark, ArrowLeft, Building2, Users, TrendingUp,
  Briefcase, AlertTriangle, ExternalLink, BookOpen, Factory,
  GraduationCap, ChevronRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06 },
  }),
};

// In production this data comes from the database
const BILL_DATA: Record<string, any> = {
  "ai-hiring-regulation": {
    title: "AI Hiring Regulation Act",
    status: "Introduced",
    statusColor: "bg-civic-yellow/20 text-civic-yellow",
    issueArea: "Labor Rights",
    chamber: "Senate",
    sponsors: "Sen. Klobuchar, Sen. Collins",
    dateIntroduced: "Jan 15, 2026",
    plainEnglish: "This bill regulates the use of artificial intelligence systems in hiring decisions. Companies using AI to screen, rank, or reject job candidates must conduct annual bias audits, disclose when AI is being used in the hiring process, and provide candidates with a way to appeal automated decisions. It applies to any employer with more than 50 employees using automated employment decision tools.",
    industries: [
      { name: "HR Technology", impact: "High", description: "Must redesign products to include mandatory bias audit features and candidate notification systems." },
      { name: "Enterprise Software", impact: "Medium", description: "Companies offering AI-powered workforce analytics will need compliance modules." },
      { name: "Recruiting Platforms", impact: "High", description: "Job boards and applicant tracking systems must flag AI-assisted decisions." },
      { name: "Staffing Agencies", impact: "Medium", description: "Temporary staffing firms using AI matching will need audit trails." },
    ],
    companies: [
      { name: "Workday", reason: "Major provider of AI-powered talent management and screening tools", ticker: "WDAY" },
      { name: "Eightfold", reason: "AI-first talent intelligence platform that uses deep learning for candidate matching", ticker: null },
      { name: "Greenhouse", reason: "ATS platform with AI screening features that would require compliance updates", ticker: null },
      { name: "Lever", reason: "Recruiting software with automated candidate scoring", ticker: null },
      { name: "HireVue", reason: "Video interview platform using AI analysis for candidate assessment", ticker: null },
      { name: "Pymetrics", reason: "Uses neuroscience-based games and AI to match candidates to roles", ticker: null },
    ],
    careerSignals: [
      { signal: "AI Compliance Specialist", direction: "up", detail: "Companies will need dedicated roles to manage bias audits and regulatory reporting. Estimated 15,000+ new positions by 2028." },
      { signal: "Talent Intelligence Analyst", direction: "up", detail: "Human oversight of AI hiring decisions creates new analyst roles combining HR domain expertise with data literacy." },
      { signal: "HR Tech Product Manager", direction: "up", detail: "Product teams need managers who understand both AI capabilities and employment law compliance." },
      { signal: "AI Ethics Researcher", direction: "up", detail: "Growing demand for professionals who can evaluate and mitigate bias in employment algorithms." },
      { signal: "Manual Recruiter Roles", direction: "stable", detail: "Companies may increase human recruiter headcount as a hedge against AI compliance costs." },
    ],
    workforceImplications: [
      "Companies must train HR teams on AI disclosure requirements",
      "New bias audit industry expected to generate $2B in consulting revenue",
      "Candidate experience teams will expand to handle appeal processes",
      "Small and mid-size employers may delay AI adoption, widening the tech gap",
    ],
    relatedLegislation: [
      { title: "NYC Local Law 144", description: "New York City's existing automated employment decision tool law" },
      { title: "EU AI Act", description: "European regulation classifying employment AI as 'high-risk'" },
    ],
  },
};

// Fallback for unknown bill IDs
const DEFAULT_BILL = {
  title: "Legislation Detail",
  status: "Unknown",
  statusColor: "bg-muted text-muted-foreground",
  issueArea: "General",
  chamber: "",
  sponsors: "",
  dateIntroduced: "",
  plainEnglish: "Detailed impact analysis for this legislation is being generated. Check back soon for a full breakdown of affected industries, companies, and career signals.",
  industries: [],
  companies: [],
  careerSignals: [],
  workforceImplications: [],
  relatedLegislation: [],
};

export default function PolicyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bill = BILL_DATA[id || ""] || { ...DEFAULT_BILL, title: id?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Unknown Bill" };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="border-b border-border/30 bg-gradient-to-b from-primary/[0.04] to-transparent">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <motion.div initial="hidden" animate="show" className="max-w-4xl">
            <motion.div variants={fadeUp} custom={0}>
              <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" onClick={() => navigate("/policy")}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Policy Hub
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`${bill.statusColor} border-0 text-xs`}>
                {bill.status}
              </Badge>
              <Badge variant="outline" className="text-xs">{bill.issueArea}</Badge>
              {bill.chamber && <Badge variant="outline" className="text-xs">{bill.chamber}</Badge>}
            </motion.div>

            <motion.h1 variants={fadeUp} custom={2}
              className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2 tracking-tight"
            >
              {bill.title}
            </motion.h1>

            {bill.sponsors && (
              <motion.p variants={fadeUp} custom={3} className="text-sm text-muted-foreground">
                Sponsors: {bill.sponsors} · Introduced {bill.dateIntroduced}
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl space-y-8">

          {/* Plain English Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Plain English Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">{bill.plainEnglish}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Industries Affected */}
          {bill.industries.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-display">
                    <Factory className="w-4 h-4 text-civic-blue" />
                    Industries Affected
                    <Badge variant="secondary" className="ml-auto text-xs">{bill.industries.length} industries</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bill.industries.map((ind: any) => (
                      <div key={ind.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">{ind.name}</span>
                            <Badge variant={ind.impact === "High" ? "destructive" : "secondary"} className="text-xs">
                              {ind.impact} Impact
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{ind.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Companies Potentially Affected */}
          {bill.companies.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-display">
                    <Building2 className="w-4 h-4 text-civic-gold" />
                    Companies Potentially Affected
                    <Badge variant="secondary" className="ml-auto text-xs">{bill.companies.length} companies</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bill.companies.map((co: any) => (
                      <div key={co.name}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(co.name)}`)}
                      >
                        <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{co.name}</span>
                            {co.ticker && <span className="text-xs text-muted-foreground font-mono">{co.ticker}</span>}
                            <ChevronRight className="w-3 h-3 text-muted-foreground/40 ml-auto shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{co.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Career Impact Signals */}
          {bill.careerSignals.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-display">
                    <Briefcase className="w-4 h-4 text-civic-green" />
                    Career Impact Signals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bill.careerSignals.map((cs: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          cs.direction === "up" ? "bg-civic-green/20 text-civic-green" : "bg-muted text-muted-foreground"
                        }`}>
                          <TrendingUp className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-foreground">{cs.signal}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{cs.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Workforce Implications */}
          {bill.workforceImplications.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-display">
                    <Users className="w-4 h-4 text-foreground" />
                    Workforce Implications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {bill.workforceImplications.map((imp: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        {imp}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Related Legislation */}
          {bill.relatedLegislation.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-display">
                    <Landmark className="w-4 h-4 text-muted-foreground" />
                    Related Legislation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bill.relatedLegislation.map((rel: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                        <div>
                          <p className="text-sm font-medium text-foreground">{rel.title}</p>
                          <p className="text-xs text-muted-foreground">{rel.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
