import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { useInfluenceChain } from "@/hooks/use-roi-pipeline";
import { PartyBadge, computeRecipientMix } from "@/components/PartyBadge";
import {
  ArrowRight, ArrowDown, GitBranch, Loader2, DollarSign, Users, Landmark,
  FileCheck, RotateCcw, Globe, ChevronDown, ChevronRight, HelpCircle, User,
} from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

/* ── Plain-language labels for every link type ── */
const LINK_TYPE_CONFIG: Record<string, { label: string; plainLabel: string; color: string; icon: React.ElementType }> = {
  donation_to_member:              { label: "Donation",            plainLabel: "Gave money to",                                    color: "text-[hsl(var(--civic-red))]",    icon: DollarSign },
  member_on_committee:             { label: "Committee Seat",      plainLabel: "Sits on a committee that oversees",                 color: "text-[hsl(var(--civic-blue))]",   icon: Users },
  committee_oversight_of_contract: { label: "Contract Oversight",  plainLabel: "That committee controls contracts for",             color: "text-[hsl(var(--civic-green))]",  icon: Landmark },
  lobbying_on_bill:                { label: "Lobbying",             plainLabel: "Paid lobbyists to influence",                       color: "text-[hsl(var(--civic-yellow))]", icon: FileCheck },
  revolving_door:                  { label: "Revolving Door",      plainLabel: "Former government official now works here",          color: "text-destructive",                icon: RotateCcw },
  foundation_grant_to_district:    { label: "Foundation Grant",    plainLabel: "Gave a charitable grant in the district of",         color: "text-[hsl(var(--civic-green))]",  icon: DollarSign },
  trade_association_lobbying:      { label: "Trade Group",         plainLabel: "Belongs to a group that lobbies for",                color: "text-[hsl(var(--civic-yellow))]", icon: Users },
  dark_money_channel:              { label: "Dark Money",          plainLabel: "Money sent through a group that doesn't disclose donors", color: "text-destructive",           icon: DollarSign },
  advisory_committee_appointment:  { label: "Advisory Role",       plainLabel: "Has a person on a government advisory panel",        color: "text-[hsl(var(--civic-blue))]",   icon: Users },
  interlocking_directorate:        { label: "Shared Board Member", plainLabel: "Shares a board member with",                         color: "text-muted-foreground",           icon: Users },
  state_lobbying_contract:         { label: "State Lobbying",      plainLabel: "Paid lobbyists in state government for",             color: "text-[hsl(var(--civic-yellow))]", icon: Landmark },
  international_influence:         { label: "International",       plainLabel: "Has influence activities in other countries",         color: "text-[hsl(var(--civic-blue))]",   icon: Globe },
};

/* ── Map committee names to plain-language issue areas ── */
const COMMITTEE_ISSUES: Record<string, string[]> = {
  "armed services":       ["Military & defense spending"],
  "appropriations":       ["Government spending decisions"],
  "energy and commerce":  ["Energy policy", "Healthcare", "Consumer protection"],
  "energy and natural resources": ["Energy policy", "Public lands"],
  "finance":              ["Taxes", "Healthcare funding", "Trade"],
  "judiciary":            ["Immigration", "Civil rights", "Criminal justice"],
  "education and labor":  ["Education", "Worker rights", "Minimum wage"],
  "education and the workforce": ["Education", "Worker rights"],
  "health":               ["Healthcare policy"],
  "ways and means":       ["Tax policy", "Social Security", "Trade"],
  "foreign affairs":      ["Foreign policy", "International aid"],
  "foreign relations":    ["Foreign policy", "Treaties"],
  "homeland security":    ["Border security", "Immigration enforcement"],
  "agriculture":          ["Farm policy", "Food safety", "Rural programs"],
  "banking":              ["Banking rules", "Housing policy"],
  "commerce":             ["Business regulation", "Consumer protection"],
  "environment":          ["Environmental protection", "Climate policy"],
  "veterans":             ["Veterans benefits", "VA healthcare"],
  "intelligence":         ["National security", "Surveillance"],
  "budget":               ["Federal budget", "Government spending"],
  "small business":       ["Small business support", "Entrepreneurship"],
  "transportation":       ["Roads", "Airlines", "Infrastructure"],
  "rules":                ["How Congress operates"],
  "oversight":            ["Government accountability", "Investigations"],
};

