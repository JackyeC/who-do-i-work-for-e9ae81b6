import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePageSEO } from "@/hooks/use-page-seo";
import {
  Search, Building2, FileCheck, MessageSquare, Briefcase, LayoutDashboard,
  Route, Users, Bell, Scale, DollarSign, Landmark, Shield, Globe, Map,
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
    description: "Discover employers, non-profits, and power networks",
    links: [
      { label: "Employer Directory", path: "/browse", icon: Building2, description: "Browse companies by industry and civic footprint" },
      { label: "Search", path: "/search", icon: Search, description: "Search any company, executive, or organization" },
      { label: "Values-Based Search", path: "/values-search", icon: Eye, description: "Find employers aligned with your values" },
      { label: "Intelligence Reports", path: "/intelligence", icon: FileText, premium: "candidate", description: "Published investigative intelligence briefs" },
      { label: "Power Networks", path: "/investigative", icon: Network, premium: "candidate", description: "Explore entity relationships and influence chains" },
      { label: "Compare Companies", path: "/compare", icon: Scale, description: "Side-by-side employer comparison" },
    ],
  },
  {
    title: "Tools & Analyzers",
    description: "Evaluate employers and offers before you commit",
    links: [
      { label: "Quick Check", path: "/check", icon: ClipboardCheck, description: "Instant employer scan, offer check, or policy map" },
      { label: "Strategic Offer Review", path: "/strategic-offer-review", icon: FileCheck, premium: "candidate", description: "Deep-dive analysis of a job offer" },
      { label: "Offer Clarity", path: "/offer-clarity", icon: Zap, premium: "candidate", description: "Upload an offer letter for AI-powered review" },
      { label: "Would You Work Here?", path: "/would-you-work-here", icon: Eye, description: "Shareable employer reality check" },
      { label: "Employer Receipt", path: "/employer-receipt", icon: Receipt, premium: "candidate", description: "See what your labor really funds" },
      { label: "Employer Promise vs. Reality", path: "/employer-promise-check", icon: Shield, premium: "professional", description: "Does the employer brand match reality?" },
      { label: "What Am I Supporting?", path: "/what-am-i-supporting", icon: Globe, description: "Trace your paycheck to political influence" },
    ],
  },
  {
    title: "Career Intelligence",
    description: "Plan your career with data-driven insights",
    links: [
      { label: "Career Intelligence Hub", path: "/career-intelligence", icon: Briefcase, auth: true, description: "AI-powered career planning tools" },
      { label: "Career Map", path: "/career-map", icon: Route, auth: true, description: "Visualize your career trajectory" },
      { label: "Job Dashboard", path: "/job-dashboard", icon: LayoutDashboard, auth: true, description: "Track applications and matched jobs" },
      { label: "Relationship Intelligence", path: "/relationship-intelligence", icon: Users, auth: true, description: "Manage your professional network" },
      { label: "Ask Jackye", path: "/ask-jackye", icon: MessageSquare, description: "AI career coach powered by Jackye Clayton" },
    ],
  },
  {
    title: "My Dashboard",
    description: "Your personal career intelligence command center",
    links: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, auth: true, description: "Overview, tracked companies, and settings" },
      { label: "My Offer Checks", path: "/my-offer-checks", icon: ClipboardCheck, auth: true, description: "Saved offer analysis reports" },
      { label: "Signal Alerts", path: "/signal-alerts", icon: Bell, auth: true, premium: "candidate", description: "Real-time employer change notifications" },
    ],
  },
  {
    title: "Policy & Economy",
    description: "Macro-level intelligence on labor and politics",
    links: [
      { label: "Policy Hub", path: "/policy", icon: Landmark, description: "Track legislation affecting workers" },
      { label: "Economy Dashboard", path: "/economy", icon: DollarSign, description: "Labor market and economic indicators" },
      { label: "Follow the Money", path: "/follow-the-money", icon: DollarSign, premium: "candidate", description: "Trace corporate political spending" },
      { label: "Board Intelligence", path: "/board-intelligence", icon: Users, premium: "candidate", description: "Corporate board member analysis" },
      { label: "Intelligence Chain", path: "/intelligence-chain", icon: Network, description: "Evidence chain methodology" },
    ],
  },
  {
    title: "Resources",
    description: "About the platform and how it works",
    links: [
      { label: "Pricing", path: "/pricing", icon: DollarSign, description: "Plans and features" },
      { label: "Methodology", path: "/methodology", icon: BookOpen, description: "How we source and score signals" },
      { label: "Work with Jackye", path: "/work-with-jackye", icon: Users, description: "Consulting and speaking engagements" },
      { label: "Recruiting Intelligence", path: "/recruiting", icon: Search, description: "Tools for talent acquisition pros" },
      { label: "Request a Correction", path: "/request-correction", icon: FileText, description: "Report inaccurate data" },
      { label: "Privacy Policy", path: "/privacy", icon: Lock, description: "How we handle your data" },
      { label: "Terms of Service", path: "/terms", icon: FileText, description: "Platform terms and conditions" },
      { label: "Disclaimers", path: "/disclaimers", icon: Shield, description: "Legal disclaimers and limitations" },
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
                <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary font-semibold">
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
                          <span className="font-mono text-[11px] text-foreground group-hover:text-primary transition-colors tracking-wide">
                            {link.label}
                          </span>
                          {link.premium && (
                            <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-accent text-accent-foreground border border-accent/40">
                              {link.premium === "professional" ? "Pro" : "Paid"}
                            </span>
                          )}
                          {link.auth && (
                            <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">
                              Login
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
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
