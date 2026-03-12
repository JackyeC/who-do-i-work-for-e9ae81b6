import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield, DollarSign, Scale, AlertTriangle,
  MessageSquare, ArrowLeft, BookOpen, Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePageSEO } from "@/hooks/use-page-seo";

const COMMITTEES = [
  {
    name: "Audit Committee",
    icon: Scale,
    what: "Reviews financial statements, oversees internal and external auditing, ensures regulatory compliance, and monitors internal controls.",
    controls: "Financial reporting accuracy, internal audit scope, external auditor selection, whistleblower program oversight, risk assessment for fraud.",
    matters: "If financial statements are misleading, compensation is misreported, or the company hides liabilities, the audit committee is responsible for catching it. For employees, this affects stock-based compensation accuracy and company stability.",
    jackye: "The audit committee is supposed to be the company's integrity checkpoint. If there are accounting irregularities, restatements, or SEC investigations, this is the committee that either caught it — or failed to. Before you accept equity compensation, check whether this committee has a strong track record.",
  },
  {
    name: "Compensation Committee",
    icon: DollarSign,
    what: "Sets executive pay structures, approves bonuses and equity grants, and designs incentive programs for senior leadership.",
    controls: "CEO and C-suite pay packages, annual bonus targets, stock option grants, golden parachute agreements, clawback policies, and say-on-pay recommendations.",
    matters: "Executive incentive design shapes company behavior. If bonuses are tied to short-term revenue, it can encourage layoffs and cost-cutting. If equity is the primary tool, it can drive stock price focus over workforce investment.",
    jackye: "The compensation committee determines how executives get paid — and that shapes everything downstream. If the CEO's bonus is tied to headcount reduction, that affects you. If equity vesting accelerates during acquisition, that's why mergers feel unstable. Always read the proxy statement to understand what behaviors are being rewarded at the top.",
  },
  {
    name: "Governance & Nominating Committee",
    icon: Shield,
    what: "Manages board composition, identifies director candidates, oversees corporate governance policies, and evaluates board effectiveness.",
    controls: "Director nominations, board diversity targets, governance guidelines, committee assignments, board evaluation processes, and shareholder engagement policies.",
    matters: "Board composition determines strategic direction. If the governance committee prioritizes industry insiders over independent voices, groupthink can develop. For employees and candidates, board diversity and independence are leading indicators of accountability.",
    jackye: "This committee controls who gets a seat at the table. If the board is filled with people from the same network — same schools, same companies, same associations — you're looking at an echo chamber. Check whether independent directors actually outnumber insiders, and whether the committee has added any new voices recently.",
  },
  {
    name: "Risk Committee",
    icon: AlertTriangle,
    what: "Identifies and monitors enterprise-level risks including cybersecurity, regulatory, operational, and reputational risks.",
    controls: "Enterprise risk framework, cybersecurity posture, regulatory risk mitigation, business continuity planning, and emerging risk identification.",
    matters: "The risk committee is supposed to see problems coming before they become crises. For employees, this committee's effectiveness determines whether layoffs, data breaches, or regulatory fines catch the company off guard.",
    jackye: "A strong risk committee spots trouble early. A weak one lets it fester until it becomes a crisis that affects everyone — including employees. If you're joining a company, look at whether they've had surprises (sudden layoffs, regulatory fines, security breaches). Those are signs the risk committee wasn't doing its job.",
  },
];

