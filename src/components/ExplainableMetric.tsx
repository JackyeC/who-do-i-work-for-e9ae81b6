import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricExplanation {
  title: string;
  what: string;
  why: string;
  source?: string;
  sourceUrl?: string;
  context?: string;
}

const METRIC_EXPLANATIONS: Record<string, MetricExplanation> = {
  // ── Summary metrics ──
  "civic-footprint": {
    title: "Civic Footprint Score",
    what: "A 0–100 composite score measuring how much political activity we've detected for this company — PAC spending, lobbying, executive donations, government contracts, and organizational ties.",
    why: "Higher doesn't mean worse. It means this company is more politically active. A score of 0 means we found no political spending. A score of 80+ means significant political engagement across multiple channels.",
    source: "FEC, Senate LDA, USASpending.gov",
  },
  "pac-spending": {
    title: "PAC Spending",
    what: "Total money donated by this company's Political Action Committee (PAC) to candidates, parties, and other committees during the current election cycle.",
    why: "Corporate PACs pool voluntary contributions from employees and shareholders. This money goes directly to political candidates. It's legal and disclosed, but shows who the company is financially backing.",
    source: "Federal Election Commission (OpenFEC)",
    sourceUrl: "https://www.fec.gov",
  },
  "lobbying": {
    title: "Lobbying Spend",
    what: "How much this company spends annually on registered federal lobbyists who advocate for specific policies or legislation in Congress and federal agencies.",
    why: "Lobbying is legal, but the amount and issues lobbied on reveal what policies a company is trying to influence. High lobbying spend on specific bills can signal where the company's interests diverge from public interest.",
    source: "Senate Lobbying Disclosure Act filings",
    sourceUrl: "https://lda.senate.gov",
  },
  "gov-contracts": {
    title: "Government Contracts",
    what: "Total value of federal contracts awarded to this company. Includes procurement contracts, grants, and other financial assistance from U.S. government agencies.",
    why: "When a company that spends heavily on lobbying and PAC donations also receives large government contracts, it raises questions about whether political spending influences contract awards.",
    source: "USASpending.gov",
    sourceUrl: "https://www.usaspending.gov",
  },
  "subsidies": {
    title: "Subsidies & Tax Breaks",
    what: "Estimated total of government subsidies, tax incentives, and financial assistance received from federal and state governments.",
    why: "Subsidies represent taxpayer money flowing to corporations. Understanding the ratio of political spending to subsidies received helps evaluate a company's return on political investment.",
    source: "Good Jobs First, USASpending.gov",
  },
  "effective-tax-rate": {
    title: "Effective Tax Rate",
    what: "The actual percentage of income this company pays in taxes after all deductions, credits, and loopholes — as opposed to the statutory rate (currently 21% federal for corporations).",
    why: "The gap between the statutory rate and a company's effective rate reveals how much they benefit from tax breaks and loopholes. A rate well below 21% suggests aggressive tax strategies or substantial government incentives.",
    source: "SEC EDGAR filings, annual reports",
    context: "The U.S. corporate statutory tax rate is 21%. Many large companies pay significantly less through deductions, credits, offshore structures, and industry-specific incentives.",
  },
  "indirect-influence": {
    title: "Indirect Influence",
    what: "Total estimated money flowing through Super PACs and dark money organizations connected to this company — channels where the company's influence is harder to trace.",
    why: "Unlike direct PAC donations, Super PACs can accept unlimited amounts and dark money groups don't have to disclose donors. These channels can magnify a company's political influence while obscuring its involvement.",
    source: "FEC, IRS 990 filings, OpenSecrets",
  },
  "risk-signals": {
    title: "Risk Signals",
    what: "Count of flagged connections to controversial organizations, candidates with extreme records, and dark money channels associated with this company.",
    why: "Not all political spending is equal. Connections to organizations designated as extremist, candidates with unusual voting patterns, or untraceable dark money channels represent elevated risk for stakeholders.",
    source: "Multiple (FEC, SPLC, ADL, lobbying disclosures)",
  },

  // ── Card-level modules ──
  "influence-roi": {
    title: "Influence ROI",
    what: "The ratio of government benefits received (contracts, subsidies, tax breaks) to political spending (PAC donations, lobbying). An ROI of 10× means the company received $10 in government benefits for every $1 spent on political influence.",
    why: "This metric reveals whether political spending appears to generate a financial return. A high ROI doesn't prove corruption — but it highlights companies where the relationship between spending and benefits deserves scrutiny.",
    source: "USASpending.gov, FEC, Senate LDA",
    context: "Graded A+ (highest ROI, >50×) through D (no measurable return). 'N/A' means insufficient data.",
  },
  "hypocrisy-index": {
    title: "Say-Do Gap™ (CHI Score)",
    what: "The Corporate Hypocrisy Index compares a company's public statements (diversity pledges, climate commitments, worker advocacy) against its actual political spending and labor practices to quantify the gap between messaging and action.",
    why: "Many companies publicly support causes while their PAC and lobbying dollars flow in the opposite direction. This score helps job seekers and consumers identify when a company's marketing doesn't match its money.",
    source: "Public statements, lobbying records, PAC filings, labor enforcement data",
    context: "Graded A (strong alignment) through F (severe contradictions). Each stance is compared to actual spending patterns.",
  },
  "political-risk": {
    title: "Political Risk Score",
    what: "A composite risk assessment based on dark money percentage, connections to flagged/extremist organizations, revolving door relationships, and stakeholder disconnect score.",
    why: "Political risk affects employees (workplace culture, policy shifts), consumers (brand reputation), and investors (regulatory exposure). This score quantifies how much political activity could create stakeholder conflicts.",
    source: "FEC, SPLC, ADL, revolving door databases",
    context: "Graded A (low risk) through F (severe risk). Factors: dark money %, flagged org count, revolving door hires, stakeholder disconnect.",
  },
  "benchmarks": {
    title: "Industry Benchmarks",
    what: "How this company's political spending, civic footprint, and transparency compare to peers in the same industry. Shows industry rank, peer averages, and whether the company is an outlier.",
    why: "Context matters. A $1M lobbying spend means very different things in Big Tech vs. a small retail chain. Benchmarks help you understand if a company's political activity is typical or unusual for its sector.",
    source: "CPA-Zicklin Index, aggregated industry data",
  },
  "roi-pipeline": {
    title: "ROI Pipeline",
    what: "A visual trace showing how money flows from the company through political channels (PAC donations, lobbying, trade associations) into the network of legislators and committees, and back as government benefits (contracts, grants, regulatory outcomes).",
    why: "This is the 'follow the money' view. It connects the dots between a donation to a specific congressperson and a contract awarded by a committee that congressperson oversees.",
    source: "Entity linkages from FEC, USASpending, Congress data",
  },
  "worker-sentiment": {
    title: "Worker Sentiment",
    what: "AI-analyzed employee reviews and workplace signals covering overall satisfaction, culture, compensation, career opportunities, work-life balance, and CEO approval. Includes top praises and complaints.",
    why: "Worker sentiment reveals the lived experience inside a company — often contradicting corporate marketing. Low sentiment combined with high political spending on anti-labor causes is a red flag for job seekers.",
    source: "Glassdoor, Indeed, Blind, and other review platforms (via Firecrawl)",
  },
  "ai-hiring": {
    title: "AI Hiring Technology",
    what: "Signals about whether this company uses AI-powered tools in hiring — resume screening algorithms, automated interview analysis, AI chatbots, or predictive analytics for candidate evaluation.",
    why: "AI hiring tools can introduce bias and reduce transparency in the hiring process. NYC Local Law 144 requires bias audits for automated employment decision tools. Knowing if a company uses these tools helps candidates prepare and understand their rights.",
    source: "Job postings, vendor partnerships, regulatory filings",
    context: "Signals are categorized by confidence: Direct Source (vendor confirmed), Multi-Source (multiple indicators), Inferred (single indicator).",
  },
  "worker-benefits": {
    title: "Worker Benefits & Protections",
    what: "Analysis of employee benefits including healthcare coverage, retirement plans, paid leave policies, remote work options, severance packages, and workplace safety records.",
    why: "Benefits reveal how a company truly values its workforce. Companies that lobby against worker protections while offering strong internal benefits have a different profile than those aligned on both fronts.",
    source: "Job postings, benefits pages, DOL enforcement data, OSHA records",
  },
  "compensation-transparency": {
    title: "Compensation Transparency",
    what: "Signals about pay equity practices, salary range disclosure, CEO-to-worker pay ratio, gender/racial pay gap data, and compliance with state pay transparency laws.",
    why: "Pay transparency is increasingly required by law in many states. Companies that proactively disclose compensation data signal a different culture than those that resist transparency mandates.",
    source: "SEC filings, state disclosures, job posting analysis",
  },
  "ideology-flags": {
    title: "Ideology & Affiliation Flags",
    what: "Connections between this company and organizations on ideological watchlists — including politically active nonprofits and organizations flagged by civil rights monitors.",
    why: "These flags don't mean a company endorses extremism. They identify financial or organizational relationships that could affect workplace culture, brand perception, or stakeholder trust.",
    source: "SPLC, ADL, lobbying disclosures, IRS 990 filings",
    context: "Severity levels: Critical (direct funding of flagged orgs), High (board/leadership overlap), Medium (trade association membership), Low (indirect connection).",
  },
  "social-monitor": {
    title: "Social & Media Signals",
    what: "Tracked mentions, controversies, and narrative shifts detected from news coverage, social media, and public statements related to this company's political and civic activities.",
    why: "Media coverage can signal emerging risks or validate existing concerns. A spike in negative coverage around political spending often precedes stakeholder action.",
    source: "News aggregation, social media monitoring",
  },
  "agency-contracts": {
    title: "Government Agency Contracts",
    what: "Detailed breakdown of federal contracts by agency, including contract value, description, fiscal year, and any additional context notes (e.g., contracts awarded by agencies the company lobbies).",
    why: "The specific agencies a company contracts with — and whether those overlap with lobbying targets — can provide additional context about the relationship.",
    source: "USASpending.gov, FPDS",
    sourceUrl: "https://www.usaspending.gov",
  },
  "influence-chain": {
    title: "Influence Chain",
    what: "A graph tracing relationships between the company, its executives, PACs, lobbyists, legislators, committees, and government agencies — showing how influence flows through multiple intermediaries.",
    why: "Influence rarely flows in a straight line. A company might donate to a trade association, which lobbies a committee, whose chair oversees the agency awarding the company contracts. This view maps those chains.",
    source: "Entity linkages from FEC, Congress, USASpending",
  },
  "warn-tracker": {
    title: "WARN Act Notices",
    what: "Worker Adjustment and Retraining Notification (WARN) Act filings — legally required 60-day advance notices of mass layoffs or plant closures affecting 100+ employees.",
    why: "WARN notices are a leading indicator of workforce instability. Frequent filings, especially while the company increases political spending or reports strong revenue, signal potential Say-Do Gap issues.",
    source: "State WARN notice databases",
    context: "The federal WARN Act requires employers with 100+ employees to provide 60 days notice before mass layoffs. Some states have stricter requirements.",
  },
  "ai-accountability": {
    title: "AI Accountability",
    what: "Assessment of how this company governs its use of artificial intelligence — including published AI ethics policies, bias audit compliance, algorithmic transparency, and responsible AI commitments.",
    why: "As AI becomes embedded in hiring, customer service, and decision-making, companies without accountability frameworks pose risks to employees and consumers who are subject to automated decisions.",
    source: "Company policies, regulatory filings, vendor disclosures",
  },
  "dark-money": {
    title: "Dark Money Connections",
    what: "Links to 501(c)(4) social welfare organizations and other entities that spend on political activities without disclosing their donors. These connections are inferred from public filings and organizational relationships.",
    why: "Dark money is legal but opaque. When a company is connected to organizations that spend politically without donor disclosure, it means some of the company's political influence is untraceable by the public.",
    source: "IRS 990 filings, FEC independent expenditure reports",
  },
  "revolving-door": {
    title: "Revolving Door",
    what: "Executives or lobbyists who have moved between this company and government positions — former regulators hired by the company, or former company employees now in government roles overseeing the industry.",
    why: "Revolving door relationships can create conflicts of interest. A former FDA official hired by a pharmaceutical company may have insider knowledge and relationships that give the company an unfair advantage.",
    source: "Congressional records, lobbying registrations, LinkedIn",
  },
  "executive-donors": {
    title: "Executive Donors",
    what: "Personal political donations made by the company's executives and board members. These are individual contributions, not corporate PAC money — they reflect the personal political preferences of leadership.",
    why: "Executive donations are personal and legal. But when a company's leadership consistently donates to candidates who oppose the company's stated values, it reveals potential Say-Do Gap issues.",
    source: "FEC individual contribution records",
    sourceUrl: "https://www.fec.gov/data/receipts/individual-contributions/",
    context: "Individual contribution limits: $3,300 per candidate per election (2024 cycle). These are personal funds, not necessarily reflecting corporate policy.",
  },
  "party-breakdown": {
    title: "Party Breakdown",
    what: "How this company's PAC spending is distributed across political parties — Republican, Democrat, and other parties or committees.",
    why: "Party split reveals political alignment. A 90/10 split signals strong partisan preference. A 50/50 split suggests strategic bipartisan hedging. Neither is inherently good or bad — but it's context for other signals.",
    source: "FEC disbursement records",
  },
  "candidates-funded": {
    title: "Candidates Funded",
    what: "Individual politicians who received money from this company's PAC or executives. Includes candidate name, party, state, amount, and whether they've been flagged for controversial positions or votes.",
    why: "Knowing exactly which candidates a company supports — and what those candidates have voted for — lets you judge alignment between the company's stated values and its political investments.",
    source: "FEC disbursement records, congressional voting records",
  },
  "monitoring-status": {
    title: "Monitoring Status",
    what: "Whether this company's web pages (careers, about, leadership, benefits) are being actively monitored for changes that could signal new hiring practices, policy shifts, or workforce changes.",
    why: "Companies often update their websites before public announcements. Monitoring catches changes to benefits pages, leadership teams, or job postings that may signal upcoming shifts.",
    source: "Browse AI web monitoring",
  },
  "signal-timeline": {
    title: "Signal Timeline",
    what: "A chronological view of signals detected for this company — when each data point was first found, last verified, and any changes over time.",
    why: "Timing matters. A spike in lobbying before a regulatory vote, or a benefits page change before layoffs, tells a different story than the same signals in isolation.",
    source: "All platform data sources",
  },
  "transparency-index": {
    title: "Transparency Index",
    what: "A composite grade measuring how transparent this company is about its political spending, lobbying activities, and corporate governance. Factors in voluntary disclosures beyond legal requirements.",
    why: "Transparency is a choice. Companies that proactively disclose political spending, lobbying positions, and governance structures demonstrate accountability. Low transparency despite high political activity is a risk signal.",
    source: "CPA-Zicklin Index, company disclosures",
  },
  "corporate-structure": {
    title: "Corporate Structure",
    what: "The legal entity tree — parent companies, subsidiaries, and affiliated entities. Shows how the corporation is organized across jurisdictions and what entities are connected to the brand you know.",
    why: "Political spending is often routed through subsidiaries or parent companies. Understanding the corporate structure helps connect spending to the right brand and reveals potential jurisdictional advantages.",
    source: "OpenCorporates, SEC EDGAR, state registries",
  },
  "cpa-zicklin": {
    title: "CPA-Zicklin Score",
    what: "A percentage score (0–100%) from the Center for Political Accountability and the Zicklin Center for Business Ethics. It measures how transparent a company is about its political spending — whether they disclose PAC donations, lobbying, trade association memberships, and have board-level oversight of political activity.",
    why: "A high score means the company voluntarily goes beyond legal requirements to tell the public where its political money goes. A low score means they keep that information private. This doesn't tell you whether their spending is good or bad — just whether they're open about it.",
    source: "CPA-Zicklin Index of Corporate Political Disclosure and Accountability",
    sourceUrl: "https://www.politicalaccountability.net",
    context: "The S&P 500 average is about 55%. Companies scoring 80%+ are considered leaders in political transparency. Companies scoring below 30% are considered opaque.",
  },
  "flagged-organization": {
    title: "Flagged Organization",
    what: "An organization that has been designated by civil rights monitors (like the Southern Poverty Law Center or Anti-Defamation League) or appears on curated watchlists for promoting extremist, discriminatory, or controversial ideologies. A 'flag' means we detected a financial or organizational link between this company and such an organization.",
    why: "This doesn't mean the company endorses the organization's views. But it means money or leadership connections exist between them. As an employee or consumer, you may want to know if your company is financially connected to groups whose values conflict with your own.",
    source: "SPLC, ADL, InfluenceWatch, IRS 990 filings",
    context: "Relationship types include: direct funding, PAC contributions, executive donations, board memberships, trade association dues, and event sponsorships. Each is shown with a confidence level.",
  },
  "party-democrat": {
    title: "Democrat (D)",
    what: "This candidate or committee is affiliated with the Democratic Party. When you see a 'D' badge next to a candidate's name, it means your company's PAC or executives donated money to a Democratic candidate or committee.",
    why: "Knowing the party affiliation of donation recipients helps you understand your employer's political alignment. If the company donates heavily to one party, it signals which policies and candidates the company is financially backing — policies that may affect issues you care about.",
    source: "Federal Election Commission (FEC)",
  },
  "party-republican": {
    title: "Republican (R)",
    what: "This candidate or committee is affiliated with the Republican Party. When you see an 'R' badge next to a candidate's name, it means your company's PAC or executives donated money to a Republican candidate or committee.",
    why: "Knowing the party affiliation of donation recipients helps you understand your employer's political alignment. If the company donates heavily to one party, it signals which policies and candidates the company is financially backing — policies that may affect issues you care about.",
    source: "Federal Election Commission (FEC)",
  },
  "state-lobbying": {
    title: "State-Level Lobbying",
    what: "Lobbying expenditures at the state level — separate from federal lobbying. Includes which states the company lobbies in, the issues targeted, and whether the company also holds state government contracts.",
    why: "State lobbying often targets labor laws, tax policy, and environmental regulations that directly affect workers and communities. The overlap between state lobbying and state contracts can reveal influence patterns.",
    source: "State lobbying registries, FollowTheMoney.org",
  },
  "foundation-grants": {
    title: "Foundation Grants",
    what: "Charitable giving from the company's corporate foundation, including recipient organizations, grant amounts, and any political relevance (e.g., grants to organizations in a key legislator's district).",
    why: "Corporate philanthropy can serve dual purposes. Grants to nonprofits in a powerful committee chair's district may build political goodwill. This isn't inherently wrong, but it's part of the influence picture.",
    source: "IRS 990-PF filings",
  },
};

interface ExplainableMetricProps {
  metricKey: string;
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

export function ExplainableMetric({ metricKey, children, className, align = "center" }: ExplainableMetricProps) {
  const [open, setOpen] = useState(false);
  const explanation = METRIC_EXPLANATIONS[metricKey];

  if (!explanation) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "group relative text-left cursor-pointer transition-all rounded-lg",
            "hover:ring-2 hover:ring-primary/20 hover:bg-primary/[0.02]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          {children}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-80 p-0" sideOffset={8}>
        <div className="p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">{explanation.title}</h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">What is this?</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{explanation.what}</p>
            </div>
            
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why it matters</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{explanation.why}</p>
            </div>

            {explanation.context && (
              <div className="p-2.5 bg-muted/60 rounded-md">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Context</p>
                <p className="text-xs text-foreground/70 leading-relaxed">{explanation.context}</p>
              </div>
            )}

            {explanation.source && (
              <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                <span className="text-[10px] text-muted-foreground">Source:</span>
                {explanation.sourceUrl ? (
                  <a
                    href={explanation.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {explanation.source}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-[10px] text-muted-foreground">{explanation.source}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
