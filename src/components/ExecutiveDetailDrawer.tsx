import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, User, ArrowRight, Linkedin, Globe, Search, Sparkles, Loader2, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/LoadingState";
import { useState } from "react";

interface ExecutiveDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  executive: {
    id: string;
    name: string;
    title: string;
    total_donations: number;
    photo_url?: string | null;
  } | null;
  companyName: string;
  onCandidateClick?: (candidate: any) => void;
}

export function ExecutiveDetailDrawer({ open, onOpenChange, executive, companyName, onCandidateClick }: ExecutiveDetailDrawerProps) {
  const [impactSummary, setImpactSummary] = useState<string | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [expandedRecipient, setExpandedRecipient] = useState<string | null>(null);
  const [recipientSummaries, setRecipientSummaries] = useState<Record<string, string>>({});
  const [loadingRecipient, setLoadingRecipient] = useState<string | null>(null);

  // If we have an id, use it directly. Otherwise resolve by name.
  const { data: resolvedExec } = useQuery({
    queryKey: ["resolve-executive", executive?.name, companyName],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("id, name, title, total_donations, photo_url")
        .ilike("name", `%${executive!.name.split(" ").pop()}%`)
        .limit(5);
      // Best match: find one whose name contains the key parts
      const match = data?.find(e =>
        e.name.toLowerCase().includes(executive!.name.toLowerCase()) ||
        executive!.name.toLowerCase().includes(e.name.toLowerCase())
      );
      return match || null;
    },
    enabled: !!executive?.name && !executive?.id && open,
  });

  const effectiveExecId = executive?.id || resolvedExec?.id;

  const { data: recipients, isLoading } = useQuery({
    queryKey: ["executive-recipients", effectiveExecId],
    queryFn: async () => {
      const { data } = await supabase
        .from("executive_recipients")
        .select("*")
        .eq("executive_id", effectiveExecId!)
        .order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!effectiveExecId && open,
  });

  const fetchRecipientImpact = async (recipientName: string, party: string) => {
    if (recipientSummaries[recipientName]) {
      setExpandedRecipient(expandedRecipient === recipientName ? null : recipientName);
      return;
    }
    setExpandedRecipient(recipientName);
    setLoadingRecipient(recipientName);
    try {
      const { data, error } = await supabase.functions.invoke("candidate-voting-summary", {
        body: {
          candidate_name: recipientName,
          party: party,
          state: "",
          district: null,
        },
      });
      if (error) throw error;
      setRecipientSummaries(prev => ({
        ...prev,
        [recipientName]: data?.summary || "No voting record data available.",
      }));
    } catch {
      setRecipientSummaries(prev => ({
        ...prev,
        [recipientName]: "Could not load voting record. Try the research links below.",
      }));
    } finally {
      setLoadingRecipient(null);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setImpactSummary(null);
      setExpandedRecipient(null);
      setRecipientSummaries({});
    }
    onOpenChange(isOpen);
  };

  if (!executive) return null;

  // Normalize "LAST, FIRST" → "First Last" for social search URLs
  const normalizeDisplayName = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.includes(",")) {
      const [last, ...firstParts] = trimmed.split(",").map(s => s.trim());
      const first = firstParts.join(" ").trim();
      if (first && last) {
        const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        return first.split(/\s+/).map(titleCase).join(" ") + " " + last.split(/\s+/).map(titleCase).join(" ");
      }
    }
    return trimmed;
  };

  const displayName = normalizeDisplayName(executive.name);
  // Strip company suffixes for cleaner employer search
  const cleanCompany = companyName.replace(/,?\s*(LP|LLC|Inc\.?|Corp\.?|Co\.?)$/i, "").trim();

  const linkedInUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(displayName + " " + cleanCompany)}`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`"${displayName}" "${cleanCompany}" site:linkedin.com OR site:twitter.com OR site:x.com`)}`;
  const fecDonorUrl = `https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodeURIComponent(executive.name)}&contributor_employer=${encodeURIComponent(companyName)}`;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3 text-xl">
            {executive.photo_url ? (
              <img src={executive.photo_url} alt={executive.name} className="w-12 h-12 rounded-full object-cover border-2 border-border/60 shrink-0" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 border-2 border-border/60">
                <User className="w-6 h-6 text-muted-foreground/70" />
              </div>
            )}
            <div>
              {executive.name}
              <div className="flex items-center gap-2 mt-1">
                <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" title="Search LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href={googleSearchUrl} target="_blank" rel="noopener noreferrer" title="Find social profiles" className="text-muted-foreground hover:text-primary transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
              </div>
            </div>
          </SheetTitle>
          <SheetDescription>
            {executive.title} at {companyName}
          </SheetDescription>
        </SheetHeader>

        <Card className="mb-4">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Personal Giving</p>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(executive.total_donations)}</span>
            <p className="text-xs text-muted-foreground mt-1">
              Personal donations — does not necessarily represent corporate policy.
            </p>
          </CardContent>
        </Card>

        {/* Party breakdown summary */}
        {recipients && recipients.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Party Breakdown</p>
              {(() => {
                const partyTotals = recipients.reduce((acc, r) => {
                  const p = r.party || "Unknown";
                  acc[p] = (acc[p] || 0) + (r.amount || 0);
                  return acc;
                }, {} as Record<string, number>);
                const sorted = Object.entries(partyTotals).sort((a, b) => b[1] - a[1]);
                const total = sorted.reduce((s, [, v]) => s + v, 0);
                return (
                  <div className="space-y-2">
                    {sorted.map(([party, amount]) => (
                      <div key={party}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className={cn(
                            "font-medium",
                            party === "Republican" && "text-destructive",
                            party === "Democrat" && "text-primary",
                            party !== "Republican" && party !== "Democrat" && "text-muted-foreground"
                          )}>{party}</span>
                          <span className="text-foreground font-medium">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              party === "Republican" && "bg-destructive",
                              party === "Democrat" && "bg-primary",
                              party !== "Republican" && party !== "Democrat" && "bg-muted-foreground"
                            )}
                            style={{ width: `${total > 0 ? (amount / total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Recipients with impact drill-down */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground mb-1">Where the Money Goes</p>
          <p className="text-xs text-muted-foreground mb-3">Sorted by amount. Click any recipient to see what they vote for.</p>
          {isLoading ? (
            <LoadingState message="Loading recipients..." />
          ) : recipients && recipients.length > 0 ? (
            <div className="space-y-2">
              {recipients.map((r, idx) => {
                const isExpanded = expandedRecipient === r.name;
                const summary = recipientSummaries[r.name];
                const isLoadingThis = loadingRecipient === r.name;
                const stateDisplay = r.state || (r as any).district ? `${r.state || ""}${(r as any).district ? `, Dist. ${(r as any).district}` : ""}` : null;

                return (
                  <div key={r.id} className="rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => fetchRecipientImpact(r.name, r.party)}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-primary/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">#{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{r.name}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                r.party === "Republican" && "border-destructive/50 text-destructive",
                                r.party === "Democrat" && "border-primary/50 text-primary"
                              )}
                            >
                              {r.party === "Republican" ? "R" : r.party === "Democrat" ? "D" : r.party}
                            </Badge>
                            {stateDisplay && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />{stateDisplay}
                              </span>
                            )}
                          </div>
                          {(r as any).committee_name && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{(r as any).committee_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(r.amount)}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 border-t border-border bg-card">
                        {isLoadingThis ? (
                          <div className="flex items-center gap-2 py-3">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">Researching what {r.name} supports...</span>
                          </div>
                        ) : summary ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Sparkles className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">What this money supports</span>
                            </div>
                            <p className="text-xs text-foreground leading-relaxed whitespace-pre-line mb-3">{summary}</p>
                          </>
                        ) : null}

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                            <a href={`https://www.congress.gov/search?q=${encodeURIComponent(r.name)}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" /> Congress.gov
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                            <a href={`https://www.fec.gov/data/candidates/?search=${encodeURIComponent(r.name)}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" /> FEC Filings
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                            <a href={`https://justfacts.votesmart.org/candidate/key-votes/${encodeURIComponent(r.name.replace(/\s+/g, '-').toLowerCase())}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" /> VoteSmart
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                            <a href={`https://www.opensecrets.org/search?q=${encodeURIComponent(r.name)}&type=members`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" /> OpenSecrets
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => onCandidateClick?.({
                            id: r.id,
                            name: r.name,
                            party: r.party,
                            state: "",
                            amount: r.amount,
                            donation_type: "Individual",
                            flagged: false,
                          })}>
                            <ArrowRight className="w-3 h-3" /> Full Profile
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                          Research this person to understand what policies and legislation your executive is financially supporting.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No itemized recipient data available. Check FEC individual contribution records for full details.
            </p>
          )}
        </div>

        {/* Social & Research links */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Find this person</p>
          <div className="grid gap-2">
            <Button variant="outline" size="sm" className="justify-start gap-2 w-full" asChild>
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn Profile
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 w-full" asChild>
              <a href={googleSearchUrl} target="_blank" rel="noopener noreferrer">
                <Search className="w-3.5 h-3.5" />
                Google Social Profiles
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 w-full" asChild>
              <a href={fecDonorUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                FEC – Individual Contributions
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
