import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, DollarSign, Users, Scale, Landmark, Globe, FileText,
  ChevronRight, ExternalLink, ShieldCheck, Info,
  Heart, Leaf, Vote, GraduationCap, Stethoscope, ShieldAlert,
  Baby, BookOpen, Handshake, Flag, MessageCircle
} from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";
import {
  alignmentMeta,
  confidenceColor,
  formatChainCurrency,
  getDemoChainSignals,
  ISSUE_AREA_LABELS,
  type IssueAreaId,
  type ChainSignal,
} from "@/lib/intelligenceChain";
import { ChainTrace } from "@/components/intelligence/ChainTrace";

/* ── Issue icon map ── */
const ISSUE_ICONS: Record<IssueAreaId, typeof Users> = {
  labor: Users, reproductive: Baby, "civil-rights": Scale, climate: Leaf,
  immigration: Globe, lgbtq: Heart, voting: Vote, education: GraduationCap,
  healthcare: Stethoscope, consumer: ShieldAlert, "animal-welfare": Handshake,
  faith: BookOpen, israel: Flag,
};

const ISSUE_AREA_IDS: IssueAreaId[] = [
  "labor", "reproductive", "civil-rights", "climate", "immigration",
  "lgbtq", "voting", "education", "healthcare", "consumer",
  "animal-welfare", "faith", "israel",
];

const DEMO_COMPANY = "Koch Industries";

/* ── Signal type icon ── */
function typeIcon(chain: ChainSignal): typeof DollarSign {
  const types = chain.chain.map(s => s.entityType.toLowerCase());
  if (types.some(t => t.includes("pac"))) return DollarSign;
  if (types.some(t => t.includes("lobbyist") || t.includes("lobbying"))) return Landmark;
  if (types.some(t => t.includes("executive"))) return Users;
  if (types.some(t => t.includes("trade"))) return Handshake;
  if (types.some(t => t.includes("contract") || t.includes("agency"))) return FileText;
  return Scale;
}

