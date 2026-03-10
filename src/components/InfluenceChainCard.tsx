import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { useInfluenceChain } from "@/hooks/use-roi-pipeline";
import { PartyBadge, computeRecipientMix } from "@/components/PartyBadge";
import { Link } from "react-router-dom";
import {
  ArrowRight, Loader2, DollarSign, Users, Landmark,
  FileCheck, RotateCcw, Globe, ChevronDown, HelpCircle,
  ExternalLink, Share2, Handshake, ShieldCheck, Building2,
  TrendingUp, Eye, AlertTriangle, Lightbulb, ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface ChainStep {
  chain_id: number;
  step: number;
  source_name: string;
  source_type: string;
  link_type: string;
  target_name: string;
  target_type: string;
  amount: number;
  confidence: number;
  description: string;
}

/* ── Category definitions ── */
interface Category {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  explainer: string;
  linkTypes: string[];
}

const CATEGORIES: Category[] = [
  {
    key: "executive_giving",
    title: "Executive Giving",
    subtitle: "Where leadership sends political money",
    icon: DollarSign,
    iconClass: "bg-[hsl(var(--civic-red))]/10 text-[hsl(var(--civic-red))]",
    explainer: "This shows direct political donations from the company's PAC and individual executives to candidates, parties, and committees. Every dollar here comes from public FEC filings.",
    linkTypes: ["donation_to_member", "dark_money_channel", "foundation_grant_to_district"],
  },
  {
    key: "lobbying",
    title: "Lobbying Activity",
    subtitle: "Paid efforts to influence laws and regulations",
    icon: Handshake,
    iconClass: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))]",
    explainer: "Lobbying means paying professionals to talk to lawmakers on the company's behalf. This shows which bills, agencies, and issues the company is actively trying to shape — and how much they're spending.",
    linkTypes: ["lobbying_on_bill", "trade_association_lobbying", "state_lobbying_contract", "international_influence"],
  },
  {
    key: "contracts",
    title: "Government Contracts",
    subtitle: "Federal and state business the company receives",
    icon: Building2,
    iconClass: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))]",
    explainer: "After spending on politics, companies often receive government contracts and subsidies. This shows what the company gets back from public dollars — the return on their political investment.",
    linkTypes: ["committee_oversight_of_contract"],
  },
  {
    key: "institutional",
    title: "Policy & Institutional Links",
    subtitle: "Relationships that shape oversight and regulation",
    icon: Users,
    iconClass: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))]",
    explainer: "These are structural relationships — committee seats, revolving-door hires, advisory appointments, and shared board members. They show how the company is connected to the people who write and enforce the rules.",
    linkTypes: ["member_on_committee", "revolving_door", "advisory_committee_appointment", "interlocking_directorate"],
  },
];

/* ── Plain-language labels ── */
const LINK_TYPE_CONFIG: Record<string, { label: string; plainLabel: string; color: string; icon: React.ElementType }> = {
  donation_to_member:              { label: "Donation",            plainLabel: "Gave money to",                                         color: "text-[hsl(var(--civic-red))]",    icon: DollarSign },
  member_on_committee:             { label: "Committee Seat",      plainLabel: "Sits on a committee that oversees",                      color: "text-[hsl(var(--civic-blue))]",   icon: Users },
  committee_oversight_of_contract: { label: "Contract Oversight",  plainLabel: "That committee controls contracts for",                  color: "text-[hsl(var(--civic-green))]",  icon: Landmark },
  lobbying_on_bill:                { label: "Lobbying",             plainLabel: "Paid lobbyists to influence",                            color: "text-[hsl(var(--civic-yellow))]", icon: FileCheck },
  revolving_door:                  { label: "Revolving Door",      plainLabel: "Former government official now works here",               color: "text-destructive",                icon: RotateCcw },
  foundation_grant_to_district:    { label: "Foundation Grant",    plainLabel: "Gave a charitable grant in the district of",              color: "text-[hsl(var(--civic-green))]",  icon: DollarSign },
  trade_association_lobbying:      { label: "Trade Group",         plainLabel: "Belongs to a group that lobbies for",                     color: "text-[hsl(var(--civic-yellow))]", icon: Users },
  dark_money_channel:              { label: "Dark Money",          plainLabel: "Money sent through a group that doesn't disclose donors", color: "text-destructive",                icon: DollarSign },
  advisory_committee_appointment:  { label: "Advisory Role",       plainLabel: "Has a person on a government advisory panel",             color: "text-[hsl(var(--civic-blue))]",   icon: Users },
  interlocking_directorate:        { label: "Shared Board Member", plainLabel: "Shares a board member with",                              color: "text-muted-foreground",           icon: Users },
  state_lobbying_contract:         { label: "State Lobbying",      plainLabel: "Paid lobbyists in state government for",                  color: "text-[hsl(var(--civic-yellow))]", icon: Landmark },
  international_influence:         { label: "International",       plainLabel: "Has influence activities in other countries",              color: "text-[hsl(var(--civic-blue))]",   icon: Globe },
};

