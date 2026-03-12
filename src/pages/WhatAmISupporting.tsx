import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, DollarSign, Users, Scale, Landmark, Globe, FileText,
  ChevronRight, ExternalLink, ShieldCheck, AlertTriangle, Info,
  Heart, Leaf, Vote, GraduationCap, Stethoscope, ShieldAlert,
  Baby, BookOpen, Handshake, Star, Flag, MessageCircle
} from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";

/* ── Issue Areas ── */
const ISSUE_AREAS = [
  { id: "labor", label: "Labor Rights", icon: Users },
  { id: "reproductive", label: "Reproductive Rights", icon: Baby },
  { id: "civil-rights", label: "Civil Rights", icon: Scale },
  { id: "climate", label: "Climate", icon: Leaf },
  { id: "immigration", label: "Immigration", icon: Globe },
  { id: "lgbtq", label: "LGBTQ+ Rights", icon: Heart },
  { id: "voting", label: "Voting Rights", icon: Vote },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "healthcare", label: "Healthcare", icon: Stethoscope },
  { id: "consumer", label: "Consumer Protection", icon: ShieldAlert },
  { id: "animal-welfare", label: "Animal Welfare", icon: Handshake },
  { id: "faith", label: "Faith / Christian Values", icon: BookOpen },
  { id: "israel", label: "Israel / Middle East", icon: Flag },
] as const;

type IssueId = typeof ISSUE_AREAS[number]["id"];

/* ── Signal types ── */
type SignalType = "pac" | "executive" | "lobbying" | "trade" | "contract" | "legislation";
type AlignmentStatus = "alignment" | "conflict" | "mixed" | "informational";

interface IssueSignal {
  type: SignalType;
  typeLabel: string;
  description: string;
  amount?: number;
  recipient?: string;
  source?: string;
  sourceUrl?: string;
  confidence: "Strong Evidence" | "Some Evidence" | "Possible Connection";
  whyItMatters: string;
  alignment: AlignmentStatus;
}

/* ── Demo data per issue ── */
const DEMO_COMPANY = "Koch Industries";

