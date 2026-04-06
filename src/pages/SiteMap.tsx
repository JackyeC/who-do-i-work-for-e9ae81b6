import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePageSEO } from "@/hooks/use-page-seo";
import {
  Search, Building2, FileCheck, MessageSquare, Briefcase, LayoutDashboard,
  Users, Bell, Scale, DollarSign, Landmark, Shield, Globe,
  ClipboardCheck, Zap, Network, BookOpen, FileText, Lock, Eye, Receipt
} from "lucide-react";

interface SiteLink {
  label: string;
  path: string;
  icon: React.ElementType;
  auth?: boolean;
  description: string;
  premium?: "candidate" | "professional";
}

interface SiteSection {
  title: string;
  description: string;
  links: SiteLink[];
}

const sections: SiteSection[] = [
  {
    title: "Explore & Research",
    description: "Forensic employer intelligence: receipts, systems, incentives",
    links: [
      { label: "Employer Directory", path: "/browse", icon: Building2, description: "Browse by industry and clarity signals — see who you're actually dealing with" },
      { label: "Search", path: "/search", icon: Search, description: "Search companies, executives, and organizations with source-backed context" },
      { label: "Values-Based Search", path: "/values-search", icon: Eye, description: "Find employers where public signals match the values you care about" },
      { label: "Intelligence Reports", path: "/intelligence", icon: FileText, premium: "candidate", description: "Investigative briefs: what happened, what it means, what to ask next" },
      { label: "Power Networks", path: "/investigative", icon: Network, premium: "candidate", description: "Map influence chains and repeat patterns, not one-off headlines" },
      { label: "Compare Companies", path: "/compare", icon: Scale, description: "Side-by-side signals: money, workforce risk, transparency — your decision" },
      { label: "All Tools", path: "/tools", icon: ClipboardCheck, description: "Curated entry points to every major analyzer on the platform" },
    ],
  },
  {
    title: "Tools & Analyzers",
    description: "Decision intelligence before you sign",
    links: [
      { label: "Quick Check", path: "/check", icon: ClipboardCheck, description: "One flow: employer scan, offer check, or policy map — pick your lane" },
      { label: "Offer check", path: "/offer-check", icon: Eye, description: "Shareable employer reality check: what the record shows before you say yes" },
      { label: "Strategic Offer Review", path: "/strategic-offer-review", icon: FileCheck, premium: "candidate", description: "Deep read on an offer: risk, leverage, and what to verify" },
      { label: "Offer Clarity", path: "/offer-clarity", icon: Zap, premium: "candidate", description: "Upload an offer letter — structured signal scan, not cheerleading" },
      { label: "Employer Receipt", path: "/employer-receipt", icon: Receipt, premium: "candidate", description: "Trace what your labor funds: PACs, lobbying, political footprint" },
      { label: "Employer Promise vs. Reality", path: "/evp-reality-check", icon: Shield, premium: "professional", description: "Brand claims vs. public signals — where they diverge" },
      { label: "What Am I Supporting?", path: "/what-am-i-supporting", icon: Globe, description: "Follow paycheck → political and civic impact with citations" },
    ],
  },
  {
    title: "Career Intelligence",
    description: "Plan and negotiate with the same rigor they use on you",
    links: [
      { label: "Career Intelligence Hub", path: "/career-intelligence", icon: Briefcase, auth: true, description: "Career planning tools grounded in labor-market and skills signals" },
      { label: "Job Board", path: "/jobs", icon: Briefcase, description: "Roles with employer transparency context — know before you apply" },
      { label: "Job Dashboard", path: "/job-dashboard", icon: LayoutDashboard, auth: true, description: "Track applications and matched jobs in one place" },
      { label: "Relationship Intelligence", path: "/relationship-intelligence", icon: Users, auth: true, description: "Network context for who can actually vouch for a team or leader" },
      { label: "Ask Jackye", path: "/ask-jackye", icon: MessageSquare, description: "Decision Q&A on employers and offers — receipts over opinions" },
    ],
  },
  {
    title: "My Dashboard",
    description: "Your tracked employers, alerts, and saved decisions",
    links: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, auth: true, description: "Overview, tracked companies, and settings" },
      { label: "My Offer Checks", path: "/my-offer-checks", icon: ClipboardCheck, auth: true, description: "Saved offer analyses — revisit before you decide" },
      { label: "Signal Alerts", path: "/signal-alerts", icon: Bell, auth: true, premium: "candidate", description: "WARN, lobbying, filings, leadership moves — when the record changes" },
    ],
  },
  {
    title: "Policy & Economy",
    description: "Systems-level context for your next move",
    links: [
      { label: "Policy Hub", path: "/policy", icon: Landmark, description: "Bills and rules that change risk for workers — what to watch" },
      { label: "Economy Dashboard", path: "/economy", icon: DollarSign, description: "Labor and macro indicators translated for job decisions" },
      { label: "Follow the Money", path: "/follow-the-money", icon: DollarSign, premium: "candidate", description: "PACs, lobbying, recipients — follow dollars to incentives" },
      { label: "Board Intelligence", path: "/board-intelligence", icon: Users, premium: "candidate", description: "Who governs: independence, committees, repeat patterns" },
      { label: "Intelligence Chain", path: "/intelligence-chain", icon: Network, description: "How we chain evidence from source to implication" },
    ],
  },
  {
    title: "Resources",
    description: "How WDIWF works and how to engage",
    links: [
      { label: "Pricing", path: "/pricing", icon: DollarSign, description: "Plans and what you get at each tier" },
      { label: "Methodology", path: "/methodology", icon: BookOpen, description: "Sources, scoring, and limits — no black box" },
      { label: "Work with Jackye", path: "/work-with-jackye", icon: Users, description: "Consulting, speaking, and strategic partnerships" },
      { label: "Recruiting Intelligence", path: "/recruiting", icon: Search, description: "Talent leaders: briefs and signals for honest candidate conversations" },
      { label: "Request a Correction", path: "/request-correction", icon: FileText, description: "Flag a data error — we verify against public records" },
      { label: "Privacy Policy", path: "/privacy", icon: Lock, description: "What we collect, why, and your controls" },
      { label: "Terms of Service", path: "/terms", icon: FileText, description: "Platform terms" },
      { label: "Disclaimers", path: "/disclaimers", icon: Shield, description: "Legal limits — intelligence, not legal or financial advice" },
    ],
  },
];

