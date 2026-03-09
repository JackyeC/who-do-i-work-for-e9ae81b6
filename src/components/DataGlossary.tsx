import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface GlossaryEntry {
  term: string;
  definition: string;
  category: "identifier" | "metric" | "source" | "concept";
  example?: string;
}

const GLOSSARY: GlossaryEntry[] = [
  // Identifiers
  { term: "SEC CIK", definition: "Central Index Key — a unique number the SEC assigns to every company that files with them. Think of it like a Social Security number for corporations. Example: CIK 0001385280 = Cinemark Holdings.", category: "identifier", example: "0001385280" },
  { term: "FEC Committee ID", definition: "A unique ID the Federal Election Commission assigns to every Political Action Committee (PAC). Used to track all donations a PAC makes.", category: "identifier", example: "C00123456" },
  { term: "DUNS Number", definition: "A 9-digit ID from Dun & Bradstreet that uniquely identifies a business entity. Used in government contracting.", category: "identifier" },
  { term: "Entity ID", definition: "Our internal identifier linking a company to all its known aliases, subsidiaries, and PACs across data sources.", category: "identifier" },

  // Sources
  { term: "OpenFEC", definition: "The Federal Election Commission's public API. We pull PAC contributions, individual donations by executives, and committee filings from here. All data is from official FEC filings.", category: "source" },
  { term: "SEC EDGAR", definition: "The SEC's public filing system. We pull executive compensation, insider stock transactions, and corporate disclosures from here.", category: "source" },
  { term: "USASpending.gov", definition: "The U.S. government's official database of federal spending. We pull contract awards, grants, and other financial assistance from here.", category: "source" },
  { term: "Senate LDA", definition: "Lobbying Disclosure Act filings with the U.S. Senate. Shows which companies hire lobbyists, how much they spend, and what issues they lobby on.", category: "source" },
  { term: "OpenCorporates", definition: "A global database of corporate registrations. We use it to find subsidiaries, officers, and legal structure.", category: "source" },
  { term: "DOL / OSHA", definition: "Department of Labor / Occupational Safety & Health Administration. We pull workplace safety inspections and wage violation enforcement data.", category: "source" },

  // Metrics
  { term: "Civic Footprint Score", definition: "Our 0–100 composite score measuring a company's political influence footprint. Higher = more political activity detected. Not a judgment — just a measure of activity level.", category: "metric" },
  { term: "Confidence Level", definition: "How certain we are about a data connection. ≥80% = directly from official filings. 50–79% = inferred from patterns (e.g., name matching). <50% = unverified or weak evidence.", category: "metric" },
  { term: "ROI Ratio", definition: "The ratio of government benefits received (contracts, grants, subsidies) to political spending (PAC donations, lobbying). A 10x ratio means the company received $10 in government benefits for every $1 spent on politics.", category: "metric" },
  { term: "CHI Score", definition: "Corporate Hypocrisy Index — measures the gap between a company's public statements and its actual political spending. Higher = more contradictions found.", category: "metric" },
  { term: "Political Risk Score", definition: "A composite score factoring in dark money connections, revolving door hires, and spending on controversial organizations.", category: "metric" },
  { term: "Transparency Grade", definition: "How openly a company discloses its political activity. Grades from A (fully transparent) to F (minimal disclosure).", category: "metric" },
  { term: "CPA-Zicklin Score", definition: "A percentage score from the Center for Political Accountability measuring how transparent a company is about political spending — PAC donations, lobbying, trade association dues, and board oversight. S&P 500 average is ~55%. Scores above 80% = transparency leader; below 30% = opaque.", category: "metric" },
  { term: "Effective Tax Rate", definition: "The actual percentage of income a company pays in taxes after all deductions, credits, and loopholes. The U.S. corporate statutory rate is 21%, but many large companies pay significantly less through legal tax strategies.", category: "metric" },

  // Concepts
  { term: "PAC", definition: "Political Action Committee — a legal entity that pools campaign contributions from members and donates to candidates or parties. A 'Corporate PAC' is funded by a company's employees and shareholders.", category: "concept" },
  { term: "Super PAC", definition: "An independent-expenditure-only committee that can raise unlimited money but cannot donate directly to candidates. They run ads and campaigns independently.", category: "concept" },
  { term: "Dark Money", definition: "Political spending where the original donor is hidden. Typically flows through 501(c)(4) nonprofits that don't have to disclose donors, then to Super PACs or issue campaigns.", category: "concept" },
  { term: "Revolving Door", definition: "When people move between government roles and private-sector jobs at the same companies they used to regulate. Suggests potential conflicts of interest.", category: "concept" },
  { term: "Entity Resolution", definition: "The process of figuring out that 'Cinemark Holdings Inc', 'Cinemark USA Inc', and 'CINEMARK HOLDINGS INC PAC' all refer to the same parent company. We match across name variants, subsidiaries, and PACs.", category: "concept" },
  { term: "Influence Chain", definition: "A traced path showing how money flows from a company → to a politician → who sits on a committee → that oversees contracts the company benefits from.", category: "concept" },
  { term: "WARN Notice", definition: "Worker Adjustment and Retraining Notification — a federal law requiring employers to give 60 days' notice before mass layoffs. We track these filings.", category: "concept" },
  { term: "Money In / Benefits Out", definition: "The two sides of the Influence Pipeline. 'Money In' = what a company spends on politics (PAC donations, lobbying, executive giving). 'Benefits Out' = what it receives (contracts, grants, tax breaks, favorable regulation).", category: "concept" },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  identifier: { label: "ID / Code", color: "bg-primary/10 text-primary border-primary/20" },
  metric: { label: "Metric", color: "bg-civic-green/10 text-civic-green border-civic-green/20" },
  source: { label: "Data Source", color: "bg-civic-blue/10 text-civic-blue border-civic-blue/20" },
  concept: { label: "Concept", color: "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20" },
};

export function DataGlossary() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? GLOSSARY.filter(
        (g) =>
          g.term.toLowerCase().includes(search.toLowerCase()) ||
          g.definition.toLowerCase().includes(search.toLowerCase())
      )
    : GLOSSARY;

  const grouped = {
    concept: filtered.filter((g) => g.category === "concept"),
    source: filtered.filter((g) => g.category === "source"),
    metric: filtered.filter((g) => g.category === "metric"),
    identifier: filtered.filter((g) => g.category === "identifier"),
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border/60">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                What does this data mean? — Glossary & Key
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-5">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search terms (e.g. CIK, PAC, dark money...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>

            {Object.entries(grouped).map(([category, entries]) => {
              if (entries.length === 0) return null;
              const config = CATEGORY_CONFIG[category];
              return (
                <div key={category} className="mb-5 last:mb-0">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Badge variant="outline" className={cn("text-[10px] font-semibold", config.color)}>
                      {config.label}
                    </Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div key={entry.term} className="pl-3 border-l-2 border-border">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-foreground">{entry.term}</span>
                          {entry.example && (
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              e.g. {entry.example}
                            </code>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                          {entry.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No matching terms found. Try a different search.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