function getCommitteeIssues(committeeName: string): string[] {
  const lower = committeeName.toLowerCase();
  for (const [key, issues] of Object.entries(COMMITTEE_ISSUES)) {
    if (lower.includes(key)) return issues;
  }
  return [];
}

/* ── Clean up ugly entity names so humans can read them ── */
function cleanEntityName(name: string): string {
  if (!name) return "Unknown";
  // Remove SEC CIK identifiers like "SEC CIK 0001234567" or "(CIK: 0001234567)"
  let cleaned = name.replace(/\b(SEC\s*)?CIK[\s:#]*\d+/gi, "").trim();
  // Remove FEC IDs like "C00123456" or "(FEC ID: C00123456)"
  cleaned = cleaned.replace(/\(?\s*FEC\s*(ID)?[\s:#]*C\d+\s*\)?/gi, "").trim();
  // Remove standalone alphanumeric codes like "C00123456" at end
  cleaned = cleaned.replace(/\s*C\d{8,}\s*/g, " ").trim();
  // Remove EIN numbers
  cleaned = cleaned.replace(/\b(EIN|TIN)[\s:#]*\d[\d-]+/gi, "").trim();
  // Remove DUNS numbers
  cleaned = cleaned.replace(/\bDUNS[\s:#]*\d+/gi, "").trim();
  // Remove trailing dashes, commas, or parens left behind
  cleaned = cleaned.replace(/[\s,\-()]+$/, "").replace(/^[\s,\-()]+/, "").trim();
  // If we stripped everything, return original
  return cleaned || name;
}

/* ── Plain-language entity type labels ── */
const ENTITY_TYPE_LABELS: Record<string, string> = {
  company: "Company",
  pac: "Political fund — pools money from employees to donate to politicians",
  super_pac: "Outside spending group — can raise unlimited money",
  politician: "Politician",
  member: "Member of Congress",
  committee: "Congressional committee — a group of lawmakers who control specific policy areas",
  agency: "Government agency",
  contract: "Government contract",
  lobbyist: "Lobbyist — someone paid to talk to lawmakers on behalf of a company",
  trade_association: "Industry group — companies in the same industry pooling money together",
};

const PARTY_FULL_NAMES: Record<string, string> = {
  D: "Democrat",
  R: "Republican",
  I: "Independent",
  L: "Libertarian",
  G: "Green Party",
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

function getEntityStyle(type: string) {
  switch (type) {
    case "company": return "bg-primary/10 border-primary/30 text-primary";
    case "pac": case "super_pac": return "bg-[hsl(var(--civic-red))]/10 border-[hsl(var(--civic-red))]/30 text-[hsl(var(--civic-red))]";
    case "politician": case "member": return "bg-[hsl(var(--civic-blue))]/10 border-[hsl(var(--civic-blue))]/30 text-[hsl(var(--civic-blue))]";
    case "committee": return "bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/30 text-[hsl(var(--civic-yellow))]";
    case "agency": case "contract": return "bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]";
    case "lobbyist": case "trade_association": return "bg-muted border-border text-muted-foreground";
    default: return "bg-muted border-border text-foreground";
  }
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const label = confidence >= 0.8 ? "Strong evidence" : confidence >= 0.5 ? "Some evidence" : "Weak evidence";
  return (
    <div className="flex items-center gap-1" title={label}>
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        confidence >= 0.8 ? "bg-[hsl(var(--civic-green))]" : confidence >= 0.5 ? "bg-[hsl(var(--civic-yellow))]" : "bg-[hsl(var(--civic-red))]"
      )} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

/** Build politician detail from chain context */
function getPoliticianDetail(name: string, party: string | null, location: string | null, chain: ChainStep[]) {
  const committees: string[] = [];
  const allIssues: string[] = [];

  for (const step of chain) {
    if (step.source_name === name && step.link_type === "member_on_committee") {
      committees.push(step.target_name);
      allIssues.push(...getCommitteeIssues(step.target_name));
    }
  }

  return { committees, issues: [...new Set(allIssues)] };
}

function EntityNode({
  name, type, party, location, committees, issues,
}: {
  name: string;
  type: string;
  party?: string | null;
  location?: string | null;
  committees?: string[];
  issues?: string[];
}) {
  const style = getEntityStyle(type);
  const plainType = ENTITY_TYPE_LABELS[type] || type.replace(/_/g, " ");
  const showParty = type !== "company" && type !== "agency" && type !== "contract";
  const isPolitician = type === "politician" || type === "member";
  const partyName = party ? PARTY_FULL_NAMES[party] || party : null;

  const displayName = cleanEntityName(name);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("px-3 py-2 rounded-lg border text-sm font-medium max-w-[280px] cursor-default", style)}>
          <div className="flex items-center gap-1.5">
            {isPolitician && <User className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{displayName}</span>
            {showParty && <PartyBadge party={party} entityType={type} />}
            {location && <span className="text-[9px] text-muted-foreground shrink-0">{location}</span>}
          </div>
          {/* Inline politician detail */}
          {isPolitician && (partyName || (committees && committees.length > 0)) && (
            <div className="mt-1.5 pt-1.5 border-t border-current/10 space-y-1">
              {partyName && (
                <p className="text-[10px] opacity-80">{partyName}{location ? ` — ${location}` : ""}</p>
              )}
              {committees && committees.length > 0 && (
                <p className="text-[10px] opacity-70">
                  Sits on: {committees.join(", ")}
                </p>
              )}
              {issues && issues.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {issues.slice(0, 4).map((issue) => (
                    <span key={issue} className="text-[9px] px-1.5 py-0 rounded-full bg-background/50 border border-current/10">
                      {issue}
                    </span>
                  ))}
                  {issues.length > 4 && (
                    <span className="text-[9px] text-muted-foreground">+{issues.length - 4} more</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-xs">
        <p className="font-medium">{plainType}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function ChainRow({ step, chain }: { step: ChainStep; chain: ChainStep[] }) {
  const config = LINK_TYPE_CONFIG[step.link_type] || { label: step.link_type, plainLabel: "Connected to", color: "text-muted-foreground", icon: ArrowRight };
  const LinkIcon = config.icon;
  const targetParty = extractPartyFromDescription(step.description, step.target_name);
  const targetLocation = extractLocationFromDescription(step.description);
  const sourceParty = extractPartyFromDescription(step.description, step.source_name);

  const sourceIsPolitician = step.source_type === "politician" || step.source_type === "member";
  const targetIsPolitician = step.target_type === "politician" || step.target_type === "member";

  const sourceDetail = sourceIsPolitician ? getPoliticianDetail(step.source_name, sourceParty, extractLocationFromDescription(step.description), chain) : { committees: [], issues: [] };
  const targetDetail = targetIsPolitician ? getPoliticianDetail(step.target_name, targetParty, targetLocation, chain) : { committees: [], issues: [] };

  return (
    <div className="space-y-2">
      {/* Plain-language sentence */}
      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">{cleanEntityName(step.source_name)}</strong>
        {" "}{config.plainLabel.toLowerCase()}{" "}
        <strong className="text-foreground">{cleanEntityName(step.target_name)}</strong>
        {targetParty && ` (${PARTY_FULL_NAMES[targetParty] || targetParty}${targetLocation ? `, ${targetLocation}` : ""})`}
        {step.amount > 0 && <> — <strong className="text-foreground">{formatCurrency(step.amount)}</strong></>}
      </p>

      {/* Visual connection */}
      <div className="flex items-center gap-2 flex-wrap">
        <EntityNode
          name={step.source_name}
          type={step.source_type}
          party={sourceParty}
          committees={sourceDetail.committees}
          issues={sourceDetail.issues}
        />
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div className={cn("flex items-center gap-1", config.color)}>
            <LinkIcon className="w-3.5 h-3.5" />
            <ArrowRight className="w-3 h-3" />
          </div>
          {step.amount > 0 && (
            <span className="text-[10px] font-bold text-foreground">{formatCurrency(step.amount)}</span>
          )}
          <ConfidenceDot confidence={step.confidence} />
        </div>
        <EntityNode
          name={step.target_name}
          type={step.target_type}
          party={targetParty}
          location={targetLocation}
          committees={targetDetail.committees}
          issues={targetDetail.issues}
        />
      </div>
    </div>
  );
}

function groupChains(steps: ChainStep[]): ChainStep[][] {
  const chains: ChainStep[][] = [];
  let currentChain: ChainStep[] = [];
  let lastTarget = "";
  for (const step of steps) {
    if (currentChain.length === 0 || step.source_name === lastTarget) {
      currentChain.push(step);
      lastTarget = step.target_name;
    } else {
      if (currentChain.length > 0) chains.push(currentChain);
      currentChain = [step];
      lastTarget = step.target_name;
    }
  }
  if (currentChain.length > 0) chains.push(currentChain);
  return chains;
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

/** Generate a plain-language story for an entire chain */
function chainStory(chain: ChainStep[], companyName: string): string {
  if (chain.length === 0) return "";

  const first = chain[0];
  const last = chain[chain.length - 1];
  const totalAmount = chain.reduce((s, c) => s + (c.amount || 0), 0);
  const lastParty = extractPartyFromDescription(last.description, last.target_name);
  const partyName = lastParty ? PARTY_FULL_NAMES[lastParty] : null;

  // Find committees mentioned
  const committees = chain
    .filter(s => s.link_type === "member_on_committee")
    .map(s => s.target_name);

  const issues = committees.flatMap(c => getCommitteeIssues(c));
  const uniqueIssues = [...new Set(issues)];

  let story = "";

  if (chain.some(s => s.link_type === "donation_to_member")) {
    story = `${companyName} gave money`;
    if (totalAmount > 0) story += ` (${formatCurrency(totalAmount)})`;
    story += ` to ${cleanEntityName(last.target_name)}`;
    if (partyName) story += `, a ${partyName}`;

    if (committees.length > 0) {
      story += `, who sits on the ${cleanEntityName(committees[0])}`;
      if (uniqueIssues.length > 0) {
        story += `. That committee handles: ${uniqueIssues.slice(0, 3).join(", ")}`;
      }
    }
    story += ".";
  } else if (chain.some(s => s.link_type === "lobbying_on_bill")) {
    story = `${companyName} paid lobbyists to influence legislation connected to ${cleanEntityName(last.target_name)}.`;
  } else if (chain.some(s => s.link_type === "revolving_door")) {
    story = `${companyName} hired ${cleanEntityName(last.target_name)}, who used to work in government. This is called a "revolving door" — people moving between government jobs and private companies.`;
  } else {
    story = `${companyName} is connected to ${cleanEntityName(last.target_name)} through ${chain.length} step${chain.length !== 1 ? "s" : ""}.`;
  }

  return story;
}

export function InfluenceChainCard({ companyId, companyName }: { companyId: string; companyName: string }) {
  const { data: chainData, isLoading } = useInfluenceChain(companyId);
  const [expandedChains, setExpandedChains] = useState<Set<number>>(new Set([0]));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Following the money trail...
        </CardContent>
      </Card>
    );
  }

  if (!chainData || chainData.length === 0) return null;

  const chains = groupChains(chainData as ChainStep[]);
  const allSteps = chainData as ChainStep[];
  const uniqueEntities = new Set([...allSteps.map(s => s.source_name), ...allSteps.map(s => s.target_name)]).size;

  const recipients = collectRecipients(allSteps);
  const recipientMix = computeRecipientMix(recipients);

  const toggleChain = (idx: number) => {
    setExpandedChains(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          Where Does the Money Go?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          This shows how {companyName} spends money on politics — and what happens after.
          Think of it like a trail: the company sends money somewhere, that money reaches a politician or group,
          and that politician or group has power over government decisions that affect the company.
        </p>
      </CardHeader>
      <CardContent>
        {/* How to read this */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/40 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">How to read this</h3>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>Each trail below shows <strong className="text-foreground">where the money goes</strong> and <strong className="text-foreground">who it reaches</strong>.</p>
            <p>For each politician, you'll see their <strong className="text-foreground">political party</strong>, what <strong className="text-foreground">committees</strong> they sit on, and what <strong className="text-foreground">topics</strong> those committees control — like healthcare, taxes, or the environment.</p>
            <p>This matters because the committees a politician sits on decide which companies get government contracts and which rules get written.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-border/40">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(var(--civic-green))]" /> Strong evidence — from official filings</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(var(--civic-yellow))]" /> Some evidence — connects the dots</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(var(--civic-red))]" /> Weak evidence — possible but not confirmed</span>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{chains.length}</div>
            <div className="text-xs text-muted-foreground">Money trail{chains.length !== 1 ? "s" : ""} found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{uniqueEntities}</div>
            <div className="text-xs text-muted-foreground">People & groups involved</div>
          </div>
        </div>

        {/* Recipient Mix */}
        {recipientMix.length > 0 && (
          <div className="p-3 bg-card border border-border rounded-lg mb-5">
            <span className="text-xs font-semibold text-foreground">Who gets the money? (by political party)</span>
            <div className="flex h-3 rounded-full overflow-hidden my-2">
              {recipientMix.map((mix, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full transition-all",
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
                <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className={cn(
                    "w-2 h-2 rounded-full inline-block",
                    mix.label === "R" ? "bg-[hsl(0,65%,50%)]" :
                    mix.label === "D" ? "bg-[hsl(218,55%,48%)]" :
                    "bg-muted-foreground/30"
                  )} />
                  {mix.percentage}% {mix.label === "R" ? "Republican" : mix.label === "D" ? "Democrat" : mix.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chain paths */}
        <div className="space-y-3">
          {chains.map((chain, chainIdx) => {
            const isExpanded = expandedChains.has(chainIdx);
            const chainTotal = chain.reduce((sum, s) => sum + (s.amount || 0), 0);
            const firstStep = chain[0];
            const lastStep = chain[chain.length - 1];
            const lastParty = extractPartyFromDescription(lastStep.description, lastStep.target_name);
            const story = chainStory(chain, companyName);

            return (
              <div key={chainIdx} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleChain(chainIdx)}
                  className="w-full flex items-center justify-between p-3 bg-card hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {chainIdx + 1}
                    </Badge>
                    <span className="text-sm font-medium text-foreground truncate">
                      {cleanEntityName(firstStep.source_name)}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {chain.length} {chain.length === 1 ? "step" : "steps"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {cleanEntityName(lastStep.target_name)}
                    </span>
                    <PartyBadge party={lastParty} entityType={lastStep.target_type} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {chainTotal > 0 && (
                      <span className="text-xs font-bold text-[hsl(var(--civic-green))]">{formatCurrency(chainTotal)}</span>
                    )}
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/30">
                    {/* Plain-language story summary */}
                    {story && (
                      <div className="px-4 pt-3 pb-2">
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-sm text-foreground leading-relaxed">
                            <strong>In plain English:</strong> {story}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step-by-step detail */}
                    <div className="p-4 space-y-4 overflow-x-auto">
                      {chain.map((step, stepIdx) => (
                        <div key={stepIdx} className="flex items-start gap-3">
                          <div className="shrink-0 flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                              {step.step}
                            </div>
                            {stepIdx < chain.length - 1 && <div className="w-px h-12 bg-border" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <ChainRow step={step} chain={chain} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground mt-4 border-t border-border pt-3">
          All of this comes from public records — campaign finance filings, lobbying reports, and government contract databases.
          We connect the dots so you can see how money moves from a company to the people who make government decisions.
        </p>
      </CardContent>
    </Card>
  );
}
