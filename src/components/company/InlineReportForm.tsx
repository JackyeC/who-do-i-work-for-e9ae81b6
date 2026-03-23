import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface InlineReportFormProps {
  personName: string;
  companyName: string;
  onClose: () => void;
  onDepartureReported?: () => void;
}

const ISSUE_OPTIONS = [
  { value: "departed", label: "This person no longer works here" },
  { value: "title_wrong", label: "Their title is incorrect" },
  { value: "duplicate", label: "This is a duplicate entry" },
  { value: "other", label: "Other" },
];

export function InlineReportForm({ personName, companyName, onClose, onDepartureReported }: InlineReportFormProps) {
  const [issueType, setIssueType] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!issueType) return;
    setSubmitting(true);

    const description = `${ISSUE_OPTIONS.find(o => o.value === issueType)?.label || issueType}: ${personName} at ${companyName}`;

    const { error } = await supabase.from("correction_requests").insert({
      company_name: companyName,
      contact_name: "Anonymous Reporter",
      contact_email: "anonymous@wdiwf.report",
      issue_type: issueType === "departed" ? "outdated" : "data_error",
      description,
      source_links: sourceLink ? [sourceLink] : [],
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" });
      return;
    }

    setSubmitted(true);

    if (issueType === "departed" && onDepartureReported) {
      onDepartureReported();
    }
  };

  if (submitted) {
    return (
      <div className="bg-muted/50 rounded-lg p-3 mt-1 mb-2 text-xs text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Thanks — we'll review within 7 business days.
        <button onClick={onClose} className="ml-2 underline hover:text-primary">Dismiss</button>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 border border-border/50 rounded-lg p-3 mt-1 mb-2 space-y-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">
          Report incorrect data for {personName}
        </p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">What's wrong?</p>
        {ISSUE_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="radio"
              name="issue_type"
              value={opt.value}
              checked={issueType === opt.value}
              onChange={() => setIssueType(opt.value)}
              className="accent-primary w-3 h-3"
            />
            {opt.label}
          </label>
        ))}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">Source or link to verify (optional)</p>
        <Textarea
          value={sourceLink}
          onChange={(e) => setSourceLink(e.target.value)}
          placeholder="https://..."
          rows={1}
          className="text-xs min-h-[32px] resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={!issueType || submitting} className="text-xs h-7 px-3">
          {submitting ? "Submitting..." : "Submit report"}
        </Button>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
}
