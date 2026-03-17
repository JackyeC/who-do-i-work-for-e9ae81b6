import { useState } from "react";
import { FileUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpdateTheRecordButtonProps {
  companyId: string;
  companyName: string;
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

export function UpdateTheRecordButton({ companyId, companyName }: UpdateTheRecordButtonProps) {
  const [open, setOpen] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState("other");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in required", description: "Please sign in to submit record updates.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { error } = await (supabase as any).from("community_record_updates").insert({
        company_id: companyId,
        user_id: user.id,
        evidence_url: evidenceUrl.trim() || null,
        evidence_description: description.trim(),
        source_type: sourceType,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Update submitted", description: "Tagged as Community-Sourced Intelligence (Pending CIO Audit)." });
      setTimeout(() => { setOpen(false); setSubmitted(false); setDescription(""); setEvidenceUrl(""); }, 2000);
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-xs gap-1.5 border-[hsl(var(--civic-gold))]/40 text-[hsl(var(--civic-gold))] hover:bg-[hsl(var(--civic-gold))]/5 bg-[hsl(var(--civic-gold))]/[0.04]"
        onClick={() => setOpen(true)}
      >
        <FileUp className="w-3.5 h-3.5" />
        Claim This Profile
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="w-4 h-4 text-primary" />
              Update the Record for {companyName}
            </DialogTitle>
            <DialogDescription>
              <span className="block p-3 rounded-lg bg-[hsl(var(--civic-gold))]/[0.06] border border-[hsl(var(--civic-gold))]/20 mb-3 text-xs">
                <span className="font-semibold text-foreground block mb-1">Are you this employer?</span>
                Claim your <a href="/for-employers" className="text-[hsl(var(--civic-gold))] font-semibold underline">Narrative Alignment Package ($599/yr)</a> to provide full context, earn your Gold Shield, and control your narrative.
              </span>
              If you have a more recent filing, article, or public record, submit it below. All community submissions are tagged as{" "}
              <span className="font-semibold text-foreground">Community-Sourced Intelligence (Pending CIO Audit)</span>.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle2 className="w-10 h-10 text-[hsl(var(--civic-green))]" />
              <p className="text-sm font-medium text-foreground">Submitted for Review</p>
              <Badge variant="outline" className="text-[10px]">Community-Sourced Intelligence (Pending CIO Audit)</Badge>
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
                  placeholder="Describe what data is outdated or incorrect, and what the correct information is..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Submissions are reviewed by our intelligence team before updating the record.
                  Only publicly verifiable information will be incorporated.
                </p>
              </div>
            </div>
          )}

          {!submitted && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting || !description.trim()}>
                {submitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Submitting…</> : "Submit Update"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
