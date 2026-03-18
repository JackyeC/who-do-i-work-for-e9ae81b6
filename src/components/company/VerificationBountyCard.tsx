import { useState } from "react";
import { AlertTriangle, Gift, FileUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VerificationBountyCardProps {
  companyId: string;
  companyName: string;
  lastAuditedAt?: string | null;
}

const SOURCE_TYPES = [
  { value: "fec_filing", label: "FEC Filing" },
  { value: "news_article", label: "News Article" },
  { value: "policy_document", label: "Policy Document" },
  { value: "sec_filing", label: "SEC Filing" },
  { value: "court_record", label: "Court Record" },
  { value: "government_report", label: "Government Report" },
  { value: "other", label: "Other Public Record" },
];

export function VerificationBountyCard({ companyId, companyName, lastAuditedAt }: VerificationBountyCardProps) {
  const [open, setOpen] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState("other");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Only show if last_audited_at is null or > 6 months old
  const isStale = !lastAuditedAt || (Date.now() - new Date(lastAuditedAt).getTime()) > 180 * 24 * 60 * 60 * 1000;
  if (!isStale) return null;

  const daysSince = lastAuditedAt
    ? Math.floor((Date.now() - new Date(lastAuditedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in required", description: "Please sign in to submit updates.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { error } = await (supabase as any).from("community_record_updates").insert({
        company_id: companyId,
        user_id: user.id,
        evidence_url: evidenceUrl.trim() || null,
        evidence_description: description.trim(),
        source_type: sourceType,
        update_type: "verification_bounty",
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Update submitted!", description: "You'll receive a $5 credit once verified by our intelligence team." });
      setTimeout(() => { setOpen(false); setSubmitted(false); setDescription(""); setEvidenceUrl(""); }, 2500);
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-[hsl(var(--civic-red))]/20 bg-[hsl(var(--civic-red))]/[0.03] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(var(--civic-red))] via-[hsl(var(--civic-red))]/50 to-transparent" />
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--civic-red))]/15 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4.5 h-4.5 text-[hsl(var(--civic-red))]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-sm font-bold text-foreground">Archive Signal</h3>
                <Badge variant="outline" className="text-xs font-mono tracking-wider border-[hsl(var(--civic-red))]/20 text-[hsl(var(--civic-red))]">
                  {daysSince ? `${daysSince} DAYS STALE` : "NO AUDIT DATE"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                This intelligence on <span className="text-foreground font-medium">{companyName}</span> hasn't been verified recently.
                Public filings move fast — help us keep the record current and earn credit toward premium features.
              </p>
              <Button
                size="sm"
                onClick={() => setOpen(true)}
                className="bg-[hsl(var(--civic-red))] hover:bg-[hsl(var(--civic-red))]/90 text-primary-foreground gap-1.5 font-semibold text-xs"
              >
                <Gift className="w-3.5 h-3.5" />
                Update This Receipt for a $5 Credit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[hsl(var(--civic-green))]" />
              Verification Bounty — {companyName}
            </DialogTitle>
            <DialogDescription>
              Submit a more recent filing, article, or public record. Verified submissions earn a <span className="font-semibold text-foreground">$5 platform credit</span>.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle2 className="w-10 h-10 text-[hsl(var(--civic-green))]" />
              <p className="text-sm font-medium text-foreground">Submitted for Review</p>
              <Badge variant="outline" className="text-xs">$5 Credit Pending Verification</Badge>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Source Type</label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Evidence URL (optional)</label>
                <Input
                  placeholder="https://www.fec.gov/data/..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">What needs updating?</label>
                <Textarea
                  placeholder="Describe what data is outdated and what the correct information is..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Submissions are reviewed by our intelligence team. Only publicly verifiable information will be incorporated.
                  Credits are issued after admin approval.
                </p>
              </div>
            </div>
          )}

          {!submitted && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting || !description.trim()}>
                {submitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Submitting…</> : "Submit for $5 Credit"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