const COMMITTEE_ISSUES: Record<string, string[]> = {
  "armed services": ["Military & defense spending"], "appropriations": ["Government spending decisions"],
  "energy and commerce": ["Energy policy", "Healthcare", "Consumer protection"],
  "energy and natural resources": ["Energy policy", "Public lands"],
  "finance": ["Taxes", "Healthcare funding", "Trade"], "judiciary": ["Immigration", "Civil rights", "Criminal justice"],
  "education and labor": ["Education", "Worker rights", "Minimum wage"],
  "education and the workforce": ["Education", "Worker rights"], "health": ["Healthcare policy"],
  "ways and means": ["Tax policy", "Social Security", "Trade"],
  "foreign affairs": ["Foreign policy", "International aid"], "foreign relations": ["Foreign policy", "Treaties"],
  "homeland security": ["Border security", "Immigration enforcement"],
  "agriculture": ["Farm policy", "Food safety", "Rural programs"],
  "banking": ["Banking rules", "Housing policy"], "commerce": ["Business regulation", "Consumer protection"],
  "environment": ["Environmental protection", "Climate policy"],
  "veterans": ["Veterans benefits", "VA healthcare"], "intelligence": ["National security", "Surveillance"],
  "budget": ["Federal budget", "Government spending"], "small business": ["Small business support", "Entrepreneurship"],
  "transportation": ["Roads", "Airlines", "Infrastructure"],
  "rules": ["How Congress operates"], "oversight": ["Government accountability", "Investigations"],
};

function getCommitteeIssues(name: string): string[] {
  const lower = name.toLowerCase();
  for (const [key, issues] of Object.entries(COMMITTEE_ISSUES)) {
    if (lower.includes(key)) return issues;
  }
  return [];
}

