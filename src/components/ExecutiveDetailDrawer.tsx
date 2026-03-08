import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/LoadingState";

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
  const { data: recipients, isLoading } = useQuery({
    queryKey: ["executive-recipients", executive?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("executive_recipients")
        .select("*")
        .eq("executive_id", executive!.id)
        .order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!executive?.id && open,
  });

  if (!executive) return null;

  const fecDonorUrl = `https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodeURIComponent(executive.name)}&contributor_employer=${encodeURIComponent(companyName)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
            {executive.name}
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

        {/* Recipients */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground mb-3">Recipients (Itemized)</p>
          {isLoading ? (
            <LoadingState message="Loading recipients..." />
          ) : recipients && recipients.length > 0 ? (
            <div className="space-y-2">
              {recipients.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onCandidateClick?.({
                    id: r.id,
                    name: r.name,
                    party: r.party,
                    state: "",
                    amount: r.amount,
                    donation_type: "Individual",
                    flagged: false,
                  })}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-medium text-sm text-foreground">{r.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-2 text-xs",
                          r.party === "Republican" && "border-destructive/50 text-destructive",
                          r.party === "Democrat" && "border-primary/50 text-primary"
                        )}
                      >
                        {r.party}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{formatCurrency(r.amount)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No itemized recipient data available. Check FEC individual contribution records for full details.
            </p>
          )}
        </div>

        {/* External links */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Research Links</p>
          <Button variant="outline" size="sm" className="justify-start gap-2 w-full" asChild>
            <a href={fecDonorUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
              FEC – Individual Contributions
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