const DOCUMENTS = [
  {
    title: "Proxy Statement (DEF 14A)",
    description: "Annual filing containing executive compensation, board member information, shareholder voting proposals, and governance practices.",
    lookFor: [
      "Executive compensation breakdown (salary, bonus, equity, perks)",
      "Say-on-pay voting results — did shareholders approve exec pay?",
      "Board independence ratios",
      "Related-party transactions",
      "Shareholder proposals on ESG, governance, or compensation",
    ],
    jackye: "The proxy statement is the single most important document for understanding who runs a company and how they're incentivized. Don't just look at the CEO's total pay — look at the performance metrics that trigger bonuses. That tells you what the company actually values.",
  },
  {
    title: "Annual Report (10-K)",
    description: "Comprehensive annual filing covering business operations, financial performance, risk factors, and legal proceedings.",
    lookFor: [
      "Risk factors — what does the company see as threats?",
      "Legal proceedings — any ongoing lawsuits or investigations?",
      "Employee headcount trends year-over-year",
      "Revenue concentration — is the company dependent on a few customers?",
      "Management's Discussion and Analysis (MD&A) for strategic direction",
    ],
    jackye: "The 10-K is dense, but the Risk Factors section is gold. Companies are legally required to disclose what could hurt them. If 'retention of key employees' is listed as a major risk, that tells you they know turnover is a problem. If 'regulatory changes' keeps appearing, they're watching for policy shifts that could reshape their business.",
  },
  {
    title: "Board Governance Guidelines",
    description: "Internal document outlining board structure, director responsibilities, meeting frequency, and oversight mechanisms.",
    lookFor: [
      "Director independence requirements",
      "Board meeting frequency (more meetings = more oversight)",
      "Director stock ownership requirements",
      "Board refreshment and tenure policies",
      "Executive session policies (board meets without management)",
    ],
    jackye: "Governance guidelines show how seriously a board takes its oversight role. If directors are required to own company stock, they have skin in the game. If there's no term limit or refreshment policy, the board might be stale.",
  },
  {
    title: "ESG / Sustainability Report",
    description: "Voluntary disclosure covering environmental impact, social responsibility, workforce metrics, and governance commitments.",
    lookFor: [
      "Workforce diversity metrics and year-over-year trends",
      "Employee engagement scores",
      "Pay equity disclosures",
      "Climate commitments and progress",
      "Supply chain labor standards",
    ],
    jackye: "ESG reports are voluntary, which means companies put in what makes them look good and leave out what doesn't. Compare the promises in the ESG report to the actual signals we detect — if there's a gap between what they say and what they do, that's a Say-Do Gap, and it matters.",
  },
];

export default function BoardIntelligence() {
  usePageSEO({
    title: "Board Intelligence — How Corporate Boards Actually Work | CivicLens",
    description: "Understand corporate board committees, governance structures, and how board decisions affect employees, candidates, and company strategy.",
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Link to="/browse" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to directory
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Board Intelligence</h1>
            <p className="text-sm text-muted-foreground">How corporate boards actually work — and why it matters for your career.</p>
          </div>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Corporate boards make the decisions that shape everything from executive pay to layoffs to political donations.
          Understanding how boards work gives you a strategic advantage whether you're evaluating a job offer, researching a company, or tracking corporate influence.
        </p>
      </div>

      {/* Board Committees */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Board Committees Explained
        </h2>
        <div className="space-y-4">
          {COMMITTEES.map((c) => (
            <Card key={c.name}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <c.icon className="w-4 h-4 text-primary" />
                  {c.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What it does</p>
                  <p className="text-sm text-foreground/80">{c.what}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What it controls</p>
                  <p className="text-sm text-foreground/80">{c.controls}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why it matters</p>
                  <p className="text-sm text-foreground/80">{c.matters}</p>
                </div>
                <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Jackye Explains</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{c.jackye}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="mb-10" />

      {/* Board Documents */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Board Documents — What to Look For
        </h2>
        <div className="space-y-4">
          {DOCUMENTS.map((doc) => (
            <Card key={doc.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{doc.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground/80">{doc.description}</p>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">What to look for</p>
                  <ul className="space-y-1">
                    {doc.lookFor.map((item, i) => (
                      <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Jackye Explains</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{doc.jackye}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Users className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">Ready to investigate?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Search for any company to see its leadership, board composition, and influence connections.
          </p>
          <Button asChild>
            <Link to="/search">Search a Company</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