function cleanEntityName(name: string): string {
  if (!name) return "Unknown";
  // Remove technical identifiers
  let cleaned = name.replace(/\b(SEC\s*)?CIK[\s:#]*\d+/gi, "").trim();
  cleaned = cleaned.replace(/\(?\s*FEC\s*(ID)?[\s:#]*C\d+\s*\)?/gi, "").trim();
  cleaned = cleaned.replace(/\s*C\d{8,}\s*/g, " ").trim();
  cleaned = cleaned.replace(/\b(EIN|TIN)[\s:#]*\d[\d-]+/gi, "").trim();
  cleaned = cleaned.replace(/\bDUNS[\s:#]*\d+/gi, "").trim();
  cleaned = cleaned.replace(/\(?\s*Ticker:\s*[A-Z]+\s*\)?/gi, "").trim();
  cleaned = cleaned.replace(/[\s,\-()]+$/, "").replace(/^[\s,\-()]+/, "").trim();
  // Convert ALL CAPS to Title Case for readability
  if (cleaned.length > 3 && cleaned === cleaned.toUpperCase()) {
    cleaned = cleaned.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    // Fix common words back
    cleaned = cleaned.replace(/\b(Pac|Llc|Inc|Ltd|Co|Corp)\b/g, m => m.toUpperCase());
  }
  return cleaned || name;
}

/** Truncate long descriptions to a readable summary */
function summarizeDescription(description: string | null, linkType: string, sourceName: string, targetName: string): string {
  if (!description) return "";
  // For contracts, extract just the title/purpose
  if (linkType === "committee_oversight_of_contract" && description.length > 200) {
    const titleMatch = description.match(/TITLE:\s*([^\n]+)/i);
    const awardMatch = description.match(/\(Award ID:\s*([^)]+)\)/i);
    if (titleMatch) {
      const title = titleMatch[1].trim().length > 120 
        ? titleMatch[1].trim().substring(0, 120) + "…" 
        : titleMatch[1].trim();
      return `Federal contract: ${title}${awardMatch ? ` (${awardMatch[1]})` : ""}`;
    }
    return description.substring(0, 150) + "…";
  }
  // For SEC entities, simplify
  if (linkType === "interlocking_directorate" && /SEC EDGAR/i.test(description)) {
    const tickerMatch = description.match(/Ticker:\s*([A-Z]+)/i);
    return tickerMatch 
      ? `Publicly traded company (${tickerMatch[1]}) — SEC filing confirms corporate identity`
      : "SEC filing confirms corporate identity";
  }
  // General truncation
  if (description.length > 200) {
    return description.substring(0, 180) + "…";
  }
  return description;
}

/** Check if a step should be filtered from display */
function isDisplayableStep(step: ChainStep): boolean {
  // Filter out SEC entity confirmations — these are identity matches, not influence
  if (step.target_type === "sec_entity" && step.link_type === "interlocking_directorate") return false;
  // Filter out entries with no meaningful target
  if (!step.target_name || step.target_name.length < 3) return false;
  return true;
}

const PARTY_FULL_NAMES: Record<string, string> = {
  D: "Democrat", R: "Republican", I: "Independent", L: "Libertarian", G: "Green Party",
};

function extractPartyFromDescription(description: string | null, name: string): string | null {
  if (!description) return null;
  const combined = `${name} ${description}`;
  const parenMatch = combined.match(/\(([RDILG])\b[^)]*\)/i);
  if (parenMatch) return parenMatch[1].toUpperCase();
  const bracketMatch = combined.match(/\[([RDILG])\]/i);
  if (bracketMatch) return bracketMatch[1].toUpperCase();
  if (/\brepublican\b/i.test(combined)) return "R";
  if (/\bdemocrat/i.test(combined)) return "D";
  if (/\bindependent\b/i.test(combined)) return "I";
  return null;
}

function extractLocationFromDescription(description: string | null): string | null {
  if (!description) return null;
  const stateMatch = description.match(/[RDILG]-([A-Z]{2})(?:-(\d+))?/i);
  if (stateMatch) return stateMatch[2] ? `${stateMatch[1]}-${stateMatch[2]}` : stateMatch[1];
  return null;
}

function getEntityLink(name: string, type: string): string | null {
  const cleanName = cleanEntityName(name);
  switch (type) {
    case "pac": case "super_pac":
      return `https://www.fec.gov/data/committee/?q=${encodeURIComponent(cleanName)}`;
    case "politician": case "member":
      return `https://www.fec.gov/data/candidates/?search=${encodeURIComponent(cleanName)}`;
    case "committee":
      return `https://www.congress.gov/search?q=${encodeURIComponent(cleanName)}&searchResultViewType=expanded`;
    case "agency": case "contract":
      return `https://www.usaspending.gov/search/?hash=keyword-${encodeURIComponent(cleanName)}`;
    case "lobbyist":
      return `https://lda.senate.gov/filings/public/filing/search/?search=${encodeURIComponent(cleanName)}`;
    default: return null;
  }
}

/* ── Confidence labels with tooltip ── */
function ConfidenceTag({ confidence }: { confidence: number }) {
  const config = confidence >= 0.8
    ? { label: "Strong Evidence", icon: "✓", className: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))]", tooltip: "Verified through official filings or direct records (FEC, lobbying disclosures, USASpending)." }
    : confidence >= 0.5
    ? { label: "Likely Connection", icon: "~", className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))]", tooltip: "Corroborated across multiple public sources but not a single direct filing." }
    : { label: "Possible Connection", icon: "?", className: "bg-muted text-muted-foreground", tooltip: "Detected from indirect public evidence — patterns in records or news — but not confirmed by a primary source." };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-help", config.className)}>
            {config.icon} {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">{config.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ── Evidence card (replaces flat rows) ── */
function EvidenceCard({ step, onEntityClick }: { step: ChainStep; onEntityClick?: (entity: { name: string; type: string; linkType: string; amount: number }) => void }) {
  const config = LINK_TYPE_CONFIG[step.link_type] || { label: step.link_type, plainLabel: "Connected to", color: "text-muted-foreground", icon: ArrowRight };
  const Icon = config.icon;
  const targetParty = extractPartyFromDescription(step.description, step.target_name);
  const targetLocation = extractLocationFromDescription(step.description);
  const externalLink = getEntityLink(step.target_name, step.target_type);
  const isPolitician = step.target_type === "politician" || step.target_type === "member";
  const issues = (isPolitician || step.link_type === "member_on_committee") ? getCommitteeIssues(step.target_name) : [];
  const sourceName = cleanEntityName(step.source_name);
  const targetName = cleanEntityName(step.target_name);
  const isExecutiveDonation = step.source_type === "executive" || step.link_type === "donation_to_member" && step.source_type === "executive";
  const isDonationToMember = step.link_type === "donation_to_member";
  const isClickable = !!onEntityClick && (isExecutiveDonation || isDonationToMember);

  const handleClick = () => {
    if (!onEntityClick) return;
    if (isExecutiveDonation) {
      onEntityClick({ name: step.source_name, type: "executive", linkType: step.link_type, amount: step.amount });
    } else if (isDonationToMember) {
      onEntityClick({ name: step.target_name, type: "candidate", linkType: step.link_type, amount: step.amount });
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card p-3.5 transition-all",
        isClickable ? "cursor-pointer hover:border-primary/30 hover:shadow-md" : "hover:border-primary/20 hover:shadow-sm"
      )}
      onClick={isClickable ? handleClick : undefined}
    >
      {/* Top row: type badge + confidence */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted", config.color)}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
          {step.amount > 0 && (
            <span className="text-xs font-bold text-foreground">{formatCurrency(step.amount)}</span>
          )}
        </div>
        <ConfidenceTag confidence={step.confidence} />
      </div>

      {/* Connection: source → target */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px]">{sourceName}</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
        <span className="text-sm font-semibold text-foreground truncate">{targetName}</span>
        {targetParty && <PartyBadge party={targetParty} entityType={step.target_type} />}
        {targetLocation && <span className="text-[10px] text-muted-foreground">{targetLocation}</span>}
      </div>

      {/* Summary line */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {sourceName} {config.plainLabel.toLowerCase()} {targetName}
        {targetParty && <> ({PARTY_FULL_NAMES[targetParty] || targetParty})</>}
      </p>

      {/* Description detail (truncated) */}
      {step.description && step.link_type === "committee_oversight_of_contract" && (
        <p className="text-[10px] text-muted-foreground/80 mt-1 leading-relaxed italic">
          {summarizeDescription(step.description, step.link_type, sourceName, targetName)}
        </p>
      )}

      {/* Click CTA */}
      {isClickable && (
        <p className="text-[10px] text-primary font-medium mt-1.5 flex items-center gap-1">
          {isExecutiveDonation ? "See who they donated to" : "View their voting record & politics"}
          <ChevronRight className="w-3 h-3" />
        </p>
      )}

      {/* Issue tags + source link */}
      {(issues.length > 0 || externalLink) && (
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap gap-1">
            {issues.slice(0, 3).map((issue) => (
              <Link
                key={issue}
                to={`/values-search?issue=${encodeURIComponent(issue.toLowerCase().replace(/\s+/g, '_'))}`}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                {issue}
              </Link>
            ))}
          </div>
          {externalLink && (
            <a href={externalLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              Source <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Category section with top-5 + expand ── */
function CategorySection({ category, steps, defaultOpen, onEntityClick }: { category: Category; steps: ChainStep[]; defaultOpen: boolean; onEntityClick?: (entity: { name: string; type: string; linkType: string; amount: number }) => void }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  const Icon = category.icon;
  const totalAmount = steps.reduce((s, step) => s + (step.amount || 0), 0);
  const strongCount = steps.filter(s => s.confidence >= 0.8).length;
  const displaySteps = showAll ? steps : steps.slice(0, 5);

  if (steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors text-left"
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", category.iconClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{category.title}</div>
          <div className="text-xs text-muted-foreground">{category.subtitle}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-[10px]">
            {steps.length} record{steps.length !== 1 ? "s" : ""}
          </Badge>
          {totalAmount > 0 && (
            <span className="text-xs font-bold text-[hsl(var(--civic-green))]">{formatCurrency(totalAmount)}</span>
          )}
          {strongCount > 0 && (
            <span className="text-[10px] text-[hsl(var(--civic-green))]">
              {strongCount} strong
            </span>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200", !isOpen && "-rotate-90")} />
      </button>

      {/* Body */}
      {isOpen && (
        <div className="border-t border-border/50">
          {/* Plain English explainer */}
          <div className="flex gap-2.5 bg-primary/5 px-4 py-3 border-b border-border/30">
            <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">In plain English:</strong> {category.explainer}
            </p>
          </div>

          {/* Evidence cards */}
          <div className="p-3 space-y-2">
            {displaySteps.map((step, i) => (
              <EvidenceCard key={`${step.chain_id}-${step.step}-${i}`} step={step} onEntityClick={onEntityClick} />
            ))}
          </div>

          {/* Expand / collapse */}
          {steps.length > 5 && (
            <div className="px-4 pb-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setShowAll(!showAll)}
              >
                <Eye className="w-3.5 h-3.5" />
                {showAll ? "Show top 5" : `View all ${steps.length} records`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sort steps by importance ── */
function sortByImportance(steps: ChainStep[]): ChainStep[] {
  return [...steps].sort((a, b) => {
    // 1. Confidence (strong first)
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    // 2. Dollar amount
    if (b.amount !== a.amount) return b.amount - a.amount;
    // 3. Alphabetical fallback
    return a.target_name.localeCompare(b.target_name);
  });
}

/* ── Categorize steps ── */
function categorizeSteps(steps: ChainStep[]): Record<string, ChainStep[]> {
  const result: Record<string, ChainStep[]> = {};
  CATEGORIES.forEach(c => { result[c.key] = []; });

  for (const step of steps) {
    // Filter out non-displayable entries (SEC identity confirmations, etc.)
    if (!isDisplayableStep(step)) continue;
    
    const cat = CATEGORIES.find(c => c.linkTypes.includes(step.link_type));
    if (cat) {
      result[cat.key].push(step);
    } else {
      result["lobbying"].push(step);
    }
  }

  // Deduplicate by target name within each category (keep highest amount)
  for (const key of Object.keys(result)) {
    const seen = new Map<string, ChainStep>();
    for (const step of result[key]) {
      const dedupKey = `${step.target_name}-${step.link_type}`;
      const existing = seen.get(dedupKey);
      if (!existing || (step.amount || 0) > (existing.amount || 0)) {
        seen.set(dedupKey, step);
      }
    }
    result[key] = sortByImportance(Array.from(seen.values()));
  }

  return result;
}

/* ── Generate key patterns ── */
function generateKeyPatterns(categorized: Record<string, ChainStep[]>, allSteps: ChainStep[]): string[] {
  const patterns: string[] = [];

  const givingCount = categorized.executive_giving.length;
  if (givingCount > 0) {
    const totalGiving = categorized.executive_giving.reduce((s, step) => s + (step.amount || 0), 0);
    patterns.push(
      totalGiving > 0
        ? `${givingCount} political donation${givingCount > 1 ? "s" : ""} detected totaling ${formatCurrency(totalGiving)}`
        : `${givingCount} political donation${givingCount > 1 ? "s" : ""} detected from executive and PAC giving`
    );
  }

  const lobbyCount = categorized.lobbying.length;
  if (lobbyCount > 0) {
    const lobbyTotal = categorized.lobbying.reduce((s, step) => s + (step.amount || 0), 0);
    patterns.push(
      lobbyTotal > 0
        ? `${lobbyCount} lobbying relationship${lobbyCount > 1 ? "s" : ""} with ${formatCurrency(lobbyTotal)} in spending`
        : `${lobbyCount} lobbying relationship${lobbyCount > 1 ? "s" : ""} across multiple firms or issues`
    );
  }

  const contractCount = categorized.contracts.length;
  if (contractCount > 0) {
    const contractTotal = categorized.contracts.reduce((s, step) => s + (step.amount || 0), 0);
    patterns.push(
      contractTotal > 0
        ? `Federal contracts worth ${formatCurrency(contractTotal)} linked to political relationships`
        : `${contractCount} government contract${contractCount > 1 ? "s" : ""} linked to political relationships`
    );
  }

  const instCount = categorized.institutional.length;
  if (instCount > 0) {
    const revolvingDoor = categorized.institutional.filter(s => s.link_type === "revolving_door").length;
    if (revolvingDoor > 0) {
      patterns.push(`${revolvingDoor} revolving-door hire${revolvingDoor > 1 ? "s" : ""} — former government officials now at the company`);
    }
    const committees = categorized.institutional.filter(s => s.link_type === "member_on_committee").length;
    if (committees > 0) {
      patterns.push(`Connected to ${committees} congressional committee seat${committees > 1 ? "s" : ""} with oversight authority`);
    }
  }

  const darkMoney = allSteps.filter(s => s.link_type === "dark_money_channel").length;
  if (darkMoney > 0) {
    patterns.push(`${darkMoney} dark money channel${darkMoney > 1 ? "s" : ""} — funds routed through groups that don't disclose donors`);
  }

  return patterns.slice(0, 5);
}

function collectRecipients(steps: ChainStep[]) {
  return steps
    .filter((s) => s.link_type === "donation_to_member" || s.link_type === "dark_money_channel" || s.link_type === "foundation_grant_to_district")
    .map((s) => ({
      name: s.target_name,
      party: extractPartyFromDescription(s.description, s.target_name),
      entityType: s.target_type,
      amount: s.amount,
    }));
}

/* ── Main component ── */
export function InfluenceChainCard({ companyId, companyName, onExecutiveClick, onCandidateClick }: { companyId: string; companyName: string; onExecutiveClick?: (executive: any) => void; onCandidateClick?: (candidate: any) => void }) {
  const { data: chainData, isLoading } = useInfluenceChain(companyId);
  const [showFullEvidence, setShowFullEvidence] = useState(false);

  const allSteps = useMemo(() => (chainData || []) as ChainStep[], [chainData]);
  const categorized = useMemo(() => categorizeSteps(allSteps), [allSteps]);
  const keyPatterns = useMemo(() => generateKeyPatterns(categorized, allSteps), [categorized, allSteps]);
  const recipients = useMemo(() => collectRecipients(allSteps), [allSteps]);
  const recipientMix = useMemo(() => computeRecipientMix(recipients), [recipients]);

  const totalSpending = allSteps.reduce((s, step) => s + (step.amount || 0), 0);
  const filledCategories = CATEGORIES.filter(c => categorized[c.key].length > 0);

  const handleEntityClick = useMemo(() => {
    if (!onExecutiveClick && !onCandidateClick) return undefined;
    return (entity: { name: string; type: string; linkType: string; amount: number }) => {
      if (entity.type === "executive" && onExecutiveClick) {
        onExecutiveClick({ name: entity.name, total_donations: entity.amount });
      } else if (entity.type === "candidate" && onCandidateClick) {
        onCandidateClick({ name: entity.name, amount: entity.amount });
      }
    };
  }, [onExecutiveClick, onCandidateClick]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Tracing influence connections...
        </CardContent>
      </Card>
    );
  }

  if (!chainData || chainData.length === 0) return null;

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Follow the influence: ${companyName} — ${allSteps.length} connections traced from public records`;
    if (navigator.share) {
      try { await navigator.share({ title: text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast("Link copied!", { description: "Share this influence summary with anyone." });
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[30%] w-72 h-72 rounded-full bg-white/[0.03]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase mb-3">
            <TrendingUp className="w-3.5 h-3.5" /> Follow the Influence
          </div>
          <h2 className="text-xl font-bold font-display mb-2">
            How {companyName} connects to politics
          </h2>
          <p className="text-sm opacity-90 max-w-lg leading-relaxed">
            This view traces how a company connects to politics, policy, and government through donations, lobbying, contracts, and institutional relationships — all from public records.
          </p>
          <p className="text-[11px] opacity-70 mt-2 font-medium tracking-wide">
            Built from public filings, lobbying disclosures, campaign finance records, and federal contract data.
          </p>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">

        {/* ── Plain-English explainer box ── */}
        <div className="rounded-xl border-l-4 border-primary bg-card shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">In plain English</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This view shows how {companyName} connects to politics, policy, and government through donations, lobbying, contracts, and institutional relationships. Each section groups the evidence so you can understand the big picture quickly.
          </p>
        </div>

        {/* ── Summary Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {filledCategories.map(cat => {
            const steps = categorized[cat.key];
            const amount = steps.reduce((s, step) => s + (step.amount || 0), 0);
            const strongCount = steps.filter(s => s.confidence >= 0.8).length;
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", cat.iconClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-foreground">{steps.length}</div>
                <div className="text-[11px] text-muted-foreground leading-tight">{cat.title}</div>
                {amount > 0 && (
                  <div className="text-[10px] font-semibold text-[hsl(var(--civic-green))] mt-1">{formatCurrency(amount)}</div>
                )}
                {strongCount > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{strongCount} strong</div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Key Patterns ── */}
        {keyPatterns.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Key Patterns</span>
            </div>
            <ul className="space-y-2">
              {keyPatterns.map((pattern, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  {pattern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Party mix bar ── */}
        {recipientMix.length > 0 && (
          <div className="p-3 bg-card border border-border rounded-lg">
            <span className="text-xs font-semibold text-foreground">Who gets the money? (by political party)</span>
            <div className="flex h-3 rounded-full overflow-hidden my-2">
              {recipientMix.map((mix, i) => (
                <Link
                  key={i}
                  to={`/values-search?issue=${mix.label === "R" ? "conservative_alignment" : mix.label === "D" ? "progressive_alignment" : "bipartisan"}`}
                  className={cn(
                    "h-full transition-all hover:opacity-80",
                    mix.label === "R" ? "bg-[hsl(0,65%,50%)]" :
                    mix.label === "D" ? "bg-[hsl(218,55%,48%)]" :
                    "bg-muted-foreground/30"
                  )}
                  style={{ width: `${mix.percentage}%` }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              {recipientMix.map((mix, i) => (
                <Link
                  key={i}
                  to={`/values-search?issue=${mix.label === "R" ? "conservative_alignment" : mix.label === "D" ? "progressive_alignment" : "bipartisan"}`}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full inline-block",
                    mix.label === "R" ? "bg-[hsl(0,65%,50%)]" :
                    mix.label === "D" ? "bg-[hsl(218,55%,48%)]" :
                    "bg-muted-foreground/30"
                  )} />
                  {mix.percentage}% {mix.label === "R" ? "Republican" : mix.label === "D" ? "Democrat" : mix.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Category sections ── */}
        <div className="space-y-3">
          {filledCategories.map((cat, idx) => (
            <CategorySection
              key={cat.key}
              category={cat}
              steps={categorized[cat.key]}
              defaultOpen={idx === 0}
              onEntityClick={handleEntityClick}
            />
          ))}
        </div>

        {/* ── View Full Evidence ── */}
        {allSteps.length > 0 && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5"
              onClick={() => setShowFullEvidence(!showFullEvidence)}
            >
              <Eye className="w-3.5 h-3.5" />
              {showFullEvidence ? "Hide Full Evidence" : `View Full Evidence (${allSteps.length} records)`}
            </Button>
            {showFullEvidence && (
              <div className="mt-3 space-y-2 max-h-[600px] overflow-y-auto">
                {sortByImportance(allSteps).map((step, i) => (
                  <EvidenceCard key={`full-${step.chain_id}-${step.step}-${i}`} step={step} onEntityClick={handleEntityClick} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            All data from public records — FEC filings, lobbying reports, USASpending.gov
          </p>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
