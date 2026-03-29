import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, Send, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIP_CATEGORIES = [
  { id: "wage_theft", label: "Wage Theft / Unpaid Work" },
  { id: "discrimination", label: "Discrimination / Bias" },
  { id: "retaliation", label: "Retaliation / Whistleblower" },
  { id: "safety", label: "Workplace Safety" },
  { id: "dei_fraud", label: "DEI Performatism / Broken Promises" },
  { id: "layoffs", label: "Mass Layoffs / WARN Violations" },
  { id: "misclassification", label: "Employee Misclassification" },
  { id: "dark_money", label: "Dark Money / Political Spending" },
  { id: "nepotism", label: "Nepotism / Cronyism" },
  { id: "other", label: "Other" },
];

export default function SubmitTip() {
  const [companyName, setCompanyName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [evidenceLinks, setEvidenceLinks] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  usePageSEO({
    title: "Submit a Tip — Who Do I Work For?",
    description:
      "Anonymously report employer misconduct. Wage theft, discrimination, retaliation, broken DEI promises — we investigate. Your identity stays protected.",
    path: "/submit-tip",
  });

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error("Please enter a company name.");
      return;
    }
    if (categories.length === 0) {
      toast.error("Please select at least one category.");
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      toast.error("Please provide a description (at least 20 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("tips").insert({
        company_name: companyName.trim(),
        categories,
        description: description.trim(),
        evidence_links: evidenceLinks.trim() || null,
        contact_email: contactEmail.trim() || null,
        is_public: isPublic,
        status: "new",
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Tip submitted. We'll review it.");
    } catch (err: any) {
      toast.error(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex-1">
        <section className="px-6 lg:px-16 py-20 text-center max-w-[640px] mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Tip Received</h1>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Your submission has been received and will be reviewed by our team. If you left contact
            information, we may reach out for clarification. Otherwise, your identity is fully protected.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Tips that meet our sourcing standards may become part of a published Receipts investigation.
          </p>
          <Button onClick={() => (window.location.href = "/receipts")} variant="outline">
            Browse The Receipts
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="px-6 lg:px-16 pt-16 pb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-mono text-xs tracking-[0.15em] uppercase text-primary font-semibold">
            Anonymous & Protected
          </span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-3">
          Submit a Tip
        </h1>
        <p className="text-muted-foreground max-w-[520px] mx-auto text-base leading-relaxed">
          Know something the public should see? Report employer misconduct anonymously.
          We verify, source, and publish — your identity stays protected.
        </p>
      </section>

      {/* Trust banner */}
      <section className="px-6 lg:px-16 pb-10">
        <div className="max-w-[640px] mx-auto">
          <div className="flex items-start gap-3 bg-card border border-primary/20 rounded-lg p-4">
            <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              We never publish tips without independent verification from public records.
              Your contact info (if provided) is encrypted and only used for follow-up — never shared, sold, or published.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 lg:px-16 pb-20">
        <form onSubmit={handleSubmit} className="max-w-[640px] mx-auto space-y-8">
          {/* Company name */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium text-foreground">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company"
              placeholder="e.g. Meta, Amazon, Deloitte"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="bg-card"
            />
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              What type of issue? <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">Select all that apply.</p>
            <div className="flex flex-wrap gap-2">
              {TIP_CATEGORIES.map((cat) => {
                const selected = categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              What happened? <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Be as specific as you can — dates, departments, roles involved. We'll verify independently.
            </p>
            <Textarea
              id="description"
              placeholder="Describe what you witnessed or experienced..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="bg-card resize-y"
            />
          </div>

          {/* Evidence links */}
          <div className="space-y-2">
            <Label htmlFor="evidence" className="text-sm font-medium text-foreground">
              Supporting Links or Documents
            </Label>
            <p className="text-xs text-muted-foreground">
              Optional. Links to news articles, court filings, EEOC complaints, WARN notices, social media posts, etc.
            </p>
            <Textarea
              id="evidence"
              placeholder="https://..."
              value={evidenceLinks}
              onChange={(e) => setEvidenceLinks(e.target.value)}
              rows={3}
              className="bg-card resize-y"
            />
          </div>

          {/* Contact email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Contact Email (optional)
            </Label>
            <p className="text-xs text-muted-foreground">
              Only if you'd like us to follow up. Encrypted — never published.
            </p>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="bg-card"
            />
          </div>

          {/* Public/private toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Publication Preference</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg border text-sm text-left transition-colors",
                  isPublic
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                )}
              >
                <span className="font-medium block mb-0.5">Publish if verified</span>
                <span className="text-xs opacity-75">
                  My tip can become part of a published Receipts investigation.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg border text-sm text-left transition-colors",
                  !isPublic
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                )}
              >
                <span className="font-medium block mb-0.5">Internal only</span>
                <span className="text-xs opacity-75">
                  Use this to improve company scores, but don't publish my tip.
                </span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2"
              size="lg"
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Tip
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              By submitting, you confirm this is a good-faith report based on your knowledge or experience.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
