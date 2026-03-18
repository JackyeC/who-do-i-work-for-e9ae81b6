import { useState } from "react";
import { MessageSquareWarning, ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface EmployerRebuttalSectionProps {
  companyId: string;
  companyName: string;
}

export function EmployerRebuttalSection({ companyId, companyName }: EmployerRebuttalSectionProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [rebuttalText, setRebuttalText] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const { data: rebuttals } = useQuery({
    queryKey: ["employer-rebuttals", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("employer_rebuttals")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const handleSubmit = async () => {
    if (!rebuttalText.trim() || !evidenceUrl.trim() || !email.trim()) return;
    if (rebuttalText.trim().split(/\s+/).length > 200) {
      toast({ title: "Too long", description: "Employer rebuttals are limited to 200 words.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("employer_rebuttals").insert({
        company_id: companyId,
        submitted_by_email: email.trim(),
        rebuttal_text: rebuttalText.trim(),
        evidence_url: evidenceUrl.trim(),
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Rebuttal submitted", description: "Your response is pending review by our intelligence team." });
      setTimeout(() => { setOpen(false); setSubmitted(false); setRebuttalText(""); setEvidenceUrl(""); setEmail(""); }, 2000);
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = rebuttalText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-primary" />
              Employer Rebuttal
            </div>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setOpen(true)}>
              Submit Response
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rebuttals && rebuttals.length > 0 ? (
            <div className="space-y-3">
              {rebuttals.map((r: any) => (
                <div key={r.id} className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs gap-1 bg-primary/5 text-primary border-primary/20">
                      <MessageSquareWarning className="w-2.5 h-2.5" />
                      Employer Response
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{r.rebuttal_text}</p>
                  {r.evidence_url && (
                    <a href={r.evidence_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-0.5 mt-2">
                      Supporting Record <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">
                No employer response on file. Companies can submit a free 200-word rebuttal with a link to a public record.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-primary" />
              Employer Rebuttal — {companyName}
            </DialogTitle>
            <DialogDescription>
              If you represent {companyName} and believe any data is incorrect, you may submit a free 200-word response 
              with a link to a supporting public record.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle2 className="w-10 h-10 text-[hsl(var(--civic-green))]" />
              <p className="text-sm font-medium text-foreground">Rebuttal Submitted</p>
              <p className="text-xs text-muted-foreground">Pending review by our intelligence team.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Corporate Email</label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">
                  Your Response ({wordCount}/200 words)
                </label>
                <Textarea
                  placeholder="Provide your perspective on the data shown in this report..."
                  value={rebuttalText}
                  onChange={(e) => setRebuttalText(e.target.value)}
                  rows={5}
                  className={wordCount > 200 ? "border-destructive" : ""}
                />
                {wordCount > 200 && (
                  <p className="text-xs text-destructive mt-1">Exceeds 200-word limit.</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Link to Public Record (required)</label>
                <Input
                  placeholder="https://..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Rebuttals are reviewed before publication. Only responses backed by a verifiable public record will be displayed.
                  Responses may not alter independent research findings.
                </p>
              </div>
            </div>
          )}

          {!submitted && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting || !rebuttalText.trim() || !evidenceUrl.trim() || !email.trim() || wordCount > 200}>
                {submitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Submitting…</> : "Submit Rebuttal"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