/* ── Signal Card with Chain Trace ── */
function ChainSignalCard({ signal }: { signal: ChainSignal }) {
  const align = alignmentMeta(signal.alignmentStatus || "informational");
  const confCol = confidenceColor(signal.confidence);
  const Icon = typeIcon(signal);

  return (
    <div className="border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            {signal.chain[0]?.entityType || "Signal"}
          </span>
        </div>
        <span className={`shrink-0 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider border ${align.color} ${align.bg} ${align.border}`}>
          {align.label}
        </span>
      </div>

      {/* Chain Trace */}
      <ChainTrace steps={signal.chain} />

      {/* Description */}
      <p className="text-sm text-foreground leading-relaxed mb-2">{signal.summary}</p>
      {signal.amount && (
        <span className="inline-block font-mono text-sm font-semibold text-foreground mr-3">{formatChainCurrency(signal.amount)}</span>
      )}

      {/* Why it matters */}
      {signal.whyItMatters && (
        <div className="mt-3 p-3 bg-muted/30 border border-border">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground leading-relaxed">{signal.whyItMatters}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        {signal.sourceUrl ? (
          <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[0.6rem] font-mono text-primary hover:underline">
            <ExternalLink className="w-3 h-3" /> {signal.source}
          </a>
        ) : (
          <span className="text-[0.6rem] font-mono text-muted-foreground">{signal.source}</span>
        )}
        <div className="flex items-center gap-1.5">
          <ShieldCheck className={`w-3 h-3 ${confCol}`} strokeWidth={1.5} />
          <span className={`text-[0.55rem] font-mono uppercase tracking-widest ${confCol}`}>{signal.confidence}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Issue Summary ── */
function IssueSummary({ signals }: { signals: ChainSignal[] }) {
  const counts = { alignment: 0, conflict: 0, mixed: 0, informational: 0 };
  signals.forEach(s => counts[s.alignmentStatus || "informational"]++);

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
  const [selectedIssues, setSelectedIssues] = useState<IssueAreaId[]>(["labor"]);
  const [search, setSearch] = useState("");

  const allSignals = getDemoChainSignals(DEMO_COMPANY);

  usePageSEO({
    title: "What Am I Supporting? — Employer Influence & Values Alignment",
    description: "See where a company's money, influence, and policy activity connect to the issues you care about. Evidence-backed, not partisan.",
    path: "/what-am-i-supporting",
  });

  const toggleIssue = (id: IssueAreaId) => {
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

        {/* Header */}
        <div className="mb-8">
          <div className="font-mono text-[0.7rem] uppercase text-primary tracking-[0.2em] mb-3">Core Intelligence Module</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-[1.15] tracking-tight mb-3">
            What Am I Supporting?
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[640px]">
            See where company money, influence, and policy activity may connect to the issues that matter to you.
          </p>
        </div>

        {/* Search */}
        <div className="flex max-w-[520px] border border-border bg-card mb-8">
          <div className="flex items-center px-4 text-muted-foreground"><Search className="w-4 h-4" /></div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Enter a company name..." className="flex-1 bg-transparent border-none outline-none py-3 text-foreground font-sans text-[15px] placeholder:text-muted-foreground" />
          <button onClick={handleSearch} className="bg-primary text-primary-foreground px-5 font-mono text-[0.7rem] tracking-wider uppercase font-semibold hover:brightness-110 transition-all">Search</button>
        </div>

        {/* Demo Label */}
        <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-primary mb-6">
          Showing: {DEMO_COMPANY}
        </div>

        {/* Issue Selector */}
        <div className="mb-8">
          <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-3">Select Issue Areas</div>
          <div className="flex flex-wrap gap-2">
            {ISSUE_AREA_IDS.map(id => {
              const active = selectedIssues.includes(id);
              const Icon = ISSUE_ICONS[id];
              return (
                <button key={id} onClick={() => toggleIssue(id)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[0.65rem] font-mono uppercase tracking-wider border transition-colors ${active ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {ISSUE_AREA_LABELS[id]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-muted/30 border border-border mb-8">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">How to read this:</strong> This platform surfaces publicly available signals to help users understand potential relationships between companies, policy activity, and careers. These are not moral or legal judgments. Every signal includes a source link and confidence label so you can decide what aligns with your values.
          </p>
        </div>

        {/* Signal Sections per Issue */}
        <div className="space-y-10">
          {selectedIssues.map(issueId => {
            const Icon = ISSUE_ICONS[issueId];
            const signals = allSignals.filter(s => s.issueCategories?.includes(issueId));

            return (
              <div key={issueId}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  <h2 className="text-lg font-bold text-foreground">{ISSUE_AREA_LABELS[issueId]}</h2>
                  <span className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground ml-auto">
                    {signals.length} signal{signals.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {signals.length > 0 ? (
                  <>
                    <IssueSummary signals={signals} />
                    <div className="space-y-3">
                      {signals.map(s => <ChainSignalCard key={s.id} signal={s} />)}
                    </div>
                  </>
                ) : (
                  <div className="border border-border bg-card p-6 text-center">
                    <p className="text-sm text-muted-foreground">No verified public signals found for this issue.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="mt-12 border-t border-border pt-10">
          <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-4 text-center">Continue Your Research</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Company Intelligence", path: "/browse", icon: Search },
              { label: "Connection Chain", path: "/follow-the-money", icon: Globe },
              { label: "Intelligence Chain", path: "/intelligence-chain", icon: Landmark },
              { label: "Ask the Advisor", path: "/ask-jackye", icon: MessageCircle },
            ].map(item => (
              <button key={item.path} onClick={() => navigate(item.path)} className="flex items-center gap-2 p-4 border border-border bg-card text-left hover:border-primary transition-colors group">
                <item.icon className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-foreground font-semibold group-hover:text-primary transition-colors">{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-primary font-semibold mb-1">Run the chain first. Always.</div>
          <div className="text-[0.55rem] font-mono uppercase tracking-widest text-muted-foreground">Who Do I Work For — Workforce Transparency Standard</div>
        </div>
      </div>
    </div>
  );
}
