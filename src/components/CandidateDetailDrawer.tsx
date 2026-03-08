import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, MapPin, Vote, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";

interface CandidateDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: {
    id: string;
    name: string;
    party: string;
    state: string;
    district?: string | null;
    amount: number;
    donation_type: string;
    flagged: boolean;
    flag_reason?: string | null;
  } | null;
  companyName: string;
}

export function CandidateDetailDrawer({ open, onOpenChange, candidate, companyName }: CandidateDetailDrawerProps) {
  const [votingSummary, setVotingSummary] = useState<string | null>(null);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [votingError, setVotingError] = useState<string | null>(null);

  const fetchVotingSummary = async () => {
    if (!candidate || votingSummary) return;
    setLoadingVotes(true);
    setVotingError(null);
    try {
      const { data, error } = await supabase.functions.invoke("candidate-voting-summary", {
        body: {
          candidate_name: candidate.name,
          party: candidate.party,
          state: candidate.state,
          district: candidate.district,
        },
      });
      if (error) throw error;
      setVotingSummary(data?.summary || "No voting data available.");
    } catch (e: any) {
      setVotingError(e.message || "Failed to load voting summary");
    } finally {
      setLoadingVotes(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && candidate && !votingSummary && !loadingVotes) {
      fetchVotingSummary();
    }
    if (!isOpen) {
      setVotingSummary(null);
      setVotingError(null);
    }
    onOpenChange(isOpen);
  };

  if (!candidate) return null;

  const congressSearchUrl = `https://www.congress.gov/search?q=${encodeURIComponent(candidate.name)}`;
  const voteSmartUrl = `https://justfacts.votesmart.org/candidate/key-votes/${encodeURIComponent(candidate.name.replace(/\s+/g, '-').toLowerCase())}`;
  const openSecretsUrl = `https://www.opensecrets.org/search?q=${encodeURIComponent(candidate.name)}&type=candidates`;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            {candidate.name}
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                candidate.party === "Republican" && "border-destructive/50 text-destructive",
                candidate.party === "Democrat" && "border-primary/50 text-primary"
              )}
            >
              {candidate.party}
            </Badge>
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {candidate.state}{candidate.district ? `, District ${candidate.district}` : ""}
          </SheetDescription>
        </SheetHeader>

        {/* Contribution from this company */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Contribution from {companyName}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{formatCurrency(candidate.amount)}</span>
              <Badge variant="secondary" className="text-xs">{candidate.donation_type}</Badge>
            </div>
            {candidate.flagged && (
              <div className="flex items-start gap-2 mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{candidate.flag_reason || "This candidate has been flagged for review."}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* District info */}
        {candidate.district && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">Your District Connection</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This politician represents <span className="font-medium text-foreground">{candidate.state} District {candidate.district}</span>. 
                If this is your district, {companyName}'s PAC directly funds your representative.
              </p>
            </CardContent>
          </Card>
        )}

        {/* AI Voting Summary */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Vote className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Voting Record Summary</span>
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            {loadingVotes ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Researching voting record...</span>
              </div>
            ) : votingError ? (
              <div className="text-sm text-muted-foreground">
                <p>{votingError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={fetchVotingSummary}>
                  Retry
                </Button>
              </div>
            ) : votingSummary ? (
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {votingSummary}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* External links */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Research Links</p>
          <div className="grid gap-2">
            <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
              <a href={congressSearchUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                Congress.gov – Bills & Votes
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
              <a href={voteSmartUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                VoteSmart – Key Votes
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
              <a href={openSecretsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                OpenSecrets – Full Funding Profile
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