function getDemoSignals(issueId: IssueId): IssueSignal[] {
  const base: Record<string, IssueSignal[]> = {
    labor: [
      { type: "pac", typeLabel: "PAC Donation", description: "Corporate PAC donated $15,000 to Rep. Virginia Foxx (R-NC), ranking member of the Education and Labor Committee.", amount: 15000, recipient: "Rep. Virginia Foxx (R-NC)", source: "FEC Filing", sourceUrl: "https://www.fec.gov", confidence: "Strong Evidence", whyItMatters: "Rep. Foxx has voted against the PRO Act and federal minimum wage increases. If labor protections matter to you, this connection is worth understanding.", alignment: "conflict" },
      { type: "lobbying", typeLabel: "Lobbying Activity", description: "Lobbied on the National Labor Relations Act amendments through Akin Gump Strauss Hauer & Feld.", amount: 820000, source: "Senate LDA Filing", sourceUrl: "https://lda.senate.gov", confidence: "Strong Evidence", whyItMatters: "This lobbying activity targeted legislation that would affect collective bargaining rights. The specific position taken is not always disclosed.", alignment: "mixed" },
      { type: "trade", typeLabel: "Trade Association", description: "Member of the National Association of Manufacturers (NAM), which has lobbied against OSHA workplace safety rule expansions.", source: "NAM Membership Directory", confidence: "Some Evidence", whyItMatters: "Trade association positions don't always represent each member's view, but membership funds shared advocacy.", alignment: "informational" },
    ],
    climate: [
      { type: "pac", typeLabel: "PAC Donation", description: "Corporate PAC donated $10,000 to Sen. John Barrasso (R-WY), former chair of the Senate Energy and Natural Resources Committee.", amount: 10000, recipient: "Sen. John Barrasso (R-WY)", source: "FEC Filing", sourceUrl: "https://www.fec.gov", confidence: "Strong Evidence", whyItMatters: "Sen. Barrasso has opposed the Inflation Reduction Act's clean energy provisions. If climate action matters to you, this is a relevant connection.", alignment: "conflict" },
      { type: "lobbying", typeLabel: "Lobbying Activity", description: "Lobbied on EPA emissions regulations and the Clean Air Act through multiple firms.", amount: 1200000, source: "Senate LDA Filing", sourceUrl: "https://lda.senate.gov", confidence: "Strong Evidence", whyItMatters: "The company spent over $1.2M lobbying on environmental regulation. The specific positions are not always public, but the scale of engagement is significant.", alignment: "mixed" },
      { type: "executive", typeLabel: "Executive Donation", description: "CEO personally donated $50,000 to Americans for Prosperity, which has advocated against renewable energy mandates.", amount: 50000, source: "FEC Individual Contributions", sourceUrl: "https://www.fec.gov", confidence: "Strong Evidence", whyItMatters: "Executive personal donations reflect individual priorities, not always corporate policy. But at this level, the connection is notable.", alignment: "conflict" },
    ],
    "civil-rights": [
      { type: "pac", typeLabel: "PAC Donation", description: "Corporate PAC contributed to candidates on both sides of the Equality Act vote.", amount: 25000, source: "FEC Filing", sourceUrl: "https://www.fec.gov", confidence: "Strong Evidence", whyItMatters: "Mixed contributions suggest the company prioritizes political access over a consistent civil rights position.", alignment: "mixed" },
      { type: "contract", typeLabel: "Government Contract", description: "Holds $42M in federal contracts with the Department of Justice.", amount: 42000000, source: "USASpending.gov", sourceUrl: "https://www.usaspending.gov", confidence: "Strong Evidence", whyItMatters: "Federal contractors are subject to Executive Order requirements on equal employment opportunity. This is a compliance signal.", alignment: "informational" },
    ],
    reproductive: [
      { type: "pac", typeLabel: "PAC Donation", description: "PAC donated to 6 co-sponsors of the Life at Conception Act in the current session.", amount: 18000, source: "FEC Filing", sourceUrl: "https://www.fec.gov", confidence: "Strong Evidence", whyItMatters: "If reproductive rights matter to you, donations to sponsors of this legislation are a direct signal of political alignment.", alignment: "conflict" },
      { type: "lobbying", typeLabel: "Lobbying Activity", description: "No specific lobbying on reproductive healthcare legislation detected.", confidence: "Some Evidence", whyItMatters: "The absence of lobbying on this issue may indicate it is not a corporate priority — or that activity is routed through trade associations.", alignment: "informational" },
    ],
    immigration: [
      { type: "lobbying", typeLabel: "Lobbying Activity", description: "Lobbied on H-1B visa reform and the DREAM Act through in-house government affairs team.", amount: 350000, source: "Senate LDA Filing", sourceUrl: "https://lda.senate.gov", confidence: "Strong Evidence", whyItMatters: "Immigration lobbying often reflects workforce needs. The specific positions may align with or diverge from broader immigration reform goals.", alignment: "mixed" },
      { type: "trade", typeLabel: "Trade Association", description: "Member of U.S. Chamber of Commerce, which has supported comprehensive immigration reform.", source: "Chamber of Commerce", confidence: "Some Evidence", whyItMatters: "The Chamber has broadly supported pathways to legal status for economic reasons. Membership signals general alignment with this position.", alignment: "alignment" },
    ],
    lgbtq: [
      { type: "pac", typeLabel: "PAC Donation", description: "PAC donated to 3 co-sponsors of the Respect for Marriage Act and 2 opponents.", amount: 12000, source: "FEC Filing", sourceUrl: "https://www.fec.gov", confidence: "Strong Evidence", whyItMatters: "Donations to both supporters and opponents of LGBTQ+ protections suggest political access priorities rather than a clear position.", alignment: "mixed" },
    ],
    voting: [
      { type: "pac", typeLabel: "PAC Donation", description: "PAC donated to 4 members who voted for state-level voter ID requirements.", amount: 8000, source: "FEC Filing", confidence: "Some Evidence", whyItMatters: "If voting access is important to you, donations to legislators supporting restrictive voting laws are relevant.", alignment: "conflict" },
    ],
    education: [
      { type: "contract", typeLabel: "Government Contract", description: "Holds $12M in contracts with the Department of Education for technology services.", amount: 12000000, source: "USASpending.gov", sourceUrl: "https://www.usaspending.gov", confidence: "Strong Evidence", whyItMatters: "Government contracts with education agencies are a business relationship, not a policy position. But they indicate the company benefits from public education spending.", alignment: "informational" },
    ],
    healthcare: [
      { type: "lobbying", typeLabel: "Lobbying Activity", description: "Lobbied on pharmaceutical pricing legislation and the Affordable Care Act.", amount: 680000, source: "Senate LDA Filing", sourceUrl: "https://lda.senate.gov", confidence: "Strong Evidence", whyItMatters: "Healthcare lobbying at this scale indicates significant interest in health policy outcomes. Specific positions vary by bill.", alignment: "mixed" },
    ],
    consumer: [
      { type: "lobbying", typeLabel: "Lobbying Activity", description: "Lobbied against CFPB rulemaking on data privacy and lending disclosure requirements.", amount: 420000, source: "Senate LDA Filing", confidence: "Strong Evidence", whyItMatters: "Opposition to consumer protection regulation may affect how the company handles customer data and lending practices.", alignment: "conflict" },
    ],
    "animal-welfare": [
      { type: "pac", typeLabel: "PAC Donation", description: "PAC donated to 2 co-sponsors of H.R. 7567 (Bacon Act) who voted YES on March 5, 2026.", amount: 5000, source: "FEC Filing", confidence: "Strong Evidence", whyItMatters: "If animal welfare matters to you, donations to legislators supporting the Bacon Act after the March 5 vote are a direct value conflict signal.", alignment: "conflict" },
    ],
    faith: [
      { type: "executive", typeLabel: "Executive Donation", description: "Multiple executives donated to Family Research Council Action PAC.", amount: 22000, source: "FEC Individual Contributions", confidence: "Strong Evidence", whyItMatters: "Executive donations to faith-based policy organizations reflect personal values that may influence corporate culture.", alignment: "alignment" },
    ],
    israel: [
      { type: "pac", typeLabel: "PAC Donation", description: "PAC contributed to members of the House Foreign Affairs Committee who co-sponsored the U.S.-Israel Security Assistance Authorization Act.", amount: 14000, source: "FEC Filing", confidence: "Strong Evidence", whyItMatters: "Donations to legislators supporting U.S.-Israel security cooperation indicate engagement with Middle East policy.", alignment: "alignment" },
    ],
  };
  return base[issueId] || [];
}