export default function SiteMap() {
  const { user } = useAuth();

  usePageSEO({
    title: "Site Map — Who Do I Work For?",
    description: "Explore all tools, analyzers, and intelligence features available on the Who Do I Work For? career intelligence platform.",
    path: "/site-map",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-10">
          <h1 className="font-serif text-3xl text-foreground mb-2">Platform Directory</h1>
          <p className="font-mono text-xs text-muted-foreground tracking-wider uppercase">
            Every tool, analyzer, and intelligence module — in one place
          </p>
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="mb-4 border-b border-border pb-3">
                <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-primary font-semibold">
                  {section.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.links.map((link) => {
                  const needsAuth = link.auth && !user;
                  return (
                    <Link
                      key={link.path}
                      to={needsAuth ? "/login" : link.path}
                      className="group flex items-start gap-3 p-3 border border-border bg-card hover:border-primary/40 hover:bg-primary/[0.03] transition-all"
                    >
                      <link.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-foreground group-hover:text-primary transition-colors tracking-wide">
                            {link.label}
                          </span>
                          {link.premium && (
                            <span className="font-mono text-xs uppercase tracking-wider px-1.5 py-0.5 bg-accent text-accent-foreground border border-accent/40">
                              {link.premium === "professional" ? "Pro" : "Paid"}
                            </span>
                          )}
                          {link.auth && (
                            <span className="font-mono text-xs uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">
                              Login
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {link.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
