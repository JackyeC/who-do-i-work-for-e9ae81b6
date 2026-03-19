import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const correctionSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(200),
  company_profile_url: z.string().max(500).optional().or(z.literal("")),
  contact_name: z.string().trim().min(1, "Your name is required").max(100),
  contact_email: z.string().trim().email("Valid email is required").max(255),
  issue_type: z.string().min(1, "Please select an issue type"),
  description: z.string().trim().min(10, "Please provide at least 10 characters").max(5000),
  source_links: z.string().max(2000).optional().or(z.literal("")),
});

const issueTypes = [
  { value: "data_error", label: "Incorrect Data" },
  { value: "missing_data", label: "Missing Information" },
  { value: "outdated", label: "Outdated Information" },
  { value: "attribution", label: "Incorrect Source Attribution" },
  { value: "context", label: "Missing Context" },
  { value: "other", label: "Other" },
];

export default function RequestCorrection() {
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const prefilledCompany = searchParams.get("company") || "";
  const prefilledPerson = searchParams.get("person") || "";

  const [form, setForm] = useState({
    company_name: prefilledCompany,
    company_profile_url: "",
    contact_name: "",
    contact_email: "",
    issue_type: prefilledPerson ? "data_error" : "",
    description: prefilledPerson
      ? `Incorrect executive data: ${prefilledPerson} at ${prefilledCompany}`
      : "",
    source_links: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = correctionSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const sourceLinksArray = form.source_links
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase.from("correction_requests").insert({
      company_name: form.company_name.trim(),
      company_profile_url: form.company_profile_url.trim() || null,
      contact_name: form.contact_name.trim(),
      contact_email: form.contact_email.trim(),
      issue_type: form.issue_type,
      description: form.description.trim(),
      source_links: sourceLinksArray,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Submission failed", description: "Please try again later.", variant: "destructive" });
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Correction Submitted</CardTitle>
              <CardDescription>
                Thank you. We review all submissions and aim to respond within 5 business days. Verified corrections are applied promptly.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2 font-display">
          Request a Correction
        </h1>
        <p className="text-muted-foreground mb-8">
          Who Do I Work For? uses publicly available data to compile company transparency profiles. If you believe any information is inaccurate, outdated, or missing important context, please submit a correction request below.
        </p>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6 flex gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Our Correction Process</p>
              <p>All submissions are reviewed by our research team. We verify corrections against primary sources before updating profiles. You'll receive an email confirmation when your request has been reviewed.</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
                placeholder="e.g. Acme Corp"
              />
              {errors.company_name && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.company_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_profile_url">Profile URL (optional)</Label>
              <Input
                id="company_profile_url"
                value={form.company_profile_url}
                onChange={(e) => handleChange("company_profile_url", e.target.value)}
                placeholder="https://civic-align.lovable.app/company/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Your Name *</Label>
              <Input
                id="contact_name"
                value={form.contact_name}
                onChange={(e) => handleChange("contact_name", e.target.value)}
              />
              {errors.contact_name && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.contact_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Your Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={form.contact_email}
                onChange={(e) => handleChange("contact_email", e.target.value)}
              />
              {errors.contact_email && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.contact_email}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue_type">Issue Type *</Label>
            <Select value={form.issue_type} onValueChange={(v) => handleChange("issue_type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.issue_type && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.issue_type}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description of Correction *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe what information needs to be corrected and what the accurate information is..."
              rows={5}
            />
            {errors.description && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_links">Supporting Source Links (optional, one per line)</Label>
            <Textarea
              id="source_links"
              value={form.source_links}
              onChange={(e) => handleChange("source_links", e.target.value)}
              placeholder={"https://fec.gov/data/...\nhttps://usaspending.gov/..."}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Submitting..." : "Submit Correction Request"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