/* ── Formatting ── */
function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function alignmentMeta(status: AlignmentStatus) {
  switch (status) {
    case "alignment": return { label: "Alignment Signal", color: "text-civic-green", bg: "bg-civic-green/10", border: "border-civic-green/30" };
    case "conflict": return { label: "Conflict Signal", color: "text-civic-red", bg: "bg-civic-red/10", border: "border-civic-red/30" };
    case "mixed": return { label: "Mixed Signal", color: "text-civic-yellow", bg: "bg-civic-yellow/10", border: "border-civic-yellow/30" };
    case "informational": return { label: "Informational", color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" };
  }
}

function confidenceMeta(c: IssueSignal["confidence"]) {
  switch (c) {
    case "Strong Evidence": return { color: "text-civic-green" };
    case "Some Evidence": return { color: "text-civic-yellow" };
    case "Possible Connection": return { color: "text-muted-foreground" };
  }
}

function typeIcon(type: SignalType) {
  switch (type) {
    case "pac": return DollarSign;
    case "executive": return Users;
    case "lobbying": return Landmark;
    case "trade": return Handshake;
    case "contract": return FileText;
    case "legislation": return Scale;
  }
}

/* ── Signal Card ── */
function SignalCard({ signal }: { signal: IssueSignal }) {
  const align = alignmentMeta(signal.alignment);
  const conf = confidenceMeta(signal.confidence);
  const Icon = typeIcon(signal.type);

  return (
    <div className="border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">{signal.typeLabel}</span>
        </div>
        <span className={`shrink-0 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider border ${align.color} ${align.bg} ${align.border}`}>
          {align.label}
        </span>
      </div>

      {/* Description + Amount */}
      <p className="text-sm text-foreground leading-relaxed mb-2">{signal.description}</p>
      {signal.amount && (
        <span className="inline-block font-mono text-sm font-semibold text-foreground mr-3">{formatCurrency(signal.amount)}</span>
      )}

      {/* Why it matters */}
      <div className="mt-3 p-3 bg-muted/30 border border-border">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground leading-relaxed">{signal.whyItMatters}</p>
        </div>
      </div>

      {/* Footer: source + confidence */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        {signal.source && (
          <div className="flex items-center gap-1.5">
            {signal.sourceUrl ? (
              <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[0.6rem] font-mono text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> {signal.source}
              </a>
            ) : (
              <span className="text-[0.6rem] font-mono text-muted-foreground">{signal.source}</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <ShieldCheck className={`w-3 h-3 ${conf.color}`} strokeWidth={1.5} />
          <span className={`text-[0.55rem] font-mono uppercase tracking-widest ${conf.color}`}>{signal.confidence}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Issue Summary ── */
function IssueSummary({ signals }: { signals: IssueSignal[] }) {
  const counts = { alignment: 0, conflict: 0, mixed: 0, informational: 0 };
  signals.forEach(s => counts[s.alignment]++);

  const items = [
    { key: "alignment" as const, label: "Alignment", count: counts.alignment },
    { key: "conflict" as const, label: "Conflict", count: counts.conflict },
    { key: "mixed" as const, label: "Mixed", count: counts.mixed },
    { key: "informational" as const, label: "Informational", count: counts.informational },
  ].filter(i => i.count > 0);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {items.map(i => {
        const meta = alignmentMeta(i.key);
        return (
          <span key={i.key} className={`px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider border ${meta.color} ${meta.bg} ${meta.border}`}>
            {i.count} {i.label}
          </span>
        );
      })}
    </div>
  );
}

/* ── Main Page ── */
export default function WhatAmISupporting() {
  const navigate = useNavigate();
  const [selectedIssues, setSelectedIssues] = useState<IssueId[]>(["labor"]);
  const [search, setSearch] = useState("");

  usePageSEO({
    title: "What Am I Supporting? — Employer Influence & Values Alignment",
    description: "See where a company's money, influence, and policy activity connect to the issues you care about. Evidence-backed, not partisan.",
    path: "/what-am-i-supporting",
  });

  const toggleIssue = (id: IssueId) => {
    setSelectedIssues(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(i => i !== id) : prev) : [...prev, id]
    );
  };

  const handleSearch = () => {
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-[900px] mx-auto w-full px-4 sm:px-6 py-10 lg:py-16">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="font-mono text-[0.7rem] uppercase text-primary tracking-[0.2em] mb-3">Core Intelligence Module</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-[1.15] tracking-tight mb-3">
            What Am I Supporting?
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[640px]">
            See where company money, influence, and policy activity may connect to the issues that matter to you.
          </p>
        </div>

        {/* ── Company Search ── */}
        <div className="flex max-w-[520px] border border-border bg-card mb-8">
          <div className="flex items-center px-4 text-muted-foreground"><Search className="w-4 h-4" /></div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter a company name..."
            className="flex-1 bg-transparent border-none outline-none py-3 text-foreground font-sans text-[15px] placeholder:text-muted-foreground"
          />
          <button onClick={handleSearch} className="bg-primary text-primary-foreground px-5 font-mono text-[0.7rem] tracking-wider uppercase font-semibold hover:brightness-110 transition-all">
            Search
          </button>
        </div>

        {/* ── Demo Label ── */}
        <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-primary mb-6">
          Showing: {DEMO_COMPANY}
        </div>

        {/* ── Issue Selector ── */}
        <div className="mb-8">
          <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-3">Select Issue Areas</div>
          <div className="flex flex-wrap gap-2">
            {ISSUE_AREAS.map(issue => {
              const active = selectedIssues.includes(issue.id);
              return (
                <button
                  key={issue.id}
                  onClick={() => toggleIssue(issue.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[0.65rem] font-mono uppercase tracking-wider border transition-colors ${
                    active
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  <issue.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {issue.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="p-3 bg-muted/30 border border-border mb-8">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">How to read this:</strong> These signals are drawn from public filings, lobbying disclosures, campaign finance records, and federal contract data. They are not moral or legal judgments. They show public relationships so you can decide what aligns with your values.
          </p>
        </div>

        {/* ── Signal Sections per Issue ── */}
        <div className="space-y-10">
          {selectedIssues.map(issueId => {
            const issue = ISSUE_AREAS.find(i => i.id === issueId)!;
            const signals = getDemoSignals(issueId);
            const Icon = issue.icon;

            return (
              <div key={issueId}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  <h2 className="text-lg font-bold text-foreground">{issue.label}</h2>
                  <span className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground ml-auto">
                    {signals.length} signal{signals.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <IssueSummary signals={signals} />

                {signals.length > 0 ? (
                  <div className="space-y-3">
                    {signals.map((s, i) => <SignalCard key={i} signal={s} />)}
                  </div>
                ) : (
                  <div className="border border-border bg-card p-6 text-center">
                    <p className="text-sm text-muted-foreground">No signals detected for this issue area.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Navigation CTA ── */}
        <div className="mt-12 border-t border-border pt-10">
          <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-4 text-center">Continue Your Research</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Company Intelligence", path: "/browse", icon: Search },
              { label: "Connection Chain", path: "/follow-the-money", icon: Globe },
              { label: "Offer Intelligence", path: "/check", icon: FileText },
              { label: "Ask Jackye", path: "/ask-jackye", icon: MessageCircle },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 p-4 border border-border bg-card text-left hover:border-primary transition-colors group"
              >
                <item.icon className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-foreground font-semibold group-hover:text-primary transition-colors">{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer tagline ── */}
        <div className="mt-10 text-center">
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-primary font-semibold mb-1">
            Run the chain first. Always.
          </div>
          <div className="text-[0.55rem] font-mono uppercase tracking-widest text-muted-foreground">
            Who Do I Work For — Employer Intelligence by Jackye Clayton
          </div>
        </div>
      </div>
    </div>
  );
}
